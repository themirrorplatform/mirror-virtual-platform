# The Mirror Platform — The Voice & Word-Choice Spec

### What way says what, where, and when. The verbal constitution of the interface — derived from the philosophical one, not chosen for taste — plus an audit of the prototype’s current strings against it.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. Companion to THE EVERYTHING SPEC (§16 design, §17 voice). Governs every string the build emits. The interface does not have a separate “brand voice” — it speaks the corpus’s own law back, in three registers, and the law decides the words.*

-----

## §0. THE VOICE LAW

**The interface speaks in the constitution’s register: exposed, non-prescriptive, and never claiming closure.** It *shows* the constitution rather than selling it:

- *nothing completes (§47/§59)* → never **done / finished / complete / settled / 100%**; never empties an “open” state to celebrate it.
- *no system certifies itself from within (§25)* → never **congratulates, validates, or settles a verdict from the inside.** Hands the verdict to encounter.
- *the firewall — grounding ≠ occupying (§16)* → copy never blurs *what a thing is* (content) with *where it stands* (status).
- *an instrument, not a guru* → never **prescribes, scolds, or flatters.** Names a position and offers a move; never *you should*.

A string that violates one of these is wrong even if it “reads well.”

-----

## §1. THE THREE REGISTERS (typeface = voice = who is speaking)

|Register|Typeface|Who speaks|Says what|License & ban|
|---|---|---|---|---|
|**Threshold**|Playfair Display|the *house*, at recognition|display titles, the home line, frame headers|certain of *form*, never of *content*. May be lapidary. Never a slogan.|
|**Transmission**|Spectral|**A Reflection** (the author)|continuation prose, wedge essays, the body|**AI-prose ban (§17) lives here.** The platform never generates this layer. Human, plain, exposed, second-person.|
|**System / data**|IBM Plex Mono|the *instrument* (the engine)|labels, status, ledgers, routes, admin, gates, errors, empty states|terse, lowercase, present-tense, the corpus’s own handles. Never “I.” Never sells.|

**The hard boundary.** The build authors **only Threshold and System copy.** Transmission copy is a placeholder until A Reflection writes it.

**The honest seam.** Threshold may be sure of itself (it is a title). System may be sure of a *computation* (the firewall is acyclic; load is 154). Neither may be sure of a *verdict*. The mono register’s signature line: *“verdict carried, not derived.”*

-----

## §2. THE LICENSED LEXICON (corpus terms — fixed meanings)

|Word|Means exactly|Not|
|---|---|---|
|**encounter**|meeting what you did not author; the only thing that settles a verdict|“interaction,” “session”|
|**ground / rests on**|construction dependency (`depends_on`)|“based on,” “powered by”|
|**leads to**|the *computed* reverse dependency|never authored; never “related”|
|**pulls toward**|the soft grounding/significance geometry (`pulls_to`)|“see also”|
|**holds**|withstands pressure (truth = what holds, §43); verdict `HOLDS`|“is true,” “is correct”|
|**carried / derived**|verdict provenance: carried = inherited/internal; derived = earned by external encounter|“verified,” “confirmed” loosely|
|**refuter / the wall it invites**|what an opponent must *do* to break a claim|“limitation,” “caveat”|
|**open / the open column / debt**|named, deliberate incompleteness|a flaw to apologize for|
|**residue**|what a departed contributor leaves; persists, flagged|“archive,” “leftover”|
|**frontier**|a node nothing yet builds on|“dead end,” “TODO”|
|**membrane**|the construction showing through prose at the point it bears|“tooltip,” “preview”|
|**wing / continuation / construction**|a domain / an A-page / a B-page|“section,” “article,” “page”|
|**leave · leave-able · leaves with you**|the leavability constitution|“churn,” “deactivate”|

-----

## §3. THE BANNED LEXICON (each violates a specific clause — a build lint, not a guideline)

