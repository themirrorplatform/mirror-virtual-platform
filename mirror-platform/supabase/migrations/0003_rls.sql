-- ============================================================================
-- The Mirror Platform — 0003 RLS (P2)
-- Deny by default everywhere (mirrors the read gates). Then: CORPUS is
-- world/tier-readable and NEVER client-writable (writes go through service-role
-- edge functions that pass the 0002 invariants); PERSON is owner-readable and
-- erasable only via erase_person. Tier gates live at the row (§5, §13).
--
-- service_role bypasses RLS (it is BYPASSRLS in Supabase) — that is the write
-- path. anon/authenticated are fully subject to the policies below.
-- ============================================================================

-- ── tier helpers (read gate, §6) ───────────────────────────────────────────
create or replace function tier_rank(t tier) returns int
language sql immutable as $$
  select case t when 'free' then 0 when 'continuations' then 1
                when 'builder' then 2 when 'patron' then 3 end;
$$;

-- the caller's effective tier from their active subscription; 'free' if none.
create or replace function current_tier() returns tier
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select tier from subscription
       where user_id = auth.uid() and status in ('active','trialing')
       limit 1), 'free')::tier;
$$;

-- the caller's chosen handle (for owning their own forum posts / nodes).
create or replace function current_handle() returns text
language sql stable security definer set search_path = public as $$
  select handle from app_user where id = auth.uid();
$$;

-- ── enable RLS on every table (deny by default) ────────────────────────────
alter table handle        enable row level security;
alter table node          enable row level security;
alter table edge          enable row level security;
alter table thread        enable row level security;
alter table construction  enable row level security;
alter table membrane      enable row level security;
alter table map_entry     enable row level security;
alter table forum_post    enable row level security;
alter table removal       enable row level security;
alter table commit_ledger enable row level security;
alter table app_user      enable row level security;
alter table subscription  enable row level security;
alter table event         enable row level security;

-- ── base grants (RLS sits on top of these) ─────────────────────────────────
grant select on handle, node, edge, membrane, map_entry, thread, construction, removal
  to anon, authenticated;
grant select on forum_post, app_user, subscription, event to authenticated;
grant insert on event to anon, authenticated;        -- the behavioral log
grant insert on forum_post to authenticated;          -- email-gated forum
grant update on app_user to authenticated;            -- own profile
grant execute on function current_tier(), current_handle(), tier_rank(tier) to anon, authenticated;

-- ===========================================================================
-- CORPUS — world/tier-readable, never client-writable (no INSERT/UPDATE/DELETE
-- policies = denied by default; service-role edge functions do all writes).
-- ===========================================================================

-- handle + structure + atlas: public metadata (powers the graph, rails, map, SEO)
create policy handle_read    on handle    for select to anon, authenticated using (true);
create policy edge_read      on edge      for select to anon, authenticated using (true);
create policy membrane_read  on membrane  for select to anon, authenticated using (true);
create policy map_read       on map_entry for select to anon, authenticated using (true);
create policy removal_read   on removal   for select to anon, authenticated using (true); -- self-binding log is public

-- node metadata: world-readable while live; withdrawn-for-conduct is suppressed
-- from the public surface (Conduct §2) — the architect sees it via service role.
create policy node_read on node for select to anon, authenticated
  using (conduct_status = 'live');

-- thread (A-page): the wedge entries you arrive on + the featured "Now" list are
-- free/public; the interior spine opens at the Continuations tier (§2, §6). The
-- per-arrival "exactly the one you entered" nuance is the app-layer canAccess
-- gate; RLS draws the durable public/paid line.
create policy thread_read on thread for select to anon, authenticated
  using (
    published
    and exists (select 1 from node n where n.node_id = thread.node_id and n.conduct_status = 'live')
    and (
      arrived_from is not null            -- a wedge landing: public
      or featured                          -- the home "Now" surface: public
      or tier_rank(current_tier()) >= tier_rank('continuations')
    )
  );

-- construction (B-page): tier-gated, never anon. Builder constructions need the
-- Builder tier; the rest open at Continuations (§6). min_tier is the row gate.
create policy construction_read on construction for select to authenticated
  using (
    published
    and exists (select 1 from node n where n.node_id = construction.node_id and n.conduct_status = 'live')
    and tier_rank(current_tier()) >= tier_rank(min_tier)
  );

-- forum: free but email-gated → authenticated only; conduct-withdrawn suppressed.
create policy forum_read on forum_post for select to authenticated
  using (conduct_status = 'live');
create policy forum_insert on forum_post for insert to authenticated
  with check (author_handle = current_handle() and conduct_status = 'live');

-- ===========================================================================
-- PERSON — owner-readable only; erasable solely via erase_person (§3).
-- ===========================================================================
create policy app_user_read   on app_user   for select to authenticated using (id = auth.uid());
create policy app_user_update on app_user   for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy sub_read        on subscription for select to authenticated using (user_id = auth.uid());

-- event: anyone may append their own behavioral event; you read only your own
-- raw stream (aggregates are exposed later via service-role rollups, §1).
create policy event_insert on event for insert to anon, authenticated
  with check (actor is null or actor = auth.uid());
create policy event_read on event for select to authenticated
  using (actor = auth.uid());

-- commit_ledger (the why-ledger): architect-facing (§8). No client policy →
-- denied to anon/authenticated by default; served only via service role.

-- ── the derived read view runs with the caller's RLS, not the owner's ──────
alter view node_graph set (security_invoker = true);
grant select on node_graph to anon, authenticated;
