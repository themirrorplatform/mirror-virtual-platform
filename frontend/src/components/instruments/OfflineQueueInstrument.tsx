/**
 * Offline Queue Instrument
 * Shows pending sync operations
 * Constitutional transparency for offline changes
 */

import { motion } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Trash2, X } from 'lucide-react';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resourceType: 'reflection' | 'identity-node' | 'thread' | 'worldview';
  timestamp: Date;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
  retryCount: number;
}

interface OfflineQueueInstrumentProps {
  operations: QueuedOperation[];
  isOnline: boolean;
  onRetry: (operationId: string) => void;
  onDiscard: (operationId: string) => void;
  onSyncAll: () => void;
  onClose: () => void;
}

export function OfflineQueueInstrument({
  operations,
  isOnline,
  onRetry,
  onDiscard,
  onSyncAll,
  onClose,
}: OfflineQueueInstrumentProps) {
  const pendingOps = operations.filter(op => op.status === 'pending');
  const failedOps = operations.filter(op => op.status === 'failed');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                {isOnline ? <Cloud size={24} className="text-green-400" /> : <CloudOff size={24} className="text-orange-400" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Offline Queue</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isOnline ? 'Online - Ready to sync' : 'Offline - Changes will sync when connected'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {operations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check size={48} className="text-green-400 mb-4" />
              <p className="text-lg text-[var(--color-text-primary)] mb-2">All synced</p>
              <p className="text-sm text-[var(--color-text-muted)]">No pending changes</p>
            </div>
          ) : (
            <>
              {pendingOps.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Pending ({pendingOps.length})</h3>
                    {isOnline && (
                      <button
                        onClick={onSyncAll}
                        className="px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] text-sm flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Sync All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {pendingOps.map((op) => (
                      <OperationCard key={op.id} operation={op} onRetry={onRetry} onDiscard={onDiscard} />
                    ))}
                  </div>
                </div>
              )}

              {failedOps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[var(--color-text-primary)]">
                    <AlertCircle size={18} className="text-red-400" />
                    Failed ({failedOps.length})
                  </h3>
                  <div className="space-y-2">
                    {failedOps.map((op) => (
                      <OperationCard key={op.id} operation={op} onRetry={onRetry} onDiscard={onDiscard} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-[var(--color-accent-gold)] mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                All changes are preserved locally. They'll sync automatically when you're back online.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OperationCard({ operation, onRetry, onDiscard }: { operation: QueuedOperation; onRetry: (id: string) => void; onDiscard: (id: string) => void }) {
  const typeColors = {
    create: 'text-green-400 bg-green-500/10',
    update: 'text-blue-400 bg-blue-500/10',
    delete: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${operation.status === 'failed' ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${typeColors[operation.type]}`}>
              {operation.type}
            </span>
            <span className="text-sm text-[var(--color-text-secondary)] capitalize">
              {operation.resourceType}
            </span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {formatTimestamp(operation.timestamp)}
            {operation.retryCount > 0 && ` • ${operation.retryCount} retries`}
          </div>
          {operation.error && (
            <div className="mt-2 text-xs text-red-400">{operation.error}</div>
          )}
        </div>
        <div className="flex gap-2">
          {operation.status === 'failed' && (
            <button onClick={() => onRetry(operation.id)} className="p-2 rounded-lg hover:bg-white/5" title="Retry">
              <RefreshCw size={16} className="text-[var(--color-text-muted)]" />
            </button>
          )}
          <button onClick={() => onDiscard(operation.id)} className="p-2 rounded-lg hover:bg-red-500/10" title="Discard">
            <Trash2 size={16} className="text-[var(--color-text-muted)] hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

