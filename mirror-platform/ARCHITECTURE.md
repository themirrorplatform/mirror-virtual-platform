# The Mirror Platform — Architecture Decisions (for sign-off)

Status: **proposed, awaiting your sign-off.** No platform code is written yet. The
live Deep Read on mirrorplatform.online is untouched and stays up until cutover.

This doc locks the cross-cutting choices the build plan leaves open, so Batch 1
(P1–P4) doesn't drift. Each decision cites the rule it serves. Push back on any of
these before I write code.

---

## D1 — Rendering & the server-true `<head>` (the biggest choice)
**Decision (proposed): Next.js (App Router) with server-side rendering, deployed on
Netlify.** Reader pages render on the server, per role.

Why, not the lighter "Vite SPA + edge meta-injection" path:
- §0 rule 1 (**deny by default**) + P15 (**gated body never previews, even to bots**)
  are *structurally* satisfied by SSR: gated content is never sent to an
  unauthorized client at all. With a client SPA, the body ships to the browser and
  is hidden by JS — weaker, and a leak risk.
- The three read gates (`canAccess → showElement → resolveTerm`) want to run
  **server-side per request** with `ctx` (role, arrival, viewport). App Router
  server components are the natural home for that pipeline.
- Server-true `<title>`/OG/JSON-LD per `/t/` and `/c/` (P1, P15) is first-class.

**Cost / tradeoff:** the WebGL crest + motion engine become **client components**
(`"use client"`), not the whole app. We re-home the existing Three.js/motion craft
as islands inside SSR pages. Real work, but the craft carries over.

**Documented alternative (if you'd rather minimize migration):** keep the Vite SPA
and inject per-route `<head>` via a Netlify Edge Function. Lighter, reuses more, but
gates run client-side (weaker deny-by-default). I recommend against it for a
platform of this ambition.

## D2 — Hosting & coexistence (you chose: keep Deep Read live)
- The Mirror Platform builds on a **separate Netlify site** with a **staging URL**
  (e.g. `mirror-platform.netlify.app`, optionally `staging.mirrorplatform.online`).
- `mirrorplatform.online` keeps serving the current Deep Read until the entering
  wing passes the launch wall (P17), then we cut the domain over.

## D3 — Repo layout
- New top-level directory **`mirror-platform/`** in this repo. The existing
  `deep-read-react/` (live site) is **not touched**.

## D4 — Supabase
- **New, dedicated Supabase project** for the platform (clean separation; the Deep
  Read keeps its own project with the witness data).
- **Auth:** Supabase Auth. **Roles** (Free / Continuations / Builder / Architect)
  derived from Stripe subscription state + a single `architect` flag (you).
- **Write invariants** = Supabase **edge functions** (acyclicity/reroute,
  confirmed-span vocab write, single person-erasure, `verdict_in` external-gate,
  append-only builder write). These re-validate on every write (§0 rule 3).

## D5 — Commerce
- **Stripe**, two priced tiers (Continuations $24.99, Builder $59.99). **Patron =
  a contact route, not a checkout** (A3). Gates emit telemetry (P9 ⇄ P14).

## D6 — Aesthetic ("Lusion craft", crest register)
- **Crest design tokens (P4):** Stage `#0B0A08` · Bone `#E9E4D8` · Gold `#C9A227`
  (large/decorative only — never body) · Steel `#8FA7B3` · Seal `#B3261E`; type
  Playfair Display / Spectral / IBM Plex Mono.
- **Lusion-grade motion lives on the reader surfaces** (crest, membrane tap-to-peek,
  rails, ledger, page transitions) as client islands — **not** a front-door funnel
  (§0 rule 5: no landing/hero). Reuse the current WebGL crest + motion engine.
- Accessibility floor: AA contrast on body, focus rings, ≥44px taps,
  `prefers-reduced-motion`.

## D7 — Content & the prose ban (§0 rule 7)
- I build **containers, gates, animations, and System/Threshold-register copy only.**
- **All philosophical prose** (continuations, essays, share lines, glosses) is
  authored by you (A Reflection). The banned-word list is wired as a **build lint**.
- **Phase 0 is yours** (clearance/DOPSR + authoring the wedge). Building proceeds
  privately now; planting the wedge (P17) is gated on it.

## D8 — Process
- **Batch discipline:** run one batch, verify **every** Acceptance line before the
  next. §0 preamble re-pasted at the start of every session. Each batch verified
  against the prototype, headless, on phone/tablet/desktop where the plan demands.

---

## ⚠ Two prerequisites that block Batch 1

**PR1 — The source materials.** §0 rule 8 forbids inventing UX ("test against the
prototype; do not invent UX"). To build faithfully I need:
- `protocol.py` and `graph.json` (the engine + seed) — required for P3, P17.
- `MirrorPlatform.jsx` (the prototype) — the behavior to reproduce.
- The specs that define the matrices/rules: **Everything, Composition, Lexicon,
  Telemetry, Device, Permanence, Contribution, Voice, SEO.** At minimum the
  Composition §3 matrices and Lexicon §B′/§E rules — without them P5/P6 are guesswork.

Drop them in the repo (e.g. a `mirror-platform/_source/` folder) or paste them.

**PR2 — Supabase access.** A new project + a **Personal Access Token (`sbp_…`)** so I
can run migrations and deploy edge functions end-to-end. (Alternative: you run each
migration in the dashboard and deploy functions — slower, more back-and-forth.)

---

## Batch 1 — what I build once the above are in place (P1–P4)

- **P1 — Spine.** Next.js App Router + Netlify; Supabase project init; the three
  read gates as the central server pipeline (`canAccess → showElement → resolveTerm`,
  `ctx` mandatory, deny-by-default stubs → hidden/locked/plain/absent); write-invariant
  edge-function stubs (enforced, empty). **No homepage/hero.**
  - *Accept:* `curl /t/[slug]` returns correct `<title>`/OG in raw HTML (JS off);
    unmapped element renders nothing; gates run in order.
- **P2 — Data + RLS.** All A2 tables with full node fields; `edge`, `event`,
  `term`/`term_edge`, `removal`. RLS: **corpus = world/tier-readable, never
  user-deletable**; **person = owner-readable, erasable via the one function**.
  Attribution by **handle**, not identity.
  - *Accept:* client corpus-delete blocked; person-erasure leaves corpus under handle.
- **P3 — Engine in TS, computed-on-write.** Port `protocol.py`
  (`structuralLoad/assignDepth/findCycle/groundingLoad/reverseRail/components/
  openColumn/sealCheck`); run at write-time in the commit edge function; cache
  load/depth/reverse-rail, re-derivable; the why-ledger as proof-steps.
  - *Accept:* committing an edge updates cached load + emits a correct why-ledger; a
    cycle is refused with reroute offered.
- **P4 — Crest design system + a11y floor** (D6 tokens + primitives + motion).
  - *Accept:* AA on body text; full keyboard nav; reduced-motion honored.

---

## What I need from you to start
1. **Sign off** (or amend) D1–D8 — especially **D1** (Next.js SSR vs the lighter
   SPA+edge alternative).
2. **PR1:** the source materials (specs + `protocol.py` + `graph.json` +
   `MirrorPlatform.jsx`).
3. **PR2:** a new Supabase project + `sbp_` token (or agree to dashboard runs).

Give me those and I start Batch 1 on the staging site, live Deep Read untouched.
