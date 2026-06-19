// ============================================================================
// The Mirror Platform — create-checkout-session (P9)
// Stripe Checkout in subscription mode (best-practice: Checkout Sessions, no
// payment_method_types — Stripe picks dynamically). Authenticates the caller,
// finds-or-creates their Stripe customer (stored on their subscription row),
// and returns the hosted-page URL. The webhook is the source of truth for the
// tier flip — never the success redirect (fulfillment guide).
// ============================================================================
import Stripe from "https://esm.sh/stripe@17?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const PRICES: Record<string, string | undefined> = {
  continuations: Deno.env.get("STRIPE_PRICE_CONTINUATIONS"),
  builder: Deno.env.get("STRIPE_PRICE_BUILDER"),
};

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

  const { tier } = await req.json().catch(() => ({}));
  const price = PRICES[tier];
  if (!price) return json({ error: "unknown tier" }, 400);

  const admin = createClient(url, service);
  // find-or-create the Stripe customer for this user (one per account)
  const { data: sub } = await admin.from("subscription").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  let customer = sub?.stripe_customer_id as string | undefined;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customer = c.id;
    await admin.from("subscription").upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: "user_id" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancel`,
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
    allow_promotion_codes: true,
  });

  return json({ url: session.url });
});
