-- ============================================================================
-- The Mirror Platform — 0005 the engine at write-time (P3)
-- The SQL twin of engine.ts: structural load (transitive dependents), computed
-- depth tiers by load percentile, and the commit path that recomputes geometry,
-- caches load/depth on the affected nodes, and emits the why-ledger — atomically,
-- inside one transaction, on top of the 0002 invariant triggers (the firewall).
--
-- Caches are derived, never truth (§0, §4.3): recompute_geometry() rebuilds them
-- from the edges every commit, so they cannot drift.
-- ============================================================================

-- ── recompute_geometry: structuralLoad + assignDepth over the whole graph ───
-- Edge weight = load, not frequency (§16). Load(X) = transitive dependents of X
-- over rests_on. Depth tier by load percentile: metric <5%, load-bearing <20%,
-- province <50%, else shallow — ranked by transitive load descending.
create or replace function recompute_geometry() returns void
language plpgsql as $$
begin
  -- transitive closure of rests_on: (anc, desc) where desc depends on anc.
  with recursive tc(anc, descendant) as (
    select target, source from edge where type = 'rests_on'
    union
    select tc.anc, e.source
      from edge e join tc on e.target = tc.descendant and e.type = 'rests_on'
  ),
  load as (
    select n.node_id,
           (select count(*) from edge e where e.target = n.node_id and e.type = 'rests_on') as direct,
           coalesce((select count(distinct t.descendant) from tc t where t.anc = n.node_id), 0) as trans
    from node n
  )
  update node n
     set cached_load_direct = l.direct,
         cached_load_trans  = l.trans
    from load l
   where l.node_id = n.node_id
     and (n.cached_load_direct, n.cached_load_trans) is distinct from (l.direct, l.trans);

  -- depth tiers by percentile of transitive load (computed, never assigned).
  with ranked as (
    select node_id,
           (row_number() over (order by cached_load_trans desc, node_id) - 1)::numeric
             / greatest(count(*) over (), 1) as frac
    from node
  )
  update node n
     set cached_depth = case
           when r.frac < 0.05 then 'metric'::depth_tier
           when r.frac < 0.20 then 'load-bearing'::depth_tier
           when r.frac < 0.50 then 'province'::depth_tier
           else 'shallow'::depth_tier end
    from ranked r
   where r.node_id = n.node_id;
end $$;

-- ── geometry_report: the read-side checks (openColumn never-empty, sealCheck) ─
create or replace function geometry_report() returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'open_column', (
      select count(*) from node
       where kind <> 'leaf/borrow'
         and (stage <> 'verdict_in'
              or verdict in ('OPEN','HELD','GAP','UNTESTED','NAMED','QUALIFIED','PARTIAL'))
    ),
    'seal_risks', (
      select coalesce(jsonb_agg(node_id), '[]'::jsonb) from node
       where kind <> 'leaf/borrow'
         and verdict in ('HOLDS','HELD','STANDS','RESPECTED')
         and refuter is null
    )
  );
$$;

-- ── commit_node: the architect write path (the engine running at write time) ─
-- Upserts a node + its rests_on/pulls_to edges (triggers enforce the firewall and
-- the builder guard), recomputes geometry, writes the why-ledger diff, and
-- appends the captured event. Returns the why-ledger. Service-role only.
create or replace function commit_node(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_node_id text := payload->>'node_id';
  v_before  jsonb;
  v_after   jsonb;
  v_ledger  jsonb;
  e text;
begin
  if v_node_id is null then
    raise exception 'commit_node: node_id required';
  end if;

  -- snapshot load/depth before, for the why-ledger diff
  select coalesce(jsonb_object_agg(node_id, jsonb_build_object('t', cached_load_trans, 'd', cached_depth)), '{}'::jsonb)
    into v_before from node;

  -- upsert the node (single source of truth, §4.1)
  insert into node (node_id, label, kind, content_home, content_reaches, substrate,
                    register, stage, verdict, verdict_source, refuter,
                    author_handle, engagement, presence, conduct_status, flags)
  values (
    v_node_id,
    coalesce(payload->>'label', v_node_id),
    coalesce((payload->>'kind')::kind, 'attempt'),
    coalesce(payload->>'content_home', 'philosophy'),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'content_reaches')), '{}'),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'substrate')), '{}'),
    coalesce((payload->>'register')::register, 'live'),
    coalesce((payload->>'stage')::stage, 'captured'),
    payload->>'verdict',
    (payload->>'verdict_source')::verdict_source,
    payload->>'refuter',
    coalesce(payload->>'author_handle', 'a-reflection'),
    (payload->>'engagement')::engagement,
    (payload->>'presence')::presence,
    coalesce((payload->>'conduct_status')::conduct_status, 'live'),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'flags')), '{}')
  )
  on conflict (node_id) do update set
    label = excluded.label, kind = excluded.kind, content_home = excluded.content_home,
    content_reaches = excluded.content_reaches, substrate = excluded.substrate,
    register = excluded.register, stage = excluded.stage, verdict = excluded.verdict,
    verdict_source = excluded.verdict_source, refuter = excluded.refuter,
    engagement = excluded.engagement, presence = excluded.presence,
    conduct_status = excluded.conduct_status, flags = excluded.flags;

  -- replace this node's outgoing edges (firewall trigger validates each insert)
  delete from edge where source = v_node_id;
  for e in select value from jsonb_array_elements_text(coalesce(payload->'rests_on','[]'::jsonb)) loop
    insert into edge (source, target, type) values (v_node_id, e, 'rests_on');
  end loop;
  for e in select value from jsonb_array_elements_text(coalesce(payload->'pulls_to','[]'::jsonb)) loop
    insert into edge (source, target, type) values (v_node_id, e, 'pulls_to');
  end loop;

  -- recompute the whole geometry (load + depth) from the edges
  perform recompute_geometry();

  -- snapshot after + build the why-ledger diff (§8: the recomputation as proof)
  select coalesce(jsonb_object_agg(node_id, jsonb_build_object('t', cached_load_trans, 'd', cached_depth)), '{}'::jsonb)
    into v_after from node;

  v_ledger := jsonb_build_object(
    'captured', v_node_id,
    'firewall', 'acyclic',                  -- a cycle would have raised before here
    'load_changes', (
      select coalesce(jsonb_object_agg(k, jsonb_build_object(
                'from', v_before->k->'t', 'to', v_after->k->'t')), '{}'::jsonb)
      from jsonb_object_keys(v_after) k
      where (v_before->k->'t') is distinct from (v_after->k->'t')
    ),
    'depth_crossings', (
      select coalesce(jsonb_object_agg(k, jsonb_build_object(
                'from', v_before->k->'d', 'to', v_after->k->'d')), '{}'::jsonb)
      from jsonb_object_keys(v_after) k
      where (v_before->k->'d') is distinct from (v_after->k->'d')
    ),
    'geometry', geometry_report()
  );

  insert into commit_ledger (node_id, summary, diff)
    values (v_node_id, 'commit '||v_node_id, v_ledger);
  insert into event (kind, node_id, payload)
    values ('captured', v_node_id, jsonb_build_object('via','commit_node'));

  return v_ledger;
end $$;

revoke all on function commit_node(jsonb), recompute_geometry() from public, anon, authenticated;
