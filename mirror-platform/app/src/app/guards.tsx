import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSite } from "./SiteContext";
import { useAuth } from "./AuthContext";
import type { Role } from "../gates";

/* ----------------------------------------------------------------------------
   Route guards — the "each level distinct, no overlap" requirement. A route
   admits only its register. The architect route is the hardest: it requires the
   ACCOUNT to be the architect (accountRole), not the dev preview — so no
   client-side switch can reach it in production (highest security for admin).
   -------------------------------------------------------------------------- */

const RANK: Record<Role, number> = { free: 0, cont: 1, build: 2, arch: 3 };

export function RequireRole({ min, children }: { min: Role; children: ReactNode }) {
  const { role, loading } = useSite();
  if (loading) return <p className="mono" style={{ color: "var(--c-bone3)" }}>…</p>;
  if (RANK[role] < RANK[min]) return <Navigate to="/account" replace />;
  return <>{children}</>;
}

/** The admin gate: account-derived architect ONLY — never the dev preview. */
export function RequireArchitect({ children }: { children: ReactNode }) {
  const { accountRole, loading } = useAuth();
  if (loading) return <p className="mono" style={{ color: "var(--c-bone3)" }}>…</p>;
  if (accountRole !== "arch") return <Navigate to="/" replace />;
  return <>{children}</>;
}
