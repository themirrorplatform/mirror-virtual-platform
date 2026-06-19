-- ============================================================================
-- The Mirror Platform — 0004 bootstrap (P2)
-- The one structural seed the schema needs: the architect's handle, so corpus
-- attribution has its anchor (Permanence §0 — the handle is the hinge). Content
-- (graph.json, the wedge) is seeded in P12, not here.
-- ============================================================================
insert into handle (handle, display, is_architect)
values ('a-reflection', 'A Reflection', true)
on conflict (handle) do nothing;
