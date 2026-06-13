import React, { useEffect, useRef, useState } from 'react';
import { shouldUseWebGL, isTouch } from '../webgl/capabilities';

/**
 * The hero crest. First paint is always the static <img> (with its CSS glint),
 * so the page is meaningful with no JS / no WebGL. When the device is capable,
 * the three.js chunk is lazy-imported and a Canvas fades in over the image.
 *
 * This element carries data-rise + data-parallax="crest" so the Prompt 1 motion
 * engine still choreographs its entrance and parallax, WebGL or not.
 */
export default function HeroCrest() {
  const [Canvas3D, setCanvas3D] = useState(null);
  const [ready, setReady] = useState(false); // crest visible in WebGL -> fade the <img>
  const [paused, setPaused] = useState(false);
  const touch = useRef(isTouch());

  // Capability-gated lazy load of the WebGL scene.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await shouldUseWebGL())) return; // keep the static crest
      const mod = await import('../webgl/HeroCanvas.jsx');
      if (!cancelled) setCanvas3D(() => mod.default);
    })();
    return () => { cancelled = true; };
  }, []);

  // Battery: pause the render loop when the tab is hidden or the hero is gone.
  useEffect(() => {
    const update = () => {
      const hero = document.getElementById('open');
      const past = hero ? hero.getBoundingClientRect().bottom < 0 : false;
      setPaused(document.hidden || past);
    };
    update();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <span className={`crest${ready ? ' webgl-on' : ''}`} data-rise data-parallax="crest">
      <img
        src="/crest.jpeg"
        alt="The Mirror Platform crest"
        className={ready ? 'crest-faded' : ''}
      />
      {Canvas3D && (
        <span className="crest-canvas" aria-hidden="true">
          <Canvas3D
            frameloop={paused ? 'never' : 'always'}
            touch={touch.current}
            onReady={() => setReady(true)}
          />
        </span>
      )}
    </span>
  );
}
