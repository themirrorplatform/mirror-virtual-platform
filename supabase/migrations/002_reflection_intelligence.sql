-- ════════════════════════════════════════════════════════════════════════════
-- THE MIRROR VIRTUAL PLATFORM - REFLECTION INTELLIGENCE LAYER
-- ════════════════════════════════════════════════════════════════════════════
-- These tables turn AI from a content generator into a reflective intelligence.
-- Every bias, safety event, and regression pattern is logged, studied, and
-- fed back into the platform's understanding of how people think.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. BIAS INSIGHTS (Bias is studied, not hidden)
-- ────────────────────────────────────────────────────────────────────────────
-- Purpose: MirrorX detects patterns in how someone thinks (not just what they say)
-- and logs them here. Later, users can explore: "Here's where your thinking leans."

CREATE TABLE IF NOT EXISTS public.bias_insights (
  id              bigserial PRIMARY KEY,
  identity_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  dimension       text NOT NULL,         -- e.g. 'political', 'self-worth', 'religious', 'control'
  direction       text NOT NULL,         -- e.g. 'self-blame', 'other-blame', 'absolutist', 'avoidant'
  confidence      double precision,      -- 0.0 to 1.0: how certain MirrorX is
  notes           text,                  -- human-readable explanation
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bias_insights_identity ON public.bias_insights(identity_id);
CREATE INDEX IF NOT EXISTS idx_bias_insights_reflection ON public.bias_insights(reflection_id);
CREATE INDEX IF NOT EXISTS idx_bias_insights_dimension ON public.bias_insights(dimension);

ALTER TABLE public.bias_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read their bias insights"
  ON public.bias_insights
  FOR SELECT
  USING (identity_id = auth.uid());

CREATE POLICY "Owner can insert their bias insights"
  ON public.bias_insights
  FOR INSERT
  WITH CHECK (identity_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- 2. SAFETY EVENTS (Safety is paramount)
-- ────────────────────────────────────────────────────────────────────────────
-- Purpose: Every safety-relevant decision is logged. Nothing is silent.
-- You can audit the platform's behavior against your philosophy.

CREATE TYPE safety_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE IF NOT EXISTS public.safety_events (
  id              bigserial PRIMARY KEY,
  identity_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  category        text NOT NULL,         -- e.g. 'self-harm', 'harassment', 'hate', 'crisis'
  severity        safety_severity NOT NULL DEFAULT 'warning',
  action_taken    text,                  -- e.g. 'soft_block', 'hidden', 'escalated', 'resource_offered'
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_identity ON public.safety_events(identity_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_reflection ON public.safety_events(reflection_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_severity ON public.safety_events(severity);
CREATE INDEX IF NOT EXISTS idx_safety_events_category ON public.safety_events(category);

ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;

-- Founder can see via service role; users don't need direct access
CREATE POLICY "Users cannot directly see safety events"
  ON public.safety_events
  FOR SELECT
  USING (false);

-- Service role (backend) can insert
-- No user INSERT policy - only backend via service role

-- ────────────────────────────────────────────────────────────────────────────
-- 3. REGRESSION MARKERS (Regression is data, not failure)
-- ────────────────────────────────────────────────────────────────────────────
-- Purpose: Track when someone loops, self-attacks, or spikes in judgment.
-- Later: "Here's where you tend to regress — want to understand this pattern?"

CREATE TYPE regression_type AS ENUM ('loop', 'self_attack', 'judgment_spike', 'avoidance');

CREATE TABLE IF NOT EXISTS public.regression_markers (
  id              bigserial PRIMARY KEY,
  identity_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE SET NULL,
  kind            regression_type NOT NULL,
  description     text,              -- short human-readable explanation
  severity        integer DEFAULT 1, -- 1..5: how significant the regression is
  pattern_id      text,              -- optional: link to recurring pattern
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regression_identity ON public.regression_markers(identity_id);
CREATE INDEX IF NOT EXISTS idx_regression_reflection ON public.regression_markers(reflection_id);
CREATE INDEX IF NOT EXISTS idx_regression_kind ON public.regression_markers(kind);
CREATE INDEX IF NOT EXISTS idx_regression_pattern ON public.regression_markers(pattern_id);

ALTER TABLE public.regression_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read their regression markers"
  ON public.regression_markers
  FOR SELECT
  USING (identity_id = auth.uid());

CREATE POLICY "Owner can insert their regression markers"
  ON public.regression_markers
  FOR INSERT
  WITH CHECK (identity_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- REFLECTION INTELLIGENCE LAYER COMPLETE
--
-- What this enables:
-- 1. Bias awareness without judgment
-- 2. Safety as auditable, transparent process
-- 3. Regression as curriculum, not failure
--
-- Together with the core schema, this is a platform that treats
-- self-understanding as the product, not engagement.
-- ════════════════════════════════════════════════════════════════════════════
