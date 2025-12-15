/**
 * Governance Backstage UI - Guardian Console & Voting Interface
 * 
 * Features:
 * - Guardian console (proposal review, integrity reports, freeze controls)
 * - Voting interface (proposal cards, reasoning input, weight display)
 * - Integrity dashboards (Sybil detection, bot scoring, coordination alerts)
 * - Amendment process UI (supermajority tracker, reflection period countdown)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Proposal {
  id: string;
  title: string;
  proposal_type: string;
  description: string;
  status: string;
  created_at: string;
  voting_ends_at?: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  integrity_score?: number;
  integrity_issues?: string[];
}

interface IntegrityReport {
  proposal_id: string;
  integrity_score: number;
  threats: Array<{
    type: string;
    severity: number;
    description: string;
  }>;
  recommendation: string;
}

/**
 * Guardian Console - Main dashboard
 */
export const GuardianConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'integrity' | 'amendments'>('proposals');
  const [isGuardian, setIsGuardian] = useState(false);

  useEffect(() => {
    // Check if user is guardian
    checkGuardianStatus();
  }, []);

  if (!isGuardian) {
    return (
      <div className="guardian-console">
        <Alert>
          <AlertDescription>
            Guardian access required. Only appointed guardians can view this console.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="guardian-console">
      <div className="console-header">
        <h1>Guardian Console</h1>
        <div className="status-indicators">
          <StatusIndicator label="Evolution" status="active" />
          <StatusIndicator label="Commons Sync" status="active" />
          <StatusIndicator label="Integrity Check" status="monitoring" />
        </div>
      </div>

      <div className="console-tabs">
        <button
          className={activeTab === 'proposals' ? 'active' : ''}
          onClick={() => setActiveTab('proposals')}
        >
          Proposals
        </button>
        <button
          className={activeTab === 'integrity' ? 'active' : ''}
          onClick={() => setActiveTab('integrity')}
        >
          Integrity Reports
        </button>
        <button
          className={activeTab === 'amendments' ? 'active' : ''}
          onClick={() => setActiveTab('amendments')}
        >
          Constitutional Amendments
        </button>
      </div>

      <div className="console-content">
        {activeTab === 'proposals' && <ProposalReviewPanel />}
        {activeTab === 'integrity' && <IntegrityDashboard />}
        {activeTab === 'amendments' && <AmendmentPanel />}
      </div>
    </div>
  );
};

/**
 * Proposal Review Panel
 */
const ProposalReviewPanel: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    // API call to load proposals
    const response = await fetch('/api/evolution/proposals');
    const data = await response.json();
    setProposals(data.proposals);
  };

  return (
    <div className="proposal-review-panel">
      <div className="proposals-list">
        {proposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onSelect={setSelectedProposal}
            selected={selectedProposal?.id === proposal.id}
          />
        ))}
      </div>

      {selectedProposal && (
        <div className="proposal-details">
          <ProposalDetails proposal={selectedProposal} />
          <VotingInterface proposal={selectedProposal} onVoted={loadProposals} />
        </div>
      )}
    </div>
  );
};

/**
 * Proposal Card Component
 */
interface ProposalCardProps {
  proposal: Proposal;
  onSelect: (proposal: Proposal) => void;
  selected: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onSelect, selected }) => {
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
  const approvalRate = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;

  return (
    <Card 
      className={`proposal-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(proposal)}
    >
      <CardHeader>
        <div className="card-header-content">
          <CardTitle>{proposal.title}</CardTitle>
          <Badge variant={getStatusVariant(proposal.status)}>
            {proposal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="proposal-type">{proposal.proposal_type}</p>
        <div className="voting-stats">
          <div className="vote-bar">
            <div 
              className="vote-bar-fill for"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
          <div className="vote-counts">
            <span className="for">👍 {proposal.votes_for}</span>
            <span className="against">👎 {proposal.votes_against}</span>
            <span className="abstain">🤷 {proposal.votes_abstain}</span>
          </div>
        </div>
        {proposal.integrity_score !== undefined && (
          <IntegrityBadge score={proposal.integrity_score} />
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Voting Interface Component
 */
interface VotingInterfaceProps {
  proposal: Proposal;
  onVoted: () => void;
}

const VotingInterface: React.FC<VotingInterfaceProps> = ({ proposal, onVoted }) => {
  const [vote, setVote] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!vote || !reasoning.trim()) {
      alert('Please select a vote and provide reasoning');
      return;
    }

    setSubmitting(true);

    try {
      await fetch(`/api/evolution/proposals/${proposal.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote, reasoning })
      });

      alert('Vote submitted successfully');
      onVoted();
    } catch (error) {
      alert('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="voting-interface">
      <h3>Cast Your Vote</h3>
      
      <div className="vote-buttons">
        <Button
          variant={vote === 'for' ? 'default' : 'outline'}
          onClick={() => setVote('for')}
        >
          👍 Vote For
        </Button>
        <Button
          variant={vote === 'against' ? 'default' : 'outline'}
          onClick={() => setVote('against')}
        >
          👎 Vote Against
        </Button>
        <Button
          variant={vote === 'abstain' ? 'default' : 'outline'}
          onClick={() => setVote('abstain')}
        >
          🤷 Abstain
        </Button>
      </div>

      <div className="reasoning-input">
        <label>Reasoning (required):</label>
        <Textarea
          value={reasoning}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReasoning(e.target.value)}
          placeholder="Explain your vote. Your reasoning helps others understand the decision."
          rows={4}
        />
        <p className="reasoning-help">
          Good reasoning includes: Why you support/oppose, potential impacts, 
          constitutional considerations, and alternative approaches.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!vote || !reasoning.trim() || submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Vote'}
      </Button>
    </div>
  );
};

