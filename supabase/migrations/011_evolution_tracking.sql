-- Migration: Add Evolution Tracking Tables
-- Description: Add engine_runs and engine_feedback tables for MirrorCore evolution system
-- Date: 2025-12-13

-- Engine runs table for tracking reflection generation performance
CREATE TABLE IF NOT EXISTS engine_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
    config_version TEXT NOT NULL,
    engine_mode TEXT NOT NULL CHECK (engine_mode IN ('local_llm', 'remote_llm', 'manual')),
    patterns JSONB DEFAULT '{}'::jsonb,
    tensions_surfaced JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER NOT NULL,
    constitutional_flags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engine feedback table for user ratings and improvement signals
CREATE TABLE IF NOT EXISTS engine_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rating', 'flag', 'comment', 'helpful', 'unhelpful')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engine_runs_reflection ON engine_runs(reflection_id);
CREATE INDEX IF NOT EXISTS idx_engine_runs_created ON engine_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engine_runs_mode ON engine_runs(engine_mode);

CREATE INDEX IF NOT EXISTS idx_engine_feedback_reflection ON engine_feedback(reflection_id);
CREATE INDEX IF NOT EXISTS idx_engine_feedback_user ON engine_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_engine_feedback_created ON engine_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engine_feedback_type ON engine_feedback(feedback_type);

-- Row Level Security
ALTER TABLE engine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for engine_runs
CREATE POLICY "Users can view their own engine runs"
    ON engine_runs FOR SELECT
    USING (
        reflection_id IN (
            SELECT id FROM reflections WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert engine runs"
    ON engine_runs FOR INSERT
    WITH CHECK (true);

-- Policies for engine_feedback
CREATE POLICY "Users can view their own feedback"
    ON engine_feedback FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback"
    ON engine_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback"
    ON engine_feedback FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own feedback"
    ON engine_feedback FOR DELETE
    USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE engine_runs IS 'Tracks MirrorCore reflection generation performance and constitutional compliance';
COMMENT ON TABLE engine_feedback IS 'Captures user feedback on reflection quality for evolution system';

COMMENT ON COLUMN engine_runs.config_version IS 'MirrorCore version used for generation';
COMMENT ON COLUMN engine_runs.engine_mode IS 'Mode: local_llm (Ollama), remote_llm (Claude/OpenAI), or manual';
COMMENT ON COLUMN engine_runs.patterns IS 'Detected patterns in user input';
COMMENT ON COLUMN engine_runs.tensions_surfaced IS 'Semantic tensions identified';
COMMENT ON COLUMN engine_runs.duration_ms IS 'Generation time in milliseconds';
COMMENT ON COLUMN engine_runs.constitutional_flags IS 'Constitutional compliance check results';

COMMENT ON COLUMN engine_feedback.feedback_type IS 'Type: rating (1-5), flag (report), comment, helpful, unhelpful';
COMMENT ON COLUMN engine_feedback.rating IS 'Numeric rating 1-5 (optional, only for rating type)';
COMMENT ON COLUMN engine_feedback.comment IS 'User comment or explanation';
