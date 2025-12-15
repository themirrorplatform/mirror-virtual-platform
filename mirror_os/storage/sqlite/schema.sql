-- ============================================================================
-- THE MIRROR: LOCAL SQLITE SCHEMA
-- Constitutional Enforcement: I1 (Data Sovereignty), I2 (Identity Locality), 
--                            I5 (No Lock-in), I14 (No Cross-Identity Inference)
-- ============================================================================
-- 
-- CRITICAL CONSTRAINTS:
-- 1. All queries MUST be identity-scoped (no global aggregation)
-- 2. Export must include this schema + constitution + prompts + user definitions
-- 3. No cross-identity inference allowed (all analytics identity-local)

-- Enable foreign keys for CASCADE DELETE (I1: User owns everything)
PRAGMA foreign_keys = ON;
-- 4. System must function 100% offline
--
-- ============================================================================

-- Schema versioning for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    constitution_hash TEXT NOT NULL,
    backwards_compatible BOOLEAN DEFAULT FALSE
);

-- Insert initial version
INSERT INTO schema_version (version, description, constitution_hash, backwards_compatible)
VALUES (1, 'Initial Mirror OS schema with constitutional refinements', 'GENESIS_HASH_V1', TRUE);

-- ============================================================================
-- CORE IDENTITY STRUCTURE
-- ============================================================================

-- Core Mirror instance (I1: Data Sovereignty - user owns everything)
CREATE TABLE IF NOT EXISTS mirrors (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constitutional enforcement
    mirrorcore_version TEXT NOT NULL,
    constitution_hash TEXT NOT NULL,
    constitution_version TEXT NOT NULL,  -- I5: Export must include meaning
    
    -- Semantic export requirements (I5: No lock-in)
    prompt_templates TEXT,  -- JSON stored as TEXT (SQLite compatible)
    lens_definitions TEXT,  -- JSON: User-defined language shapes & tensions
    user_renames TEXT,      -- JSON: User customizations (avoid diagnosis)
    
    -- Export/fork tracking
    last_export_at TIMESTAMP,
    forked_from TEXT,
    fork_constitution_verified BOOLEAN DEFAULT FALSE,
    
    -- Layer independence flag
    platform_connected BOOLEAN DEFAULT FALSE,
    works_offline BOOLEAN DEFAULT TRUE CHECK (works_offline = TRUE)  -- MUST be true
);

CREATE INDEX idx_mirrors_owner ON mirrors(owner_id);
CREATE INDEX idx_mirrors_constitution ON mirrors(constitution_hash);

-- ============================================================================
-- IDENTITY GRAPH (I2: Identity-local only)
-- ============================================================================

