-- =============================================================================
-- Mirror Virtual Platform - Social Features Extension
-- =============================================================================
-- This migration adds social media features from the Discussion Hub
-- to the Mirror Core schema, creating a unified platform with MirrorX AI
-- =============================================================================

-- =============================================================================
-- ENUM TYPES FOR SOCIAL FEATURES
-- =============================================================================

-- Reaction types for reflections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_kind') THEN
        CREATE TYPE reaction_kind AS ENUM ('reflect', 'appreciate', 'challenge', 'save');
    END IF;
END$$;

-- Wishlist status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wishlist_status') THEN
        CREATE TYPE wishlist_status AS ENUM ('pending', 'planned', 'in_progress', 'completed', 'rejected');
    END IF;
END$$;

-- =============================================================================
-- REACTIONS (Social Engagement)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reactions (
  id            bigserial PRIMARY KEY,
  reflection_id bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind          reaction_kind NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reflection_id, user_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_reactions_reflection ON public.reactions(reflection_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user       ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_kind       ON public.reactions(kind);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Anyone can view reactions'
  ) THEN
    CREATE POLICY "Anyone can view reactions"
      ON public.reactions
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Users can add their own reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Users can add reactions'
  ) THEN
    CREATE POLICY "Users can add reactions"
      ON public.reactions
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- Users can delete their own reactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reactions'
      AND policyname = 'Users can delete their reactions'
  ) THEN
    CREATE POLICY "Users can delete their reactions"
      ON public.reactions
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- WISHLISTS (Feature Requests / Community Voting)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id          bigserial PRIMARY KEY,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      wishlist_status NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_author ON public.wishlists(author_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON public.wishlists(status);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Anyone can read wishlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlists'
      AND policyname = 'Anyone can view wishlists'
  ) THEN
    CREATE POLICY "Anyone can view wishlists"
      ON public.wishlists
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Users can create wishlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlists'
      AND policyname = 'Users can create wishlists'
  ) THEN
    CREATE POLICY "Users can create wishlists"
      ON public.wishlists
      FOR INSERT
      WITH CHECK (author_id = auth.uid());
  END IF;
END$$;

-- Users can update their own wishlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlists'
      AND policyname = 'Users can update their wishlists'
  ) THEN
    CREATE POLICY "Users can update their wishlists"
      ON public.wishlists
      FOR UPDATE
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END$$;

-- Admins can update any wishlist status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlists'
      AND policyname = 'Admins can update wishlist status'
  ) THEN
    CREATE POLICY "Admins can update wishlist status"
      ON public.wishlists
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END$$;

-- Users can delete their own wishlists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlists'
      AND policyname = 'Users can delete their wishlists'
  ) THEN
    CREATE POLICY "Users can delete their wishlists"
      ON public.wishlists
      FOR DELETE
      USING (author_id = auth.uid());
  END IF;
END$$;

-- Wishlist votes

CREATE TABLE IF NOT EXISTS public.wishlist_votes (
  wishlist_id bigint NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_votes_wishlist ON public.wishlist_votes(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_votes_user     ON public.wishlist_votes(user_id);

ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlist_votes'
      AND policyname = 'Anyone can view votes'
  ) THEN
    CREATE POLICY "Anyone can view votes"
      ON public.wishlist_votes
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Users can vote
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlist_votes'
      AND policyname = 'Users can vote'
  ) THEN
    CREATE POLICY "Users can vote"
      ON public.wishlist_votes
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- Users can unvote
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wishlist_votes'
      AND policyname = 'Users can unvote'
  ) THEN
    CREATE POLICY "Users can unvote"
      ON public.wishlist_votes
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- EVENTS (Community Gatherings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  description text,
  starts_at   timestamptz NOT NULL,
  timezone    text NOT NULL DEFAULT 'UTC',
  join_url    text,
  banner_url  text,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at  ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Anyone can view events'
  ) THEN
    CREATE POLICY "Anyone can view events"
      ON public.events
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Admins can create events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Admins can create events'
  ) THEN
    CREATE POLICY "Admins can create events"
      ON public.events
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END$$;

