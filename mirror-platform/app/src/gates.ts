/* ============================================================================
   The Mirror Platform — the three read gates (P1)
   canAccess(node, role) -> showElement(element, role, ctx) -> resolveTerm(term, ctx)
   Surface, then element, then word. ctx is MANDATORY (§0 rule 2): keying off role
   alone collapses the one-flow-three-renderings architecture into a tier-gated CMS.

   DENY BY DEFAULT, EVERYWHERE (§0 rule 1):
     - an element with no composition rule for a role is HIDDEN, never shown raw;
     - a term with no lexicon entry renders PLAIN (or absent), never auto-defined;
     - a node with no access rule is LOCKED (canAccess returns false).

   The read pipeline never mutates (§0 rule 3). These are pure: resolveTerm does
   NOT add to readerVocab — it returns GLOSS and the caller logs the event, so the
   vocab grows only from a confirmed, intended teaching (Lexicon §B′).

   The matrices/lexicon here are STUBS (mostly empty) — that is the point at this
   stage: deny-by-default means an unmapped element renders nothing. P5 fills the
   COMPOSITION matrix; P6 fills the lexicon. The gate LOGIC does not change.
   ========================================================================== */

import type { MirrorNode } from "./types";

/** Roles are registers, not permission sets (§0 rule 9). */
export type Role = "free" | "cont" | "build" | "arch";
export type Viewport = "mobile" | "tablet" | "desktop";
export type SurfaceRegister = "threshold" | "transmission" | "system";

/** The six render states (Composition §2). */
export type ElementState =
  | "full" | "honest" | "plain" | "locked" | "deferred" | "hidden";

/** The five term outcomes (Lexicon §E) + the build-lint error. */
export type TermDecision = "BARE" | "GLOSS" | "PLAIN" | "DEFER" | "SUPPRESS" | "ERROR";

/**
 * The render context. Mandatory — never key off role alone (§0 rule 2).
 * Carries arrival (arrived_from), whether this is the reader's entry node,
 * the viewport (Device §1), the surface register, and the reader's earned vocab.
 */
export interface Ctx {
  arrival: string;            // 'lesswrong' | 'ea' | 'substack-grief' | 'cold' | ...
  isEntryNode: boolean;
  viewport: Viewport;
  register: SurfaceRegister;
  readerVocab: ReadonlySet<string>;
}

/** Arrivals that earned the rigor-forward surface (Composition §3, Lexicon §A). */
const RIGOR_ARRIVALS = new Set(["lesswrong", "ea"]);
export const isRigorArrival = (arrival: string): boolean =>
  RIGOR_ARRIVALS.has(arrival);

/* ------------------------------------------------------------------ GATE 1 */

/**
 * canAccess — the surface gate. May this role enter this node at all?
 * Deny by default: a node with no rule is locked (returns false). A free
 * visitor reaches only the one continuation they arrived on; leaf grounds are
 * always referenceable; every paid register reads the corpus.
 *
 * NB: public pages (home/map/events/about) and the forum/account/admin routes
 * are governed by route policy, not by canAccess — this gate is for corpus nodes.
 */
export function canAccess(
  node: MirrorNode | undefined,
  role: Role,
  isEntry = false,
): boolean {
  if (!node) return false;                 // deny by default
  if (node.kind === "leaf/borrow") return true; // a ground, not a gated surface
  // a builder node withdrawn for conduct is suppressed from the public surface
  if (node.conduct_status === "withdrawn-for-conduct" && role !== "arch") return false;
  if (role === "cont" || role === "build" || role === "arch") return true;
  return isEntry === true;                 // free: only the entry continuation
}

/* ------------------------------------------------------------------ GATE 2 */

/**
 * The composition matrix (Composition §3). Keyed [element][role] -> state.
 * STUB: a handful of rows are seeded to exercise the pipeline; everything else
 * is unmapped and therefore HIDDEN (deny by default). P5 fills this from the
 * frozen §3 matrices — the gate logic below does not change.
 */
export type CompositionMatrix = Record<string, Partial<Record<Role, ElementState>>>;

