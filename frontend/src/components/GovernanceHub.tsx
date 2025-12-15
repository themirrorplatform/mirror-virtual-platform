import React, { useState } from 'react';
import { Scale, Vote, Plus, TrendingUp, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * GovernanceHub - Democratic Platform Governance Dashboard
 * 
 * Features:
 * - Active proposals list with status indicators
 * - Vote now CTAs for pending proposals
 * - Recent amendments timeline
 * - Filter by proposal status
 * - Create new proposal CTA
 * 
 * Constitutional Note: This platform is democratically governed.
 * Every user can propose changes, vote, and fork if consensus fails.
 */

type ProposalStatus = 'draft' | 'voting' | 'passed' | 'rejected' | 'implemented' | 'vetoed';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  votingDeadline?: string;
  voteCounts?: {
    approve: number;
    reject: number;
    abstain: number;
  };
  createdAt: string;
  createdBy: string;
  createdByUsername: string;
}

interface Amendment {
  id: string;
  proposalId: string;
  proposalTitle: string;
  implementedAt: string;
  summary: string;
}

interface GovernanceHubProps {
  proposals: Proposal[];
  recentAmendments: Amendment[];
  onViewProposal: (proposalId: string) => void;
  onVoteOnProposal: (proposalId: string) => void;
  onCreateProposal?: () => void;
  currentUserId?: string;
}

