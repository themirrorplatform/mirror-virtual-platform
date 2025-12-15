/**
 * Proposal Card - Compact governance proposal display
 * 
 * Features:
 * - Title, description, rationale preview
 * - Vote counts with percentage bars
 * - Status badge (draft, voting, passed, rejected, etc.)
 * - Voting deadline countdown
 * - "Read full text" expand/link
 * - Vote now CTA
 */

import { motion } from 'motion/react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  Clock,
  Users,
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';
import type { ProposalStatus, VoteChoice } from './VotingInterface';

interface ProposalCardData {
  id: string;
  title: string;
  description: string;
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
}

interface ProposalCardProps {
  proposal: ProposalCardData;
  onViewDetails: (proposalId: string) => void;
  onVote?: (proposalId: string) => void;
  compact?: boolean;
}

const STATUS_CONFIG = {
  draft: { 
    label: 'Draft', 
    color: '#64748B', 
    variant: 'secondary' as const,
    icon: <FileText size={16} />
  },
  voting: { 
    label: 'Voting', 
    color: '#3B82F6', 
    variant: 'primary' as const,
    icon: <Clock size={16} />
  },
  passed: { 
    label: 'Passed', 
    color: '#10B981', 
    variant: 'success' as const,
    icon: <CheckCircle size={16} />
  },
  rejected: { 
    label: 'Rejected', 
    color: '#EF4444', 
    variant: 'error' as const,
    icon: <XCircle size={16} />
  },
  implemented: { 
    label: 'Implemented', 
    color: '#10B981', 
    variant: 'success' as const,
    icon: <CheckCircle size={16} />
  },
  vetoed: { 
    label: 'Vetoed', 
    color: '#EF4444', 
    variant: 'error' as const,
    icon: <AlertCircle size={16} />
  },
};

export function ProposalCard({
  proposal,
  onViewDetails,
  onVote,
  compact = false,
}: ProposalCardProps) {
  const statusConfig = STATUS_CONFIG[proposal.status];
  const timeRemaining = getTimeRemaining(proposal.votingDeadline);
  const votePercentages = calculatePercentages(proposal.votes, proposal.totalVoters);
  const isVotingOpen = proposal.status === 'voting' && new Date() < proposal.votingDeadline;
  const hasVoted = !!proposal.userVote;

  return (
    <motion.div
      whileHover={{ scale: compact ? 1 : 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer transition-shadow hover:shadow-lg"
        onClick={() => onViewDetails(proposal.id)}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{proposal.title}</h4>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
                {hasVoted && (
                  <Badge variant="success" size="sm">
                    Voted
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {proposal.description}
              </p>
            </div>
            <ChevronRight size={20} className="text-[var(--color-text-muted)] flex-shrink-0" />
          </div>

          {/* Voting Deadline */}
          {isVotingOpen && (
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: timeRemaining.urgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <Clock 
                size={16} 
                style={{ color: timeRemaining.urgent ? '#EF4444' : '#F59E0B' }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: timeRemaining.urgent ? '#EF4444' : '#F59E0B' }}
              >
                {timeRemaining.label}
              </span>
            </div>
          )}

          {/* Vote Counts */}
          {!compact && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                <Users size={14} />
                <span>{proposal.totalVoters} voters</span>
                {proposal.requiresSuperMajority && (
                  <span>• Requires 66%+ approval</span>
                )}
              </div>

              <div className="space-y-1.5">
                <MiniVoteBar
                  label="Approve"
                  percentage={votePercentages.approve}
                  color="#10B981"
                  isUserVote={proposal.userVote === 'approve'}
                />
                <MiniVoteBar
                  label="Reject"
                  percentage={votePercentages.reject}
                  color="#EF4444"
                  isUserVote={proposal.userVote === 'reject'}
                />
                <MiniVoteBar
                  label="Abstain"
                  percentage={votePercentages.abstain}
                  color="#64748B"
                  isUserVote={proposal.userVote === 'abstain'}
                />
              </div>
            </div>
          )}

          {/* Compact Vote Summary */}
          {compact && proposal.totalVoters > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <ThumbsUp size={12} className="text-[#10B981]" />
                <span>{votePercentages.approve}%</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown size={12} className="text-[#EF4444]" />
                <span>{votePercentages.reject}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Minus size={12} className="text-[#64748B]" />
                <span>{votePercentages.abstain}%</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-text-muted)]">
              By <strong>{proposal.proposer}</strong> • {formatDate(proposal.createdAt)}
            </div>

            {isVotingOpen && !hasVoted && onVote && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(proposal.id);
                }}
              >
                Vote Now
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface MiniVoteBarProps {
  label: string;
  percentage: number;
  color: string;
  isUserVote?: boolean;
}

function MiniVoteBar({ label, percentage, color, isUserVote }: MiniVoteBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-text-muted)] w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right" style={{ color }}>
        {percentage}%
      </span>
      {isUserVote && (
        <CheckCircle size={12} className="text-[var(--color-accent-green)]" />
      )}
    </div>
  );
}

// Utility Functions

function getTimeRemaining(deadline: Date): { label: string; urgent: boolean } {
  const ms = deadline.getTime() - Date.now();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (ms < 0) return { label: 'Voting closed', urgent: false };
  if (days > 7) return { label: `${days} days left`, urgent: false };
  if (days > 0) return { label: `${days}d left`, urgent: days < 3 };
  if (hours > 0) return { label: `${hours}h left`, urgent: true };
  return { label: 'Closing soon!', urgent: true };
}

function calculatePercentages(
  votes: { approve: number; reject: number; abstain: number },
  total: number
): { approve: number; reject: number; abstain: number } {
  if (total === 0) return { approve: 0, reject: 0, abstain: 0 };
  
  return {
    approve: Math.round((votes.approve / total) * 100),
    reject: Math.round((votes.reject / total) * 100),
    abstain: Math.round((votes.abstain / total) * 100),
  };
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export type { ProposalCardData };
