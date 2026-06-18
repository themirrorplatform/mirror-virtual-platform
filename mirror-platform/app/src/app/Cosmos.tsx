import { useEffect, useRef, useState } from "react";
import type { Graph } from "../types";
import { GraphField } from "./GraphField";

/* ----------------------------------------------------------------------------
   Cosmos — the site-wide WebGL ambient backdrop (the "full immersive" register).
   The knowledge geometry rendered as a 3D depth field: nodes placed on shells by
   depth tier (metric near, shallow far), rests_on edges drawn gold, set in a fog
   of cool dust, with additive glow and a slow drift + pointer parallax. Three.js
   is lazy-imported so it never blocks first paint; on reduced-motion or any
   WebGL failure it falls back to the cheap 2D field. Purely decorative, behind a
   scrim — the reader's text always sits above it, readable.
   -------------------------------------------------------------------------- */

// extended cosmic palette (beyond the frozen crest, used for atmosphere only)
const TIER_COLOR: Record<string, [number, number, number]> = {
  metric: [0.79, 0.64, 0.15],        // gold
  "load-bearing": [0.56, 0.65, 0.70], // steel
  province: [0.49, 0.36, 0.77],       // violet
  shallow: [0.23, 0.62, 0.57],        // teal
};

export function Cosmos({ graph }: { graph: Graph }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const noWebGL = typeof WebGLRenderingContext === "undefined";
    if (reduce || noWebGL) { setFallback(true); return; }
    const canvas = canvasRef.current; if (!canvas) return;
    let disposed = false; let dispose = () => {};

    import("three").then((THREE) => {
      if (disposed || !canvas) return;
      try { dispose = build(THREE, canvas, graph); }
      catch { setFallback(true); }
    }).catch(() => setFallback(true));

    return () => { disposed = true; dispose(); };
  }, [graph]);

  if (fallback) {
    return <div style={{ position: "absolute", inset: 0 }}><GraphField graph={graph} mode="ambient" style={{ opacity: 0.4 }} /></div>;
  }
  return <canvas ref={canvasRef} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}

// deno-lint-ignore no-explicit-any
function build(THREE: any, canvas: HTMLCanvasElement, graph: Graph): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a08, 0.018);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 62;

  const group = new THREE.Group();
  scene.add(group);

  // a soft radial sprite for glow
  const tex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d")!; const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(0.4, "rgba(255,255,255,.5)"); grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();

  // ── dust: a cool field so the void has depth even when the graph is small
  const DUST = 520;
  const dpos = new Float32Array(DUST * 3); const dcol = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 30 + Math.random() * 90, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    dpos[i * 3] = r * Math.sin(b) * Math.cos(a); dpos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a); dpos[i * 3 + 2] = r * Math.cos(b);
    const t = Math.random(); dcol[i * 3] = 0.15 + t * 0.1; dcol[i * 3 + 1] = 0.18 + t * 0.12; dcol[i * 3 + 2] = 0.32 + t * 0.18;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  dg.setAttribute("color", new THREE.BufferAttribute(dcol, 3));
  group.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.9, map: tex, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));

  // ── the graph: nodes on shells by tier, edges = rests_on
  const ids = Object.keys(graph);
  const pos = new Map<string, [number, number, number]>();
  const shell: Record<string, number> = { metric: 8, "load-bearing": 18, province: 30, shallow: 44 };
  const npos = new Float32Array(ids.length * 3); const ncol = new Float32Array(ids.length * 3);
  ids.forEach((id, i) => {
    const tier = (graph[id].depth ?? "shallow") as string;
    const r = (shell[tier] ?? 44) + (Math.random() - 0.5) * 6;
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    const p: [number, number, number] = [r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b)];
    pos.set(id, p); npos.set(p, i * 3);
    const col = TIER_COLOR[tier] ?? TIER_COLOR.shallow; ncol.set(col, i * 3);
  });
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(npos, 3));
  ng.setAttribute("color", new THREE.BufferAttribute(ncol, 3));
  group.add(new THREE.Points(ng, new THREE.PointsMaterial({ size: 3.4, map: tex, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));

  const eseg: number[] = [];
  for (const id of ids) for (const t of graph[id].rests_on) {
    const a = pos.get(id), b = pos.get(t); if (a && b) eseg.push(...a, ...b);
  }
  if (eseg.length) {
    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(eseg), 3));
    group.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xc9a227, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending })));
  }

  // ── interaction + loop
  let mx = 0, my = 0, raf = 0; let running = true;
  const onMove = (e: MouseEvent) => { mx = (e.clientX / window.innerWidth - 0.5); my = (e.clientY / window.innerHeight - 0.5); };
  window.addEventListener("mousemove", onMove, { passive: true });

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); window.addEventListener("resize", resize);

  const onVis = () => { running = !document.hidden; if (running) loop(); };
  document.addEventListener("visibilitychange", onVis);

  const clock = new THREE.Clock();
  const loop = () => {
    if (!running) return;
    const t = clock.getElapsedTime();
    group.rotation.y = t * 0.035; group.rotation.x = Math.sin(t * 0.08) * 0.08;
    camera.position.x += (mx * 10 - camera.position.x) * 0.04;
    camera.position.y += (-my * 10 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVis);
    renderer.dispose(); dg.dispose(); ng.dispose(); tex.dispose();
  };
}
