-- ============================================================================
-- MIRRORX COMPLETE DATABASE SETUP FOR SUPABASE
-- ============================================================================
-- Run this entire file in your Supabase SQL Editor
-- This creates all tables, indexes, functions, and triggers needed for MirrorX

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON mx_users(email);

-- ============================================================================
-- REFLECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  conversation_id UUID,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON mx_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_conversation_id ON mx_reflections(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON mx_reflections(created_at DESC);

-- ============================================================================
-- MIRRORBACKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_mirrorbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id UUID NOT NULL REFERENCES mx_reflections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  conversation_id UUID,
  mirrorback TEXT NOT NULL,
  tone TEXT,
  lint_passed BOOLEAN DEFAULT TRUE,
  lint_violations TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(reflection_id)
);

CREATE INDEX IF NOT EXISTS idx_mirrorbacks_reflection_id ON mx_mirrorbacks(reflection_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_user_id ON mx_mirrorbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_conversation_id ON mx_mirrorbacks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mirrorbacks_created_at ON mx_mirrorbacks(created_at DESC);

-- ============================================================================
-- IDENTITY SNAPSHOTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_identity_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  
  -- Core identity patterns
  tensions TEXT[] DEFAULT ARRAY[]::TEXT[],
  paradoxes TEXT[] DEFAULT ARRAY[]::TEXT[],
  goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  recurring_loops TEXT[] DEFAULT ARRAY[]::TEXT[],
  regressions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_reflections TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Current state summaries
  dominant_tension TEXT,
  big_question TEXT,
  emotional_baseline TEXT,
  oscillation_pattern TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_snapshots_user_id ON mx_identity_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_snapshots_updated_at ON mx_identity_snapshots(updated_at DESC);

-- ============================================================================
-- CONDUCTOR BUNDLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_conductor_bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  reflection_id UUID NOT NULL REFERENCES mx_reflections(id) ON DELETE CASCADE,
  
  -- Full orchestrator bundle stored as JSONB
  bundle JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(reflection_id)
);

CREATE INDEX IF NOT EXISTS idx_conductor_bundles_user_id ON mx_conductor_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_conductor_bundles_reflection_id ON mx_conductor_bundles(reflection_id);
CREATE INDEX IF NOT EXISTS idx_conductor_bundles_created_at ON mx_conductor_bundles(created_at DESC);

-- ============================================================================
-- IDENTITY GRAPH NODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  
  node_type TEXT NOT NULL, -- 'tension', 'goal', 'loop', 'paradox', 'belief'
  content TEXT NOT NULL,
  
  -- Graph metadata
  strength FLOAT DEFAULT 1.0,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_user_id ON mx_graph_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON mx_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_strength ON mx_graph_nodes(strength DESC);

-- ============================================================================
-- GRAPH EDGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  
  source_node_id UUID NOT NULL REFERENCES mx_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES mx_graph_nodes(id) ON DELETE CASCADE,
  
  edge_type TEXT NOT NULL, -- 'reinforces', 'contradicts', 'leads_to', 'blocks'
  weight FLOAT DEFAULT 1.0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_node_id, target_node_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON mx_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON mx_graph_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_user_id ON mx_graph_edges(user_id);

