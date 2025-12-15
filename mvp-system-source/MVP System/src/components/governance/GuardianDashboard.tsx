/**
 * Guardian Dashboard - Interface for constitutional guardians
 * 
 * Features:
 * - Pending proposals queue
 * - Veto power (with justification required)
 * - Constitutional invariant checker
 * - Amendment impact simulator
 * - Guardian activity log
 * - Emergency shutdown trigger
 * - Transparency reports
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield,
  AlertTriangle,
  Check,
  X,
  FileText,
  Activity,
  BarChart3,
  Power,
  Info,
  Clock,
  User
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface PendingProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  submittedAt: Date;
  fullText: string;
  affectedInvariants: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  votingDeadline?: Date;
}

interface InvariantCheck {
  invariant: string;
  status: 'pass' | 'warning' | 'violation';
  details: string;
}

interface GuardianActivity {
  id: string;
  guardianName: string;
  action: 'approved' | 'vetoed' | 'flagged';
  proposalTitle: string;
  timestamp: Date;
  justification?: string;
}

interface GuardianDashboardProps {
  pendingProposals: PendingProposal[];
  guardianName: string;
  activityLog: GuardianActivity[];
  onApprove: (proposalId: string) => void;
  onVeto: (proposalId: string, justification: string) => void;
  onEmergencyShutdown?: () => void;
  canTriggerEmergency?: boolean;
}

export function GuardianDashboard({
  pendingProposals,
  guardianName,
  activityLog,
  onApprove,
  onVeto,
  onEmergencyShutdown,
  canTriggerEmergency = false,
}: GuardianDashboardProps) {
  const [selectedProposal, setSelectedProposal] = useState<PendingProposal | null>(null);
  const [vetoJustification, setVetoJustification] = useState('');
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const criticalProposals = pendingProposals.filter(p => p.riskLevel === 'critical');
  const highRiskProposals = pendingProposals.filter(p => p.riskLevel === 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10">
                <Shield size={24} className="text-[var(--color-accent-blue)]" />
              </div>
              <div>
                <h2 className="mb-1">Guardian Dashboard</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Welcome, {guardianName}
                </p>
              </div>
            </div>

            {canTriggerEmergency && (
              <Button
                variant="ghost"
                onClick={() => setShowEmergencyConfirm(true)}
                className="flex items-center gap-2 text-[var(--color-border-error)]"
              >
                <Power size={16} />
                Emergency Shutdown
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Pending Review"
              value={pendingProposals.length.toString()}
              icon={<FileText size={16} />}
              color="#3B82F6"
            />
            <StatCard
              label="Critical Risk"
              value={criticalProposals.length.toString()}
              icon={<AlertTriangle size={16} />}
              color="#EF4444"
            />
            <StatCard
              label="Your Actions"
              value={activityLog.length.toString()}
              icon={<Activity size={16} />}
              color="#10B981"
            />
          </div>
        </div>
      </Card>

      {/* Critical Alerts */}
      {criticalProposals.length > 0 && (
        <Card className="border-2 border-[var(--color-border-error)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[var(--color-border-error)] mt-0.5" />
            <div>
              <h4 className="font-medium text-[var(--color-border-error)] mb-1">
                Critical Risk Proposals
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {criticalProposals.length} proposal{criticalProposals.length !== 1 ? 's' : ''} may 
                violate core constitutional invariants. Immediate review required.
              </p>
              <div className="space-y-2">
                {criticalProposals.map(proposal => (
                  <button
                    key={proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    className="w-full text-left p-2 rounded bg-[var(--color-border-error)]/10 hover:bg-[var(--color-border-error)]/20 transition-colors"
                  >
                    <p className="text-sm font-medium">{proposal.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      By {proposal.proposer} • {formatDate(proposal.submittedAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Proposals */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Pending Proposals</h3>

          {pendingProposals.length > 0 ? (
            <div className="space-y-3">
              {pendingProposals.map(proposal => (
                <ProposalReviewCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={selectedProposal?.id === proposal.id}
                  onClick={() => setSelectedProposal(proposal)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                No pending proposals
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Proposal Detail View */}
      <AnimatePresence>
        {selectedProposal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-[var(--color-accent-blue)]">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="mb-1">{selectedProposal.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {selectedProposal.description}
                    </p>
                  </div>
                  <Badge variant={getRiskVariant(selectedProposal.riskLevel)}>
                    {selectedProposal.riskLevel} risk
                  </Badge>
                </div>

                {/* Full Text */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Proposal Text</h4>
                  <Card variant="emphasis">
                    <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                      {selectedProposal.fullText}
                    </pre>
                  </Card>
                </div>

                {/* Invariant Checks */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Constitutional Invariant Check</h4>
                  <div className="space-y-2">
                    {selectedProposal.affectedInvariants.map((invariant, index) => (
                      <InvariantCheckCard
                        key={index}
                        check={{
                          invariant,
                          status: selectedProposal.riskLevel === 'critical' ? 'violation' : 
                                  selectedProposal.riskLevel === 'high' ? 'warning' : 'pass',
                          details: getInvariantDetails(invariant, selectedProposal.riskLevel),
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Veto Justification */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Veto Justification (Required)</h4>
                  <textarea
                    value={vetoJustification}
                    onChange={(e) => setVetoJustification(e.target.value)}
                    placeholder="If you veto this proposal, you must provide a clear constitutional justification..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Minimum 50 characters. This will be publicly visible.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
                  <Button
                    variant="primary"
                    onClick={() => {
                      onApprove(selectedProposal.id);
                      setSelectedProposal(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    Approve for Voting
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (vetoJustification.length >= 50) {
                        onVeto(selectedProposal.id, vetoJustification);
                        setSelectedProposal(null);
                        setVetoJustification('');
                      }
                    }}
                    disabled={vetoJustification.length < 50}
                    className="flex items-center gap-2 text-[var(--color-border-error)]"
                  >
                    <X size={16} />
                    Veto Proposal
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedProposal(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Recent Guardian Activity</h3>

          {activityLog.length > 0 ? (
            <div className="space-y-2">
              {activityLog.slice(0, 10).map(activity => (
                <ActivityLogItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
              No recent activity
            </p>
          )}
        </div>
      </Card>

      {/* Guardian Oath */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2 font-medium">Guardian Responsibility:</p>
            <p className="mb-2">
              Guardians exist to protect core constitutional invariants, not to exercise 
              editorial control. Veto power must only be used when a proposal would violate 
              fundamental system constraints.
            </p>
            <p className="text-[var(--color-text-muted)]">
              All guardian actions are logged and publicly auditable. Abuse of veto power 
              may result in removal via community vote.
            </p>
          </div>
        </div>
      </Card>

      {/* Emergency Shutdown Confirmation */}
      <AnimatePresence>
        {showEmergencyConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowEmergencyConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-2 border-[var(--color-border-error)] max-w-md">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Power size={24} className="text-[var(--color-border-error)]" />
                    <div>
                      <h3 className="mb-1 text-[var(--color-border-error)]">
                        Emergency Shutdown
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        This will immediately halt all system operations. Only use in case of 
                        severe constitutional violation or security breach.
                      </p>
                    </div>
                  </div>

                  <Card variant="emphasis">
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      <strong>Warning:</strong> This action requires unanimous guardian approval 
                      and will be permanently logged. Are you certain this is necessary?
                    </p>
                  </Card>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowEmergencyConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onEmergencyShutdown?.();
                        setShowEmergencyConfirm(false);
                      }}
                      className="text-[var(--color-border-error)]"
                    >
                      Confirm Shutdown
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <div className="text-2xl font-medium">{value}</div>
    </div>
  );
}

interface ProposalReviewCardProps {
  proposal: PendingProposal;
  isSelected: boolean;
  onClick: () => void;
}

function ProposalReviewCard({ proposal, isSelected, onClick }: ProposalReviewCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-2 border-[var(--color-accent-blue)]' : ''
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium mb-1">{proposal.title}</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {proposal.description}
            </p>
          </div>
          <Badge variant={getRiskVariant(proposal.riskLevel)}>
            {proposal.riskLevel}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{proposal.proposer}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(proposal.submittedAt)}</span>
          </div>
          <span>{proposal.affectedInvariants.length} invariants affected</span>
        </div>
      </div>
    </Card>
  );
}

interface InvariantCheckCardProps {
  check: InvariantCheck;
}

function InvariantCheckCard({ check }: InvariantCheckCardProps) {
  const statusConfig = {
    pass: { icon: <Check size={14} />, color: '#10B981', label: 'Pass' },
    warning: { icon: <AlertTriangle size={14} />, color: '#F59E0B', label: 'Warning' },
    violation: { icon: <X size={14} />, color: '#EF4444', label: 'Violation' },
  }[check.status];

  return (
    <div
      className="p-3 rounded-lg border-l-4"
      style={{
        borderLeftColor: statusConfig.color,
        backgroundColor: `${statusConfig.color}10`,
      }}
    >
      <div className="flex items-start gap-2">
        <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{check.invariant}</span>
            <Badge
              variant={check.status === 'pass' ? 'success' : check.status === 'warning' ? 'warning' : 'error'}
              size="sm"
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {check.details}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ActivityLogItemProps {
  activity: GuardianActivity;
}

function ActivityLogItem({ activity }: ActivityLogItemProps) {
  const actionConfig = {
    approved: { color: '#10B981', label: 'Approved' },
    vetoed: { color: '#EF4444', label: 'Vetoed' },
    flagged: { color: '#F59E0B', label: 'Flagged' },
  }[activity.action];

  return (
    <div className="p-2 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{activity.guardianName}</span>
          <Badge
            variant={activity.action === 'approved' ? 'success' : activity.action === 'vetoed' ? 'error' : 'warning'}
            size="sm"
          >
            {actionConfig.label}
          </Badge>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {formatDate(activity.timestamp)}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {activity.proposalTitle}
      </p>
      {activity.justification && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
          "{activity.justification}"
        </p>
      )}
    </div>
  );
}

// Utility Functions

function getRiskVariant(level: string): 'success' | 'warning' | 'error' {
  if (level === 'low') return 'success';
  if (level === 'high' || level === 'critical') return 'error';
  return 'warning';
}

function getInvariantDetails(invariant: string, riskLevel: string): string {
  if (riskLevel === 'critical') {
    return `This proposal appears to violate the "${invariant}" invariant. Requires immediate review.`;
  }
  if (riskLevel === 'high') {
    return `This proposal may conflict with "${invariant}". Review recommended before approval.`;
  }
  return `This proposal affects "${invariant}" but appears constitutional.`;
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export type { PendingProposal, InvariantCheck, GuardianActivity };
