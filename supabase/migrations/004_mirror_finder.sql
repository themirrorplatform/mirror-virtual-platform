-- Mirror Finder Database Schema
-- Extends existing Mirror database with Finder-specific tables

-- Lens Usage Events (for TPV computation)
CREATE TABLE IF NOT EXISTS lens_usage_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    lens_id TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    session_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_lens_usage_user (user_id),
    INDEX idx_lens_usage_timestamp (timestamp)
);

-- Tension Proxy Vectors (computed from lens usage)
CREATE TABLE IF NOT EXISTS tension_proxy_vectors (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    vector JSONB NOT NULL, -- {"lens_id": probability}
    is_manual_override BOOLEAN DEFAULT FALSE,
    last_computed TIMESTAMPTZ,
    ambiguity_score REAL,
    
    CHECK (ambiguity_score >= 0 AND ambiguity_score <= 1)
);

-- Identity Graph Nodes
CREATE TABLE IF NOT EXISTS identity_graph_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    node_type TEXT NOT NULL CHECK (node_type IN ('thought', 'belief', 'emotion', 'action', 'experience', 'consequence')),
    label TEXT NOT NULL,
    content TEXT NOT NULL,
    lens_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activated TIMESTAMPTZ DEFAULT NOW(),
    activation_count INTEGER DEFAULT 0,
    
    INDEX idx_graph_nodes_user (user_id),
    INDEX idx_graph_nodes_type (node_type)
);

-- Identity Graph Edges
CREATE TABLE IF NOT EXISTS identity_graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    source_node_id UUID NOT NULL REFERENCES identity_graph_nodes(id),
    target_node_id UUID NOT NULL REFERENCES identity_graph_nodes(id),
    edge_type TEXT NOT NULL CHECK (edge_type IN ('reinforces', 'contradicts', 'undermines', 'leads_to', 'co_occurs_with')),
    frequency REAL DEFAULT 0.0,
    intensity REAL DEFAULT 0.5,
    recency REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_graph_edges_user (user_id),
    INDEX idx_graph_edges_source (source_node_id),
    INDEX idx_graph_edges_target (target_node_id),
    INDEX idx_graph_edges_type (edge_type)
);

-- Tensions (stable contradictions)
CREATE TABLE IF NOT EXISTS tensions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    node_a_id UUID NOT NULL REFERENCES identity_graph_nodes(id),
    node_b_id UUID NOT NULL REFERENCES identity_graph_nodes(id),
    name TEXT NOT NULL,
    energy REAL DEFAULT 0.5,
    duration_days INTEGER DEFAULT 0,
    lens_tags TEXT[] DEFAULT '{}',
    
    INDEX idx_tensions_user (user_id),
    CHECK (energy >= 0 AND energy <= 1)
);

-- Posture State
CREATE TABLE IF NOT EXISTS posture_states (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    declared TEXT NOT NULL CHECK (declared IN ('unknown', 'overwhelmed', 'guarded', 'grounded', 'open', 'exploratory')),
    suggested TEXT CHECK (suggested IN ('unknown', 'overwhelmed', 'guarded', 'grounded', 'open', 'exploratory')),
    declared_at TIMESTAMPTZ NOT NULL,
    suggested_at TIMESTAMPTZ,
    divergence_count INTEGER DEFAULT 0,
    last_divergence_prompt TIMESTAMPTZ
);

-- Finder Targets (ephemeral - regenerated each session)
CREATE TABLE IF NOT EXISTS finder_targets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
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
CREATE TABLE IF NOT EXISTS candidate_cards (
    node_id TEXT PRIMARY KEY,
    card_type TEXT NOT NULL CHECK (card_type IN ('person', 'room', 'artifact', 'practice')),
    interaction_style TEXT NOT NULL CHECK (interaction_style IN ('witness', 'dialogue', 'debate', 'structured')),
    lens_tags TEXT[] NOT NULL,
    title TEXT,
    description TEXT,
    creator_id UUID,
    attestation_count INTEGER DEFAULT 0,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_cards_lens_tags USING GIN(lens_tags),
    INDEX idx_cards_interaction_style (interaction_style)
);

