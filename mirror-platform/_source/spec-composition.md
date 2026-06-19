# The Mirror Platform — The Surface-Composition Schema

### What each role actually witnesses on screen, element by element, page by page. The three reader schemas — Free / Continuations / Builder — set side by side. This is the third gate: not which pages you may enter, not which words appear in the prose, but which elements and labels render once you’re on the page.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. Companion to the Everything Spec (§5 data model, §6 tiers, §7–§9 experiences), the Voice Spec (registers), the Surface-Language Sweep, and the Lexicon Schema (`resolveTerm`). The matrices in §3 are **frozen** as the composition policy.*

-----

## §0. THE THREE GATES (why this one was missing)

|Gate|Grain|Decides|Status|
|---|---|---|---|
|`canAccess(node, role)`|**surface**|which pages/threads/constructions a role may enter at all|built (Everything §5/§6)|
|**`showElement(element, role, ctx)`**|**element / label**|which components and labels render on a page, and in which register|**this schema — the missing gate**|
|`resolveTerm(term, ctx)`|**word**|which terms in the prose appear bare / taught / plain / suppressed|built (Lexicon §E)|

**A role is a coherent register, not a set of permissions.** A Free reader is not “Continuations minus access” — they are a *different surface* that happens to share the prose. The crossover bug is what happens when an element forgets which register it’s speaking. `showElement` is the fix: composition is **derived from role, computed on read, never hand-authored per page.**

-----

## §1. THE ROLE MODEL

- **Free** — the stranger. Transmission-first; apparatus deferred. Sees the one continuation they arrived on, public pages, gates everywhere else.
- **Continuations** ($24.99) — committed reader. Spine open: every continuation + constructions beneath. Sees the **honesty** (verdict + the wall) but **not engine internals** (no load/depth/stage/seal, no raw edge names).
- **Builder** ($59.99) — operates the instrument. Everything Continuations sees, **plus the data layer where they work**: slot, encounters, raw edges, firewall result on their writes, why-ledger.
- **Architect** (single admin) — Builder’s surface **plus** the full console (§8) and all-encounters governance (§9). Cells differing for Architect are marked **[A]**; else Architect inherits Builder.

-----

## §2. THE STATE VOCABULARY (what a cell can say)

- **Full** — full strength, incl. data-layer detail (mono labels, numbers, raw edge names).
- **Honest** — verdict + *the wall it invites*, but **no engine internals**. The soul without the machine.
- **Plain** — demoted: plain label, no mono, no ids, no numbers (Surface-Sweep Bucket 1).
- **Locked** — gated preview: teaser + the lock, never the content.
- **Deferred** — present but placed **below the payoff**, and/or arrival-conditional (Full immediately for a rigor arrival).
- **Hidden** — not rendered at all.

-----

## §3. THE COMPOSITION MATRICES (the three schemas, adjacent)

### Global chrome (every page)

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Wordmark / home link · threshold|Full|Full|Full|
|Primary nav (Home·Atlas·Events·Forum·About·Account) · system|Plain|Plain|Plain|
|Admin nav (My slot · Encounters · Architect) · system|Hidden|Hidden|**My slot · Encounters**; **[A]** + Architect|
|Breadcrumb “← back” · system|Plain (title only)|Plain (title only)|Full (with route)|
|Raw route strip `route /t/slug` · data|Hidden|Hidden|Full|
|Invariant strip `firewall · open column · seal-risk · nodes N` · data|**Hidden**|**Hidden**|Full|
|Footer constitution line · threshold|Full|Full|Full|

### Entry continuation `/t/[entry]` — the arrival (must convert the stranger)

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Arrival banner “you arrived from X, mid-thought” · system|Plain|Plain|Plain|
|Title · threshold|Full|Full|Full|
|Prose · transmission (words via `resolveTerm`)|Full prose; words mostly **Defer/Plain**|Full; words **Gloss**|Full; words **Bare**|
|Membrane dashed link (word “membrane” never shown) · transmission|Plain (teaser)|Plain (teaser)|Full (+ target id on hover)|
|Honest ledger (verdict · wall) · system|**Deferred** (below payoff; Full only if arrival = rigor)|**Honest**|**Full** (+ stage)|
|Engine tags `stage · load · depth · seal-risk` · data|Hidden|Hidden|Full|
|Three rails · system|**Plain** (“Where this comes from · Connects to · What builds on this”; no mono sub, no ids, capped)|Plain **+ gloss** (term taught in-breath)|**Full** (mono sub `rests_on`/`pulls_to`, ids, “never authored”)|
|Frontier prompt · threshold→system|Plain (“This thought isn’t finished. Keep pulling on it?”)|+ “(§59)”, the unfinish named|+ the contribution mechanics|
|Exit-to-home · system|Plain|Plain|Plain|

### Other continuation `/t/[non-entry]`

|Element|Free|Continuations|Builder|
|---|---|---|---|
|Whole page|**Locked** (read-gate: title + first lines + lock)|as entry continuation|as entry continuation|

### Construction `/c/[slug]` — the B-page

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Whole page|**Locked** (read-gate)|open|open|
|Prose / gloss · transmission|—|Full (Gloss)|Full (Bare)|
|Header tags `home · load · depth` · data|—|**`home` only** (Plain); load/depth **Hidden**|Full|
|Honest ledger · system|—|**Honest**|**Full** (+ stage/seal)|
|Rails (Rests on · Leads to) · system|—|Plain **+ gloss**|**Full** (mono, ids)|

