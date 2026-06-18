// ============================================================================
// The Mirror Platform — create-portal-session (P9)
// The Customer Portal: one-click cancel and payment-method management, per the
// constitution (§6: cancel anytime, no dark-pattern retention). Stripe hosts it;
// our webhook receives the resulting subscription.updated/deleted and flips the
// tier. Owned materials persist (lapse != erasure).
// ============================================================================
import Stripe from "https://esm.sh/stripe@17?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2026-05-27.dahlia" });
  const origin = req.headers.get("origin") ?? "http://localhost:5173";

  const asUser = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(url, service);
  const { data: sub } = await admin.from("subscription").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return json({ error: "no customer" }, 400);

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id as string,
    return_url: `${origin}/account`,
  });
  return json({ url: portal.url });
});
