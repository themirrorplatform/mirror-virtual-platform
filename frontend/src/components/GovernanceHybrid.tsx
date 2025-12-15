/**
 * Governance - Hybrid Implementation
 * 
 * Figma's governance UI + Our Multi-Guardian backend
 * Community amendments + Guardian threshold signatures
 */

import { useState, useEffect } from 'react';
import { Scale, Users, CheckCircle, XCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown, Shield } from 'lucide-react';
import axios from 'axios';

type ProposalStatus = 'active' | 'approved' | 'rejected' | 'pending';
type VotePosition = 'approve' | 'reject' | null;

interface Proposal {
  proposal_id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  required_approvals: number;
  current_approvals: number;
  guardian_votes: Array<{
    guardian_id: string;
    vote: 'approve' | 'reject';
    signature: string;
    timestamp: string;
  }>;
  created_at: string;
  expires_at: string;
  category: 'constitutional' | 'guardian' | 'update' | 'policy';
}

interface Guardian {
  guardian_id: string;
  name: string;
  public_key: string;
  active: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function GovernanceHybrid() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [userIsGuardian, setUserIsGuardian] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load proposals and guardians in parallel
      const [proposalsRes, guardiansRes] = await Promise.all([
        axios.get<{ proposals: Proposal[] }>(`${API_BASE}/api/governance/proposals`),
        axios.get<{ guardians: Guardian[] }>(`${API_BASE}/api/governance/guardians`),
      ]);

      setProposals(proposalsRes.data.proposals);
      setGuardians(guardiansRes.data.guardians);
      
      // Check if current user is a guardian (simplified for now)
      // In production, check against actual user's public key
      setUserIsGuardian(guardiansRes.data.guardians.length > 0);
    } catch (err: any) {
      console.error('Failed to load governance data:', err);
      setError(err.response?.data?.detail || 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'approve' | 'reject') => {
    if (!userIsGuardian) {
      alert('Only guardians can vote on proposals');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/governance/proposals/${proposalId}/vote`, {
        vote,
        guardian_signature: 'mock_signature', // In production, use Ed25519 signature
      });

      // Reload proposals to get updated state
      await loadGovernanceData();
    } catch (err: any) {
      console.error('Failed to submit vote:', err);
      alert(err.response?.data?.detail || 'Failed to submit vote');
    }
  };

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-[var(--color-accent-blue)]" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-[var(--color-accent-green)]" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-[var(--color-error)]" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-[var(--color-warning)]" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      constitutional: 'var(--color-accent-gold)',
      guardian: 'var(--color-accent-violet)',
      update: 'var(--color-accent-blue)',
      policy: 'var(--color-accent-cyan)',
    };
    return colors[category] || 'var(--color-text-muted)';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--color-text-muted)]">Loading governance data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-3" />
          <div className="text-[var(--color-error)] mb-2">{error}</div>
          <button
            onClick={loadGovernanceData}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-black hover:bg-[var(--color-accent-gold-deep)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-[var(--color-accent-gold)]" />
            <h1 className="text-3xl font-serif text-[var(--color-text-primary)]">Multi-Guardian Governance</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            3-of-5 threshold signatures required for all constitutional changes
          </p>
        </div>

        {/* Guardian Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-accent-violet)/20' }}>
                <Shield className="w-6 h-6 text-[var(--color-accent-violet)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Active Guardians</p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {guardians.filter(g => g.active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-accent-blue)/20' }}>
                <Clock className="w-6 h-6 text-[var(--color-accent-blue)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Active Proposals</p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {proposals.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-accent-green)/20' }}>
                <CheckCircle className="w-6 h-6 text-[var(--color-accent-green)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Approved</p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
                  {proposals.filter(p => p.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.proposal_id}
              className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-6 hover:border-[var(--color-border-emphasis)] transition-colors cursor-pointer"
              onClick={() => setSelectedProposal(proposal)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(proposal.status)}
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{proposal.title}</h3>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${getCategoryColor(proposal.category)}20`,
                    color: getCategoryColor(proposal.category),
                  }}
                >
                  {proposal.category}
                </span>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                {proposal.description}
              </p>

              {/* Threshold Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--color-text-muted)]">
                    Threshold: {proposal.current_approvals}/{proposal.required_approvals}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {Math.round((proposal.current_approvals / proposal.required_approvals) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--color-base-sunken)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent-gold)] transition-all"
                    style={{
                      width: `${Math.min((proposal.current_approvals / proposal.required_approvals) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Vote Buttons (only for guardians and active proposals) */}
              {userIsGuardian && proposal.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(proposal.proposal_id, 'approve');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-green)] text-white hover:opacity-90 transition-opacity text-sm"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(proposal.proposal_id, 'reject');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-emphasis)] transition-colors text-sm"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                <span>Proposed by {proposal.proposer}</span>
                <span>Expires {new Date(proposal.expires_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {proposals.length === 0 && (
          <div className="text-center py-12">
            <Scale className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--color-text-muted)]">No active proposals</p>
          </div>
        )}
      </div>

      {/* Proposal Detail Modal (if selected) */}
      {selectedProposal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="bg-[var(--color-surface-card)] border border-[var(--color-border-emphasis)] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-serif text-[var(--color-text-primary)]">{selectedProposal.title}</h2>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-[var(--color-text-secondary)] mb-6">{selectedProposal.description}</p>

            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">Guardian Votes</h3>
              {selectedProposal.guardian_votes.map((vote) => (
                <div
                  key={vote.guardian_id}
                  className="flex items-center justify-between p-3 bg-[var(--color-base-default)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[var(--color-accent-violet)]" />
                    <span className="text-sm text-[var(--color-text-primary)]">{vote.guardian_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vote.vote === 'approve' ? (
                      <CheckCircle className="w-4 h-4 text-[var(--color-accent-green)]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--color-error)]" />
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(vote.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
