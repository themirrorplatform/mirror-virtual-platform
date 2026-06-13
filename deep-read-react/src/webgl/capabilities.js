import { prefersReducedMotion } from '../motion/reducedMotion';

/** True if the browser can give us a WebGL context at all. */
export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Coarse pointer / touch — used to disable mouse-parallax, not WebGL itself. */
export function isTouch() {
  return (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
}

/** Heuristic for low-power devices we shouldn't push a shader at. */
export function isWeakDevice() {
  const mem = navigator.deviceMemory;          // GB (may be undefined)
  const cores = navigator.hardwareConcurrency; // logical cores (may be undefined)
  if (typeof mem === 'number' && mem <= 2) return true;
  if (typeof cores === 'number' && cores <= 2) return true;
  return false;
}

/** Quick rAF probe → approximate idle frame rate. */
export function probeFps(frames = 12) {
  return new Promise((resolve) => {
    let count = 0;
    const start = performance.now();
    const tick = (t) => {
      count++;
      if (count >= frames) return resolve((count / (t - start)) * 1000);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/**
 * The single gate for mounting the WebGL hero. Everything degrades to the
 * static crest <img> (with its CSS glint) when this resolves false.
 */
export async function shouldUseWebGL() {
  // Explicit override for QA / debugging: ?webgl=off | ?webgl=force
  const q = typeof location !== 'undefined' ? location.search : '';
  if (/[?&]webgl=off/.test(q)) return false;
  const force = /[?&]webgl=force/.test(q);

  if (prefersReducedMotion()) return false;
  if (!supportsWebGL()) return false;
  if (force) return true;            // skip the heuristics (still requires WebGL + motion)
  if (isWeakDevice()) return false;
  const fps = await probeFps();
  return fps >= 40;
}
