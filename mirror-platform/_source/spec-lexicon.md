# The Mirror Platform — The Lexicon Schema

### The frozen structure the word-sweep fills and the website queries. Not a lexicon — the shape every load-bearing word’s entry takes, plus the function the build calls to decide, per reader, what to render. The transmission sweep is gated on feeding in the corpus; this makes that sweep mechanical and the result buildable.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. Companion to the Voice Spec (registers + licensed/banned lists), the Surface-Language Sweep (the three buckets, proven on the prototype), and the Corpus-Graph Registry (the frozen/provisional discipline this mirrors). The lexicon is the Language tab’s data layer. §A–§E are **frozen**; §G protocol is **v0.1, provisional** until it firms against the first region (Book One or the wedge); the tables in §I are **empty** until the corpus is fed in.*

-----

## §0. THE ONE RULE

**Meaning is never simplified — only sequenced; and what to render is computed per reader, never stored.** A load-bearing word is neutral *to us* because we built its neutrality through depth; a stranger has to build it the same way. So the lexicon never holds “the simple version of the word.” It holds, per term: our meaning, the assumptions a reader collides with, and the **earliest rung at which the word can appear without reading as jargon** — and the site computes, at render time, whether this reader sees the bare term, the term taught in-breath, a plain paraphrase, or nothing at all (the thing experienced, never named).

Two corollaries that make it the same object as the rest of the platform:

- **The lexicon is a graph of the same shape.** Terms depend on terms (`requires`), exactly as constructions depend on constructions. “Earned” is computed from those edges and what the reader has crossed — never hand-assigned (the engine’s depth rule, applied to words).
- **Each entry is an attempt with a verdict.** A gloss is *carried* until a real stranger reads it and still imports the wrong assumption is shown not to happen — only then *derived*. The lexicon cannot certify its own glosses from inside (§25), and it never completes.

-----

## §A. THE TERM RECORD (frozen)

One row per load-bearing word. Content fields say what it is; sequencing fields say when it may appear; status fields say where the gloss stands.

|field               |meaning                                                                                                                                              |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
|`term`              |the lemma / stable id (kebab or the corpus’s own handle): `the-ground`, `encounter`, `rests-on`                                                      |
|`surface_forms`     |inflections/variants this entry governs: *ground · grounds · grounding · the ground*                                                                 |
|`register`          |home register (Voice Spec §1): `threshold` · `transmission` · `system` (a word may appear in more than one; list the primary, note others in `notes`)|
|`our_meaning`       |the fixed corpus sense, one line — the §2 licensed meaning                                                                                           |
|`defines_node`      |the construction id this term names, if any: `the-ground → B1-§53`. The join to the Knowledge Geometry Engine.                                       |
|`source`            |where it is first load-bearing (chat/manuscript/essay + locus) — the anchor, as in the registry                                                      |
|`reader_assumptions`|list of what an outsider brings (the collisions) — see §D                                                                                            |
|`collision`         |worst-case severity: `none` · `mild` (teachable) · `inverts` (assumption points away from our meaning)                                               |
|`disposition`       |`experience` · `demote` · `teach` · `banned` — see §C                                                                                                |
|`plain`             |the surface replacement (only if `demote`): *spine → “the rest of the writing”*                                                                      |
|`first_gloss`       |the in-breath teaching line (only if `teach`): *“an encounter — meeting something you didn’t write, that pushes back”*                               |
|`requires`          |list of other `term` ids whose meaning must already be in hand for this to land — **the term-DAG edge**                                              |
|`tier0`             |bool — true if it has no `requires` and may be taught at first contact (a root word, e.g. `encounter`)                                               |
|`arrival_early`     |arrivals for which the word may appear at full strength immediately, bypassing the rung gate: e.g. `[lesswrong, ea]` for `refuter`                   |
|`gloss_verdict`     |`untested` · `carried` · `derived` — provenance of the *gloss*, not the term                                                                         |
|`gloss_refuter`     |what would break the gloss: *“a reader who reads it and still imports [assumption]”* (null = seal-risk if carried/derived)                           |
|`notes`             |other registers it appears in, ancestry, anything for the next session                                                                               |

-----

## §B. THE TERM-DEPENDENCY EDGES (frozen)

`requires` makes the lexicon a DAG, same firewall as the construction graph: **a term may not require itself, directly or transitively.** A cycle means two words each presuppose the other — which means neither can be a first rung, and one of them is really the plainer entry. The audit rejects the cycle and asks which edge is the true prerequisite.

