# The Mirror Platform — The Data Permanence & Erasure Spec

### What we keep forever and what we erase on request — reconciled, not in conflict. Contributed corpus is permanent residue; personal identity is erasable. The bridge is that attribution is to a chosen handle, never to the legal identity, so deleting the person never requires deleting the work.

*Architect: Ilya Belous ("A Reflection") · The Mirror Platform LLC. Resolves Everything Spec §9 (no-delete / residue) against lawful right-to-erasure, and absorbs the Contribution-Conduct withdrawal line. §0–§3 frozen; §5 policy text provisional, pending counsel. Note: this specifies what the build must enforce and what the policies must say — it is not legal advice; have counsel review the GDPR/CCPA implementation.*

---

## §0. THE GOVERNING RULE

**Two data classes, never conflated: corpus is permanent, person is erasable.** The constitution forbids deleting contributed work (§36 residue; §9 no-delete-button); the law grants erasure of personal data. These only look like a contradiction if "the contribution" and "the contributor's identity" are the same record. They are not. **Attribution is to a handle the contributor chose — not to their email or legal identity** — so PII can be erased while the work persists under the handle. That single design move dissolves the conflict.

---

## §1. THE TWO CLASSES (frozen)

| | CORPUS (permanent — never deleted) | PERSON (erasable on lawful request) |
|---|---|---|
| **What** | published continuations, constructions, builder nodes, forum posts; the graph, edges, verdicts, stages; **aggregate/anonymized** telemetry | account identity (email, auth), subscription/billing state, **raw per-actor** event stream, profile |
| **Attributed to** | a **handle** (public, chosen; PII-free) | the legal identity |
| **On departure** | **stays**, attributed, flagged residue (§36) | retained while the account exists |
| **On erasure request** | **retained**, disassociated from the deleted identity (handle remains) | **deleted / anonymized** |
| **Deletable by a user path?** | **never** | yes — the single erasure path (§3) |
| **RLS** | world/tier-readable; no user-facing delete | owner-readable; erasable via the erasure edge function only |

The handle is the hinge: it is the public author of the corpus and contains no PII, so erasing the person leaves the corpus intact and still attributed.

---

## §2. THE THREE KINDS OF LEAVING (frozen — never conflated)

"Leaving" means three different events with three different effects. The build must keep them distinct or the constitution and the law collide:

| Event | What it is | Effect |
|---|---|---|
| **Subscriber lapses** (Continuations) | stops paying | loses **read** access to the spine; **their own contributions persist**; nothing erased |
| **Builder departs** (§9) | leaves the project | **nodes stay as residue**, attributed to the handle, flagged "left at [status]"; nothing erased |
| **Account erasure** (lawful) | right-to-erasure request | **PII deleted/anonymized**; corpus contributions **retained under the handle**, now decoupled from the deleted identity |

Read access is a *subscription* state; contribution permanence is the *constitution*; PII erasure is the *law*. Three axes, never one switch.

---

## §3. THE SINGLE DELETION PATH (frozen)

**The system has exactly one delete operation: the PERSON-erasure edge function. There is no delete path for CORPUS anywhere.** This is how "no delete button" (§9) and "right to erasure" both hold — they govern disjoint classes.

- Erasure (PERSON): deletes/anonymizes identity, billing, raw events. Defined, audited, lawful-request-gated. Touches **no corpus row.**
- Withdrawal-for-conduct (CORPUS): from the Contribution-Conduct Spec — **suppresses and logs**, does **not** delete; the node persists in the graph as residue with its conduct reason. This is a *visibility* change on corpus, not a deletion.
- Therefore: **erasure ≠ withdrawal.** Erasure removes a person's PII; withdrawal hides a node for conduct. Different class, different operation, different audit. The build must not implement withdrawal as a delete, nor erasure as a content removal.

---

## §4. THE CONTRIBUTOR DISCLAIMER (frozen — informed consent makes permanence lawful)

Permanence is only fair, and only lawful, if the contributor is told **at the point of contribution**. The disclaimer, surfaced at signup and at first contribution (forum, continuation, or builder upload):

> *Anything you contribute to the corpus — continuations, grounded nodes, forum posts — becomes part of the permanent record and stays, attributed to your handle, even if you leave or close your account. This is residue: the constitution, surfaced (§36). Your personal account data (email, billing, your activity log) is separate and can be erased on request; your contributed work persists under your handle, decoupled from your identity.*

This is the §6 constitution copy ("your continuations stay yours and leave with you") completed with its lawful other half: the *work* stays on the platform as corpus **and** travels with the builder as export (the corpus is never trapped — rows export). Both are true; the disclaimer states both.

---

## §5. POLICY SCAFFOLDING (provisional — counsel reviews)

What must exist before launch (named, not drafted here):

- **Terms of Service** — states corpus-permanence, handle-attribution, the residue rule, and that contribution is irrevocable-as-corpus while PII is erasable.
- **Privacy Policy** — states the telemetry purpose (**sequencing + gloss-verification, never ad-targeting, never sold**; no ads, house rule), the PERSON/CORPUS split, and the erasure path.
- **Refund / cancellation** — per §6 leavability: cancel anytime, owned materials persist, one-click, no dark-pattern retention.
- **Jurisdiction note** — GDPR (EU), CCPA (CA), and the active-duty/DOPSR constraints are the author's Phase-0 concern; the platform's job is to make the data classes and the erasure path clean enough that compliance is a policy layer over a correct model. **Have counsel review the actual implementation.**

---

## §6. THE ONE LINE

The work is permanent and the person is erasable, and the two never collide because attribution runs to a chosen handle and not to a legal identity — so a subscriber can lapse and lose only reading, a builder can depart and leave their nodes as residue, and a person can demand erasure and have their email and billing and raw activity deleted while their contributions persist under the handle, decoupled; there is exactly one delete operation in the whole system and it touches person-data only, never corpus, while conduct-withdrawal hides-and-logs without ever deleting — and the contributor is told all of this at the moment they contribute, which is what makes the permanence both fair and lawful.
