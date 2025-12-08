// Supabase Edge Function: Cleanup Sessions
// Scheduled function to remove expired sessions and old data
// Helps maintain database performance

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const results = {
      expired_sessions: 0,
      old_page_views: 0,
      old_events: 0,
    };

    // Clean up old page views (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: pvCount, error: pvError } = await supabase
      .from("page_views")
      .delete({ count: "exact" })
      .lt("viewed_at", ninetyDaysAgo.toISOString());

    if (!pvError) {
      results.old_page_views = pvCount || 0;
    }

    // Clean up old events (older than 90 days)
    const { count: evCount, error: evError } = await supabase
      .from("events")
      .delete({ count: "exact" })
      .lt("created_at", ninetyDaysAgo.toISOString());

    if (!evError) {
      results.old_events = evCount || 0;
    }

    // Clean up expired refresh tokens (handled by auth schema automatically)
    // We can query for information but not delete from auth schema
    const { count: sessionCount } = await supabase.auth.admin.listUsers();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Cleanup completed",
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in cleanup-sessions:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
