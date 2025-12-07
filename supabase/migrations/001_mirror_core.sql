-- =============================================================================
-- Mirror Virtual Platform - Core Schema
-- =============================================================================

-- Enable UUID support (used by Supabase auth.users and profiles.id)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Reflection visibility: how a reflection is shared
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reflection_visibility') THEN
        CREATE TYPE reflection_visibility AS ENUM ('public', 'circle', 'private');
    END IF;
END$$;

-- Tone classification for reflections & mirrorbacks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reflection_tone') THEN
        CREATE TYPE reflection_tone AS ENUM ('raw', 'processing', 'clear');
    END IF;
END$$;

-- Source of mirrorbacks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mirrorback_source') THEN
        CREATE TYPE mirrorback_source AS ENUM ('ai', 'human');
    END IF;
END$$;

-- Origin of an identity axis
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'axis_origin') THEN
        CREATE TYPE axis_origin AS ENUM ('system_seed', 'llm_suggested', 'user_created');
    END IF;
END$$;

-- Type of interaction / signal for algorithm
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_type') THEN
        CREATE TYPE signal_type AS ENUM ('view', 'respond', 'save', 'skip', 'mute_author');
    END IF;
END$$;

-- Safety severity levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_severity') THEN
        CREATE TYPE safety_severity AS ENUM ('info', 'warning', 'critical');
    END IF;
END$$;

-- Regression types (learning from regression)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regression_type') THEN
        CREATE TYPE regression_type AS ENUM ('loop', 'self_attack', 'judgment_spike', 'avoidance');
    END IF;
END$$;

-- =============================================================================
-- PROFILES (Surface Identity)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio          text,
  avatar_url   text,
  banner_url   text,
  role         text NOT NULL DEFAULT 'Witness'
               CHECK (role IN ('Witness', 'Guide')),
  is_admin     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- A user can insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- A user can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- =============================================================================
-- REFLECTIONS (Core Content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reflections (
  id           bigserial PRIMARY KEY,
  author_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body         text NOT NULL,
  lens_key     text, -- e.g. 'wealth.story', 'self.trust'
  tone         reflection_tone DEFAULT 'raw',
  visibility   reflection_visibility NOT NULL DEFAULT 'public',
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflections_author_id   ON public.reflections(author_id);
CREATE INDEX IF NOT EXISTS idx_reflections_lens_key    ON public.reflections(lens_key);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at  ON public.reflections(created_at);
CREATE INDEX IF NOT EXISTS idx_reflections_visibility  ON public.reflections(visibility);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Read: public reflections + own reflections (any visibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflections'
      AND policyname = 'Read reflections (public or own)'
  ) THEN
    CREATE POLICY "Read reflections (public or own)"
      ON public.reflections
      FOR SELECT
      USING (
        visibility = 'public'
        OR author_id = auth.uid()
      );
  END IF;
END$$;

-- Insert: only as yourself
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflections'
      AND policyname = 'Insert own reflections'
  ) THEN
    CREATE POLICY "Insert own reflections"
      ON public.reflections
      FOR INSERT
      WITH CHECK (author_id = auth.uid());
  END IF;
END$$;

-- Update: only your own reflections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflections'
      AND policyname = 'Update own reflections'
  ) THEN
    CREATE POLICY "Update own reflections"
      ON public.reflections
      FOR UPDATE
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END$$;

-- Delete: only your own reflections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflections'
      AND policyname = 'Delete own reflections'
  ) THEN
    CREATE POLICY "Delete own reflections"
      ON public.reflections
      FOR DELETE
      USING (author_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- MIRRORBACKS (Responses from AI / Humans)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mirrorbacks (
  id             bigserial PRIMARY KEY,
  reflection_id  bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  responder_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body           text NOT NULL,
  tone           reflection_tone DEFAULT 'processing',
  source         mirrorback_source NOT NULL DEFAULT 'ai',
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mirrorbacks_reflection_id ON public.mirrorbacks(reflection_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_responder_id  ON public.mirrorbacks(responder_id);

ALTER TABLE public.mirrorbacks ENABLE ROW LEVEL SECURITY;

-- Read: allowed if user can see the underlying reflection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mirrorbacks'
      AND policyname = 'Read mirrorbacks where reflection visible'
  ) THEN
    CREATE POLICY "Read mirrorbacks where reflection visible"
      ON public.mirrorbacks
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.reflections r
          WHERE r.id = mirrorbacks.reflection_id
            AND (
              r.visibility = 'public'
              OR r.author_id = auth.uid()
            )
        )
      );
  END IF;
END$$;

-- Insert: humans can create their own mirrorbacks (AI uses service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mirrorbacks'
      AND policyname = 'Insert human mirrorbacks'
  ) THEN
    CREATE POLICY "Insert human mirrorbacks"
      ON public.mirrorbacks
      FOR INSERT
      WITH CHECK (responder_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- IDENTITY AXES & VALUES (Mirror Identity Graph)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.identity_axes (
  id           bigserial PRIMARY KEY,
  identity_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_key     text NOT NULL, -- e.g. 'wealth.story'
  origin       axis_origin NOT NULL DEFAULT 'user_created',
  label        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identity_id, axis_key)
);

