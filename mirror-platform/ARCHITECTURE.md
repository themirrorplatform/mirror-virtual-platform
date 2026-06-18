# The Mirror Platform — Architecture Decisions (for sign-off)

Status: **proposed, awaiting your sign-off.** No platform code is written yet. The
live Deep Read on mirrorplatform.online is untouched and stays up until cutover.

This doc locks the cross-cutting choices the build plan leaves open, so Batch 1
(P1–P4) doesn't drift. Each decision cites the rule it serves. Push back on any of
these before I write code.

---

## D1 — Rendering & the server-true `<head>` (settled by the spec)
**Decision: Vite-React SPA + Netlify Edge Function for per-route server-true
`<head>`/OG/JSON-LD.** This is what the Build Plan (P1) and Device Spec (§3)
specify — *"a Vite-React SPA with server-true `<head>`"*, *"a single responsive SPA
serves phone, tablet, desktop"* — and what the `MirrorPlatform.jsx` prototype is
written in. Per §0 rule 8 I build to the spec, not to my own framework preference.

Why this satisfies the security model **without** server-rendered bodies:
- **Deny-by-default lives at the RLS layer (P2), not in client JS.** The database
  will not return a gated body to an unauthorized role, so gated content **never
  reaches the client** — it isn't *served*, not merely hidden. That is §0 rule 1
  enforced at the data door, stronger than client-side hiding.
- **Server-true previews** come from the edge function reading the node and writing
  `<title>`/`share_line`/OG/JSON-LD into the HTML before it ships — so scrapers
  (which don't run JS) get correct previews, and a gated `/c/` previews teaser-only
  (P15). The gated body is never in the served HTML or the API response.
- The three read gates (`canAccess → showElement → resolveTerm`) run client-side as
  the **composition** pipeline over data RLS already permitted — they decide *how*
  to render, never *whether* you're allowed the bytes. Allowance is RLS's job.

**Performance fit (Device §3):** load/depth/rails are computed at write-time and
cached (P3), so a mobile read is a plain fetch — no per-read graph closure.

*(Earlier draft proposed Next.js full-SSR; withdrawn — it overrode the spec's stated
stack and the existing prototype. The RLS-layer gating above closes the same gap.)*

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

**PR1 — The source materials.** §0 rule 8 forbids inventing UX. Status as of
2026-06-18 — **enough to start Batch 1 (P1–P4); Batch 2+ still blocked:**

*Received:* Build Plan (the master) · Data-Permanence Spec · Device-Access Spec ·
**Lexicon Schema** · `protocol.py` (the engine) · **`MirrorPlatform.jsx` (the
prototype, with the slim corpus graph embedded)** · the Attempt Register.

*Still needed, and which batch each unblocks:*
- **Composition Schema** (§3 matrices) → blocks **P5 / Batch 2**. ← last Batch-2 blocker.
- ~~Lexicon Schema~~ → **received** (unblocks **P6 / Batch 2**).
- ~~Prototype `MirrorPlatform.jsx`~~ → **received** (the §0.8 test target; the whole
  reader flow, gates, console, why-ledger, and Flow-Verify behaviors to reproduce).
- **Telemetry Spec** → blocks **P14 / Batch 4**.
- **SEO-Shareability Spec** → refines **P15 / Batch 8** (P1 head skeleton is fine now).
- **Contribution-Conduct Spec** → blocks **P10–P12 / Batches 6–7**.
- **Everything Spec** + **Voice Spec / Surface-Sweep** → cross-cutting; Voice gives
  the banned-word lint (P4+) and the System/Threshold register copy.
- **Canonical `graph.json`** (the `protocol.py --seed` output) → hard-required for
  **P17 / Batch 9**. *Note:* the prototype embeds a **slim** subset; a faithful
  excerpt is vendored at `_source/graph.slim.json`, but the authoritative 358-node
  seed is generated by `protocol.py` from the register `.md` files — please drop the
  generated `graph.json` (and the register sources it reads) when convenient.

I have everything I need for **Batch 1**, and now the prototype to test it against.
**Composition Schema** is the only remaining blocker for Batch 2.

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
1. **Sign off** (or amend) D1–D8. D1 is now settled to the spec's stack (Vite-React
   SPA + edge head), so the only open architecture call is whether you accept D2–D8.
2. **PR2 — Supabase access:** a new project + `sbp_` token (or agree to dashboard
   runs) — needed for the Supabase parts of P1/P2/P3.
3. **Next specs:** Composition + Lexicon (to keep Batch 2 unblocked).

**I can start the Supabase-independent slice of Batch 1 immediately on your word:**
the engine port (**P3** — pure TS from `protocol.py`), the crest design tokens
(**P4**), and the client read-gate pipeline + repo scaffold (**P1**, minus the
Supabase init). The Supabase init, tables/RLS (P2), and the commit edge function
(P3) wire in the moment the `sbp_` token lands.
