import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { startPointer, stopPointer, pointer } from './pointer';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Scroll-out progress of the hero (0 at top, 1 once mostly scrolled away).
function heroProgress() {
  const hero = document.getElementById('open');
  if (!hero) return 0;
  const r = hero.getBoundingClientRect();
  return clamp01(-r.top / (r.height * 0.7));
}

// Soft round sprite for the dust (no external asset).
function makeDotTexture() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.3, 'rgba(201,162,39,0.7)');
  g.addColorStop(1, 'rgba(201,162,39,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

const crestVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const crestFrag = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uDissolve;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec4 tex = texture2D(uTex, vUv);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    // the crest sits on black — fold luminance into alpha so the stage shows through
    float alpha = smoothstep(0.05, 0.22, lum);

    // slow specular sweep crossing the crest (~7s period)
    float sweepPos = fract(uTime / 7.0) * 1.6 - 0.3;
    float diag = vUv.x * 0.6 + (1.0 - vUv.y) * 0.4;
    float band = smoothstep(0.07, 0.0, abs(diag - sweepPos));
    vec3 color = tex.rgb + band * vec3(1.0, 0.92, 0.66) * 0.55 * alpha;

    // dissolve upward — erode from the bottom as the hero scrolls away
    float n = hash(floor(vUv * 230.0));
    float erode = smoothstep(vUv.y, vUv.y + 0.28, uDissolve * 1.3 + n * 0.16);
    alpha *= (1.0 - erode) * (1.0 - uDissolve * 0.15);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Crest({ touch, onReady }) {
  const tex = useLoader(THREE.TextureLoader, '/crest.jpeg');
  const group = useRef();
  const tilt = useRef({ x: 0, y: 0 });
  const uniforms = useMemo(
    () => ({ uTex: { value: tex }, uTime: { value: 0 }, uDissolve: { value: 0 } }),
    [tex]
  );

  useEffect(() => { onReady && onReady(); }, [onReady]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    uniforms.uTime.value += delta;
    const p = heroProgress();
    uniforms.uDissolve.value = p;
    g.position.y = p * 0.6;                 // recede upward
    g.scale.setScalar(1 - p * 0.15);

    if (!touch) {                           // mouse-parallax tilt, lerped, max ~4°
      const pt = pointer();
      tilt.current.x += (pt.x - tilt.current.x) * 0.06;
      tilt.current.y += (pt.y - tilt.current.y) * 0.06;
      g.rotation.y = tilt.current.x * 0.07;
      g.rotation.x = -tilt.current.y * 0.07;
    }
  });

  const h = 2.2 * (454 / 570);
  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[2.2, h]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={crestVert}
          fragmentShader={crestFrag}
        />
      </mesh>
    </group>
  );
}

function Dust({ touch }) {
  const ref = useRef();
  const COUNT = 360; // <= 400
  const { positions, sprite } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 0.55 + Math.random() * 1.4;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r * 0.85;
      positions[i * 3 + 1] = Math.sin(a) * r * 0.7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    return { positions, sprite: makeDotTexture() };
  }, []);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.z += delta * 0.02;            // slow drift
    if (!touch) {
      const pt = pointer();                  // faint response to pointer velocity
      g.rotation.y += (pt.vx * 0.04 - g.rotation.y) * 0.05;
      g.rotation.x += (pt.vy * 0.04 - g.rotation.x) * 0.05;
    }
    const p = heroProgress();
    g.position.y = p * 0.85;                 // rise as the crest dissolves into it
    g.material.opacity = 0.45 + p * 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.055}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={'#C9A227'}
        opacity={0.5}
      />
    </points>
  );
}

export default function HeroCanvas({ frameloop = 'always', onReady, touch = false }) {
  useEffect(() => {
    if (!touch) startPointer();
    return () => stopPointer();
  }, [touch]);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Crest touch={touch} onReady={onReady} />
      </Suspense>
      <Dust touch={touch} />
    </Canvas>
  );
}
