# The Mirror Platform — The Claude Code Build Plan

### The complete build schema and the full prompt sequence for mirrorplatform.online. Part A enumerates the entire vision — every concept, table, role, page, component, and function — cross-referenced to the spec that governs it and the prompt that builds it. Part B is the ordered, paste-ready Claude Code prompts. The discipline that keeps the agent from drifting to conventional defaults is in §0 and inherited by every prompt.

*Architect: Ilya Belous ("A Reflection") · The Mirror Platform LLC. This consolidates and operationalizes: the Everything Spec, the Voice Spec, the Surface-Language Sweep, the Lexicon Schema, the Surface-Composition Schema, the Contribution-Conduct Spec, the Telemetry Spec, the Device-Access Spec, the Data-Permanence Spec, and the SEO-Shareability Spec — plus the working prototype (MirrorPlatform.jsx) and the engine (protocol.py, graph.json). Build in the §15 spirit: grow the receiver by module, test each against the prototype before the next, launch the entering wing whole.*

---

## §0. THE STANDING PREAMBLE — inherited by EVERY prompt

Paste this block at the top of every Claude Code session. Each prompt below assumes it.

> **You are building The Mirror Platform, a philosophical corpus rendered as a living dependency graph. This site deliberately violates conventional web defaults. Obey these standing rules on every task; when a rule here conflicts with your instinct, the rule wins.**
>
> 1. **Deny by default, everywhere.** An element with no composition rule for a role is **hidden**, never shown raw. A term with no lexicon entry renders **plain or absent**, never auto-defined. A page with no access rule is **locked**. The corpus grows by explicit grant; nothing is exposed by accident.
> 2. **Three read gates, in order, never skipped:** `canAccess(node, role)` → `showElement(element, role, ctx)` → `resolveTerm(term, ctx)`. Surface, then element, then word. `ctx` (carrying `arrival`, `isEntryNode`, `viewport`, `readerVocab`) is **mandatory** — never key off `role` alone or the one-flow-three-renderings architecture collapses into a tier-gated CMS.
> 3. **Read pipeline never mutates; write invariants never render.** Two doors, never crossed. The write invariants (acyclicity/firewall; no-vocab-write-without-confirmed-span; single delete path on person-data only; `verdict_in` gated on external encounter) live in Supabase edge functions and re-validate on every write.
> 4. **Computed, never stored as truth.** Depth, structural load, the "leads to" rail, grounding load — derived by the engine. They may be *cached at write-time* and re-derived, but never hand-assigned.
> 5. **There is no front door.** No marketing homepage. A visitor arrives mid-thought on a continuation; the home page is reached by *exiting* one. Do not add a landing/hero/funnel page.
> 6. **No delete path for corpus, anywhere.** The only deletion operation in the system erases person-data (PII/billing/raw events). Corpus (continuations, constructions, builder nodes, forum posts, the graph) is never deletable; conduct is *withdrawn* (suppressed + logged as residue), never deleted.
> 7. **Public copy is the author's voice.** Never generate public-facing philosophical prose (continuations, essays, share lines). Those fields are authored by A Reflection. You build the containers and the System/Threshold-register copy only. The banned-word list is a build lint, not a guideline.
> 8. **Cite the spec, test against the prototype.** Each task names the spec(s) it obeys and the prototype behavior it must reproduce. Reproduce behavior; re-skin to the crest register; do not invent UX.
> 9. **Roles are registers, not permission sets.** Free = a clean transmission surface, apparatus deferred. Continuations = honesty (verdict + the wall) without engine telemetry. Builder = the instrument with its data visible. Architect = Builder + the console. Never render one role's chrome to another.
> 10. **When uncertain, conceal and flag — do not expose.** Surface the ambiguity to the architect; never resolve it by showing more.

---

## PART A — THE COMPLETE BUILD SCHEMA (the vision, enumerated)

### A1 · The concepts that must survive (the invariants)

