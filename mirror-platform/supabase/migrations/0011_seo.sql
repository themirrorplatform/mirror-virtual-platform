-- ============================================================================
-- The Mirror Platform — 0011 SEO/shareability (P15)
-- The author-owned share_line (§3), and a world-readable meta source for the
-- server-true <head> (§2). The meta view exposes construction TITLES only — the
-- preview is a handshake, never the gated body (§4). Bodies stay RLS-gated.
-- ============================================================================

alter table thread add column if not exists share_line text;  -- authored, never truncated (§3)

-- recreate architect_commit_body with share_line (drop first — signature change)
drop function if exists architect_commit_body(text,text,text,text,jsonb,text,text,boolean,boolean);
create or replace function architect_commit_body(
  p_node_id text, p_kind text, p_slug text, p_title text, p_body jsonb,
  p_min_tier text default 'continuations', p_arrived_from text default null,
  p_featured boolean default false, p_published boolean default true,
  p_share_line text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_architect() then raise exception 'architect only' using errcode = '42501'; end if;
  if p_kind = 'construction' then
    insert into construction (node_id, slug, title, body, min_tier, published)
      values (p_node_id, p_slug, p_title, p_body, p_min_tier::tier, p_published)
      on conflict (node_id) do update set slug = excluded.slug, title = excluded.title,
        body = excluded.body, min_tier = excluded.min_tier, published = excluded.published;
  else
    insert into thread (node_id, slug, title, body, arrived_from, featured, published, share_line)
      values (p_node_id, p_slug, p_title, p_body, p_arrived_from, p_featured, p_published, p_share_line)
      on conflict (node_id) do update set slug = excluded.slug, title = excluded.title,
        body = excluded.body, arrived_from = excluded.arrived_from, featured = excluded.featured,
        published = excluded.published, share_line = excluded.share_line;
  end if;
end $$;
grant execute on function architect_commit_body(text,text,text,text,jsonb,text,text,boolean,boolean,text) to authenticated;

-- the server-true-head meta source: published, live rows only; construction
-- exposes TITLE only (the handshake) — never body. World-readable for crawlers.
create or replace view public_meta as
  select 'thread'::text as kind, t.slug, t.title,
         coalesce(t.share_line, 'A continuation in a living philosophical corpus — published under the pen name A Reflection.') as description,
         n.author_handle, t.featured, t.created_at
    from thread t join node n on t.node_id = n.node_id
   where t.published and n.conduct_status = 'live'
  union all
  select 'construction', c.slug, c.title,
         'A construction beneath the spine — the formal grounding. The body opens with a subscription.' as description,
         n.author_handle, false, c.created_at
    from construction c join node n on c.node_id = n.node_id
   where c.published and n.conduct_status = 'live';
grant select on public_meta to anon, authenticated;

-- set the wedge's authored share line (the architect's voice; placeholder until
-- the real wedge prose is seeded in P17 under the AI-prose ban).
update thread set share_line =
  'Could a machine suffer — and would it matter? The honest answer, from outside, is: it could, in both directions.'
  where slug = 'could-it-suffer' and share_line is null;
