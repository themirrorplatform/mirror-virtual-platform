// src/lib/mirrorApi.ts - Updated for Mirror Virtual Platform unified schema
import supabase from "./supabaseClient";

/* ---------- CONFIGURATION ---------- */
const MIRRORX_ENGINE_URL = import.meta.env.VITE_MIRRORX_ENGINE_URL || "http://localhost:8001";

/* ---------- AUTH ---------- */

export const Auth = {
  me() {
    return supabase.auth.getUser();
  },

  // magic link sign-in
  signIn(email: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },
};

/* ---------- REFLECTIONS ---------- */

export const Reflections = {
  async list(tag?: string) {
    let q = supabase
      .from("reflections")
      .select(
        `
        id,
        body,
        lens_key,
        tone,
        visibility,
        metadata,
        created_at,
        author:profiles!reflections_author_id_fkey (
          id,
          display_name,
          avatar_url,
          role
        )
      `
      )
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    // Filter by tag if stored in metadata
    if (tag) {
      q = q.contains("metadata", { tags: [tag] });
    }

    const { data, error } = await q;
    return { data, error };
  },

  async create(
    userId: string,
    params: {
      title?: string;
      content: string;
      tags?: string[];
      quote?: string | null;
      video_url?: string | null;
    }
  ) {
    // 1. Save reflection to database with metadata
    const { data: reflection, error } = await supabase
      .from("reflections")
      .insert({
        author_id: userId,
        body: params.content,
        visibility: "public",
        tone: "raw",
        metadata: {
          title: params.title || null,
          tags: params.tags || [],
          quote: params.quote || null,
          video_url: params.video_url || null,
        },
      })
      .select(
        `
        id,
        body,
        lens_key,
        tone,
        visibility,
        metadata,
        created_at,
        author:profiles!reflections_author_id_fkey (
          id,
          display_name,
          avatar_url,
          role
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to save reflection:", error);
      return { data: null, error };
    }

    // 2. Call MirrorX Engine for AI-powered mirrorback (async)
    try {
      const response = await fetch(`${MIRRORX_ENGINE_URL}/api/mirrorx/reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          reflection_text: params.content,
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        console.log("MirrorX AI response:", aiResult);
        
        // AI mirrorback is automatically saved by MirrorX Engine
        // Return reflection with AI context
        return {
          data: {
            ...reflection,
            ai_mirrorback: aiResult.mirrorback,
            identity_insight: aiResult.identity_delta_summary,
            tensions: aiResult.tensions || [],
            loops: aiResult.loops || [],
          },
          error: null,
        };
      } else {
        console.warn("MirrorX Engine returned non-OK status:", response.status);
      }
    } catch (err) {
      console.error("MirrorX Engine error (non-blocking):", err);
      // Continue - user still gets their reflection saved
    }

    // Return reflection even if AI fails
    return { data: reflection, error: null };
  },

  delete(reflectionId: number) {
    return supabase.from("reflections").delete().eq("id", reflectionId);
  },
};

/* ---------- MIRRORBACKS (COMMENTS) ---------- */

export const Mirrorbacks = {
  list(reflectionId: number) {
    return supabase
      .from("mirrorbacks")
      .select(
        `
        id,
        body,
        tone,
        source,
        metadata,
        created_at,
        responder_id,
        author:profiles!mirrorbacks_responder_id_fkey (
          id,
          display_name,
          avatar_url,
          role
        )
      `
      )
      .eq("reflection_id", reflectionId)
      .order("created_at", { ascending: true });
  },

  async create(
    userId: string,
    reflectionId: number,
    content: string,
    parentId?: number
  ) {
    const { data, error } = await supabase.from("mirrorbacks").insert({
      reflection_id: reflectionId,
      responder_id: userId,
      body: content,
      source: "human",
      tone: "processing",
      metadata: {
        parent_id: parentId || null,
      },
    });

    // Points are awarded automatically via trigger

    return { data, error };
  },

  delete(mirrorbackId: number) {
    return supabase.from("mirrorbacks").delete().eq("id", mirrorbackId);
  },
};

/* ---------- REACTIONS ---------- */

export type ReactionKind = "reflect" | "appreciate" | "challenge" | "save";

export const Reactions = {
  add(reflectionId: number, userId: string, kind: ReactionKind) {
    return supabase.from("reactions").insert({
      reflection_id: reflectionId,
      user_id: userId,
      kind,
    });
  },

  remove(reflectionId: number, userId: string, kind: ReactionKind) {
    return supabase
      .from("reactions")
      .delete()
      .match({ reflection_id: reflectionId, user_id: userId, kind });
  },

  async getCounts(reflectionId: number) {
    const { data, error } = await supabase
      .rpc("get_reaction_counts", { reflection_id_param: reflectionId });
    
    if (error) {
      console.error("Failed to get reaction counts:", error);
      return {
        reflect_count: 0,
        appreciate_count: 0,
        challenge_count: 0,
        save_count: 0,
      };
    }

    return data[0] || {
      reflect_count: 0,
      appreciate_count: 0,
      challenge_count: 0,
      save_count: 0,
    };
  },
};

