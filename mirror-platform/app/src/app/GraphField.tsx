import { useEffect, useRef } from "react";
import type { Graph } from "../types";

/* ----------------------------------------------------------------------------
   GraphField — the knowledge geometry, rendered. A lightweight canvas force
   field (no deps): nodes sized + coloured by depth tier, rests_on edges in gold
   (the firewall / construction), pulls_to in steel (the encounter geometry).
   This is the recursion made visible — the corpus drawing its own shape.

   'ambient'    : faint, non-interactive, drifts slowly behind content.
   'interactive': full strength; hover lifts a node and names it.
   Reduced-motion settles once and holds (no loop); cheap O(n^2) is fine at the
   corpus's scale and only runs where placed (never the reader path).
   -------------------------------------------------------------------------- */

interface N { id: string; label: string; tier: number; x: number; y: number; vx: number; vy: number; r: number }
interface L { a: string; b: string; kind: "rests_on" | "pulls_to" }

const TIER = { metric: 0, "load-bearing": 1, province: 2, shallow: 3 } as const;
const COLOR = ["#C9A227", "#8FA7B3", "#b7b1a4", "#5f5a51"]; // metric→shallow
const RADIUS = [7, 5, 3.6, 2.6];

export function GraphField({
  graph, mode = "ambient", className, style,
}: { graph: Graph; mode?: "ambient" | "interactive"; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const hover = useRef<string | null>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ids = Object.keys(graph);

    const nodes: N[] = ids.map((id, i) => {
      const tier = TIER[(graph[id].depth ?? "shallow") as keyof typeof TIER] ?? 3;
      const a = (i / Math.max(ids.length, 1)) * Math.PI * 2;
      return { id, label: graph[id].label, tier, r: RADIUS[tier],
        x: Math.cos(a) * 120 + (Math.random() - .5) * 40, y: Math.sin(a) * 120 + (Math.random() - .5) * 40, vx: 0, vy: 0 };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: L[] = [];
    for (const id of ids) {
      for (const t of graph[id].rests_on) if (byId.has(t)) links.push({ a: id, b: t, kind: "rests_on" });
      for (const t of graph[id].pulls_to) if (byId.has(t)) links.push({ a: id, b: t, kind: "pulls_to" });
    }

    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const step = (settle = 1) => {
      const cx = w / 2, cy = h / 2;
      for (let s = 0; s < settle; s++) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy || 0.01;
            const f = 900 / d2; const d = Math.sqrt(d2);
            const ux = dx / d, uy = dy / d; a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
          }
        }
        for (const l of links) {
          const a = byId.get(l.a)!, b = byId.get(l.b)!;
          const dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 0.01;
          const rest = l.kind === "rests_on" ? 70 : 120;
          const f = (d - rest) * 0.012; const ux = dx / d, uy = dy / d;
          a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
        }
        for (const n of nodes) {
          n.vx += (cx - n.x) * 0.002; n.vy += (cy - n.y) * 0.002;
          n.vx *= 0.86; n.vy *= 0.86; n.x += n.vx; n.y += n.vy;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const l of links) {
        const a = byId.get(l.a)!, b = byId.get(l.b)!;
        ctx.strokeStyle = l.kind === "rests_on" ? "rgba(201,162,39,.30)" : "rgba(143,167,179,.16)";
        ctx.lineWidth = l.kind === "rests_on" ? 1 : 0.7;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (const n of nodes) {
        const on = hover.current === n.id;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (on ? 1.6 : 1), 0, Math.PI * 2);
        ctx.fillStyle = COLOR[n.tier]; ctx.shadowBlur = n.tier === 0 ? 14 : on ? 12 : 0;
        ctx.shadowColor = COLOR[n.tier]; ctx.fill(); ctx.shadowBlur = 0;
        if (mode === "interactive" && on) {
          ctx.fillStyle = "#E9E4D8"; ctx.font = "12px 'IBM Plex Mono', monospace";
          ctx.fillText(n.label, n.x + 10, n.y + 4);
        }
      }
    };

    if (reduce) { step(140); draw(); }
    else {
      let frame = 0;
      const loop = () => { step(mode === "ambient" ? 1 : 1); draw(); frame++; raf = requestAnimationFrame(loop); };
      step(40); loop(); // pre-settle so it opens already-formed
      void frame;
    }

    const onMove = (e: MouseEvent) => {
      if (mode !== "interactive") return;
      const rect = canvas.getBoundingClientRect(); const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let best: string | null = null, bd = 18 * 18;
      for (const n of nodes) { const dd = (n.x - mx) ** 2 + (n.y - my) ** 2; if (dd < bd) { bd = dd; best = n.id; } }
      hover.current = best; canvas.style.cursor = best ? "pointer" : "default";
    };
    if (mode === "interactive") canvas.addEventListener("mousemove", onMove);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener("mousemove", onMove); };
  }, [graph, mode]);

  return (
    <canvas ref={ref} aria-hidden className={className}
      style={{ width: "100%", height: "100%", display: "block", ...(mode === "ambient" ? { opacity: 0.5, pointerEvents: "none" } : {}), ...style }} />
  );
}
