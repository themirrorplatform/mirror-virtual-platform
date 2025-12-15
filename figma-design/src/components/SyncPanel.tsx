/**
 * Sync Panel - Manual synchronization controls
 * 
 * Constitutional: User-initiated only, never automatic
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  Upload, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { syncService, SyncState, SyncConflict } from '../services/syncService';
import { Card } from './Card';
import { Button } from './Button';
import { Modal } from './Modal';

export function SyncPanel() {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  const handleSync = async () => {
    await syncService.sync();
  };

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Synchronization</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Manual sync across devices
              </p>
            </div>
            
            <StatusIndicator status={syncState.status} />
          </div>

          {/* Last Sync */}
          {syncState.lastSync && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Clock size={14} />
              <span>
                Last synced: {syncState.lastSync.toLocaleString()}
              </span>
            </div>
          )}

          {/* Conflicts Warning */}
          {syncState.conflicts.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 border-l-4 border-[var(--color-accent-yellow)]">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-[var(--color-accent-yellow)] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    {syncState.conflicts.length} conflict{syncState.conflicts.length !== 1 ? 's' : ''} detected
                  </p>
                  <button
                    onClick={() => setShowConflicts(true)}
                    className="text-sm text-[var(--color-accent-blue)] hover:underline"
                  >
                    Resolve conflicts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={syncState.status === 'syncing'}
              className="flex-1"
            >
              {syncState.status === 'syncing' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync Now
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => syncService.pushChanges()}
              disabled={syncState.status === 'syncing'}
            >
              <Upload size={16} />
              Push
            </Button>

            <Button
              variant="ghost"
              onClick={() => syncService.pullChanges()}
              disabled={syncState.status === 'syncing'}
            >
              <Download size={16} />
              Pull
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-[var(--color-text-muted)] italic">
            Sync happens only when you initiate it
          </p>
        </div>
      </Card>

      {/* Conflicts Modal */}
      {showConflicts && (
        <ConflictsModal
          conflicts={syncState.conflicts}
          onClose={() => setShowConflicts(false)}
          onResolve={async (id, choice) => {
            await syncService.resolveConflict(id, choice);
          }}
        />
      )}
    </>
  );
}

// Status Indicator
function StatusIndicator({ status }: { status: SyncState['status'] }) {
  const config = {
    idle: {
      icon: CheckCircle,
      color: 'text-[var(--color-accent-green)]',
      label: 'Synced',
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-[var(--color-accent-blue)]',
      label: 'Syncing...',
    },
    error: {
      icon: AlertCircle,
      color: 'text-[var(--color-border-error)]',
      label: 'Error',
    },
    conflict: {
      icon: AlertCircle,
      color: 'text-[var(--color-accent-yellow)]',
      label: 'Conflicts',
    },
  };

  const { icon: Icon, color, label } = config[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      <Icon size={16} className={status === 'syncing' ? 'animate-spin' : ''} />
      <span>{label}</span>
    </div>
  );
}

// Conflicts Modal
function ConflictsModal({
  conflicts,
  onClose,
  onResolve,
}: {
  conflicts: SyncConflict[];
  onClose: () => void;
  onResolve: (id: string, choice: 'local' | 'remote') => Promise<void>;
}) {
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (id: string, choice: 'local' | 'remote') => {
    setResolving(id);
    try {
      await onResolve(id, choice);
    } finally {
      setResolving(null);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Resolve Sync Conflicts">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          These reflections have conflicting versions. Choose which to keep.
        </p>

        <div className="space-y-4">
          {conflicts.map(conflict => (
            <Card key={conflict.id} variant="emphasis">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <AlertCircle size={14} />
                  <span>Conflict detected {conflict.timestamp.toLocaleString()}</span>
                </div>

                {/* Local Version */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Local Version</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(conflict.local.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[var(--color-surface-hover)] text-sm">
                    {conflict.local.content.substring(0, 200)}
                    {conflict.local.content.length > 200 && '...'}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolve(conflict.id, 'local')}
                    disabled={resolving === conflict.id}
                    className="mt-2"
                  >
                    Keep Local
                  </Button>
                </div>

                {/* Remote Version */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Remote Version</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(conflict.remote.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[var(--color-surface-hover)] text-sm">
                    {conflict.remote.content.substring(0, 200)}
                    {conflict.remote.content.length > 200 && '...'}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolve(conflict.id, 'remote')}
                    disabled={resolving === conflict.id}
                    className="mt-2"
                  >
                    Keep Remote
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Sync Status Bar - Minimal indicator
 */
export function SyncStatusBar() {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  if (syncState.status === 'idle' && syncState.conflicts.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-4 right-4 z-40"
      >
        <Card className="shadow-lg">
          <div className="flex items-center gap-3">
            <StatusIndicator status={syncState.status} />
            {syncState.conflicts.length > 0 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {syncState.conflicts.length} conflict{syncState.conflicts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
