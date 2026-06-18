import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSite } from "../app/SiteContext";
import { canAccess, showElement, isRigorArrival } from "../gates";
import { reverseRail } from "../engine";
import {
  fetchThreadBySlug, fetchMembranes, type ThreadRow, type MembraneRow,
} from "../lib/data";
import { Ledger } from "../reader/Ledger";
import { Rails } from "../reader/Rails";
import { Prose } from "../reader/Prose";
import { Frontier } from "../reader/Frontier";
import { ReadGate } from "./ReadGate";

/* ----------------------------------------------------------------------------
   /t/[slug] — the continuation. Arrives mid-thought (§2). Transmission-first:
   prose and payoff first, the apparatus lower (§8). Every element renders
   through showElement; the template decides nothing itself (§0, P7).
   -------------------------------------------------------------------------- */

export function Thread() {
  const { slug = "" } = useParams();
  const { role, graph, viewport, arrival } = useSite();
  const [thread, setThread] = useState<ThreadRow | null>(null);
  const [membranes, setMembranes] = useState<MembraneRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true; setLoading(true);
    Promise.all([fetchThreadBySlug(slug), fetchThreadBySlug(slug).then((t) =>
      t ? fetchMembranes(t.node_id) : [])])
      .then(([t, m]) => { if (live) { setThread(t); setMembranes(m); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [slug]);

  if (loading) return <p className="mono" style={{ color: "var(--c-bone3)" }}>…</p>;
  if (!thread) return <p className="mono" style={{ color: "var(--c-bone3)" }}>This continuation doesn't resolve.</p>;

  const node = graph[thread.node_id];
  const isEntry = !!thread.arrived_from;                 // a wedge landing is a free entry (§2,§6)
  const ctx = { arrival, isEntryNode: isEntry, viewport, register: "transmission" as const, readerVocab: new Set<string>() };

  // GATE 1 — surface. A Free reader off their entry continuation hits the read gate.
  if (!canAccess(node, role, isEntry)) {
    return <ReadGate title={thread.title} kind="continuation" />;
  }

  const bodyState = showElement("continuation_body", role, ctx);
  if (bodyState === "locked") return <ReadGate title={thread.title} kind="continuation" />;

  // GATE 2 — elements.
  const banner = showElement("arrival_banner", role, ctx);
  const ledger = showElement("honest_ledger", role, ctx);
  const rails = showElement("rail_grounds", role, ctx);
  const frontier = showElement("frontier_prompt", role, ctx);
  const full = role === "build" || role === "arch";
  const isFrontier = node ? reverseRail(graph, node.id).length === 0 : false;
  const ledgerTop = isRigorArrival(arrival); // rigor sees the ledger up top (§8)

  return (
    <article className="fadein">
      {banner !== "hidden" && thread.arrived_from && (
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          you arrived from {thread.arrived_from}, mid-thought
        </div>
      )}
      <h1 className="threshold" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.18, margin: "0 0 4px" }}>
        {thread.title}
      </h1>

      {node && ledger !== "hidden" && ledgerTop &&
        <Ledger node={node} state={ledger} viewport={viewport} />}

      <Prose body={thread.body} membranes={membranes} full={full} />

      {node && ledger !== "hidden" && !ledgerTop &&
        <Ledger node={node} state={ledger} viewport={viewport} />}

      {node && <Rails nodeId={node.id} graph={graph} state={rails} viewport={viewport} />}

      <Frontier state={frontier} role={role} isFrontier={isFrontier} />

      <div style={{ marginTop: 28 }}>
        <a className="link mono" href="/" style={{ fontSize: 12 }}>← exit to where this lives</a>
      </div>
    </article>
  );
}
