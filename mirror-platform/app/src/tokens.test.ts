import { describe, it, expect } from "vitest";
import { color, bodyColors, isBodySafe, a11y, cssVariables } from "./tokens";

/* The accessibility floor as assertions (Device §2 — acceptance criteria). */
describe("crest a11y floor", () => {
  it("Gold is decorative/large-only — never a body-text color", () => {
    expect(isBodySafe("gold")).toBe(false);
    expect(bodyColors).not.toContain("gold");
  });
  it("Bone and Steel carry body copy (the readable pair)", () => {
    expect(isBodySafe("bone")).toBe(true);
    expect(isBodySafe("steel")).toBe(true);
  });
  it("tap targets are at least 44px and the focus ring is Steel", () => {
    expect(a11y.minTapTargetPx).toBeGreaterThanOrEqual(44);
    expect(a11y.focusRing.color).toBe(color.steel);
  });
  it("emits the palette as CSS variables with a single source", () => {
    const css = cssVariables();
    expect(css).toContain("--c-stage: #0B0A08");
    expect(css).toContain("--c-gold: #C9A227");
    expect(css).toContain(`--tap-min: ${a11y.minTapTargetPx}px`);
  });
});
