/**
 * ProposalCard Component
 * 
 * Displays an evolution proposal with voting interface and integrity indicators
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import type { EvolutionProposal } from '@/lib/api';

interface ProposalCardProps {
  proposal: EvolutionProposal;
  onVote?: (proposalId: string, vote: 'for' | 'against' | 'abstain') => void;
  showVoting?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onVote,
  showVoting = true,
  selected = false,
  onSelect,
}) => {
  const calculateConsensus = () => {
    const total = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
    if (total === 0) return 0;
    return Math.round((proposal.votes_for / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'approved':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const consensus = calculateConsensus();
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;

  return (
    <Card 
      className={`proposal-card ${selected ? 'ring-2 ring-primary' : ''} cursor-pointer transition-all hover:shadow-lg`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(proposal.proposal_type)}
              </Badge>
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status}
              </Badge>
            </div>
            <CardTitle className="text-lg">{proposal.title}</CardTitle>
            <CardDescription className="mt-2">
              {proposal.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Voting Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{consensus}% consensus</span>
            </div>
          </div>

          {/* Vote Distribution Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {totalVotes > 0 && (
              <>
                <div
                  className="bg-green-500"
                  style={{ width: `${(proposal.votes_for / totalVotes) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(proposal.votes_against / totalVotes) * 100}%` }}
                />
                <div
                  className="bg-gray-400"
                  style={{ width: `${(proposal.votes_abstain / totalVotes) * 100}%` }}
                />
              </>
            )}
          </div>

          {/* Vote Counts */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-green-600">For: {proposal.votes_for}</span>
            <span className="text-red-600">Against: {proposal.votes_against}</span>
            <span className="text-gray-600">Abstain: {proposal.votes_abstain}</span>
          </div>

          {/* Voting Deadline */}
          {proposal.voting_ends_at && proposal.status === 'active' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3" />
              <span>Voting ends {new Date(proposal.voting_ends_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Voting Buttons */}
          {showVoting && proposal.status === 'active' && onVote && (
            <div className="flex gap-2 pt-3">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(proposal.id, 'for');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                For
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(proposal.id, 'against');
                }}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Against
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(proposal.id, 'abstain');
                }}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
