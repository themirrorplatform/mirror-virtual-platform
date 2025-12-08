// Supabase Edge Function: Analytics Aggregator
// Scheduled function to aggregate analytics data
// Runs daily to compute summary statistics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate page views
    const { data: pageViews, error: pvError } = await supabase
      .rpc("get_page_analytics", {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

    if (pvError) {
      console.error("Failed to get page analytics:", pvError);
    }

    // Get reflection stats
    const { count: reflectionCount } = await supabase
      .from("reflections")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString());

    // Get active users
    const { data: activeUsers } = await supabase
      .from("page_views")
      .select("session_id")
      .gte("viewed_at", startDate.toISOString())
      .then((res) => {
        const uniqueSessions = new Set(res.data?.map((pv) => pv.session_id));
        return { data: Array.from(uniqueSessions) };
      });

    // Get top pages
    const { data: topPages } = await supabase
      .from("page_views")
      .select("page_path")
      .gte("viewed_at", startDate.toISOString())
      .then((res) => {
        const pageCounts = res.data?.reduce((acc: Record<string, number>, pv) => {
          acc[pv.page_path] = (acc[pv.page_path] || 0) + 1;
          return acc;
        }, {});
        return {
          data: Object.entries(pageCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([path, count]) => ({ path, count })),
        };
      });

    const summary = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      metrics: {
        page_views: pageViews?.length || 0,
        unique_visitors: activeUsers?.length || 0,
        reflections_created: reflectionCount || 0,
        top_pages: topPages || [],
      },
      generated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(summary),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in analytics-aggregator:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
