-- ════════════════════════════════════════════════════════════════════════════
-- MIRROR VIRTUAL PLATFORM - COMPLETE UNIFIED MIGRATION
-- ════════════════════════════════════════════════════════════════════════════
-- Comprehensive schema for all Mirror systems:
-- - Core Platform (Profiles, Reflections, MirrorBacks)
-- - MirrorX Engine (AI Intelligence, Bias Tracking, Safety)
-- - Mirror Worldview (Governance, Recognition, Forks)
-- - Mirror OS (Layer Integration, Evolution, Network)
-- - Mirror Finder (Constitutional Routing Intelligence)
-- - Commons (Public Metadata Registry)
-- ════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════════════
-- ENUM TYPES
-- ════════════════════════════════════════════════════════════════════════════

-- Reflection visibility
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reflection_visibility') THEN
        CREATE TYPE reflection_visibility AS ENUM ('public', 'circle', 'private');
    END IF;
END$$;

-- Reflection tone
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reflection_tone') THEN
        CREATE TYPE reflection_tone AS ENUM ('raw', 'processing', 'clear');
    END IF;
END$$;

-- Mirrorback source
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mirrorback_source') THEN
        CREATE TYPE mirrorback_source AS ENUM ('ai', 'human');
    END IF;
END$$;

-- Safety severity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safety_severity') THEN
        CREATE TYPE safety_severity AS ENUM ('info', 'warning', 'critical');
    END IF;
END$$;

-- Regression type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regression_type') THEN
        CREATE TYPE regression_type AS ENUM ('loop', 'self_attack', 'judgment_spike', 'avoidance');
    END IF;
END$$;

-- Signal type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_type') THEN
        CREATE TYPE signal_type AS ENUM ('view', 'respond', 'save', 'skip', 'mute_author');
    END IF;
