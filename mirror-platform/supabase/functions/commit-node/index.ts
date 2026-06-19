// ============================================================================
// The Mirror Platform — commit-node edge function (P3)
// The architect's write path. Authenticates the caller, confirms they are the
// architect, then runs commit_node() — which (atomically, behind the firewall
// triggers) upserts the node + edges, recomputes load/depth, and returns the
// why-ledger (§8). The engine running at write time; reads compute client-side.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // 1) identify the caller from their JWT
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: uerr } = await asUser.auth.getUser();
  if (uerr || !user) return json({ error: "unauthenticated" }, 401);

  // 2) confirm the caller is the architect (only the architect commits canon)
  const admin = createClient(url, service);
  const { data: prof } = await admin
    .from("app_user").select("handle, handle:handle!inner(is_architect)")
    .eq("id", user.id).maybeSingle();
  const isArchitect =
    // deno-lint-ignore no-explicit-any
    (prof as any)?.handle?.is_architect === true;
  if (!isArchitect) return json({ error: "architect only" }, 403);

  // 3) run the engine at write time; the firewall lives in the DB triggers
  const payload = await req.json().catch(() => null);
  if (!payload?.node_id) return json({ error: "node_id required" }, 400);

  const { data: ledger, error } = await admin.rpc("commit_node", { payload });
  if (error) {
    // a firewall/builder-guard/external-gate violation surfaces here
    return json({ error: error.message, code: error.code }, 422);
  }
  return json({ ok: true, ledger });
});
