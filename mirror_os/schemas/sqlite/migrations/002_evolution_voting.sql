-- Migration 002: Add voting support to evolution_proposals
-- Adds vote tracking columns for democratic evolution

-- Add voting columns to evolution_proposals
ALTER TABLE evolution_proposals ADD COLUMN votes_for INTEGER DEFAULT 0;
ALTER TABLE evolution_proposals ADD COLUMN votes_against INTEGER DEFAULT 0;
ALTER TABLE evolution_proposals ADD COLUMN votes_abstain INTEGER DEFAULT 0;
ALTER TABLE evolution_proposals ADD COLUMN total_vote_weight REAL DEFAULT 0.0;
ALTER TABLE evolution_proposals ADD COLUMN consensus_threshold REAL DEFAULT 0.67;
ALTER TABLE evolution_proposals ADD COLUMN voting_ends_at TEXT;
ALTER TABLE evolution_proposals ADD COLUMN proposer_identity_id TEXT;
ALTER TABLE evolution_proposals ADD COLUMN content TEXT;  -- New column for proposal content

-- Create evolution_votes table
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

-- Create evolution_versions table
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
