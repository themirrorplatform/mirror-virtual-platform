/* ============================================================================
   The Mirror Platform — core types
   The node schema is Everything Spec §4.1, frozen. These types are the single
   source of truth the engine, the gates, and (later) the Supabase rows share.
   ========================================================================== */

/** A claim/continuation/construction/contribution. Everything is a node. */
export type Kind = "attempt" | "leaf/borrow" | "code" | "definition";

export type Stage =
  | "captured"
  | "has_result"
  | "in_protocol"
  | "verdict_in"
  | "on_graph";

/** A LABEL, never a gate (§4.3). `null` = untested. */
export type Verdict =
  | "HOLDS" | "HELD" | "QUALIFIED" | "GAP" | "UNTESTED"
  | "NAMED" | "OPEN" | "STANDS" | "ENCOUNTERED" | "RESPECTED"
  | "FORMULATED" | "DOCUMENTED" | "SPECIFIED" | "PROVED" | "PARTIAL"
  | "VIOLATED" | "OPERATIONAL" | "DIAGNOSED" | "LOCKED" | "APPROX"
  | "PROVISIONAL"
  | null;

/** Only an external encounter earns "derived" (§4.3, §25). */
export type VerdictSource = "carried" | "internal-rederivation" | "derived" | null;

export type Substrate = "thought" | "emotion" | "belief" | "experience";

/** Where a verdict stands re: the open ledger. */
export type Register = "live" | "confirms" | null;

/** Builder-node lifecycle (Contribution-Conduct §2). */
export type Engagement = "unread" | "read" | "integrated" | "openly_discussed";
export type Presence = "active" | "departed";
export type ConductStatus = "live" | "withdrawn-for-conduct";

export interface MirrorNode {
  id: string;
  label: string;
  kind: Kind;
  content_home: string;
  content_reaches?: string[];
  substrate: Substrate[];
  register: Register;
  /** DEPENDS_ON edges — rigid, acyclic (the firewall). */
  rests_on: string[];
  /** ENCOUNTER edges — soft, may cycle (the grounding geometry). */
  pulls_to: string[];
  stage: Stage;
  verdict: Verdict;
  verdict_source?: VerdictSource;
  /** What an opponent must DO to break it. null = seal-risk if HOLDS/HELD. */
  refuter: string | null;
  /** COMPUTED each run from structural load — never stored as truth (§4.3). */
  depth?: DepthTier | null;
  author?: string;
  engagement?: Engagement;
  presence?: Presence;
  conduct_status?: ConductStatus;
  determination?: string | null;
  flags?: string[];
}

export type DepthTier = "metric" | "load-bearing" | "province" | "shallow";

/** The graph is a map id -> node, as in protocol.py's g["nodes"]. */
export type Graph = Record<string, MirrorNode>;

/** A proposed edge, used to test acyclicity before a write (the firewall). */
export interface ProspectiveEdge {
  child: string;
  parent: string;
}