| Concept | What it means in the build | Governing spec |
|---|---|---|
| Nothing completes | top stage `on_graph` = permanent-and-open; the open column is asserted never-empty | Everything §1, §4.3 |
| No self-certification | `verdict_in` only via an external-encounter event; nothing internal mints it | Everything §0; Contribution |
| The firewall | `depends_on` strictly acyclic; a cycle is refused at write, offered reroute to `pulls_to` | Everything §4.3 |
| The inversion | no front door; arrive mid-thought; home reached by exit | Everything §2 |
| Two geometries + observed | construction DAG (`rests_on`); encounter flow (`pulls_to`); append-only event log | Everything §4.2 |
| Three reader geometries | dependency (access), composition (elements), vocabulary (words) | Composition; Lexicon |
| Residue / ghost floor | what is deposited persists; no delete for corpus | Everything §1; Permanence |
| Roles as registers | Free / Continuations / Builder / Architect = four surfaces, not four permission levels | Composition |
| Meaning sequenced, not simplified | `resolveTerm` defers/teaches; never dumbs down | Lexicon; Surface-Sweep |
| Transmission not retention | telemetry measures intelligibility-carried, never time-on-site | Telemetry §0 |
| Arrival-adaptive | `arrived_from` flips composition (rigor-first vs transmission-first) | Composition; SEO |

### A2 · The data model (Supabase tables — Prompt P2)

`thread` (A-page/continuation; IS a node) · `construction` (B-page; IS a node) · `membrane` (in-prose pointer to a construction) · `edge(source,target,type∈{rests_on,pulls_to})` · `event` (append-only third geometry) · `map_entry` (atlas) · `term` + `term_edge` (lexicon graph) · `user` (auth/identity — PERSON) · `subscription` (Stripe state — PERSON) · `forum_post` · `removal` (conduct audit) · `share_line` (field on node). **Node fields** (Everything §4.1): id, label, kind, content_home, content_reaches, substrate, register, rests_on, pulls_to, stage, verdict, verdict_source, refuter, depth(computed/cached), author(handle), engagement, presence, conduct_status, determination, flags, body(TipTap), share_line. **Two data classes:** CORPUS (permanent) vs PERSON (erasable) — Permanence §1.

### A3 · The roles / registers (Composition §1)

Free (transmission surface, apparatus deferred) · Continuations $24.99 (honesty, no telemetry) · Builder $59.99 (the instrument + own slot, upload-only/append-only) · Architect (single admin: Builder + console + governance; dual prose input). Patron = contact route, not a tier.

### A4 · The pages / routes

`/t/[slug]` continuation · `/c/[slug]` construction · `/` home (exit-reached) · `/map` atlas · `/events` Deep Read · `/about` · `/forum` · `/account` · `/architect` (A only) · `/builder` (Builder/A) · gates (read/contribution/email modals) · cold-gate. Nav is **derived** (queries), sitemap **derived**, wing appears only when its construction exists.

### A5 · The components

Top bar (role-register nav) · breadcrumb/route strip (Builder+) · invariant strip (Builder+) · footer (constitution line) · arrival banner · continuation prose + **membrane** (tap-to-peek) · **honest ledger** (verdict + the wall; arrival-deferred) · **three rails** (grounds/connects/leads-to; leads-to computed) · frontier prompt · gates/locks · tier cards · why-ledger · structural-load ranking · firewall-reroute · review inbox · encounters band · map cards · forum + removal log · account/constitution copy. Six render states: Full/Honest/Plain/Locked/Deferred/Hidden.

### A6 · The engine (read funcs ported to TS; computed-on-write) + write invariants

Read/derive: `structuralLoad` · `assignDepth` · `findCycle` · `groundingLoad` · `reverseRail` · `components` · `openColumn` · `sealCheck`. Gates: `canAccess` · `showElement` · `resolveTerm`. Write invariants (edge functions): acyclicity check + reroute; confirmed-span-only GLOSS/vocab write; single person-only erasure; `verdict_in` external-gate; append-only builder write that cannot target canon; recompute-and-cache load/depth on commit (the why-ledger).

### A7 · The build-coverage matrix (nothing-missed checklist)

