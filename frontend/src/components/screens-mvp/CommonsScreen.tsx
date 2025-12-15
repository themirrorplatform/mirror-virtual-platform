import { useState } from 'react';
import { Card, ProposalCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Users, Vote, FileText } from 'lucide-react';

export function CommonsScreen() {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'proposals' | 'governance'>('dashboard');

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Commons</h1>
        <p className="text-[var(--color-text-secondary)]">
          Collective evolution without surrendering sovereignty
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border-subtle)]">
        <TabButton
          active={selectedTab === 'dashboard'}
          onClick={() => setSelectedTab('dashboard')}
        >
          Dashboard
        </TabButton>
        <TabButton
          active={selectedTab === 'proposals'}
          onClick={() => setSelectedTab('proposals')}
        >
          Evolution Proposals
        </TabButton>
        <TabButton
          active={selectedTab === 'governance'}
          onClick={() => setSelectedTab('governance')}
        >
          Governance
        </TabButton>
      </div>

      {selectedTab === 'dashboard' && <DashboardTab />}
      {selectedTab === 'proposals' && <ProposalsTab />}
      {selectedTab === 'governance' && <GovernanceTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border-b-2 transition-colors ${
        active
          ? 'border-[var(--color-accent-gold)] text-[var(--color-text-accent)]'
          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function DashboardTab() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-gold)]">
            <Users size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">1,247</div>
          <div className="text-sm text-[var(--color-text-muted)]">Active Mirrors</div>
        </Card>
        
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-blue)]">
            <Vote size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">3</div>
          <div className="text-sm text-[var(--color-text-muted)]">Proposals Voted</div>
        </Card>
        
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-green)]">
            <FileText size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">8</div>
          <div className="text-sm text-[var(--color-text-muted)]">Packets Submitted</div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="mb-4">Recent Commons Activity</h3>
        <div className="space-y-3">
          <ActivityItem
            date="2 days ago"
            title="Voted on proposal E-2025-DEC-014"
            description="Reduce directive language in financial reflections"
          />
          <ActivityItem
            date="5 days ago"
            title="Submitted evolution packet"
            description="Behavioral patterns around anxiety reflections"
          />
          <ActivityItem
            date="1 week ago"
            title="Connected to Commons"
            description="Began participating in collective evolution"
          />
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="secondary">Browse Discussion Hub</Button>
          <Button variant="secondary">View All Proposals</Button>
          <Button variant="secondary">Explore Forks</Button>
          <Button variant="ghost">Disconnect from Commons</Button>
        </div>
      </Card>
    </div>
  );
}

function ProposalsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[var(--color-text-secondary)]">
          Evolution proposals from the collective. You decide what your Mirror adopts.
        </p>
        <Button variant="secondary" size="sm">Filter</Button>
      </div>

      <ProposalCard
        title="Reduce directive language in financial reflections"
        domain="Financial Reflections"
        integrity={{
          uniqueMirrors: 342,
          trustLevel: 'high',
        }}
        constitutionalScore={94}
        onAdopt={() => console.log('Adopt proposal')}
        onReview={() => console.log('Review proposal')}
      />

      <ProposalCard
        title="Increase probing depth for relationship tensions"
        domain="Relationship Dynamics"
        integrity={{
          uniqueMirrors: 218,
          trustLevel: 'high',
        }}
        constitutionalScore={91}
        onAdopt={() => console.log('Adopt proposal')}
        onReview={() => console.log('Review proposal')}
      />

      <ProposalCard
        title="Softer opening language for grief-related reflections"
        domain="Grief & Loss"
        integrity={{
          uniqueMirrors: 156,
          trustLevel: 'medium',
        }}
        constitutionalScore={88}
        onAdopt={() => console.log('Adopt proposal')}
        onReview={() => console.log('Review proposal')}
      />

      <Card className="border-[var(--color-border-warning)]">
        <div className="flex items-start gap-3">
          <span className="text-[var(--color-border-warning)]">⚠️</span>
          <div>
            <h4 className="mb-2 text-[var(--color-border-warning)]">Constitutional Conflict Detected</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              Proposal E-2025-DEC-009: "Add persuasive elements to health reflections"
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              This proposal conflicts with invariant: "No optimization for persuasion or behavioral manipulation."
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">View Conflict Details</Button>
              <Button variant="ghost" size="sm">Dismiss</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function GovernanceTab() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4">
          <h3 className="mb-2">Constitutional Amendments</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Changes to the foundational principles that govern Mirror behavior
          </p>
        </div>

        <div className="space-y-4">
          <AmendmentItem
            title="Clarify data ownership language"
            status="voting"
            approvalRate={76}
            threshold={80}
            timeRemaining="3 days"
          />
          
          <AmendmentItem
            title="Add multimodal reflection principles"
            status="proposed"
            approvalRate={0}
            threshold={80}
            timeRemaining="14 days"
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4">Mirror Invariants</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          These principles cannot be changed without supermajority consensus + time delay
        </p>
        
        <div className="space-y-3">
          <InvariantItem text="No optimization for engagement or time-on-platform" />
          <InvariantItem text="No hidden emotion classification or manipulation" />
          <InvariantItem text="User has absolute right to disconnect and delete" />
          <InvariantItem text="No sale of user data or behavioral patterns" />
          <InvariantItem text="Local-first by default; cloud optional" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-2">About Governance</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          The Mirror is governed by its Constitution—a set of principles that define what it can and cannot do. Changes require:
        </p>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 ml-4">
          <li>• 80% approval from participating Mirrors</li>
          <li>• Minimum 14-day review period</li>
          <li>• Constitutional integrity check</li>
          <li>• Public diff of all changes</li>
        </ul>
      </Card>
    </div>
  );
}

function ActivityItem({ date, title, description }: { date: string; title: string; description: string }) {
  return (
    <div className="pb-3 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-1">
        <h5 className="text-sm">{title}</h5>
        <span className="text-xs text-[var(--color-text-muted)]">{date}</span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function AmendmentItem({ 
  title, 
  status, 
  approvalRate, 
  threshold, 
  timeRemaining 
}: { 
  title: string; 
  status: 'proposed' | 'voting' | 'adopted' | 'rejected';
  approvalRate: number;
  threshold: number;
  timeRemaining: string;
}) {
  const statusColors = {
    proposed: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]',
    voting: 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]',
    adopted: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]',
    rejected: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]',
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
      <div className="flex items-start justify-between mb-3">
        <h5>{title}</h5>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      
      {status === 'voting' && (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-text-secondary)]">Approval Rate</span>
            <span className="text-[var(--color-text-primary)]">{approvalRate}% / {threshold}%</span>
          </div>
          <div className="h-2 bg-[var(--color-base-default)] rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-[var(--color-accent-gold)]"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{timeRemaining} remaining</span>
            <Button size="sm" variant="secondary">Review & Vote</Button>
          </div>
        </>
      )}
    </div>
  );
}

function InvariantItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-base-raised)]">
      <span className="text-[var(--color-accent-gold)] mt-0.5">⚡</span>
      <span className="text-sm text-[var(--color-text-primary)]">{text}</span>
    </div>
  );
}