- `requires` is rigid and acyclic (the firewall, in vocabulary).
- A term is **earned** for a reader when every id in `requires` is in that reader’s acquired set (§E `readerVocab`).
- `tier0` terms (empty `requires`) are earnable at first contact — they seed the climb.
- Coverage and dangles are audited exactly as the registry audits construction edges; forward refs allowed.

-----

## §B′. THE BINDING RULE — how a term is attached to prose (frozen)

Polysemy is not a UI nuisance here; it is an **attack on the data**. “The ground gave way beneath her” and “the ground beneath the truth-apt” are different words wearing one string. If a string-matcher glosses the first, it does two harms: it drops a definition where none was meant (the exact jargon-weirdness we are killing), and — worse — it fires a GLOSS event, so `readerVocab` records a term the reader never earned, and every downstream `resolveTerm` and every `gloss_verdict` is now computed against a polluted vocab set. **A false positive doesn’t misrender one word; it lies to the engine about what the reader knows.** So binding is a write-time invariant with the same standing as the firewall, not a render-time cleanup.

The discipline follows the membrane’s: a construction shows through prose only where the **author placed it**, never by detection. High-load terms get the identical treatment.

- **`collision: inverts` → author-marked span ONLY.** The load-bearing sense is a lexicon-node placed in the editor (a TipTap mark, exactly like a membrane). **No string-matching, ever**, for these. *(ground, spine, construction, wall, stake, held, bearing, open, …)*
- **`collision: mild` → auto-*suggest*, never auto-render.** A string match populates a review queue the architect confirms; it renders **bare** until confirmed.
- **`collision: none` → auto-wrap permitted**, still register-gated by `resolveTerm`.
- **The vocab law:** **no GLOSS event — and so no `readerVocab` write — without a confirmed span** (author-marked, or architect-approved from the queue). The vocabulary graph learns only from *intended* teachings, never from a regex guess.

This makes the instrumentation **quieter** than auto-wrap-everything, which is also the right feel: the thought stays prose, and only the words the author chose to teach ever light up. The lexicon graph is gated by **authorship** exactly as the construction graph is gated by **acyclicity** — both write-time, both refused at the edge, never patched after.

-----

## §C. THE DISPOSITION ENUM (frozen) — what kind of move the word needs

The Surface Sweep’s three buckets become four typed dispositions, with the transmission nuance made explicit.

|disposition |means                                                                           |where it comes from                                                              |render rule (see §E)                                               |
|------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------|
|`experience`|the reader must *feel* this, never *read* the word — our machine handle         |Surface Sweep Bucket 3 (`rests_on`, `frontier`, `membrane`, `stage`, `load`)     |on a reader surface: render the thing, suppress the word entirely  |
|`demote`    |swap for plain language on the surface; keep the term for data/deeper rungs     |Surface Sweep Bucket 1 (`the ground`→”where this comes from”, `spine`→”the rest”)|render `plain` on surface; bare term only in `system`/deep         |
|`teach`     |the word **is** the concept — cannot be swapped; can only be sequenced + glossed|Surface Sweep Bucket 2; **most transmission terms land here**                    |gloss on first earned contact, bare thereafter, defer before earned|
|`banned`    |forbidden by a constitution clause; never rendered anywhere                     |Voice Spec §3 (`unlock`, `engagement`, `delete`-of-content, hype)                |never render; build lints for it                                   |

**The transmission fact, stated:** in authored prose you can rarely `demote`, because the word carries the argument — so the default disposition for a transmission term is `teach`, and the work is in `requires` + `first_gloss` + `arrival_early`, not in finding a synonym. `demote` is mostly a System-register move.

-----

## §D. THE COLLISION FIELDS — our meaning vs. the reader’s assumptions

This is the seed of the public Language tab and the justification for every disposition. For each term, `reader_assumptions` lists the senses an outsider imports, and `collision` rates the worst one:

- `none` — the everyday sense ≈ our sense; teaches almost for free (*encounter* ≈ a meeting → mild at most).
- `mild` — adjacent but lossy; a one-line gloss closes it (*residue* → leftover/chemical).
- `inverts` — the common sense points *away* from ours; high jargon-risk, must be demoted or taught with care (*the ground* → dirt/floor/reasons; *spine* → book/anatomy; *construction* → building site).

`collision: inverts` + `register: transmission` is the dangerous quadrant — a word that’s load-bearing *and* misleading. Those are the terms whose `first_gloss` and `requires` matter most, and whose `gloss_verdict` most needs a real stranger.

-----

## §E. THE RENDER-RESOLUTION FUNCTION (the part the build calls)

The website does not store “the simple site” and “the deep site.” It stores the prose with terms marked, and resolves each term per reader at render — the membrane mechanic, generalized to vocabulary. Ports to TS alongside `protocol.py`.

