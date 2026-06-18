import { describe, it, expect } from "vitest";
import {
  canAccess, showElement, resolveTerm, runPipeline,
  type Ctx, type TermRecord,
} from "./gates";
import type { MirrorNode } from "./types";

function node(id: string, p: Partial<MirrorNode> = {}): MirrorNode {
  return {
    id, label: id, kind: "attempt", content_home: "philosophy",
    substrate: ["thought"], register: "live", rests_on: [], pulls_to: [],
    stage: "captured", verdict: null, refuter: null, ...p,
  };
}

function ctx(p: Partial<Ctx> = {}): Ctx {
  return {
    arrival: "cold", isEntryNode: false, viewport: "mobile",
    register: "transmission", readerVocab: new Set(), ...p,
  };
}

describe("canAccess (surface gate, deny by default)", () => {
  it("locks an unknown node", () => {
    expect(canAccess(undefined, "free")).toBe(false);
  });
  it("free reaches only its entry continuation", () => {
    const n = node("t");
    expect(canAccess(n, "free", false)).toBe(false);
    expect(canAccess(n, "free", true)).toBe(true);
  });
  it("paid registers read the corpus; leaves are always referenceable", () => {
    expect(canAccess(node("t"), "cont")).toBe(true);
    expect(canAccess(node("g", { kind: "leaf/borrow" }), "free")).toBe(true);
  });
  it("hides a conduct-withdrawn node from everyone but the architect", () => {
    const w = node("w", { conduct_status: "withdrawn-for-conduct" });
    expect(canAccess(w, "build")).toBe(false);
    expect(canAccess(w, "arch")).toBe(true);
  });
});

describe("showElement (element gate, deny by default to hidden)", () => {
  it("hides an unmapped element", () => {
    expect(showElement("nonexistent_widget", "free", ctx())).toBe("hidden");
  });
  it("never renders the invariant strip to a reader", () => {
    expect(showElement("invariant_strip", "free", ctx())).toBe("hidden");
    expect(showElement("invariant_strip", "cont", ctx())).toBe("hidden");
    expect(showElement("invariant_strip", "build", ctx())).toBe("full");
  });
  it("defers the ledger for a cold free arrival, full for a rigor arrival", () => {
    expect(showElement("honest_ledger", "free", ctx({ arrival: "cold" }))).toBe("deferred");
    expect(showElement("honest_ledger", "free", ctx({ arrival: "lesswrong" }))).toBe("full");
  });
  it("locks a body for a free non-entry view", () => {
    expect(showElement("continuation_body", "free", ctx({ isEntryNode: false }))).toBe("locked");
    expect(showElement("continuation_body", "free", ctx({ isEntryNode: true }))).toBe("hidden");
  });
});

describe("resolveTerm (word gate, deny by default to plain)", () => {
  const teach = (p: Partial<TermRecord> = {}): TermRecord => ({
    term: "the-ground", disposition: "teach", requires: ["valence", "stake"],
    first_gloss: "what the whole thing rests on", ...p,
  });

  it("renders an unmapped term plain (never auto-defines)", () => {
    expect(resolveTerm(undefined, ctx())).toBe("PLAIN");
  });
  it("errors on a banned term (the build lint)", () => {
    expect(resolveTerm({ term: "unlock", disposition: "banned", requires: [] }, ctx())).toBe("ERROR");
  });
  it("defers a teach term until its requires are earned", () => {
    expect(resolveTerm(teach(), ctx({ readerVocab: new Set() }))).toBe("DEFER");
    expect(resolveTerm(teach(), ctx({ readerVocab: new Set(["valence", "stake"]) }))).toBe("GLOSS");
  });
  it("goes bare once the term itself is in vocab, or for an arrival_early reader", () => {
    expect(resolveTerm(teach(), ctx({ readerVocab: new Set(["valence", "stake", "the-ground"]) }))).toBe("BARE");
    expect(resolveTerm(teach({ arrival_early: ["lesswrong"] }), ctx({ arrival: "lesswrong" }))).toBe("BARE");
  });
  it("suppresses an experience term on a reader surface, bare in system", () => {
    const exp: TermRecord = { term: "rests-on", disposition: "experience", requires: [] };
    expect(resolveTerm(exp, ctx({ register: "transmission" }))).toBe("SUPPRESS");
    expect(resolveTerm(exp, ctx({ register: "system" }))).toBe("BARE");
  });
});

describe("runPipeline (the three gates, in order)", () => {
  it("short-circuits when access is denied", () => {
    const r = runPipeline(node("t"), "free", ctx(), ["continuation_title"], { isEntry: false });
    expect(r.access).toBe(false);
    expect(r.elements).toEqual({});
  });
  it("resolves elements once access is granted", () => {
    const r = runPipeline(node("t"), "cont", ctx(), ["continuation_title", "invariant_strip"]);
    expect(r.access).toBe(true);
    expect(r.elements.continuation_title).toBe("full");
    expect(r.elements.invariant_strip).toBe("hidden");
  });
});
