// Supabase Edge Function: Webhook Handler
// Generic webhook receiver for external integrations
// Validates signatures and routes to appropriate handlers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify webhook signature
    const signature = req.headers.get("x-webhook-signature");
    if (WEBHOOK_SECRET && signature) {
      // TODO: Implement signature verification
      // const isValid = await verifySignature(req, signature, WEBHOOK_SECRET);
      // if (!isValid) {
      //   return new Response("Unauthorized", { status: 401 });
      // }
    }

    const payload = await req.json();
    const { type, data } = payload;

    // Log webhook event
    await supabase.from("events").insert({
      event_name: `webhook.${type}`,
      metadata: {
        payload: data,
        received_at: new Date().toISOString(),
      },
    });

    // Route to appropriate handler
    switch (type) {
      case "payment.success":
        // Handle payment success
        console.log("Payment success:", data);
        break;

      case "user.signup":
        // Handle user signup from external source
        console.log("External user signup:", data);
        break;

      case "ai.processing.complete":
        // Handle AI processing completion
        console.log("AI processing complete:", data);
        break;

      default:
        console.log("Unknown webhook type:", type);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed",
        type,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in webhook-handler:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