CREATE INDEX IF NOT EXISTS idx_identity_axes_identity_id ON public.identity_axes(identity_id);

ALTER TABLE public.identity_axes ENABLE ROW LEVEL SECURITY;

-- Only owner can see their axes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axes'
      AND policyname = 'Owner can read axes'
  ) THEN
    CREATE POLICY "Owner can read axes"
      ON public.identity_axes
      FOR SELECT
      USING (identity_id = auth.uid());
  END IF;
END$$;

-- Only owner can insert axes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axes'
      AND policyname = 'Owner can insert axes'
  ) THEN
    CREATE POLICY "Owner can insert axes"
      ON public.identity_axes
      FOR INSERT
      WITH CHECK (identity_id = auth.uid());
  END IF;
END$$;

-- Only owner can update axes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axes'
      AND policyname = 'Owner can update axes'
  ) THEN
    CREATE POLICY "Owner can update axes"
      ON public.identity_axes
      FOR UPDATE
      USING (identity_id = auth.uid())
      WITH CHECK (identity_id = auth.uid());
  END IF;
END$$;

-- Only owner can delete axes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axes'
      AND policyname = 'Owner can delete axes'
  ) THEN
    CREATE POLICY "Owner can delete axes"
      ON public.identity_axes
      FOR DELETE
      USING (identity_id = auth.uid());
  END IF;
END$$;

-- Identity axis values (specific statements, beliefs, etc.)

CREATE TABLE IF NOT EXISTS public.identity_axis_values (
  id                    bigserial PRIMARY KEY,
  axis_id               bigint NOT NULL REFERENCES public.identity_axes(id) ON DELETE CASCADE,
  value                 text NOT NULL,
  confidence            double precision,
  source_reflection_id  bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_axis_values_axis_id ON public.identity_axis_values(axis_id);

ALTER TABLE public.identity_axis_values ENABLE ROW LEVEL SECURITY;

-- Only owner of the axis can see values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axis_values'
      AND policyname = 'Owner can read axis values'
  ) THEN
    CREATE POLICY "Owner can read axis values"
      ON public.identity_axis_values
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.identity_axes a
          WHERE a.id = identity_axis_values.axis_id
            AND a.identity_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Only owner can insert axis values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axis_values'
      AND policyname = 'Owner can insert axis values'
  ) THEN
    CREATE POLICY "Owner can insert axis values"
      ON public.identity_axis_values
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.identity_axes a
          WHERE a.id = axis_id
            AND a.identity_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Only owner can update axis values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_axis_values'
      AND policyname = 'Owner can update axis values'
  ) THEN
    CREATE POLICY "Owner can update axis values"
      ON public.identity_axis_values
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.identity_axes a
          WHERE a.id = axis_id
            AND a.identity_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.identity_axes a
          WHERE a.id = axis_id
            AND a.identity_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Identity snapshots (evolution over time)

CREATE TABLE IF NOT EXISTS public.identity_snapshots (
  id           bigserial PRIMARY KEY,
  identity_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_at  timestamptz NOT NULL DEFAULT now(),
  summary      jsonb NOT NULL -- tensions, themes, loops, etc.
);

CREATE INDEX IF NOT EXISTS idx_identity_snapshots_identity_id ON public.identity_snapshots(identity_id);
CREATE INDEX IF NOT EXISTS idx_identity_snapshots_at         ON public.identity_snapshots(snapshot_at);

ALTER TABLE public.identity_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_snapshots'
      AND policyname = 'Owner can read snapshots'
  ) THEN
    CREATE POLICY "Owner can read snapshots"
      ON public.identity_snapshots
      FOR SELECT
      USING (identity_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'identity_snapshots'
      AND policyname = 'Owner can insert snapshots'
  ) THEN
    CREATE POLICY "Owner can insert snapshots"
      ON public.identity_snapshots
      FOR INSERT
      WITH CHECK (identity_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- SOCIAL GRAPH & SIGNALS
-- =============================================================================

-- Follows (who follows whom)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Everyone can see follow relationships (can tighten later if desired)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'follows'
      AND policyname = 'Users can view follows'
  ) THEN
    CREATE POLICY "Users can view follows"
      ON public.follows
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Users can follow others
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'follows'
      AND policyname = 'Users can follow'
  ) THEN
    CREATE POLICY "Users can follow"
      ON public.follows
      FOR INSERT
      WITH CHECK (follower_id = auth.uid());
  END IF;
END$$;

-- Users can unfollow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'follows'
      AND policyname = 'Users can unfollow'
  ) THEN
    CREATE POLICY "Users can unfollow"
      ON public.follows
      FOR DELETE
      USING (follower_id = auth.uid());
  END IF;
