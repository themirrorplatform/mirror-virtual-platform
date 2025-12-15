/**
 * Constitutional Amendment Process UI
 * Guardian voting interface for governance proposals
 */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Guardian {
  guardian_id: string;
  name: string;
  role: string;
  voting_weight: number;
  status: string;
}

interface ConstitutionalProposal {
  proposal_id: string;
  proposal_type: string;
  title: string;
  description: string;
  proposed_changes: any;
  proposer_guardian_id: string;
  created_at: string;
  voting_deadline: string;
  status: string;
  threshold_required: number;
  votes: Array<{
    guardian_id: string;
    approve: boolean;
    voted_at: string;
  }>;
}

interface GovernanceInterfaceProps {
  guardianId?: string; // Current Guardian (if logged in as Guardian)
  onVote: (proposalId: string, approve: boolean) => Promise<void>;
  onCreateProposal: (proposal: Partial<ConstitutionalProposal>) => Promise<void>;
}

export const GovernanceInterface: React.FC<GovernanceInterfaceProps> = ({
  guardianId,
  onVote,
  onCreateProposal
}) => {
  const [proposals, setProposals] = useState<ConstitutionalProposal[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
    loadGuardians();
  }, []);

  const loadProposals = async () => {
    try {
      const response = await fetch('/api/governance/proposals');
      const data = await response.json();
      setProposals(data.proposals);
    } catch (err) {
      setError('Failed to load proposals');
    }
  };

  const loadGuardians = async () => {
    try {
      const response = await fetch('/api/governance/guardians');
      const data = await response.json();
      setGuardians(data.guardians);
    } catch (err) {
      setError('Failed to load guardians');
    }
  };

  const handleVote = async (proposalId: string, approve: boolean) => {
    if (!guardianId) {
      setError('Must be logged in as Guardian to vote');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onVote(proposalId, approve);
      await loadProposals(); // Refresh
    } catch (err) {
      setError(`Failed to submit vote: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProposalStatus = (proposal: ConstitutionalProposal) => {
    const now = new Date();
    const deadline = new Date(proposal.voting_deadline);
    const approveCount = proposal.votes.filter(v => v.approve).length;
    const rejectCount = proposal.votes.filter(v => !v.approve).length;

    if (proposal.status === 'approved') {
      return { label: 'Approved', color: 'bg-green-500', icon: CheckCircle };
    } else if (proposal.status === 'rejected') {
      return { label: 'Rejected', color: 'bg-red-500', icon: XCircle };
    } else if (proposal.status === 'executed') {
      return { label: 'Executed', color: 'bg-blue-500', icon: CheckCircle };
    } else if (now > deadline) {
      return { label: 'Expired', color: 'bg-gray-500', icon: Clock };
    } else if (approveCount >= proposal.threshold_required) {
      return { label: 'Threshold Reached', color: 'bg-green-400', icon: CheckCircle };
    } else {
      return { label: 'Voting', color: 'bg-yellow-500', icon: Clock };
    }
  };

  const hasVoted = (proposal: ConstitutionalProposal): boolean => {
    return proposal.votes.some(v => v.guardian_id === guardianId);
  };

  const getTimeRemaining = (deadline: string): string => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Constitutional Governance</h1>
        {guardianId && (
          <Button onClick={() => setSelectedProposal('new')}>
            Create Proposal
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Guardian Council Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Guardian Council</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Active Guardians</div>
              <div className="text-2xl font-bold">
                {guardians.filter(g => g.status === 'active').length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Threshold Requirement</div>
              <div className="text-2xl font-bold">
                3 of {guardians.length}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Active Proposals</div>
              <div className="text-2xl font-bold">
                {proposals.filter(p => p.status === 'voting').length}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Council Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {guardians.map(guardian => (
                <div
                  key={guardian.guardian_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{guardian.name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {guardian.role}
                    </div>
                  </div>
                  <Badge variant={guardian.status === 'active' ? 'default' : 'secondary'}>
                    {guardian.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Proposals</h2>
        
        {proposals.map(proposal => {
          const status = getProposalStatus(proposal);
          const StatusIcon = status.icon;
          const voted = hasVoted(proposal);
          const approveVotes = proposal.votes.filter(v => v.approve).length;
          const rejectVotes = proposal.votes.filter(v => !v.approve).length;

          return (
            <Card key={proposal.proposal_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{proposal.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="capitalize">
                        {proposal.proposal_type.replace('_', ' ')}
                      </Badge>
                      <span>•</span>
                      <span>{getTimeRemaining(proposal.voting_deadline)}</span>
                    </div>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{proposal.description}</p>

                {/* Proposed Changes */}
                {proposal.proposed_changes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Proposed Changes</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(proposal.proposed_changes, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Vote Count */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{approveVotes} Approve</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{rejectVotes} Reject</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ({proposal.threshold_required} needed to pass)
                  </div>
                </div>

                {/* Vote Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Votes Cast</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {proposal.votes.map(vote => {
                      const guardian = guardians.find(g => g.guardian_id === vote.guardian_id);
                      return (
                        <div
                          key={vote.guardian_id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <span className="text-sm">{guardian?.name || vote.guardian_id}</span>
                          {vote.approve ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Voting Actions */}
                {guardianId && !voted && proposal.status === 'voting' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="default"
                      onClick={() => handleVote(proposal.proposal_id, true)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Vote to Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVote(proposal.proposal_id, false)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Vote to Reject
                    </Button>
                  </div>
                )}

                {voted && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have already voted on this proposal
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}

        {proposals.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No proposals yet. Guardians can create constitutional amendments.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

/**
 * Create Proposal Form
 */
interface CreateProposalFormProps {
  onSubmit: (proposal: Partial<ConstitutionalProposal>) => Promise<void>;
  onCancel: () => void;
}

export const CreateProposalForm: React.FC<CreateProposalFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    proposal_type: 'constitutional_amendment',
    title: '',
    description: '',
    proposed_changes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let changes: any = null;
      if (formData.proposed_changes) {
        changes = JSON.parse(formData.proposed_changes);
      }

      await onSubmit({
        ...formData,
        proposed_changes: changes
      });
      
      // Reset form
      setFormData({
        proposal_type: 'constitutional_amendment',
        title: '',
        description: '',
        proposed_changes: ''
      });
    } catch (err) {
      setError(`Failed to create proposal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Governance Proposal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Proposal Type</label>
            <select
              className="w-full p-2 border rounded"
              value={formData.proposal_type}
              onChange={e => setFormData({ ...formData, proposal_type: e.target.value })}
            >
              <option value="constitutional_amendment">Constitutional Amendment</option>
              <option value="guardian_addition">Guardian Addition</option>
              <option value="guardian_removal">Guardian Removal</option>
              <option value="protocol_change">Protocol Change</option>
              <option value="emergency_action">Emergency Action</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for this proposal"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full p-2 border rounded h-32"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed explanation of the proposal"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Proposed Changes (JSON)</label>
            <textarea
              className="w-full p-2 border rounded h-48 font-mono text-sm"
              value={formData.proposed_changes}
              onChange={e => setFormData({ ...formData, proposed_changes: e.target.value })}
              placeholder='{"operation": "add_constraint", "constraint": "..."}'
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              Create Proposal
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GovernanceInterface;
