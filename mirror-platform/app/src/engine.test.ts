import { describe, it, expect } from "vitest";
import {
  structuralLoad, assignDepth, findCycle, reverseRail,
  groundingLoad, components, openColumn, sealCheck,
} from "./engine";
import type { Graph, MirrorNode } from "./types";

/** Minimal node builder with sensible defaults for tests. */
function node(id: string, p: Partial<MirrorNode> = {}): MirrorNode {
  return {
    id, label: id, kind: "attempt", content_home: "philosophy",
    substrate: ["thought"], register: "live", rests_on: [], pulls_to: [],
    stage: "captured", verdict: null, refuter: null, ...p,
  };
}

/** a (leaf) <- b <- c : a chain where load propagates up rests_on. */
function chain(): Graph {
  return {
    a: node("a", { kind: "leaf/borrow" }),
    b: node("b", { rests_on: ["a"] }),
    c: node("c", { rests_on: ["b"] }),
  };
}

describe("structuralLoad (load, not frequency)", () => {
  it("counts transitive dependents up rests_on", () => {
    const g = chain();
    const load = structuralLoad(g);
    expect(load.a).toEqual({ direct: 1, trans: 2 }); // b directly; b,c transitively
    expect(load.b).toEqual({ direct: 1, trans: 1 });
    expect(load.c).toEqual({ direct: 0, trans: 0 });
  });

  it("ignores self-edges and edges to absent nodes", () => {
    const g: Graph = { x: node("x", { rests_on: ["x", "ghost"] }) };
    expect(structuralLoad(g).x).toEqual({ direct: 0, trans: 0 });
  });
});

describe("findCycle (the firewall)", () => {
  it("returns null for an acyclic graph", () => {
    expect(findCycle(chain())).toBeNull();
  });

  it("catches a cycle a prospective edge would create", () => {
    // a<-b<-c already; adding a.rests_on=c closes a->c->b->a
    const cyc = findCycle(chain(), { child: "a", parent: "c" });
    expect(cyc).not.toBeNull();
    // a cycle path starts and ends on the same id
    expect(cyc![0]).toBe(cyc![cyc!.length - 1]);
  });

  it("permits a non-cyclic prospective edge", () => {
    const g = chain();
    g.d = node("d");
    expect(findCycle(g, { child: "c", parent: "d" })).toBeNull();
  });
});

describe("reverseRail (computed 'leads to', never authored)", () => {
  it("returns nodes that rest on the target", () => {
    expect(reverseRail(chain(), "a")).toEqual(["b"]);
    expect(reverseRail(chain(), "b")).toEqual(["c"]);
    expect(reverseRail(chain(), "c")).toEqual([]); // a frontier
  });
});

describe("assignDepth (computed, never assigned)", () => {
  it("ranks the highest-load node into the metric tier", () => {
    const g = chain();
    const depth = assignDepth(g, structuralLoad(g));
    expect(depth.a).toBe("metric"); // a carries the whole chain
  });
});

describe("groundingLoad (the second geometry, may cycle)", () => {
  it("counts transitive pulls_to and terminates on cycles", () => {
    const g: Graph = {
      p: node("p", { pulls_to: ["q"] }),
      q: node("q", { pulls_to: ["p"] }), // a legal cycle in the soft geometry
    };
    const gl = groundingLoad(g);
    // a cycle means each node's transitive closure reaches the other and loops
    // back to itself, so both count 2 (matches protocol.py grounding_load).
    expect(gl.p.trans).toBe(2);
    expect(gl.q.trans).toBe(2);
  });
});

describe("components (Book One and EFT are disconnected)", () => {
  it("separates unconnected subgraphs", () => {
    const g: Graph = {
      a: node("a"), b: node("b", { rests_on: ["a"] }),
      x: node("x"), y: node("y", { rests_on: ["x"] }),
    };
    const comps = components(g);
    expect(comps.length).toBe(2);
    expect(comps[0].size).toBe(2);
  });
});

describe("openColumn (never empty = the invariant)", () => {
  it("keeps a node not at verdict_in", () => {
    const g: Graph = { n: node("n", { stage: "has_result", verdict: "HOLDS" }) };
    expect(openColumn(g)).toContain("n");
  });
  it("drops a verdict_in node with a closed verdict, keeps an open one", () => {
    const g: Graph = {
      closed: node("closed", { stage: "verdict_in", verdict: "STANDS" }),
      open: node("open", { stage: "verdict_in", verdict: "OPEN" }),
    };
    const oc = openColumn(g);
    expect(oc).toContain("open");
    expect(oc).not.toContain("closed");
  });
});

describe("sealCheck (§47: HOLDS/HELD needs a posted refuter)", () => {
  it("flags a hardened verdict with no refuter", () => {
    const g: Graph = { s: node("s", { verdict: "HOLDS", refuter: null }) };
    expect(sealCheck(g)).toContain("s");
  });
  it("clears once a wall is named", () => {
    const g: Graph = { s: node("s", { verdict: "HOLDS", refuter: "exhibit X" }) };
    expect(sealCheck(g)).not.toContain("s");
  });
});
