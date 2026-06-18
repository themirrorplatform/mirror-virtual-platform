/* ============================================================================
   The Mirror Platform — the three read gates (P1 · P5 · P6)
   canAccess(node, role) -> showElement(element, role, ctx) -> resolveTerm(term, ctx)
   Surface, then element, then word. ctx is MANDATORY (§0 rule 2): keying off role
   alone collapses one-flow-three-renderings into a tier-gated CMS.

   DENY BY DEFAULT, EVERYWHERE (§0 rule 1):
     - an element with no composition rule for a role is HIDDEN, never shown raw;
     - a term with no lexicon entry renders PLAIN (or absent), never auto-defined;
     - a node with no access rule is LOCKED (canAccess returns false).

   The read pipeline never mutates (§0 rule 3). These are pure: resolveTerm does
   NOT add to readerVocab — it returns GLOSS and the caller logs the gloss_shown
   event, which (and only which, from a confirmed span) grows the vocab (§B′).

   P5 fills COMPOSITION from the frozen Composition §3 matrices and adds the
   viewport axis (Device §1). P6 wires gate 3 to the lexicon module.
   ========================================================================== */

import type { MirrorNode } from "./types";
import { earned, type TermRecord } from "./lexicon";

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
 * arrival (arrived_from), whether this is the reader's entry node, the viewport
 * (Device §1), the surface register, and the reader's earned vocab.
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
export const isRigorArrival = (arrival: string): boolean => RIGOR_ARRIVALS.has(arrival);

/* ------------------------------------------------------------------ GATE 1 */

/**
 * canAccess — the surface gate. May this role enter this node at all?
 * Deny by default: a node with no rule is locked. Free reaches only the one
 * continuation they arrived on; leaf grounds are always referenceable; every
 * paid register reads the corpus. (Public/admin routes are route policy, not
 * this gate.)
 */
export function canAccess(
  node: MirrorNode | undefined,
  role: Role,
  isEntry = false,
): boolean {
  if (!node) return false;                       // deny by default
  if (node.kind === "leaf/borrow") return true;  // a ground, not a gated surface
  if (node.conduct_status === "withdrawn-for-conduct" && role !== "arch") return false;
  if (role === "cont" || role === "build" || role === "arch") return true;
  return isEntry === true;                        // free: only the entry continuation
}

/* ------------------------------------------------------------------ GATE 2 */

/**
 * The composition matrix (Composition §3, frozen). Keyed [element][role] -> state.
 * Architect inherits Builder except where an `arch` cell is given (the §3 [A]
 * marks). Anything unmapped is HIDDEN (deny by default).
 */
export type CompositionMatrix = Record<string, Partial<Record<Role, ElementState>>>;

export const COMPOSITION: CompositionMatrix = {
  // ── global chrome (every page) ──────────────────────────────────────────
  wordmark:            { free: "full",   cont: "full",   build: "full" },
  primary_nav:         { free: "plain",  cont: "plain",  build: "plain" },
  admin_nav:           { free: "hidden", cont: "hidden", build: "full" },   // My slot·Encounters; [A]+Architect
  breadcrumb:          { free: "plain",  cont: "plain",  build: "full" },   // title-only vs with-route
  route_strip:         { free: "hidden", cont: "hidden", build: "full" },
  invariant_strip:     { free: "hidden", cont: "hidden", build: "full" },   // §4: readers never see engine telemetry
  footer_constitution: { free: "full",   cont: "full",   build: "full" },

  // ── entry continuation /t/[entry] ───────────────────────────────────────
  arrival_banner:      { free: "plain",  cont: "plain",  build: "plain" },
  continuation_title:  { free: "full",   cont: "full",   build: "full" },
  continuation_body:   { free: "full",   cont: "full",   build: "full" },   // free+!entry -> locked (rule below)
  prose:               { free: "full",   cont: "full",   build: "full" },   // the WORDS differ via resolveTerm
  membrane:            { free: "plain",  cont: "plain",  build: "full" },
  honest_ledger:       { free: "deferred", cont: "honest", build: "full" }, // deferred->full for rigor (rule)
  engine_tags:         { free: "hidden", cont: "hidden", build: "full" },
  rail_grounds:        { free: "plain",  cont: "plain",  build: "full" },
  rail_connects:       { free: "plain",  cont: "plain",  build: "full" },
  rail_leads_to:       { free: "plain",  cont: "plain",  build: "full" },
  frontier_prompt:     { free: "plain",  cont: "plain",  build: "full" },
  exit_to_home:        { free: "plain",  cont: "plain",  build: "plain" },

  // ── construction /c/[slug] — never free ─────────────────────────────────
  construction_body:        { free: "locked", cont: "full",   build: "full" },
  construction_header_tags: { free: "hidden", cont: "plain",  build: "full" }, // cont: home only
  construction_ledger:      { free: "hidden", cont: "honest", build: "full" },
  construction_rails:       { free: "hidden", cont: "plain",  build: "full" },

  // ── home / (reached by exiting) ─────────────────────────────────────────
  recognition_line:    { free: "full",   cont: "full",   build: "full" },
  doorways:            { free: "plain",  cont: "plain",  build: "plain" },
  home_ctas:           { free: "plain",  cont: "plain",  build: "plain" },

  // ── map /map ────────────────────────────────────────────────────────────
  domain_cards:        { free: "plain",  cont: "plain",  build: "full" },
  what_it_owes:        { free: "hidden", cont: "full",   build: "full" },
  basin_layout:        { free: "hidden", cont: "hidden", build: "hidden", arch: "full" }, // [A] only

  // ── events / about (plain public) ───────────────────────────────────────
  public_content:      { free: "full",   cont: "full",   build: "full" },

  // ── forum /forum ────────────────────────────────────────────────────────
  conduct_banner:      { free: "full",   cont: "full",   build: "full" },   // visible even when gated
  forum_posts:         { free: "locked", cont: "full",   build: "full" },   // email gate
  removal_audit:       { free: "hidden", cont: "hidden", build: "hidden", arch: "full" }, // [A] only

  // ── account /account ────────────────────────────────────────────────────
  tier_cards:          { free: "full",   cont: "full",   build: "full" },
  constitution_copy:   { free: "full",   cont: "full",   build: "full" },

  // ── admin surfaces ──────────────────────────────────────────────────────
  builder_slot:        { free: "hidden", cont: "hidden", build: "full" },
  architect_console:   { free: "hidden", cont: "hidden", build: "hidden", arch: "full" }, // [A] only
};

