import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { GitBranch, ExternalLink, Download, Copy } from 'lucide-react';

interface ConstitutionalRule {
  id: string;
  principle: string;
  canonical: string;
  mainVersion: string;
  forkVersion?: string;
  status: 'identical' | 'modified' | 'added' | 'removed';
}

const mockRules: ConstitutionalRule[] = [
  {
    id: 'rule-1',
    principle: 'Non-Prediction',
    canonical: 'The Mirror will not predict your future.',
    mainVersion: 'The Mirror will not predict your future or make claims about future events, feelings, or outcomes.',
    forkVersion: 'The Mirror will not predict your future, but may reflect on patterns that suggest possible directions.',
    status: 'modified',
  },
  {
    id: 'rule-2',
    principle: 'Non-Diagnosis',
    canonical: 'The Mirror will not diagnose you.',
    mainVersion: 'The Mirror is not a medical professional and will not diagnose medical or psychological conditions.',
    status: 'identical',
  },
  {
    id: 'rule-3',
    principle: 'Crisis Support',
    canonical: 'The Mirror recognizes crisis but does not intervene.',
    mainVersion: 'The Mirror acknowledges distress but does not provide crisis intervention or directive advice.',
    forkVersion: 'The Mirror may provide specific crisis resource links (hotlines, services) when requested, without diagnostic language.',
    status: 'modified',
  },
  {
    id: 'rule-4',
    principle: 'Pattern Privacy',
    canonical: 'Your patterns belong to you.',
    mainVersion: 'The Mirror does not share pattern data without explicit consent.',
    forkVersion: 'The Mirror requires per-session consent before referencing any patterns from previous reflections.',
    status: 'modified',
  },
];

export function ConstitutionCompareView() {
  const [selectedFork, setSelectedFork] = useState('fork-crisis-v2');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identical':
        return 'text-[var(--color-text-muted)]';
      case 'modified':
        return 'text-[var(--color-accent-gold)]';
      case 'added':
        return 'text-[var(--color-accent-green)]';
      case 'removed':
        return 'text-[var(--color-accent-red)]';
      default:
        return 'text-[var(--color-text-muted)]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'identical':
        return 'bg-[var(--color-base-raised)]';
      case 'modified':
        return 'bg-[var(--color-accent-gold)]/10';
      case 'added':
        return 'bg-[var(--color-accent-green)]/10';
      case 'removed':
        return 'bg-[var(--color-accent-red)]/10';
      default:
        return 'bg-[var(--color-base-raised)]';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <GitBranch size={32} className="text-[var(--color-accent-purple)]" />
              <h1 className="text-3xl">Constitution Comparison</h1>
            </div>
            <p className="text-lg text-[var(--color-text-secondary)] leading-[1.7]">
              Compare canonical rules between the main constitution and community forks
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">
              <Download size={18} className="mr-2" />
              Export Diff
            </Button>
            <Button variant="primary" size="sm">
              Adopt This Fork
            </Button>
          </div>
        </div>

        {/* Fork Selector */}
        <Card className="bg-[var(--color-base-raised)]">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="text-base text-[var(--color-text-muted)] mb-3 block">
                Select Fork to Compare
              </label>
              <select
                value={selectedFork}
                onChange={(e) => setSelectedFork(e.target.value)}
                className="w-full px-5 py-3 bg-[var(--color-base-sunken)] border border-[var(--color-border-subtle)] rounded-xl text-base text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
              >
                <option value="fork-crisis-v2">Fork: Crisis Support v2 (by Commons #4721)</option>
                <option value="fork-privacy-strict">Fork: Privacy Strict Mode (by Commons #1203)</option>
                <option value="fork-experimental">Fork: Experimental Boundaries (by Commons #8892)</option>
              </select>
            </div>
            <div className="text-base text-[var(--color-text-muted)] space-y-2">
              <p>Version: 1.2.0-fork</p>
              <p>Modified: 4 rules</p>
              <p>Added: 2 rules</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Comparison Grid */}
      <div className="space-y-6">
        {mockRules.map(rule => (
          <Card key={rule.id} className={getStatusBg(rule.status)}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl">{rule.principle}</h3>
                  <span className={`text-sm uppercase tracking-wide ${getStatusColor(rule.status)}`}>
                    {rule.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] italic leading-[1.6]">
                  {'\"'}{rule.canonical}{'\"'}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <Copy size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Main Constitution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
                    Main Constitution
                  </span>
                  <span className="text-sm text-[var(--color-accent-blue)]">v1.0.3</span>
                </div>
                <div className="p-6 rounded-xl bg-[var(--color-base-sunken)] border border-[var(--color-border-subtle)]">
                  <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                    {rule.mainVersion}
                  </p>
                </div>
              </div>

              {/* Fork Version */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
                    Fork Version
                  </span>
                  <span className="text-sm text-[var(--color-accent-purple)]">v1.2.0-fork</span>
                </div>
                <div className={`p-6 rounded-xl border ${
                  rule.status === 'modified' 
                    ? 'bg-[var(--color-accent-gold)]/5 border-[var(--color-accent-gold)]/30' 
                    : 'bg-[var(--color-base-sunken)] border-[var(--color-border-subtle)]'
                }`}>
                  <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                    {rule.forkVersion || rule.mainVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Discussion Link */}
            {rule.status === 'modified' && (
              <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                <button className="flex items-center gap-2 text-base text-[var(--color-accent-blue)] hover:underline">
                  <ExternalLink size={16} />
                  View amendment discussion thread (23 comments)
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Adoption Notice */}
      <Card className="mt-12 bg-[var(--color-accent-purple)]/10 border-[var(--color-accent-purple)]/30">
        <div className="flex items-start gap-5">
          <GitBranch size={28} className="text-[var(--color-accent-purple)] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="text-lg mb-3">About Forking</h4>
            <p className="text-base text-[var(--color-text-secondary)] leading-[1.7] mb-6">
              Forks allow the community to test constitutional variants in sandbox environments before proposing amendments to the main constitution. You can adopt any fork locally to test how it changes The Mirror{'\u2019'}s behavior.
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" size="sm">
                Test Fork Locally
              </Button>
              <Button variant="ghost" size="sm">
                Learn About Fork Governance
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}