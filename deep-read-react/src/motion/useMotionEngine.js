import { useLayoutEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './reducedMotion';
import { initSetPieces } from './setPieces';

gsap.registerPlugin(ScrollTrigger);

/**
 * The motion engine. Mounted once at the app root.
 *
 *  - Lenis smooth scroll (lerp 0.09), wired to GSAP's ticker and
 *    ScrollTrigger.update so scroll-driven animation stays in lockstep.
 *    Native scroll (keyboard, scrollbar, touch) stays fully functional.
 *  - Per-scene entrance choreography: eyebrow -> headline -> body -> CTA
 *    stagger in (blur 8->0, y 40->0, opacity), scrubbed over the first
 *    ~40% of each scene's entry. The hero plays once on load.
 *  - Per-scene gentle EXIT drift so scenes hand off continuously.
 *  - Split-text masked line reveals on exactly two moments: the hero
 *    billing and the closing attribution.
 *  - Three parallax layers only: crest (0.85x), grain (1.12x), hero glow (1.05x).
 *
 * Under prefers-reduced-motion none of this runs; CSS leaves every element
 * in its final, visible state and the browser scrolls natively.
 *
 * @returns the Lenis instance (or null) for the chrome to read scroll from.
 */
export function useMotionEngine() {
  const [lenis, setLenis] = useState(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return; // single switch: bypass everything

    // --- Lenis + GSAP ticker ---------------------------------------------
    const lenisInstance = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisInstance.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenisInstance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenisInstance);

    // --- Choreography (scoped so cleanup reverts everything) --------------
    let disposeSetPieces = () => {};
    const ctx = gsap.context(() => {
      // Split-text: hide each masked line below its mask.
      gsap.set('[data-split] [data-line]', { yPercent: 110 });

      // Mobile pacing: staggers/durations 30% faster (Prompt 6).
      const sf = window.matchMedia('(max-width: 700px)').matches ? 0.7 : 1;

      gsap.utils.toArray('.scene').forEach((scene, i) => {
        const isHero = scene.id === 'open';
        const sealed = scene.id === 'sealed';
        const odd = i % 2 === 1;
        const items = scene.querySelectorAll('[data-rise]');

        if (items.length) {
          if (isHero) {
            gsap.set(items, { autoAlpha: 0, y: 40, filter: 'blur(8px)' });
            gsap.to(items, {
              autoAlpha: 1, y: 0, filter: 'blur(0px)',
              duration: 1.0 * sf, ease: 'power3.out', stagger: 0.12 * sf, delay: 0.15,
            });
          } else {
            // Alternate the entrance character so no two adjacent scenes match,
            // and let the archive (#sealed) descend from deeper.
            const from = sealed
              ? { autoAlpha: 0, y: 64, filter: 'blur(10px)' }
              : odd
                ? { autoAlpha: 0, y: 30, x: -16, filter: 'blur(6px)' }
                : { autoAlpha: 0, y: 42, filter: 'blur(8px)' };
            gsap.set(items, from);
            gsap.to(items, {
              autoAlpha: 1, y: 0, x: 0, filter: 'blur(0px)',
              ease: 'power3.out',
              stagger: { each: 0.12 * sf, from: odd ? 'end' : 'start' },
              scrollTrigger: { trigger: scene, start: 'top 85%', end: 'top 45%', scrub: 0.6 },
            });
          }
        }

        // Gentle exit drift — the scene rises and dims as the next arrives.
        // The hero descends a touch deeper into the handoff.
        const inner = scene.querySelector('.inner');
        if (inner) {
          gsap.to(inner, {
            y: isHero ? -48 : -36, autoAlpha: 0.35, ease: 'none',
            scrollTrigger: { trigger: scene, start: 'bottom 65%', end: 'bottom 12%', scrub: true },
          });
        }
      });

      // hero -> sealed: the archive settles into focus as you descend into it.
      const sealedInner = document.querySelector('#sealed .inner');
      if (sealedInner) {
        gsap.fromTo(sealedInner, { scale: 1.04 }, {
          scale: 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#sealed', start: 'top 92%', end: 'top 42%', scrub: 0.5 },
        });
      }

      // Hero billing — masked lines rise on load (90ms stagger).
      gsap.to('#open [data-split] [data-line]', {
        yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.4,
      });

      // Closing attribution — masked lines rise when the house scene enters.
      const house = document.querySelector('#house [data-split]');
      if (house) {
        gsap.to(house.querySelectorAll('[data-line]'), {
          yPercent: 0, duration: 1.0, ease: 'power4.out', stagger: 0.09,
          scrollTrigger: { trigger: house, start: 'top 80%' },
        });
      }

      // Parallax — three layers, all barely-there.
      const layers = [
        ['[data-parallax="crest"]', 9],   // 0.85x — drifts down, slower than scroll
        ['[data-parallax="grain"]', -16],  // 1.12x — faster than scroll
        ['[data-parallax="glow"]', -6],    // 1.05x — a touch faster
      ];
      layers.forEach(([sel, shift]) => {
        gsap.utils.toArray(sel).forEach((el) => {
          const scope = el.closest('.scene') || document.body;
          gsap.to(el, {
            yPercent: shift, ease: 'none',
            scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
      });

      // bespoke scene set pieces (ledger, sides, seat)
      disposeSetPieces = initSetPieces();
    });

    // Recalculate trigger positions once fonts/images settle.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const refreshTimer = setTimeout(refresh, 600);

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('load', refresh);
      disposeSetPieces();
      ctx.revert();
      gsap.ticker.remove(tick);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  return lenis;
}
