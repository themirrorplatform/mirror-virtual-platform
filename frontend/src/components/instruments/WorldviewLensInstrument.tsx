/**
 * Worldview Lens Instrument
 * Apply/remove perspective filters
 * Multiple active lenses allowed
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, Plus, Trash2, Sparkles } from 'lucide-react';

interface WorldviewLens {
  id: string;
  name: string;
  description: string;
  category: 'temporal' | 'relational' | 'thematic' | 'custom';
  applied: boolean;
}

interface WorldviewLensInstrumentProps {
  lenses: WorldviewLens[];
  onApply: (lensId: string) => void;
  onRemove: (lensId: string) => void;
  onCreateCustom: () => void;
  onClose: () => void;
}

export function WorldviewLensInstrument({
  lenses,
  onApply,
  onRemove,
  onCreateCustom,
  onClose,
}: WorldviewLensInstrumentProps) {
  const [filter, setFilter] = useState<string>('all');

  const appliedLenses = lenses.filter(l => l.applied);
  const availableLenses = lenses.filter(l => !l.applied);

  const filteredLenses = filter === 'all' 
    ? availableLenses 
    : availableLenses.filter(l => l.category === filter);

  const categoryColors = {
    temporal: 'text-blue-400 bg-blue-500/10',
    relational: 'text-purple-400 bg-purple-500/10',
    thematic: 'text-green-400 bg-green-500/10',
    custom: 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Eye size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Worldview Lenses</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Filter your reflections through different perspectives
                </p>
              </div>
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
          {/* Applied lenses */}
          {appliedLenses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">Active Lenses</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {appliedLenses.map((lens) => (
                    <div
                      key={lens.id}
                      className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-emphasis)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${categoryColors[lens.category].split(' ')[1]}`} />
                        <div>
                          <div className="text-sm font-medium text-[var(--color-text-primary)]">{lens.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">{lens.description}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(lens.id)}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all"
                        aria-label="Remove lens"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Category filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Available Lenses</h3>
              <div className="flex gap-2">
                {(['all', 'temporal', 'relational', 'thematic', 'custom'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`
                      px-3 py-1 rounded-lg text-xs capitalize transition-all
                      ${filter === cat
                        ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                        : 'bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-emphasis)]'
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Available lenses grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredLenses.map((lens) => (
                <button
                  key={lens.id}
                  onClick={() => onApply(lens.id)}
                  className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] text-left transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${categoryColors[lens.category]}`}>
                      {lens.category}
                    </span>
                    <Plus size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors" />
                  </div>
                  <div className="text-sm font-medium mb-1 text-[var(--color-text-primary)]">{lens.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{lens.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Create custom lens */}
          <button
            onClick={onCreateCustom}
            className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span className="text-sm">Create Custom Lens</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Example lenses for testing
export const EXAMPLE_LENSES: WorldviewLens[] = [
  {
    id: 'temporal-weekly',
    name: 'Weekly Patterns',
    description: 'Group reflections by week',
    category: 'temporal',
    applied: false,
  },
  {
    id: 'relational-threads',
    name: 'Thread Connections',
    description: 'Show how reflections connect',
    category: 'relational',
    applied: false,
  },
  {
    id: 'thematic-work',
    name: 'Work & Career',
    description: 'Filter for work-related reflections',
    category: 'thematic',
    applied: false,
  },
  {
    id: 'thematic-relationships',
    name: 'Relationships',
    description: 'Filter for relationship reflections',
    category: 'thematic',
    applied: false,
  },
];

