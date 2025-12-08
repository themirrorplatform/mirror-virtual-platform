-- ============================================================================
-- MIRROR OS COMPATIBILITY LAYER
-- Migration 010: Adds missing Mirror OS tables to existing platform
-- ============================================================================
-- This migration adds Mirror OS components that are missing from the current
-- platform schema. Run this AFTER migrations 001-009.
-- ============================================================================

-- ============================================================================
-- MISSING ENUM TYPES
-- ============================================================================

-- Connection types for relationships
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_type') THEN
    CREATE TYPE connection_type AS ENUM ('witness', 'weaver', 'guide', 'reciprocal');
  END IF;
END$$;

-- Reaction types for engagement signals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_type') THEN
    CREATE TYPE reaction_type AS ENUM ('resonate', 'seen', 'bookmark', 'support');
  END IF;
END$$;

-- Target types for reactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_type') THEN
    CREATE TYPE target_type AS ENUM ('reflection', 'mirrorback');
  END IF;
END$$;

-- Tension classification types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tension_type') THEN
    CREATE TYPE tension_type AS ENUM ('direct_conflict', 'ambivalence', 'value_vs_action', 'goal_vs_belief', 'user_marked');
  END IF;
END$$;

-- Regression detection types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regression_type') THEN
    CREATE TYPE regression_type AS ENUM ('loop', 'self_attack', 'judgment_spike', 'avoidance');
  END IF;
END$$;

-- Link types for external imports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'link_type') THEN
    CREATE TYPE link_type AS ENUM ('imported_as', 'inspired', 'quoted');
  END IF;
END$$;

-- ============================================================================
-- LAYER 1: IDENTITIES (Multi-self system)
-- ============================================================================

-- Multiple "selves" per user (optional - for future use)
CREATE TABLE IF NOT EXISTS public.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'primary', 'work', 'creative', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, label)
);

CREATE INDEX IF NOT EXISTS idx_identities_profile ON public.identities(profile_id);
CREATE INDEX IF NOT EXISTS idx_identities_active ON public.identities(is_active) WHERE is_active = true;

ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identities"
  ON public.identities FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own identities"
  ON public.identities FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own identities"
  ON public.identities FOR UPDATE
  USING (profile_id = auth.uid());

-- Add identity_id column to reflections (optional, nullable for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reflections'
      AND column_name = 'identity_id'
  ) THEN
    ALTER TABLE public.reflections
    ADD COLUMN identity_id UUID REFERENCES public.identities(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_reflections_identity_id ON public.reflections(identity_id);
  END IF;
END$$;

-- ============================================================================
-- LAYER 2: THREAD REFLECTIONS (Join table for threading)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.thread_reflections (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  reflection_id BIGINT NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, reflection_id),
  UNIQUE(thread_id, position)
);

