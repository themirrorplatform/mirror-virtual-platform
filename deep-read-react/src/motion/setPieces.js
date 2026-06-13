import gsap from 'gsap';

/**
 * The three custom set pieces, in the house grammar
 * (gold = human, steel = machine, red = seals only).
 * Called inside the motion engine's gsap.context (so the scroll-driven tweens
 * are reverted with it). Returns a disposer for the DOM listeners it adds.
 *
 * Never runs under reduced motion — the engine bails before this is reached,
 * leaving every element in its final, visible state via CSS.
 */
export function initSetPieces() {
  const cleanups = [];
  // Mobile pacing: staggers/durations 30% faster (Prompt 6).
  const sf = window.matchMedia('(max-width: 700px)').matches ? 0.7 : 1;

  // ---- 1. THE SEALED LEDGER (#sealed) --------------------------------------
  // Rows assemble on scroll: redaction bars draw from the left, SEALED stamps
  // press in and pulse once. Hovering/tapping a row makes it resist.
  const ledger = document.querySelector('#sealed .ledger');
  if (ledger) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ledger, start: 'top 78%', toggleActions: 'play none none reverse' },
    });
    tl.from('#sealed .case .no', { autoAlpha: 0, x: -8, stagger: 0.12 * sf, duration: 0.4 * sf, ease: 'power2.out' }, 0)
      .from('#sealed .case .bar', { scaleX: 0, transformOrigin: 'left center', stagger: 0.12 * sf, duration: 0.6 * sf, ease: 'power2.out' }, 0)
      .from('#sealed .case .stamp', { scale: 1.3, autoAlpha: 0, transformOrigin: 'center', stagger: 0.12 * sf, duration: 0.5 * sf, ease: 'back.out(2)' }, 0.15)
      .fromTo('#sealed .case .stamp',
        { boxShadow: '0 0 0px rgba(179,38,30,0)' },
        { boxShadow: '0 0 16px rgba(179,38,30,0.6)', duration: 0.28 * sf, stagger: 0.12 * sf, yoyo: true, repeat: 1 }, 0.32);

    const rows = gsap.utils.toArray('#sealed .case');
    const resist = (el) =>
      gsap.to(el, { keyframes: { x: [0, 2, -2, 1, 0] }, duration: 0.35, ease: 'power2.out', overwrite: true });
    rows.forEach((row) => {
      const onEnter = () => resist(row);
      const onTouch = () => {
        row.classList.add('is-touched');
        resist(row);
        clearTimeout(row._t);
        row._t = setTimeout(() => row.classList.remove('is-touched'), 2200);
      };
      row.addEventListener('pointerenter', onEnter);
      row.addEventListener('touchstart', onTouch, { passive: true });
      cleanups.push(() => {
        row.removeEventListener('pointerenter', onEnter);
        row.removeEventListener('touchstart', onTouch);
        clearTimeout(row._t);
      });
    });
  }

  // ---- 2. THE SIDES (#sides) ----------------------------------------------
  // Gold line and steel line enter from opposite edges and meet; fact rows
  // cascade with alternating 12px left/right offsets.
  if (document.querySelector('#sides')) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '#sides', start: 'top 70%', toggleActions: 'play none none reverse' },
    });
    tl.from('#sides [data-edge="left"]', { x: -70, autoAlpha: 0, duration: 0.7 * sf, ease: 'power3.out' }, 0)
      .from('#sides [data-edge="right"]', { x: 70, autoAlpha: 0, duration: 0.7 * sf, ease: 'power3.out' }, 0)
      .from('#sides [data-edge="center"]', { y: 14, autoAlpha: 0, duration: 0.5 * sf, ease: 'power2.out' }, 0.32 * sf)
      .from('#sides .fields .row', {
        x: (i) => (i % 2 ? 12 : -12), autoAlpha: 0, stagger: 0.1 * sf, duration: 0.5 * sf, ease: 'power2.out',
      }, 0.22 * sf);
  }

  // ---- 3. THE SEAT (#seat) -------------------------------------------------
  // The form border draws itself as the scene enters.
  if (document.querySelector('#seat .seat-border rect')) {
    gsap.fromTo('#seat .seat-border rect',
      { strokeDashoffset: 100 },
      {
        strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut',
        scrollTrigger: { trigger: '#seat .seat', start: 'top 75%' },
      });
  }

  return () => cleanups.forEach((fn) => fn());
}
