import { supabase } from "./supabase";
import type { Graph, MirrorNode } from "../types";

/** Map a node_graph row into a §4.1 MirrorNode. */
function toNode(row: Record<string, unknown>): MirrorNode {
  return {
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

/**
 * Fetch the corpus into the §4.1 Graph shape the engine consumes. The view
 * `node_graph` assembles rests_on/pulls_to/leads_to and is RLS-gated, so the
 * client receives exactly what its role may see, then runs the SAME compute
 * (engine.ts) the server ran at write time. Derived on read (§0).
 */
export async function fetchGraph(): Promise<Graph> {
  if (!supabase) throw new Error("Supabase not configured (set VITE_SUPABASE_*)");
  const { data, error } = await supabase.from("node_graph").select("*");
  if (error) throw error;
  const g: Graph = {};
  for (const r of data ?? []) g[(r as { node_id: string }).node_id] = toNode(r as Record<string, unknown>);
  return g;
}

export interface ThreadRow {
  node_id: string; slug: string; title: string;
  body: unknown | null; arrived_from: string | null; basin: string | null;
  featured: boolean; published: boolean;
}
export interface ConstructionRow {
  node_id: string; slug: string; title: string;
  body: unknown | null; min_tier: string; published: boolean;
}
export interface MembraneRow {
  id: string; thread_id: string; construction_id: string; teaser: string; position: number;
}

/** The derived "Now" list — a query over featured threads (§5). Never authored. */
export async function fetchNowList(): Promise<Pick<ThreadRow, "node_id" | "slug" | "title">[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("thread").select("node_id,slug,title").eq("featured", true).eq("published", true);
  if (error) throw error;
  return (data ?? []) as Pick<ThreadRow, "node_id" | "slug" | "title">[];
}

export async function fetchThreadBySlug(slug: string): Promise<ThreadRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("thread").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as ThreadRow) ?? null;
}

export async function fetchConstructionBySlug(slug: string): Promise<ConstructionRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("construction").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as ConstructionRow) ?? null;
}

export async function fetchMembranes(threadNodeId: string): Promise<MembraneRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("membrane").select("*").eq("thread_id", threadNodeId).order("position");
  if (error) throw error;
  return (data ?? []) as MembraneRow[];
}

/** Resolve a node_id to its route (/t/slug or /c/slug), for rail navigation. */
export async function routeForNode(nodeId: string): Promise<string | null> {
  if (!supabase) return null;
  const [t, c] = await Promise.all([
    supabase.from("thread").select("slug").eq("node_id", nodeId).maybeSingle(),
    supabase.from("construction").select("slug").eq("node_id", nodeId).maybeSingle(),
  ]);
  if (t.data?.slug) return `/t/${t.data.slug}`;
  if (c.data?.slug) return `/c/${c.data.slug}`;
  return null;
}
