/**
 * Amendment History - Timeline of constitutional amendments
 * 
 * Features:
 * - Chronological timeline
 * - Amendment full text
 * - Vote results summary
 * - Implementation date
 * - Proposer attribution
 * - Diff view (before/after)
 * - Impact notes
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock,
  FileText,
  User,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  GitCommit,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Amendment {
  id: string;
  title: string;
  description: string;
  fullText: string;
  proposer: string;
  proposedAt: Date;
  votingCompletedAt: Date;
  implementedAt: Date;
  voteResults: {
    approve: number;
    reject: number;
    abstain: number;
    totalVoters: number;
  };
  impactNotes?: string;
  beforeText?: string;
  affectedSections?: string[];
}

interface AmendmentHistoryProps {
  amendments: Amendment[];
  onViewProposal?: (amendmentId: string) => void;
  compact?: boolean;
}

export function AmendmentHistory({
  amendments,
  onViewProposal,
  compact = false,
}: AmendmentHistoryProps) {
  const [expandedAmendment, setExpandedAmendment] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState<string | null>(null);

  const sortedAmendments = [...amendments].sort(
    (a, b) => b.implementedAt.getTime() - a.implementedAt.getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-[var(--color-accent-blue)]" />
            <div>
              <h3 className="mb-1">Amendment History</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {amendments.length} constitutional amendment{amendments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      {sortedAmendments.length > 0 ? (
        <div className="space-y-4">
          {sortedAmendments.map((amendment, index) => (
            <AmendmentCard
              key={amendment.id}
              amendment={amendment}
              expanded={expandedAmendment === amendment.id}
              showDiff={showDiff === amendment.id}
              onToggleExpand={() =>
                setExpandedAmendment(
                  expandedAmendment === amendment.id ? null : amendment.id
                )
              }
              onToggleDiff={() =>
                setShowDiff(showDiff === amendment.id ? null : amendment.id)
              }
              onViewProposal={onViewProposal}
              isLatest={index === 0}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No amendments yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Constitutional amendments will appear here once passed and implemented
            </p>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Amendments are immutable records.</strong> Once implemented, they become 
              part of the constitutional history and cannot be deleted.
            </p>
            <p className="text-[var(--color-text-muted)]">
              You can view the full proposal, vote results, and impact of each amendment.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface AmendmentCardProps {
  amendment: Amendment;
  expanded: boolean;
  showDiff: boolean;
  onToggleExpand: () => void;
  onToggleDiff: () => void;
  onViewProposal?: (amendmentId: string) => void;
  isLatest: boolean;
  compact?: boolean;
}

function AmendmentCard({
  amendment,
  expanded,
  showDiff,
  onToggleExpand,
  onToggleDiff,
  onViewProposal,
  isLatest,
  compact,
}: AmendmentCardProps) {
  const approvalPercent = Math.round(
    (amendment.voteResults.approve / amendment.voteResults.totalVoters) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Timeline connector */}
      {!compact && (
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-[var(--color-border-subtle)]" />
      )}

      <Card
        className="border-l-4 cursor-pointer transition-all hover:shadow-md relative"
        style={{ borderLeftColor: '#10B981' }}
        onClick={onToggleExpand}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent-green)]/20 flex items-center justify-center">
                  <GitCommit size={20} className="text-[var(--color-accent-green)]" />
                </div>
                {isLatest && (
                  <Badge
                    variant="success"
                    size="sm"
                    className="absolute -top-2 -right-2"
                  >
                    Latest
                  </Badge>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{amendment.title}</h4>
                  <Badge variant="success">
                    Implemented
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {amendment.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {expanded ? (
                <ChevronUp size={20} className="text-[var(--color-text-muted)]" />
              ) : (
                <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{amendment.proposer}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Implemented {formatDate(amendment.implementedAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle size={12} />
              <span>{approvalPercent}% approval</span>
            </div>
          </div>

          {/* Vote Summary */}
          {!compact && (
            <div className="grid grid-cols-3 gap-2">
              <VoteSummaryBadge
                label="Approve"
                count={amendment.voteResults.approve}
                total={amendment.voteResults.totalVoters}
                color="#10B981"
                icon={<ThumbsUp size={12} />}
              />
              <VoteSummaryBadge
                label="Reject"
                count={amendment.voteResults.reject}
                total={amendment.voteResults.totalVoters}
                color="#EF4444"
                icon={<ThumbsDown size={12} />}
              />
              <VoteSummaryBadge
                label="Abstain"
                count={amendment.voteResults.abstain}
                total={amendment.voteResults.totalVoters}
                color="#64748B"
                icon={<Minus size={12} />}
              />
            </div>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Full Text */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Amendment Text</h5>
                  <Card>
                    <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                      {amendment.fullText}
                    </pre>
                  </Card>
                </div>

                {/* Affected Sections */}
                {amendment.affectedSections && amendment.affectedSections.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Affected Sections</h5>
                    <div className="flex flex-wrap gap-2">
                      {amendment.affectedSections.map((section) => (
                        <Badge key={section} variant="secondary">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact Notes */}
                {amendment.impactNotes && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Impact Notes</h5>
                    <Card>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {amendment.impactNotes}
                      </p>
                    </Card>
                  </div>
                )}

                {/* Diff View */}
                {amendment.beforeText && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDiff();
                      }}
                      className="mb-2"
                    >
                      {showDiff ? 'Hide' : 'Show'} Before/After
                    </Button>

                    {showDiff && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h6 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                            Before
                          </h6>
                          <Card className="border-2 border-red-500/30">
                            <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                              {amendment.beforeText}
                            </pre>
                          </Card>
                        </div>
                        <div>
                          <h6 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                            After
                          </h6>
                          <Card className="border-2 border-green-500/30">
                            <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                              {amendment.fullText}
                            </pre>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Details */}
                <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Proposed:</span>
                      <span className="text-[var(--color-text-secondary)]">
                        {amendment.proposedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Voting Completed:</span>
                      <span className="text-[var(--color-text-secondary)]">
                        {amendment.votingCompletedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Implemented:</span>
                      <span className="text-[var(--color-text-secondary)]">
                        {amendment.implementedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Original Proposal */}
                {onViewProposal && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProposal(amendment.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText size={14} />
                    View Original Proposal
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

interface VoteSummaryBadgeProps {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

function VoteSummaryBadge({ label, count, total, color, icon }: VoteSummaryBadgeProps) {
  const percentage = Math.round((count / total) * 100);

  return (
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: `${color}10` }}
    >
      <div className="flex items-center gap-1 mb-1">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="text-sm font-medium">{count}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{percentage}%</div>
    </div>
  );
}

// Utility Functions

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString();
}

export type { Amendment };


