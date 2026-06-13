import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../motion/reducedMotion';

/**
 * The seat's submit button. Magnetic pull toward the cursor (strength 0.22,
 * with a springy elastic settle approximating stiffness 300 / damping 28 —
 * done in GSAP to avoid pulling framer-motion into the first-paint bundle),
 * a gold sheen sweep on hover (CSS), and a "seal" state where it briefly
 * becomes a red SEALED stamp. All of it collapses to instant on reduced motion.
 */
export default function MagneticButton({ children, sealing = false }) {
  const ref = useRef(null);
  const reduced = prefersReducedMotion();

  // When sealing, drop any magnetic offset so the CSS stamp transform reads clean.
  useEffect(() => {
    if (sealing && ref.current) gsap.set(ref.current, { x: 0, y: 0 });
  }, [sealing]);

  const onMove = (e) => {
    if (reduced || sealing) return;
    const b = ref.current.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2);
    const dy = e.clientY - (b.top + b.height / 2);
    gsap.to(ref.current, { x: dx * 0.22, y: dy * 0.22, duration: 0.5, ease: 'power3.out' });
  };
  const onLeave = () => {
    if (reduced) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
  };

  return (
    <button
      ref={ref}
      type="submit"
      className={`magnetic${sealing ? ' sealing' : ''}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <span className="magnetic-label">{sealing ? 'SEALED' : children}</span>
    </button>
  );
}
