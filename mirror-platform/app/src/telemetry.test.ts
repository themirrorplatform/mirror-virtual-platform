import { describe, it, expect } from "vitest";
import { EVENT_KINDS, type EventKind } from "./lib/telemetry";

/* The razor (§0), as a test: the instrument can measure intelligibility-carried,
   and CANNOT measure retention — because no retention kind exists to write. */
describe("Telemetry §0 — the razor is encoded in the type", () => {
  it("captures exactly the frozen §1 verbs of a climb", () => {
    expect([...EVENT_KINDS].sort()).toEqual([
      "arrival", "builder_upload", "continue_pressed", "exit_to_home",
      "frontier_reached", "gate_abandon", "gate_convert", "gate_hit",
      "gloss_shown", "membrane_open", "rail_follow", "read_depth",
    ]);
  });

  it("has NO retention metric — the slot machine cannot be built with it", () => {
    const banned = ["time_on_site", "session_length", "return_frequency", "streak", "dwell"];
    for (const b of banned) expect(EVENT_KINDS as readonly string[]).not.toContain(b);
  });

  it("every kind is intelligibility/encounter-shaped, not engagement-shaped", () => {
    // a compile-time guarantee mirrored at runtime: the set is closed.
    const k: EventKind = "read_depth";
    expect(EVENT_KINDS).toContain(k);
    expect(EVENT_KINDS.length).toBe(12);
  });
});
