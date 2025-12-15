import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  MessageSquare,
  BarChart,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

/**
 * AmendmentHistory - Constitutional Amendment Timeline
 * 
 * Features:
 * - Chronological list of all constitutional amendments
 * - Proposal -> Vote -> Result flow for each amendment
 * - Voting results with percentages
 * - Before/after text diffs
 * - Proposer and voting period info
 * - Amendment status (pending, passed, failed, implemented)
 * - Participation rate
 * - Comments/discussion count
 * - Filter by status/section
 * 
 * Constitutional Note: The constitution is a living document.
 * All changes are transparent and democratic.
 */

type AmendmentStatus = 'pending' | 'voting' | 'passed' | 'failed' | 'implemented';
type VoteResult = 'yes' | 'no' | 'abstain';

interface VoteBreakdown {
  yes: number;
  no: number;
  abstain: number;
  total: number;
  participationRate: number; // percentage of eligible voters
}

interface AmendmentData {
  id: string;
  proposalNumber: number;
  section: string;
  title: string;
  proposedBy: string;
  proposedDate: string;
  votingStartDate?: string;
  votingEndDate?: string;
  implementedDate?: string;
  status: AmendmentStatus;
  oldText?: string;
  newText?: string;
  rationale: string;
  voteBreakdown?: VoteBreakdown;
  discussionCount: number;
  requiredThreshold: number; // percentage needed to pass (e.g., 67 for 2/3)
}

interface AmendmentHistoryProps {
  amendments: AmendmentData[];
  instanceName?: string;
  onViewAmendment?: (amendmentId: string) => void;
  onViewDiscussion?: (amendmentId: string) => void;
  onVote?: (amendmentId: string, vote: VoteResult) => void;
}

const statusConfig: Record<AmendmentStatus, { color: string; label: string; icon: typeof Clock }> = {
  pending: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Pending', icon: Clock },
  voting: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Voting Open', icon: AlertCircle },
  passed: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Passed', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Failed', icon: XCircle },
  implemented: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Implemented', icon: CheckCircle }
};