END$$;

-- Reflection signals (algorithm fuel: view, save, skip, etc.)

CREATE TABLE IF NOT EXISTS public.reflection_signals (
  id            bigserial PRIMARY KEY,
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  signal        signal_type NOT NULL,
  value         double precision DEFAULT 1.0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_profile    ON public.reflection_signals(profile_id);
CREATE INDEX IF NOT EXISTS idx_signals_reflection ON public.reflection_signals(reflection_id);
CREATE INDEX IF NOT EXISTS idx_signals_signal     ON public.reflection_signals(signal);

ALTER TABLE public.reflection_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflection_signals'
      AND policyname = 'Users can read their own signals'
  ) THEN
    CREATE POLICY "Users can read their own signals"
      ON public.reflection_signals
      FOR SELECT
      USING (profile_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reflection_signals'
      AND policyname = 'Users can insert their own signals'
  ) THEN
    CREATE POLICY "Users can insert their own signals"
      ON public.reflection_signals
      FOR INSERT
      WITH CHECK (profile_id = auth.uid());
  END IF;
END$$;

-- Feed state (cursor, last refresh, etc.)

CREATE TABLE IF NOT EXISTS public.feed_state (
  profile_id        uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_refreshed_at timestamptz,
  cursor            jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.feed_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feed_state'
      AND policyname = 'Users can read their own feed state'
  ) THEN
    CREATE POLICY "Users can read their own feed state"
      ON public.feed_state
      FOR SELECT
      USING (profile_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feed_state'
      AND policyname = 'Users can upsert their own feed state'
  ) THEN
    CREATE POLICY "Users can upsert their own feed state"
      ON public.feed_state
      FOR INSERT
      WITH CHECK (profile_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feed_state'
      AND policyname = 'Users can update their own feed state'
  ) THEN
    CREATE POLICY "Users can update their own feed state"
      ON public.feed_state
      FOR UPDATE
      USING (profile_id = auth.uid())
      WITH CHECK (profile_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- BIAS INSIGHTS (Bias is studied, not hidden)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bias_insights (
  id              bigserial PRIMARY KEY,
  identity_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  dimension       text NOT NULL,        -- e.g. 'political', 'self-worth', 'religious'
  direction       text NOT NULL,        -- e.g. 'self-blame', 'other-blame', 'absolutist'
  confidence      double precision,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bias_insights_identity   ON public.bias_insights(identity_id);
CREATE INDEX IF NOT EXISTS idx_bias_insights_reflection ON public.bias_insights(reflection_id);

ALTER TABLE public.bias_insights ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bias_insights'
      AND policyname = 'Owner can read their bias insights'
  ) THEN
    CREATE POLICY "Owner can read their bias insights"
      ON public.bias_insights
      FOR SELECT
      USING (identity_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bias_insights'
      AND policyname = 'Owner can insert their bias insights'
  ) THEN
    CREATE POLICY "Owner can insert their bias insights"
      ON public.bias_insights
      FOR INSERT
      WITH CHECK (identity_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- SAFETY EVENTS (Safety is paramount)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.safety_events (
  id              bigserial PRIMARY KEY,
  identity_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  category        text NOT NULL,        -- e.g. 'self-harm', 'harassment', 'hate', 'crisis'
  severity        safety_severity NOT NULL DEFAULT 'warning',
  action_taken    text,                 -- e.g. 'soft_block', 'hidden', 'escalated'
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_identity   ON public.safety_events(identity_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_reflection ON public.safety_events(reflection_id);

ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;

-- For now, regular users do not directly view safety events (service role only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'safety_events'
      AND policyname = 'Users cannot directly see safety events'
  ) THEN
    CREATE POLICY "Users cannot directly see safety events"
      ON public.safety_events
      FOR SELECT
      USING (false);
  END IF;
END$$;

-- =============================================================================
-- REGRESSION MARKERS (Regression as learning signal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.regression_markers (
  id              bigserial PRIMARY KEY,
  identity_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  kind            regression_type NOT NULL,
  description     text,
  severity        integer DEFAULT 1, -- 1..5
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regression_identity   ON public.regression_markers(identity_id);
CREATE INDEX IF NOT EXISTS idx_regression_reflection ON public.regression_markers(reflection_id);

ALTER TABLE public.regression_markers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'regression_markers'
      AND policyname = 'Owner can read their regression markers'
  ) THEN
    CREATE POLICY "Owner can read their regression markers"
      ON public.regression_markers
      FOR SELECT
      USING (identity_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'regression_markers'
      AND policyname = 'Owner can insert their regression markers'
  ) THEN
    CREATE POLICY "Owner can insert their regression markers"
      ON public.regression_markers
      FOR INSERT
      WITH CHECK (identity_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- END OF MIRROR CORE SCHEMA
-- =============================================================================
