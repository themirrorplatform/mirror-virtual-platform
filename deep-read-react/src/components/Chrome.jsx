import React, { useEffect, useRef, useState } from 'react';

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

/** Scroll-progress hairline. Prompt 1 rebuilds this on Lenis's scroll value. */
export function Progress() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      el.style.width = `${pct || 0}%`;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return <div className="progress" ref={ref} />;
}

/** Right-rail dot navigation with active-section tracking. */
export function DotNav() {
  const [active, setActive] = useState('open');
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
  return (
    <nav className="dots" aria-label="Sections">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} aria-label={s.label} className={active === s.id ? 'on' : ''} />
      ))}
    </nav>
  );
}
