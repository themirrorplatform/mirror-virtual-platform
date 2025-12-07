-- ════════════════════════════════════════════════════════════════════════════
-- THE MIRROR VIRTUAL PLATFORM - DATABASE BRAIN
-- ════════════════════════════════════════════════════════════════════════════
-- This schema is the foundation of a social platform built on reflection,
-- not engagement. Every table serves the goal: help people understand how
-- they think, not just what they think.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES (Identity)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,
  display_name    text,
  bio             text,
  avatar_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. REFLECTIONS (Core Content)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE reflection_visibility AS ENUM ('public', 'private', 'unlisted');

CREATE TABLE IF NOT EXISTS public.reflections (
  id              bigserial PRIMARY KEY,
  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            text NOT NULL,
  lens_key        text,                    -- e.g. 'wealth', 'mind', 'belief', 'ai', 'life', 'heart'
  visibility      reflection_visibility NOT NULL DEFAULT 'public',
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflections_author ON public.reflections(author_id);
CREATE INDEX IF NOT EXISTS idx_reflections_lens ON public.reflections(lens_key);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON public.reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_visibility ON public.reflections(visibility);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reflections are viewable by everyone"
  ON public.reflections
  FOR SELECT
  USING (
    visibility = 'public'
    OR author_id = auth.uid()
  );

CREATE POLICY "Users can create their own reflections"
  ON public.reflections
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own reflections"
  ON public.reflections
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own reflections"
  ON public.reflections
  FOR DELETE
  USING (auth.uid() = author_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. MIRRORBACKS (AI Reflections)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mirrorbacks (
  id              bigserial PRIMARY KEY,
  reflection_id   bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body            text NOT NULL,
  tone            text,                    -- e.g. 'compassionate', 'curious', 'challenging'
  tensions        text[],                  -- detected tensions/conflicts
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mirrorbacks_reflection ON public.mirrorbacks(reflection_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_author ON public.mirrorbacks(author_id);

ALTER TABLE public.mirrorbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mirrorbacks for reflections they can see"
  ON public.mirrorbacks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reflections r
      WHERE r.id = reflection_id
      AND (r.visibility = 'public' OR r.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create mirrorbacks for their own reflections"
  ON public.mirrorbacks
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. IDENTITY AXES (Self-Understanding Map)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.identity_axes (
  id              bigserial PRIMARY KEY,
  identity_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lens_key        text NOT NULL,           -- matches reflection lens_key
  dimension       text NOT NULL,           -- e.g. 'self-worth', 'control', 'belonging'
  value           double precision,        -- -1.0 to 1.0 or other scale
  confidence      double precision,        -- 0.0 to 1.0
  notes           text,
  last_updated    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_axes_identity ON public.identity_axes(identity_id);
CREATE INDEX IF NOT EXISTS idx_identity_axes_lens ON public.identity_axes(lens_key);

ALTER TABLE public.identity_axes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own identity axes"
  ON public.identity_axes
  FOR SELECT
  USING (identity_id = auth.uid());

CREATE POLICY "Users can insert their own identity axes"
  ON public.identity_axes
  FOR INSERT
  WITH CHECK (identity_id = auth.uid());

CREATE POLICY "Users can update their own identity axes"
  ON public.identity_axes
  FOR UPDATE
  USING (identity_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- 5. REFLECTION SIGNALS (Engagement as Learning Data)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE signal_type AS ENUM ('resonated', 'challenged', 'skipped', 'saved', 'judgment_spike');

CREATE TABLE IF NOT EXISTS public.reflection_signals (
  id              bigserial PRIMARY KEY,
  reflection_id   bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal          signal_type NOT NULL,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reflection_id, user_id, signal)
);

CREATE INDEX IF NOT EXISTS idx_signals_reflection ON public.reflection_signals(reflection_id);
CREATE INDEX IF NOT EXISTS idx_signals_user ON public.reflection_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON public.reflection_signals(signal);

ALTER TABLE public.reflection_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals on public reflections"
  ON public.reflection_signals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reflections r
      WHERE r.id = reflection_id
      AND (r.visibility = 'public' OR r.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own signals"
  ON public.reflection_signals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signals"
  ON public.reflection_signals
  FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. FOLLOWS (Connection Graph)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
  ON public.follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own follows"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. FEED STATE (Personalized Algorithm State)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_state (
  user_id         uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_id    bigint,
  preferences     jsonb DEFAULT '{}'::jsonb,    -- user feed preferences
  algorithm_state jsonb DEFAULT '{}'::jsonb,    -- MirrorX learning state
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feed state"
  ON public.feed_state
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feed state"
  ON public.feed_state
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feed state"
  ON public.feed_state
  FOR UPDATE
  USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- CORE SCHEMA COMPLETE
-- Next: Add reflection-focused tables (bias, safety, regression)
-- ════════════════════════════════════════════════════════════════════════════
