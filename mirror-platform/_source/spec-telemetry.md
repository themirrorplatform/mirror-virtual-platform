# The Mirror Platform — The Telemetry Spec (The Feedback Instrument)

### How the site learns whether strangers actually climb — by capturing the observed-encounter geometry and reading where the climb stalls. The precursor to the resequencing algorithm: decide the metrics now, build the capture now, leave the algorithm for later.

*Architect: Ilya Belous (“A Reflection”) · The Mirror Platform LLC. The third geometry of the Everything Spec (§4.2 observed-encounter) made into an instrument. Gated by one razor (§0). §1–§2 frozen; §3 dashboards provisional.*

-----

## §0. THE GOVERNING RULE — AND THE RAZOR

Whether a stranger climbs is an **encounter question** — not derivable from inside (§25, §59). So the site must instrument the climb: capture behavior as the append-only third geometry, and read it to find where meaning failed to transmit. The instrument must exist from day one.

**The razor (the line that keeps this constitutional):** the corpus *forbids* engagement-optimization — engagement-maximization removes the exit and amputates the very faculty the work is about (IT-3, IT-8). Measuring where a reader stops is **not** that, *if and only if* the measured quantity is **transmission-failure, never retention.** The success metric is **intelligibility reached / depth of honest climb** — *did the meaning land far enough to pull the next rung* — and **never** time-on-site, return-frequency, or session-length. You are debugging the staircase, not building a slot machine.

Corollaries: **Never surfaced as a score** (no streaks, no progress, no nudges — the `readerVocab` felt-not-counted rule generalized). **No dark patterns, ever.**

-----

## §1. THE EVENT SCHEMA (frozen) — the observed-encounter geometry

The Everything Spec `event` table is the substrate: append-only, never updated, never deleted.

```
event {
  ts        timestamp
  actor     pseudonymous id (NOT identity; PERSON-class, erasable — Data-Permanence Spec)
  kind      see below
  node      the thread/construction/term in play
  payload   { arrival, depth_reached, rail, term, gate, ... }
}
```

Capture-kinds (the verbs of a climb):

|kind|carries|reads onto|
|---|---|---|
|`arrival`|`arrived_from` (referrer/UTM), entry node|cohort analysis; the arrival-adaptive ledger|
|`read_depth`|node, % / scroll reached|drop-off per continuation|
|`membrane_open`|node, target construction|did the proof-showing-through pull?|
|`rail_follow`|which rail (grounds/connects/leads-to), target|which relation actually moves readers|
|`gloss_shown`|term|feeds `readerVocab` **and** the gloss verdict|
|`gate_hit`|which gate, node|where the price meets the climb|
|`gate_convert` / `gate_abandon`|gate, node|conversion vs the wall the price builds|
|`frontier_reached` / `continue_pressed`|node|did they want to continue, or just leave|
|`exit_to_home`|from node|read-and-left vs read-and-descended|
|`builder_upload`|node, frontier|contribution rate (feeds the conduct rate floor)|

-----

## §2. THE METRICS (frozen) — the questions the data answers

- **Drop-off per continuation** — where reading stops (`read_depth` distribution per node).
- **Exit-without-continue rate** — read→`exit_to_home` vs read→`rail_follow`/`continue_pressed`.
- **Gate-hit-without-convert** — `gate_hit` then `gate_abandon`. Where the price killed a live climb.
- **The rung where `readerVocab` stalls** — a term `gloss_shown` repeatedly but never followed by deeper movement = a **failed gloss** → moves a Lexicon entry’s `gloss_verdict` toward needs-rework. The telemetry is how a gloss earns `derived`, or fails to.
- **Arrival-cohort climb** — do LessWrong vs grief-arrival vs cold readers climb differently? Validates/refutes arrival-adaptive composition.
- **Frontier desire** — `continue_pressed` rate at frontiers.

The unifying read: **find the sentence/node where climbing stops, per cohort.**

-----

## §3. WHAT IT IS NOW vs LATER

- **Now (build):** event capture (§1) + architect-only read-queries/dashboards (§2). Install the event log live **before any gate exists**, so encounter-failure is visible before commerce filters the signal.
- **Later (deferred):** any *algorithm* that auto-resequences rungs or auto-reworks glosses. Must still obey §0; never auto-optimize for time-on-site. For now the human reads the instrument and decides.
- Dashboards **provisional**; the event schema and the razor **frozen**.

-----

## §4. PRIVACY (ties to Data-Permanence)

- `actor` is **pseudonymous**, never identity. Raw per-actor events are **PERSON-class** (erasable). **Aggregate/anonymized** readings are corpus-class (permanent).
- Purpose stated in the privacy policy as **sequencing and gloss-verification**, never ad-targeting, never sale (no ads).
- The event log is the one place behavior is recorded; never exposed to other readers, never rendered as a public number.

-----

## §5. THE ONE LINE

The site cannot certify from inside whether its meaning lands, so it watches the climb and reads where the climb stalls — but against a single razor: the quantity is *intelligibility carried further*, never *time held longer*; the instrument debugs the staircase and never becomes the slot machine the corpus exists to diagnose; and what it learns is shown only to the architect, never to the reader as a score.
