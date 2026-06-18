# The Mirror Platform — The Contribution & Conduct Spec

### How a builder’s work enters, publishes, persists, and — only for conduct, never for disagreement — gets withdrawn. The flag rides along with publication instead of gating it.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. Completes Everything Spec §9 (leavability/governance) and §10 (conduct-not-content). Folds into the Surface-Composition Schema and the Data-Permanence Spec. §0–§4 frozen; §5 rate floor provisional.*

-----

## §0. THE GOVERNING RULE

**A builder’s contribution is an encounter with the system, not an edit to it (§9) — so it publishes immediately, persists permanently, and is met by the architect after the fact, never gated before.** Publication rides on the engagement flag, it is not blocked by it. The only thing that can pull a contribution off the public surface is **conduct**, never content disagreement; and withdrawal-for-conduct *suppresses and logs*, never deletes (§10, §36). The architect’s attention is a signal that upgrades framing, never a gate — the only design that scales as builders grow.

-----

## §1. THE PUBLICATION RULE — flag rides along

- Enters at `engagement = unread`, **attributed**, **resting on a frontier** (append-only), **never touches the canonical spine** — enforced at the write (§3).
- Appears on the public surface *at once*, rendered honestly as an unmet encounter (§2).
- The architect’s **review inbox is a query**, not a gate: `nodes where builder = true and engagement = unread`. Working it upgrades the flag (`unread → read → integrated → openly_discussed`); the upgrade changes *framing and prominence*, not *existence*.
- Engaging “by continuing it” (writing a node that rests on the builder’s) flips it to `integrated`. The architect never approves-to-publish; they meet-after-publish.

**Why this scales and queue-first doesn’t.** Queue-first makes the architect’s attention the thing the public surface waits on — a single point of failure that tightens as builders grow. Flag-rides-along inverts it.

-----

## §2. RENDER-BY-ENGAGEMENT-STATE (a composition row)

|engagement|Free / Continuations sees|Builder/Architect sees|
|---|---|---|
|`unread`|**provisional**: “an encounter with the system, by [handle] — not yet met.” Set apart, lower in the “leads to” rail, never canonical authority.|+ the inbox flag|
|`read`|provisional, “seen”|+ flag|
|`integrated`|woven into the rails as a real continuation, attributed|+ flag|
|`openly_discussed`|shown with the architect’s continuation linked (“met here”)|+ flag|
|`withdrawn-for-conduct`|**suppressed** from the public surface entirely (§3)|shown in the conduct log as residue|

The rule: **an `unread` builder node never renders with the same authority as canon.**

-----

## §3. THE CONDUCT-WITHDRAWAL RUNG (orthogonal to the engagement ladder)

The engagement ladder has only upgrade verbs — no rung for *this is abuse*, and there must not be. Conduct is a **separate axis**:

- `conduct_status ∈ { live, withdrawn-for-conduct }` — default `live`.
- **`withdrawn-for-conduct`** suppresses from the public surface, **persists in the graph as residue**, **logs the conduct reason** (never a content reason) — the §10 forum-removal binding, applied to nodes. Never deleted.
- The hard line: **you withdraw for conduct, never for content.** Spam, scripted floods, abuse, harassment, illegality → conduct. “I disagree / this is wrong / this is weak” → **never** grounds for withdrawal; that is what the verdict label and the open graph are *for*.
- The audit entry: `{ node, ts, actor=architect, conduct_reason, content_reason=null (forbidden) }`.

-----

## §4. HOW IT COMPOSES WITH THE GATES & THE PERSISTENCE LINE

- **Write side (edge function):** append-only; a builder upload **cannot target a canonical node** — only create a new node resting on a frontier. Acyclicity re-validated on write. The whole builder write-surface: *create · attach upward · own only your own.*
- **Read side (the three gates):** `canAccess` lets the builder reach their own slot; `showElement` renders their node by §2; prose still flows through `resolveTerm`.
- **Persistence:** a withdrawn node is **corpus**, not **person** — persists as residue. Withdrawal (conduct) and erasure (person/PII) are different operations on different classes, never conflated.

-----

## §5. THE RATE FLOOR (not the architect’s attention) — PROVISIONAL

- **Per-builder rate limits** on uploads (N/day; tunable).
- **New-builder provisional window:** first nodes render provisional until a first human pass, regardless of flag.
- **The $59.99 Builder tier is itself the §6 filter** — a borne cost is most of the spam answer at the door.
- **Abuse signal → conduct review,** not auto-delete; suppression is still the logged §3 act.

-----

## §6. THE ONE LINE

A builder’s work publishes the instant it is made and stays forever, because it is an encounter, not an edit; the architect meets it afterward and the flag that records how far it has been met rides *with* publication rather than gating it, so attention never becomes the bottleneck; and the only force that can pull a contribution off the public surface is conduct — logged, reason-bound, and suppressing-as-residue, never deleting and never for mere disagreement.
