/**
 * Provenance Instrument
 * Shows data lineage and processing history
 * Constitutional transparency for all transformations
 */

import { motion } from 'framer-motion';
import { GitBranch, Clock, Database, Shield, X } from 'lucide-react';

interface ProvenanceEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: 'user' | 'system' | 'ai';
  layer: 'sovereign' | 'commons' | 'builder';
  inputHash?: string;
  outputHash?: string;
  constitutionalBasis?: string;
}

interface ProvenanceInstrumentProps {
  reflectionId: string;
  history: ProvenanceEntry[];
  onClose: () => void;
}

export function ProvenanceInstrument({
  reflectionId,
  history,
  onClose,
}: ProvenanceInstrumentProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Provenance</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Complete processing history for this reflection
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

        {/* Content - Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[var(--color-border-subtle)]" />

            {history.map((entry, index) => (
              <div key={entry.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`
                  absolute left-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${entry.actor === 'user' ? 'bg-blue-500/20 text-blue-400' : 
                    entry.actor === 'system' ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]' : 
                    'bg-purple-500/20 text-purple-400'}
                `}>
                  {entry.actor === 'user' ? <Shield size={16} /> : 
                   entry.actor === 'system' ? <Database size={16} /> : 
                   <GitBranch size={16} />}
                </div>

                {/* Entry card */}
                <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{entry.action}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] capitalize">
                        {entry.actor} • {entry.layer} layer
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Clock size={12} />
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  {(entry.inputHash || entry.outputHash) && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] space-y-1 text-xs">
                      {entry.inputHash && (
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-text-muted)]">Input:</span>
                          <span className="font-mono text-[var(--color-text-secondary)]">{entry.inputHash}</span>
                        </div>
                      )}
                      {entry.outputHash && (
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-text-muted)]">Output:</span>
                          <span className="font-mono text-[var(--color-text-secondary)]">{entry.outputHash}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.constitutionalBasis && (
                    <div className="mt-3 p-2 rounded bg-[var(--color-accent-gold)]/5 text-xs text-[var(--color-text-secondary)]">
                      <span className="text-[var(--color-text-muted)]">Constitutional basis:</span> {entry.constitutionalBasis}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

// Example history for testing
export const EXAMPLE_PROVENANCE: ProvenanceEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 86400000 * 7),
    action: 'Reflection created',
    actor: 'user',
    layer: 'sovereign',
    outputHash: 'a3f8b9c2...',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 86400000 * 5),
    action: 'Pattern analysis requested',
    actor: 'user',
    layer: 'sovereign',
    inputHash: 'a3f8b9c2...',
    outputHash: 'e4d2a1f0...',
    constitutionalBasis: 'Article II: Reflection without direction',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 86400000 * 2),
    action: 'Connected to thread',
    actor: 'system',
    layer: 'sovereign',
    inputHash: 'e4d2a1f0...',
    outputHash: 'c7b5a4e1...',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3600000),
    action: 'Reflection edited',
    actor: 'user',
    layer: 'sovereign',
    inputHash: 'c7b5a4e1...',
    outputHash: 'f9e8d7c6...',
  },
];

