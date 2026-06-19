# THE MIRROR PLATFORM — THE EVERYTHING SPEC

### The complete build bible for mirrorplatform.online. Hand this to a fresh session; it has everything needed to draft every Claude Code prompt that builds the site.

*Architect: Ilya Belous (pen name “A Reflection”) · The Mirror Platform LLC. Consolidates the website understanding established across prior sessions and everything built in the knowledge-geometry session that follows it (the protocol engine, the seeded graph, the basin-manifold attribution, the working Reader/Architect/Builder prototype). **[ESTABLISHED]** = settled; **[OPEN]** = a real product decision still Ilya’s.*

-----

## 0. THE ONE RULE THAT GOVERNS EVERY BUILD DECISION

**Nothing completes. The site is derived, not stored.** Importance, navigation, link structure, and depth are all *computed from the data on every read* — never cached as a separate truth that can drift. A site that could be “finished” would be the sealed system the corpus exists to diagnose (Book One §47). The only things that require a deploy are a new page *type* or a design token.

The corollary: **the engine never certifies itself from the inside.** A claim can be re-derived internally, but cannot reach `verdict_in` without external encounter. The site can carry the work to the edge of encounter and display it honestly open; it cannot close the ledger (§25, “no economy mints its own creditor”).

-----

## 1. THE THESIS THE ARCHITECTURE MUST EMBODY [ESTABLISHED]

The site is the public surface of a philosophical corpus rendered as a living dependency graph. These commitments are the *shape* of the site:

- **Corrigibility floor** — a first-person perspective can be wrong. → The graph’s deepest node by structural load is corrigibility; every node displays its refuter, never a “settled” badge.
- **No system certifies itself from within; the other is structurally required** (§30, MP-5). → Verdicts stay `carried`/`in_protocol` until external encounter; reader/builder contribution IS the encounter mechanism.
- **The firewall** — grounding a perspective and occupying its content are mutually exclusive (§16, §25). → `depends_on` strictly **acyclic**; a cycle is rejected at write time.
- **Valence is the ground beneath the truth-apt** (§53). → Two distinct geometries; emotion/grounding computed separately, never conflated.
- **Residue / the ghost floor** (§36). → Content never deletable by the guardian; a departed builder’s contribution remains, flagged.
- **The open ledger** — debts named, not hidden. → Every node carries open status + unmet debt; the open column asserted never-empty.

-----

## 2. THE INVERSION — THE SITE’S DEFINING STRUCTURAL MOVE [ESTABLISHED]

**There is no front door.** External links (wedge essays on LessWrong, Substack, Medium) drop the visitor *directly into the continuation*, residue intact. They arrive mid-thought on `/t/[slug]`, not a marketing homepage. The **homepage is reached by *exiting* a continuation** — where *“This place IS philosophy. The meta-philosophy.”* lands as recognition, not greeting. This drives routing, the funnel, and the free tier: the one continuation you arrived through is free; the rest of the graph is what the subscription opens.

-----

## 3. THE TWO-PART APPARATUS → THE TWO TIERS → THE MEMBRANE [ESTABLISHED]

- **A — impression-forming (free-leaning):** threads/continuations, forum, atlas. The prose you walk.
- **B — construction (paid):** proofs, theorems, books — the formal grounding beneath.

Information crosses **both ways**; the paid tier is **leave-able by constitution**; the A↔B tension is felt **inline, throughout each thread, via membrane nodes** — not gated only at the end. A *membrane* is a content node placed *while writing*: it points at a construction and carries a teaser, so the reader feels the proof showing through at the point it bears. Content, not code.

-----

## 4. THE KNOWLEDGE GEOMETRY ENGINE (THE HEART) [ESTABLISHED — built]

**The unit is the attempt.** Every continuation, proof, claim, or contribution is a node the instant it’s captured. Implemented in `protocol.py`; the live site ports its functions to TypeScript (client-side for reads, Supabase edge functions for writes).

### 4.1 The node schema (single source of truth)