-- ============================================================================
-- IDENTITY DELTAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_identity_deltas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  reflection_id UUID NOT NULL REFERENCES mx_reflections(id) ON DELETE CASCADE,
  
  -- Delta content
  new_tensions TEXT[] DEFAULT ARRAY[]::TEXT[],
  resolved_tensions TEXT[] DEFAULT ARRAY[]::TEXT[],
  new_paradoxes TEXT[] DEFAULT ARRAY[]::TEXT[],
  new_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  new_loops TEXT[] DEFAULT ARRAY[]::TEXT[],
  new_regressions TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  applied BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_deltas_user_id ON mx_identity_deltas(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_deltas_reflection_id ON mx_identity_deltas(reflection_id);
CREATE INDEX IF NOT EXISTS idx_identity_deltas_created_at ON mx_identity_deltas(created_at DESC);

-- ============================================================================
-- EVOLUTION EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_evolution_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES mx_users(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES mx_reflections(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'growth', 'stagnation', 'loop', 'regression', 'breakthrough', 'blind_spot'
  description TEXT NOT NULL,
  
  -- Related identity elements
  related_tensions TEXT[] DEFAULT ARRAY[]::TEXT[],
  related_loops TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  significance FLOAT DEFAULT 1.0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_events_user_id ON mx_evolution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_events_type ON mx_evolution_events(event_type);
CREATE INDEX IF NOT EXISTS idx_evolution_events_created_at ON mx_evolution_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evolution_events_significance ON mx_evolution_events(significance DESC);

-- ============================================================================
-- ROUTER CONFIGURATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mx_router_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES mx_users(id) ON DELETE CASCADE,
  
  preferred_model TEXT,
  offline_only BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_router_config_user_id ON mx_router_config(user_id);

-- ============================================================================
-- STORED PROCEDURES & FUNCTIONS
-- ============================================================================

-- Function: Apply Identity Delta
CREATE OR REPLACE FUNCTION apply_identity_delta(
  p_user_id UUID,
  p_new_tensions TEXT[],
  p_resolved_tensions TEXT[],
  p_new_paradoxes TEXT[],
  p_new_goals TEXT[],
  p_new_loops TEXT[],
  p_new_regressions TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update identity snapshot
  INSERT INTO mx_identity_snapshots (user_id, tensions, paradoxes, goals, recurring_loops, regressions, updated_at)
  VALUES (
    p_user_id,
    p_new_tensions,
    p_new_paradoxes,
    p_new_goals,
    p_new_loops,
    p_new_regressions,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tensions = COALESCE(
      ARRAY(
        SELECT DISTINCT unnest(
          array_cat(
            array_remove(mx_identity_snapshots.tensions, ANY(p_resolved_tensions)),
            p_new_tensions
          )
        )
      ),
      ARRAY[]::TEXT[]
    ),
    paradoxes = COALESCE(
      ARRAY(
        SELECT DISTINCT unnest(array_cat(mx_identity_snapshots.paradoxes, p_new_paradoxes))
      ),
      ARRAY[]::TEXT[]
    ),
    goals = COALESCE(
      ARRAY(
        SELECT DISTINCT unnest(array_cat(mx_identity_snapshots.goals, p_new_goals))
      ),
      ARRAY[]::TEXT[]
    ),
    recurring_loops = COALESCE(
      ARRAY(
        SELECT DISTINCT unnest(array_cat(mx_identity_snapshots.recurring_loops, p_new_loops))
      ),
      ARRAY[]::TEXT[]
    ),
    regressions = COALESCE(
      ARRAY(
        SELECT DISTINCT unnest(array_cat(mx_identity_snapshots.regressions, p_new_regressions))
      ),
      ARRAY[]::TEXT[]
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Get User History
CREATE OR REPLACE FUNCTION get_user_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  reflection_id UUID,
  conversation_id UUID,
  reflection_text TEXT,
  mirrorback_text TEXT,
  tone TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS reflection_id,
    r.conversation_id,
    r.text AS reflection_text,
    m.mirrorback AS mirrorback_text,
    m.tone,
    r.created_at
  FROM mx_reflections r
  LEFT JOIN mx_mirrorbacks m ON r.id = m.reflection_id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Evolution Timeline
CREATE OR REPLACE FUNCTION get_evolution_timeline(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  description TEXT,
  significance FLOAT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id AS event_id,
    event_type,
    description,
    significance,
    created_at
  FROM mx_evolution_events
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mx_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_mirrorbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_identity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_conductor_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_identity_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_evolution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mx_router_config ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own user record"
  ON mx_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view own reflections"
  ON mx_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
  ON mx_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mirrorbacks"
  ON mx_mirrorbacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own identity"
  ON mx_identity_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own evolution events"
  ON mx_evolution_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend API)
CREATE POLICY "Service role full access to reflections"
  ON mx_reflections FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to mirrorbacks"
  ON mx_mirrorbacks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to identity"
  ON mx_identity_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to conductor bundles"
  ON mx_conductor_bundles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to graph nodes"
  ON mx_graph_nodes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to graph edges"
  ON mx_graph_edges FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to identity deltas"
  ON mx_identity_deltas FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to evolution events"
  ON mx_evolution_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON mx_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identity_snapshots_updated_at
  BEFORE UPDATE ON mx_identity_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_nodes_updated_at
  BEFORE UPDATE ON mx_graph_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_edges_updated_at
  BEFORE UPDATE ON mx_graph_edges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Create a demo user (optional - remove in production)
-- INSERT INTO mx_users (id, email, display_name)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'demo@mirrorx.app', 'Demo User')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after setup to verify everything worked:

-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'mx_%';
-- SELECT proname FROM pg_proc WHERE proname IN ('apply_identity_delta', 'get_user_history', 'get_evolution_timeline');
-- SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE 'mx_%';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- All MirrorX tables, functions, policies, and triggers are now created!
-- 
-- Next steps:
-- 1. Get your Supabase URL and keys from the Settings > API page
-- 2. Update your .env file with SUPABASE_URL and SUPABASE_KEY
-- 3. Test the connection by running the backend
-- 4. Check that tables appear in Supabase Table Editor
