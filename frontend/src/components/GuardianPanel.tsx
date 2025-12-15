import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Eye,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  MessageSquare,
  Flag,
  TrendingUp,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

/**
 * GuardianPanel - Constitutional Guardian Interface
 * 
 * Features:
 * - Pending proposals review queue
 * - Constitutional compliance checker
 * - Veto interface with rationale
 * - Amendment implementation tools
 * - Guardian term countdown
 * - Recent decisions log
 * - Constitutional violation alerts
 * - Proposal impact analysis
 * - Community feedback view
 * 
 * Constitutional Note: Guardians protect against hasty changes.
 * Vetoes must be justified and are subject to community override.
 */

type ProposalStatus = 'pending_guardian' | 'guardian_approved' | 'vetoed' | 'voting' | 'passed' | 'rejected';
type ComplianceCheck = 'compliant' | 'minor_concern' | 'major_concern' | 'violation';

interface Proposal {
  id: string;
  proposalNumber: number;
  title: string;
  section: string;
  proposedBy: string;
  submittedDate: string;
  description: string;
  fullText: string;
  rationale: string;
  status: ProposalStatus;
  communityFeedbackCount: number;
  supportPercentage?: number;
}

interface ComplianceIssue {
  id: string;
  severity: 'minor' | 'major' | 'critical';
  principle: string;
  description: string;
  recommendation: string;
}

interface GuardianPanelProps {
  proposals: Proposal[];
  guardianName: string;
  termEndsAt: string;
  recentDecisions: GuardianDecision[];
  onApprove?: (proposalId: string) => Promise<void>;
  onVeto?: (proposalId: string, rationale: string) => Promise<void>;
  onViewProposal?: (proposalId: string) => void;
  onImplementAmendment?: (proposalId: string) => void;
}

interface GuardianDecision {
  id: string;
  proposalTitle: string;
  decision: 'approved' | 'vetoed';
  date: string;
  rationale?: string;
}

const statusConfig: Record<ProposalStatus, { color: string; label: string; icon: typeof Clock }> = {
  pending_guardian: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Awaiting Review', icon: Clock },
  guardian_approved: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Approved', icon: CheckCircle },
  vetoed: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Vetoed', icon: XCircle },
  voting: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Community Vote', icon: Users },
  passed: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Passed', icon: CheckCircle },
  rejected: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Rejected', icon: XCircle }
};