-- Identity graph nodes (thoughts, beliefs, emotions, actions, experiences)
CREATE TABLE IF NOT EXISTS mirror_nodes (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- Node classification
    node_type TEXT NOT NULL CHECK (node_type IN (
        'thought', 'belief', 'emotion', 'action', 'experience', 'consequence'
    )),
    
    -- Content (I1: User owns, I14: No cross-identity access)
    summary TEXT,
    content TEXT NOT NULL,  -- JSON stored as TEXT
    
    -- Confidence and temporal tracking
    confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
    occurred_at TIMESTAMP,
    occurred_at_confidence TEXT DEFAULT 'exact' CHECK (occurred_at_confidence IN (
        'exact', 'approximate', 'inferred', 'unknown'
    )),
    
    -- Versioning for evolution tracking
    version INTEGER DEFAULT 1,
    previous_version_id TEXT REFERENCES mirror_nodes(id),
    is_current BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nodes_mirror ON mirror_nodes(mirror_id, is_current);
CREATE INDEX idx_nodes_type ON mirror_nodes(mirror_id, node_type);
CREATE INDEX idx_nodes_occurred ON mirror_nodes(mirror_id, occurred_at);
CREATE INDEX idx_nodes_version ON mirror_nodes(previous_version_id);

-- Identity graph edges (relationships between nodes)
CREATE TABLE IF NOT EXISTS mirror_edges (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- Edge endpoints (I2: Both must belong to same mirror_id)
    source_node_id TEXT NOT NULL REFERENCES mirror_nodes(id) ON DELETE CASCADE,
    target_node_id TEXT NOT NULL REFERENCES mirror_nodes(id) ON DELETE CASCADE,
    
    -- Edge classification
    edge_type TEXT NOT NULL CHECK (edge_type IN (
        'causes', 'contradicts', 'supports', 'follows_from', 
        'led_to', 'depends_on', 'conflicts_with', 'reinforces'
    )),
    
    -- Edge metadata
    strength REAL CHECK (strength BETWEEN 0 AND 1),
    confidence REAL CHECK (confidence BETWEEN 0 AND 1),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discovered_by TEXT NOT NULL CHECK (discovered_by IN (
        'user_stated', 'llm_inferred', 'pattern_detected'
    )),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_edges_mirror ON mirror_edges(mirror_id);
CREATE INDEX idx_edges_source ON mirror_edges(source_node_id);
CREATE INDEX idx_edges_target ON mirror_edges(target_node_id);
CREATE INDEX idx_edges_type ON mirror_edges(mirror_id, edge_type);

-- ============================================================================
-- LANGUAGE SHAPES (Renamed from "patterns" - I9: Anti-diagnosis)
-- ============================================================================

-- Language shapes: Neutral language moves, NOT cognitive distortions
-- I9 enforcement: "This is a lens, not a diagnosis"
CREATE TABLE IF NOT EXISTS language_shapes (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- Naming (user can rename to avoid diagnosis framing)
    name TEXT NOT NULL,
    system_name TEXT,  -- Original system seed name (if applicable)
    description TEXT,
    
    -- Origin tracking (CRITICAL for non-diagnosis framing)
    origin TEXT NOT NULL CHECK (origin IN (
        'system_seed',      -- Seeded by system
        'user_named',       -- Created/named by user
        'model_suggested'   -- Suggested by LLM, user accepted
    )),
    
    -- User ownership (I2: Identity-local control)
    user_renamed BOOLEAN DEFAULT FALSE,
    user_hidden BOOLEAN DEFAULT FALSE,  -- User can hide shapes
    user_merged_into TEXT REFERENCES language_shapes(id),  -- User can merge
    
    -- Occurrence tracking
    occurrence_count INTEGER DEFAULT 0,
    last_observed_at TIMESTAMP,
    
    -- Non-diagnosis disclaimer (I9: Anti-diagnosis)
    disclaimer TEXT DEFAULT 'This is a lens for understanding your language, not a diagnosis or label.',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_language_shapes_mirror ON language_shapes(mirror_id, user_hidden);
CREATE INDEX idx_language_shapes_origin ON language_shapes(mirror_id, origin);

-- Language shape occurrences (when shapes appear)
CREATE TABLE IF NOT EXISTS language_shape_occurrences (
    id TEXT PRIMARY KEY,
    shape_id TEXT NOT NULL REFERENCES language_shapes(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL REFERENCES mirror_nodes(id) ON DELETE CASCADE,
    
    confidence REAL CHECK (confidence BETWEEN 0 AND 1),
    context_snippet TEXT,  -- Brief context, never full content
    
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shape_occurrences_shape ON language_shape_occurrences(shape_id);
CREATE INDEX idx_shape_occurrences_node ON language_shape_occurrences(node_id);

-- ============================================================================
-- TENSIONS (Dualities, not progress axes)
-- ============================================================================

-- Tensions: Descriptive positions, NOT evaluative scales (I9: Anti-diagnosis)
CREATE TABLE IF NOT EXISTS tensions (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- Tension duality (neither side is "better")
    axis_a TEXT NOT NULL,  -- e.g., "control"
    axis_b TEXT NOT NULL,  -- e.g., "surrender"
    
    -- Current position (descriptive, not prescriptive)
    current_position REAL CHECK (current_position BETWEEN -1 AND 1),  -- -1 = full A, +1 = full B
    position_confidence REAL CHECK (position_confidence BETWEEN 0 AND 1),
    
    -- Origin tracking
    origin TEXT NOT NULL CHECK (origin IN (
        'system_seed',      -- 8 seed tensions
        'user_defined',     -- User created
        'discovered'        -- Detected from content
    )),
    
    -- User control
    user_renamed BOOLEAN DEFAULT FALSE,
    user_hidden BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tensions_mirror ON tensions(mirror_id, user_hidden);

-- Tension measurements over time
CREATE TABLE IF NOT EXISTS tension_measurements (
    id TEXT PRIMARY KEY,
    tension_id TEXT NOT NULL REFERENCES tensions(id) ON DELETE CASCADE,
    
    position REAL NOT NULL CHECK (position BETWEEN -1 AND 1),
    confidence REAL CHECK (confidence BETWEEN 0 AND 1),
    
    context_node_id TEXT REFERENCES mirror_nodes(id),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_by TEXT CHECK (measured_by IN ('user_reported', 'llm_inferred', 'pattern_derived'))
);

CREATE INDEX idx_tension_measurements_tension ON tension_measurements(tension_id, measured_at);

-- ============================================================================
-- THREADS (Conversation context)
-- ============================================================================

CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threads_mirror ON threads(mirror_id, status);
CREATE INDEX idx_threads_activity ON threads(mirror_id, last_activity_at);

-- ============================================================================
-- REFLECTIONS (User input)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reflections (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
    
    -- Content (I1: User owns)
    content TEXT NOT NULL,
    
    -- Metadata
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
    word_count INTEGER,
    
    -- Thread sequencing
    sequence_number INTEGER,
    parent_reflection_id TEXT REFERENCES reflections(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reflections_mirror ON reflections(mirror_id, created_at DESC);
CREATE INDEX idx_reflections_thread ON reflections(thread_id, sequence_number);
CREATE INDEX idx_reflections_visibility ON reflections(mirror_id, visibility);

-- Thread-reflection association (for multi-threaded conversations)
CREATE TABLE IF NOT EXISTS thread_reflections (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    reflection_id TEXT NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
    
    sequence_number INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(thread_id, sequence_number),
    UNIQUE(thread_id, reflection_id)
);

CREATE INDEX idx_thread_reflections_thread ON thread_reflections(thread_id, sequence_number);

-- ============================================================================
-- MIRRORBACKS (AI reflections - I2: Reflection only, never prescription)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mirrorbacks (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    reflection_id TEXT NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
    
    -- Content (I2: Must pass constitutional checks)
    content TEXT NOT NULL,
    
    -- Constitutional audit trail (I2, I7, I13 enforcement)
    directive_ratio REAL,  -- Must be <= 0.15 (15% threshold)
    imperative_intent_detected BOOLEAN DEFAULT FALSE,
    outcome_steering_detected BOOLEAN DEFAULT FALSE,
    constitutional_violations TEXT,  -- JSON: List of any violations
    constitutional_check_passed BOOLEAN NOT NULL,
    
    -- Engine metadata
    engine_version TEXT NOT NULL,
    engine_config_hash TEXT,
    model_used TEXT,  -- 'local:ollama:llama2' or 'remote:anthropic:claude-3'
    
    -- Generation metadata
    generation_time_ms INTEGER,
    token_count INTEGER,
    
    -- User feedback (I13: Resonance/fidelity/clarity ONLY, not helpfulness)
    user_rating_resonance INTEGER CHECK (user_rating_resonance BETWEEN 1 AND 5),
    user_rating_fidelity INTEGER CHECK (user_rating_fidelity BETWEEN 1 AND 5),
    user_rating_clarity INTEGER CHECK (user_rating_clarity BETWEEN 1 AND 5),
    user_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mirrorbacks_mirror ON mirrorbacks(mirror_id, created_at DESC);
CREATE INDEX idx_mirrorbacks_reflection ON mirrorbacks(reflection_id);
CREATE INDEX idx_mirrorbacks_constitutional ON mirrorbacks(constitutional_check_passed);

-- ============================================================================
-- ENGINE RUNS (Telemetry - I7, I13, I14 enforcement)
-- ============================================================================

-- Engine execution telemetry (I7: Mechanical metrics ONLY)
CREATE TABLE IF NOT EXISTS engine_runs (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    reflection_id TEXT REFERENCES reflections(id) ON DELETE SET NULL,
    
    -- Engine identification
    engine_version TEXT NOT NULL,
    constitution_hash TEXT NOT NULL,
    
    -- Execution metrics (I13: Mechanical performance only)
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Constitutional compliance metrics (I7, I13: Allowed)
    constitutional_checks_run INTEGER DEFAULT 0,
    constitutional_violations_detected INTEGER DEFAULT 0,
    violation_types TEXT,  -- JSON: List of violation types
    
    -- Language shapes detected (I14: No content, only counts)
    language_shapes_detected TEXT,  -- JSON: [{shape_id, count}]
    
    -- Model usage
    model_used TEXT,
    tokens_used INTEGER,
    
    -- Sync metadata (optional, Layer 3)
    sync_allowed BOOLEAN DEFAULT FALSE,
    sync_packet_id TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engine_runs_mirror ON engine_runs(mirror_id, created_at DESC);
CREATE INDEX idx_engine_runs_success ON engine_runs(mirror_id, success);
CREATE INDEX idx_engine_runs_violations ON engine_runs(constitutional_violations_detected);

-- ============================================================================
-- ENGINE FEEDBACK (User reports - I7, I13 enforcement)
-- ============================================================================

-- User feedback on engine behavior (I13: NOT behavioral optimization)
CREATE TABLE IF NOT EXISTS engine_feedback (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    engine_run_id TEXT REFERENCES engine_runs(id) ON DELETE SET NULL,
    mirrorback_id TEXT REFERENCES mirrorbacks(id) ON DELETE SET NULL,
    
    -- Feedback type (I13: Constitutional/mechanical only)
    feedback_type TEXT NOT NULL CHECK (feedback_type IN (
        'drift_detected',           -- System drifted from constitution
        'over_advice',              -- Gave advice when should reflect
        'under_reflection',         -- Didn't reflect deeply enough
        'tone_mismatch',            -- Tone felt wrong
        'constitutional_concern',   -- Possible I1-I14 violation
        'feature_request',          -- User wants new capability
        'regression_noticed'        -- System got worse after update
    )),
    
    -- FORBIDDEN: 'not_helpful', 'want_more_advice', 'need_goal_setting'
    
    -- Severity (I13: Resonance/fidelity/clarity framing)
    severity_self_rating INTEGER CHECK (severity_self_rating BETWEEN 1 AND 5),
    
    -- Context (I14: No raw content)
    feedback_text TEXT,  -- Max 500 chars, user's description
    context_snippet TEXT,  -- Very brief context, no identifying info
    
    -- Resolution tracking
    status TEXT DEFAULT 'reported' CHECK (status IN (
        'reported', 'reviewing', 'addressed', 'wont_fix', 'constitutional_violation'
    )),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engine_feedback_mirror ON engine_feedback(mirror_id, created_at DESC);
CREATE INDEX idx_engine_feedback_type ON engine_feedback(feedback_type);
CREATE INDEX idx_engine_feedback_status ON engine_feedback(status);

-- ============================================================================
-- EVOLUTION EVENTS (System changes - I4, I6 enforcement)
-- ============================================================================

-- Evolution history (I6: No regression without consent)
CREATE TABLE IF NOT EXISTS evolution_events (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- Event classification
    event_type TEXT NOT NULL CHECK (event_type IN (
        'constitution_update',      -- L0/L1 change (requires guardian approval)
        'prompt_modification',      -- L2 change (requires user consent)
        'config_adjustment',        -- L3 change (automatic, reversible)
        'user_rollback',           -- User reverted a change
        'fork_created'             -- User forked their Mirror
    )),
    
    -- Change details
    component TEXT NOT NULL,  -- What changed
    from_version TEXT,
    to_version TEXT,
    change_description TEXT,
    
    -- Constitutional compliance (I4: Community evolution)
    requires_consent BOOLEAN NOT NULL,
    user_consented BOOLEAN,
    consent_timestamp TIMESTAMP,
    
    -- Guardian approval (for L0/L1 changes only)
    requires_guardian_approval BOOLEAN DEFAULT FALSE,
    guardian_signatures TEXT,  -- JSON: List of guardian signatures
    guardian_threshold_met BOOLEAN,
    
    -- Reversibility (I6: Must have rollback path)
    reversible BOOLEAN NOT NULL,
    rollback_available BOOLEAN DEFAULT TRUE,
    rollback_instructions TEXT,
    
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rolled_back_at TIMESTAMP
);

CREATE INDEX idx_evolution_mirror ON evolution_events(mirror_id, applied_at DESC);
CREATE INDEX idx_evolution_type ON evolution_events(event_type);
CREATE INDEX idx_evolution_rollback ON evolution_events(mirror_id, rollback_available);

-- ============================================================================
-- CONSTITUTIONAL AUDIT LOG (I11: Historical integrity)
-- ============================================================================

-- Immutable log of all constitutional checks (I11: Never delete)
CREATE TABLE IF NOT EXISTS constitutional_audit (
    id TEXT PRIMARY KEY,
    mirror_id TEXT NOT NULL REFERENCES mirrors(id) ON DELETE CASCADE,
    
    -- What was checked
    check_type TEXT NOT NULL CHECK (check_type IN (
        'mirrorback_generation',
        'language_shape_detection',
        'telemetry_packet',
        'evolution_proposal',
        'export_bundle'
    )),
    
    -- Which invariants were checked
    invariants_checked TEXT NOT NULL,  -- JSON: List of invariant IDs (I1-I14)
    
    -- Results
    all_passed BOOLEAN NOT NULL,
    violations_detected TEXT,  -- JSON: List of violations
    severity TEXT CHECK (severity IN ('none', 'warning', 'violation', 'critical')),
    
    -- Context
    context_id TEXT,  -- ID of thing being checked (mirrorback_id, engine_run_id, etc)
    context_type TEXT,
    
    -- Immutable timestamp (I11: Historical integrity)
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_mirror ON constitutional_audit(mirror_id, checked_at DESC);
CREATE INDEX idx_audit_violations ON constitutional_audit(all_passed, severity);
CREATE INDEX idx_audit_type ON constitutional_audit(check_type);

-- ============================================================================
-- LAYER INTEGRITY VERIFICATION
-- ============================================================================

-- Verify Layer 1 independence: All tables must function without platform
-- No foreign keys to platform tables allowed
-- No required internet connectivity
-- All data owned by user (mirror_id scoping)

-- ============================================================================
-- CONSTITUTIONAL VERIFICATION TRIGGERS
-- ============================================================================

-- Trigger: Ensure all nodes belong to same mirror as edges reference
CREATE TRIGGER IF NOT EXISTS enforce_edge_mirror_locality
BEFORE INSERT ON mirror_edges
BEGIN
    SELECT CASE
        WHEN (SELECT mirror_id FROM mirror_nodes WHERE id = NEW.source_node_id) != NEW.mirror_id
        THEN RAISE(ABORT, 'I2 VIOLATION: Edge source_node belongs to different mirror')
        WHEN (SELECT mirror_id FROM mirror_nodes WHERE id = NEW.target_node_id) != NEW.mirror_id
        THEN RAISE(ABORT, 'I2 VIOLATION: Edge target_node belongs to different mirror')
    END;
END;

-- Trigger: Ensure language shape occurrences are identity-local
CREATE TRIGGER IF NOT EXISTS enforce_shape_occurrence_locality
BEFORE INSERT ON language_shape_occurrences
BEGIN
    SELECT CASE
        WHEN (SELECT mirror_id FROM language_shapes WHERE id = NEW.shape_id) !=
             (SELECT mirror_id FROM mirror_nodes WHERE id = NEW.node_id)
        THEN RAISE(ABORT, 'I2 VIOLATION: Language shape occurrence crosses mirror boundary')
    END;
END;

-- Trigger: Update mirror last_active_at on any activity
CREATE TRIGGER IF NOT EXISTS update_mirror_last_active
AFTER INSERT ON reflections
BEGIN
    UPDATE mirrors SET last_active_at = CURRENT_TIMESTAMP WHERE id = NEW.mirror_id;
END;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