export function AmendmentHistory({
  amendments,
  instanceName,
  onViewAmendment,
  onViewDiscussion,
  onVote
}: AmendmentHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<AmendmentStatus | 'all'>('all');
  const [expandedAmendment, setExpandedAmendment] = useState<string | null>(null);

  const filteredAmendments = amendments.filter(
    a => statusFilter === 'all' || a.status === statusFilter
  );

  const sortedAmendments = [...filteredAmendments].sort((a, b) => 
    new Date(b.proposedDate).getTime() - new Date(a.proposedDate).getTime()
  );

  const passedCount = amendments.filter(a => a.status === 'passed' || a.status === 'implemented').length;
  const pendingCount = amendments.filter(a => a.status === 'pending' || a.status === 'voting').length;
  const avgParticipation = amendments
    .filter(a => a.voteBreakdown)
    .reduce((sum, a) => sum + (a.voteBreakdown?.participationRate || 0), 0) / 
    Math.max(amendments.filter(a => a.voteBreakdown).length, 1);

  const getVotePercentage = (votes: number, total: number): number => {
    return total > 0 ? (votes / total) * 100 : 0;
  };

  const hasPassedThreshold = (amendment: AmendmentData): boolean => {
    if (!amendment.voteBreakdown) return false;
    const yesPercentage = getVotePercentage(amendment.voteBreakdown.yes, amendment.voteBreakdown.total);
    return yesPercentage >= amendment.requiredThreshold;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Amendment History
              </CardTitle>
              {instanceName && (
                <p className="text-sm text-gray-500 mt-1">
                  Constitutional changes for {instanceName}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">{amendments.length}</p>
              <p className="text-sm text-purple-600">Total Amendments</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-700">{passedCount}</p>
              <p className="text-sm text-green-600">Passed</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{avgParticipation.toFixed(0)}%</p>
              <p className="text-sm text-blue-600">Avg Participation</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between mb-4">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as AmendmentStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status ({amendments.length})</option>
              <option value="voting">Voting Open</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="implemented">Implemented</option>
            </select>

            {pendingCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 border">
                {pendingCount} active proposal{pendingCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Constitutional Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Living Document:</strong> The constitution can be amended through democratic process. 
              All changes are transparent and require community consensus.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Amendment Timeline */}
      <div className="space-y-4">
        {sortedAmendments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {statusFilter !== 'all' 
                  ? `No amendments with status: ${statusFilter}` 
                  : 'No constitutional amendments yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedAmendments.map(amendment => {
            const statusConf = statusConfig[amendment.status];
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedAmendment === amendment.id;
            const passed = hasPassedThreshold(amendment);

            return (
              <Card key={amendment.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${statusConf.color.replace('text-', 'bg-').replace('-700', '-200')}`}>
                        <StatusIcon className={`h-5 w-5 ${statusConf.color.split(' ')[0].replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">Proposal #{amendment.proposalNumber}</span>
                          <Badge className={`${statusConf.color} border`}>
                            {statusConf.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{amendment.title}</h3>
                        <p className="text-xs text-gray-500">Section: {amendment.section}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Proposed by {amendment.proposedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(amendment.proposedDate).toLocaleDateString()}</span>
                    </div>
                    {amendment.discussionCount > 0 && (
                      <button
                        onClick={() => onViewDiscussion?.(amendment.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{amendment.discussionCount} comment{amendment.discussionCount !== 1 ? 's' : ''}</span>
                      </button>
                    )}
                  </div>

                  {/* Rationale */}
                  <p className="text-sm text-gray-700 mb-4">{amendment.rationale}</p>

                  {/* Voting Info */}
                  {amendment.voteBreakdown && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Voting Results</p>
                        <Badge className={passed ? 'bg-green-100 text-green-700 border-green-300 border' : 'bg-red-100 text-red-700 border-red-300 border'}>
                          {passed ? 'Threshold Met' : 'Threshold Not Met'} ({amendment.requiredThreshold}% required)
                        </Badge>
                      </div>

                      {/* Vote Bars */}
                      <div className="space-y-2 mb-3">
                        {/* Yes */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-green-700 font-medium">Yes</span>
                            <span className="text-gray-600">
                              {amendment.voteBreakdown.yes} ({getVotePercentage(amendment.voteBreakdown.yes, amendment.voteBreakdown.total).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 transition-all"
                              style={{ width: `${getVotePercentage(amendment.voteBreakdown.yes, amendment.voteBreakdown.total)}%` }}
                            />
                          </div>
                        </div>

                        {/* No */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-red-700 font-medium">No</span>
                            <span className="text-gray-600">
                              {amendment.voteBreakdown.no} ({getVotePercentage(amendment.voteBreakdown.no, amendment.voteBreakdown.total).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600 transition-all"
                              style={{ width: `${getVotePercentage(amendment.voteBreakdown.no, amendment.voteBreakdown.total)}%` }}
                            />
                          </div>
                        </div>

                        {/* Abstain */}
                        {amendment.voteBreakdown.abstain > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-700 font-medium">Abstain</span>
                              <span className="text-gray-600">
                                {amendment.voteBreakdown.abstain} ({getVotePercentage(amendment.voteBreakdown.abstain, amendment.voteBreakdown.total).toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gray-500 transition-all"
                                style={{ width: `${getVotePercentage(amendment.voteBreakdown.abstain, amendment.voteBreakdown.total)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Participation */}
                      <div className="text-xs text-gray-600 flex items-center justify-between">
                        <span>Participation Rate:</span>
                        <span className="font-medium">{amendment.voteBreakdown.participationRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Voting Period */}
                  {amendment.status === 'voting' && amendment.votingEndDate && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <Clock className="h-4 w-4" />
                        <span>Voting ends {new Date(amendment.votingEndDate).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Changes Toggle */}
                  {(amendment.oldText || amendment.newText) && (
                    <button
                      onClick={() => setExpandedAmendment(isExpanded ? null : amendment.id)}
                      className="w-full py-2 px-4 mb-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-between transition-colors"
                    >
                      <span>{isExpanded ? 'Hide' : 'Show'} Text Changes</span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}

                  {/* Expanded Text Diff */}
                  {isExpanded && (
                    <div className="space-y-3 mb-4">
                      {amendment.oldText && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 font-medium mb-2">- Old Text</p>
                          <p className="text-sm text-red-900">{amendment.oldText}</p>
                        </div>
                      )}
                      {amendment.newText && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-600 font-medium mb-2">+ New Text</p>
                          <p className="text-sm text-green-900">{amendment.newText}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Implementation Date */}
                  {amendment.implementedDate && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-900">
                        Implemented on {new Date(amendment.implementedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {amendment.status === 'voting' && onVote && (
                      <div className="flex-1 flex gap-2">
                        <button
                          onClick={() => onVote(amendment.id, 'yes')}
                          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Vote Yes
                        </button>
                        <button
                          onClick={() => onVote(amendment.id, 'no')}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Vote No
                        </button>
                        <button
                          onClick={() => onVote(amendment.id, 'abstain')}
                          className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Abstain
                        </button>
                      </div>
                    )}
                    {onViewAmendment && (
                      <button
                        onClick={() => onViewAmendment(amendment.id)}
                        className="py-2 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Full
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <AmendmentHistory
 *   instanceName="mirror.network"
 *   amendments={[
 *     {
 *       id: 'amd_1',
 *       proposalNumber: 12,
 *       section: 'Article IV: Guardianship',
 *       title: 'Reduce Guardian Term Length',
 *       proposedBy: 'alice.mirror',
 *       proposedDate: '2024-01-10T10:00:00Z',
 *       votingStartDate: '2024-01-12T00:00:00Z',
 *       votingEndDate: '2024-01-19T23:59:59Z',
 *       implementedDate: '2024-01-20T12:00:00Z',
 *       status: 'implemented',
 *       oldText: 'Guardians serve for 90 days',
 *       newText: 'Guardians serve for 60 days',
 *       rationale: 'Shorter terms increase rotation and prevent power concentration',
 *       voteBreakdown: {
 *         yes: 145,
 *         no: 32,
 *         abstain: 8,
 *         total: 185,
 *         participationRate: 92.5
 *       },
 *       discussionCount: 23,
 *       requiredThreshold: 67
 *     },
 *     {
 *       id: 'amd_2',
 *       proposalNumber: 13,
 *       section: 'Article VII: Privacy',
 *       title: 'Mandatory Encryption at Rest',
 *       proposedBy: 'bob.mirror',
 *       proposedDate: '2024-01-15T14:00:00Z',
 *       votingStartDate: '2024-01-17T00:00:00Z',
 *       votingEndDate: '2024-01-24T23:59:59Z',
 *       status: 'voting',
 *       newText: 'All data must be encrypted at rest using AES-256 or equivalent',
 *       rationale: 'Additional privacy safeguard for sensitive data',
 *       voteBreakdown: {
 *         yes: 89,
 *         no: 15,
 *         abstain: 3,
 *         total: 107,
 *         participationRate: 53.5
 *       },
 *       discussionCount: 45,
 *       requiredThreshold: 67
 *     }
 *   ]}
 *   onViewAmendment={(id) => console.log('View amendment:', id)}
 *   onViewDiscussion={(id) => console.log('View discussion:', id)}
 *   onVote={(id, vote) => console.log('Vote:', id, vote)}
 * />
 */


