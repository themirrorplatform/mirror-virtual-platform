/* ============================================================================
   The Mirror Platform — the lexicon layer (P6)
   Lexicon Schema §A–§E. The word gate's DATA and the binding discipline that
   guards it. resolveTerm (gate 3) lives in gates.ts and consumes these types;
   here are the term record, the term-DAG firewall, the binding rule (§B′), and
   the readerVocab derivation.

   THE ONE RULE (§0): meaning is never simplified — only sequenced; and what to
   render is computed per reader, never stored. The lexicon is a graph of the
   same shape as the corpus — words depend on words (requires), "earned" is
   computed from those edges, never hand-assigned.

   THE BINDING RULE (§B′), a write-time invariant with the firewall's standing:
   a false positive doesn't misrender one word — it lies to the engine about what
   the reader knows. So a GLOSS event (and thus a readerVocab write) fires ONLY
   from a confirmed span: author-marked for `inverts`, architect-approved for
   `mild`, auto-wrap only for `none`. Never from a regex guess.
   ========================================================================== */

import type { Register } from "./types";

/** The four typed dispositions (§C) — the kind of move a word needs. */
export type Disposition = "experience" | "demote" | "teach" | "banned";

/** Worst-case collision severity (§D). `inverts` = common sense points away. */
export type Collision = "none" | "mild" | "inverts";

/** Provenance of the GLOSS, not the term (§A, §G.5). carried+no refuter = seal. */
export type GlossVerdict = "untested" | "carried" | "derived";

/** The §A term record (the fields the renderer and the binding rule need). */
export interface TermRecord {
  /** the lemma / stable id (kebab or the corpus's handle): 'the-ground'. */
  term: string;
  surface_forms?: string[];
  register: Register | "threshold" | "transmission" | "system";
  our_meaning?: string;
  /** the construction id this term names — the join to the engine. */
  defines_node?: string | null;
  reader_assumptions?: string[];
  collision: Collision;
  disposition: Disposition;
  /** surface replacement, only when disposition = demote (§A). */
  plain?: string;
  /** the in-breath teach line, only when disposition = teach (§A). */
  first_gloss?: string;
  /** other term ids whose meaning must already be in hand — the term-DAG edge. */
  requires: string[];
  /** true iff requires is empty: a root word, teachable at first contact (§B). */
  tier0?: boolean;
  /** arrivals for which the word appears at full strength immediately (§A). */
  arrival_early?: string[];
  gloss_verdict?: GlossVerdict;
  gloss_refuter?: string | null;
  notes?: string;
}

export type TermGraph = Record<string, TermRecord>;

/**
 * earned() (§E): a term is earned for a reader when every id in `requires` is in
 * that reader's acquired set. Computed from the term-DAG (§B), never assigned.
 */
export function earned(term: TermRecord, readerVocab: ReadonlySet<string>): boolean {
  return term.requires.every((id) => readerVocab.has(id));
}

/**
 * How a term may attach to prose (§B′). This decides what the EDITOR/renderer is
 * allowed to do — it is the binding firewall, not a render-time cleanup:
 *   - 'author-marked'  (inverts): a placed span ONLY, never string-matched;
 *   - 'review-queue'   (mild):    auto-suggest; renders bare until architect-confirmed;
 *   - 'auto-wrap'      (none):    may auto-wrap, still register-gated by resolveTerm.
 */
export type BindingMode = "author-marked" | "review-queue" | "auto-wrap";
export function bindingMode(term: TermRecord): BindingMode {
  switch (term.collision) {
    case "inverts": return "author-marked";
    case "mild": return "review-queue";
    default: return "auto-wrap";
  }
}

/**
 * May this term legally produce a GLOSS event from this binding? The vocab law
 * (§B′): no GLOSS — and so no readerVocab write — without a confirmed span. An
 * `inverts` term auto-detected (not author-marked) must never write to vocab.
 */
export function mayGloss(term: TermRecord, span: "author-marked" | "architect-approved" | "detected"): boolean {
  if (term.collision === "inverts") return span === "author-marked";
  if (term.collision === "mild") return span === "architect-approved" || span === "author-marked";
  return span !== "detected" ? true : true; // 'none' may auto-wrap
}

/**
 * readerVocab derived from the append-only event log (§E, §F): a GLOSS writes a
 * `gloss_shown` event carrying the term id; the set is those ids. Felt, never
 * counted (§E invariant) — this set drives the renderer and is NEVER surfaced as
 * a tally. No new store; the third geometry is the source.
 */
export interface GlossEvent { kind: string; node_id?: string | null; payload?: { term?: string } }
export function deriveReaderVocab(events: ReadonlyArray<GlossEvent>): Set<string> {
  const vocab = new Set<string>();
  for (const e of events) {
    if (e.kind === "gloss_shown" && e.payload?.term) vocab.add(e.payload.term);
  }
  return vocab;
}

/**
 * The term-DAG firewall (§B): `requires` is rigid and acyclic — a term may not
 * require itself, directly or transitively. Same DFS as the construction
 * firewall (engine.findCycle), in vocabulary. Returns the first cycle, or null.
 */
export function findTermCycle(g: TermGraph): string[] | null {
  const color: Record<string, number> = {};
  let found: string[] | null = null;
  const dfs = (u: string, stack: string[]): void => {
    if (found) return;
    color[u] = 1;
    stack.push(u);
    for (const r of g[u]?.requires ?? []) {
      if (!g[r]) continue;                  // forward refs / dangles allowed (§B)
      if (color[r] === 1) { found = stack.slice(stack.indexOf(r)).concat(r); return; }
      if (!color[r]) dfs(r, stack);
      if (found) return;
    }
    stack.pop();
    color[u] = 2;
  };
  for (const id in g) { if (!color[id]) dfs(id, []); if (found) break; }
  return found;
}

/** Build lint (§F): banned surface terms must fail the build, never ship. */
export function bannedTerms(g: TermGraph): string[] {
  return Object.values(g).filter((t) => t.disposition === "banned").map((t) => t.term);
}
