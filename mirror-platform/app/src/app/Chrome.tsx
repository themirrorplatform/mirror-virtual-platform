import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useSite } from "./SiteContext";
import { showElement, deviceBehavior, type Role } from "../gates";
import { computeGeometry } from "../engine";

/* ----------------------------------------------------------------------------
   Global chrome. Every strip renders through showElement — no element decides
   its own visibility (§0, P7). The invariant strip and route strip are Builder+
   only (Composition §4); a reader never sees engine telemetry.
   -------------------------------------------------------------------------- */

const ROLES: { id: Role; label: string }[] = [
  { id: "free", label: "Free" }, { id: "cont", label: "Continuations" },
  { id: "build", label: "Builder" }, { id: "arch", label: "Architect" },
];

export function Chrome({ children }: { children: React.ReactNode }) {
  const { role, setRole, devPreview, viewport, graph } = useSite();
  const loc = useLocation();
  const c = { register: "system" as const };
  const ctx = { arrival: "cold", isEntryNode: false, viewport, register: "system" as const, readerVocab: new Set<string>() };

  const geo = useMemo(() => computeGeometry(graph), [graph]);
  const nav = showElement("primary_nav", role, ctx);
  const adminNav = showElement("admin_nav", role, ctx);
  const strip = showElement("invariant_strip", role, ctx);
  const routeStrip = showElement("route_strip", role, ctx);
  const footer = showElement("footer_constitution", role, ctx);
  void c;

  return (
    <>
      <header style={{ borderBottom: "1px solid var(--c-line)", position: "sticky", top: 0,
        background: "var(--c-stage)", zIndex: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Link to="/" className="threshold" style={{ fontSize: 18, fontWeight: 700,
            textDecoration: "none", color: "var(--c-bone)" }}>The Mirror Platform</Link>

          {nav !== "hidden" && (
            <nav style={{ display: "flex", gap: 14, fontSize: 12.5 }} className="system">
              <Link className="link" to="/map">Atlas</Link>
              <Link className="link" to="/events">Events</Link>
              <Link className="link" to="/forum">Forum</Link>
              <Link className="link" to="/about">About</Link>
              <Link className="link" to="/account">Account</Link>
              <Link className="link" to="/signin">Sign in</Link>
            </nav>
          )}
          {adminNav !== "hidden" && (
            <nav style={{ display: "flex", gap: 14, fontSize: 12.5 }} className="system">
              <Link className="link" to="/builder">My slot</Link>
              {role === "arch" && <Link className="link" to="/architect">Architect</Link>}
            </nav>
          )}

          {/* dev-only role switcher (walking surfaces); hidden in production,
              where the role is account-derived (the hardened-admin requirement) */}
          {devPreview && <div style={{ marginLeft: "auto", display: "flex", gap: 4 }} className="mono">
            {ROLES.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className="tap"
                style={{ fontSize: 10.5, padding: "4px 8px", cursor: "pointer",
                  border: "1px solid var(--c-line)", borderRadius: 1,
                  background: role === r.id ? "var(--c-gold)" : "transparent",
                  color: role === r.id ? "var(--c-stage)" : "var(--c-bone3)" }}>
                {r.label}
              </button>
            ))}
          </div>}
          {!devPreview && <div style={{ marginLeft: "auto" }} />}
        </div>

        {strip !== "hidden" && (
          <div className="mono" aria-hidden style={{ fontSize: 10.5, color: "var(--c-bone3)",
            padding: "5px 20px", borderTop: "1px solid var(--c-line)",
            maxWidth: 980, margin: "0 auto",
            display: deviceBehavior("invariant_strip", viewport) === "chip" ? "block" : "flex", gap: 18 }}>
            <span>firewall · {geo.cycle ? "CYCLE" : "acyclic ✓"}</span>{" "}
            <span>open column · {geo.openColumn.length}</span>{" "}
            <span>seal-risk · {geo.sealRisks.length}</span>{" "}
            <span>nodes · {Object.keys(graph).length}</span>
            {routeStrip !== "hidden" && <span> · route {loc.pathname}</span>}
          </div>
        )}
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 64px" }}>
        {children}
      </main>

      {footer !== "hidden" && (
        <footer className="mono" style={{ borderTop: "1px solid var(--c-line)",
          padding: "18px 20px", fontSize: 11, color: "var(--c-bone3)", textAlign: "center" }}>
          nothing completes · your continuations stay yours and leave with you · the guardian can never remove them
        </footer>
      )}
    </>
  );
}
