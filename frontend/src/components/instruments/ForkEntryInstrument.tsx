/**
 * Fork Entry Instrument
 * Create constitutional testing sandboxes
 * Explicit boundaries, clear purpose statement
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Shield, AlertCircle, X } from 'lucide-react';

interface ForkEntryInstrumentProps {
  onCreateFork: (config: ForkConfig) => void;
  onClose: () => void;
}

interface ForkConfig {
  name: string;
  purpose: string;
  baseLayer: 'sovereign' | 'commons' | 'builder';
  constitutionalModifications: string[];
  autoDelete: boolean;
  autoDeleteDays?: number;
}

export function ForkEntryInstrument({ onCreateFork, onClose }: ForkEntryInstrumentProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [baseLayer, setBaseLayer] = useState<'sovereign' | 'commons' | 'builder'>('sovereign');
  const [autoDelete, setAutoDelete] = useState(true);
  const [autoDeleteDays, setAutoDeleteDays] = useState(7);

  const handleCreate = () => {
    if (!name || !purpose) return;

    const config: ForkConfig = {
      name,
      purpose,
      baseLayer,
      constitutionalModifications: [],
      autoDelete,
      autoDeleteDays: autoDelete ? autoDeleteDays : undefined,
    };

    onCreateFork(config);
  };

  const canCreate = name.length > 0 && purpose.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-gold)]/10 flex items-center justify-center">
              <GitBranch size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Create Fork</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Constitutional testing sandbox
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* What is a fork */}
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="mb-2">
                  Forks are temporary testing environments where you can experiment with different constitutional rules.
                </p>
                <p>
                  They exist alongside your main Mirror without affecting it. All fork data is clearly marked and can be merged or discarded.
                </p>
              </div>
            </div>
          </div>

          {/* Fork name */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
              Fork name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setName(e.target.value)}
              placeholder="e.g., test-advice-mode"
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none transition-colors"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
              Purpose statement
            </label>
            <textarea
              value={purpose}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPurpose(e.target.value)}
              placeholder="What are you testing in this fork? Be specific about which constitutional rules you want to modify."
              rows={4}
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Base layer */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--color-text-primary)]">
              Base layer
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['sovereign', 'commons', 'builder'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setBaseLayer(layer)}
                  className={`
                    p-3 rounded-xl border-2 transition-all text-center
                    ${baseLayer === layer
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                    }
                  `}
                >
                  <div className="text-sm capitalize text-[var(--color-text-primary)]">{layer}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-delete */}
          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--color-text-primary)]">
              Lifetime
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setAutoDelete(true)}
                className={`
                  w-full p-4 rounded-xl text-left border-2 transition-all
                  ${autoDelete
                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }
                `}
              >
                <div className="text-sm mb-1 text-[var(--color-text-primary)]">Auto-delete after testing</div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Fork will be automatically deleted after {autoDeleteDays} days
                </p>
              </button>
              {autoDelete && (
                <div className="flex items-center gap-3 px-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={autoDeleteDays}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAutoDeleteDays(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] min-w-[60px]">
                    {autoDeleteDays} days
                  </span>
                </div>
              )}
              <button
                onClick={() => setAutoDelete(false)}
                className={`
                  w-full p-4 rounded-xl text-left border-2 transition-all
                  ${!autoDelete
                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }
                `}
              >
                <div className="text-sm mb-1 text-[var(--color-text-primary)]">Manual deletion</div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  You decide when to delete or merge this fork
                </p>
              </button>
            </div>
          </div>

          {/* Constitutional notice */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-[var(--color-text-muted)] mt-0.5" />
              <div className="text-xs text-[var(--color-text-secondary)]">
                All fork data is clearly marked in receipts and provenance. You can always see what came from a fork vs. your main Mirror.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <GitBranch size={18} />
            Create Fork
          </button>
        </div>
      </div>
    </div>
  );
}


