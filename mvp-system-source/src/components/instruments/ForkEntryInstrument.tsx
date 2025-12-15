/**
 * Fork Entry Instrument
 * Shows rule changes when entering a fork context
 * Makes fork boundaries explicit and reversible
 */

import { motion } from 'motion/react';
import { GitFork, AlertCircle, FileText, Shield, Eye, ArrowRight } from 'lucide-react';

interface ForkContext {
  id: string;
  name: string;
  description: string;
  creator: string;
  createdAt: Date;
  constitutions: string[];
  licenses: string[];
  worldviews: string[];
  ruleChanges: {
    category: string;
    change: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  recognition: 'recognized' | 'conditional' | 'suspended' | 'revoked';
  scope: 'private' | 'shared' | 'public';
}

interface ForkEntryInstrumentProps {
  fork: ForkContext;
  onEnter: (forkId: string) => void;
  onReturn: () => void;
  onViewConstitution?: (id: string) => void;
  onViewLicense?: (id: string) => void;
}

export function ForkEntryInstrument({
  fork,
  onEnter,
  onReturn,
  onViewConstitution,
  onViewLicense,
}: ForkEntryInstrumentProps) {
  const recognitionColor = {
    recognized: 'text-green-400',
    conditional: 'text-yellow-400',
    suspended: 'text-orange-400',
    revoked: 'text-red-400',
  };

  const impactColor = {
    low: 'border-blue-500/30 bg-blue-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    high: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onReturn();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--color-accent-gold)]/10 flex items-center justify-center flex-shrink-0">
              <GitFork size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="mb-1">Entering Fork</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                This fork changes how the Mirror behaves
              </p>
            </div>
            <button
              onClick={onReturn}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Fork identity */}
          <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <h3 className="mb-2">{fork.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {fork.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
              <span>by {fork.creator}</span>
              <span>•</span>
              <span>{fork.createdAt.toLocaleDateString()}</span>
              <span>•</span>
              <span className="capitalize">{fork.scope}</span>
            </div>
          </div>

          {/* Recognition status */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className={recognitionColor[fork.recognition]} />
              <h4 className="text-sm">Recognition Status</h4>
            </div>
            <div className={`text-sm capitalize ${recognitionColor[fork.recognition]}`}>
              {fork.recognition}
            </div>
            {fork.recognition === 'conditional' && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                This fork is conditionally recognized. Some features may be limited.
              </p>
            )}
            {fork.recognition === 'revoked' && (
              <p className="text-xs text-red-400 mt-2">
                This fork's recognition has been revoked. Use with caution.
              </p>
            )}
          </div>

          {/* Rule changes (critical section) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-[var(--color-accent-gold)]" />
              <h3>What Changes in This Fork</h3>
            </div>

            <div className="space-y-3">
              {fork.ruleChanges.map((change, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-2 ${impactColor[change.impact]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium">{change.category}</div>
                    <div className="text-xs text-[var(--color-text-muted)] capitalize">
                      {change.impact} impact
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {change.change}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Constitutions */}
          {fork.constitutions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[var(--color-text-muted)]" />
                <h4>Fork Constitutions</h4>
              </div>
              <div className="space-y-2">
                {fork.constitutions.map((constitution) => (
                  <button
                    key={constitution}
                    onClick={() => onViewConstitution?.(constitution)}
                    className="w-full p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left text-sm transition-all flex items-center justify-between"
                  >
                    <span>{constitution}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Licenses */}
          {fork.licenses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-[var(--color-text-muted)]" />
                <h4>Fork Licenses</h4>
              </div>
              <div className="space-y-2">
                {fork.licenses.map((license) => (
                  <button
                    key={license}
                    onClick={() => onViewLicense?.(license)}
                    className="w-full p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left text-sm transition-all flex items-center justify-between"
                  >
                    <span>{license}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Worldviews */}
          {fork.worldviews.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={16} className="text-[var(--color-text-muted)]" />
                <h4>Active Worldviews</h4>
              </div>
              <div className="space-y-2">
                {fork.worldviews.map((worldview) => (
                  <div
                    key={worldview}
                    className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-sm"
                  >
                    {worldview}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scope boundary */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="text-sm text-[var(--color-text-secondary)]">
              <strong>Fork scope:</strong> Changes apply only within this fork context. 
              Your main Mirror instance remains unaffected. You can exit at any time.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex gap-3 flex-shrink-0">
          <button
            onClick={onReturn}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Return
          </button>
          <button
            onClick={() => onEnter(fork.id)}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] transition-all"
          >
            Enter Fork
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Example fork context
export const EXAMPLE_FORK: ForkContext = {
  id: 'fork-stoic-mirror',
  name: 'Stoic Mirror',
  description: 'A fork that applies Stoic philosophy to reflection patterns',
  creator: 'anon_user_123',
  createdAt: new Date('2024-01-15'),
  scope: 'shared',
  recognition: 'recognized',
  constitutions: ['Stoic Constitution v1.0'],
  licenses: ['Stoic Reflection License v1.0'],
  worldviews: ['Stoicism', 'Dichotomy of Control'],
  ruleChanges: [
    {
      category: 'Reflection Framing',
      change: 'All reflections are reframed through the lens of what is within vs beyond your control',
      impact: 'high',
    },
    {
      category: 'Mirrorback Language',
      change: 'Mirrorbacks use Stoic terminology and concepts when relevant',
      impact: 'medium',
    },
    {
      category: 'Identity Recognition',
      change: 'Identity nodes are categorized by virtue/vice alignment',
      impact: 'medium',
    },
    {
      category: 'Thread Patterns',
      change: 'Threads surface patterns of attachment and aversion',
      impact: 'low',
    },
  ],
};