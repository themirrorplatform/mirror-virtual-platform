# The Mirror Platform — The Device & Access Spec

### Compatible with any device, any platform, any body. Composition keys off viewport as well as role, the reader surface is device-equal while the instrument is device-graceful, and nothing that carries meaning depends on hover.

*Architect: Ilya Belous ("A Reflection") · The Mirror Platform LLC. Adds a viewport axis to the Surface-Composition Schema's `showElement`, and folds in the accessibility essentials (same "any platform / any body" concern). Most LessWrong/Substack arrivals are mobile, so the reader surface is mobile-first by necessity. §0–§2 frozen; breakpoints provisional.*

---

## §0. THE GOVERNING RULE

**The reader surface is device-equal; the instrument surface is device-graceful.** A stranger almost always arrives on a phone, through a shared link — so the full transmission experience (prose, membranes, rails, gates, the climb) must be *first-class on mobile*, not a degraded port. The architect/builder consoles, where real authoring happens, are *desktop-first* but must remain usable — never broken — on a phone. And the binding floor under both: **no information that carries meaning may depend on hover**, because touch has no hover. Composition therefore resolves on `(role, ctx, viewport)`, not role alone.

---

## §1. THE VIEWPORT AXIS (frozen) — `showElement` gains a dimension

```
showElement(element, role, ctx)   // ctx now carries: arrival, isEntryNode, viewport
  viewport ∈ { mobile, tablet, desktop }
```

Per-element device behavior (what changes on small screens):

| Element | mobile | desktop |
|---|---|---|
| **Three rails** | **stacked / single "where this goes" sheet** — collapse from side-by-side; tap to expand | side-by-side, as specced |
| **Membrane** | **tap-to-peek** (teaser is a tap-revealed sheet) — **never a hover title** | hover teaser + tap to descend |
| **Honest ledger** | collapsible; verdict line visible, the wall expandable | full, inline |
| **Top nav** | hamburger / bottom sheet | inline bar |
| **Gates (modals)** | full-screen sheets | centered modal |
| **Invariant strip** (Builder+) | wraps or collapses to a single chip | full strip |
| **Architect console** | **read-first**: ranking + why-ledger viewable; capture simplified or deferred to desktop | full authoring surface |
| **Builder slot** | upload works on mobile (it is the builder's one verb); inbox viewable | full |
| **Manuscript upload** (architect) | available; large-doc ingest may warn "best on desktop" | full |

The principle in one line: **the reader gets the whole climb on a phone; the architect gets the whole instrument on a desktop and a working-but-spare version on a phone.**

---

## §2. TOUCH, INPUT & ACCESSIBILITY (frozen floor)

The "any platform" rule and the "any body" rule are the same concern; both are non-negotiable acceptance criteria:

- **No hover-only meaning.** Every membrane teaser, rail label, and tooltip is reachable by tap and by keyboard focus. (This is also why membrane teasers are content, not `title` attributes.)
- **Tap targets** ≥ 44px; rails and membranes are comfortably tappable.
- **Keyboard navigable.** Full tab order; visible focus rings (the prototype's `:focus-visible` steel outline is the baseline); gates trap focus and close on Escape.
- **Screen-reader semantics.** Membranes and rails are real links/buttons with descriptive labels ("descend into the grounds of [title]"), not bare spans; the ledger's verdict and wall are announced; the route/invariant strips are `aria-hidden` for readers (they are Builder+ data anyway).
- **Contrast.** The crest palette must pass WCAG AA for body text: Bone on Stage passes; **Gold (#C9A227) on Stage is decorative/large-only — never body text** (it fails AA at small sizes). Steel and Bone carry the readable copy.
- **Reduced motion.** Honor `prefers-reduced-motion` (the prototype already disables the fade/slide transitions under it).
- **Type scaling.** Respects OS text-size; layout reflows, never clips.

---

## §3. PERFORMANCE & PLATFORM REACH

- **Reads are light by design.** Load/depth/rails are computed at write-time and stored (the resolved Gap-A: the admin writes, the engine derives on commit), so a mobile read is a plain fetch — no per-read transitive closure. This is what makes the reader surface fast on a phone.
- **Responsive web covers "any platform."** A single responsive SPA serves phone, tablet, desktop. **PWA / installability is optional**, not required — note it as a later enhancement (offline reading of owned continuations would be on-constitution), not a launch blocker.
- **Shared-link landing** (the dominant mobile entry) must render the continuation fast and meta-correct — see the SEO Spec (the SSR/prerender requirement is also what makes the mobile first-paint quick).

---

## §4. THE ONE LINE

Because the stranger arrives on a phone and the architect authors on a desktop, composition resolves on viewport as well as role — the reader gets the entire climb mobile-first and first-class, the instrument is desktop-first but never broken on a phone, and beneath both runs one floor that admits any body as well as any device: nothing that carries meaning hides behind hover, every relation is tappable and focusable and announced, and the palette stays readable — so "any device, any platform" and "any reader" are the same commitment, enforced as acceptance criteria, not hoped for as polish.
