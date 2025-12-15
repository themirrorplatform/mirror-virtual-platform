-- mirror_os/schemas/sqlite/001_core.sql
-- Core entities for sovereign Mirror
-- Version: 1.0.0
-- Date: 2025-12-08

-- ============================================================================
-- IDENTITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS identities (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    metadata TEXT  -- JSON: {name, settings, preferences}
);

-- ============================================================================
-- REFLECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reflections (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    content TEXT NOT NULL,           -- User's reflection text
    content_type TEXT DEFAULT 'text',  -- 'text', 'markdown', 'audio_transcript'
    visibility TEXT NOT NULL DEFAULT 'local_only',  -- Sync permission
    mirrorback TEXT,                 -- Generated mirrorback
    source TEXT DEFAULT 'direct',    -- 'direct', 'import', 'integration'
    created_at TEXT NOT NULL,
    metadata TEXT,                   -- JSON: {tags, context, emotional_tone, word_count}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
    CHECK (visibility IN ('local_only', 'sync_summary', 'sync_full_private', 'sync_full_public')),
    CHECK (content_type IN ('text', 'markdown', 'audio_transcript')),
    CHECK (source IN ('direct', 'import', 'integration'))
);

CREATE INDEX idx_reflections_identity ON reflections(identity_id);
CREATE INDEX idx_reflections_created ON reflections(created_at DESC);

-- ============================================================================
-- TENSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tensions (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    name TEXT NOT NULL,              -- e.g., "Freedom vs Security"
    axis_a TEXT NOT NULL,            -- First pole
    axis_b TEXT NOT NULL,            -- Second pole
    position REAL,                   -- -1.0 to 1.0 (current position)
    intensity REAL,                  -- 0.0 to 1.0 (how strongly felt)
    origin TEXT NOT NULL DEFAULT 'user_created',  -- How discovered
    sync_mode TEXT NOT NULL DEFAULT 'local_only',  -- Sharing permission
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    metadata TEXT,                   -- JSON: {position_history, notes, related_reflections}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
    CHECK (position IS NULL OR (position >= -1.0 AND position <= 1.0)),
    CHECK (intensity IS NULL OR (intensity >= 0.0 AND intensity <= 1.0)),
    CHECK (origin IN ('system_seed', 'llm_suggested', 'user_created')),
    CHECK (sync_mode IN ('local_only', 'share_anonymized', 'share_full'))
);

CREATE INDEX idx_tensions_identity ON tensions(identity_id);