export const COMPOSITION: CompositionMatrix = {
  // global chrome
  wordmark: { free: "full", cont: "full", build: "full", arch: "full" },
  primary_nav: { free: "plain", cont: "plain", build: "plain", arch: "plain" },
  footer_constitution: { free: "full", cont: "full", build: "full", arch: "full" },
  invariant_strip: { free: "hidden", cont: "hidden", build: "full", arch: "full" },
  route_strip: { free: "hidden", cont: "hidden", build: "full", arch: "full" },
  // entry continuation
  continuation_title: { free: "full", cont: "full", build: "full", arch: "full" },
  honest_ledger: { free: "deferred", cont: "honest", build: "full", arch: "full" },
  engine_tags: { free: "hidden", cont: "hidden", build: "full", arch: "full" },
  rail_grounds: { free: "plain", cont: "plain", build: "full", arch: "full" },
  rail_leads_to: { free: "plain", cont: "plain", build: "full", arch: "full" },
  // anything else -> hidden (deny by default)
};

/** Body-type elements: a free non-entry view of these is locked, not hidden. */
const BODY_ELEMENTS = new Set(["continuation_body", "construction_body"]);

/**
 * showElement — the element gate. Which components render, in which register,
 * for this role on this surface. Data-driven over COMPOSITION; deny by default
 * to HIDDEN. Applies the two ctx overrides from Composition §5:
 *   - a Deferred element flips to Full for a rigor arrival;
 *   - a continuation/construction body, free + not the entry node, is Locked.
 */
export function showElement(
  element: string,
  role: Role,
  ctx: Ctx,
  matrix: CompositionMatrix = COMPOSITION,
): ElementState {
  if (BODY_ELEMENTS.has(element) && role === "free" && !ctx.isEntryNode) {
    return "locked";
  }
  let state = matrix[element]?.[role] ?? "hidden"; // deny by default
  if (state === "deferred" && isRigorArrival(ctx.arrival)) state = "full";
  return state;
}

/* ------------------------------------------------------------------ GATE 3 */

export type Disposition = "experience" | "demote" | "teach" | "banned";

/** The subset of the Lexicon §A term record the resolver needs. */
export interface TermRecord {
  term: string;
  disposition: Disposition;
  /** other term ids whose meaning must already be earned (the term-DAG). */
  requires: string[];
  /** plain replacement, used only when disposition = demote. */
  plain?: string;
  /** the in-breath teach line, used only when disposition = teach. */
  first_gloss?: string;
  /** arrivals for which the word appears at full strength immediately. */
  arrival_early?: string[];
}

/** A term is earned when every id in requires is in the reader's vocab (§B). */
export function earned(term: TermRecord, ctx: Ctx): boolean {
  return term.requires.every((id) => ctx.readerVocab.has(id));
}

/**
 * resolveTerm — the word gate (Lexicon §E). Returns the render decision for one
 * bound term, given the reader's context. Deny by default: an unmapped term
 * renders PLAIN (the string, untaught) — never auto-defined. A banned term
 * returns ERROR (the build lint; it must never ship).
 *
 * Pure: on GLOSS the caller is responsible for logging the gloss_shown event,
 * which is what (and the only thing that) grows readerVocab (§B′).
 */
export function resolveTerm(term: TermRecord | undefined, ctx: Ctx): TermDecision {
  if (!term) return "PLAIN"; // deny by default — unmapped renders plain

  switch (term.disposition) {
    case "banned":
      return "ERROR"; // build lint; never ships

    case "experience":
      return ctx.register === "system" ? "BARE" : "SUPPRESS";

    case "demote":
      return ctx.register === "system" || earned(term, ctx) ? "BARE" : "PLAIN";

    case "teach":
      if (term.arrival_early?.includes(ctx.arrival)) return "BARE";
      if (ctx.readerVocab.has(term.term)) return "BARE";
      if (earned(term, ctx)) return "GLOSS";
      return "DEFER";

    default:
      return "PLAIN";
  }
}

/* ----------------------------------------------------------- THE PIPELINE */

/**
 * The three gates, in order (§0 rule 2). A small helper the templates call so
 * no template decides visibility itself (P7). Surface first; if denied, nothing
 * downstream runs.
 */
export interface PipelineResult {
  access: boolean;
  /** element states resolved for the requested elements (access permitting). */
  elements: Record<string, ElementState>;
}

export function runPipeline(
  node: MirrorNode | undefined,
  role: Role,
  ctx: Ctx,
  elements: string[],
  opts: { isEntry?: boolean; matrix?: CompositionMatrix } = {},
): PipelineResult {
  const access = canAccess(node, role, opts.isEntry ?? ctx.isEntryNode);
  if (!access) return { access: false, elements: {} };
  const resolved: Record<string, ElementState> = {};
  for (const el of elements) resolved[el] = showElement(el, role, ctx, opts.matrix);
  return { access: true, elements: resolved };
}
