/* ============================================================================
   The Mirror Platform — the Knowledge Geometry engine (P3)
   A faithful TypeScript port of protocol.py's compute core.

   INVARIANTS (Everything Spec §4.3, enforced not decorative):
     1. NOTHING COMPLETES. The open column must never be empty.
     2. depends_on (rests_on) is ACYCLIC — the firewall.
     3. DEPTH IS COMPUTED, never assigned — derived from structural load.
     4. TWO GEOMETRIES: rests_on (rigid, acyclic) vs pulls_to (soft, may cycle),
        computed separately, never conflated.
     5. EDGE WEIGHT = LOAD, not frequency. Load = transitive dependents.

   Pure functions only. The read pipeline never mutates (§0 rule 3): these never
   write a node. depth is returned as a map, never assigned onto the nodes.
   ========================================================================== */

import type { Graph, DepthTier, ProspectiveEdge } from "./types";

/** Verdicts that keep a node in the open column (protocol.py open_column). */
const OPEN_VERDICTS = new Set([
  "OPEN", "HELD", "GAP", "UNTESTED", "NAMED", "QUALIFIED", "PARTIAL",
]);

/** Verdicts that harden a claim — and so require a posted refuter (seal_check). */
const HELD_VERDICTS = new Set(["HOLDS", "HELD", "STANDS", "RESPECTED"]);

export interface LoadEntry {
  /** direct dependents (immediate children over rests_on). */
  direct: number;
  /** transitive dependents — the structural load (§16: load, not frequency). */
  trans: number;
}
export type LoadMap = Record<string, LoadEntry>;

/**
 * children[p] = the set of nodes that rest_on p (the reverse of rests_on).
 * Self-edges and edges to absent nodes are ignored, as in protocol.py _children.
 */
function childrenMap(g: Graph): Record<string, Set<string>> {
  const ch: Record<string, Set<string>> = {};
  for (const id in g) ch[id] = new Set();
  for (const id in g) {
    for (const p of g[id].rests_on) {
      if (g[p] && p !== id) ch[p].add(id);
    }
  }
  return ch;
}

/**
 * Structural load: transitive dependent-count over rests_on (protocol.py
 * structural_load). This is edge weight — frequency is never used (§16).
 */
export function structuralLoad(g: Graph): LoadMap {
  const ch = childrenMap(g);
  const out: LoadMap = {};
  for (const id in g) {
    const seen = new Set<string>();
    const st = [...ch[id]];
    while (st.length) {
      const x = st.pop()!;
      if (seen.has(x)) continue;
      seen.add(x);
      for (const y of ch[x]) st.push(y);
    }
    out[id] = { direct: ch[id].size, trans: seen.size };
  }
  return out;
}

/**
 * Depth tier by load percentile (protocol.py assign_depth). COMPUTED — returned
 * as a map, never written onto the nodes (§4.3). Ranked by transitive load desc;
 * top 5% metric, next to 20% load-bearing, to 50% province, rest shallow.
 */
export function assignDepth(g: Graph, load: LoadMap): Record<string, DepthTier> {
  const ranked = Object.keys(g).sort((a, b) => load[b].trans - load[a].trans);
  const n = ranked.length || 1;
  const out: Record<string, DepthTier> = {};
  ranked.forEach((id, i) => {
    const f = i / n;
    out[id] = f < 0.05 ? "metric"
      : f < 0.20 ? "load-bearing"
      : f < 0.50 ? "province"
      : "shallow";
  });
  return out;
}

/**
 * The firewall (protocol.py find_cycles + the prototype's prospective check).
 * DFS over rests_on; returns the first cycle path found, or null. Pass a
 * prospective edge to test a write BEFORE committing it — this is how the
 * commit edge function refuses a cycle and offers a reroute to pulls_to.
 */
export function findCycle(g: Graph, prospective?: ProspectiveEdge): string[] | null {
  const ids = new Set(Object.keys(g));
  if (prospective) {
    ids.add(prospective.child);
    ids.add(prospective.parent);
  }
  const restsOn = (id: string): string[] => {
    const base = [...(g[id]?.rests_on ?? [])];
    if (prospective && prospective.child === id) base.push(prospective.parent);
    return base;
  };
  const color: Record<string, number> = {}; // 0/undef=white, 1=grey, 2=black
  let found: string[] | null = null;

  const dfs = (u: string, stack: string[]): void => {
    if (found) return;
    color[u] = 1;
    stack.push(u);
    for (const p of restsOn(u)) {
      if (!ids.has(p)) continue;
      if (color[p] === 1) {
        found = stack.slice(stack.indexOf(p)).concat(p);
        return;
      }
      if (!color[p]) dfs(p, stack);
      if (found) return;
    }
    stack.pop();
    color[u] = 2;
  };

  for (const id of ids) {
    if (!color[id]) dfs(id, []);
    if (found) break;
  }
  return found;
}

