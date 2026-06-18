import { supabase } from "./supabase";
import type { Graph, MirrorNode } from "../types";

/**
 * Fetch the corpus into the §4.1 Graph shape the engine consumes. The DB view
 * `node_graph` already assembles rests_on/pulls_to/leads_to as arrays and is
 * RLS-gated, so the client receives exactly what its role may see and then runs
 * the SAME compute (engine.ts) the server ran at write time. Navigation is
 * derived on read (§0) — nothing here is stored as truth.
 */
export async function fetchGraph(): Promise<Graph> {
  if (!supabase) throw new Error("Supabase not configured (set VITE_SUPABASE_* )");
  const { data, error } = await supabase.from("node_graph").select("*");
  if (error) throw error;

  const g: Graph = {};
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    g[row.node_id as string] = {
      id: row.node_id as string,
      label: row.label as string,
      kind: row.kind as MirrorNode["kind"],
      content_home: row.content_home as string,
      content_reaches: (row.content_reaches as string[]) ?? [],
      substrate: (row.substrate as MirrorNode["substrate"]) ?? [],
      register: row.register as MirrorNode["register"],
      rests_on: (row.rests_on as string[]) ?? [],
      pulls_to: (row.pulls_to as string[]) ?? [],
      stage: row.stage as MirrorNode["stage"],
      verdict: (row.verdict as MirrorNode["verdict"]) ?? null,
      verdict_source: (row.verdict_source as MirrorNode["verdict_source"]) ?? null,
      refuter: (row.refuter as string | null) ?? null,
      depth: (row.cached_depth as MirrorNode["depth"]) ?? null,
      author: row.author_handle as string,
      engagement: (row.engagement as MirrorNode["engagement"]) ?? undefined,
      presence: (row.presence as MirrorNode["presence"]) ?? undefined,
      conduct_status: (row.conduct_status as MirrorNode["conduct_status"]) ?? undefined,
      flags: (row.flags as string[]) ?? [],
    };
  }
  return g;
}
