import { useState, useEffect } from 'react';
import { Card, ProposalCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Users, Vote, FileText, Plus, Shield, Award, BookOpen, GitBranch, GitMerge } from 'lucide-react';
import { commons, forks, type Publication, type Attestation, type Witness, type Fork } from '@/lib/api';

export function CommonsScreen() {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'publications' | 'proposals' | 'witnesses' | 'forks' | 'governance'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    publications: 0,
    attestations: 0,
    witnesses: 0,
  });

  useEffect(() => {
    loadCommonsData();
  }, []);

  const loadCommonsData = async () => {
    try {
      const [pubStats, attStats, witStats] = await Promise.all([
        commons.getAllPublicationsStats(),
        commons.getAllAttestationsStats(),
        commons.getAllWitnessesStats(),
      ]);
      
      setStats({
        publications: pubStats.data.total_publications,
        attestations: attStats.data.total_attestations,
        witnesses: witStats.data.total_witnesses,
      });
    } catch (error) {
      console.error('Failed to load commons data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Commons</h1>
        <p className="text-[var(--color-text-secondary)]">
          Collective evolution without surrendering sovereignty
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border-subtle)] overflow-x-auto">
        <TabButton
          active={selectedTab === 'dashboard'}
          onClick={() => setSelectedTab('dashboard')}
        >
          Dashboard
        </TabButton>
        <TabButton
          active={selectedTab === 'publications'}
          onClick={() => setSelectedTab('publications')}
        >
          Publications
        </TabButton>
        <TabButton
          active={selectedTab === 'proposals'}
          onClick={() => setSelectedTab('proposals')}
        >
          Proposals
        </TabButton>
        <TabButton
          active={selectedTab === 'witnesses'}
          onClick={() => setSelectedTab('witnesses')}
        >
          Witnesses
        </TabButton>
        <TabButton
          active={selectedTab === 'forks'}
          onClick={() => setSelectedTab('forks')}
        >
          Forks
        </TabButton>
        <TabButton
          active={selectedTab === 'governance'}
          onClick={() => setSelectedTab('governance')}
        >
          Governance
        </TabButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-gold)]" />
        </div>
      ) : (
        <>
          {selectedTab === 'dashboard' && <DashboardTab stats={stats} />}
          {selectedTab === 'publications' && <PublicationsTab />}
          {selectedTab === 'proposals' && <ProposalsTab />}
          {selectedTab === 'witnesses' && <WitnessesTab />}
          {selectedTab === 'forks' && <ForksTab />}
          {selectedTab === 'governance' && <GovernanceTab />}
        </>
      )}
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

function DashboardTab({ stats }: { stats: { publications: number; attestations: number; witnesses: number } }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-gold)]">
            <BookOpen size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">{stats.publications}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Publications</div>
        </Card>
        
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-blue)]">
            <Shield size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">{stats.attestations}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Attestations</div>
        </Card>
        
        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-accent-green)]">
            <Award size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">{stats.witnesses}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Witnesses</div>
        </Card>

        <Card className="text-center">
          <div className="flex justify-center mb-2 text-[var(--color-text-muted)]">
            <Vote size={24} />
          </div>
          <div className="text-2xl font-semibold mb-1">3</div>
          <div className="text-sm text-[var(--color-text-muted)]">Proposals Voted</div>
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