CREATE INDEX IF NOT EXISTS idx_thread_reflections_thread ON public.thread_reflections(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_reflections_reflection ON public.thread_reflections(reflection_id);
CREATE INDEX IF NOT EXISTS idx_thread_reflections_position ON public.thread_reflections(thread_id, position);

ALTER TABLE public.thread_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view thread_reflections for own threads"
  ON public.thread_reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.threads t
      WHERE t.id = thread_reflections.thread_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage thread_reflections for own threads"
  ON public.thread_reflections FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.threads t
      WHERE t.id = thread_reflections.thread_id
        AND t.user_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 3: CONNECTIONS (Relationship graph, not follows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connections (
  id BIGSERIAL PRIMARY KEY,
  from_identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  to_identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  connection_type connection_type NOT NULL DEFAULT 'witness',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_identity_id, to_identity_id),
  CHECK (from_identity_id != to_identity_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_from ON public.connections(from_identity_id);
CREATE INDEX IF NOT EXISTS idx_connections_to ON public.connections(to_identity_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON public.connections(connection_type);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = connections.from_identity_id
        AND i.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = connections.to_identity_id
        AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage outgoing connections"
  ON public.connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = connections.from_identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 4: REACTION EVENTS (Fine-grained engagement signals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reaction_events (
  id BIGSERIAL PRIMARY KEY,
  actor_identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  target_type target_type NOT NULL,
  target_id BIGINT NOT NULL,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_identity_id, target_type, target_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_actor ON public.reaction_events(actor_identity_id);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON public.reaction_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.reaction_events(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_created ON public.reaction_events(created_at DESC);

ALTER TABLE public.reaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reactions"
  ON public.reaction_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = reaction_events.actor_identity_id
        AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reactions"
  ON public.reaction_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = reaction_events.actor_identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 5: SELF CLAIMS (Extracted identity statements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.self_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  reflection_id BIGINT NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  axis_id UUID REFERENCES public.identity_axes(id) ON DELETE SET NULL,

  claim_key TEXT NOT NULL, -- Matches axis_key or new
  claim_value TEXT NOT NULL,
  stance TEXT NOT NULL CHECK (stance IN ('affirmation', 'denial', 'question', 'ambivalent')),
  polarity_raw NUMERIC, -- -1 to +1
  polarity_bucket SMALLINT CHECK (polarity_bucket BETWEEN -2 AND 2),
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_self_claims_identity ON public.self_claims(identity_id);
CREATE INDEX IF NOT EXISTS idx_self_claims_reflection ON public.self_claims(reflection_id);
CREATE INDEX IF NOT EXISTS idx_self_claims_axis ON public.self_claims(axis_id);
CREATE INDEX IF NOT EXISTS idx_self_claims_key ON public.self_claims(claim_key);
CREATE INDEX IF NOT EXISTS idx_self_claims_stance ON public.self_claims(stance);

ALTER TABLE public.self_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own self claims"
  ON public.self_claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = self_claims.identity_id
        AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can insert self claims"
  ON public.self_claims FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = self_claims.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 6: TENSIONS (Preserved contradictions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,

  claim_a UUID NOT NULL REFERENCES public.self_claims(id) ON DELETE CASCADE,
  claim_b UUID NOT NULL REFERENCES public.self_claims(id) ON DELETE CASCADE,

  tension_type tension_type NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  user_override TEXT, -- 'rejected', 'confirmed', 'retyped'
  user_importance INTEGER CHECK (user_importance BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CHECK (claim_a != claim_b)
);

CREATE INDEX IF NOT EXISTS idx_tensions_identity ON public.tensions(identity_id);
CREATE INDEX IF NOT EXISTS idx_tensions_claim_a ON public.tensions(claim_a);
CREATE INDEX IF NOT EXISTS idx_tensions_claim_b ON public.tensions(claim_b);
CREATE INDEX IF NOT EXISTS idx_tensions_type ON public.tensions(tension_type);
CREATE INDEX IF NOT EXISTS idx_tensions_resolved ON public.tensions(is_resolved) WHERE is_resolved = false;

ALTER TABLE public.tensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tensions"
  ON public.tensions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = tensions.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 7: TENSION FEEDBACK (User corrections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tension_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tension_id UUID NOT NULL REFERENCES public.tensions(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,

  user_judgment TEXT NOT NULL CHECK (user_judgment IN ('not_tension', 'true_tension', 'more_like_X')),
  user_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tension_feedback_tension ON public.tension_feedback(tension_id);
CREATE INDEX IF NOT EXISTS idx_tension_feedback_identity ON public.tension_feedback(identity_id);

ALTER TABLE public.tension_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tension feedback"
  ON public.tension_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = tension_feedback.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 8: IDENTITY SIGNALS (Pattern detection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.identity_signals (
  id BIGSERIAL PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,

  signal_key TEXT NOT NULL, -- 'avoids_money_topics', 'returns_to_past_failure'
  description TEXT,
  evidence_reflection_ids BIGINT[], -- Array of reflection IDs
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_signals_identity ON public.identity_signals(identity_id);
CREATE INDEX IF NOT EXISTS idx_identity_signals_key ON public.identity_signals(signal_key);
CREATE INDEX IF NOT EXISTS idx_identity_signals_confidence ON public.identity_signals(confidence DESC);

ALTER TABLE public.identity_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identity signals"
  ON public.identity_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = identity_signals.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 9: EXTERNAL DATA SOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,

  provider TEXT NOT NULL, -- 'instagram', 'twitter', 'files', 'notes', 'email'
  label TEXT, -- User-given name: "Old journal", "Main IG account"
  auth_details JSONB, -- Encrypted tokens, OAuth details

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_external_sources_identity ON public.external_sources(identity_id);
CREATE INDEX IF NOT EXISTS idx_external_sources_provider ON public.external_sources(provider);

ALTER TABLE public.external_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own external sources"
  ON public.external_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = external_sources.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 10: EXTERNAL ARTIFACTS (Imported data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.external_sources(id) ON DELETE CASCADE,

  artifact_type TEXT NOT NULL, -- 'post', 'comment', 'message', 'file', 'highlight'
  raw_content JSONB NOT NULL, -- Original data snapshot
  normalized_text TEXT, -- Clean text for AI processing

  original_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_artifacts_source ON public.external_artifacts(source_id);
CREATE INDEX IF NOT EXISTS idx_external_artifacts_type ON public.external_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_external_artifacts_original_created ON public.external_artifacts(original_created_at);

ALTER TABLE public.external_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own external artifacts"
  ON public.external_artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.external_sources s
      JOIN public.identities i ON i.id = s.identity_id
      WHERE s.id = external_artifacts.source_id
        AND i.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 11: EXTERNAL TO REFLECTIONS LINKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_to_reflections (
  id BIGSERIAL PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES public.external_artifacts(id) ON DELETE CASCADE,
  reflection_id BIGINT NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  link_type link_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artifact_id, reflection_id)
);

CREATE INDEX IF NOT EXISTS idx_external_to_reflections_artifact ON public.external_to_reflections(artifact_id);
CREATE INDEX IF NOT EXISTS idx_external_to_reflections_reflection ON public.external_to_reflections(reflection_id);

ALTER TABLE public.external_to_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own external links"
  ON public.external_to_reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reflections r
      WHERE r.id = external_to_reflections.reflection_id
        AND r.author_id = auth.uid()
    )
  );

-- ============================================================================
-- LAYER 12: DATA SOVEREIGNTY
-- ============================================================================

-- Global data policies
CREATE TABLE IF NOT EXISTS public.data_policies (
  id SERIAL PRIMARY KEY,
  policy_key TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  enforced_in_code BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert foundational policies
INSERT INTO public.data_policies (policy_key, description, enforced_in_code) VALUES
  ('no_third_party_analytics', 'System never sends user data to external analytics platforms', true),
  ('no_ad_profiles', 'System never builds advertising profiles or sells data', true),
  ('no_cross_identity_training', 'AI never trains across identities without explicit consent', true),
  ('data_serves_reflection', 'All data exists only to deepen reflection, not extract value', true)
ON CONFLICT (policy_key) DO NOTHING;

-- Per-identity data settings
CREATE TABLE IF NOT EXISTS public.identity_data_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID UNIQUE NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,

  allow_ai_training BOOLEAN DEFAULT true, -- Within Mirror only
  allow_aggregate_metrics BOOLEAN DEFAULT true, -- For system evolution
  share_anonymized_to_commons BOOLEAN DEFAULT false, -- For research

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_data_settings_identity ON public.identity_data_settings(identity_id);

ALTER TABLE public.identity_data_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data settings"
  ON public.identity_data_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.identities i
      WHERE i.id = identity_data_settings.identity_id
        AND i.profile_id = auth.uid()
    )
  );

-- Data events audit log
CREATE TABLE IF NOT EXISTS public.data_events (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL, -- 'system', 'user', 'admin'
  event_type TEXT NOT NULL, -- 'reflection_created', 'external_imported', 'ai_analysis_run'
  subject_type TEXT, -- 'reflection', 'identity', 'external_artifact'
  subject_id TEXT, -- UUID or BIGINT as text
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_events_actor ON public.data_events(actor);
CREATE INDEX IF NOT EXISTS idx_data_events_type ON public.data_events(event_type);
CREATE INDEX IF NOT EXISTS idx_data_events_subject ON public.data_events(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_data_events_created ON public.data_events(created_at DESC);

ALTER TABLE public.data_events ENABLE ROW LEVEL SECURITY;

-- Data events visible to system only
CREATE POLICY "Users cannot directly view data events"
  ON public.data_events FOR SELECT
  USING (false);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-create primary identity on profile creation
CREATE OR REPLACE FUNCTION create_primary_identity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.identities (profile_id, label, is_active)
  VALUES (NEW.id, 'primary', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_primary_identity();

-- Auto-create data settings on identity creation
CREATE OR REPLACE FUNCTION create_identity_data_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.identity_data_settings (identity_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_identity_created ON public.identities;
CREATE TRIGGER on_identity_created
  AFTER INSERT ON public.identities
  FOR EACH ROW EXECUTE FUNCTION create_identity_data_settings();

-- Log data events on reflection creation
CREATE OR REPLACE FUNCTION log_reflection_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.data_events (actor, event_type, subject_type, subject_id, metadata)
  VALUES (
    'user',
    'reflection_created',
    'reflection',
    NEW.id::TEXT,
    jsonb_build_object(
      'author_id', NEW.author_id,
      'visibility', NEW.visibility,
      'lens_key', NEW.lens_key
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reflection_created ON public.reflections;
CREATE TRIGGER on_reflection_created
  AFTER INSERT ON public.reflections
  FOR EACH ROW EXECUTE FUNCTION log_reflection_created();

-- Auto-update updated_at for identity_signals
CREATE TRIGGER update_identity_signals_updated_at
  BEFORE UPDATE ON public.identity_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPATIBILITY NOTES
-- ============================================================================

COMMENT ON TABLE public.identities IS 'Multi-self system - allows users to have different identity contexts';
COMMENT ON TABLE public.thread_reflections IS 'Join table linking reflections to threads with position ordering';
COMMENT ON TABLE public.connections IS 'Identity-based relationships (not follower model)';
COMMENT ON TABLE public.reaction_events IS 'Fine-grained engagement signals for feed algorithm';
COMMENT ON TABLE public.self_claims IS 'Extracted identity statements from reflections';
COMMENT ON TABLE public.tensions IS 'Preserved contradictions between self-claims';
COMMENT ON TABLE public.tension_feedback IS 'User corrections on detected tensions';
COMMENT ON TABLE public.identity_signals IS 'AI-detected patterns in behavior/thinking';
COMMENT ON TABLE public.external_sources IS 'Configuration for external data imports';
COMMENT ON TABLE public.external_artifacts IS 'Imported data from external platforms';
COMMENT ON TABLE public.external_to_reflections IS 'Links imported data to created reflections';
COMMENT ON TABLE public.identity_data_settings IS 'Per-identity privacy and data sharing preferences';
COMMENT ON TABLE public.data_events IS 'Audit log for all data operations';
COMMENT ON TABLE public.data_policies IS 'Platform-wide data governance policies';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
