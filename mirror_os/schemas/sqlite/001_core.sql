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
    content TEXT NOT NULL,      -- User's reflection text
    mirrorback TEXT,             -- Generated mirrorback
    created_at TEXT NOT NULL,
    metadata TEXT,               -- JSON: {tags, context, etc}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_reflections_identity ON reflections(identity_id);
CREATE INDEX idx_reflections_created ON reflections(created_at DESC);

-- ============================================================================
-- TENSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tensions (
    id TEXT PRIMARY KEY,
    identity_id TEXT,
    name TEXT NOT NULL,          -- e.g., "Freedom vs Security"
    axis_a TEXT NOT NULL,        -- First pole
    axis_b TEXT NOT NULL,        -- Second pole
    position REAL,               -- -1.0 to 1.0 (current position)
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    metadata TEXT,               -- JSON: {intensity, context}
    FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
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
    content TEXT NOT NULL,       -- The mirrorback text
    version INTEGER DEFAULT 1,   -- Version if regenerated
    created_at TEXT NOT NULL,
    metadata TEXT,               -- JSON: {engine_version, model, etc}
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
    config_version TEXT NOT NULL,     -- e.g., "1.2.0"
    engine_mode TEXT NOT NULL,        -- "local_llm", "remote_llm", "manual"
    patterns TEXT,                    -- JSON: detected patterns
    tensions_surfaced TEXT,           -- JSON: which tensions detected
    mirrorback_length INTEGER,        -- Length of output
    duration_ms INTEGER,              -- Processing time
    flags TEXT,                       -- JSON: constitutional flags
    timestamp TEXT NOT NULL,
    FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE
);

CREATE INDEX idx_engine_runs_timestamp ON engine_runs(timestamp DESC);
CREATE INDEX idx_engine_runs_config ON engine_runs(config_version);

-- User feedback on mirrorbacks
CREATE TABLE IF NOT EXISTS engine_feedback (
    id TEXT PRIMARY KEY,
    engine_run_id TEXT NOT NULL,
    rating INTEGER,                   -- 1-5 stars
    flags TEXT,                       -- JSON: ["too_directive", "missed_tension", etc]
    notes TEXT,                       -- User's comments
    timestamp TEXT NOT NULL,
    FOREIGN KEY (engine_run_id) REFERENCES engine_runs(id) ON DELETE CASCADE
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