```
id              unique handle (e.g. "B1-§16", "W-3", a slug)
label           what it tried to do, in the author's register
kind            attempt | leaf/borrow | code | definition
content_home    primary basin (philosophy, meta-philosophy, mathematics/logic,
                geometry, physics, language, architecture, ethics, mind)
content_reaches other basins it reaches into
substrate       thought | emotion | belief | experience  (emotion = the metric)
register        live (the spine / continuations) | confirms (EFT / superseded)
rests_on        [ids] — DEPENDS_ON edges (construction; rigid, acyclic)
pulls_to        [ids] — ENCOUNTER edges (grounding/significance; soft, may cycle)
stage           captured | has_result | in_protocol | verdict_in | on_graph
verdict          HOLDS | HELD | QUALIFIED | GAP | UNTESTED | NAMED | OPEN  (a LABEL, never a gate)
verdict_source  carried | internal-rederivation | derived  (only external encounter earns "derived")
refuter         what an opponent must DO to break it (null = seal-risk if HOLDS/HELD)
depth           COMPUTED each run from structural load — never stored as truth
author          A Reflection (architect) | a builder's handle
engagement      (builder nodes) unread | read | integrated | openly_discussed
presence        (builder nodes) active | departed
determination   (builder nodes) the architect's reading of how it affected the system
flags           [provisional-edge, reader-contribution, encounter, merged:X, …]
```

### 4.2 The three geometries [ESTABLISHED]

1. **Construction DAG** — from `rests_on`/`depends_on`. Rigid, directed, **acyclic** (the firewall).
2. **Encounter flow** — from `pulls_to`/`stake`. Soft, directed, **may cycle**. Where valence-as-ground lives and where reader/builder encounters land.
3. **Observed-encounter** — an **append-only behavioral event log**. Every read, entry, continuation, status change. History, not declaration.

### 4.3 The invariants (acceptance criteria — non-negotiable)

- **Nothing completes.** Top stage `on_graph` = permanent-and-open. Open column never-empty.
- **`depends_on` acyclic = the firewall.** A cycle-creating write is rejected; the UI offers to reroute the offending edge into `pulls_to`.
- **Depth is computed, never assigned.** Re-derived from structural load every run.
- **Edge weight = load, not frequency** (§16). Load = transitive dependent-count in `depends_on`.
- **Verdict is a label, not a gate.** Any-verdict node is still walkable and open.
- **`verdict_in` gated on external encounter.** Internal re-derivation advances to `in_protocol` + posts its wall; never mints `verdict_in` from inside.
- **Seal check (§47).** Any `HOLDS`/`HELD` node with no posted refuter is flagged a seal-risk.

### 4.4 The compute functions (port from `protocol.py`)

`structuralLoad` · `assignDepth` (metric / load-bearing / province / shallow by load percentile) · `findCycle` (the firewall) · `groundingLoad` (over `pulls_to`) · `components` · `openColumn` · `sealCheck`. The reader’s “leads to” rail is the **reverse** of everyone’s `rests_on`, computed — never authored.

### 4.5 Basins (optional map layer)

Two coordinate systems on one fabric: **substrate-basins** (four axes, emotion = metric) and **content-basins** (domains). Nodes carry both. Powers the Map’s clustering.

-----

## 5. THE DATA MODEL (Supabase — content is rows) [ESTABLISHED]

~8–9 templates render unbounded data; adding anything = inserting a row → live instantly. Core tables:

- **`thread`** — A-page (continuation OR wing-entry; IS a node). slug, title, body (TipTap JSON), arrived_from, basin, featured, published, + node fields.
- **`construction`** — B-page (proof/theorem/book section). slug, title, body, node fields, register. Gated per §6.
- **`membrane`** — content node inside a thread: points to a `construction` id, teaser, position-in-body.
- **`edge`** — `rests_on`/`pulls_to` as arrays, or explicit `edge(source, target, type)` (cleaner for the reverse-query). type ∈ {rests_on, pulls_to}.
- **`event`** — append-only behavioral log (third geometry): {ts, actor, kind, node, payload}. Never updated/deleted.
- **`map_entry`** — atlas rows: domain, verb-tag (dissolves|diagnoses|reframes|applies), “what it owes,” built/coming.
- **`user`** / **`subscription`** — Supabase Auth + Stripe state (tier, status, cancel); owned-materials persistence.
- **`forum_post`** — free, email-gated.
- **`removal`** — audit log: every forum removal records the *conduct* reason (never content). Self-binding.