```
resolveTerm(term, ctx) -> render decision
  ctx = { register,      // the surface speaking: 'threshold' | 'transmission' | 'system'
          arrival,        // arrived_from tag: 'lesswrong' | 'substack-grief' | 'cold' | ...
          readerVocab }   // set of term ids this reader has been glossed on (from the event log)

  if term.disposition == 'banned'            -> ERROR (build lint; never ships)

  if term.disposition == 'experience'
     -> if register == 'system'              -> BARE        (data layer: show the handle)
        else                                  -> SUPPRESS    (render the thing, not the word)

  if term.disposition == 'demote'
     -> if register == 'system' or earned()   -> BARE
        else                                   -> PLAIN(term.plain)

  if term.disposition == 'teach'
     -> if arrival in term.arrival_early       -> BARE        (rigor arrival wants it full-strength)
        else if term.id in readerVocab         -> BARE        (already crossed)
        else if earned()                       -> GLOSS(term + term.first_gloss); readerVocab.add(term.id)
        else                                   -> DEFER        (plain paraphrase, or hold the term behind a stand-in)

  earned() := every id in term.requires is in ctx.readerVocab   // computed from the term-DAG (§B)
```

Five outcomes the renderer handles: **BARE** (the word alone), **GLOSS** (word + in-breath teach, then remember it), **PLAIN** (the demoted surface word), **DEFER** (paraphrase / hold until earned), **SUPPRESS** (experienced, never named). `readerVocab` grows by encounter and is the third-geometry behavioral fact — the lexicon learns each reader the way the graph learns each contribution.

**The `readerVocab` invariant — felt, never counted (frozen).** To the reader, `readerVocab` is itself `experience`-disposition: it is *felt as rising intelligibility, never read as a tally.* It is never surfaced, never numbered, never congratulated — no “words unlocked,” no progress meter, no achievement (and “unlock” is already `banned`, §C). The reader should never learn that a vocabulary is being tracked; they should only find that the words already make sense. This is the §25 no-self-certification rule reaching the reader’s own progress: the site does not certify that you are getting it — you just are. A GLOSS event writes to the log; the log drives the renderer; the renderer shows prose. The loop is invisible by law.

This composes cleanly with `canAccess(node, role)`: **access** decides whether you may see a surface at all; **resolveTerm** decides which words appear once you’re on it. Orthogonal, both computed, neither stored as truth.

-----

## §F. HOW IT PLUGS INTO THE ENGINE & DATA MODEL

- **A sibling table `term`** carries the §A fields. `term.defines_node → construction.id` is the join: a term that names a proof points at it, so “what does *the ground* mean?” and “descend into §53” are one link seen from two sides.
- **`term_edge(from, to, kind=requires)`** is the term-DAG; audited (cycles/dangles/coverage) by the same protocol functions as construction edges.
- **The TipTap renderer resolves *bound* terms, not detected strings.** Per §B′, `collision: inverts` terms are author-marked spans (a TipTap mark, like a membrane); `mild` terms are architect-confirmed from a review queue; only `none` terms may auto-wrap. The renderer calls `resolveTerm` on bound spans at read time — authors write naturally, the reader’s version is computed, and no regex guess can fire a gloss. No second corpus, no “simple mode” to maintain.
- **`readerVocab` is derived from the `event` log** (the append-only third geometry): a GLOSS event adds the term — and per §B′ a GLOSS event only fires from a confirmed span, so the vocab set is never polluted by detection. No new store.
- **Public, read-only, client-side.** The lexicon resolves on read like the rails; writes (new term, new edge, gloss verdict) are architect-only edge functions that re-validate acyclicity, same as node writes.
- **Build lint:** `disposition == 'banned'` surface strings fail the build; this is where the Voice Spec §3 list becomes an automated check, not a hope.

-----

## §G. PROTOCOL v0.1 — PROVISIONAL (firms against the first region, then locks)

1. **Unit.** One row per load-bearing word, at the granularity the corpus uses it (a phrase like *the wall it invites* is one term; *carried/derived* may be one paired entry). *Open against region 1: are tightly-coupled pairs one row or two with a `requires` edge?*
1. **Disposition default.** Transmission term → `teach`; System handle → `experience` or `demote`; anything on the Voice Spec §3 list → `banned`. Set on capture; revisit only if a stranger’s read forces it.
1. **`requires` is declared coarse, forward-refs allowed.** Point at the prior words this one leans on; the audit flags dangles; resolve when that region is swept.
1. **`first_gloss` is authored, not generated** for transmission terms (the AI-prose ban reaches the gloss too, where the gloss is prose). The schema captures the *slot*; A Reflection fills the line. For System/demote terms the gloss/plain may be drafted here.
1. **`gloss_verdict` starts `untested`** and only an external reader moves it toward `derived`. `carried` glosses with no `gloss_refuter` flag as seal-risk — same honesty as the node graph.
1. **Slug stability.** Once a `term` id is set, it doesn’t change (edges and `defines_node` point at it).

