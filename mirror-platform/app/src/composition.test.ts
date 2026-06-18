import { describe, it, expect } from "vitest";
import { showElement, deviceBehavior, type Ctx, type Role } from "./gates";

const ctx = (p: Partial<Ctx> = {}): Ctx => ({
  arrival: "cold", isEntryNode: true, viewport: "mobile",
  register: "transmission", readerVocab: new Set(), ...p,
});

/** The §4 crossover audit: each leak must be closed per the §3 matrix. */
describe("Composition §4 — the crossover leaks are gone", () => {
  const reader: Role[] = ["free", "cont"];

  it("invariant strip: Builder+ only, never a reader", () => {
    for (const r of reader) expect(showElement("invariant_strip", r, ctx())).toBe("hidden");
    expect(showElement("invariant_strip", "build", ctx())).toBe("full");
    expect(showElement("invariant_strip", "arch", ctx())).toBe("full");
  });
  it("raw route strip: Builder+; readers get plain breadcrumb only", () => {
    for (const r of reader) expect(showElement("route_strip", r, ctx())).toBe("hidden");
    expect(showElement("breadcrumb", "free", ctx())).toBe("plain");
    expect(showElement("route_strip", "build", ctx())).toBe("full");
  });
  it("rails: Free plain, Continuations plain, Builder full mono", () => {
    expect(showElement("rail_grounds", "free", ctx())).toBe("plain");
    expect(showElement("rail_leads_to", "cont", ctx())).toBe("plain");
    expect(showElement("rail_grounds", "build", ctx())).toBe("full");
  });
  it("construction header engine numbers: Builder+ only", () => {
    expect(showElement("construction_header_tags", "free", ctx())).toBe("hidden");
    expect(showElement("construction_header_tags", "cont", ctx())).toBe("plain"); // home only
    expect(showElement("construction_header_tags", "build", ctx())).toBe("full");
  });
  it("honest ledger: Free deferred (rigor->full), Cont honest, Builder full", () => {
    expect(showElement("honest_ledger", "free", ctx({ arrival: "cold" }))).toBe("deferred");
    expect(showElement("honest_ledger", "free", ctx({ arrival: "ea" }))).toBe("full");
    expect(showElement("honest_ledger", "cont", ctx())).toBe("honest");
    expect(showElement("honest_ledger", "build", ctx())).toBe("full");
  });
  it("map 'what it owes': Continuations+ only", () => {
    expect(showElement("what_it_owes", "free", ctx())).toBe("hidden");
    expect(showElement("what_it_owes", "cont", ctx())).toBe("full");
  });
});

describe("Composition §3 — [A] cells: Architect inherits Builder except marked", () => {
  it("architect console is [A]-only; Builder is denied", () => {
    expect(showElement("architect_console", "build", ctx())).toBe("hidden");
    expect(showElement("architect_console", "arch", ctx())).toBe("full");
  });
  it("removal audit + basin layout are [A]-only", () => {
    expect(showElement("removal_audit", "build", ctx())).toBe("hidden");
    expect(showElement("removal_audit", "arch", ctx())).toBe("full");
    expect(showElement("basin_layout", "build", ctx())).toBe("hidden");
    expect(showElement("basin_layout", "arch", ctx())).toBe("full");
  });
  it("architect inherits a plain Builder cell where no [A] override exists", () => {
    expect(showElement("rail_grounds", "arch", ctx())).toBe("full"); // inherits build
    expect(showElement("invariant_strip", "arch", ctx())).toBe("full");
  });
});

describe("Forum + Atlas gating (P12 · P13)", () => {
  it("conduct banner is public; the removal audit is architect-only", () => {
    for (const r of ["free", "cont", "build", "arch"] as Role[])
      expect(showElement("conduct_banner", r, ctx())).toBe("full");
    expect(showElement("removal_audit", "free", ctx())).toBe("hidden");
    expect(showElement("removal_audit", "cont", ctx())).toBe("hidden");
    expect(showElement("removal_audit", "arch", ctx())).toBe("full");
  });
  it("forum posts are email-gated: locked for Free, full once in", () => {
    expect(showElement("forum_posts", "free", ctx())).toBe("locked");
    expect(showElement("forum_posts", "cont", ctx())).toBe("full");
  });
  it("atlas: domain cards public, 'what it owes' Continuations+ only", () => {
    expect(showElement("domain_cards", "free", ctx())).toBe("plain");
    expect(showElement("domain_cards", "build", ctx())).toBe("full");
    expect(showElement("what_it_owes", "free", ctx())).toBe("hidden");
    expect(showElement("what_it_owes", "cont", ctx())).toBe("full");
  });
});

describe("Device §1 — the viewport axis (reader-equal, instrument-graceful)", () => {
  it("rails stack on mobile, side-by-side on desktop", () => {
    expect(deviceBehavior("rail_grounds", "mobile")).toBe("stacked");
    expect(deviceBehavior("rail_grounds", "desktop")).toBe("side-by-side");
  });
  it("membrane is tap-to-peek on mobile, never hover-only (touch has no hover)", () => {
    expect(deviceBehavior("membrane", "mobile")).toBe("tap-to-peek");
  });
  it("the architect console is read-first on mobile, full on desktop", () => {
    expect(deviceBehavior("architect_console", "mobile")).toBe("read-first");
    expect(deviceBehavior("architect_console", "desktop")).toBe("full");
  });
  it("tablet follows desktop columns by default", () => {
    expect(deviceBehavior("rail_grounds", "tablet")).toBe("side-by-side");
  });
});
