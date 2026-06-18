import { useState } from "react";
import type { MirrorNode } from "../types";
import type { ElementState, Viewport } from "../gates";

/* ----------------------------------------------------------------------------
   The honest ledger (§7, Composition §3). The soul, with or without the machine:
   - deferred (Free cold): below the payoff, collapsed; verdict line, wall expandable.
   - honest   (Continuations): verdict + the wall it invites; NO engine internals.
   - full     (Builder): + stage / load / depth / seal-risk.
   The "verdict carried, not derived" line is the honesty everywhere it shows.
   -------------------------------------------------------------------------- */

const HELD = new Set(["HOLDS", "HELD", "STANDS", "RESPECTED"]);

export function Ledger({
  node, state, viewport,
}: { node: MirrorNode; state: ElementState; viewport: Viewport }) {
  const collapsible = viewport === "mobile" || state === "deferred";
  const [open, setOpen] = useState(state !== "deferred");
  if (state === "hidden" || state === "locked") return null;

  const carried = node.verdict_source !== "derived";
  const sealRisk = HELD.has(node.verdict ?? "") && !node.refuter;

  return (
    <section className="card" style={{ padding: "16px 18px", marginTop: 22 }}
      aria-label="the honest ledger">
      <button className="eyebrow" onClick={() => collapsible && setOpen((o) => !o)}
        aria-expanded={open}
        style={{ background: "none", border: 0, padding: 0, color: "var(--c-bone3)",
                 cursor: collapsible ? "pointer" : "default", display: "flex", gap: 8 }}>
        the honest ledger {collapsible && <span aria-hidden>{open ? "−" : "+"}</span>}
      </button>

      <div className="mono" style={{ fontSize: 13, marginTop: 10 }}>
        verdict · <span className="hl">{node.verdict ?? "UNTESTED"}</span>
        {sealRisk && <span style={{ color: "var(--c-seal)" }}> · seal-risk: no wall posted</span>}
      </div>

      {open && (
        <>
          {node.refuter && (
            <div style={{ fontSize: 14, color: "var(--c-bone2)", marginTop: 8 }}>
              <span className="eyebrow">the wall it invites · </span>{node.refuter}
            </div>
          )}
          {carried && (
            <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 10 }}>
              verdict carried, not derived — only an external encounter settles it.
            </div>
          )}
          {state === "full" && (
            <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 10,
              borderTop: "1px solid var(--c-line)", paddingTop: 10 }}>
              stage {node.stage} · load {node.depth ?? "—"} · home {node.content_home}
            </div>
          )}
        </>
      )}
    </section>
  );
}