/**
 * The reader's "Leads to" rail: the reverse of everyone's rests_on, COMPUTED,
 * never authored (§4.4, §7). Returns the ids of nodes that rest on `id`.
 */
export function reverseRail(g: Graph, id: string): string[] {
  return Object.values(g)
    .filter((n) => n.rests_on.includes(id))
    .map((n) => n.id);
}

/**
 * Grounding load: transitive count over pulls_to (protocol.py grounding_load).
 * The grounding analogue of structuralLoad — the second geometry, which MAY
 * cycle, so the visited-set guards termination. Where §53's claim is testable.
 */
export function groundingLoad(g: Graph): LoadMap {
  const pc: Record<string, Set<string>> = {};
  for (const id in g) pc[id] = new Set();
  for (const id in g) {
    for (const p of g[id].pulls_to ?? []) {
      if (g[p] && p !== id) pc[p].add(id);
    }
  }
  const out: LoadMap = {};
  for (const id in g) {
    const seen = new Set<string>();
    const st = [...pc[id]];
    while (st.length) {
      const x = st.pop()!;
      if (seen.has(x)) continue;
      seen.add(x);
      for (const y of pc[x]) st.push(y);
    }
    out[id] = { direct: pc[id].size, trans: seen.size };
  }
  return out;
}

/**
 * Weakly-connected components over rests_on (protocol.py components). Book One
 * and the EFT region are deliberately disconnected; this surfaces that. Sorted
 * largest-first.
 */
export function components(g: Graph): Set<string>[] {
  const adj: Record<string, Set<string>> = {};
  for (const id in g) adj[id] = new Set();
  for (const id in g) {
    for (const p of g[id].rests_on) {
      if (g[p]) {
        adj[id].add(p);
        adj[p].add(id);
      }
    }
  }
  const seen = new Set<string>();
  const comps: Set<string>[] = [];
  for (const id in g) {
    if (seen.has(id)) continue;
    const st = [id];
    const c = new Set<string>();
    while (st.length) {
      const x = st.pop()!;
      if (seen.has(x)) continue;
      seen.add(x);
      c.add(x);
      for (const y of adj[x]) st.push(y);
    }
    comps.push(c);
  }
  return comps.sort((a, b) => b.size - a.size);
}

/**
 * The open column (protocol.py open_column): nodes that are not yet sealed —
 * either not at verdict_in, or at verdict_in with a still-open verdict. The
 * invariant (§4.3) is that this is NEVER empty; an empty column is the seal.
 */
export function openColumn(g: Graph): string[] {
  return Object.values(g)
    .filter(
      (n) =>
        n.kind !== "leaf/borrow" &&
        (n.stage !== "verdict_in" || OPEN_VERDICTS.has(n.verdict ?? "")),
    )
    .map((n) => n.id);
}

/**
 * Seal-risk check (protocol.py seal_check, §47): a hardened verdict
 * (HOLDS/HELD/...) with no posted refuter. A wall must be named before any
 * verdict hardens.
 */
export function sealCheck(g: Graph): string[] {
  return Object.values(g)
    .filter(
      (n) =>
        n.kind !== "leaf/borrow" &&
        HELD_VERDICTS.has(n.verdict ?? "") &&
        !n.refuter,
    )
    .map((n) => n.id);
}

/**
 * One pass of the whole engine, computed-on-read. Cheap enough for the client;
 * at write-time the commit edge function runs the same and caches load/depth.
 */
export interface GeometryReport {
  load: LoadMap;
  depth: Record<string, DepthTier>;
  grounding: LoadMap;
  cycle: string[] | null;
  components: Set<string>[];
  openColumn: string[];
  sealRisks: string[];
}

export function computeGeometry(g: Graph): GeometryReport {
  const load = structuralLoad(g);
  return {
    load,
    depth: assignDepth(g, load),
    grounding: groundingLoad(g),
    cycle: findCycle(g),
    components: components(g),
    openColumn: openColumn(g),
    sealRisks: sealCheck(g),
  };
}
