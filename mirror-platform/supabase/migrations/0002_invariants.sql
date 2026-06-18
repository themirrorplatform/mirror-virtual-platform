-- ============================================================================
-- The Mirror Platform — 0002 write-invariants (P1)
-- The §4.3 / §18 acceptance criteria, enforced at the database so NO write path
-- (edge function, direct service-role, SQL) can violate them. The P3 commit
-- edge function re-validates these and writes the why-ledger; these triggers are
-- the floor beneath it — the firewall that cannot be bypassed.
-- ============================================================================

-- ── 1. THE FIREWALL: depends_on (rests_on) is acyclic (§4.3, §18.2) ─────────
-- Inserting S -rests_on-> T closes a cycle iff T already reaches S via rests_on.
-- The UI's recourse is to reroute the offending edge into pulls_to (§4.3).
create or replace function edge_no_cycle() returns trigger
language plpgsql as $$
begin
  if new.type = 'rests_on' then
    if exists (
      with recursive reach(nid) as (
        select new.target
        union
        select e.target from edge e
          join reach r on e.source = r.nid and e.type = 'rests_on'
      )
      select 1 from reach where nid = new.source
    ) then
      raise exception
        'FIREWALL: edge %->% would create a depends_on cycle; reroute it into pulls_to (§4.3).',
        new.source, new.target using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger edge_no_cycle_t before insert or update on edge
  for each row execute function edge_no_cycle();

-- ── 2. BUILDER GUARD: canon never rests on a builder node (§9, Conduct §3) ──
-- A builder contribution attaches UPWARD onto a frontier; the spine never
-- depends on it. (A builder's node resting on canon is fine — that's attaching.)
create or replace function edge_builder_guard() returns trigger
language plpgsql as $$
declare src_arch boolean; tgt_arch boolean;
begin
  if new.type = 'rests_on' then
    select h.is_architect into src_arch
      from node n join handle h on n.author_handle = h.handle where n.node_id = new.source;
    select h.is_architect into tgt_arch
      from node n join handle h on n.author_handle = h.handle where n.node_id = new.target;
    if src_arch and not coalesce(tgt_arch, false) then
      raise exception
        'BUILDER GUARD: canon (%) cannot rest on builder node (%); contributions attach upward only (§9).',
        new.source, new.target using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger edge_builder_guard_t before insert or update on edge
  for each row execute function edge_builder_guard();

-- ── 3. verdict_in IS GATED ON EXTERNAL ENCOUNTER (§0, §4.3, §18.4) ──────────
-- Internal re-derivation may reach in_protocol; only an external encounter
-- (verdict_source='derived' + an 'encounter' event) mints verdict_in. The engine
-- never certifies itself from inside ("no economy mints its own creditor", §25).
create or replace function verdict_in_external_gate() returns trigger
language plpgsql as $$
begin
  if new.stage = 'verdict_in'
     and (tg_op = 'INSERT' or old.stage is distinct from 'verdict_in') then
    if new.verdict_source is distinct from 'derived'
       or not exists (select 1 from event where node_id = new.node_id and kind = 'encounter') then
      raise exception
        'EXTERNAL GATE: % cannot reach verdict_in without an external encounter (verdict_source=derived + an encounter event) (§4.3).',
        new.node_id using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger verdict_in_gate_t before insert or update on node
  for each row execute function verdict_in_external_gate();

-- ── 4. NO-DELETE ON CORPUS CONTENT (§5.5, §18.5, §36 residue) ───────────────
-- The guardian removes conduct (forum/withdrawal), never content. There is no
-- delete path for any node's content. Edges/membranes/map are structure, not
-- content — they remain editable so the firewall can reroute (§4.3).
create or replace function forbid_delete() returns trigger
language plpgsql as $$
begin
  raise exception
    'NO-DELETE: % is corpus content (§36 residue). Conduct is withdrawn-and-logged, never deleted; PII is erased via erase_person — neither deletes corpus.',
    tg_table_name using errcode = 'restrict_violation';
  return null;
end $$;
create trigger node_no_delete        before delete on node        for each row execute function forbid_delete();
create trigger thread_no_delete      before delete on thread      for each row execute function forbid_delete();
create trigger construction_no_delete before delete on construction for each row execute function forbid_delete();
create trigger forum_no_delete       before delete on forum_post  for each row execute function forbid_delete();

-- ── 5. APPEND-ONLY LOGS (§4.2 observed-encounter; the audit logs) ───────────
-- event / commit_ledger / removal are history, not declaration. The sole
-- sanctioned mutation is person-erasure, which carves itself out via a
-- transaction-local flag (the one delete operation, Permanence §3).
create or replace function forbid_mutate() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('app.erasing', true), 'off') = 'on' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  raise exception 'APPEND-ONLY: % is an immutable log (§4.2).', tg_table_name
    using errcode = 'restrict_violation';
end $$;
create trigger event_append_only   before update or delete on event         for each row execute function forbid_mutate();
create trigger ledger_append_only  before update or delete on commit_ledger for each row execute function forbid_mutate();
create trigger removal_append_only before update or delete on removal       for each row execute function forbid_mutate();

-- ── 6. THE SINGLE DELETE OPERATION: person-erasure (Permanence §3) ──────────
-- Deletes/anonymizes PERSON data only; touches NO corpus row. The handle stays
-- on every corpus node, now decoupled from the erased identity. Auth-user
-- deletion (auth.users) is done by the erasure edge function via the Auth admin
-- API; this handles the application tables atomically.
create or replace function erase_person(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.erasing', 'on', true);   -- transaction-local carve-out
  delete from event where actor = p_user;           -- raw per-actor stream (PII)
  delete from subscription where user_id = p_user;  -- billing state
  update app_user                                   -- decouple identity from handle
     set email = null, handle = null, erased_at = now()
   where id = p_user;
  insert into commit_ledger (node_id, summary, diff)
    values (null, 'person erasure',
            jsonb_build_object('user', p_user, 'class', 'PERSON', 'corpus_touched', false));
end $$;
revoke all on function erase_person(uuid) from public, anon, authenticated;