-----

## §H. WORKED EXAMPLES (the schema across all four dispositions)

```
term: the-ground            surface_forms: [ground, grounds, grounding, the ground]
register: transmission       our_meaning: emotion/valence as the non-truth-apt floor under the truth-apt (§53)
defines_node: B1-§53         reader_assumptions: [dirt/floor, reasons, coffee grounds]   collision: inverts
disposition: teach           requires: [valence, stake]      tier0: false   arrival_early: []
first_gloss: "the ground — what the whole thing rests on, that isn't itself true or false"
gloss_verdict: untested      gloss_refuter: "a reader who reads it and still hears 'reasons/foundation-as-argument'"
```

```
term: encounter             surface_forms: [encounter, encountered]
register: transmission       our_meaning: meeting what you did not author; the only thing that settles a verdict
defines_node: B1-§30         reader_assumptions: [a meeting, a run-in]    collision: mild
disposition: teach           requires: []   tier0: true   arrival_early: [lesswrong, ea]
first_gloss: "an encounter — meeting something you didn't write, that pushes back"
gloss_verdict: untested      gloss_refuter: "a reader who hears only 'conversation' and misses the not-authored part"
```

```
term: rests-on              surface_forms: [rests_on, rest on, rests on]
register: system             our_meaning: construction dependency (depends_on)
defines_node: null           reader_assumptions: [leans against, depends loosely]    collision: mild
disposition: experience      requires: []   notes: "Bucket 3 — reader feels the 'where this comes from' rail; never reads 'rests_on'"
```

```
term: spine                 surface_forms: [spine, the spine, live spine]
register: system             our_meaning: the live core of continuations
defines_node: null           reader_assumptions: [book spine, backbone]    collision: inverts
disposition: demote          plain: "the rest of the writing" / "everything else here"   requires: []
```

```
term: unlock                register: system    our_meaning: (retail metaphor we reject)
disposition: banned          notes: "Voice Spec §3 — gamified; say 'open'. Build lint fails on surface use."
```

resolveTerm in action — `the-ground`, three readers:

- **cold arrival, transmission surface, readerVocab ∅** → `requires:[valence,stake]` unmet → **DEFER** (paraphrase: “what the whole thing rests on”).
- **same reader, later, after valence + stake glossed** → earned, term not yet in vocab → **GLOSS** (teach the word in-breath, remember it).
- **lesswrong arrival** → `arrival_early` empty for this term, so still gated — but `refuter` (its own entry, `arrival_early:[lesswrong]`) renders **BARE** for them. The site is rigor-forward where the arrival earned it, plain elsewhere — one toggle, not two sites.

-----

## §I. COVERAGE TRACKER + SESSION LOG (empty — the sweep fills it region by region)

|metric                                |value                                                                             |
|--------------------------------------|----------------------------------------------------------------------------------|
|terms captured                        |**0**                                                                             |
|terms with `requires` declared        |0                                                                                 |
|`collision: inverts` flagged          |0                                                                                 |
|glosses `derived` (stranger-confirmed)|0                                                                                 |
|regions swept                         |0 / (Book One · wedge · essays · the System surface ✓ done as the prototype sweep)|
|**% of transmission corpus swept**    |0%                                                                                |

|session|date      |region swept                                                       |terms added|protocol change|coverage after|
|-------|----------|-------------------------------------------------------------------|-----------|---------------|--------------|
|0      |2026-06-18|schema stood up; System surface already swept (the prototype sheet)|0          |created v0.1   |0%            |

**Forks to resolve with region 1 (same gate as the registry §G):** the transmission texts must be fed in — Book One or the wedge first (densest); I can’t sweep transmission honestly from the prototype and specs alone. The System-register surface is already swept (the bucket sheet); folding it in as rows is mechanical.

-----

## §J. THE ONE LINE

The lexicon is a graph of the same shape as everything else here: words depend on words, each entry is an attempt whose gloss is *carried* until a stranger settles it, and what any given reader sees — the bare term, the term taught in one breath, a plain stand-in, or nothing but the thing itself — is computed at render from where they entered and how far they’ve climbed; so we never build a simple site and a deep site, we build one corpus that sequences its own vocabulary, demoting the chrome, teaching the load-bearing few in the order their meanings can be earned, and keeping the machine’s handles in the machine — the withhold-*gnoveld* rule made into a function the website calls.
