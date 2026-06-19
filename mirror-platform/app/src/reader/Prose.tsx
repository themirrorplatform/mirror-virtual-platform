import type { ReactNode } from "react";
import type { MembraneRow } from "../lib/data";
import { Membrane } from "./Membrane";

/* ----------------------------------------------------------------------------
   The continuation prose (§7), transmission register. Renders the authored body
   with membranes inline. The body itself is authored by A Reflection and is
   under the AI-prose ban (§17) — until it is seeded (P17), this renders an
   HONEST System-register placeholder (never fabricated philosophy) plus the
   real membrane path, so the descend walk works without inventing the words.

   When a body exists, words bound as lexicon spans flow through resolveTerm at
   render time (P6) — bound spans only, never detected strings (§B′).
   -------------------------------------------------------------------------- */

interface TipTapDoc { content?: { type: string; content?: { text?: string }[] }[] }

export function Prose({
  body, membranes, full,
}: { body: unknown | null; membranes: MembraneRow[]; full: boolean }) {
  const doc = body as TipTapDoc | null;
  const hasBody = !!doc?.content?.length;

  return (
    <div className="transmission" style={{ fontSize: 17, lineHeight: 1.7, marginTop: 18 }}>
      {hasBody ? (
        doc!.content!.map((block, i) => (
          <p key={i} style={{ margin: "0 0 16px" }}>
            {(block.content ?? []).map((s, j) => <span key={j}>{s.text}</span>)}
          </p>
        ))
      ) : (
        <PlaceholderProse membranes={membranes} full={full} />
      )}
    </div>
  );
}

/** Honest placeholder: states the constitution rather than faking the prose. */
function PlaceholderProse({ membranes, full }: { membranes: MembraneRow[]; full: boolean }): ReactNode {
  return (
    <>
      <p className="mono" style={{ fontSize: 12.5, color: "var(--c-bone3)", margin: "0 0 16px" }}>
        the continuation's prose is authored by A Reflection (the AI-prose ban, §17) and is seeded
        at launch. the apparatus around it — the ledger, the rails, and the proof showing through —
        is live below.
      </p>
      {membranes.length > 0 && (
        <p style={{ margin: "0 0 16px", color: "var(--c-bone2)" }}>
          At the point it bears, the proof shows through:{" "}
          {membranes.map((m) => (
            <Membrane key={m.id} text="the construction beneath" teaser={m.teaser}
              constructionId={m.construction_id} full={full} />
          ))}
          .
        </p>
      )}
    </>
  );
}
