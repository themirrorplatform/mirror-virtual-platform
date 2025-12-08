// Supabase Edge Function: Sync User Profile
// Triggered on auth.users insert to create corresponding profile
// Ensures data consistency between auth and public schemas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface UserRecord {
  id: string;
  email: string;
  raw_user_meta_data?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { record, type } = await req.json() as { record: UserRecord; type: string };

    // Only process INSERT events
    if (type !== "INSERT") {
      return new Response(
        JSON.stringify({ message: "Skipping non-INSERT event" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { id, email, raw_user_meta_data } = record;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: "Profile already exists" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract metadata
    const username = raw_user_meta_data?.username || email.split("@")[0];
    const display_name = raw_user_meta_data?.display_name || username;
    const avatar_url = raw_user_meta_data?.avatar_url || null;

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id,
        username,
        display_name,
        email,
        avatar_url,
        points: 0,
        level: 1,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to create profile", details: profileError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        message: "Profile created successfully",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in sync-user-profile:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