END$$;

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: CORE PLATFORM (Profiles, Reflections, MirrorBacks)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  role TEXT NOT NULL DEFAULT 'Witness' CHECK (role IN ('Witness', 'Guide')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Reflections (user input)
CREATE TABLE IF NOT EXISTS public.reflections (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility reflection_visibility NOT NULL DEFAULT 'private',
  tone reflection_tone,
  thread_id BIGINT,
  parent_id BIGINT REFERENCES public.reflections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflections_user ON public.reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_thread ON public.reflections(thread_id);
CREATE INDEX IF NOT EXISTS idx_reflections_parent ON public.reflections(parent_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON public.reflections(created_at DESC);

-- MirrorBacks (AI responses)
CREATE TABLE IF NOT EXISTS public.mirrorbacks (
  id BIGSERIAL PRIMARY KEY,
  reflection_id BIGINT NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source mirrorback_source NOT NULL DEFAULT 'ai',
  tone reflection_tone,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mirrorbacks_reflection ON public.mirrorbacks(reflection_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_user ON public.mirrorbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_created ON public.mirrorbacks(created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: MIRRORX ENGINE (AI Intelligence, Bias, Safety, Evolution)
-- ════════════════════════════════════════════════════════════════════════════

-- Identity Snapshots (evolving user patterns)
CREATE TABLE IF NOT EXISTS public.identity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tensions TEXT[] DEFAULT ARRAY[]::TEXT[],
  paradoxes TEXT[] DEFAULT ARRAY[]::TEXT[],
  goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  recurring_loops TEXT[] DEFAULT ARRAY[]::TEXT[],
  regressions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_reflections TEXT[] DEFAULT ARRAY[]::TEXT[],
  dominant_tension TEXT,
  big_question TEXT,
  emotional_baseline TEXT,
  oscillation_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_snapshots_user ON public.identity_snapshots(user_id);

-- Bias Insights (detected thinking patterns)
CREATE TABLE IF NOT EXISTS public.bias_insights (
  id BIGSERIAL PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id BIGINT REFERENCES public.reflections(id) ON DELETE SET NULL,
  dimension TEXT NOT NULL,
  direction TEXT NOT NULL,
  confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bias_insights_identity ON public.bias_insights(identity_id);
CREATE INDEX IF NOT EXISTS idx_bias_insights_dimension ON public.bias_insights(dimension);

-- Safety Events (safety-relevant decisions)
CREATE TABLE IF NOT EXISTS public.safety_events (
  id BIGSERIAL PRIMARY KEY,
  identity_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reflection_id BIGINT REFERENCES public.reflections(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  severity safety_severity NOT NULL DEFAULT 'warning',
  action_taken TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_identity ON public.safety_events(identity_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_severity ON public.safety_events(severity);

-- Regression Markers (learning from regression)
CREATE TABLE IF NOT EXISTS public.regression_markers (
  id BIGSERIAL PRIMARY KEY,
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id BIGINT REFERENCES public.reflections(id) ON DELETE SET NULL,
  kind regression_type NOT NULL,
  description TEXT,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  pattern_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regression_identity ON public.regression_markers(identity_id);
CREATE INDEX IF NOT EXISTS idx_regression_kind ON public.regression_markers(kind);

-- Engine Runs (performance tracking)
CREATE TABLE IF NOT EXISTS public.engine_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id BIGINT REFERENCES public.reflections(id) ON DELETE CASCADE,
    config_version TEXT NOT NULL,
    engine_mode TEXT NOT NULL CHECK (engine_mode IN ('local_llm', 'remote_llm', 'manual')),
    patterns JSONB DEFAULT '{}'::jsonb,
    tensions_surfaced JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER NOT NULL,
    constitutional_flags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_runs_reflection ON public.engine_runs(reflection_id);
CREATE INDEX IF NOT EXISTS idx_engine_runs_mode ON public.engine_runs(engine_mode);

-- Engine Feedback (user ratings)
CREATE TABLE IF NOT EXISTS public.engine_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id BIGINT REFERENCES public.reflections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rating', 'flag', 'comment', 'helpful', 'unhelpful')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_feedback_reflection ON public.engine_feedback(reflection_id);
CREATE INDEX IF NOT EXISTS idx_engine_feedback_user ON public.engine_feedback(user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: MIRROR WORLDVIEW (Governance, Recognition, Forks)
-- ════════════════════════════════════════════════════════════════════════════

-- Governance Proposals (constitutional amendments)
CREATE TABLE IF NOT EXISTS public.governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  full_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  proposed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voting_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'voting', 'passed', 'rejected', 'implemented', 'vetoed')),
  votes_approve INTEGER DEFAULT 0,
  votes_reject INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  guardian_review TEXT,
  implementation_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_proposed_by ON public.governance_proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_proposals_deadline ON public.governance_proposals(voting_deadline);

-- Governance Votes
CREATE TABLE IF NOT EXISTS public.governance_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('approve', 'reject', 'abstain')),
  comment TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, identity_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON public.governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_identity ON public.governance_votes(identity_id);

-- Recognition Registry (proof-of-mirror)
CREATE TABLE IF NOT EXISTS public.recognition_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL UNIQUE,
  genesis_hash TEXT NOT NULL,
  public_key TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'challenged', 'revoked')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  challenges TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_recognition_status ON public.recognition_registry(status);
CREATE INDEX IF NOT EXISTS idx_recognition_genesis ON public.recognition_registry(genesis_hash);

-- Fork Registry (legitimate forks)
CREATE TABLE IF NOT EXISTS public.fork_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fork_id TEXT NOT NULL UNIQUE,
  parent_instance_id TEXT NOT NULL,
  fork_genesis_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  forked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amendments TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged'))
);

CREATE INDEX IF NOT EXISTS idx_forks_parent ON public.fork_registry(parent_instance_id);
CREATE INDEX IF NOT EXISTS idx_forks_status ON public.fork_registry(status);

-- Verification Challenges
CREATE TABLE IF NOT EXISTS public.verification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  challenger_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  evidence TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution TEXT
);

CREATE INDEX IF NOT EXISTS idx_challenges_instance ON public.verification_challenges(instance_id);
CREATE INDEX IF NOT EXISTS idx_challenges_resolved ON public.verification_challenges(resolved);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: MIRROR FINDER (Constitutional Routing Intelligence)
-- ════════════════════════════════════════════════════════════════════════════

-- Lens Usage Events (for TPV computation)
CREATE TABLE IF NOT EXISTS public.lens_usage_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lens_id TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    session_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lens_usage_user ON public.lens_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_lens_usage_timestamp ON public.lens_usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_lens_usage_recent ON public.lens_usage_events(user_id, timestamp DESC);

-- Tension Proxy Vectors (computed from lens usage)
CREATE TABLE IF NOT EXISTS public.tension_proxy_vectors (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    vector JSONB NOT NULL,
    is_manual_override BOOLEAN DEFAULT FALSE,
    last_computed TIMESTAMPTZ,
    ambiguity_score REAL CHECK (ambiguity_score >= 0 AND ambiguity_score <= 1)
);

-- Identity Graph Nodes
CREATE TABLE IF NOT EXISTS public.identity_graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('thought', 'belief', 'emotion', 'action', 'experience', 'consequence')),
    label TEXT NOT NULL,
    content TEXT NOT NULL,
    lens_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activated TIMESTAMPTZ DEFAULT NOW(),
    activation_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_user ON public.identity_graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON public.identity_graph_nodes(node_type);

-- Identity Graph Edges
CREATE TABLE IF NOT EXISTS public.identity_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES public.identity_graph_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES public.identity_graph_nodes(id) ON DELETE CASCADE,
    edge_type TEXT NOT NULL CHECK (edge_type IN ('reinforces', 'contradicts', 'undermines', 'leads_to', 'co_occurs_with')),
    frequency REAL DEFAULT 0.0,
    intensity REAL DEFAULT 0.5,
    recency REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_user ON public.identity_graph_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON public.identity_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON public.identity_graph_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON public.identity_graph_edges(edge_type);

-- Tensions (stable contradictions)
CREATE TABLE IF NOT EXISTS public.tensions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    node_a_id UUID NOT NULL REFERENCES public.identity_graph_nodes(id) ON DELETE CASCADE,
    node_b_id UUID NOT NULL REFERENCES public.identity_graph_nodes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    energy REAL DEFAULT 0.5 CHECK (energy >= 0 AND energy <= 1),
    duration_days INTEGER DEFAULT 0,
    lens_tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tensions_user ON public.tensions(user_id);

-- Posture States
CREATE TABLE IF NOT EXISTS public.posture_states (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    declared TEXT NOT NULL CHECK (declared IN ('unknown', 'overwhelmed', 'guarded', 'grounded', 'open', 'exploratory')),
    suggested TEXT CHECK (suggested IN ('unknown', 'overwhelmed', 'guarded', 'grounded', 'open', 'exploratory')),
    declared_at TIMESTAMPTZ NOT NULL,
    suggested_at TIMESTAMPTZ,
    divergence_count INTEGER DEFAULT 0,
    last_divergence_prompt TIMESTAMPTZ
);

-- Finder Targets (ephemeral - regenerated each session)
CREATE TABLE IF NOT EXISTS public.finder_targets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    description TEXT NOT NULL,
    lens_tags TEXT[] DEFAULT '{}',
    interaction_style_preference TEXT,
    intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
    user_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate Cards (cached from Commons)
CREATE TABLE IF NOT EXISTS public.candidate_cards (
    node_id TEXT PRIMARY KEY,
    card_type TEXT NOT NULL CHECK (card_type IN ('person', 'room', 'artifact', 'practice')),
    interaction_style TEXT NOT NULL CHECK (interaction_style IN ('witness', 'dialogue', 'debate', 'structured')),
    lens_tags TEXT[] NOT NULL,
    title TEXT,
    description TEXT,
    creator_id UUID,
    attestation_count INTEGER DEFAULT 0,
    cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_lens_tags ON public.candidate_cards USING GIN(lens_tags);
CREATE INDEX IF NOT EXISTS idx_cards_interaction_style ON public.candidate_cards(interaction_style);

-- Asymmetry Reports (structural risk metrics)
CREATE TABLE IF NOT EXISTS public.asymmetry_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id TEXT NOT NULL REFERENCES public.candidate_cards(node_id) ON DELETE CASCADE,
    exit_friction TEXT NOT NULL CHECK (exit_friction IN ('low', 'medium', 'high')),
    data_demand_ratio REAL NOT NULL CHECK (data_demand_ratio >= 0 AND data_demand_ratio <= 1),
    opacity BOOLEAN DEFAULT FALSE,
    identity_coercion BOOLEAN DEFAULT FALSE,
    unilateral_control BOOLEAN DEFAULT FALSE,
    lock_in_terms BOOLEAN DEFAULT FALSE,
    evidence_tier TEXT NOT NULL CHECK (evidence_tier IN ('declared', 'attested', 'observed')),
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asymmetry_node ON public.asymmetry_reports(node_id);

-- Doors Shown (tracking for diversity/novelty)
CREATE TABLE IF NOT EXISTS public.doors_shown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL REFERENCES public.candidate_cards(node_id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    score REAL,
    score_components JSONB
);

CREATE INDEX IF NOT EXISTS idx_doors_user ON public.doors_shown(user_id);
CREATE INDEX IF NOT EXISTS idx_doors_session ON public.doors_shown(session_id);
CREATE INDEX IF NOT EXISTS idx_doors_node ON public.doors_shown(node_id);
CREATE INDEX IF NOT EXISTS idx_doors_recent ON public.doors_shown(user_id, shown_at DESC);

-- Mistake Reports (learning from errors)
CREATE TABLE IF NOT EXISTS public.mistake_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mistake_type TEXT NOT NULL CHECK (mistake_type IN ('consent_violation', 'timing_mismatch', 'corruption_risk', 'bandwidth_overload', 'discomfort')),
    node_id TEXT NOT NULL REFERENCES public.candidate_cards(node_id) ON DELETE CASCADE,
    context TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    correction_applied BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user ON public.mistake_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_type ON public.mistake_reports(mistake_type);
CREATE INDEX IF NOT EXISTS idx_mistakes_recent ON public.mistake_reports(user_id, reported_at DESC);

-- Finder Configuration (user preferences)
CREATE TABLE IF NOT EXISTS public.finder_config (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('first_mirror', 'active', 'manual', 'random', 'off')),
    bandwidth_limit INTEGER DEFAULT 3,
    blocked_nodes TEXT[] DEFAULT '{}',
    timing_preferences JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Graph Snapshots (for audit trail)
CREATE TABLE IF NOT EXISTS public.graph_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user ON public.graph_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_generated ON public.graph_snapshots(generated_at);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 5: COMMENTS & DOCUMENTATION
-- ════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.profiles IS 'User profiles and surface identity';
COMMENT ON TABLE public.reflections IS 'User reflections (input text)';
COMMENT ON TABLE public.mirrorbacks IS 'AI-generated responses to reflections';
COMMENT ON TABLE public.identity_snapshots IS 'Evolving patterns in user thinking';
COMMENT ON TABLE public.bias_insights IS 'Detected thinking patterns (studied, not hidden)';
COMMENT ON TABLE public.safety_events IS 'Safety-relevant decisions (transparent audit log)';
COMMENT ON TABLE public.regression_markers IS 'Regression patterns (data, not failure)';
COMMENT ON TABLE public.engine_runs IS 'MirrorX performance tracking';
COMMENT ON TABLE public.engine_feedback IS 'User feedback for evolution system';
COMMENT ON TABLE public.governance_proposals IS 'Constitutional amendment proposals';
COMMENT ON TABLE public.governance_votes IS 'Votes on constitutional amendments';
COMMENT ON TABLE public.recognition_registry IS 'Cryptographic proof-of-mirror verification';
COMMENT ON TABLE public.fork_registry IS 'Legitimate fork tracking';
COMMENT ON TABLE public.verification_challenges IS 'Constitutional compliance challenges';
COMMENT ON TABLE public.lens_usage_events IS 'Explicit lens usage (only source for TPV)';
COMMENT ON TABLE public.tension_proxy_vectors IS 'User TPV computed from lens usage';
COMMENT ON TABLE public.identity_graph_nodes IS 'Local identity graph nodes (never sent to Commons)';
COMMENT ON TABLE public.identity_graph_edges IS 'Relationships between identity graph nodes';
COMMENT ON TABLE public.tensions IS 'Stable contradictions in identity graph';
COMMENT ON TABLE public.posture_states IS 'Two-layer posture: declared (canonical) + suggested (advisory)';
COMMENT ON TABLE public.finder_targets IS 'Abstract descriptions of reflective conditions to find';
COMMENT ON TABLE public.candidate_cards IS 'Public metadata about reflective conditions (cached from Commons)';
COMMENT ON TABLE public.asymmetry_reports IS 'Structural asymmetry metrics (not ideological)';
COMMENT ON TABLE public.doors_shown IS 'History of doors presented to user (for diversity/novelty)';
COMMENT ON TABLE public.mistake_reports IS 'User reports of Finder mistakes (delivery only, not content)';
COMMENT ON TABLE public.finder_config IS 'Finder operational mode and learned parameters';
COMMENT ON TABLE public.graph_snapshots IS 'Audit trail of Identity Graph states';

-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ════════════════════════════════════════════════════════════════════════════
-- Total tables: 34
-- - Core Platform: 3 tables
-- - MirrorX Engine: 8 tables
-- - Mirror Worldview: 5 tables
-- - Mirror Finder: 18 tables
-- ════════════════════════════════════════════════════════════════════════════
