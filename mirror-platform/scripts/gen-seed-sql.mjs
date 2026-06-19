// ============================================================================
// gen-seed-sql.mjs — emit the ingestion migrations from the canonical seed JSON.
//
// Reads supabase/seed/{spine,lexicon}-seed.json and writes:
//   supabase/migrations/0012_seed_spine.sql    (node/edge/thread/construction/membrane/map_entry)
//   supabase/migrations/0013_seed_lexicon.sql  (term/term_edge)
//
// PRINCIPLE (per the seed _meta.rules): ingest STRUCTURE + PLACEHOLDERS verbatim;
// generate/alter NO authored prose. Bodies, share_lines and first_glosses are
// copied byte-for-byte from the JSON (placeholders today; the architect fills
// them later). Existing authored values are never clobbered — body / share_line
// / first_gloss / plain use coalesce(existing, incoming) on conflict.
//
// "Exactly as wired": every node lands in the single `node` source-of-truth,
// edges go through the firewall/builder-guard triggers (0002), geometry is the
// engine's recompute_geometry(), and presentations land in thread/construction
// exactly as architect_commit_body writes them. This batches that write path.
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const spine = JSON.parse(readFileSync(join(root, "supabase/seed/spine-seed.json"), "utf8"));
const lex = JSON.parse(readFileSync(join(root, "supabase/seed/lexicon-seed.json"), "utf8"));

