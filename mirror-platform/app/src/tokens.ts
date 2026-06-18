/* ============================================================================
   The Mirror Platform — the crest design system (P4)
   Everything Spec §16 + Device-Access §2. One source of truth for the palette,
   type, spacing, motion, and the accessibility floor. Re-skinned to the crest
   register; the prototype's ink/amber/sage is the near-variant we are replacing.

   ACCESSIBILITY FLOOR (Device §2, non-negotiable acceptance criteria):
     - Bone on Stage passes WCAG AA for body text; Steel and Bone carry copy.
     - GOLD IS DECORATIVE / LARGE-ONLY — never body text (it fails AA at small
       sizes). The `gold` token is exported, but `bodyColors` deliberately omits
       it; see assertGoldNotBody().
     - tap targets >= 44px; visible :focus-visible rings; honor reduced-motion.
   ========================================================================== */

/** The crest palette (§16). Hex is frozen. */
export const color = {
  stage: "#0B0A08",    // the ground
  stage2: "#141210",   // raised surface
  stage3: "#1d1a16",   // hover surface
  bone: "#E9E4D8",     // primary body text — passes AA on stage
  bone2: "#b7b1a4",    // secondary text
  bone3: "#7d776c",    // tertiary / mono labels
  gold: "#C9A227",     // DECORATIVE / LARGE ONLY — never body
  steel: "#8FA7B3",    // links, focus ring, accents — passes AA on stage
  seal: "#B3261E",     // the wall / seal-risk / conduct
  line: "#2a2620",     // hairlines, borders
} as const;

export type ColorToken = keyof typeof color;

/** Colors permitted for body copy (AA on stage). Gold is intentionally absent. */
export const bodyColors: ColorToken[] = ["bone", "bone2", "steel"];

/** The three register typefaces (Voice §1). Typeface = voice = who speaks. */
export const font = {
  /** Threshold — the house, at recognition. */
  threshold: `'Playfair Display', Georgia, serif`,
  /** Transmission — A Reflection's prose (the platform never generates it). */
  transmission: `'Spectral', Georgia, serif`,
  /** System — the instrument: labels, status, ledgers, routes. */
  system: `'IBM Plex Mono', ui-monospace, monospace`,
} as const;

export const space = { xs: 4, sm: 8, md: 14, lg: 22, xl: 34, xxl: 56 } as const;
export const radius = { sm: 1, md: 2, lg: 9 } as const;

/** Motion. Durations in ms; all transitions are disabled under reduced-motion. */
export const motion = {
  fast: 200,
  base: 250,
  slide: 500,
  easing: "cubic-bezier(.2,.7,.2,1)",
} as const;

/** The accessibility floor as machine-checkable constants (Device §2). */
export const a11y = {
  minTapTargetPx: 44,
  focusRing: { color: color.steel, widthPx: 2, offsetPx: 2 },
  /** body text must use one of bodyColors and never gold. */
  bodyColorTokens: bodyColors,
} as const;

/**
 * Guard used by the design lint / tests: gold must never be a body-text color.
 * Returns true iff the token is safe for body copy.
 */
export function isBodySafe(token: ColorToken): boolean {
  return bodyColors.includes(token);
}

/**
 * The crest tokens as CSS custom properties, for the global stylesheet. Keeping
 * this generated from `color`/`font` means the palette has exactly one source.
 */
export function cssVariables(): string {
  const vars: string[] = [];
  for (const [k, v] of Object.entries(color)) vars.push(`  --c-${k}: ${v};`);
  vars.push(`  --font-threshold: ${font.threshold};`);
  vars.push(`  --font-transmission: ${font.transmission};`);
  vars.push(`  --font-system: ${font.system};`);
  vars.push(`  --motion-base: ${motion.base}ms;`);
  vars.push(`  --motion-slide: ${motion.slide}ms;`);
  vars.push(`  --motion-easing: ${motion.easing};`);
  vars.push(`  --tap-min: ${a11y.minTapTargetPx}px;`);
  return `:root {\n${vars.join("\n")}\n}`;
}
