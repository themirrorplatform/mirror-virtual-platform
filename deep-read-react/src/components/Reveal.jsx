import React, { useEffect, useRef } from 'react';

/**
 * Reveal — the `.rise` reveal primitive, ported from the canonical static site's
 * IntersectionObserver pattern. Prompt 0 baseline; Prompt 1 replaces the engine
 * with Lenis + GSAP ScrollTrigger choreography. Honors prefers-reduced-motion
 * (the CSS collapses .rise to its final state).
 *
 * @param {string} as      element tag (default span/div via `as`)
 * @param {0|1|2|3} delay   staggered delay step (maps to .d1/.d2/.d3)
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) el.classList.add('in'); }),
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const d = delay ? ` d${delay}` : '';
  return (
    <Tag ref={ref} className={`rise${d}${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </Tag>
  );
}
