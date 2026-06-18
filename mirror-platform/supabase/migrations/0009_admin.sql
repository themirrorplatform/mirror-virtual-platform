-- ============================================================================
-- The Mirror Platform — 0009 admin & governance (P10 · P11)
-- The architect console and the builder slot, as role-checked RPCs on top of the
-- already-live engine (commit_node) and invariant triggers (firewall, builder
-- guard, no-delete, append-only). Each RPC enforces the caller's register
-- internally (is_architect / builder tier), so they are safe to grant to
-- authenticated — the deny-by-default discipline reaches the write surface too.
-- ============================================================================

-- the architect sees ALL nodes (incl. withdrawn-for-conduct residue, builder
-- unread) — the others see only live (0003 node_read). The conduct log needs this.
create policy node_read_architect on node for select to authenticated
  using (is_architect());

-- ── P10: the architect write path ──────────────────────────────────────────

-- structure commit: the 8-field capture -> commit_node (engine + why-ledger).
-- Structure and prose are SEPARATE commits joined by node_id (§8).
create or replace function architect_commit(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  return commit_node(payload);
end $$;

-- prose commit: the body + presentation row (thread or construction).
create or replace function architect_commit_body(
  p_node_id text, p_kind text, p_slug text, p_title text, p_body jsonb,
  p_min_tier text default 'continuations', p_arrived_from text default null,
  p_featured boolean default false, p_published boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  if p_kind = 'construction' then
    insert into construction (node_id, slug, title, body, min_tier, published)
      values (p_node_id, p_slug, p_title, p_body, p_min_tier::tier, p_published)
      on conflict (node_id) do update set
        slug = excluded.slug, title = excluded.title, body = excluded.body,
        min_tier = excluded.min_tier, published = excluded.published;
  else
    insert into thread (node_id, slug, title, body, arrived_from, featured, published)
      values (p_node_id, p_slug, p_title, p_body, p_arrived_from, p_featured, p_published)
      on conflict (node_id) do update set
        slug = excluded.slug, title = excluded.title, body = excluded.body,
        arrived_from = excluded.arrived_from, featured = excluded.featured, published = excluded.published;
  end if;
end $$;

-- conduct withdrawal (Conduct §3): suppress + log the conduct reason; NEVER
-- delete, NEVER for content. Orthogonal to the engagement ladder.
create or replace function architect_withdraw(p_node_id text, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'a conduct reason is required'; end if;
  update node set conduct_status = 'withdrawn-for-conduct' where node_id = p_node_id;
  insert into removal (target_kind, target_id, conduct_reason) values ('node', p_node_id, p_reason);
end $$;

-- engagement flag upgrade (a signal, not a gate): unread -> read -> integrated
-- -> openly_discussed. Changes framing/prominence, never existence (Conduct §1).
create or replace function architect_set_engagement(p_node_id text, p_engagement engagement) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  update node set engagement = p_engagement where node_id = p_node_id;
end $$;

-- departure + the architect's determination (residue, §36): keeps the node.
create or replace function architect_set_presence(p_node_id text, p_presence presence, p_determination text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  update node set presence = p_presence, determination = coalesce(p_determination, determination) where node_id = p_node_id;
end $$;

grant execute on function architect_commit(jsonb), architect_commit_body(text,text,text,text,jsonb,text,text,boolean,boolean),
  architect_withdraw(text,text), architect_set_engagement(text,engagement), architect_set_presence(text,presence,text)
  to authenticated;

-- ── P11: the builder write surface — create · attach upward · own only ───────
-- A builder's contribution is an encounter, not an edit (§9). It creates a NEW
-- node resting on a frontier, attributed to the builder's handle, engagement
-- 'unread' (flag-rides-along publication), append-only — it can never target an
-- existing node (no canon edit). The firewall + builder-guard triggers enforce
-- acyclicity and "canon never rests on builder".
create or replace function builder_upload(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_node_id text := payload->>'node_id'; v_handle text := current_handle(); e text;
begin
  if not (is_architect() or tier_rank(current_tier()) >= tier_rank('builder')) then
    raise exception 'builder tier required' using errcode = '42501';
  end if;
  if v_handle is null then raise exception 'no handle for caller'; end if;
  if v_node_id is null then raise exception 'node_id required'; end if;
  if exists (select 1 from node where node_id = v_node_id) then
    raise exception 'append-only: a builder upload cannot target an existing node (§9)';
  end if;
  if not exists (select 1 from jsonb_array_elements_text(coalesce(payload->'rests_on','[]'::jsonb))) then
    raise exception 'a contribution must rest on a frontier (attach upward, §9)';
  end if;

  insert into node (node_id, label, kind, content_home, substrate, register, stage,
                    author_handle, engagement, presence, conduct_status, flags)
  values (v_node_id, coalesce(payload->>'label', v_node_id), 'attempt',
          coalesce(payload->>'content_home','philosophy'),
          coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'substrate')), '{}'),
          'live', 'captured', v_handle, 'unread', 'active', 'live',
          array['builder-contribution']);

  for e in select value from jsonb_array_elements_text(coalesce(payload->'rests_on','[]'::jsonb)) loop
    insert into edge (source, target, type) values (v_node_id, e, 'rests_on');
  end loop;
  for e in select value from jsonb_array_elements_text(coalesce(payload->'pulls_to','[]'::jsonb)) loop
    insert into edge (source, target, type) values (v_node_id, e, 'pulls_to');
  end loop;

  perform recompute_geometry();
  insert into event (kind, node_id, actor, payload)
    values ('builder_upload', v_node_id, auth.uid(), jsonb_build_object('handle', v_handle));
  return jsonb_build_object('node_id', v_node_id, 'engagement', 'unread', 'attributed_to', v_handle);
end $$;

-- a builder leaves; their nodes stay as residue, flagged departed (§9, §36).
create or replace function builder_depart() returns void
language plpgsql security definer set search_path = public as $$
begin
  if current_handle() is null then raise exception 'no handle'; end if;
  update node set presence = 'departed' where author_handle = current_handle();
end $$;

grant execute on function builder_upload(jsonb), builder_depart() to authenticated;
