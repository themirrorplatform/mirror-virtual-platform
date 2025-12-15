/**
 * Constitution Stack Instrument
 * Read-only view + diff/proposal mode (Builder only)
 * Shows what's actively binding
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Check, AlertCircle, GitCompare, Edit3 } from 'lucide-react';

interface ConstitutionArticle {
  id: string;
  title: string;
  content: string;
  binding: boolean;
  source: 'core' | 'layer' | 'fork' | 'worldview';
}

interface Constitution {
  id: string;
  name: string;
  version: string;
  scope: string;
  articles: ConstitutionArticle[];
  active: boolean;
}

interface ConstitutionStackInstrumentProps {
  constitutions: Constitution[];
  layer: 'sovereign' | 'commons' | 'builder';
  onClose: () => void;
  onPropose?: (amendment: any) => void; // Builder only
}

type ViewMode = 'read' | 'diff' | 'proposal';

export function ConstitutionStackInstrument({
  constitutions,
  layer,
  onClose,
  onPropose,
}: ConstitutionStackInstrumentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('read');
  const [selectedConstitution, setSelectedConstitution] = useState(0);

  const isBuilder = layer === 'builder';
  const activeConstitutions = constitutions.filter(c => c.active);
  const currentConstitution = constitutions[selectedConstitution];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-5xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl flex max-h-[85vh]">
        {/* Sidebar - constitution list */}
        <div className="w-80 border-r border-[var(--color-border-subtle)] flex flex-col">
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <h3 className="mb-1">Constitution Stack</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {activeConstitutions.length} active
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {constitutions.map((constitution, index) => (
              <button
                key={constitution.id}
                onClick={() => setSelectedConstitution(index)}
                className={`
                  w-full p-3 rounded-xl text-left transition-all
                  ${selectedConstitution === index
                    ? 'bg-[var(--color-accent-gold)]/10 border-2 border-[var(--color-accent-gold)]'
                    : 'bg-[var(--color-surface-card)] border-2 border-transparent hover:border-[var(--color-border-emphasis)]'
                  }
                `}
              >
                <div className="flex items-start gap-2 mb-2">
                  <FileText size={14} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{constitution.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      v{constitution.version} • {constitution.scope}
                    </div>
                  </div>
                  {constitution.active && (
                    <div className="flex-shrink-0">
                      <Check size={14} className="text-green-400" />
                    </div>
                  )}
                </div>
                {constitution.active && (
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span>Active now</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header with view mode selector */}
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="mb-1">{currentConstitution.name}</h2>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <span>Version {currentConstitution.version}</span>
                  <span>•</span>
                  <span>{currentConstitution.scope}</span>
                  {currentConstitution.active && (
                    <>
                      <span>•</span>
                      <span className="text-green-400">Active</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* View mode tabs (Builder only) */}
            {isBuilder && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('read')}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all
                    ${viewMode === 'read'
                      ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                    }
                  `}
                >
                  Read
                </button>
                <button
                  onClick={() => setViewMode('diff')}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2
                    ${viewMode === 'diff'
                      ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                    }
                  `}
                >
                  <GitCompare size={14} />
                  <span>Diff</span>
                </button>
                <button
                  onClick={() => setViewMode('proposal')}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2
                    ${viewMode === 'proposal'
                      ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                    }
                  `}
                >
                  <Edit3 size={14} />
                  <span>Proposal</span>
                </button>
              </div>
            )}
          </div>

          {/* Articles */}
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'read' && (
              <ReadView articles={currentConstitution.articles} />
            )}
            {viewMode === 'diff' && isBuilder && (
              <DiffView articles={currentConstitution.articles} />
            )}
            {viewMode === 'proposal' && isBuilder && (
              <ProposalView 
                articles={currentConstitution.articles}
                constitutionId={currentConstitution.id}
                onPropose={onPropose}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Read-only view
function ReadView({ articles }: { articles: ConstitutionArticle[] }) {
  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <div
          key={article.id}
          className={`
            p-6 rounded-xl border-2 transition-all
            ${article.binding
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]'
            }
          `}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="mb-1">{article.title}</h4>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="capitalize">{article.source}</span>
                {article.binding && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">Binding now</span>
                  </>
                )}
              </div>
            </div>
            {article.binding && (
              <Check size={16} className="text-green-400" />
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {article.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// Diff view (Builder only)
function DiffView({ articles }: { articles: ConstitutionArticle[] }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
          <div className="text-sm text-[var(--color-text-secondary)]">
            Diff mode shows changes between constitution versions. Select two versions to compare.
          </div>
        </div>
      </div>

      {/* Placeholder for actual diff logic */}
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Select versions to compare
      </div>
    </div>
  );
}

// Proposal view (Builder only)
function ProposalView({
  articles,
  constitutionId,
  onPropose,
}: {
  articles: ConstitutionArticle[];
  constitutionId: string;
  onPropose?: (amendment: any) => void;
}) {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [proposedText, setProposedText] = useState('');

  const handleSubmitProposal = () => {
    if (!selectedArticle || !proposedText || !onPropose) return;

    onPropose({
      constitutionId,
      articleId: selectedArticle,
      proposedContent: proposedText,
      timestamp: new Date(),
    });

    setSelectedArticle(null);
    setProposedText('');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
          <div className="text-sm text-[var(--color-text-secondary)]">
            Amendments require governance approval. Proposals are subject to review and voting.
          </div>
        </div>
      </div>

      {/* Article selection */}
      <div>
        <label className="block text-sm text-[var(--color-text-secondary)] mb-3">
          Select article to amend
        </label>
        <div className="space-y-2">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => {
                setSelectedArticle(article.id);
                setProposedText(article.content);
              }}
              className={`
                w-full p-4 rounded-xl text-left border-2 transition-all
                ${selectedArticle === article.id
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                }
              `}
            >
              <div className="text-sm mb-1">{article.title}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {article.content.slice(0, 100)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Proposal editor */}
      {selectedArticle && (
        <div>
          <label className="block text-sm text-[var(--color-text-secondary)] mb-3">
            Proposed amendment
          </label>
          <textarea
            value={proposedText}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setProposedText(e.target.value)}
            className="w-full h-48 px-4 py-3 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none resize-none"
            placeholder="Enter proposed text..."
          />
          <button
            onClick={handleSubmitProposal}
            className="mt-3 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] transition-all"
          >
            Submit Proposal
          </button>
        </div>
      )}
    </div>
  );
}

// Example constitution data
export const CORE_CONSTITUTION: Constitution = {
  id: 'core-v1',
  name: 'Core Constitution',
  version: '1.0',
  scope: 'All layers',
  active: true,
  articles: [
    {
      id: 'art-1',
      title: 'Article I: Sovereignty',
      content: 'The Mirror serves the user, never a platform. All data sovereignty resides with the user. No extraction, no manipulation, no hidden agendas.',
      binding: true,
      source: 'core',
    },
    {
      id: 'art-2',
      title: 'Article II: Reflection',
      content: 'The Mirror reflects, it does not direct. No advice, no optimization, no "correct" paths. Only mirroring what appears.',
      binding: true,
      source: 'core',
    },
    {
      id: 'art-3',
      title: 'Article III: Silence',
      content: 'Silence over prescription. The system waits, it does not pull. No gamification, no progress bars, no completion mechanics.',
      binding: true,
      source: 'core',
    },
    {
      id: 'art-4',
      title: 'Article IV: Consent',
      content: 'All boundaries require explicit consent. No implied permissions, no dark patterns, no coercion. The user can revoke any consent at any time.',
      binding: true,
      source: 'core',
    },
    {
      id: 'art-5',
      title: 'Article V: Transparency',
      content: 'All constraints are visible when they bind. Constitutions, licenses, and speech contracts are always accessible. No hidden rules.',
      binding: true,
      source: 'core',
    },
  ],
};