/**
 * Integrity Dashboard
 */
const IntegrityDashboard: React.FC = () => {
  const [reports, setReports] = useState<IntegrityReport[]>([]);

  useEffect(() => {
    loadIntegrityReports();
  }, []);

  const loadIntegrityReports = async () => {
    const response = await fetch('/api/governance/integrity/reports');
    const data = await response.json();
    setReports(data.reports);
  };

  return (
    <div className="integrity-dashboard">
      <h2>Integrity Monitoring</h2>

      <div className="integrity-overview">
        <Card>
          <CardHeader>
            <CardTitle>Threat Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="threat-stats">
              <ThreatStat label="Sybil Clusters" count={reports.filter(r => 
                r.threats.some(t => t.type === 'SYBIL_CLUSTER')).length} 
              />
              <ThreatStat label="Bot Voting" count={reports.filter(r => 
                r.threats.some(t => t.type === 'BOT_BEHAVIOR')).length} 
              />
              <ThreatStat label="Coordination" count={reports.filter(r => 
                r.threats.some(t => t.type === 'COORDINATED_VOTING')).length} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="integrity-reports">
        {reports.map(report => (
          <IntegrityReportCard key={report.proposal_id} report={report} />
        ))}
      </div>
    </div>
  );
};

/**
 * Integrity Report Card
 */
interface IntegrityReportCardProps {
  report: IntegrityReport;
}

const IntegrityReportCard: React.FC<IntegrityReportCardProps> = ({ report }) => {
  return (
    <Card className="integrity-report-card">
      <CardHeader>
        <CardTitle>Proposal: {report.proposal_id}</CardTitle>
        <IntegrityBadge score={report.integrity_score} />
      </CardHeader>
      <CardContent>
        <div className="threats-list">
          {report.threats.map((threat, i) => (
            <Alert key={i} variant={threat.severity > 0.7 ? 'destructive' : 'default'}>
              <AlertDescription>
                <strong>{threat.type}:</strong> {threat.description}
                <span className="severity">Severity: {(threat.severity * 100).toFixed(0)}%</span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
        <div className="recommendation">
          <strong>Recommendation:</strong> {report.recommendation}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Amendment Panel
 */
const AmendmentPanel: React.FC = () => {
  const [amendments, setAmendments] = useState<any[]>([]);

  useEffect(() => {
    loadAmendments();
  }, []);

  const loadAmendments = async () => {
    const response = await fetch('/api/governance/amendments');
    const data = await response.json();
    setAmendments(data.amendments);
  };

  return (
    <div className="amendment-panel">
      <h2>Constitutional Amendments</h2>

      <Button onClick={() => {/* Open proposal form */}}>
        Propose Amendment
      </Button>

      <div className="amendments-list">
        {amendments.map(amendment => (
          <AmendmentCard key={amendment.id} amendment={amendment} />
        ))}
      </div>
    </div>
  );
};

/**
 * Amendment Card
 */
interface AmendmentCardProps {
  amendment: any;
}

const AmendmentCard: React.FC<AmendmentCardProps> = ({ amendment }) => {
  const isReflecting = amendment.status === 'reflecting';
  const isVoting = amendment.status === 'voting';
  const totalVotes = amendment.votes_for + amendment.votes_against;
  const approvalRate = totalVotes > 0 ? (amendment.votes_for / totalVotes) * 100 : 0;

  return (
    <Card className="amendment-card">
      <CardHeader>
        <CardTitle>{amendment.title}</CardTitle>
        <Badge variant={getStatusVariant(amendment.status)}>
          {amendment.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p>{amendment.description}</p>

        {isReflecting && (
          <div className="reflection-period">
            <strong>Reflection Period:</strong>
            <p>Ends {new Date(amendment.reflection_ends_at).toLocaleDateString()}</p>
            <p className="help-text">
              Mandatory 7-day period for guardians to discuss and consider implications.
            </p>
          </div>
        )}

        {isVoting && (
          <div className="voting-status">
            <strong>Voting Status:</strong>
            <div className="supermajority-tracker">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${approvalRate}%` }}
                />
                <div className="threshold-line" style={{ left: '75%' }}>
                  75% Supermajority Required
                </div>
              </div>
              <p>
                Current: {approvalRate.toFixed(1)}% 
                ({amendment.votes_for} for, {amendment.votes_against} against)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Helper Components
 */
const StatusIndicator: React.FC<{ label: string; status: string }> = ({ label, status }) => (
  <div className={`status-indicator status-${status}`}>
    <span className="status-dot" />
    <span className="status-label">{label}</span>
  </div>
);

const IntegrityBadge: React.FC<{ score: number }> = ({ score }) => {
  const variant = score > 0.8 ? 'default' : score > 0.5 ? 'secondary' : 'destructive';
  return (
    <Badge variant={variant}>
      Integrity: {(score * 100).toFixed(0)}%
    </Badge>
  );
};

const ThreatStat: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div className="threat-stat">
    <div className="count">{count}</div>
    <div className="label">{label}</div>
  </div>
);

const ProposalDetails: React.FC<{ proposal: Proposal }> = ({ proposal }) => (
  <div className="proposal-details-content">
    <h3>{proposal.title}</h3>
    <p className="proposal-type">{proposal.proposal_type}</p>
    <div className="description">{proposal.description}</div>
    <div className="metadata">
      <p>Created: {new Date(proposal.created_at).toLocaleString()}</p>
      {proposal.voting_ends_at && (
        <p>Voting ends: {new Date(proposal.voting_ends_at).toLocaleString()}</p>
      )}
    </div>
  </div>
);

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default';
    case 'voting': return 'secondary';
    case 'passed': return 'default';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

async function checkGuardianStatus() {
  // API call to check guardian status
  return true; // Mock for now
}

export default GuardianConsole;