-- ============================================================================
-- AXES
-- ============================================================================
CREATE TABLE IF NOT EXISTS axes (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    name TEXT NOT NULL,          -- e.g., "Stability" or "Adventure"
    description TEXT,
    created_at TEXT NOT NULL,
    metadata TEXT,               -- JSON: {category, strength}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_axes_identity ON axes(identity_id);

-- ============================================================================
-- MIRRORBACKS (Separate table for versioning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mirrorbacks (
    id TEXT PRIMARY KEY,
    reflection_id TEXT NOT NULL,
    content TEXT NOT NULL,           -- The mirrorback text
    engine_version TEXT NOT NULL,    -- Config version that generated this
    version INTEGER DEFAULT 1,       -- Version if regenerated
    created_at TEXT NOT NULL,
    metadata TEXT,                   -- JSON: {model, engine_mode, duration_ms, patterns, constitutional_flags}
    FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE
);

CREATE INDEX idx_mirrorbacks_reflection ON mirrorbacks(reflection_id);

-- ============================================================================
-- EVOLUTION TELEMETRY
-- ============================================================================

-- Logs every engine run for evolution learning
CREATE TABLE IF NOT EXISTS engine_runs (
    id TEXT PRIMARY KEY,
    reflection_id TEXT,
    config_version TEXT NOT NULL,        -- e.g., "1.2.0"
    engine_mode TEXT NOT NULL,           -- "local_llm", "remote_llm", "manual"
    model_name TEXT,                     -- Specific model if applicable
    patterns TEXT,                       -- JSON: detected patterns array
    tensions_surfaced TEXT,              -- JSON: which tensions detected
    mirrorback_length INTEGER,           -- Length of output
    duration_ms INTEGER,                 -- Processing time
    flags TEXT,                          -- JSON: constitutional flags/warnings
    timestamp TEXT NOT NULL,
    sync_allowed INTEGER NOT NULL DEFAULT 0,  -- Boolean: can contribute to Commons
    FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE,
    CHECK (engine_mode IN ('local_llm', 'remote_llm', 'manual'))
);

CREATE INDEX idx_engine_runs_timestamp ON engine_runs(timestamp DESC);
CREATE INDEX idx_engine_runs_config ON engine_runs(config_version);

-- User feedback on mirrorbacks
CREATE TABLE IF NOT EXISTS engine_feedback (
    id TEXT PRIMARY KEY,
    engine_run_id TEXT NOT NULL,
    rating INTEGER,                      -- 1-5 stars
    flags TEXT,                          -- JSON: ["too_directive", "missed_tension", etc]
    notes TEXT,                          -- User's comments
    timestamp TEXT NOT NULL,
    sync_allowed INTEGER NOT NULL DEFAULT 0,  -- Boolean: can contribute to Commons
    FOREIGN KEY (engine_run_id) REFERENCES engine_runs(id) ON DELETE CASCADE,
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

CREATE INDEX idx_engine_feedback_run ON engine_feedback(engine_run_id);
CREATE INDEX idx_engine_feedback_timestamp ON engine_feedback(timestamp DESC);

-- ============================================================================
-- PATTERNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    name TEXT NOT NULL,              -- Pattern name
    description TEXT,
    occurrences INTEGER DEFAULT 1,   -- How many times seen
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    metadata TEXT,                   -- JSON: {strength, context}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_patterns_identity ON patterns(identity_id);
CREATE INDEX idx_patterns_last_seen ON patterns(last_seen DESC);

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    description TEXT
);

-- Insert initial version
INSERT INTO schema_version (version, applied_at, description) 
VALUES ('1.0.0', datetime('now'), 'Initial sovereign schema');

-- ============================================================================
-- SETTINGS (Local configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
    ('mirror_mode', 'local', datetime('now')),
    ('engine_mode', 'local_llm', datetime('now')),
    ('llm_provider', 'ollama', datetime('now')),
    ('cloud_sync_enabled', 'false', datetime('now')),
    ('telemetry_consent', 'false', datetime('now'));

-- ============================================================================
-- THREADS (Session/Conversation grouping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    title TEXT,                      -- Optional thread name
    started_at TEXT NOT NULL,
    last_active TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'archived'
    metadata TEXT,                   -- JSON: {reflection_count, tags, context}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
    CHECK (status IN ('active', 'paused', 'archived'))
);

CREATE INDEX idx_threads_identity ON threads(identity_id);
CREATE INDEX idx_threads_last_active ON threads(last_active DESC);
CREATE INDEX idx_threads_status ON threads(status);

-- ============================================================================
-- THREAD_REFLECTIONS (Junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_reflections (
    thread_id TEXT NOT NULL,
    reflection_id TEXT NOT NULL,
    position INTEGER NOT NULL,       -- Order in thread
    added_at TEXT NOT NULL,
    PRIMARY KEY (thread_id, reflection_id),
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
    FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE
);

CREATE INDEX idx_thread_reflections_thread ON thread_reflections(thread_id);
CREATE INDEX idx_thread_reflections_position ON thread_reflections(thread_id, position);

-- ============================================================================
-- INTEGRATIONS (External data sources)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    integration_type TEXT NOT NULL,  -- 'calendar', 'notes', 'email', 'health', etc
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'disconnected', 'error'
    config TEXT NOT NULL,            -- JSON: connection details (encrypted)
    connected_at TEXT NOT NULL,
    last_sync TEXT,
    metadata TEXT,                   -- JSON: {sync_frequency, permissions, etc}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
    CHECK (status IN ('active', 'paused', 'disconnected', 'error'))
);

CREATE INDEX idx_integrations_identity ON integrations(identity_id);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_type ON integrations(integration_type);

-- ============================================================================
-- EVOLUTION_PROPOSALS (Candidate changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evolution_proposals (
    id TEXT PRIMARY KEY,
    proposal_type TEXT NOT NULL,     -- 'prompt_adjustment', 'new_tension', etc
    status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'testing', 'approved', 'rejected', 'applied'
    from_version TEXT,
    to_version TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes TEXT NOT NULL,           -- JSON: detailed changes
    evidence TEXT,                   -- JSON: supporting data
    test_results TEXT,               -- JSON: sandbox outcomes
    vote_results TEXT,               -- JSON: voting data (deprecated - use vote tracking columns)
    created_at TEXT NOT NULL,
    approved_at TEXT,
    applied_at TEXT,
    metadata TEXT,                   -- JSON: author, discussion, etc
    -- Voting columns (added in migration 002)
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    total_vote_weight REAL DEFAULT 0.0,
    consensus_threshold REAL DEFAULT 0.67,
    voting_ends_at TEXT,
    proposer_identity_id TEXT,
    CHECK (proposal_type IN ('prompt_adjustment', 'pattern_detection', 'tension_heuristic', 
                              'constitutional_amendment', 'safety_refinement', 'performance_optimization',
                              'pattern_add', 'pattern_modify', 'pattern_remove',
                              'tension_add', 'tension_modify',
                              'constitutional_add', 'constitutional_modify',
                              'engine_update')),
    CHECK (status IN ('draft', 'testing', 'review', 'voting', 'approved', 'rejected', 'applied', 'active', 'rolled_out', 'rolled_back'))
);

CREATE INDEX idx_evolution_proposals_status ON evolution_proposals(status);
CREATE INDEX idx_evolution_proposals_created ON evolution_proposals(created_at DESC);
CREATE INDEX idx_evolution_proposals_type ON evolution_proposals(proposal_type);

-- ============================================================================
-- EVOLUTION_VOTES (Democratic voting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evolution_votes (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    identity_id TEXT NOT NULL,
    choice TEXT NOT NULL,           -- 'for', 'against', 'abstain'
    weight REAL NOT NULL DEFAULT 1.0,
    reasoning TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (proposal_id) REFERENCES evolution_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, identity_id),  -- One vote per identity per proposal
    CHECK (choice IN ('for', 'against', 'abstain'))
);

CREATE INDEX idx_evolution_votes_proposal ON evolution_votes(proposal_id);
CREATE INDEX idx_evolution_votes_identity ON evolution_votes(identity_id);
CREATE INDEX idx_evolution_votes_created ON evolution_votes(created_at DESC);

-- ============================================================================
-- EVOLUTION_VERSIONS (Version management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evolution_versions (
    id TEXT PRIMARY KEY,
    version_number TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    approved_proposals TEXT,        -- JSON array of proposal IDs
    rollout_percentage INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,  -- Boolean
    created_at TEXT NOT NULL,
    metadata TEXT,                  -- JSON
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE INDEX idx_evolution_versions_active ON evolution_versions(is_active);
CREATE INDEX idx_evolution_versions_created ON evolution_versions(created_at DESC);

-- ============================================================================
-- EVOLUTION_HISTORY (Audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evolution_history (
    id TEXT PRIMARY KEY,
    evolution_id TEXT NOT NULL,      -- Reference to proposal or event
    event_type TEXT NOT NULL,        -- 'upgrade', 'downgrade', 'fork', 'rollback', 'merge'
    from_version TEXT,
    to_version TEXT,
    applied_at TEXT NOT NULL,
    applied_by TEXT,                 -- Who/what applied it
    reversible INTEGER NOT NULL DEFAULT 1,  -- Boolean: can be rolled back
    metadata TEXT,                   -- JSON: reason, impact, etc
    CHECK (event_type IN ('upgrade', 'downgrade', 'fork', 'rollback', 'merge', 'hotfix'))
);

CREATE INDEX idx_evolution_history_applied ON evolution_history(applied_at DESC);
CREATE INDEX idx_evolution_history_event ON evolution_history(event_type);
CREATE INDEX idx_evolution_history_evolution ON evolution_history(evolution_id);

-- ============================================================================
-- EVOLUTION_EVENTS (Lifecycle events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evolution_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,        -- 'installation', 'deletion', 'fork', 'regression', etc
    from_version TEXT,
    to_version TEXT,
    event_data TEXT NOT NULL,        -- JSON: event details
    timestamp TEXT NOT NULL,
    mirror_signature TEXT,           -- Cryptographic proof
    sync_allowed INTEGER NOT NULL DEFAULT 0,  -- Boolean: can share with Commons
    CHECK (event_type IN ('installation', 'deletion', 'fork', 'regression', 
                          'integration_add', 'integration_remove', 'upgrade', 
                          'downgrade', 'config_change', 'export', 'import'))
);

CREATE INDEX idx_evolution_events_timestamp ON evolution_events(timestamp DESC);
CREATE INDEX idx_evolution_events_type ON evolution_events(event_type);
CREATE INDEX idx_evolution_events_sync ON evolution_events(sync_allowed);

-- ============================================================================
-- SESSIONS (Legacy - keeping for backwards compatibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    title TEXT,
    started_at TEXT NOT NULL,
    last_active TEXT NOT NULL,
    metadata TEXT,                   -- JSON: {reflection_count, status}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_identity ON sessions(identity_id);
CREATE INDEX idx_sessions_last_active ON sessions(last_active DESC);
