import { useEffect, useState } from "react";
import { useSite } from "../app/SiteContext";
import { showElement } from "../gates";
import { supabase } from "../lib/supabase";

/* ----------------------------------------------------------------------------
   The remaining templates (§3,§5). Lean but pipeline-driven: each gates its
   register-bearing elements through showElement; none hardcodes visibility.
   Site/System copy here is plain, active, honest (§17) — never fabricated
   philosophical prose (that is authored by A Reflection, the AI-prose ban).
   -------------------------------------------------------------------------- */

function useCtx(register: "system" | "threshold" | "transmission" = "system") {
  const { viewport, arrival } = useSite();
  return { arrival, isEntryNode: false, viewport, register, readerVocab: new Set<string>() };
}

export function Map() {
  const { role } = useSite();
  const ctx = useCtx();
  const [rows, setRows] = useState<{ domain: string; verb: string; owes: string | null; status: string }[]>([]);
  useEffect(() => { supabase?.from("map_entry").select("domain,verb,owes,status").then(({ data }) => setRows((data as never) ?? [])); }, []);

  const cards = showElement("domain_cards", role, ctx);
  const owes = showElement("what_it_owes", role, ctx);
  return (
    <div className="fadein">
      <div className="eyebrow">the atlas · reach, verb-tagged</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 18px" }}>Where the work reaches</h1>
      {rows.length === 0 && <p className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>— the atlas is being seeded (P13/P17).</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {cards !== "hidden" && rows.map((r, i) => (
          <div key={i} className="card" style={{ padding: "14px 16px" }}>
            <div className="threshold" style={{ fontSize: 17 }}>{r.domain}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 4 }}>
              {r.status}{cards === "full" || role !== "free" ? ` · ${r.verb}` : ""}
            </div>
            {owes !== "hidden" && r.owes && (
              <div style={{ fontSize: 13.5, color: "var(--c-bone2)", marginTop: 8 }}>
                <span className="eyebrow">what it owes · </span>{r.owes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Events() {
  return (
    <div className="fadein">
      <div className="eyebrow">events · the deep read</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 14px" }}>The Deep Read</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 15 }}>
        New drops and the Deep Read live here — its own built site in the same house. Wiring lands with P12+.
      </p>
    </div>
  );
}

export function About() {
  return (
    <div className="fadein">
      <div className="eyebrow">about</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 14px" }}>About</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 15.5, lineHeight: 1.7, maxWidth: 620 }}>
        The Mirror Platform is the public surface of a philosophical corpus, published under the pen
        name A Reflection. It is built on one rule: nothing completes, and no system certifies itself
        from within. The site carries the work to the edge of encounter and shows it honestly open;
        it cannot close the ledger — that step is the reader's, and the work's.
      </p>
    </div>
  );
}

export function Forum() {
  const { role } = useSite();
  const ctx = useCtx();
  const banner = showElement("conduct_banner", role, ctx);
  const posts = showElement("forum_posts", role, ctx);
  return (
    <div className="fadein">
      <div className="eyebrow">forum · free, email-gated</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 14px" }}>The Forum</h1>
      {banner !== "hidden" && (
        <div className="card" style={{ padding: "12px 14px", marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--c-bone2)" }}>
            A deletion constitution that binds the guardian: conduct is removable and logged with its
            reason; content is never removable. (§10)
          </span>
        </div>
      )}
      {posts === "locked"
        ? <p className="mono" style={{ fontSize: 12.5, color: "var(--c-bone3)" }}>
            the forum is email-gated — sign in to read and post. (auth lands in P9)
          </p>
        : <p className="mono" style={{ fontSize: 12.5, color: "var(--c-bone3)" }}>posts + compose wire in P12.</p>}
    </div>
  );
}

const TIERS = [
  { name: "Free", price: "$0", unlocks: "every wedge article · the one continuation you arrived on · home · the forum" },
  { name: "Continuations", price: "$24.99/mo", unlocks: "the rest of the live spine — every continuation" },
  { name: "Builder", price: "$59.99/mo", unlocks: "a slot of your own: continue any thought, ground your own nodes" },
  { name: "Patron", price: "contact", unlocks: "licensing, institutional use, bespoke terms — arranged directly" },
];
const ROLE_TIER: Record<string, string> = { free: "Free", cont: "Continuations", build: "Builder", arch: "Builder" };

export function Account() {
  const { role } = useSite();
  const ctx = useCtx();
  const cards = showElement("tier_cards", role, ctx);
  const current = ROLE_TIER[role] ?? "Free";
  return (
    <div className="fadein">
      <div className="eyebrow">account</div>
      <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 18px" }}>Your account</h1>
      {cards !== "hidden" && (
        <div style={{ display: "grid", gap: 10 }}>
          {TIERS.map((t) => (
            <div key={t.name} className="card" style={{ padding: "14px 16px",
              borderColor: t.name === current ? "var(--c-gold)" : "var(--c-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="threshold" style={{ fontSize: 17 }}>{t.name}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--c-bone2)" }}>
                  {t.price}{t.name === current ? " · current" : ""}
                </span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--c-bone2)", marginTop: 6 }}>{t.unlocks}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 16 }}>
        cancel anytime · your continuations stay yours and leave with you · the guardian can never remove them
        <br />(Stripe checkout + one-click cancel wire in P9)
      </div>
    </div>
  );
}

export function Builder() {
  const { role } = useSite();
  const ctx = useCtx();
  const slot = showElement("builder_slot", role, ctx);
  if (slot === "hidden") {
    return <div className="card" style={{ padding: "24px", textAlign: "center" }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>contribution gate</div>
      <p style={{ color: "var(--c-bone2)" }}>A slot of your own opens with Builder ($59.99/mo). (P9)</p>
    </div>;
  }
  return (
    <div className="fadein">
      <div className="eyebrow">builder · your slot · upload-only, append-only</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 12px" }}>My slot</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 14.5, maxWidth: 620 }}>
        A builder's contribution is an encounter with the system, not an edit. It rests on a frontier,
        attributed, and never touches the canonical spine. Leave anytime — what you left stays (§9, §36).
        The full builder admin wires in P11.
      </p>
    </div>
  );
}

export function Architect() {
  const { role } = useSite();
  const ctx = useCtx();
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    supabase?.rpc("event_metrics").then(({ data, error }) => {
      if (error) setDenied(true); else setMetrics(data as Record<string, unknown>);
    });
  }, []);
  if (showElement("architect_console", role, ctx) === "hidden") {
    return <p className="mono" style={{ color: "var(--c-bone3)" }}>not found.</p>;
  }
  return (
    <div className="fadein">
      <div className="eyebrow">architect · the console</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 12px" }}>Architect console</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 14.5, maxWidth: 620 }}>
        8-field capture · the why-ledger · live structural-load ranking · firewall reroute · the review
        inbox · conduct withdrawal. The console wires to commit_node (already live) in P10.
      </p>

      <section className="card" style={{ padding: "16px 18px", marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          the instrument · where the climb stalls (§2) · architect-only, never a reader score
        </div>
        {denied && (
          <div className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>
            telemetry is architect-gated (§4) — live aggregates read once Auth signs you in as the
            architect (P9). the event log is already capturing.
          </div>
        )}
        {metrics && (
          <pre className="mono" style={{ fontSize: 11, color: "var(--c-bone2)", whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
        )}
      </section>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--c-bone3)", marginTop: 10 }}>
        the razor: intelligibility carried, never time held · no streaks, no nudges, no reader-facing number
      </div>
    </div>
  );
}

export function ColdGate() {
  return (
    <div className="card fadein" style={{ padding: "28px 24px", textAlign: "center", marginTop: 32 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>you arrived without a thread</div>
      <p style={{ color: "var(--c-bone2)", fontSize: 15, maxWidth: 460, margin: "0 auto 16px" }}>
        There is no front door here. The site is entered mid-thought, through a continuation. Start at
        what's live now, or walk the atlas.
      </p>
      <a href="/" className="btn btn-solid" style={{ display: "inline-block" }}>see what's live now</a>
    </div>
  );
}
