// ============================================================================
// The Mirror Platform — erase-person edge function (Permanence §3)
// THE SINGLE DELETE OPERATION in the whole system. Erases PERSON data only —
// PII, billing, raw events — and the auth user. Touches NO corpus row: the
// handle and every contributed node persist as residue, decoupled (§1, §36).
// A user may erase themselves; the architect may erase on lawful request.
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

  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: uerr } = await asUser.auth.getUser();
  if (uerr || !user) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(url, service);

  // default: erase self. Architect may pass { target } to erase on request.
  const body = await req.json().catch(() => ({}));
  let target = user.id;
  if (body?.target && body.target !== user.id) {
    const { data: prof } = await admin
      .from("app_user").select("handle:handle!inner(is_architect)")
      .eq("id", user.id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    if ((prof as any)?.handle?.is_architect !== true) return json({ error: "architect only" }, 403);
    target = body.target;
  }

  // 1) erase application-table PERSON data atomically (corpus untouched)
  const { error: rpcErr } = await admin.rpc("erase_person", { p_user: target });
  if (rpcErr) return json({ error: rpcErr.message }, 422);

  // 2) delete the auth user (the identity itself)
  const { error: authErr } = await admin.auth.admin.deleteUser(target);
  if (authErr) return json({ error: `corpus erased; auth delete failed: ${authErr.message}` }, 207);

  return json({ ok: true, erased: target, corpus_touched: false });
});