Navigation is **derived**: the “Now” list is a query (`featured`); the Map is a query; a wing appears in subscriber nav only if it has a live construction. RLS enforces tier gates at the row level. Export is just rows — the corpus is never trapped.

-----

## 6. THE SUBSCRIPTION MODEL [ESTABLISHED — finalized]

The right to **read** and the right to **ground** are different stakes, gated separately.

|Tier|Price|Unlocks|
|---|---|---|
|**Free**|$0|Every article (LessWrong, Substack, Medium); the one continuation you arrived on; the home page; the Forum|
|**Continuations**|$24.99/mo|Reading the rest of the continuations — the whole live spine|
|**Builder**|$59.99/mo|A slot of your own: continue any thought, ground your own nodes, your own minimum admin|
|**Patron**|contact A Reflection|Not a checkout — licensing, institutional use, bespoke terms, arranged directly|

- **Read gate** ($24.99): a free visitor viewing any continuation other than their entry hits it.
- **Contribution gate** (Builder $59.99): reaching a frontier and choosing to continue requires Builder. A borne cost filters for *seriousness*, not means.
- **Patron is an encounter, not a transaction.** Stripe handles the two priced tiers; Patron is a contact route.
- **Constitution surfaced in UI:** cancel anytime · your continuations stay yours and leave with you · the guardian can never remove them.

-----

## 7. THE READER EXPERIENCE [ESTABLISHED — prototype in MirrorPlatform.jsx]

Enters mid-thought on a continuation. The page shows: the prose with **membranes** inline; the **honest ledger** (verdict, open status, the wall it invites, *“verdict carried, not derived — only an external encounter settles it”*); **three rails** (Descend into its grounds = `rests_on`; Pulls toward = `pulls_to`; **Leads to — what builds on this** = computed reverse of everyone’s `rests_on`); at a **frontier**, the continue-prompt → the gate (§6).

-----

## 8. THE ARCHITECT (ADMIN) EXPERIENCE [ESTABLISHED — prototype]

Single-admin TipTap console: **insert a continuation** (8-field capture); **the why-ledger** (recomputation diff as proof-steps — captured, edges, firewall, which grounds gained load, depth-tier crossings, component joined, seal-risk, reader pages whose “leads to” updated); **structural-load ranking** (live); **firewall block + reroute**; **builder encounters band** (§9). Hybrid prose input: type in the console OR upload a manuscript — both ingest to a node’s body; structure-fields and body-field as separate commits joined by id.

-----

## 9. BUILDER CONTRIBUTION & GOVERNANCE — LEAVABILITY [ESTABLISHED]

A builder’s contribution is an **encounter with the system**, not an edit. Enters `unread`, **attributed**, resting into the frontier it continues — never touches the canonical spine. The architect **flags** it (`unread → read → integrated → openly discussed`) and **engages it by continuing it** (writing a node resting on the builder’s flips it to `integrated`). **Leave anytime; what they left stays — that’s residue** (§36); marking departed keeps the node and records the architect’s determination. **The guardian binding is the absence of a delete button.** Each builder gets a **minimum admin** (see/insert their own).

-----

## 10. THE FORUM [ESTABLISHED]

Free, email-gated. A **deletion constitution that binds the guardian**: conduct removable, content never; every removal requires an audit-log entry stating the *conduct* reason. The `removal` table is the self-binding log.

## 11. THE MAP / ATLAS [ESTABLISHED]

A query over `map_entry`. Atlas of reach, verb-tagged **dissolves | diagnoses | reframes | applies**, with **“what it owes”** per item, built/coming per wing. Basin clustering can drive layout.

## 12. EVENTS / THE DEEP READ [ESTABLISHED]

`/events`: Deep Read content, new-drop cards, Substack embeds. (The Deep Read has its own built site in the same house.)

-----

## 13. TECH STACK & HOW THE ENGINE MAPS [ESTABLISHED]