// ---- SQL emit helpers -------------------------------------------------------
const q = (s) => (s === null || s === undefined ? "null" : "'" + String(s).replace(/'/g, "''") + "'");
const arr = (a) => (a && a.length ? "ARRAY[" + a.map(q).join(",") + "]::text[]" : "'{}'::text[]");
const bool = (b) => (b ? "true" : "false");
const jsonbText = (s) => `to_jsonb(${q(s)}::text)`; // placeholder stored verbatim as a JSON string
const slug = (id) => id.toLowerCase().replace(/§/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ============================================================================
// 0012 — the spine
// ============================================================================
const cont = spine.continuations;
const cons = spine.constructions;
const leaves = spine.leaves || [];

// every node that must exist (continuations + constructions + leaves), so every
// edge / presentation / membrane / map FK target is present before we wire them.
const nodes = [
  ...cont.map((c) => ({ id: c.id, label: c.title, kind: "attempt", home: c.content_home,
    register: c.register || "live", stage: c.stage, verdict: c.verdict, vs: c.verdict_source, refuter: c.refuter })),
  ...cons.map((c) => ({ id: c.id, label: c.title, kind: "attempt", home: c.content_home,
    register: c.register || "live", stage: c.stage, verdict: c.verdict, vs: c.verdict_source, refuter: c.refuter })),
  ...leaves.map((l) => ({ id: l.id, label: l.id, kind: l.kind === "leaf" ? "leaf/borrow" : (l.kind || "leaf/borrow"),
    home: "philosophy", register: "live", stage: "captured", verdict: null, vs: null, refuter: null })),
];

// edges from every continuation + construction
const edges = [];
for (const c of [...cont, ...cons]) {
  for (const t of c.rests_on || []) edges.push([c.id, t, "rests_on"]);
  for (const t of c.pulls_to || []) edges.push([c.id, t, "pulls_to"]);
}
const edgeSources = [...new Set(edges.map((e) => e[0]))];

let s = `-- ============================================================================
-- The Mirror Platform — 0012 seed: the minimum viable paid spine (P17 structure)
-- GENERATED from supabase/seed/spine-seed.json by scripts/gen-seed-sql.mjs.
-- Do not edit by hand; re-run the generator. Idempotent (upsert / coalesce).
--
-- Ingests the spine exactly as wired: every node into the §4.1 \`node\` source of
-- truth, edges through the firewall triggers (0002), geometry via the engine's
-- recompute_geometry(), and the A/B presentations into thread/construction with
-- their membranes + atlas rows. Bodies / share_lines are PLACEHOLDERS copied
-- verbatim from the seed; existing authored values are preserved (coalesce).
-- ============================================================================
begin;

-- the architect handle is the corpus author-anchor (Permanence §0)
insert into handle (handle, display, is_architect) values ('a-reflection','A Reflection',true)
  on conflict (handle) do nothing;

-- ── Phase 1: every node exists (single source of truth, §4.1) ───────────────
insert into node (node_id,label,kind,content_home,register,stage,verdict,verdict_source,refuter,author_handle) values
${nodes.map((n) => `  (${q(n.id)},${q(n.label)},${q(n.kind)}::kind,${q(n.home)},${q(n.register)}::register,${q(n.stage)}::stage,${q(n.verdict)},${n.vs ? q(n.vs) + "::verdict_source" : "null"},${q(n.refuter)},'a-reflection')`).join(",\n")}
on conflict (node_id) do update set
  label=excluded.label, kind=excluded.kind, content_home=excluded.content_home,
  register=excluded.register, stage=excluded.stage, verdict=excluded.verdict,
  verdict_source=excluded.verdict_source, refuter=excluded.refuter;

-- ── Phase 2: edges (the firewall trigger validates acyclicity per insert) ────
delete from edge where source = any(${arr(edgeSources)});
insert into edge (source,target,type) values
${edges.map((e) => `  (${q(e[0])},${q(e[1])},${q(e[2])}::edge_type)`).join(",\n")}
on conflict (source,target,type) do nothing;

-- ── Phase 3: the engine recomputes load + depth from the edges (§5) ─────────
select recompute_geometry();

-- ── Phase 4: B-page presentations (gated; placeholder body, never clobbered) ─
insert into construction (node_id,slug,title,body,min_tier,published) values
${cons.map((c) => `  (${q(c.id)},${q(slug(c.id))},${q(c.title)},${jsonbText(c.body)},'continuations'::tier,true)`).join(",\n")}
on conflict (node_id) do update set
  slug=excluded.slug, title=excluded.title,
  body=coalesce(construction.body, excluded.body),
  min_tier=excluded.min_tier, published=excluded.published;

-- ── Phase 5: A-page presentations (entry public; essays tier-gated) ─────────
insert into thread (node_id,slug,title,body,arrived_from,featured,published,share_line) values
${cont.map((c) => `  (${q(c.id)},${q(c.id)},${q(c.title)},${jsonbText(c.body)},${q(c.arrived_from || null)},${bool(!!c.entry)},true,${jsonbText(c.share_line)})`).join(",\n")}
on conflict (node_id) do update set
  slug=excluded.slug, title=excluded.title,
  body=coalesce(thread.body, excluded.body),
  arrived_from=excluded.arrived_from, featured=excluded.featured, published=excluded.published,
  share_line=coalesce(thread.share_line, excluded.share_line);

-- ── Phase 6: membranes (the descend walk; structure, freely rebuilt) ────────
delete from membrane where thread_id = any(${arr(cont.map((c) => c.id))});
insert into membrane (thread_id,construction_id,teaser,position) values
${cont.flatMap((c) => (c.membranes || []).map((m, i) => `  (${q(c.id)},${q(m.into)},${q(m.teaser)},${i})`)).join(",\n")};

-- ── Phase 7: the atlas (structure, freely rebuilt) ──────────────────────────
delete from map_entry;
insert into map_entry (domain,verb,owes,status,node_id) values
${spine.map_entries.map((m) => `  (${q(m.domain)},${q(m.verb)},${q(m.owes)},${q(m.state)},${m.to ? q(m.to) : "null"})`).join(",\n")};

-- the why-ledger note (§8): history, not declaration
insert into commit_ledger (node_id, summary, diff) values
  (null, 'seed 0012: minimum viable paid spine',
   jsonb_build_object('continuations',${cont.length},'constructions',${cons.length},
     'leaves',${leaves.length},'edges',${edges.length},'map_entries',${spine.map_entries.length},
     'source','supabase/seed/spine-seed.json'));

commit;
`;
writeFileSync(join(root, "supabase/migrations/0012_seed_spine.sql"), s);

// ============================================================================
// 0013 — the lexicon
// ============================================================================
const note = (t) => {
  if (t.disposition === "demote") return t.binding || null;
  if (t.disposition === "experience") return [t.note, t.binding].filter(Boolean).join(" · ") || null;
  if (t.disposition === "banned") return [t.say_instead ? "say_instead: " + t.say_instead : null, t.note].filter(Boolean).join(" · ") || null;
  return t.note || null;
};

let L = `-- ============================================================================
-- The Mirror Platform — 0013 seed: the lexicon shells (P6 / §A·§B)
-- GENERATED from supabase/seed/lexicon-seed.json by scripts/gen-seed-sql.mjs.
-- Do not edit by hand; re-run the generator. Idempotent (upsert / coalesce).
--
-- The §A term records + the §B requires-DAG. TEACH first_glosses are PLACEHOLDERS
-- copied verbatim (authored by A Reflection under the AI-prose ban §17) — an
-- existing authored gloss is never clobbered (coalesce). The acyclicity trigger
-- (0006) validates every requires edge on insert.
-- ============================================================================
begin;

insert into term (term,surface_forms,register,our_meaning,defines_node,reader_assumptions,
                  collision,disposition,plain,first_gloss,tier0,arrival_early,gloss_verdict,gloss_refuter,notes) values
${lex.terms.map((t) => `  (${q(t.term)},${arr(t.surface_forms)},${q(t.register || "transmission")},${q(t.our_meaning)},${q(t.defines_node || null)},${arr(t.reader_assumptions)},${q(t.collision || "none")}::collision,${q(t.disposition)}::disposition,${q(t.disposition === "demote" ? t.plain : null)},${q(t.disposition === "teach" ? t.first_gloss : null)},${bool(!!t.tier0)},${arr(t.arrival_early)},${q(t.gloss_verdict || "untested")}::gloss_verdict,${q(t.gloss_refuter || null)},${q(note(t))})`).join(",\n")}
on conflict (term) do update set
  surface_forms=excluded.surface_forms, register=excluded.register, our_meaning=excluded.our_meaning,
  defines_node=excluded.defines_node, reader_assumptions=excluded.reader_assumptions,
  collision=excluded.collision, disposition=excluded.disposition,
  plain=coalesce(term.plain, excluded.plain),
  first_gloss=coalesce(term.first_gloss, excluded.first_gloss),
  tier0=excluded.tier0, arrival_early=excluded.arrival_early,
  gloss_verdict=excluded.gloss_verdict, gloss_refuter=excluded.gloss_refuter, notes=excluded.notes;

-- the §B requires-DAG (acyclic; the term firewall validates each edge)
insert into term_edge (from_term,to_term,kind) values
${lex.term_edges.map((e) => `  (${q(e.from)},${q(e.to)},${q(e.kind || "requires")})`).join(",\n")}
on conflict (from_term,to_term,kind) do nothing;

commit;
`;
writeFileSync(join(root, "supabase/migrations/0013_seed_lexicon.sql"), L);

console.log("wrote 0012_seed_spine.sql (" + nodes.length + " nodes, " + edges.length + " edges) and 0013_seed_lexicon.sql (" + lex.terms.length + " terms, " + lex.term_edges.length + " edges)");
