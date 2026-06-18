import { describe, it, expect } from "vitest";
import {
  bindingMode, mayGloss, earned, deriveReaderVocab, findTermCycle,
  bannedTerms, type TermRecord, type TermGraph,
} from "./lexicon";

const T = (p: Partial<TermRecord> & Pick<TermRecord, "term">): TermRecord => ({
  register: "transmission", collision: "none", disposition: "teach", requires: [], ...p,
});

describe("§B′ binding rule — how a term may attach to prose", () => {
  it("inverts terms are author-marked spans only, never string-matched", () => {
    expect(bindingMode(T({ term: "the-ground", collision: "inverts" }))).toBe("author-marked");
    expect(bindingMode(T({ term: "residue", collision: "mild" }))).toBe("review-queue");
    expect(bindingMode(T({ term: "encounter", collision: "none" }))).toBe("auto-wrap");
  });

  it("the vocab law: no GLOSS from a detected span for inverts/mild terms", () => {
    const ground = T({ term: "the-ground", collision: "inverts" });
    expect(mayGloss(ground, "detected")).toBe(false);          // a regex guess never writes vocab
    expect(mayGloss(ground, "author-marked")).toBe(true);
    const residue = T({ term: "residue", collision: "mild" });
    expect(mayGloss(residue, "detected")).toBe(false);
    expect(mayGloss(residue, "architect-approved")).toBe(true);
  });
});

describe("§B term-DAG firewall — requires is acyclic (the firewall, in vocabulary)", () => {
  it("passes an acyclic term graph", () => {
    const g: TermGraph = {
      "the-ground": T({ term: "the-ground", requires: ["valence", "stake"] }),
      valence: T({ term: "valence", requires: [], tier0: true }),
      stake: T({ term: "stake", requires: [], tier0: true }),
    };
    expect(findTermCycle(g)).toBeNull();
  });
  it("catches a cycle (two words each presupposing the other)", () => {
    const g: TermGraph = {
      a: T({ term: "a", requires: ["b"] }),
      b: T({ term: "b", requires: ["a"] }),
    };
    const c = findTermCycle(g);
    expect(c).not.toBeNull();
    expect(c![0]).toBe(c![c!.length - 1]);
  });
  it("allows forward refs / dangles (an unresolved requires id is not a cycle)", () => {
    const g: TermGraph = { x: T({ term: "x", requires: ["not-yet-swept"] }) };
    expect(findTermCycle(g)).toBeNull();
  });
});

describe("§E readerVocab — derived from the event log, felt not counted", () => {
  it("builds the acquired set from gloss_shown events only", () => {
    const events = [
      { kind: "read", payload: {} },
      { kind: "gloss_shown", payload: { term: "valence" } },
      { kind: "gloss_shown", payload: { term: "stake" } },
      { kind: "rail_follow", payload: { term: "ignored" } },
    ];
    const vocab = deriveReaderVocab(events);
    expect([...vocab].sort()).toEqual(["stake", "valence"]);
  });

  it("earned() is computed from the term-DAG against that set", () => {
    const ground = T({ term: "the-ground", requires: ["valence", "stake"] });
    expect(earned(ground, new Set())).toBe(false);
    expect(earned(ground, new Set(["valence"]))).toBe(false);
    expect(earned(ground, new Set(["valence", "stake"]))).toBe(true);
  });
});

describe("§F build lint — banned surface terms must fail the build", () => {
  it("collects banned terms", () => {
    const g: TermGraph = {
      unlock: T({ term: "unlock", disposition: "banned", register: "system" }),
      encounter: T({ term: "encounter" }),
    };
    expect(bannedTerms(g)).toEqual(["unlock"]);
  });
});
