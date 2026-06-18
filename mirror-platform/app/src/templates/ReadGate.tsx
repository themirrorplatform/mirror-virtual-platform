import { Link } from "react-router-dom";

/* ----------------------------------------------------------------------------
   The read-gate preview (§6, Composition §3 "Locked"). Title + the lock, never
   the content. The actual Stripe gate lands in P9; this is the honest locked
   surface it sits behind. Free on a non-entry continuation or any construction.
   -------------------------------------------------------------------------- */

export function ReadGate({ title, kind }: { title: string; kind: "continuation" | "construction" }) {
  return (
    <section className="card fadein" style={{ padding: "28px 24px", textAlign: "center" }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>the rest of the graph</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 14px" }}>{title}</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 15, maxWidth: 460, margin: "0 auto 18px" }}>
        The one continuation you arrived on is free. {kind === "construction"
          ? "The constructions beneath the spine"
          : "The rest of the live spine"} opens with Continuations.
      </p>
      <Link to="/account" className="btn btn-solid" style={{ display: "inline-block" }}>
        open the spine — $24.99/mo
      </Link>
      <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 16 }}>
        cancel anytime · your continuations stay yours and leave with you
      </div>
    </section>
  );
}