function PublicationsTab() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    try {
      const response = await commons.listPublications({ limit: 20 });
      setPublications(response.data.publications);
    } catch (error) {
      console.error('Failed to load publications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading publications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[var(--color-text-secondary)]">
          Shared insights, patterns, and resources from the commons
        </p>
        <Button variant="secondary" size="sm">
          <Plus size={16} className="mr-2" />
          New Publication
        </Button>
      </div>

      {publications.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="mb-2">No Publications Yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Be the first to share an insight with the commons
          </p>
          <Button variant="secondary">Create Publication</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => (
            <Card key={pub.publication_id} className="hover:border-[var(--color-accent-gold)] transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{pub.title}</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]">
                      {pub.publication_type}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                    {pub.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>{pub.view_count} views</span>
                    <span>{pub.attestation_count} attestations</span>
                    <span>v{pub.version}</span>
                    <span>
                      {pub.tags.map((tag) => (
                        <span key={tag} className="mr-2">#{tag}</span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WitnessesTab() {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWitnesses();
  }, []);

  const loadWitnesses = async () => {
    try {
      const response = await commons.listWitnesses({ limit: 20 });
      setWitnesses(response.data.witnesses);
    } catch (error) {
      console.error('Failed to load witnesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading witnesses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1">Witness Registry</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Trusted community members who verify and attest to contributions
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Shield size={16} className="mr-2" />
          Become a Witness
        </Button>
      </div>

      {witnesses.length === 0 ? (
        <Card className="text-center py-12">
          <Shield size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="mb-2">No Witnesses Registered</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Register as a witness to help verify community contributions
          </p>
          <Button variant="secondary">Register as Witness</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {witnesses.map((witness) => (
            <Card key={witness.witness_id} className="hover:border-[var(--color-accent-gold)] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center">
                  <Award size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5>Witness {witness.witness_id.substring(0, 8)}</h5>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      witness.verification_level === 'expert' 
                        ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                        : witness.verification_level === 'verified'
                        ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                        : 'bg-[var(--color-base-raised)]'
                    }`}>
                      {witness.verification_level}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {witness.expertise_areas.join(', ')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>⭐ {witness.reputation_score.toFixed(1)}</span>
                    <span>{witness.attestations_given} given</span>
                    <span>{witness.attestations_received} received</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ForksTab() {
  const [forkList, setForkList] = useState<Fork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFork, setSelectedFork] = useState<Fork | null>(null);
  const [showCreateFork, setShowCreateFork] = useState(false);

  useEffect(() => {
    loadForks();
  }, []);

  const loadForks = async () => {
    try {
      const response = await forks.listForks({ limit: 20 });
      setForkList(response.data.forks);
    } catch (error) {
      console.error('Failed to load forks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading forks...</div>;
  }

  if (selectedFork) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFork(null)}>
              ← Back
            </Button>
            <div>
              <h3 className="flex items-center gap-2">
                <GitBranch size={20} />
                Fork: {selectedFork.fork_id}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Forked {new Date(selectedFork.forked_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <GitMerge size={16} className="mr-2" />
              Compare
            </Button>
            <Button variant="secondary" size="sm">Adopt Fork</Button>
          </div>
        </div>

        <Card>
          <h4 className="mb-3">Fork Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Parent Instance</span>
              <span className="font-mono text-xs">{selectedFork.parent_instance_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Genesis Hash</span>
              <span className="font-mono text-xs">{selectedFork.fork_genesis_hash.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                selectedFork.status === 'active' 
                  ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                  : selectedFork.status === 'merged'
                  ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                  : 'bg-[var(--color-base-raised)]'
              }`}>
                {selectedFork.status}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h4 className="mb-3">Reason for Fork</h4>
          <p className="text-sm text-[var(--color-text-secondary)]">{selectedFork.reason}</p>
        </Card>

        {selectedFork.amendments.length > 0 && (
          <Card>
            <h4 className="mb-3">Constitutional Amendments ({selectedFork.amendments.length})</h4>
            <div className="space-y-2">
              {selectedFork.amendments.map((amendment, i) => (
                <div key={i} className="p-3 rounded-lg bg-[var(--color-base-raised)] text-sm">
                  {amendment}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h4 className="mb-3">Fork Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="secondary">View Comparison</Button>
            <Button variant="secondary">Download Fork</Button>
            <Button variant="secondary">Propose Merge</Button>
            <Button variant="ghost">Archive Fork</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1">Fork Registry</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Legitimate forks representing divergent constitutional interpretations
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCreateFork(true)}>
          <GitBranch size={16} className="mr-2" />
          Create Fork
        </Button>
      </div>

      {showCreateFork && (
        <Card className="border-[var(--color-accent-gold)]">
          <h4 className="mb-4">Create New Fork</h4>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Forking creates a legitimate divergence in Mirror's evolution. This is a serious governance action that should only be taken when fundamental disagreements cannot be resolved through proposals.
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fork ID</label>
              <input
                type="text"
                placeholder="e.g., mirror-privacy-first"
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for Fork</label>
              <textarea
                rows={4}
                placeholder="Explain why this fork is necessary and what it changes..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowCreateFork(false)}>Cancel</Button>
            <Button variant="secondary">Create Fork</Button>
          </div>
        </Card>
      )}

      {forkList.length === 0 ? (
        <Card className="text-center py-12">
          <GitBranch size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="mb-2">No Forks Registered</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            All instances are running the canonical Mirror implementation
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {forkList.map((fork) => (
            <Card 
              key={fork.id} 
              className="hover:border-[var(--color-accent-gold)] transition-colors cursor-pointer"
              onClick={() => setSelectedFork(fork)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <GitBranch size={20} className="text-[var(--color-accent-gold)]" />
                    <h4>{fork.fork_id}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      fork.status === 'active' 
                        ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                        : fork.status === 'merged'
                        ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                        : 'bg-[var(--color-base-raised)]'
                    }`}>
                      {fork.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                    {fork.reason}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>Forked {new Date(fork.forked_at).toLocaleDateString()}</span>
                    <span>{fork.amendments.length} amendments</span>
                    <span className="font-mono">{fork.parent_instance_id.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h4 className="mb-3">About Forks</h4>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Forks represent legitimate divergences in Mirror's evolution. Unlike traditional software forks, Mirror forks:
        </p>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 ml-4">
          <li>• Maintain constitutional legitimacy through governance</li>
          <li>• Can be adopted or merged back into the mainline</li>
          <li>• Preserve user sovereignty (you choose which fork to run)</li>
          <li>• Are tracked transparently in the commons</li>
        </ul>
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


