// Supabase Edge Function: Process Reflection
// Handles reflection creation and triggers AI mirrorback generation
// Integrates with MirrorX AI Engine

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIRRORX_API_URL = Deno.env.get("MIRRORX_API_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ReflectionRequest {
  user_id: string;
  reflection_text: string;
  thread_id?: string;
  tone?: string;
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { user_id, reflection_text, thread_id, tone } = await req.json() as ReflectionRequest;

    // Validate input
    if (!user_id || !reflection_text) {
      return new Response(
        JSON.stringify({ error: "user_id and reflection_text are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert reflection into database
    const { data: reflection, error: insertError } = await supabase
      .from("reflections")
      .insert({
        user_id,
        reflection_text,
        thread_id,
        tone: tone || "adaptive",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert reflection:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save reflection", details: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Trigger AI mirrorback generation (async)
    if (MIRRORX_API_URL) {
      fetch(`${MIRRORX_API_URL}/reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          reflection_text,
          thread_id,
          tone,
        }),
      }).catch((err) => {
        console.error("Failed to trigger MirrorX processing:", err);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reflection,
        message: "Reflection saved. AI processing started.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in process-reflection:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