|Banned|Why|Say instead|
|---|---|---|
|complete · finished · done · all set · 100% · “fully”|nothing completes (§47/§59)|open · in force · captured · at this depth|
|**engagement · engaging · streak · “keep you here” · notification-bait**|engagement-optimization removes the exit (IT-3, IT-8)|*do not motivate by retention at all; motivate by the open thought*|
|settled (badge) · proven (as finished) · verified ✓|no self-certification (§25)|verdict carried, not derived · holds, exposed|
|delete · remove (content) · erase · wipe|residue / ghost floor (§36); content never removable|leave · depart · keep · (remove applies **only** to *conduct*)|
|Great job! · You’re all caught up! · Nice work! · ✓ done|the system never congratulates (§25)|*state the fact, offer the next move*|
|you should · the right way · best practice · we recommend|non-prescriptive|here is the move · you can · descend into its grounds|
|unlock · upgrade · premium · pro|gamified retail register|**open** (the spine) · the right to ground|
|revolutionary · powerful · seamless · leverage · supercharge · cutting-edge|sell-voice|*describe what it does, plainly*|
|Oops! · Uh-oh · Sorry, something went wrong|errors give direction, not mood|name what happened + the next action|
|AI-prose tells: delve · tapestry · journey · landscape · “it’s important to note” · “in today’s world” · “moreover”|Transmission is A Reflection’s; the ban is absolute|*authored by the human, not generated*|

-----

## §4. THE GRAMMAR OF THE INTERFACE (System register)

- **Person.** Address the reader as **you**. The system is **never “I”.** A Reflection’s “I” belongs to Transmission only.
- **Tense / voice.** Present tense, **active voice.** “Reading the rest opens with Continuations,” not “can be unlocked.”
- **Case.** Sentence case for System; lowercase for mono data/labels/routes. Threshold titles may carry display capitalization.
- **Action consistency.** A verb keeps its name through the flow: **Open the spine → Opened. Ground it → Grounded. Post → Posted.** Where the next step is a *different stake* (a frontier “Continue” that meets the contribution gate), the button changes name honestly — *Become a Builder.*
- **One job per element.** A label labels; an example demonstrates; a ledger states status. (The firewall, in copy.)
- **Numbers are facts, not scores.** “load · 154 dependents,” “open column · 331” — never framed as progress toward a finish.

-----

## §5. THE WHERE × WHEN MATRIX (abridged — register in [brackets])

|Surface · moment|Register|Example (in-voice)|
|---|---|---|
|Entry banner|[System]|*You arrived from LessWrong, mid-thought. The residue is intact — this is the continuation, not a homepage.*|
|Continuation title|[Threshold]|*Could It Suffer, and Does It Matter*|
|Continuation body|[Transmission]|*— authored, not generated —*|
|The ledger|[System]|*verdict carried, not derived — only an external encounter settles it.*|
|The refuter line|[System]|*To break this, an opponent must: exhibit stakes without valence.*|
|The three rails|[System/mono]|*Leads to — what builds on this · computed reverse of everyone’s rests_on · never authored*|
|Frontier prompt|[Threshold→System]|*You’ve reached the end of what’s been written here. The thought is unfinished — it always is. Continue it?*|
|Read gate|[System]|*The one continuation you arrived on is free. Reading the rest opens with Continuations.*|
|Contribution gate|[System]|*Reading and grounding are different stakes. A borne cost filters for seriousness, not means.*|
|Error / broken link|[System]|*No node at “X”. This target doesn’t resolve. Run Flow Verify to find which rail points here.*|
|Empty state|[System]|*No builder encounters yet. Insert one above.*|
|Architect why-ledger|[System/mono]|*captured X · firewall OK — no cycle · §53 gained load 3 → 5 · seal check: clear*|
|Departure / residue|[System]|*residue · left at integrated · the node stays.*|
|Home (on exit)|[Threshold]|*This place is philosophy. The meta-philosophy.*|
|Footer / invariant strip|[System/mono]|*nothing completes · the open column never empties · the site cannot close the ledger*|

-----

