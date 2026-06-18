-- ============================================================================
-- The Mirror Platform — 0007 telemetry read-side (P14)
-- The event log itself is already live (0001 event + 0003 RLS: anon/auth append
-- their own, read only their own; 0002 append-only). This adds the ARCHITECT-ONLY
-- aggregate read (§2 metrics) — returning aggregates only, never raw per-actor
-- rows (§4). The razor (§0) is upstream in the client: only the frozen §1 kinds
-- can ever be written, so retention can't be measured.
-- ============================================================================

create or replace function is_architect() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select h.is_architect from app_user u join handle h on u.handle = h.handle
      where u.id = auth.uid()), false);
$$;
grant execute on function is_architect() to authenticated;

-- The §2 dashboard, as anonymized aggregates. SECURITY DEFINER so it can read
-- across the log; guarded to the architect when a user is present (the edge
-- function / service-role path passes no auth.uid and is allowed). It returns
-- counts and distributions — never an actor, never a raw row (§4).
create or replace function event_metrics() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m jsonb;
begin
  if auth.uid() is not null and not is_architect() then
    raise exception 'telemetry is architect-only (§4)';
  end if;

  select jsonb_build_object(
    'total_events', (select count(*) from event),

    -- arrival-cohort: how many arrived from each surface (validates arrival-adaptive)
    'arrivals_by_cohort', (
      select coalesce(jsonb_object_agg(a, c), '{}'::jsonb) from (
        select coalesce(payload->>'arrival','unknown') a, count(*) c
        from event where kind = 'arrival' group by 1) s),

    -- drop-off: average depth reached per continuation (where reading stops)
    'avg_read_depth_by_node', (
      select coalesce(jsonb_object_agg(node_id, d), '{}'::jsonb) from (
        select node_id, round(avg((payload->>'depth_reached')::numeric), 1) d
        from event where kind = 'read_depth' and payload ? 'depth_reached'
        group by node_id) s),

    -- exit-without-continue: read-and-left vs read-and-descended
    'exit_without_continue', jsonb_build_object(
      'exit_to_home', (select count(*) from event where kind = 'exit_to_home'),
      'rail_follow',  (select count(*) from event where kind = 'rail_follow'),
      'continue_pressed', (select count(*) from event where kind = 'continue_pressed')),

    -- gate-hit-without-convert: where the price killed a live climb
    'gates', jsonb_build_object(
      'gate_hit',     (select count(*) from event where kind = 'gate_hit'),
      'gate_convert', (select count(*) from event where kind = 'gate_convert'),
      'gate_abandon', (select count(*) from event where kind = 'gate_abandon')),

    -- did the proof-showing-through pull?
    'membrane_open', (select count(*) from event where kind = 'membrane_open'),

    -- the rung where readerVocab stalls (a gloss shown but never followed deeper)
    'gloss_shown_by_term', (
      select coalesce(jsonb_object_agg(t, c), '{}'::jsonb) from (
        select payload->>'term' t, count(*) c
        from event where kind = 'gloss_shown' and payload ? 'term' group by 1) s)
  ) into m;
  return m;
end $$;
revoke all on function event_metrics() from public, anon;
grant execute on function event_metrics() to authenticated;
