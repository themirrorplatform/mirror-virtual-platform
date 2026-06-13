/**
 * The single source of truth for the reduced-motion switch.
 * When this returns true, the whole motion engine is bypassed:
 * Lenis is never created, GSAP choreography never runs, and all content
 * is visible in its final state via plain CSS (no hidden initial states).
 */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
