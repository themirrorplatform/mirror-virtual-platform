import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../app/SiteContext";
import { showElement } from "../gates";
import { GraphField } from "../app/GraphField";
import { fetchNowList } from "../lib/data";

/* ----------------------------------------------------------------------------
   / — the home, reached by EXITING a continuation (§2). Not a front door: the
   recognition line lands as recognition. Behind it, the knowledge geometry
   drifts — the corpus's own shape, the recursion made visible. The crest sits
   faint above, a watermark, not a logo-wall.
   -------------------------------------------------------------------------- */

export function Home() {
  const { role, viewport, arrival, graph } = useSite();
  const [now, setNow] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => { fetchNowList().then((rows) => setNow(rows.map((r) => ({ slug: r.slug, title: r.title })))); }, []);

  const ctx = { arrival, isEntryNode: false, viewport, register: "threshold" as const, readerVocab: new Set<string>() };
  const recognition = showElement("recognition_line", role, ctx);
  const doorways = showElement("doorways", role, ctx);

  return (
    <div className="fadein" style={{ position: "relative" }}>
      {/* the geometry, drifting behind the recognition (fixed, low, non-interactive) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        maskImage: "radial-gradient(70% 60% at 50% 32%, #000 30%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 32%, #000 30%, transparent 78%)" }}>
        <GraphField graph={graph} mode="ambient" style={{ opacity: 0.42 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingTop: 18 }}>
        <img src="/crest.jpg" alt="" aria-hidden width={68} height={54}
          style={{ opacity: 0.5, mixBlendMode: "luminosity", marginBottom: 22, borderRadius: 2 }} />

        {recognition !== "hidden" && (
          <h1 className="threshold" style={{ fontSize: "clamp(30px, 6vw, 46px)", fontWeight: 700,
            lineHeight: 1.1, maxWidth: 620, margin: 0 }}>
            This place is philosophy.<br />The meta-philosophy.
          </h1>
        )}
        <p className="transmission" style={{ color: "var(--c-bone2)", fontSize: "clamp(15px,2.4vw,18px)",
          maxWidth: 560, marginTop: 18, lineHeight: 1.7 }}>
          A corpus that carries its own work to the edge of an encounter it cannot itself close.
          Nothing here completes; every claim shows the wall that would break it.
        </p>

        {doorways !== "hidden" && (
          <section style={{ marginTop: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>now</div>
            <div className="stagger" style={{ display: "grid", gap: 10 }}>
              {now.length === 0 && <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>— the spine is being seeded.</span>}
              {now.map((t) => (
                <Link key={t.slug} to={`/t/${t.slug}`} className="card tap" style={{
                  padding: "16px 18px", textDecoration: "none", color: "var(--c-bone)", display: "block" }}>
                  <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>continuation</span>
                  <span className="threshold" style={{ fontSize: 18 }}>{t.title}</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 16 }}>
              <Link to="/map" className="link mono" style={{ fontSize: 12.5 }}>walk the atlas →</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