## §6. THE VERIFICATION TEST (run every string through it)

1. **Closure** — claims completeness/settledness? → rewrite to the open register.
2. **Self-certification** — congratulates/validates/settles a verdict from inside? → state the fact; hand the verdict to encounter.
3. **Prescription** — tells the reader what they *should* do/think, or scolds? → name a position, offer a move.
4. **Sell** — hype verb or retention/engagement bait? → describe plainly.
5. **Register** — typeface + vocabulary match the surface? → move it to the right speaker.
6. **Lexicon** — corpus terms used with §2 meanings; nothing from §3 present? → fix the word.
7. **Action consistency** — verb survives the flow (X → X-ed), or changes only because the *stake* changed? → align.
8. **The boundary** — Transmission copy the platform is generating? → stop; that layer is A Reflection’s.

-----

## §7. PROTOTYPE STRING FIXES (word-level, not register-level)

|String|Fails|Fix|
|---|---|---|
|Tier header **“Unlocks”**|§3 (unlock = retail) · §4 action-consistency|**“Opens”**|
|Lock copy **“This is behind the spine.”**|§6 clarity|**“This is part of the spine, beneath the prose.”**|
|Frontier **“Do you wish to continue it?”**|archaic for System|**“Continue it?”** (keep the Threshold sentence before it)|
|Events **“What’s happening in the house”**|“house” is a brand term|acceptable — *the house* = The Mirror Platform Press; the one sanctioned metaphor|

The prototype is ~90% in-voice by construction; no string fails §0’s four commitments.

-----

# Surface-Language Sweep (companion)

*The diagnosis: a cold reader isn’t repelled by difficulty — they’re repelled by a system label dressed as an ordinary word. The fix is depth-of-appearance, not synonyms: demote the chrome, keep the load-bearing few and teach them on first use, keep raw machine handles off the public surface. Meaning is never simplified — its arrival is deferred to the rung where it’s earned.*

**Bucket 1 — DEMOTE TO PLAIN (chrome on the cold surface; keep the term underneath):**
- “Descend into its grounds” / “the ground” → **Where this comes from**
- “Pulls toward” → **Connects to**
- “Leads to — what builds on this” → keep **What builds on this**
- “continuation” (noun) → **keep reading from here**
- “the construction beneath” → **the rigorous version underneath**
- “the spine” → **everything else here / the rest of the writing**
- “Exit the continuation” → **Step back out**
- “the entering wing” → **where it starts**
- “register” (public) → **voice / form**

**Bucket 2 — KEEP, BUT TEACH ON FIRST USE:** `encounter` (*“an encounter — meeting something you didn’t write, that pushes back”*) · `residue` (*“what you left stays — that’s residue”*) · `the wall it invites / refuter` (lead with *“To break this, someone would have to…”*) · `carried / derived` (for committed readers; **defer for cold readers**).

**Bucket 3 — DATA-LAYER ONLY (mono; never shown to a cold reader):** raw edges `rests_on · pulls_to · depends_on · leads_to` · status machine `stage · captured · has_result · in_protocol · verdict_in` · weight `structural-load · load · dependents · depth · metric/load-bearing/province/shallow` · objects `frontier · membrane · node · edge · graph` · architecture `construction vs thread · the firewall · seal-risk · the open column · the ledger`. The reader should *experience* each and *name* none.

**The deferral note:** the honest ledger is true, but shown first to someone moved by a feeling it answers a question they haven’t asked. Defer it below the payoff for a cold/transmission arrival; show it immediately for a rigor arrival. One toggle on `arrived_from`, not two sites.

-----

## §8. THE ONE LINE

The interface has no voice of its own to invent — it says the constitution back in three registers: Threshold is sure of form and never of content, Transmission is A Reflection’s alone and the platform never writes it, and System is the instrument speaking in the corpus’s own handles, present-tense and exposed, stating what holds and handing every verdict to the encounter; so the test for any string is not *does it read well* but *does it tell the truth about where the work stands.*
