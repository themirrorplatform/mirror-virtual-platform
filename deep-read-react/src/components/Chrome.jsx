import React, { useEffect, useRef, useState } from 'react';
import { useLenis } from '../motion/LenisContext';

const SECTIONS = [
  { id: 'open', label: 'Opening' },
  { id: 'sealed', label: 'The stories' },
  { id: 'sides', label: 'The readers' },
  { id: 'honest', label: 'How it stays fair' },
  { id: 'vow', label: 'The promise' },
  { id: 'seat', label: 'Your seat' },
  { id: 'institute', label: 'What comes after' },
  { id: 'house', label: 'The house' },
];

/** Top docket — the standing mast-head. */
export function Docket() {
  return (
    <div className="docket">
      <span>THE DEEP READ</span>
      <span>STORIES 0001–0005 · <span className="status">SEALED, FOR NOW</span></span>
    </div>
  );
}

/** Scroll-progress hairline, driven by Lenis's progress when present. */
export function Progress() {
  const ref = useRef(null);
  const lenis = useLenis();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setFromProgress = (p) => { el.style.width = `${Math.max(0, Math.min(1, p)) * 100}%`; };

    if (lenis) {
      const onScroll = ({ progress }) => setFromProgress(progress);
      lenis.on('scroll', onScroll);
      setFromProgress(lenis.progress || 0);
      return () => lenis.off('scroll', onScroll);
    }
    // Reduced-motion / no Lenis: native scroll.
    const onNative = () => {
      const h = document.documentElement;
      setFromProgress(h.scrollTop / (h.scrollHeight - h.clientHeight));
    };
    onNative();
    addEventListener('scroll', onNative, { passive: true });
    return () => removeEventListener('scroll', onNative);
  }, [lenis]);
  return <div className="progress" ref={ref} />;
}

/** Right-rail dot navigation: active tracking + Lenis-aware anchor scroll. */
export function DotNav() {
  const [active, setActive] = useState('open');
  const lenis = useLenis();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.5 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (e, id) => {
    if (!lenis) return; // reduced-motion: let the native anchor jump happen
    e.preventDefault();
    lenis.scrollTo(`#${id}`, { duration: 1.1 });
  };

  return (
    <nav className="dots" aria-label="Sections">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-label={s.label}
          className={active === s.id ? 'on' : ''}
          onClick={(e) => go(e, s.id)}
        />
      ))}
    </nav>
  );
}
