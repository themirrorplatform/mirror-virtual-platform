/**
 * Governance Instrument
 * Participate in constitutional evolution
 * Constitutional: user voice in system rules
 */

import { motion } from 'framer-motion';
import { Scale, ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: Date;
  status: 'active' | 'passed' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  userVote?: 'for' | 'against';
  discussionCount: number;
  category: 'principle' | 'boundary' | 'transparency' | 'license' | 'crisis';
}

interface GovernanceInstrumentProps {
  onComplete: (proposal: any) => void;
  onDismiss: () => void;
}

export function GovernanceInstrument({
  onComplete,
  onDismiss,
}: GovernanceInstrumentProps) {
  const proposals: Proposal[] = [];
  const userCanPropose = true;
  const [proposing, setProposing] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'principle' as Proposal['category'],
  });

  const activeProposals = proposals.filter(p => p.status === 'active');
  const resolvedProposals = proposals.filter(p => p.status !== 'active');

  const handlePropose = () => {
    if (newProposal.title && newProposal.description) {
      onPropose(newProposal.title, newProposal.description, newProposal.category);
      setProposing(false);
      setNewProposal({ title: '', description: '', category: 'principle' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-5xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-gold)]/20 flex items-center justify-center">
                <Scale size={24} className="text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Constitutional Governance</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Voice in how Mirror evolves</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Constitutional:</strong> Users shape Mirror's evolution. Your vote matters. Proposals must align with core principles.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Active Proposals ({activeProposals.length})</h3>
              {userCanPropose && !proposing && (
                <button
                  onClick={() => setProposing(true)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] text-sm"
                >
                  Propose Change
                </button>
              )}
            </div>

            {proposing && (
              <div className="mb-6 p-6 rounded-xl border-2 border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5">
                <h4 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">New Proposal</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['principle', 'boundary', 'transparency', 'license', 'crisis'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNewProposal({ ...newProposal, category: cat as Proposal['category'] })}
                          className={`p-3 rounded-lg border-2 capitalize transition-all ${
                            newProposal.category === cat
                              ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10'
                              : 'border-[var(--color-border-subtle)]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Title</label>
                    <input
                      type="text"
                      value={newProposal.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProposal({ ...newProposal, title: e.target.value })}
                      placeholder="Concise proposal title"
                      className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Description</label>
                    <textarea
                      value={newProposal.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewProposal({ ...newProposal, description: e.target.value })}
                      placeholder="Explain the change and why it matters"
                      rows={4}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setProposing(false);
                        setNewProposal({ title: '', description: '', category: 'principle' });
                      }}
                      className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePropose}
                      disabled={!newProposal.title || !newProposal.description}
                      className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                    >
                      Submit Proposal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeProposals.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">
                <Scale size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
                <p className="text-[var(--color-text-muted)]">No active proposals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} onVote={onVote} onDiscuss={onDiscuss} />
                ))}
              </div>
            )}
          </div>

          {resolvedProposals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Resolved</h3>
              <div className="space-y-2">
                {resolvedProposals.slice(0, 5).map((proposal) => (
                  <div
                    key={proposal.id}
                    className={`p-4 rounded-xl border ${
                      proposal.status === 'passed'
                        ? 'border-green-400/30 bg-green-500/5'
                        : 'border-red-400/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {proposal.status === 'passed' ? (
                            <CheckCircle size={18} className="text-green-400" />
                          ) : (
                            <X size={18} className="text-red-400" />
                          )}
                          <span className={`font-semibold ${proposal.status === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
                            {proposal.status === 'passed' ? 'Passed' : 'Rejected'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{proposal.title}</h4>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {proposal.votesFor} for / {proposal.votesAgainst} against
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onVote,
  onDiscuss,
}: {
  proposal: Proposal;
  onVote: (id: string, vote: 'for' | 'against') => void;
  onDiscuss: (id: string) => void;
}) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

  return (
    <div className="p-6 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] capitalize">
              {proposal.category}
            </span>
            <h4 className="text-lg font-semibold mt-2 text-[var(--color-text-primary)]">{proposal.title}</h4>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">{proposal.description}</p>
        <div className="text-xs text-[var(--color-text-muted)]">
          Proposed by {proposal.proposer} • {proposal.createdAt.toLocaleDateString()}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-green-400">{proposal.votesFor} for</span>
          <span className="text-red-400">{proposal.votesAgainst} against</span>
        </div>
        <div className="h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden flex">
          <div
            className="bg-green-400 transition-all"
            style={{ width: `${forPercentage}%` }}
          />
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${100 - forPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {!proposal.userVote ? (
          <>
            <button
              onClick={() => onVote(proposal.id, 'for')}
              className="flex-1 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ThumbsUp size={16} />
              Vote For
            </button>
            <button
              onClick={() => onVote(proposal.id, 'against')}
              className="flex-1 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ThumbsDown size={16} />
              Vote Against
            </button>
          </>
        ) : (
          <div className={`flex-1 px-4 py-2 rounded-xl text-center ${proposal.userVote === 'for' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            You voted {proposal.userVote}
          </div>
        )}
        <button
          onClick={() => onDiscuss(proposal.id)}
          className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 flex items-center gap-2"
        >
          <MessageSquare size={16} />
          {proposal.discussionCount}
        </button>
      </div>
    </div>
  );
}


