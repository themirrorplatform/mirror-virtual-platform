// Supabase Edge Function: Broadcast Reflection
// Broadcasts reflection events to realtime channels
// Enables live updates for connected clients

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ReflectionRecord {
  id: number;
  user_id: string;
  reflection_text: string;
  thread_id?: string;
  tone?: string;
  created_at: string;
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { record, type } = await req.json() as { record: ReflectionRecord; type: string };

    // Determine broadcast channel
    const channel = record.thread_id 
      ? `thread:${record.thread_id}` 
      : `user:${record.user_id}`;

    // Broadcast to realtime channel
    await supabase
      .channel(channel)
      .send({
        type: "broadcast",
        event: type === "INSERT" ? "reflection.created" : "reflection.updated",
        payload: {
          id: record.id,
          user_id: record.user_id,
          reflection_text: record.reflection_text,
          thread_id: record.thread_id,
          tone: record.tone,
          created_at: record.created_at,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast to ${channel}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in broadcast-reflection:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
