import { supabase } from "./supabase";

/* ============================================================================
   The Mirror Platform — telemetry capture (P14)
   The observed-encounter geometry (§4.2), captured against ONE razor (§0):
   the measured quantity is intelligibility-carried, NEVER retention. That razor
   is encoded in the TYPE — EventKind is exactly the frozen §1 verbs, so there is
   no 'time_on_site' / 'session_length' / 'return_frequency' kind to write. You
   cannot build the slot machine with this instrument.

   Felt, never counted (§0, §4): logEvent returns void — it never hands a number
   back to the reader, and nothing reader-facing reads the log. The actor is
   pseudonymous (the auth session id or null), and raw events are PERSON-class
   (erasable). The log is append-only (enforced in the DB).
   ========================================================================== */

/** The frozen capture-kinds (§1). No retention metric exists, by construction. */
export type EventKind =
  | "arrival"
  | "read_depth"
  | "membrane_open"
  | "rail_follow"
  | "gloss_shown"
  | "gate_hit"
  | "gate_convert"
  | "gate_abandon"
  | "frontier_reached"
  | "continue_pressed"
  | "exit_to_home"
  | "builder_upload";

/** The frozen set, exported for the build lint / razor test. */
export const EVENT_KINDS: readonly EventKind[] = [
  "arrival", "read_depth", "membrane_open", "rail_follow", "gloss_shown",
  "gate_hit", "gate_convert", "gate_abandon", "frontier_reached",
  "continue_pressed", "exit_to_home", "builder_upload",
] as const;

let actorId: string | null | undefined;
async function getActor(): Promise<string | null> {
  if (actorId !== undefined) return actorId;
  if (!supabase) return (actorId = null);
  const { data } = await supabase.auth.getUser();
  return (actorId = data.user?.id ?? null); // pseudonymous: the session id, or anon
}

/**
 * Record one encounter event. Fire-and-forget; never throws into the render
 * path; returns void (the reader is never handed a tally). Best-effort — a
 * dropped event must never break a read.
 */
export async function logEvent(
  kind: EventKind,
  node: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!supabase) return;
  try {
    const actor = await getActor();
    await supabase.from("event").insert({ kind, node_id: node, actor, payload });
  } catch {
    /* telemetry is best-effort and silent — debugging the staircase, not the read */
  }
}

/** gloss_shown also feeds readerVocab + the gloss verdict (§1) — same call. */
export const logGloss = (term: string, node: string | null) =>
  logEvent("gloss_shown", node, { term });