-- Admins can update events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Admins can update events'
  ) THEN
    CREATE POLICY "Admins can update events"
      ON public.events
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END$$;

-- Event RSVPs

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id   bigint NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user  ON public.event_rsvps(user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can view RSVPs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_rsvps'
      AND policyname = 'Anyone can view RSVPs'
  ) THEN
    CREATE POLICY "Anyone can view RSVPs"
      ON public.event_rsvps
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Users can RSVP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_rsvps'
      AND policyname = 'Users can RSVP'
  ) THEN
    CREATE POLICY "Users can RSVP"
      ON public.event_rsvps
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- Users can un-RSVP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_rsvps'
      AND policyname = 'Users can un-RSVP'
  ) THEN
    CREATE POLICY "Users can un-RSVP"
      ON public.event_rsvps
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- POINTS (Gamification System)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.points (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta      integer NOT NULL,
  reason     text NOT NULL,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_user       ON public.points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON public.points(created_at);

ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'points'
      AND policyname = 'Users can view their points'
  ) THEN
    CREATE POLICY "Users can view their points"
      ON public.points
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Service role inserts points (not users directly)
-- Points are awarded by backend logic

-- =============================================================================
-- CHECKLIST (Onboarding System)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.checklist_items (
  item_key text PRIMARY KEY,
  label    text NOT NULL,
  sort     integer NOT NULL DEFAULT 0,
  points   integer NOT NULL DEFAULT 0
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view checklist items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checklist_items'
      AND policyname = 'Anyone can view checklist items'
  ) THEN
    CREATE POLICY "Anyone can view checklist items"
      ON public.checklist_items
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Checklist progress

CREATE TABLE IF NOT EXISTS public.checklist_progress (
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_key     text NOT NULL REFERENCES public.checklist_items(item_key) ON DELETE CASCADE,
  done         boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_user ON public.checklist_progress(user_id);

ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checklist_progress'
      AND policyname = 'Users can view their progress'
  ) THEN
    CREATE POLICY "Users can view their progress"
      ON public.checklist_progress
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Users can update their own progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checklist_progress'
      AND policyname = 'Users can update their progress'
  ) THEN
    CREATE POLICY "Users can update their progress"
      ON public.checklist_progress
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checklist_progress'
      AND policyname = 'Users can modify their progress'
  ) THEN
    CREATE POLICY "Users can modify their progress"
      ON public.checklist_progress
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- VIEWS FOR AGGREGATED DATA
-- =============================================================================

-- Profile stats (reflection count, mirrorback count, points)
CREATE OR REPLACE VIEW public.profile_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT r.id) AS reflection_count,
  COUNT(DISTINCT m.id) AS mirrorback_count,
  COALESCE(SUM(pt.delta), 0) AS total_points,
  COUNT(DISTINCT f.followed_id) AS following_count,
  COUNT(DISTINCT f2.follower_id) AS follower_count
FROM public.profiles p
LEFT JOIN public.reflections r ON r.author_id = p.id
LEFT JOIN public.mirrorbacks m ON m.responder_id = p.id
LEFT JOIN public.points pt ON pt.user_id = p.id
LEFT JOIN public.follows f ON f.follower_id = p.id
LEFT JOIN public.follows f2 ON f2.followed_id = p.id
GROUP BY p.id;

-- Leaderboard (top users by points)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  ps.total_points AS score,
  ps.reflection_count,
  ps.mirrorback_count
FROM public.profiles p
JOIN public.profile_stats ps ON ps.user_id = p.id
ORDER BY ps.total_points DESC;

-- =============================================================================
-- SEED DATA FOR CHECKLIST
-- =============================================================================

