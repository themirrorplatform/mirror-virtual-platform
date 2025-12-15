// Supabase Edge Function: Webhook Handler
// Generic webhook receiver for external integrations
// Validates signatures and routes to appropriate handlers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify HMAC SHA-256 signature
async function verifySignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Expected format: "sha256=<hex_digest>"
    if (!signature.startsWith("sha256=")) {
      return false;
    }
    
    const receivedSignature = signature.substring(7); // Remove "sha256=" prefix
    
    // Compute HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const dataBuffer = encoder.encode(body);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
    
    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    return timingSafeEqual(receivedSignature, computedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Read body as text for signature verification
    const bodyText = await req.text();
    
    // Verify webhook signature (REQUIRED if WEBHOOK_SECRET is set)
    const signature = req.headers.get("x-webhook-signature");
    if (WEBHOOK_SECRET) {
      if (!signature) {
        console.error("Missing webhook signature");
        return new Response("Unauthorized: Missing signature", { status: 401 });
      }
      
      const isValid = await verifySignature(bodyText, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response("Unauthorized: Invalid signature", { status: 401 });
      }
    }

    const payload = JSON.parse(bodyText);
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
