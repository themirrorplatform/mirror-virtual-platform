import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ElementState, Role } from "../gates";
import { logEvent } from "../lib/telemetry";
import { startCheckout } from "../lib/billing";
import { useAuth } from "../app/AuthContext";

/* ----------------------------------------------------------------------------
   The frontier prompt (§7, Composition §3). A node whose "leads to" is empty is
   a frontier — the thought isn't finished. Reader (plain): the bare invitation,
   gate on tap. Continuations: + the unfinish named "(§59)". Builder: the
   contribution mechanics (the real continue verb lands in P11). The contribution
   gate ($59.99) is wired in P9; here a tap surfaces the honest placeholder.
   -------------------------------------------------------------------------- */

export function Frontier({
  state, role, isFrontier,
}: { state: ElementState; role: Role; isFrontier: boolean }) {
  const [prompted, setPrompted] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();
  if (state === "hidden" || state === "locked" || !isFrontier) return null;

  const builder = role === "build" || role === "arch";
  const onContinue = () => {
    logEvent("continue_pressed", null, {});
    logEvent("gate_hit", null, { gate: "contribution" });
    setPrompted(true);
    if (!user) nav("/signin"); else startCheckout("builder");
  };

  return (
    <section className="card" style={{ padding: "16px 18px", marginTop: 22, borderColor: "var(--c-line)" }}>
      <div className="threshold" style={{ fontSize: 18 }}>
        This thought isn't finished. Keep pulling on it?
      </div>
      {role === "cont" && (
        <div className="mono" style={{ fontSize: 11, color: "var(--c-bone3)", marginTop: 6 }}>
          the unfinish is named — §59.
        </div>
      )}
      {builder ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--c-bone2)", marginTop: 10 }}>
          your continuation rests on this frontier, attributed, append-only — it never touches the
          canonical spine (§9). the builder slot is the place. (wired in P11)
        </div>
      ) : (
        <>
          <button className="btn btn-solid" style={{ marginTop: 12 }} onClick={onContinue}>
            continue this thought →
          </button>
          {prompted && (
            <div className="mono" style={{ fontSize: 12, color: "var(--c-bone3)", marginTop: 10 }}>
              continuing requires a Builder slot ($59.99) — a borne cost filters for seriousness, not
              means (§6).
            </div>
          )}
        </>
      )}
    </section>
  );
}
