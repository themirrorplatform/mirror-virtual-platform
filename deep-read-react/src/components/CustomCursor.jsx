import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../motion/reducedMotion';

/**
 * Desktop custom cursor: a small bone dot (follows exactly) + a trailing gold
 * ring (lerp ~0.12) that expands over interactive elements and shows a mono
 * micro-label ("read" / "open" / "save"). The native cursor is NEVER hidden
 * (cursor:none is banned) so keyboard and pointer users keep the real cursor.
 * Disabled entirely on touch (pointer: coarse) and under reduced motion.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof matchMedia === 'function' &&
      matchMedia('(pointer: fine)').matches &&
      !prefersReducedMotion()
  );

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let raf;

    const labelFor = (el) => {
      const explicit = el.getAttribute('data-cursor');
      if (explicit !== null) return explicit;
      if (el.classList.contains('doclink')) return 'read';
      if (el.classList.contains('magnetic')) return 'save';
      if (el.closest('.dots')) return 'open';
      return '';
    };

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const interactive = e.target.closest && e.target.closest('a, button, input, [data-cursor]');
      if (interactive) {
        ring.classList.add('is-active');
        ring.dataset.label = labelFor(interactive);
      } else {
        ring.classList.remove('is-active');
        ring.dataset.label = '';
      }
    };
    const loop = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    const hide = () => { dot.style.opacity = '0'; ring.style.opacity = '0'; };
    const show = () => { dot.style.opacity = ''; ring.style.opacity = ''; };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
