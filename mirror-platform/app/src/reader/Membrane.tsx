import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { routeForNode } from "../lib/data";

/* ----------------------------------------------------------------------------
   The membrane (§3, §7, Device §1). A construction showing through the prose at
   the point it bears — placed while writing, never detected. Rendered as a
   dashed-gold inline span; the word "membrane" is NEVER shown. Tap-to-peek
   (a tap-revealed sheet, NOT a hover title — touch has no hover); tap again to
   descend. A real button: keyboard-focusable and screen-reader labelled.
   -------------------------------------------------------------------------- */

export function Membrane({
  text, teaser, constructionId, full,
}: { text: string; teaser: string; constructionId: string; full: boolean }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <button
        className="membrane"
        aria-label={`peek at the construction beneath: ${teaser}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}
      >
        {text}
      </button>
      {open && (
        <span role="dialog" className="card" style={{
          position: "absolute", left: 0, top: "1.6em", zIndex: 5, width: 280,
          padding: "12px 14px", display: "block",
        }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>the proof beneath</span>
          <span style={{ fontSize: 13.5, color: "var(--c-bone2)", display: "block" }}>{teaser}</span>
          <button className="link" style={{ marginTop: 10, fontSize: 12.5, background: "none", border: 0, cursor: "pointer" }}
            onClick={async () => { const r = await routeForNode(constructionId); if (r) nav(r); }}>
            descend into the grounds →
          </button>
          {full && <span className="mono" style={{ fontSize: 10, color: "var(--c-bone3)", display: "block", marginTop: 8 }}>{constructionId}</span>}
        </span>
      )}
    </span>
  );
}
