/**
 * Conflict Resolution Instrument
 * Handle sync conflicts with constitutional transparency
 * Show both versions, let user decide
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitMerge, AlertCircle, Check, X as XIcon } from 'lucide-react';

interface ConflictVersion {
  id: string;
  deviceName: string;
  timestamp: Date;
  content: string;
  metadata?: Record<string, any>;
}

interface Conflict {
  id: string;
  type: 'reflection' | 'identity-node' | 'worldview' | 'constitution';
  local: ConflictVersion;
  remote: ConflictVersion;
  constitutionalNote?: string;
}

interface ConflictResolutionInstrumentProps {
  conflict: Conflict;
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
  onClose: () => void;
}

export function ConflictResolutionInstrument({
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionInstrumentProps) {
  const [selectedVersion, setSelectedVersion] = useState<'local' | 'remote' | null>(null);

  const handleResolve = () => {
    if (selectedVersion) {
      onResolve(selectedVersion);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-5xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <GitMerge size={24} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Sync Conflict</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  The same {conflict.type} was modified on different devices
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Constitutional notice */}
          {conflict.constitutionalNote && (
            <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {conflict.constitutionalNote}
                </div>
              </div>
            </div>
          )}

          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-6">
            {/* Local version */}
            <button
              onClick={() => setSelectedVersion('local')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedVersion === 'local'
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">This Device</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {conflict.local.deviceName}
                  </p>
                </div>
                {selectedVersion === 'local' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                    <Check size={16} className="text-[var(--color-text-inverse)]" />
                  </div>
                )}
              </div>
              
              <div className="text-xs text-[var(--color-text-muted)] mb-3">
                Modified {formatTimestamp(conflict.local.timestamp)}
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] max-h-64 overflow-y-auto">
                <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-sans">
                  {conflict.local.content}
                </pre>
              </div>

              {conflict.local.metadata && Object.keys(conflict.local.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">Metadata</div>
                  <div className="space-y-1">
                    {Object.entries(conflict.local.metadata).map(([key, value]) => (
                      <div key={key} className="text-xs text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-muted)]">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Remote version */}
            <button
              onClick={() => setSelectedVersion('remote')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedVersion === 'remote'
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Other Device</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {conflict.remote.deviceName}
                  </p>
                </div>
                {selectedVersion === 'remote' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                    <Check size={16} className="text-[var(--color-text-inverse)]" />
                  </div>
                )}
              </div>
              
              <div className="text-xs text-[var(--color-text-muted)] mb-3">
                Modified {formatTimestamp(conflict.remote.timestamp)}
              </div>

              <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] max-h-64 overflow-y-auto">
                <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-sans">
                  {conflict.remote.content}
                </pre>
              </div>

              {conflict.remote.metadata && Object.keys(conflict.remote.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">Metadata</div>
                  <div className="space-y-1">
                    {Object.entries(conflict.remote.metadata).map(([key, value]) => (
                      <div key={key} className="text-xs text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-muted)]">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Resolution note */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="text-sm text-[var(--color-text-secondary)]">
              <p className="mb-2">
                <strong className="text-[var(--color-text-primary)]">You decide.</strong> The Mirror never resolves conflicts automatically.
              </p>
              <p>
                The version you don't choose will be preserved in your archive for 90 days.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!selectedVersion}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              Use Selected Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