| Element | Spec | Prompt |
|---|---|---|
| render pipeline + SSR meta + edge skeleton | Everything; SEO; all | **P1** |
| tables + RLS + corpus/person classes | Everything §5; Permanence | **P2** |
| engine TS + compute-on-write + why-ledger | Everything §4.4; (Gap-A) | **P3** |
| crest design tokens + a11y/contrast + motion | Everything §16; Device §2 | **P4** |
| `showElement` matrices + viewport axis + 6 states | Composition; Device | **P5** |
| `term`/`resolveTerm` + binding rule + readerVocab | Lexicon | **P6** |
| templates (~9) + derived nav/routes | Everything §3,§5 | **P7** |
| reader: rails + ledger + frontier + membrane | Everything §7; Composition; Device | **P8** |
| subscription: Stripe + gates + Patron + cancel | Everything §6; Permanence | **P9** |
| architect console + dual prose input + inbox + withdrawal | Everything §8; Contribution | **P10** |
| builder admin + flag-rides-along + render-by-state + residue | Everything §9; Contribution | **P11** |
| forum + removal audit | Everything §10 | **P12** |
| map/atlas + "what it owes" + basins | Everything §11 | **P13** |
| telemetry: capture + dashboards + the razor | Telemetry | **P14** |
| SEO: per-page meta (SSR) + share_line + sitemap | SEO | **P15** |
| permanence: person-erasure fn + disclaimer + 3 leavings | Permanence | **P16** |
| seed graph.json + wire wedge + entering-wing launch | Everything §15 | **P17** |

---

## PART B — THE PROMPT SEQUENCE

*Each prompt: prepend §0. Build only what's listed. Verify acceptance before the next. Format is paste-ready.*

> **EXECUTION ORDER (do not run as one firehose).** Prompt numbers are stable identities (referenced by the coverage matrix and by `Depends on`); **execution order is by batch, below.** The order is **P1–P8 → P14 → P9 → P10–P13 → P15 → P16 → P17.** Telemetry (P14) runs **before** commerce (P9) on purpose: a gate distorts the signal, so encounter-failure must be visible *before* the gates start filtering it — and P9's gates emit into the already-live event log from the moment they exist.
>
> **BATCH DISCIPLINE (the rule that makes "build it properly" hold).** Run one batch, then **stop and verify every Acceptance line in it before the next** — that is where drift is caught while it is still one line, not surgery under sixteen modules. **Re-paste §0 at the start of every batch session** (agent context drifts; without it the deny-by-default instinct is gone and you get a normal SaaS panel). Watch **P1** (SSR meta — confirm with JS off) and **P5** (the `viewport` axis across phone/tablet/desktop — the iPad case is the one naive responsive breaks) hardest; they are the two an agent will "simplify" away. **P17 is content-gated, not code-gated — it stops being the agent's job and becomes yours** (the wedge prose is under the AI-prose ban; the agent must never generate it).
>
> | Batch | Prompts | Verify before moving on |
> |---|---|---|
> | 1 — foundation | P1 · P2 · P3 · P4 | SSR head server-true (JS off); RLS blocks corpus delete; commit recomputes load + why-ledger; AA contrast |
> | 2 — the gates | P5 · P6 | composition matrix exact per role; viewport correct on phone/tablet/desktop; `inverts` terms gloss only where author-marked |
> | 3 — templates + reader | P7 · P8 | **walk the reader surface on phone, tablet, AND desktop**; cold arrival = transmission-first; membranes tap-to-peek |
> | 4 — the instrument | **P14** | events logging append-only before any gate exists; nothing telemetric renders to a reader |
> | 5 — commerce | **P9** | gates fire AND emit `gate_hit`/`gate_abandon` into the live log; lapse ≠ erasure |
> | 6 — admin + builder | P10 · P11 | dual prose input graphs; withdrawal suppresses+logs+persists; builder can't touch canon; no delete anywhere |
> | 7 — surfaces | P12 · P13 | conduct-not-content removal; "what it owes" Continuations+ only |
> | 8 — shareable + lawful | P15 · P16 | shared `/t/` previews correct with JS off; erasure leaves corpus under handle |
> | 9 — seed + launch | P17 | **the entering-wing walk passes on phone / tablet / desktop** (your wall) |

### PHASE 0 — THE GATE (yours; non-code; blocks external launch, not the build)

