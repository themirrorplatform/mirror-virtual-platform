import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Graph } from "../types";
import type { ElementState, Viewport } from "../gates";
import { reverseRail } from "../engine";
import { routeForNode } from "../lib/data";

/* ----------------------------------------------------------------------------
   The three rails (§7, Composition §3, Device §1):
     - Descend into its grounds  = rests_on
     - Connects to / Pulls toward = pulls_to
     - Leads to — what builds on this = COMPUTED reverse of everyone's rests_on
   Reader surface (plain): human labels, no mono sub, no ids, capped. Builder
   (full): mono sub + ids + "never authored". Mobile: stacked. Items are real
   buttons (keyboard + screen-reader), never hover-only.
   -------------------------------------------------------------------------- */

interface RailDef { key: string; plainLabel: string; sub: string; tone: string; }
const DEFS: Record<"grounds" | "connects" | "leads", RailDef> = {
  grounds:  { key: "grounds",  plainLabel: "Where this comes from", sub: "rests_on · the construction beneath", tone: "var(--c-gold)" },
  connects: { key: "connects", plainLabel: "Connects to",          sub: "pulls_to · the grounding / significance geometry", tone: "var(--c-steel)" },
  leads:    { key: "leads",    plainLabel: "What builds on this",   sub: "computed reverse of everyone's rests_on · never authored", tone: "var(--c-bone2)" },
};

function RailGroup({
  def, ids, graph, full,
}: { def: RailDef; ids: string[]; graph: Graph; full: boolean }) {
  const nav = useNavigate();
  const capped = full ? ids : ids.slice(0, 6); // reader surface is capped (§3)
  return (
    <div className="rail-group" style={{ flex: 1, minWidth: 220 }}>
      <div className="eyebrow" style={{ color: def.tone, marginBottom: 4 }}>{def.plainLabel}</div>
      {full && <div className="mono" style={{ fontSize: 10.5, color: "var(--c-bone3)", marginBottom: 8 }}>{def.sub}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
        {capped.length === 0 && (
          <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>
            — none yet.{def.key === "leads" ? " This is a frontier." : ""}
          </span>
        )}
        {capped.map((id) => (
          <button key={id} className="rail" onClick={async () => {
            const r = await routeForNode(id); if (r) nav(r);
          }} style={{ padding: "7px 12px", fontSize: 13.5, textAlign: "left" }}>
            {graph[id]?.label ?? id}
            {full && <span className="mono" style={{ fontSize: 10, color: "var(--c-bone3)", marginLeft: 6 }}>{id}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Rails({
  nodeId, graph, state, viewport,
}: { nodeId: string; graph: Graph; state: ElementState; viewport: Viewport }) {
  const [leads, setLeads] = useState<string[]>([]);
  useEffect(() => { setLeads(reverseRail(graph, nodeId)); }, [graph, nodeId]);
  if (state === "hidden" || state === "locked") return null;

  const node = graph[nodeId];
  const full = state === "full";
  const stack = viewport === "mobile";

  return (
    <section aria-label="rails" style={{
      display: "flex", flexDirection: stack ? "column" : "row",
      gap: 18, marginTop: 24, borderTop: "1px solid var(--c-line)", paddingTop: 20,
    }}>
      <RailGroup def={DEFS.grounds} ids={node?.rests_on ?? []} graph={graph} full={full} />
      <RailGroup def={DEFS.connects} ids={node?.pulls_to ?? []} graph={graph} full={full} />
      <RailGroup def={DEFS.leads} ids={leads} graph={graph} full={full} />
    </section>
  );
}