- **Vite-React SPA** (fetches content at runtime — new rows live instantly).
- **Supabase** — Postgres + Auth + RLS (tier gates at the row) + Realtime + daily backups.
- **TipTap** — CMS editor; membranes are TipTap nodes.
- **Stripe** — two priced tiers; Patron is a contact route.
- **Netlify** — deploy; build hooks only on structure/design changes. Domain **mirrorplatform.online**.
- **The engine:** `protocol.py` ports to TS. Reads compute client-side; writes run as edge functions that re-validate invariants (acyclicity especially) before commit, then append to `event`.
- **Stack decision:** the content model is a **headless CMS inside Supabase** (you own the corpus). Fallback: **Payload** (self-hostable, Postgres-backed).

## 14. THE EXISTING ARTIFACTS THE BUILD DRAWS FROM

`protocol.py` (port it; don’t reinvent) · `graph.json` (~358 nodes — real content) · `MirrorPlatform.jsx` (the Reader+Architect+Builder UX reference; re-skin to the crest register, keep the behavior) · `mirror-platform-basin-manifold-spec.md` · the register slices · the prior website docs.

-----

## 15. THE BUILD SEQUENCE — HOW TO DRAFT THE CLAUDE CODE PROMPTS

**Phase 0 — gate (yours; blocks external launch) [OPEN]:** ratify Book One §53 + Parts VI–VIII; freeze Book One v1.0; **confirm what active-duty service permits re: pseudonymous public writing.** If forbidden, build in private and time exposure to separation.

1. Schema & engine core. 2. Design system (crest tokens). 3. Templates (~8–9). 4. Derived navigation. 5. The membrane (prototype on a real reader first). 6. Reader experience (three rails incl. computed “leads to”, honest ledger, frontier). 7. Subscription (Stripe + gates + Patron). 8. Architect admin. 9. Builder admin & governance. 10. Forum + removal log. 11. Map/Atlas + basin layout. 12. Seed (load graph.json + register content; wire the wedge `/t/could-it-suffer` ↔ `/c/...`). 13. **Launch the entering wing WHOLE (A+B together)** — plant the wedge on LessWrong + EA Forum in your own voice (AI-prose ban). Breadth grows by return.

-----

## 16. DESIGN SYSTEM (the crest register) [ESTABLISHED]

- **Palette:** Stage `#0B0A08` · Bone `#E9E4D8` · Gold `#C9A227` · Steel `#8FA7B3` · Seal red `#B3261E`.
- **Type:** Playfair Display (display) · Spectral (body/serif) · IBM Plex Mono (data/labels).
- The prototype uses a near-variant (ink/amber/sage); re-skin to the crest register on build.

-----

## 17. VOICE & COPY PRINCIPLES [ESTABLISHED]

- **AI-prose ban** for public-facing writing — wedge essays and continuations are in A Reflection’s own voice. Site copy is plain, active, honest.
- **The honest register everywhere:** open ledgers, named debts, “verdict carried, not derived.” Errors/empty states give direction, not mood. The constitution is *shown*, not just honored in the backend.

-----

## 18. NON-NEGOTIABLES (acceptance criteria) & OPEN DECISIONS

**Non-negotiable (the build is wrong if any fails):**

1. Adding content never requires a deploy (rows, not code).
2. `depends_on` is always acyclic; cycles refused at write time.
3. Depth/load computed on read; never stored as truth.
4. No verdict reaches `verdict_in` without an external-encounter event.
5. No delete path for any node’s content; the guardian removes conduct (forum), never content.
6. A builder’s contributions are attributed, leave-able, persist as residue after departure.
7. The “leads to” rail is computed, never authored.
8. One-click cancel; owned materials persist; the corpus exports as rows.

**Open decisions [OPEN]:**

- **Curation-on-entry:** do builder continuations surface immediately on the public frontier, or land in a layer the architect curates? *(The Contribution-Conduct Spec resolves this: flag-rides-along — public-immediately, rendered provisional, met after.)*
- **Final prices** ($24.99 / $59.99 — a TIERS config).
- **Canonical-spine vs encounter-layer** rendering of reader nodes (default: encounter layer, spine stays the architect’s).
- **Phase 0:** the active-duty pseudonymity question — the real gate on external launch.

-----

*End of spec. The site can carry the work to the edge of encounter and show it honestly open. It cannot close the ledger — that step is the wedge going out, and it remains gated on Phase 0. Build the receiver; the crossing is yours.*