INSERT INTO public.checklist_items (item_key, label, sort, points)
VALUES
  ('complete_profile', 'Complete your profile', 1, 10),
  ('first_reflection', 'Share your first reflection', 2, 25),
  ('first_mirrorback', 'Give your first mirrorback', 3, 15),
  ('follow_user', 'Follow another user', 4, 5),
  ('react_reflection', 'React to a reflection', 5, 5),
  ('create_wishlist', 'Create a wishlist item', 6, 10)
ON CONFLICT (item_key) DO NOTHING;

-- =============================================================================
-- FUNCTIONS FOR REACTION COUNTS
-- =============================================================================

-- Get reaction counts for a reflection
CREATE OR REPLACE FUNCTION get_reaction_counts(reflection_id_param bigint)
RETURNS TABLE (
  reflect_count bigint,
  appreciate_count bigint,
  challenge_count bigint,
  save_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE kind = 'reflect') AS reflect_count,
    COUNT(*) FILTER (WHERE kind = 'appreciate') AS appreciate_count,
    COUNT(*) FILTER (WHERE kind = 'challenge') AS challenge_count,
    COUNT(*) FILTER (WHERE kind = 'save') AS save_count
  FROM public.reactions
  WHERE reflection_id = reflection_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS FOR AUTO-AWARDING POINTS
-- =============================================================================

-- Award points when user creates a reflection
CREATE OR REPLACE FUNCTION award_reflection_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.points (user_id, delta, reason, metadata)
  VALUES (NEW.author_id, 5, 'reflection', jsonb_build_object('reflection_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_award_reflection_points'
  ) THEN
    CREATE TRIGGER trigger_award_reflection_points
      AFTER INSERT ON public.reflections
      FOR EACH ROW
      EXECUTE FUNCTION award_reflection_points();
  END IF;
END$$;

-- Award points when user creates a mirrorback (human only)
CREATE OR REPLACE FUNCTION award_mirrorback_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source = 'human' AND NEW.responder_id IS NOT NULL THEN
    INSERT INTO public.points (user_id, delta, reason, metadata)
    VALUES (NEW.responder_id, 2, 'mirrorback', jsonb_build_object('mirrorback_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_award_mirrorback_points'
  ) THEN
    CREATE TRIGGER trigger_award_mirrorback_points
      AFTER INSERT ON public.mirrorbacks
      FOR EACH ROW
      EXECUTE FUNCTION award_mirrorback_points();
  END IF;
END$$;

-- Award points when user creates a wishlist
CREATE OR REPLACE FUNCTION award_wishlist_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.points (user_id, delta, reason, metadata)
  VALUES (NEW.author_id, 3, 'wishlist', jsonb_build_object('wishlist_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_award_wishlist_points'
  ) THEN
    CREATE TRIGGER trigger_award_wishlist_points
      AFTER INSERT ON public.wishlists
      FOR EACH ROW
      EXECUTE FUNCTION award_wishlist_points();
  END IF;
END$$;

-- Award points when checklist item is completed
CREATE OR REPLACE FUNCTION award_checklist_points()
RETURNS TRIGGER AS $$
DECLARE
  item_points integer;
BEGIN
  IF NEW.done = true AND (OLD.done IS NULL OR OLD.done = false) THEN
    SELECT points INTO item_points
    FROM public.checklist_items
    WHERE item_key = NEW.item_key;
    
    IF item_points > 0 THEN
      INSERT INTO public.points (user_id, delta, reason, metadata)
      VALUES (NEW.user_id, item_points, 'checklist', jsonb_build_object('item_key', NEW.item_key));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_award_checklist_points'
  ) THEN
    CREATE TRIGGER trigger_award_checklist_points
      AFTER INSERT OR UPDATE ON public.checklist_progress
      FOR EACH ROW
      EXECUTE FUNCTION award_checklist_points();
  END IF;
END$$;

-- =============================================================================
-- END OF SOCIAL FEATURES SCHEMA
-- =============================================================================
