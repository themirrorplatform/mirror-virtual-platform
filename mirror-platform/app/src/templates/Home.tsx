import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../app/SiteContext";
import { showElement } from "../gates";
import { fetchNowList } from "../lib/data";

/* ----------------------------------------------------------------------------
   / — the home, reached by EXITING a continuation (§2). Not a front door: the
   recognition line lands as recognition, not greeting. Doorways are the derived
   "Now" list (a query over featured threads), never a hand-built menu.
   -------------------------------------------------------------------------- */

export function Home() {
  const { role, viewport, arrival } = useSite();
  const [now, setNow] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => { fetchNowList().then((rows) => setNow(rows.map((r) => ({ slug: r.slug, title: r.title })))); }, []);

  const ctx = { arrival, isEntryNode: false, viewport, register: "threshold" as const, readerVocab: new Set<string>() };
  const recognition = showElement("recognition_line", role, ctx);
  const doorways = showElement("doorways", role, ctx);

  return (
    <div className="fadein" style={{ paddingTop: 24 }}>
      {recognition !== "hidden" && (
        <h1 className="threshold" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, maxWidth: 600 }}>
          This place is philosophy. The meta-philosophy.
        </h1>
      )}
      <p style={{ color: "var(--c-bone2)", fontSize: 16, maxWidth: 560, marginTop: 14 }}>
        A corpus that carries its own work to the edge of an encounter it cannot itself close.
        Nothing here completes; every claim shows the wall that would break it.
      </p>

      {doorways !== "hidden" && (
        <section style={{ marginTop: 34 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>now</div>
          <div style={{ display: "grid", gap: 10 }}>
            {now.length === 0 && <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>— the spine is being seeded.</span>}
            {now.map((t) => (
              <Link key={t.slug} to={`/t/${t.slug}`} className="card tap" style={{
                padding: "14px 16px", textDecoration: "none", color: "var(--c-bone)" }}>
                <span className="threshold" style={{ fontSize: 17 }}>{t.title}</span>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <Link to="/map" className="link mono" style={{ fontSize: 12.5 }}>walk the atlas →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
