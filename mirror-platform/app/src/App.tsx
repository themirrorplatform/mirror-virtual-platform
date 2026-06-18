import { useMemo } from "react";
import { computeGeometry } from "./engine";
import { runPipeline, type Ctx } from "./gates";
import type { Graph, MirrorNode } from "./types";

/* ----------------------------------------------------------------------------
   Batch-1 spine scaffold (P1). This is NOT a front door (§0 rule 5): there is
   no hero, no marketing, no funnel. It is a developer harness that proves the
   engine and the three deny-by-default gates are wired and running in order. It
   will be replaced by the real route templates (Thread/Construction/...) in P7,
   which arrive mid-thought and call the same pipeline.
   -------------------------------------------------------------------------- */

function n(id: string, p: Partial<MirrorNode> = {}): MirrorNode {
  return {
    id, label: id, kind: "attempt", content_home: "philosophy",
    substrate: ["thought"], register: "live", rests_on: [], pulls_to: [],
    stage: "captured", verdict: null, refuter: null, ...p,
  };
}

/** A tiny seed so the geometry has something to compute (real seed lands in P17). */
const SEED: Graph = {
  "the-ground": n("the-ground", { kind: "leaf/borrow" }),
  "B1-§53": n("B1-§53", {
    label: "B1-§53 The Ground", rests_on: ["the-ground"],
    stage: "in_protocol", verdict: "HOLDS",
    refuter: "exhibit stakes without valence (truth-apt, wrong-able, nothing matters)",
  }),
  "could-it-suffer": n("could-it-suffer", {
    label: "Could It Suffer, and Does It Matter", rests_on: ["B1-§53"],
    stage: "in_protocol", verdict: "HELD",
    refuter: "a welfare detector that reads first-person valence from third-person data",
  }),
};

export function App() {
  const geo = useMemo(() => computeGeometry(SEED), []);

  // demonstrate the pipeline: a free reader, arrived cold on the wedge.
  const ctx: Ctx = {
    arrival: "cold", isEntryNode: true, viewport: "mobile",
    register: "transmission", readerVocab: new Set(),
  };
  const free = runPipeline(SEED["could-it-suffer"], "free", ctx,
    ["continuation_title", "honest_ledger", "invariant_strip"], { isEntry: true });

  return (
    <main className="slidein" style={{ maxWidth: 720, margin: "0 auto", padding: "48px 22px" }}>
      <div className="eyebrow">batch 1 · spine scaffold · not a front door</div>
      <h1 className="threshold" style={{ fontSize: 30, fontWeight: 700, margin: "8px 0 18px" }}>
        The engine and the three gates are wired.
      </h1>

      <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>knowledge geometry · computed on read</div>
        <div className="mono" style={{ fontSize: 13, lineHeight: 1.9 }}>
          <div>firewall · <span className="hl">{geo.cycle ? "CYCLE" : "acyclic ✓"}</span></div>
          <div>open column · <span className="hl">{geo.openColumn.length}</span> (the invariant: never empty)</div>
          <div>seal-risk · {geo.sealRisks.length}</div>
          <div>components · {geo.components.length}</div>
          <div>structural load · could-it-suffer={geo.load["could-it-suffer"]?.trans}, the-ground={geo.load["the-ground"]?.trans}</div>
        </div>
      </div>

      <div className="card" style={{ padding: "16px 18px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          read pipeline · free reader, arrived cold on the wedge
        </div>
        <div className="mono" style={{ fontSize: 13, lineHeight: 1.9 }}>
          <div>canAccess · <span className="hl">{String(free.access)}</span></div>
          <div>continuation_title · {free.elements.continuation_title}</div>
          <div>honest_ledger · {free.elements.honest_ledger} <span style={{ color: "var(--c-bone3)" }}>(deferred below the payoff for a cold arrival)</span></div>
          <div>invariant_strip · {free.elements.invariant_strip} <span style={{ color: "var(--c-bone3)" }}>(never to a reader)</span></div>
        </div>
      </div>

      <p className="mono" style={{ fontSize: 10.5, color: "var(--c-bone3)", marginTop: 22 }}>
        deny by default · the read pipeline never mutates · depth computed, never stored
      </p>
    </main>
  );
}