/** Body-type elements: a free non-entry view of these is locked, not hidden. */
const BODY_ELEMENTS = new Set(["continuation_body", "prose"]);

/** Resolve a matrix cell with Architect-inherits-Builder (the §3 [A] rule). */
function cell(matrix: CompositionMatrix, element: string, role: Role): ElementState | undefined {
  const row = matrix[element];
  if (!row) return undefined;
  if (role === "arch") return row.arch ?? row.build;
  return row[role];
}

/**
 * showElement — the element gate (Composition §5 policy function). Data-driven
 * over COMPOSITION; deny by default to HIDDEN. Applies the two ctx overrides:
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
  let state = cell(matrix, element, role) ?? "hidden"; // deny by default
  if (state === "deferred" && isRigorArrival(ctx.arrival)) state = "full";
  return state;
}

/* ----------------------------------------------------- viewport (Device §1) */

/** Layout directives a template applies on top of the state. Reader surface is
 *  device-EQUAL; the instrument is device-GRACEFUL — nothing hover-only (§0,§2). */
export type DeviceBehavior =
  | "stacked" | "side-by-side" | "tap-to-peek" | "hover-or-tap"
  | "collapsible" | "inline" | "read-first" | "full" | "chip";

const DEVICE: Record<string, { mobile: DeviceBehavior; desktop: DeviceBehavior }> = {
  rail_grounds:      { mobile: "stacked", desktop: "side-by-side" },
  rail_connects:     { mobile: "stacked", desktop: "side-by-side" },
  rail_leads_to:     { mobile: "stacked", desktop: "side-by-side" },
  construction_rails:{ mobile: "stacked", desktop: "side-by-side" },
  membrane:          { mobile: "tap-to-peek", desktop: "hover-or-tap" },
  honest_ledger:     { mobile: "collapsible", desktop: "inline" },
  construction_ledger:{ mobile: "collapsible", desktop: "inline" },
  invariant_strip:   { mobile: "chip", desktop: "full" },
  architect_console: { mobile: "read-first", desktop: "full" },
  builder_slot:      { mobile: "full", desktop: "full" },
};

/**
 * deviceBehavior — the viewport dimension of composition (Device §1). Returns
 * the layout directive for an element at a viewport; tablet follows desktop
 * columns unless an element opts into the mobile stack. Never returns a
 * hover-ONLY behavior for mobile (touch has no hover, §2).
 */
export function deviceBehavior(element: string, viewport: Viewport): DeviceBehavior {
  const d = DEVICE[element];
  if (!d) return "full";
  return viewport === "mobile" ? d.mobile : d.desktop;
}

/* ------------------------------------------------------------------ GATE 3 */

/**
 * resolveTerm — the word gate (Lexicon §E). Returns the render decision for one
 * BOUND term (§B′: only author-marked / architect-approved / none-auto-wrapped
 * spans are ever resolved — a detected string never reaches here). Deny by
 * default: an unmapped term renders PLAIN. A banned term returns ERROR (the
 * build lint). Pure: on GLOSS the caller logs the gloss_shown event (§B′).
 */
export function resolveTerm(term: TermRecord | undefined, ctx: Ctx): TermDecision {
  if (!term) return "PLAIN"; // deny by default — unmapped renders plain

  switch (term.disposition) {
    case "banned":
      return "ERROR"; // build lint; never ships

    case "experience":
      return ctx.register === "system" ? "BARE" : "SUPPRESS";

    case "demote":
      // §C: "bare only in system / deep". The deep rung is reaching the term
      // through its prerequisites; a root demote term (no requires) has no deep
      // rung, so it stays demoted on the reader surface (§H: spine -> plain).
      return ctx.register === "system" || (term.requires.length > 0 && earned(term, ctx.readerVocab))
        ? "BARE" : "PLAIN";

    case "teach":
      if (term.arrival_early?.includes(ctx.arrival)) return "BARE";
      if (ctx.readerVocab.has(term.term)) return "BARE";
      if (earned(term, ctx.readerVocab)) return "GLOSS";
      return "DEFER";

    default:
      return "PLAIN";
  }
}

/* ----------------------------------------------------------- THE PIPELINE */

export interface PipelineResult {
  access: boolean;
  elements: Record<string, ElementState>;
}

/**
 * The three gates, in order (§0 rule 2). Templates call this so no template
 * decides visibility itself (P7). Surface first; if denied, nothing downstream.
 */
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

// Re-export the lexicon types the gate consumes, for callers of gate 3.
export type { TermRecord } from "./lexicon";
export { earned } from "./lexicon";