-- Asymmetry Reports (structural risk metrics)
CREATE TABLE IF NOT EXISTS asymmetry_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id TEXT NOT NULL REFERENCES candidate_cards(node_id),
    exit_friction TEXT NOT NULL CHECK (exit_friction IN ('low', 'medium', 'high')),
    data_demand_ratio REAL NOT NULL CHECK (data_demand_ratio >= 0 AND data_demand_ratio <= 1),
    opacity BOOLEAN DEFAULT FALSE,
    identity_coercion BOOLEAN DEFAULT FALSE,
    unilateral_control BOOLEAN DEFAULT FALSE,
    lock_in_terms BOOLEAN DEFAULT FALSE,
    evidence_tier TEXT NOT NULL CHECK (evidence_tier IN ('declared', 'attested', 'observed')),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_asymmetry_node (node_id)
);

-- Doors Shown (tracking for diversity/novelty)
CREATE TABLE IF NOT EXISTS doors_shown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    node_id TEXT NOT NULL REFERENCES candidate_cards(node_id),
    session_id UUID NOT NULL,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    score REAL,
    score_components JSONB,
    
    INDEX idx_doors_user (user_id),
    INDEX idx_doors_session (session_id),
    INDEX idx_doors_node (node_id)
);

-- Mistake Reports (learning from errors)
CREATE TABLE IF NOT EXISTS mistake_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    mistake_type TEXT NOT NULL CHECK (mistake_type IN ('consent_violation', 'timing_mismatch', 'corruption_risk', 'bandwidth_overload', 'discomfort')),
    node_id TEXT NOT NULL REFERENCES candidate_cards(node_id),
    context TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    correction_applied BOOLEAN DEFAULT FALSE,
    
    INDEX idx_mistakes_user (user_id),
    INDEX idx_mistakes_type (mistake_type)
);

-- Finder Configuration (user preferences)
CREATE TABLE IF NOT EXISTS finder_config (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    mode TEXT NOT NULL CHECK (mode IN ('first_mirror', 'active', 'manual', 'random', 'off')),
    bandwidth_limit INTEGER DEFAULT 3,
    blocked_nodes TEXT[] DEFAULT '{}',
    timing_preferences JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Graph Snapshots (for audit trail)
CREATE TABLE IF NOT EXISTS graph_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    snapshot_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_snapshots_user (user_id),
    INDEX idx_snapshots_generated (generated_at)
);

-- Comments
COMMENT ON TABLE lens_usage_events IS 'Explicit lens usage events (only source for TPV computation)';
COMMENT ON TABLE tension_proxy_vectors IS 'User TPV computed from lens usage with exponential decay';
COMMENT ON TABLE identity_graph_nodes IS 'Local identity graph nodes (never sent to Commons)';
COMMENT ON TABLE identity_graph_edges IS 'Relationships between identity graph nodes';
COMMENT ON TABLE tensions IS 'Stable contradictions in identity graph';
COMMENT ON TABLE posture_states IS 'Two-layer posture: declared (canonical) + suggested (advisory)';
COMMENT ON TABLE finder_targets IS 'Abstract descriptions of reflective conditions to find';
COMMENT ON TABLE candidate_cards IS 'Public metadata about reflective conditions (cached from Commons)';
COMMENT ON TABLE asymmetry_reports IS 'Structural asymmetry metrics (not ideological)';
COMMENT ON TABLE doors_shown IS 'History of doors presented to user (for diversity/novelty)';
COMMENT ON TABLE mistake_reports IS 'User reports of Finder mistakes (delivery only, not content)';
COMMENT ON TABLE finder_config IS 'Finder operational mode and learned parameters';
COMMENT ON TABLE graph_snapshots IS 'Audit trail of Identity Graph states';

-- Indexes for performance
CREATE INDEX idx_lens_usage_recent ON lens_usage_events(user_id, timestamp DESC);
CREATE INDEX idx_doors_recent ON doors_shown(user_id, shown_at DESC);
CREATE INDEX idx_mistakes_recent ON mistake_reports(user_id, reported_at DESC);