export function GovernanceHub({
  proposals,
  recentAmendments,
  onViewProposal,
  onVoteOnProposal,
  onCreateProposal,
  currentUserId
}: GovernanceHubProps) {
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');

  // Filter proposals
  const filteredProposals = statusFilter === 'all'
    ? proposals
    : proposals.filter(p => p.status === statusFilter);

  // Group proposals by status
  const votingProposals = proposals.filter(p => p.status === 'voting');
  const passedProposals = proposals.filter(p => p.status === 'passed');
  const implementedProposals = proposals.filter(p => p.status === 'implemented');

  // Status colors
  const statusColors: Record<ProposalStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    voting: 'bg-blue-100 text-blue-700',
    passed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    implemented: 'bg-purple-100 text-purple-700',
    vetoed: 'bg-orange-100 text-orange-700'
  };

  // Status icons
  const statusIcons: Record<ProposalStatus, typeof CheckCircle> = {
    draft: FileText,
    voting: Vote,
    passed: CheckCircle,
    rejected: XCircle,
    implemented: CheckCircle,
    vetoed: XCircle
  };

  // Format time remaining
  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 0) return 'Ended';
    if (diffHours < 24) return `${diffHours}h left`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8 text-purple-600" />
            Governance Hub
          </h1>
          <p className="text-gray-600 mt-1">
            Democratic platform governance. Your vote shapes the future.
          </p>
        </div>
        
        {onCreateProposal && (
          <Button
            onClick={onCreateProposal}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Votes</p>
                <p className="text-3xl font-bold text-blue-600">{votingProposals.length}</p>
              </div>
              <Vote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Passed (Pending)</p>
                <p className="text-3xl font-bold text-green-600">{passedProposals.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Implemented</p>
                <p className="text-3xl font-bold text-purple-600">{implementedProposals.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="voting" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voting">
            Voting Now ({votingProposals.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Proposals ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="amendments">
            Recent Amendments ({recentAmendments.length})
          </TabsTrigger>
        </TabsList>

        {/* Voting Now Tab */}
        <TabsContent value="voting" className="space-y-4">
          {votingProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No active votes at this time</p>
            </Card>
          ) : (
            votingProposals.map(proposal => (
              <ProposalListItem
                key={proposal.id}
                proposal={proposal}
                onView={() => onViewProposal(proposal.id)}
                onVote={() => onVoteOnProposal(proposal.id)}
                showVoteButton
                statusColors={statusColors}
                statusIcons={statusIcons}
                getTimeRemaining={getTimeRemaining}
              />
            ))
          )}
        </TabsContent>

        {/* All Proposals Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({proposals.length})
            </Button>
            {(Object.keys(statusColors) as ProposalStatus[]).map(status => {
              const count = proposals.filter(p => p.status === status).length;
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status} ({count})
                </Button>
              );
            })}
          </div>

          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No proposals match this filter</p>
            </Card>
          ) : (
            filteredProposals.map(proposal => (
              <ProposalListItem
                key={proposal.id}
                proposal={proposal}
                onView={() => onViewProposal(proposal.id)}
                onVote={() => onVoteOnProposal(proposal.id)}
                showVoteButton={proposal.status === 'voting'}
                statusColors={statusColors}
                statusIcons={statusIcons}
                getTimeRemaining={getTimeRemaining}
              />
            ))
          )}
        </TabsContent>

        {/* Amendments Tab */}
        <TabsContent value="amendments" className="space-y-4">
          {recentAmendments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No recent amendments</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentAmendments.map(amendment => (
                <Card key={amendment.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{amendment.proposalTitle}</span>
                          <Badge className="bg-purple-100 text-purple-700">
                            Implemented
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{amendment.summary}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Implemented {new Date(amendment.implementedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProposal(amendment.proposalId)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2">
            How Democratic Governance Works
          </h3>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>Any user can propose constitutional amendments</li>
            <li>Proposals require 2/3 supermajority to pass</li>
            <li>Guardians can veto proposals that violate core principles</li>
            <li>If supermajority fails, users can fork the platform</li>
            <li>All votes are transparent and auditable</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Proposal List Item Component
interface ProposalListItemProps {
  proposal: Proposal;
  onView: () => void;
  onVote: () => void;
  showVoteButton: boolean;
  statusColors: Record<ProposalStatus, string>;
  statusIcons: Record<ProposalStatus, typeof CheckCircle>;
  getTimeRemaining: (deadline: string) => string;
}

function ProposalListItem({
  proposal,
  onView,
  onVote,
  showVoteButton,
  statusColors,
  statusIcons,
  getTimeRemaining
}: ProposalListItemProps) {
  const StatusIcon = statusIcons[proposal.status];
  
  // Calculate vote percentages
  const totalVotes = proposal.voteCounts
    ? proposal.voteCounts.approve + proposal.voteCounts.reject + proposal.voteCounts.abstain
    : 0;
  
  const approvePercent = totalVotes > 0
    ? Math.round((proposal.voteCounts!.approve / totalVotes) * 100)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Title and Status */}
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className="h-5 w-5" />
              <h3 className="font-semibold text-lg">{proposal.title}</h3>
              <Badge className={statusColors[proposal.status]}>
                {proposal.status}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {proposal.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>By @{proposal.createdByUsername}</span>
              <span>•</span>
              <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
              {proposal.votingDeadline && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(proposal.votingDeadline)}
                  </span>
                </>
              )}
            </div>

            {/* Vote Progress */}
            {proposal.voteCounts && totalVotes > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Approval: {approvePercent}%</span>
                  <span>{totalVotes} votes</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${approvePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Approve: {proposal.voteCounts.approve}</span>
                  <span>Reject: {proposal.voteCounts.reject}</span>
                  <span>Abstain: {proposal.voteCounts.abstain}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {showVoteButton && (
              <Button onClick={onVote} className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Vote Now
              </Button>
            )}
            <Button variant="outline" onClick={onView}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <GovernanceHub
 *   proposals={[
 *     {
 *       id: 'prop_1',
 *       title: 'Add Dark Mode to Platform',
 *       description: 'Proposal to implement a dark mode theme option for better accessibility and user preference.',
 *       status: 'voting',
 *       votingDeadline: '2024-01-20T23:59:59Z',
 *       voteCounts: { approve: 42, reject: 8, abstain: 5 },
 *       createdAt: '2024-01-10T10:00:00Z',
 *       createdBy: 'user_123',
 *       createdByUsername: 'alex'
 *     }
 *   ]}
 *   recentAmendments={[
 *     {
 *       id: 'amend_1',
 *       proposalId: 'prop_0',
 *       proposalTitle: 'Increase vote threshold to 2/3',
 *       implementedAt: '2024-01-05T12:00:00Z',
 *       summary: 'Changed voting threshold from simple majority to 2/3 supermajority for constitutional amendments.'
 *     }
 *   ]}
 *   onViewProposal={(id) => console.log('View:', id)}
 *   onVoteOnProposal={(id) => console.log('Vote on:', id)}
 *   onCreateProposal={() => console.log('Create proposal')}
 * />
 */
