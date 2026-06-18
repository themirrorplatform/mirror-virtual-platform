import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import type { Role, Ctx, Viewport, SurfaceRegister } from "../gates";
import type { Graph } from "../types";
import { fetchGraph } from "../lib/data";

/* ----------------------------------------------------------------------------
   The site context. Carries the reader's register (role), the device viewport,
   the arrival, and the loaded graph — the inputs every gate needs. Role is a
   dev switcher until P9 wires Auth + Stripe (roles are registers, not yet
   account state). Nothing here decides visibility; templates call the gates.
   -------------------------------------------------------------------------- */

function readViewport(): Viewport {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  return w < 680 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

/** arrived_from from ?from= (the wedge link carries it), else 'cold' (§2, SEO). */
function readArrival(): string {
  if (typeof window === "undefined") return "cold";
  const p = new URLSearchParams(window.location.search).get("from");
  return p ?? "cold";
}

interface SiteValue {
  role: Role;
  setRole: (r: Role) => void;
  viewport: Viewport;
  arrival: string;
  graph: Graph;
  loading: boolean;
  error: string | null;
  /** build a render ctx for a given surface (register) and entry-ness. */
  ctx: (opts?: { register?: SurfaceRegister; isEntryNode?: boolean }) => Ctx;
}

const SiteContext = createContext<SiteValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem("mp.role") as Role) || "free",
  );
  const [viewport, setViewport] = useState<Viewport>(readViewport);
  const [arrival] = useState<string>(readArrival);
  const [graph, setGraph] = useState<Graph>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // readerVocab is felt-not-counted (§E): derived from gloss events, never shown.
  const [readerVocab] = useState<ReadonlySet<string>>(new Set());

  const setRole = (r: Role) => { localStorage.setItem("mp.role", r); setRoleState(r); };

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let live = true;
    fetchGraph()
      .then((g) => { if (live) { setGraph(g); setError(null); } })
      .catch((e) => { if (live) setError(e.message ?? String(e)); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const value = useMemo<SiteValue>(() => ({
    role, setRole, viewport, arrival, graph, loading, error,
    ctx: (opts = {}) => ({
      arrival,
      isEntryNode: opts.isEntryNode ?? false,
      viewport,
      register: opts.register ?? "transmission",
      readerVocab,
    }),
  }), [role, viewport, arrival, graph, loading, error, readerVocab]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteValue {
  const v = useContext(SiteContext);
  if (!v) throw new Error("useSite must be used within SiteProvider");
  return v;
}
