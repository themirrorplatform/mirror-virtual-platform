// ============================================================================
// The Mirror Platform — stripe-webhook (P9)
// The SOURCE OF TRUTH for subscription state (fulfillment guide: never trust the
// success redirect). Verifies the signature, then maps Stripe lifecycle events
// onto the subscription row with the service role. Lapse != erasure (§6,
// Permanence §2): a canceled/lapsed subscriber drops to 'free' read access; no
// corpus, no PII is touched.
// ============================================================================
import Stripe from "https://esm.sh/stripe@17?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2026-05-27.dahlia" });
const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// map a Stripe price id back to our tier
const TIER_BY_PRICE: Record<string, "continuations" | "builder"> = {
  [Deno.env.get("STRIPE_PRICE_CONTINUATIONS") ?? "_c"]: "continuations",
  [Deno.env.get("STRIPE_PRICE_BUILDER") ?? "_b"]: "builder",
};

async function setTier(userId: string, fields: Record<string, unknown>) {
  await admin.from("subscription").upsert({ user_id: userId, ...fields }, { onConflict: "user_id" });
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("no signature", { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, whSecret, undefined, cryptoProvider);
  } catch (e) {
    return new Response(`signature verification failed: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id;
        const tier = s.metadata?.tier;
        if (userId && tier) {
          await setTier(userId, {
            tier, status: "active",
            stripe_customer_id: s.customer as string,
            stripe_subscription_id: s.subscription as string,
            cancel_at: null,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const priceId = sub.items.data[0]?.price.id;
        const tier = priceId ? TIER_BY_PRICE[priceId] : undefined;
        if (userId) {
          await setTier(userId, {
            ...(tier ? { tier } : {}),
            status: sub.status === "active" || sub.status === "trialing" ? "active"
              : sub.status === "past_due" ? "past_due" : "canceled",
            cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
            stripe_subscription_id: sub.id,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        // lapse != erasure: drop to free read access only; corpus/PII untouched
        if (userId) await setTier(userId, { tier: "free", status: "canceled", cancel_at: null });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const userId = (inv.subscription_details?.metadata?.user_id) as string | undefined;
        if (userId) await setTier(userId, { status: "past_due" });
        break;
      }
    }
  } catch (e) {
    return new Response(`handler error: ${(e as Error).message}`, { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
