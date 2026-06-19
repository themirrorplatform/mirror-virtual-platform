import { createClient } from "@supabase/supabase-js";

/**
 * The browser Supabase client. Reads only — every fetch is RLS-gated, so the
 * publishable/anon key is safe here (the service-role key never reaches the
 * client). Writes go through the edge functions (commit-node, erase-person).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && key ? createClient(url, key) : null;

export const hasSupabase = (): boolean => supabase !== null;
