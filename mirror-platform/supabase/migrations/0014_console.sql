-- ============================================================================
-- The Mirror Platform — 0014 console write-surface (P10 extension)
-- The architect console grows from "capture structure + body" into a one-stop
-- authoring surface: membranes (the descend walk), the lexicon (term glosses +
-- the requires-DAG), and atlas edits. Each RPC enforces is_architect() and rides
-- on the existing invariant triggers (the term firewall, no-delete on content).
-- Plus: architect-only READ policies on thread/construction so the console can
-- see unpublished drafts (the public still sees only published, §6).
-- ============================================================================

-- ── architect sees every thread/construction (incl. unpublished drafts) ─────
-- RLS policies are OR'd, so this only ADDS visibility for the architect; the
-- public/tier gates (0003) are untouched.
drop policy if exists thread_read_architect on thread;
create policy thread_read_architect on thread for select to authenticated
  using (is_architect());
drop policy if exists construction_read_architect on construction;
create policy construction_read_architect on construction for select to authenticated
  using (is_architect());

-- ── membranes: the descend-walk links (thread -> construction) ──────────────
-- Structure, not content (0002 leaves membrane editable), so add/delete is fine.
create or replace function architect_add_membrane(
  p_thread text, p_construction text, p_teaser text, p_position int default 0) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  insert into membrane (thread_id, construction_id, teaser, position)
    values (p_thread, p_construction, p_teaser, coalesce(p_position, 0)) returning id into v_id;
  return v_id;
end $$;

create or replace function architect_delete_membrane(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  delete from membrane where id = p_id;
end $$;

-- ── atlas: delete a row (insert already exists: architect_add_map_entry, 0010)
create or replace function architect_delete_map_entry(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  delete from map_entry where id = p_id;
end $$;

-- ── the lexicon: upsert a §A term record (authoring the gloss, §G.4) ────────
-- The architect explicitly authors here, so this overwrites the term's fields
-- (unlike the bulk seed, which coalesce-preserves). The §B firewall still guards
-- the requires-DAG on the edge functions below.
create or replace function architect_commit_term(payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  if coalesce(payload->>'term','') = '' then raise exception 'term (the lemma) is required'; end if;
  insert into term (term, surface_forms, register, our_meaning, defines_node, reader_assumptions,
                    collision, disposition, plain, first_gloss, tier0, arrival_early,
                    gloss_verdict, gloss_refuter, notes)
  values (
    payload->>'term',
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'surface_forms')), '{}'),
    coalesce(payload->>'register', 'transmission'),
    payload->>'our_meaning',
    nullif(payload->>'defines_node',''),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'reader_assumptions')), '{}'),
    coalesce((payload->>'collision')::collision, 'none'),
    coalesce((payload->>'disposition')::disposition, 'teach'),
    nullif(payload->>'plain',''),
    nullif(payload->>'first_gloss',''),
    coalesce((payload->>'tier0')::boolean, false),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'arrival_early')), '{}'),
    coalesce((payload->>'gloss_verdict')::gloss_verdict, 'untested'),
    nullif(payload->>'gloss_refuter',''),
    nullif(payload->>'notes','')
  )
  on conflict (term) do update set
    surface_forms = excluded.surface_forms, register = excluded.register, our_meaning = excluded.our_meaning,
    defines_node = excluded.defines_node, reader_assumptions = excluded.reader_assumptions,
    collision = excluded.collision, disposition = excluded.disposition, plain = excluded.plain,
    first_gloss = excluded.first_gloss, tier0 = excluded.tier0, arrival_early = excluded.arrival_early,
    gloss_verdict = excluded.gloss_verdict, gloss_refuter = excluded.gloss_refuter, notes = excluded.notes;
end $$;

-- ── the §B requires-DAG: add / remove an edge (firewall trigger validates) ──
create or replace function architect_set_term_edge(p_from text, p_to text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  insert into term_edge (from_term, to_term, kind) values (p_from, p_to, 'requires')
    on conflict (from_term, to_term, kind) do nothing;
end $$;

create or replace function architect_delete_term_edge(p_from text, p_to text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  delete from term_edge where from_term = p_from and to_term = p_to and kind = 'requires';
end $$;

grant execute on function
  architect_add_membrane(text,text,text,int), architect_delete_membrane(uuid),
  architect_delete_map_entry(uuid), architect_commit_term(jsonb),
  architect_set_term_edge(text,text), architect_delete_term_edge(text,text)
  to authenticated;
