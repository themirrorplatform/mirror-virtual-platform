/**
 * Voting Interface - Democratic governance UI
 * 
 * Features:
 * - Proposal full display
 * - Three-button choice (Approve, Reject, Abstain)
 * - Optional comment
 * - Fork instead option (if supermajority fails)
 * - Confirmation dialog
 * - Vote history
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  GitFork,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  MessageSquare
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type VoteChoice = 'approve' | 'reject' | 'abstain';
export type ProposalStatus = 'draft' | 'voting' | 'passed' | 'rejected' | 'implemented' | 'vetoed';

interface Proposal {
  id: string;
  title: string;
  description: string;
  fullText: string;
  rationale: string;
  proposer: string;
  createdAt: Date;
  votingDeadline: Date;
  status: ProposalStatus;
  votes: {
    approve: number;
    reject: number;
    abstain: number;
  };
  totalVoters: number;
  requiresSuperMajority: boolean;
  userVote?: VoteChoice;
  userComment?: string;
}

interface VotingInterfaceProps {
  proposal: Proposal;
  onVote: (proposalId: string, choice: VoteChoice, comment?: string) => void;
  onFork?: (proposalId: string) => void;
  onClose?: () => void;
  canVote?: boolean;
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#64748B', variant: 'secondary' as const },
  voting: { label: 'Voting', color: '#3B82F6', variant: 'primary' as const },
  passed: { label: 'Passed', color: '#10B981', variant: 'success' as const },
  rejected: { label: 'Rejected', color: '#EF4444', variant: 'error' as const },
  implemented: { label: 'Implemented', color: '#10B981', variant: 'success' as const },
  vetoed: { label: 'Vetoed', color: '#EF4444', variant: 'error' as const },
};

export function VotingInterface({
  proposal,
  onVote,
  onFork,
  onClose,
  canVote = true,
}: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(proposal.userVote || null);
  const [comment, setComment] = useState(proposal.userComment || '');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const statusConfig = STATUS_CONFIG[proposal.status];
  const timeRemaining = getTimeRemaining(proposal.votingDeadline);
  const votePercentages = calculatePercentages(proposal.votes, proposal.totalVoters);
  const hasVoted = !!proposal.userVote;
  const isVotingOpen = proposal.status === 'voting' && new Date() < proposal.votingDeadline;

  const handleVoteClick = (choice: VoteChoice) => {
    if (!canVote || !isVotingOpen || hasVoted) return;
    setSelectedVote(choice);
    setShowConfirmation(true);
  };

  const handleConfirmVote = () => {
    if (!selectedVote) return;
    onVote(proposal.id, selectedVote, comment || undefined);
    setShowConfirmation(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2>{proposal.title}</h2>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                  {hasVoted && (
                    <Badge variant="success">
                      <CheckCircle size={12} className="mr-1" />
                      You Voted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {proposal.description}
                </p>
              </div>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              )}
            </div>

            {/* Voting Deadline */}
            {isVotingOpen && (
              <Card>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-[var(--color-border-warning)]" />
                  <div>
                    <p className="text-sm font-medium">
                      {timeRemaining.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Voting closes {proposal.votingDeadline.toLocaleDateString()} at {proposal.votingDeadline.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Vote Counts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-[var(--color-text-muted)]" />
                <h4 className="text-sm font-medium">Current Results</h4>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {proposal.totalVoters} voters
                </span>
              </div>

              <div className="space-y-2">
                <VoteBar
                  label="Approve"
                  count={proposal.votes.approve}
                  percentage={votePercentages.approve}
                  color="#10B981"
                  icon={<ThumbsUp size={16} />}
                  isUserVote={proposal.userVote === 'approve'}
                />
                <VoteBar
                  label="Reject"
                  count={proposal.votes.reject}
                  percentage={votePercentages.reject}
                  color="#EF4444"
                  icon={<ThumbsDown size={16} />}
                  isUserVote={proposal.userVote === 'reject'}
                />
                <VoteBar
                  label="Abstain"
                  count={proposal.votes.abstain}
                  percentage={votePercentages.abstain}
                  color="#64748B"
                  icon={<Minus size={16} />}
                  isUserVote={proposal.userVote === 'abstain'}
                />
              </div>

              {proposal.requiresSuperMajority && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  ⚠️ Requires {'>'}66% approval (supermajority)
                </p>
              )}
            </div>

            {/* Rationale */}
            <div>
              <h4 className="text-sm font-medium mb-2">Rationale</h4>
              <Card>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {proposal.rationale}
                </p>
              </Card>
            </div>

            {/* Full Text */}
            <div>
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent-blue)] hover:underline mb-2"
              >
                {showFullText ? 'Hide' : 'Show'} Full Proposal Text
                <motion.div
                  animate={{ rotate: showFullText ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.div>
              </button>

              <AnimatePresence>
                {showFullText && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <Card className="max-h-64 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                          {proposal.fullText}
                        </pre>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voting Buttons */}
            {isVotingOpen && canVote && !hasVoted && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <VoteButton
                    choice="approve"
                    label="Approve"
                    icon={<ThumbsUp size={20} />}
                    color="#10B981"
                    selected={selectedVote === 'approve'}
                    onClick={() => handleVoteClick('approve')}
                  />
                  <VoteButton
                    choice="reject"
                    label="Reject"
                    icon={<ThumbsDown size={20} />}
                    color="#EF4444"
                    selected={selectedVote === 'reject'}
                    onClick={() => handleVoteClick('reject')}
                  />
                  <VoteButton
                    choice="abstain"
                    label="Abstain"
                    icon={<Minus size={20} />}
                    color="#64748B"
                    selected={selectedVote === 'abstain'}
                    onClick={() => handleVoteClick('abstain')}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MessageSquare size={14} />
                    Optional Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setComment(e.target.value)}
                    placeholder="Explain your vote (visible to all voters)"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Fork Option */}
            {onFork && proposal.status === 'rejected' && (
              <Card className="border-2 border-[var(--color-accent-blue)]">
                <div className="flex items-start gap-3">
                  <GitFork size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-1">Fork Instead?</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                      This proposal didn't reach consensus. You can create a constitutional fork 
                      with these rules for your own instance.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onFork(proposal.id)}
                      className="flex items-center gap-2"
                    >
                      <GitFork size={14} />
                      Create Fork
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-6 text-xs text-[var(--color-text-muted)] pt-4 border-t border-[var(--color-border-subtle)]">
              <div>Proposed by <strong>{proposal.proposer}</strong></div>
              <div>Created {proposal.createdAt.toLocaleDateString()}</div>
            </div>

            {/* Info */}
            <Card>
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <strong>Constitutional governance is binding.</strong> Passed proposals become 
                  part of the Mirror's core rules. Guardians can veto proposals that violate 
                  core invariants. You can abstain if you need more information.
                </p>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedVote && (
          <VoteConfirmationModal
            choice={selectedVote}
            comment={comment}
            onConfirm={handleConfirmVote}
            onCancel={() => setShowConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface VoteBarProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  isUserVote?: boolean;
}

function VoteBar({ label, count, percentage, color, icon, isUserVote }: VoteBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <span className="text-sm font-medium">{label}</span>
          {isUserVote && (
            <Badge variant="success" size="sm">Your vote</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">{count}</span>
          <span className="text-sm font-medium" style={{ color }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface VoteButtonProps {
  choice: VoteChoice;
  label: string;
  icon: React.ReactNode;
  color: string;
  selected: boolean;
  onClick: () => void;
}

function VoteButton({ label, icon, color, selected, onClick }: VoteButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl border-2 transition-all"
      style={{
        borderColor: selected ? color : 'var(--color-border-subtle)',
        backgroundColor: selected ? `${color}10` : 'var(--color-surface-card)',
        color: selected ? color : 'var(--color-text-secondary)',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </motion.button>
  );
}

interface VoteConfirmationModalProps {
  choice: VoteChoice;
  comment: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function VoteConfirmationModal({ choice, comment, onConfirm, onCancel }: VoteConfirmationModalProps) {
  const choiceConfig = {
    approve: { label: 'Approve', icon: <ThumbsUp size={24} />, color: '#10B981' },
    reject: { label: 'Reject', icon: <ThumbsDown size={24} />, color: '#EF4444' },
    abstain: { label: 'Abstain', icon: <Minus size={24} />, color: '#64748B' },
  }[choice];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-xl"
                style={{ color: choiceConfig.color, backgroundColor: `${choiceConfig.color}20` }}
              >
                {choiceConfig.icon}
              </div>
              <div>
                <h3>Confirm Your Vote</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  You are voting to <strong style={{ color: choiceConfig.color }}>
                    {choiceConfig.label}
                  </strong> this proposal
                </p>
              </div>
            </div>

            {comment && (
              <Card>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Your comment:</p>
                <p className="text-sm text-[var(--color-text-secondary)]">"{comment}"</p>
              </Card>
            )}

            <Card className="border-2 border-[var(--color-border-warning)]">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-[var(--color-border-warning)] mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <strong>Votes are permanent and public.</strong> You cannot change your vote 
                  after submission. All votes are recorded in the governance log.
                </p>
              </div>
            </Card>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={onConfirm}
                className="flex-1"
                style={{ backgroundColor: choiceConfig.color }}
              >
                Confirm Vote
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Utility Functions

function getTimeRemaining(deadline: Date): { label: string; urgent: boolean } {
  const ms = deadline.getTime() - Date.now();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 7) return { label: `${days} days remaining`, urgent: false };
  if (days > 0) return { label: `${days} day${days !== 1 ? 's' : ''} remaining`, urgent: true };
  if (hours > 0) return { label: `${hours} hour${hours !== 1 ? 's' : ''} remaining`, urgent: true };
  return { label: 'Voting closes soon!', urgent: true };
}

function calculatePercentages(votes: { approve: number; reject: number; abstain: number }, total: number) {
  if (total === 0) return { approve: 0, reject: 0, abstain: 0 };
  
  return {
    approve: Math.round((votes.approve / total) * 100),
    reject: Math.round((votes.reject / total) * 100),
    abstain: Math.round((votes.abstain / total) * 100),
  };
}

export type { Proposal };



