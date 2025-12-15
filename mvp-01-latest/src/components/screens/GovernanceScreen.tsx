import { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Scale, Users, GitBranch, Clock, CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

type ProposalStatus = 'active' | 'passed' | 'rejected' | 'pending';
type VotePosition = 'support' | 'oppose' | 'abstain' | null;

interface Amendment {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  quorumRequired: number;
  currentParticipation: number;
  deadline: string;
  category: 'boundary' | 'engine' | 'privacy' | 'refusal';
  userVote?: VotePosition;
}

interface GovernanceScreenProps {
  onNavigate?: (view: string) => void;
}

const mockAmendments: Amendment[] = [
  {
    id: 'AMD-001',
    title: 'Expand Crisis Support Boundaries',
    description: 'Proposal to allow The Mirror to provide specific crisis resource recommendations (hotlines, services) without violating the non-directive principle.',
    proposer: 'Commons Member #4721',
    status: 'active',
    votesFor: 342,
    votesAgainst: 89,
    abstentions: 23,
    quorumRequired: 500,
    currentParticipation: 454,
    deadline: '2025-12-16',
    category: 'boundary',
  },
  {
    id: 'AMD-002',
    title: 'Add Consent Layer for Pattern Sharing',
    description: 'Require explicit per-session consent before The Mirror can reference patterns from previous reflections.',
    proposer: 'Commons Member #1203',
    status: 'active',
    votesFor: 428,
    votesAgainst: 156,
    abstentions: 67,
    quorumRequired: 500,
    currentParticipation: 651,
    deadline: '2025-12-12',
    category: 'privacy',
  },
  {
    id: 'AMD-003',
    title: 'Model Integrity Verification',
    description: 'Mandate cryptographic verification of all AI model weights before deployment to prevent tampering.',
    proposer: 'Commons Member #8892',
    status: 'passed',
    votesFor: 712,
    votesAgainst: 43,
    abstentions: 29,
    quorumRequired: 500,
    currentParticipation: 784,
    deadline: '2025-12-02',
    category: 'engine',
  },
];

export function GovernanceScreen({ onNavigate }: GovernanceScreenProps) {
  const [amendments, setAmendments] = useState<Amendment[]>(mockAmendments);
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);

  const handleVote = (amendmentId: string, position: VotePosition) => {
    setAmendments(prev => prev.map(amendment => {
      if (amendment.id === amendmentId) {
        // Remove previous vote if exists
        let newVotesFor = amendment.votesFor;
        let newVotesAgainst = amendment.votesAgainst;
        let newAbstentions = amendment.abstentions;

        if (amendment.userVote === 'support') newVotesFor--;
        if (amendment.userVote === 'oppose') newVotesAgainst--;
        if (amendment.userVote === 'abstain') newAbstentions--;

        // Add new vote
        if (position === 'support') newVotesFor++;
        if (position === 'oppose') newVotesAgainst++;
        if (position === 'abstain') newAbstentions++;

        return {
          ...amendment,
          userVote: position,
          votesFor: newVotesFor,
          votesAgainst: newVotesAgainst,
          abstentions: newAbstentions,
          currentParticipation: newVotesFor + newVotesAgainst + newAbstentions,
        };
      }
      return amendment;
    }));
  };

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'active':
        return <Clock size={16} className="text-[var(--color-accent-blue)]" />;
      case 'passed':
        return <CheckCircle size={16} className="text-[var(--color-accent-green)]" />;
      case 'rejected':
        return <XCircle size={16} className="text-[var(--color-accent-red)]" />;
      case 'pending':
        return <AlertCircle size={16} className="text-[var(--color-accent-gold)]" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'boundary':
        return 'text-[var(--color-accent-purple)]';
      case 'engine':
        return 'text-[var(--color-accent-blue)]';
      case 'privacy':
        return 'text-[var(--color-accent-gold)]';
      case 'refusal':
        return 'text-[var(--color-accent-red)]';
      default:
        return 'text-[var(--color-text-muted)]';
    }
  };

  const calculateProgress = (amendment: Amendment) => {
    return (amendment.currentParticipation / amendment.quorumRequired) * 100;
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale size={32} className="text-[var(--color-accent-gold)]" />
          <h1>The Commons</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Shared governance of The Mirror{'\u2019'}s constitution. All amendments require community consensus.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/20">
              <Users size={24} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Active Participants</p>
              <p className="text-2xl">1,847</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-accent-green)]/20">
              <CheckCircle size={24} className="text-[var(--color-accent-green)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Amendments Passed</p>
              <p className="text-2xl">23</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-accent-purple)]/20">
              <GitBranch size={24} className="text-[var(--color-accent-purple)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Active Forks</p>
              <p className="text-2xl">7</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Button variant="primary" onClick={() => setShowProposalForm(true)}>
          Propose Amendment
        </Button>
        <Button variant="secondary">
          <GitBranch size={16} className="mr-2" />
          Fork Constitution
        </Button>
        <Button variant="ghost">View History</Button>
      </div>

      {/* Amendment List */}
      <div className="space-y-4">
        {amendments.map(amendment => (
          <Card key={amendment.id} className="hover:border-[var(--color-accent-gold)] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(amendment.status)}
                  <span className={`text-xs uppercase tracking-wide ${getCategoryColor(amendment.category)}`}>
                    {amendment.category}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">•</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{amendment.id}</span>
                </div>
                <h3 className="text-lg mb-2">{amendment.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  {amendment.description}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Proposed by {amendment.proposer} • Deadline: {amendment.deadline}
                </p>
              </div>
            </div>

            {/* Vote Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Support</p>
                <p className="text-lg text-[var(--color-accent-green)]">{amendment.votesFor}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Oppose</p>
                <p className="text-lg text-[var(--color-accent-red)]">{amendment.votesAgainst}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Abstain</p>
                <p className="text-lg text-[var(--color-text-muted)]">{amendment.abstentions}</p>
              </div>
            </div>

            {/* Quorum Status */}
            {amendment.status === 'active' && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Participation</span>
                    <span>{amendment.currentParticipation} of {amendment.quorumRequired}</span>
                  </div>
                  {amendment.currentParticipation >= amendment.quorumRequired && (
                    <p className="text-xs text-[var(--color-accent-green)] mt-1">
                      Quorum met
                    </p>
                  )}
                </div>

                {/* Vote Actions */}
                <div className="flex gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
                  <Button
                    variant={amendment.userVote === 'support' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleVote(amendment.id, 'support')}
                  >
                    <ThumbsUp size={14} className="mr-1" />
                    Support
                  </Button>
                  <Button
                    variant={amendment.userVote === 'oppose' ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={() => handleVote(amendment.id, 'oppose')}
                  >
                    <ThumbsDown size={14} className="mr-1" />
                    Oppose
                  </Button>
                  <Button
                    variant={amendment.userVote === 'abstain' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleVote(amendment.id, 'abstain')}
                  >
                    Abstain
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <MessageSquare size={14} className="mr-1" />
                    Discuss (47)
                  </Button>
                </div>
              </>
            )}

            {amendment.status === 'passed' && (
              <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border-subtle)] text-[var(--color-accent-green)]">
                <CheckCircle size={16} />
                <span className="text-sm">Amendment ratified and implemented in v1.1.0</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}