### Home `/` (reached by exiting)

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Recognition line “This place is philosophy…” · threshold|Full|Full|Full|
|Doorways · transmission|**Plain human questions** (*Could a machine feel anything? · Why does grief change what you can hear?*)|“Resume” + Atlas + the rest of the writing|+ Atlas + slot|
|CTAs · system|Plain (no “spine”/“root” jargon)|Plain|Plain|

### Map / Atlas `/map`

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Domain cards · threshold/system|Plain (domain · state · walk-it)|+ verb-tag (dissolves/diagnoses/reframes/applies)|Full|
|“What it owes” (the open debt) · system|**Hidden**|Full|Full|
|Basin / cluster layout · data|Hidden|Hidden|Full **[A]**|

### Events `/events` · About `/about`

|Element|Free|Continuations|Builder|
|---|---|---|---|
|All content (plain, public)|Full|Full|Full|

### Forum `/forum`

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Conduct-constitution banner · system|Full (visible even when gated)|Full|Full|
|Posts + compose · transmission|**Locked** (email gate)|Full|Full|
|Removal audit log (conduct reasons) · system|Hidden|Hidden|Hidden — **[A] only**|

### Account `/account`

|Element · register|Free|Continuations|Builder|
|---|---|---|---|
|Tier cards · system|Full (Free active; others as offers)|Full (Continuations = current)|Full (Builder = current)|
|Constitution copy (cancel · leaves with you · never removed) · system|Full|Full|Full|

### Admin surfaces

|Page|Free|Continuations|Builder|
|---|---|---|---|
|Builder slot `/builder` (insert · your encounters · engagement flags)|Hidden (contribution gate)|Hidden (contribution gate)|**Full** — *own* encounters; **[A]** all encounters + governance|
|Architect console `/architect` (8-field capture · why-ledger · load ranking · firewall reroute)|Hidden|Hidden|**Hidden** — **[A] only**|

### Gates (modals)

|Gate|Fires for|
|---|---|
|Read gate ($24.99)|**Free** on any non-entry continuation or any construction|
|Contribution gate ($59.99)|**Free + Continuations** at a frontier (“continue this thought”)|
|Email gate (free)|**Free** at the forum|
|*(none)*|Builder / Architect never see read or contribution gates|

-----

## §4. CROSSOVER AUDIT — what the prototype currently mis-shows (the leaks)

|Element|Leak (current)|Fix (per §3)|
|---|---|---|
|**Invariant strip** (`firewall · open column · seal-risk · nodes`)|shown to **all roles**|**Builder + Architect only.** A reader never sees engine telemetry.|
|**Raw route strip** `route /t/PoE`|shown to all roles|Builder+; Free/Cont get a plain “← back” only.|
|**Rail mono sub-labels**|shown to every reader|Free → **Plain** label only; Cont → Plain+gloss; Builder → Full mono.|
|**Construction header** `load · N dependents` + depth tag|shown to any accessor incl. Continuations|**Builder+ only.** Continuations sees `home` + prose + Honest ledger, no engine numbers.|
|**Honest ledger** on entry continuation|shown in full to a cold Free arrival|Free → **Deferred** (or Full if arrival=rigor); Cont → **Honest** (no stage); Builder → Full.|
|**Frontier “(§59)”** + “continue this thought →” into machinery|shown to Free|Free → plain prompt, no section cite, gate on tap.|
|**Map “what it owes”**|shown to all|Continuations+; Free sees domain · state · walk-it.|

Net: no element changes the *flow*; each changes *who witnesses which version of it.* The leaks are all the data/engine register bleeding onto the reader surface.

-----

## §5. THE POLICY FUNCTION (what the build calls)

```
showElement(element, role, ctx) -> state ∈ {full, honest, plain, locked, deferred, hidden}
  ctx = { arrival,        // arrived_from — flips ledger Deferred→Full for rigor arrivals
          isEntryNode,     // the one continuation a Free reader arrived on
          viewport }       // mobile | tablet | desktop  (Device Spec §1)

  state = COMPOSITION[element][role]            // the matrix cell (§3)
  if state == 'deferred' and ctx.arrival is rigor   -> 'full'
  if element is a continuation/construction body
     and role == 'free' and not ctx.isEntryNode     -> 'locked'
  return state
```

- Driven by the matrix table (data), exactly as `canAccess` is driven by tier and `resolveTerm` by the term record. All three are **computed on read, role-derived, nothing stored as a separate truth.**
- The three gates run in order: `canAccess` → `showElement` → `resolveTerm`. Surface, then element, then word.
- Architect inherits Builder cells except those marked **[A]**.

-----

## §6. THE ONE LINE

A role is not a permission set but a register, so the fix for “what they witness is mixed” is a third gate beneath access and beside vocabulary: `showElement` decides, per role and computed on read, whether each component renders **Full**, **Honest**, **Plain**, **Locked**, **Deferred**, or **Hidden** — so the Free reader inhabits a clean transmission surface with the apparatus deferred, the Continuations reader gets the honesty without the engine telemetry, and the Builder operates the instrument with its data showing; one corpus, one flow, three surfaces, and no register bleeding onto a screen it was never meant to reach.
