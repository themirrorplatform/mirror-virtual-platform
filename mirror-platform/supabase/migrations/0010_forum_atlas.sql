-- ============================================================================
-- The Mirror Platform — 0010 forum + atlas (P12 · P13)
-- The forum's conduct-withdrawal (the guardian-binding: conduct removable,
-- content never), the removal audit restricted to the architect (P12: the audit
-- is [A]-only; the conduct banner is public), and the atlas write path.
-- ============================================================================

-- ── P12: removal audit is architect-only (the public sees the banner, not the log)
drop policy if exists removal_read on removal;
create policy removal_read on removal for select to authenticated using (is_architect());

-- withdraw a forum post FOR CONDUCT (never content): suppress + log the reason,
-- never delete (§10, Conduct §3). forum_post is corpus — the no-delete trigger
-- stands; this is a visibility change on residue.
create or replace function withdraw_forum_post(p_post_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'a conduct reason is required'; end if;
  update forum_post set conduct_status = 'withdrawn-for-conduct' where id = p_post_id;
  insert into removal (target_kind, target_id, conduct_reason)
    values ('forum_post', p_post_id::text, p_reason);
end $$;
grant execute on function withdraw_forum_post(uuid, text) to authenticated;

-- a public view of forum posts WITH the author's display name (no PII — handle
-- only), so the client need not read the person tables.
create or replace view forum_thread as
  select fp.id, fp.body, fp.parent_id, fp.created_at, fp.author_handle,
         h.display as author_display
  from forum_post fp join handle h on fp.author_handle = h.handle
  where fp.conduct_status = 'live';
alter view forum_thread set (security_invoker = true);
grant select on forum_thread to authenticated;

-- ── P13: the atlas write path (architect-only) ─────────────────────────────
create or replace function architect_add_map_entry(
  p_domain text, p_verb text, p_owes text, p_status text, p_node_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  insert into map_entry (domain, verb, owes, status, node_id)
    values (p_domain, p_verb, p_owes, p_status, p_node_id);
end $$;
grant execute on function architect_add_map_entry(text,text,text,text,text) to authenticated;

-- seed a few atlas rows (structural — the verb-tag + the debt are the architect's
-- to author; these demonstrate built-vs-coming and the walkability rule).
insert into map_entry (domain, verb, owes, status, node_id) values
  ('mind', 'diagnoses', 'a welfare detector that reads first-person valence from third-person data', 'built', 'could-it-suffer'),
  ('philosophy', 'reframes', 'the ground beneath the truth-apt — still needs a stranger to settle it', 'built', 'B1-§53'),
  ('language', 'dissolves', 'the sweep of the transmission corpus, region by region', 'coming', null)
on conflict do nothing;