/* ---------- WISHLISTS ---------- */

export const Wishlists = {
  list() {
    return supabase
      .from("wishlists")
      .select(
        `
        id,
        title,
        description,
        status,
        created_at,
        author:profiles!wishlists_author_id_fkey (id, display_name, avatar_url),
        votes:wishlist_votes (user_id)
      `
      )
      .order("created_at", { ascending: false });
  },

  async create(
    userId: string,
    params: { title: string; description?: string | null }
  ) {
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        author_id: userId,
        title: params.title,
        description: params.description || null,
      })
      .select(
        `
        id,
        title,
        description,
        status,
        created_at
      `
      )
      .single();

    // Points are awarded automatically via trigger

    return { data, error };
  },

  vote(wishlistId: number, userId: string) {
    return supabase.from("wishlist_votes").insert({
      wishlist_id: wishlistId,
      user_id: userId,
    });
  },

  unvote(wishlistId: number, userId: string) {
    return supabase
      .from("wishlist_votes")
      .delete()
      .match({ wishlist_id: wishlistId, user_id: userId });
  },

  delete(wishlistId: number) {
    return supabase.from("wishlists").delete().eq("id", wishlistId);
  },
};

/* ---------- EVENTS ---------- */

export const EventsApi = {
  list() {
    return supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        starts_at,
        timezone,
        join_url,
        banner_url
      `
      )
      .order("starts_at", { ascending: true });
  },

  rsvps(eventId: number) {
    return supabase
      .from("event_rsvps")
      .select("user_id")
      .eq("event_id", eventId);
  },

  rsvp(eventId: number, userId: string) {
    return supabase.from("event_rsvps").insert({
      event_id: eventId,
      user_id: userId,
    });
  },

  unrsvp(eventId: number, userId: string) {
    return supabase
      .from("event_rsvps")
      .delete()
      .match({ event_id: eventId, user_id: userId });
  },
};

/* ---------- PROFILES / LEADERBOARD / CHECKLIST ---------- */

export const Profiles = {
  byId(userId: string) {
    return supabase.from("profiles").select("*").eq("id", userId).single();
  },

  stats(userId: string) {
    return supabase
      .from("profile_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
  },

  update(
    userId: string,
    changes: Partial<{
      display_name: string;
      bio: string;
      avatar_url: string;
      banner_url: string;
    }>
  ) {
    return supabase.from("profiles").update(changes).eq("id", userId);
  },

  follow(me: string, target: string) {
    return supabase.from("follows").insert({
      follower_id: me,
      followed_id: target,
    });
  },

  unfollow(me: string, target: string) {
    return supabase
      .from("follows")
      .delete()
      .match({ follower_id: me, followed_id: target });
  },

  leaderboard() {
    return supabase
      .from("leaderboard")
      .select("user_id, display_name, avatar_url, score, reflection_count, mirrorback_count")
      .order("score", { ascending: false })
      .limit(10);
  },
};

export const Checklist = {
  items() {
    return supabase
      .from("checklist_items")
      .select("*")
      .order("sort", { ascending: true });
  },

  progress(userId: string) {
    return supabase
      .from("checklist_progress")
      .select("*")
      .eq("user_id", userId);
  },

  setDone(userId: string, key: string) {
    return supabase.from("checklist_progress").upsert({
      user_id: userId,
      item_key: key,
      done: true,
      completed_at: new Date().toISOString(),
    });
  },
};

/* ---------- MIRRORX AI FEATURES ---------- */

export const MirrorXAI = {
  // Get identity graph for user
  async getIdentity(userId: string) {
    try {
      const response = await fetch(`${MIRRORX_ENGINE_URL}/api/mirrorx/identity/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Failed to get identity:", err);
    }
    return null;
  },

  // Get evolution timeline
  async getEvolution(userId: string, limit = 20) {
    try {
      const response = await fetch(`${MIRRORX_ENGINE_URL}/api/mirrorx/evolution/${userId}?limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Failed to get evolution:", err);
    }
    return null;
  },

  // Get bias insights
  async getBiasInsights(userId: string) {
    try {
      const response = await fetch(`${MIRRORX_ENGINE_URL}/api/mirrorx/bias/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Failed to get bias insights:", err);
    }
    return null;
  },

  // Get detected loops
  async getLoops(userId: string, limit = 10) {
    try {
      const response = await fetch(`${MIRRORX_ENGINE_URL}/api/mirrorx/regression/${userId}/loops?limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Failed to get loops:", err);
    }
    return null;
  },
};
