import { supabase } from "./supabase";

/* ----------------------------------------------------------------------------
   Client billing. Calls the edge functions (which hold the Stripe secret) and
   redirects to the Stripe-hosted page. The webhook — not this redirect — is what
   flips the tier (fulfillment guide). Patron is NOT here: it is a contact route,
   not a checkout (§6).
   -------------------------------------------------------------------------- */

export type PaidTier = "continuations" | "builder";

/** Open Stripe Checkout for a tier; resolves to an error string or redirects. */
export async function startCheckout(tier: PaidTier): Promise<string | null> {
  if (!supabase) return "billing unavailable";
  const { data, error } = await supabase.functions.invoke("create-checkout-session", { body: { tier } });
  if (error) return error.message;
  if (data?.url) { window.location.href = data.url; return null; }
  return "could not start checkout";
}

/** Open the Stripe Customer Portal (manage / one-click cancel, §6). */
export async function openPortal(): Promise<string | null> {
  if (!supabase) return "billing unavailable";
  const { data, error } = await supabase.functions.invoke("create-portal-session", { body: {} });
  if (error) return error.message;
  if (data?.url) { window.location.href = data.url; return null; }
  return "could not open portal";
}