Confirm active-duty pseudonymity clearance + DOPSR prepublication review. Freeze Book One v1.0 (§53 + Parts VI–VIII). Author the entering-wing content (the wedge continuation + its construction + their share lines + the wedge's lexicon-seed glosses). Building may proceed in private now; **planting the wedge is gated on this.**

---

### PHASE A — FOUNDATION

**P1 · The spine: render pipeline + read gates + write skeleton**
> **Builds:** a Vite-React SPA **with server-true `<head>`** — set up SSR or prerender/edge-function meta injection per route (do NOT rely on client-side meta; scrapers don't run JS). Supabase project init (Postgres + Auth + edge functions). Implement the three read gates as the central render pipeline — `canAccess(node,role)`, `showElement(element,role,ctx)`, `resolveTerm(term,ctx)` — wired in order with `ctx` mandatory, deny-by-default stubs returning `hidden/locked/plain/absent` for anything unmapped. Scaffold the write-invariant edge functions (empty but enforced): acyclicity check, confirmed-span vocab write, single person-erasure, `verdict_in` external-gate, append-only builder write.
> **Obeys:** §0 (all); Everything §0,§13; SEO §2 (SSR meta).
> **Invariants:** read pipeline pure (no mutation); write funcs re-validate on every call; SSR head per `/t/`,`/c/`.
> **Do NOT:** add a homepage/hero; set meta client-side only; let any gate default to "show."
> **Acceptance:** a `/t/[slug]` request returns correct `<title>`/OG in raw HTML (curl, JS off); an unmapped element renders nothing; gates run in order.
> **Depends on:** Phase 0 not required to start building.

**P2 · Data model + RLS + the two data classes**
> **Builds:** all A2 tables with the full node-field set; `edge` table for the reverse-query; `event` append-only; `term`/`term_edge`; `removal`. RLS enforcing **CORPUS = world/tier-readable, never user-deletable** and **PERSON = owner-readable, erasable via the one edge function**. Attribution by **handle** (PII-free), not identity.
> **Obeys:** Everything §5; Permanence §1,§3.
> **Invariants:** no user-facing delete on corpus rows; the only delete touches person rows.
> **Do NOT:** attribute corpus to email/identity; create a second delete path.
> **Acceptance:** RLS blocks a corpus delete from any client; person-erasure leaves corpus rows intact under handle.
> **Depends on:** P1.

**P3 · The engine in TS, computed-on-write + the why-ledger**
> **Builds:** port protocol.py functions to TS. Run them **at write-time** in the commit edge function; **cache** load/depth/reverse-rail as fields, re-derivable, invalidated on any edge write. The why-ledger = the commit recompute, rendered as proof-steps (captured X · firewall result · which grounds gained load · depth-tier crossings · seal-risk · which reverse-rails updated).
> **Obeys:** Everything §4.4; §0 rule 4.
> **Invariants:** depth/load never hand-set; recompute fires on every structural write.
> **Do NOT:** compute load on read (won't scale); store a hand-typed depth.
> **Acceptance:** committing an edge updates cached load on affected nodes and emits a correct why-ledger; a cycle is refused with reroute offered.
> **Depends on:** P1, P2.

**P4 · The design system (crest register) + accessibility floor**
> **Builds:** one tokens file — palette (Stage #0B0A08 · Bone #E9E4D8 · Gold #C9A227 · Steel #8FA7B3 · Seal #B3261E), type (Playfair Display / Spectral / IBM Plex Mono), the component primitives (card, rail, membrane, tag, btn, eyebrow), motion + `prefers-reduced-motion`. Accessibility floor: focus rings, ≥44px taps, screen-reader labels, **Gold is decorative/large-only — never body text** (fails AA small).
> **Obeys:** Everything §16; Device §2.
> **Do NOT:** use Gold for body copy; ship hover-only affordances.
> **Acceptance:** AA contrast on all body text; full keyboard nav; reduced-motion honored.
> **Depends on:** P1.

---

### PHASE B — THE GATES (the screen + word layers)

**P5 · Composition layer — `showElement` matrices + viewport axis**
> **Builds:** `showElement` as a **data-driven lookup** over the Composition §3 matrices, keyed `(element, role, ctx)` with `ctx.viewport ∈ {mobile,tablet,desktop}` and `ctx.arrival`. The six states (Full/Honest/Plain/Locked/Deferred/Hidden); the arrival flip (Deferred→Full for rigor); the entry-node free-read rule. Device behaviors: rails stack on mobile, membrane = tap-to-peek, consoles desktop-first/mobile-graceful, invariant+route strips Builder+ only.
> **Obeys:** Composition (all); Device §1.
> **Invariants:** unmapped element → Hidden; reader never sees engine telemetry/route/ids.
> **Do NOT:** key off role alone; render the invariant strip to Free/Continuations.
> **Acceptance:** walking Free/Continuations/Builder shows the §3 matrix exactly; **layout resolves correctly on phone, tablet, AND desktop** (the tablet/iPad case explicitly — neither the mobile stack nor the desktop columns by default); the §4 crossover leaks are gone.
> **Depends on:** P1, P4.

**P6 · Lexicon layer — `resolveTerm` + the binding rule**
> **Builds:** `term`/`term_edge` usage; `resolveTerm(term,ctx)` returning BARE/GLOSS/PLAIN/DEFER/SUPPRESS per Lexicon §E; the term-DAG `earned()` check; **the binding rule (§B′): `collision:inverts` terms are author-marked spans only — never string-matched; `mild` → architect review queue; `none` → auto-wrap; NO GLOSS event without a confirmed span.** `readerVocab` from the event log, **felt-not-counted** (never surfaced/tallied). Gloss verdicts (`untested/carried/derived`).
> **Obeys:** Lexicon (all); Telemetry (readerVocab).
> **Invariants:** no vocab write from a regex guess; readerVocab never rendered as a score.
> **Do NOT:** auto-wrap `inverts` terms; show a "words learned" UI.
> **Acceptance:** an `inverts` term only glosses where author-marked; a GLOSS fires only from a confirmed span; readerVocab is invisible to the reader.
> **Depends on:** P2, P3.

---

### PHASE C — TEMPLATES + READER

**P7 · The ~9 templates + derived navigation**
> **Builds:** `Thread`, `Construction`, `Home` (exit-reached), `Map`, `Events`, `About`, `Forum`, `Account`, `cold-gate`. Dynamic routes `/t/[slug]`, `/c/[slug]`. Each template receives `(node, role, ctx)` and **calls the pipeline; it never decides visibility itself.** Derived nav: "Now" list, wing-appears-when-construction-exists, all as queries.
> **Obeys:** Everything §3,§5,§7; Composition.
> **Do NOT:** let a template hardcode what to show; add a front door.
> **Acceptance:** every page renders via `canAccess→showElement→resolveTerm`; nav reflects data with no redeploy.
> **Depends on:** P5, P6.

**P8 · Reader experience + the membrane**
> **Builds:** the three rails (Descend into its grounds = `rests_on`; Connects to/Pulls toward = `pulls_to`; **Leads to = computed reverse**), each demoted to plain on the Free surface; the **honest ledger** (verdict + the wall it invites; **Deferred below the payoff for cold arrivals, Full for rigor**); the **membrane** as a TipTap node rendered as a tap-to-peek dashed link (word "membrane" never shown); the frontier prompt → gate. Transmission-first ordering: prose and payoff first, apparatus lower.
> **Obeys:** Everything §7; Composition; Lexicon; Device.
> **Invariants:** "leads to" never authored; ledger deferral honors `arrival`.
> **Do NOT:** put the full ledger atop the prose for a cold arrival; use `title=` for teasers (touch has no hover).
> **Acceptance:** a Free cold arrival sees prose→plain rails→deferred ledger; a rigor arrival sees the ledger up top; membranes work on tap; **walk passes on phone / tablet / desktop.**
> **Depends on:** P7.

---

### PHASE C+ — THE INSTRUMENT (BATCH 4 · runs before commerce)

**P14 · Telemetry — the feedback instrument** *(executed here, before P9; numbered P14 for stable cross-references)*
> **Builds:** event capture for every kind (arrival w/ `arrived_from`, read_depth, membrane_open, rail_follow, gloss_shown, gate_hit, gate_convert/abandon, frontier_reached, continue_pressed, exit_to_home, builder_upload); architect-only read dashboards for the §2 metrics (drop-off, exit-without-continue, gate-hit-without-convert, where readerVocab stalls, arrival-cohort climb). **The razor: measure intelligibility-carried, never retention; no streaks/nudges/dark patterns; never surfaced to readers as a score.** Pseudonymous actor; raw events = PERSON-class (erasable). **Install the event log live NOW, before any gate exists, so encounter-failure is visible before commerce filters the signal.**
> **Obeys:** Telemetry (all).
> **Invariants:** no retention-optimization metric; no reader-facing score; the log is live and append-only before P9.
> **Do NOT:** add notifications/streaks/time-on-site goals; expose events to other readers; wait for commerce to install it.
> **Acceptance:** the reader walk from batch 3 emits correct events to an append-only log; dashboards answer the §2 questions; nothing telemetric renders to a reader.
> **Depends on:** P3, P6, P8.

---

### PHASE D — COMMERCE, THEN ADMIN + BUILDER (BATCH 5 · P9, then BATCH 6 · P10–P11)

**P9 · Subscription** *(batch 5 — telemetry is already live from P14)*
> **Builds:** Stripe two priced tiers (Continuations $24.99, Builder $59.99); the **read gate** (Free on non-entry continuation/any construction) and **contribution gate** (Free+Continuations at a frontier); Patron as a **contact route, not a checkout**; constitution copy in UI (cancel anytime · continuations stay yours · guardian can't remove them); one-click cancel; owned-materials persistence; export-as-rows. **Each gate emits `gate_hit` and `gate_convert`/`gate_abandon` into the live P14 event log on first render**, so the price-vs-meaning distinction is captured from the first paying reader.
> **Obeys:** Everything §6; Permanence (cancel ≠ erasure); Telemetry (gate events).
> **Do NOT:** make Patron a checkout; conflate lapse (lose reading) with erasure (lose PII); ship a gate that doesn't emit its events.
> **Acceptance:** Free→read gate→Continuations unlocks spine reading; frontier→contribution gate→Builder; cancel keeps owned materials; **gate events appear in the event log.**
> **Depends on:** P5, P7, P14.

**P10 · Architect console + dual prose input + inbox + withdrawal**
> **Builds:** single-admin TipTap console. **Hybrid prose input: (a) type in the console, (b) upload a manuscript — both ingest to a node's `body`, structure-fields and body-field as separate commits joined by id.** The 8-field capture; the why-ledger (from P3); live structural-load ranking; firewall block + one-click reroute; the **review inbox** (query of `engagement=unread` builder nodes — a signal, not a gate); the **conduct-withdrawal** action (suppress + log reason; persists as residue; orthogonal to the engagement ladder).
> **Obeys:** Everything §8; Contribution §1,§3; Permanence.
> **Invariants:** structure and prose are separate commits; withdrawal logs conduct reason, never deletes.
> **Do NOT:** let the console gate builder publication; implement withdrawal as delete.
> **Acceptance:** both prose paths produce a graphable node; withdrawal suppresses+logs+persists; inbox is a query.
> **Depends on:** P3, P6, P7.

**P11 · Builder admin & governance**
> **Builds:** the builder **minimum admin — upload-only, append-only, own-slot-only**; a builder write **cannot target a canonical node** (creates a new node resting on a frontier). Encounters band (builder sees own; architect sees all). **Flag-rides-along publication** (public-immediately at `unread`, attributed); **render-by-engagement-state** (an `unread` node renders provisional, never canonical authority); leave-with-residue (mark departed keeps node + records determination); **no delete button anywhere**; the rate floor (per-builder limits, new-builder provisional window).
> **Obeys:** Everything §9; Contribution §1,§2,§4,§5.
> **Invariants:** append-only; can't touch canon; no corpus delete.
> **Do NOT:** give builders edit/typing rights; gate their publication behind review; let `unread` render as canon.
> **Acceptance:** builder upload appears immediately as provisional; flag upgrades framing not existence; departed node persists as residue.
> **Depends on:** P5, P10.

---

### PHASE E — SURFACES (BATCH 7)

**P12 · Forum + removal audit**
> **Builds:** free, email-gated forum; the **deletion constitution that binds the guardian** — conduct removable, content never; every removal writes a `removal` row with the **conduct** reason (never content). Removal audit visible to Architect only; conduct-banner visible to all.
> **Obeys:** Everything §10; Contribution §3.
> **Do NOT:** allow content removal; expose the removal log to readers.
> **Acceptance:** a removal requires + logs a conduct reason; content is never deletable.
> **Depends on:** P5, P9.

**P13 · Map / Atlas**
> **Builds:** the atlas as a query over `map_entry`; verb-tags (dissolves/diagnoses/reframes/applies); **"what it owes" (Continuations+ only)**; built/coming per wing (walkable only when its construction exists); optional basin clustering layout.
> **Obeys:** Everything §11; Composition (the "what it owes" gate).
> **Do NOT:** show "what it owes" to Free; show a wing as walkable without a construction.
> **Acceptance:** Free sees domain·state·walk-it; Continuations sees the debt; coming wings aren't walkable.
> **Depends on:** P5, P7.

---

### PHASE F — SHAREABLE + LAWFUL (BATCH 8)

**P15 · SEO & shareability**
> **Builds:** per-page-type meta via the P1 SSR/prerender pipeline (continuation, construction[teaser-only], home, public pages); **author-owned `share_line`** per continuation (never machine-truncated); JSON-LD CreativeWork (author = the handle); **derived sitemap**; robots (disallow admin/builder/account/gated bodies); **gated content never appears in any preview, even to bots**; `arrived_from` from referrer/UTM feeds arrival.
> **Obeys:** SEO (all); Permanence (handle as author).
> **Invariants:** head is server-true; gated body never previews; share_line authored.
> **Do NOT:** preview gated content; auto-truncate a share line; client-only meta.
> **Acceptance:** a shared `/t/` link previews correct title+share_line+image with JS off, and the landing renders correctly on phone / tablet / desktop; a `/c/` link previews teaser only.
> **Depends on:** P1, P7.

**P16 · Data permanence & erasure**
> **Builds:** the **single person-erasure edge function** (deletes/anonymizes identity, billing, raw events; retains corpus under handle, decoupled); the contributor **disclaimer** surfaced at signup and first contribution (corpus permanent under handle; PII erasable); the three-kinds-of-leaving handled distinctly (lapse / depart / erase); ToS·privacy·refund surfaces (purpose = sequencing+gloss-verification, no ads, no sale).
> **Obeys:** Permanence (all).
> **Invariants:** erasure touches person-data only; corpus persists under handle.
> **Do NOT:** delete corpus on erasure; conflate withdrawal with erasure.
> **Acceptance:** erasure removes PII, leaves corpus attributed to handle; disclaimer shown before first contribution.
> **Depends on:** P2, P9. *(Have counsel review the GDPR/CCPA implementation.)*

---

### PHASE G — SEED + LAUNCH (BATCH 9)

**P17 · Seed + entering-wing launch**
> **Builds:** load `graph.json` + the register content into the tables; seed the System-surface lexicon rows (from the Surface-Sweep) and the entering-wing term glosses; wire the **wedge continuation `/t/could-it-suffer` to its construction `/c/...`** (A+B), crossable day one; forum live; subscription live. Then the launch act (yours): **plant the wedge on LessWrong + EA Forum, same day, in A Reflection's own voice.** Breadth grows by return — every expansion gated on an external return that pushed back and held.
> **Obeys:** Everything §15; Voice (AI-prose ban on the wedge).
> **Do NOT:** launch breadth; auto-generate the wedge essay.
> **Acceptance (the launch wall):** a stranger can arrive on the wedge, read, descend through the membrane to the construction, hit the gates, exit to home, and (Builder) continue — **verified on phone, tablet, AND desktop**, with a correct share preview and the apparatus not leaking too early. Telemetry recording. Then watch the sentence where they stop. **This prompt is content-gated: the wedge prose is yours; the agent builds the wiring, never the words.**
> **Depends on:** all prior; Phase 0 cleared for the public plant.

---

## §FINAL · THE ONE LINE

Build the receiver module by module and test each against the prototype before the next: the spine first (render pipeline, the three deny-by-default read gates, the write invariants), then the engine computed-on-write, then the screen and word layers, then templates and the reader, then commerce and the two admin surfaces, then the forum, atlas, instrument, and shareable surface, and finally the seed and the entering wing whole — and at every step the agent obeys the standing preamble, because this site is built to do the one thing conventional defaults can't: carry the work honestly to the edge of an encounter it cannot itself close.
