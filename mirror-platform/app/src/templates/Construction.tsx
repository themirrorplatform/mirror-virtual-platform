import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSite } from "../app/SiteContext";
import { canAccess, showElement } from "../gates";
import { fetchConstructionBySlug, type ConstructionRow } from "../lib/data";
import { Ledger } from "../reader/Ledger";
import { Rails } from "../reader/Rails";
import { Prose } from "../reader/Prose";
import { ReadGate } from "./ReadGate";

/* /c/[slug] — the B-page. Never free (read gate). Continuations: prose + Honest
   ledger + home tag, no engine numbers. Builder: the full instrument. (§3) */
export function Construction() {
  const { slug = "" } = useParams();
  const { role, graph, viewport, arrival } = useSite();
  const [con, setCon] = useState<ConstructionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true; setLoading(true);
    fetchConstructionBySlug(slug).then((c) => { if (live) setCon(c); }).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [slug]);

  if (loading) return <p className="mono" style={{ color: "var(--c-bone3)" }}>…</p>;
  if (!con) {
    // Free gets the locked preview even when the row is RLS-hidden from them.
    if (role === "free") return <ReadGate title="A construction beneath the spine" kind="construction" />;
    return <p className="mono" style={{ color: "var(--c-bone3)" }}>This construction doesn't resolve.</p>;
  }

  const node = graph[con.node_id];
  const ctx = { arrival, isEntryNode: false, viewport, register: "transmission" as const, readerVocab: new Set<string>() };
  if (!canAccess(node, role)) return <ReadGate title={con.title} kind="construction" />;

  const bodyState = showElement("construction_body", role, ctx);
  if (bodyState === "locked") return <ReadGate title={con.title} kind="construction" />;

  const tags = showElement("construction_header_tags", role, ctx);
  const ledger = showElement("construction_ledger", role, ctx);
  const rails = showElement("construction_rails", role, ctx);
  const full = role === "build" || role === "arch";

  return (
    <article className="fadein">
      <div className="eyebrow" style={{ marginBottom: 8 }}>construction · the grounding beneath</div>
      <h1 className="threshold" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{con.title}</h1>
      {tags !== "hidden" && node && (
        <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)" }}>
          home · {node.content_home}{full && node.depth ? ` · load ${node.depth}` : ""}
        </div>
      )}
      <Prose body={con.body} membranes={[]} full={full} />
      {node && ledger !== "hidden" && <Ledger node={node} state={ledger} viewport={viewport} />}
      {node && <Rails nodeId={node.id} graph={graph} state={rails} viewport={viewport} />}
    </article>
  );
}
