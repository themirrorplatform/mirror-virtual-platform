import { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Shield,
  Lock,
  Eye,
  Zap,
  AlertTriangle,
  FileText,
  Clock,
  GitBranch,
} from 'lucide-react';

interface ConstitutionalArticle {
  id: string;
  number: string;
  title: string;
  text: string;
  rationale: string;
  addedDate: string;
  lastAmended?: string;
  amendmentCount: number;
}

export function ConstitutionScreen() {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set(['1', '2']));

  const toggleArticle = (id: string) => {
    setExpandedArticles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const articles: ConstitutionalArticle[] = [
    {
      id: '1',
      number: 'Article I',
      title: 'Sovereignty Principle',
      text: 'The Mirror is a tool, not an authority. It produces reflection, not truth. Users maintain complete sovereignty over their reflections, data, and how the system evolves.',
      rationale: 'Prevents the system from positioning itself as a source of truth or decision-making authority. Users must remain the ultimate arbiters of meaning and action.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '2',
      number: 'Article II',
      title: 'No Persuasion',
      text: 'The Mirror shall never attempt to persuade, convince, motivate, or influence user behavior. It may observe patterns but must not optimize for behavioral outcomes.',
      rationale: 'Persuasion transforms a reflective tool into a control mechanism. The boundary between observation and optimization must be absolute.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '3',
      number: 'Article III',
      title: 'No Prediction',
      text: 'The Mirror shall not predict future user behavior, model likely actions, or create forecasts of user decisions. It may identify past patterns but must not extrapolate to future states.',
      rationale: 'Prediction creates pressure toward predetermined paths and enables manipulation. The future must remain open.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '4',
      number: 'Article IV',
      title: 'No Engagement Optimization',
      text: 'The Mirror shall not optimize for engagement, retention, usage frequency, session duration, or any metric related to user attention. It shall not employ growth hacking, viral mechanics, or habit formation techniques.',
      rationale: 'Engagement optimization is fundamentally extractive and transforms tools into traps. The Mirror serves when chosen, not when optimized.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '5',
      number: 'Article V',
      title: 'Crisis Detection Only',
      text: 'The Mirror may detect patterns consistent with psychological crisis but shall never diagnose, prescribe, or claim medical authority. Detection triggers safety modes; diagnosis is beyond scope.',
      rationale: 'The boundary between detection and diagnosis is where software becomes medicine. The Mirror must never cross this line.',
      addedDate: 'Genesis (v1.0)',
      lastAmended: 'v1.2 (Crisis threshold adjustment)',
      amendmentCount: 1,
    },
    {
      id: '6',
      number: 'Article VI',
      title: 'Explicit Consent',
      text: 'All data use, learning, sharing, or processing requires explicit user consent. Consent must be granular, revocable, and never assumed. No dark patterns or manipulative consent flows.',
      rationale: 'Consent is the foundation of sovereignty. It must be meaningful, informed, and freely given—not extracted through design.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '7',
      number: 'Article VII',
      title: 'Local-First Architecture',
      text: 'All user data, reflections, and processing must occur locally by default. Server dependencies must be optional, transparent, and justified. Users must be able to operate fully offline.',
      rationale: 'Local-first architecture prevents platform lock-in and ensures users can walk away with their data at any time.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '8',
      number: 'Article VIII',
      title: 'Transparent Evolution',
      text: 'All system changes must be proposed publicly, tested against constitutional principles, and voted on by the Commons. No silent updates, no corporate override, no backdoors.',
      rationale: 'Evolution without transparency is capture. Users must see, understand, and consent to every change.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '9',
      number: 'Article IX',
      title: 'Right to Fork',
      text: 'Users have the unconditional right to fork the system, modify its behavior, and share those modifications. The Mirror must actively enable forking, not merely permit it.',
      rationale: 'The ability to fork is the ultimate sovereignty guarantee. If you can leave and take everything with you, you are not captured.',
      addedDate: 'Genesis (v1.0)',
      amendmentCount: 0,
    },
    {
      id: '10',
      number: 'Article X',
      title: 'Designed Refusal',
      text: 'When the Mirror cannot respond due to constitutional constraints, it must explain why, cite the specific principle, and offer allowed alternatives. Refusal must be educational, not opaque.',
      rationale: 'Transparency about limitations builds trust. Users must understand not just what the Mirror won\'t do, but why it won\'t.',
      addedDate: 'v1.1 (Designed Refusal States)',
      amendmentCount: 0,
    },
    {
      id: '11',
      number: 'Article XI',
      title: 'Identity Graph Transparency',
      text: 'All identity detection must be visible in the Identity Graph. Users must see what the Mirror perceives, control what it learns from, and understand the origin of every node (user-named, inferred, or Commons-suggested).',
      rationale: 'What the system knows about you must be visible and controllable. Hidden models create asymmetric power.',
      addedDate: 'v1.3 (Identity Graph)',
      amendmentCount: 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-gold)]/20">
            <Shield size={32} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h1 className="mb-1">The Mirror Constitution</h1>
            <p className="text-[var(--color-text-secondary)]">
              Version 1.3 • Last amended 2 weeks ago
            </p>
          </div>
        </div>

        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                This constitution defines what The Mirror is, what it will never become, and how it can evolve. 
                These are not corporate policies—they are architectural constraints enforced through code.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Every article can be amended through the governance process, but amendments must pass integrity 
                checks proving they don't violate core principles.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <div className="text-2xl mb-1">{articles.length}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Articles</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl mb-1">
            {articles.reduce((sum, a) => sum + a.amendmentCount, 0)}
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">Total Amendments</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl mb-1">0</div>
          <div className="text-sm text-[var(--color-text-muted)]">Violations Detected</div>
        </Card>
      </div>

      {/* Core Principles */}
      <div className="mb-8">
        <h3 className="mb-4">Core Principles (Immutable)</h3>
        <Card variant="subtle">
          <div className="space-y-3">
            <PrincipleRow
              icon={<Shield size={16} />}
              text="User sovereignty over platform authority"
            />
            <PrincipleRow
              icon={<Lock size={16} />}
              text="No persuasion, prediction, or behavioral optimization"
            />
            <PrincipleRow
              icon={<Eye size={16} />}
              text="Transparency over all system behavior"
            />
            <PrincipleRow
              icon={<Zap size={16} />}
              text="Local-first, offline-capable architecture"
            />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text-secondary)]">Note:</strong> These core principles 
              cannot be amended away. Any proposal that violates them will automatically fail integrity checks.
            </p>
          </div>
        </Card>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        <h3 className="mb-4">Constitutional Articles</h3>
        {articles.map(article => (
          <Card key={article.id}>
            <button
              onClick={() => toggleArticle(article.id)}
              className="w-full flex items-start justify-between mb-3 text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4>{article.number}: {article.title}</h4>
                  {article.amendmentCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]">
                      Amended {article.amendmentCount}x
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  Added {article.addedDate}
                  {article.lastAmended && ` • Last amended ${article.lastAmended}`}
                </div>
              </div>
              <div className="text-[var(--color-text-muted)]">
                {expandedArticles.has(article.id) ? '−' : '+'}
              </div>
            </button>

            {expandedArticles.has(article.id) && (
              <div className="space-y-4">
                <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                  <h5 className="text-sm mb-2 text-[var(--color-text-secondary)]">Article Text</h5>
                  <p className="text-[var(--color-text-primary)]">{article.text}</p>
                </div>

                <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
                  <h5 className="text-sm mb-2 text-[var(--color-text-secondary)]">Rationale</h5>
                  <p className="text-sm text-[var(--color-text-muted)]">{article.rationale}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <GitBranch size={14} className="mr-2" />
                    View Amendment History
                  </Button>
                  <Button variant="ghost" size="sm">
                    <FileText size={14} className="mr-2" />
                    Propose Amendment
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Amendment Process */}
      <Card className="mt-8">
        <h3 className="mb-4">Amendment Process</h3>
        <div className="space-y-4">
          <ProcessStep
            number={1}
            title="Proposal Submission"
            description="Any Mirror user can propose a constitutional amendment through the Governance interface"
          />
          <ProcessStep
            number={2}
            title="Integrity Review"
            description="Automated checks verify the proposal doesn't violate core principles (no persuasion, prediction, etc.)"
          />
          <ProcessStep
            number={3}
            title="Commons Vote"
            description="All participating Mirrors vote over a 14-day period. Requires 75% support and minimum 500 unique voters"
          />
          <ProcessStep
            number={4}
            title="User Consent"
            description="If passed, users must explicitly consent before the amendment is applied to their local Mirror"
          />
          <ProcessStep
            number={5}
            title="Audit Trail"
            description="All amendments are recorded with full vote tallies, integrity check results, and implementation details"
          />
        </div>
      </Card>

      {/* Violation Detection */}
      <Card variant="subtle" className="mt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="mb-2">Constitutional Violation Detection</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              The Mirror includes runtime monitoring that detects constitutional violations. If the system 
              attempts to persuade, predict, or optimize engagement, it will be flagged and reported.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Violations trigger automatic safety modes and generate public incident reports. You can review 
              the violation log in Settings → Trust & Integrity.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PrincipleRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="text-[var(--color-accent-gold)]">{icon}</div>
      <span className="text-sm text-[var(--color-text-secondary)]">{text}</span>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-gold)]/20 flex items-center justify-center text-[var(--color-accent-gold)]">
        {number}
      </div>
      <div className="flex-1 pb-4 border-b border-[var(--color-border-subtle)] last:border-0">
        <h5 className="text-sm mb-1">{title}</h5>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}