const complianceColors: Record<ComplianceCheck, { bg: string; text: string; border: string }> = {
  compliant: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  minor_concern: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  major_concern: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  violation: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

export function GuardianPanel({
  proposals,
  guardianName,
  termEndsAt,
  recentDecisions,
  onApprove,
  onVeto,
  onViewProposal,
  onImplementAmendment
}: GuardianPanelProps) {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [vetoRationale, setVetoRationale] = useState('');
  const [showVetoDialog, setShowVetoDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.section.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = proposals.filter(p => p.status === 'pending_guardian').length;
  const approvedCount = proposals.filter(p => p.status === 'guardian_approved').length;
  const vetoedCount = proposals.filter(p => p.status === 'vetoed').length;

  const daysUntilTermEnd = Math.ceil(
    (new Date(termEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Mock compliance check - in real app, this would be AI-powered
  const checkCompliance = (proposal: Proposal): { status: ComplianceCheck; issues: ComplianceIssue[] } => {
    // Simplified mock logic
    const issues: ComplianceIssue[] = [];
    
    if (proposal.fullText.toLowerCase().includes('mandatory') || proposal.fullText.toLowerCase().includes('required')) {
      issues.push({
        id: 'iss_1',
        severity: 'minor',
        principle: 'Article III: Freedom',
        description: 'Language suggests mandatory participation which may conflict with freedom principle',
        recommendation: 'Consider rewording to preserve user choice'
      });
    }

    if (issues.length === 0) {
      return { status: 'compliant', issues: [] };
    } else {
      return { status: 'minor_concern', issues };
    }
  };

  const handleApprove = async (proposal: Proposal) => {
    if (!onApprove) return;
    setIsProcessing(true);
    try {
      await onApprove(proposal.id);
      setSelectedProposal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVeto = async () => {
    if (!selectedProposal || !onVeto || !vetoRationale.trim()) return;
    setIsProcessing(true);
    try {
      await onVeto(selectedProposal.id, vetoRationale.trim());
      setShowVetoDialog(false);
      setVetoRationale('');
      setSelectedProposal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const openVetoDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowVetoDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-600" />
                Guardian Panel
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Constitutional oversight by {guardianName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Term ends in</p>
              <p className={`text-lg font-bold ${daysUntilTermEnd <= 7 ? 'text-red-600' : 'text-purple-700'}`}>
                {daysUntilTermEnd} days
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              </div>
              <p className="text-sm text-yellow-600">Pending Review</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
              </div>
              <p className="text-sm text-green-600">Approved</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{vetoedCount}</p>
              </div>
              <p className="text-sm text-red-600">Vetoed</p>
            </div>
          </div>

          {/* Constitutional Note */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-900">
              <strong>Guardian Responsibility:</strong> Guardians protect against hasty constitutional changes. 
              All vetoes must include clear rationale and can be overridden by 2/3 supermajority.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as ProposalStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending_guardian">Pending Review</option>
              <option value="guardian_approved">Approved</option>
              <option value="vetoed">Vetoed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Queue */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No proposals match your filters' 
                  : 'No proposals to review'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProposals.map(proposal => {
            const statusConf = statusConfig[proposal.status];
            const StatusIcon = statusConf.icon;
            const compliance = checkCompliance(proposal);
            const complianceColor = complianceColors[compliance.status];

            return (
              <Card key={proposal.id} className="border-2 hover:border-purple-300 transition-colors">
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Proposal #{proposal.proposalNumber}</span>
                        <Badge className={`${statusConf.color} border flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConf.label}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{proposal.title}</h3>
                      <p className="text-sm text-gray-600">Section: {proposal.section}</p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>by {proposal.proposedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(proposal.submittedDate).toLocaleDateString()}</span>
                    </div>
                    {proposal.communityFeedbackCount > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{proposal.communityFeedbackCount} comments</span>
                      </div>
                    )}
                    {proposal.supportPercentage !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{proposal.supportPercentage.toFixed(0)}% community support</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4">{proposal.description}</p>

                  {/* Compliance Check */}
                  <div className={`p-3 rounded-lg border mb-4 ${complianceColor.bg} ${complianceColor.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className={`h-4 w-4 ${complianceColor.text}`} />
                      <p className={`text-sm font-medium ${complianceColor.text}`}>
                        Constitutional Compliance: {compliance.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    {compliance.issues.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {compliance.issues.map(issue => (
                          <div key={issue.id} className="text-xs">
                            <p className={`font-medium ${complianceColor.text}`}>
                              ⚠️ {issue.principle}
                            </p>
                            <p className="text-gray-700 mt-1">{issue.description}</p>
                            <p className="text-gray-600 mt-1 italic">→ {issue.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {onViewProposal && (
                      <Button
                        onClick={() => onViewProposal(proposal.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Text
                      </Button>
                    )}
                    
                    {proposal.status === 'pending_guardian' && (
                      <>
                        {onApprove && (
                          <Button
                            onClick={() => handleApprove(proposal)}
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        {onVeto && (
                          <Button
                            onClick={() => openVetoDialog(proposal)}
                            disabled={isProcessing}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Veto
                          </Button>
                        )}
                      </>
                    )}

                    {proposal.status === 'passed' && onImplementAmendment && (
                      <Button
                        onClick={() => onImplementAmendment(proposal.id)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Implement Amendment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Decisions */}
      {recentDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Recent Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDecisions.slice(0, 5).map(decision => (
                <div key={decision.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {decision.decision === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <p className="text-sm font-medium text-gray-900">{decision.proposalTitle}</p>
                      </div>
                      {decision.rationale && (
                        <p className="text-xs text-gray-600 italic mt-1">"{decision.rationale}"</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(decision.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Veto Dialog */}
      {showVetoDialog && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Veto Proposal: {selectedProposal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900 font-medium mb-2">⚠️ Important</p>
                <p className="text-xs text-red-800">
                  Vetoes are a serious constitutional action. You must provide clear rationale based on 
                  constitutional principles. Community can override with 2/3 supermajority.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Veto Rationale <span className="text-red-600">*</span>
                </label>
                <Textarea
                  value={vetoRationale}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVetoRationale(e.target.value)}
                  placeholder="Explain why this proposal violates constitutional principles..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about which constitutional principles are violated
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowVetoDialog(false);
                    setVetoRationale('');
                    setSelectedProposal(null);
                  }}
                  variant="outline"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVeto}
                  disabled={!vetoRationale.trim() || isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Veto'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <GuardianPanel
 *   guardianName="alice.mirror"
 *   termEndsAt="2024-03-15T00:00:00Z"
 *   proposals={[
 *     {
 *       id: 'prop_1',
 *       proposalNumber: 12,
 *       title: 'Reduce Guardian Term Length',
 *       section: 'Article IV: Guardianship',
 *       proposedBy: 'bob.mirror',
 *       submittedDate: '2024-01-10T10:00:00Z',
 *       description: 'Reduce guardian terms from 90 to 60 days',
 *       fullText: 'Article IV, Section 2 shall be amended to read: "Guardians serve for 60 days..."',
 *       rationale: 'Shorter terms increase rotation and prevent power concentration',
 *       status: 'pending_guardian',
 *       communityFeedbackCount: 23,
 *       supportPercentage: 78
 *     }
 *   ]}
 *   recentDecisions={[
 *     {
 *       id: 'dec_1',
 *       proposalTitle: 'Increase Proposal Threshold',
 *       decision: 'approved',
 *       date: '2024-01-08T14:00:00Z'
 *     },
 *     {
 *       id: 'dec_2',
 *       proposalTitle: 'Remove Veto Power',
 *       decision: 'vetoed',
 *       date: '2024-01-05T10:00:00Z',
 *       rationale: 'Would eliminate constitutional safeguard against hasty changes'
 *     }
 *   ]}
 *   onApprove={async (id) => {
 *     console.log('Approving:', id);
 *     await api.guardianApproveProposal(id);
 *   }}
 *   onVeto={async (id, rationale) => {
 *     console.log('Vetoing:', id, rationale);
 *     await api.guardianVetoProposal(id, rationale);
 *   }}
 *   onViewProposal={(id) => console.log('View proposal:', id)}
 *   onImplementAmendment={(id) => console.log('Implement amendment:', id)}
 * />
 */



