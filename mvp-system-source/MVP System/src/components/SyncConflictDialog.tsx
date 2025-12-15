import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { AlertTriangle, Monitor, Smartphone, GitBranch } from 'lucide-react';

type EntityType = 'reflection' | 'tension' | 'setting' | 'identity';

interface SyncConflict {
  id: string;
  entityType: EntityType;
  entityName: string;
  localVersion: {
    content: string;
    timestamp: string;
    device: string;
  };
  remoteVersion: {
    content: string;
    timestamp: string;
    device: string;
  };
}

interface SyncConflictDialogProps {
  isOpen: boolean;
  conflicts: SyncConflict[];
  onClose: () => void;
  onResolve: (conflictId: string, resolution: 'local' | 'remote' | 'fork') => void;
}

export function SyncConflictDialog({
  isOpen,
  conflicts,
  onClose,
  onResolve,
}: SyncConflictDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || conflicts.length === 0) return null;

  const current = conflicts[currentIndex];

  const handleResolve = (resolution: 'local' | 'remote' | 'fork') => {
    onResolve(current.id, resolution);
    
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
      setCurrentIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay-scrim)] z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-[var(--color-base-raised)] rounded-xl border border-[var(--color-border-strong)] p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20">
              <AlertTriangle size={20} className="text-[var(--color-accent-gold)]" />
            </div>
            <div>
              <h3 className="mb-1">Sync Conflict</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Conflict {currentIndex + 1} of {conflicts.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>

        {/* Conflict Type */}
        <Card variant="subtle" className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-[var(--color-surface-chip)] text-xs text-[var(--color-text-muted)]">
              {current.entityType}
            </span>
            <h4 className="text-sm">{current.entityName}</h4>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            This {current.entityType} was modified on multiple devices at the same time. 
            Choose which version to keep, or create a fork to preserve both.
          </p>
        </Card>

        {/* Version Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Local Version */}
          <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={16} className="text-[var(--color-accent-blue)]" />
              <h5 className="text-sm">Local Version</h5>
            </div>
            <div className="mb-3 p-3 rounded bg-[var(--color-base-sunken)] text-sm text-[var(--color-text-secondary)]">
              {current.localVersion.content}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              <div>Device: {current.localVersion.device}</div>
              <div>Modified: {current.localVersion.timestamp}</div>
            </div>
          </div>

          {/* Remote Version */}
          <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={16} className="text-[var(--color-accent-green)]" />
              <h5 className="text-sm">Remote Version</h5>
            </div>
            <div className="mb-3 p-3 rounded bg-[var(--color-base-sunken)] text-sm text-[var(--color-text-secondary)]">
              {current.remoteVersion.content}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              <div>Device: {current.remoteVersion.device}</div>
              <div>Modified: {current.remoteVersion.timestamp}</div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm">Choose how to resolve:</h4>
          
          <button
            onClick={() => handleResolve('local')}
            className="w-full p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)] transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <Monitor size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
              <div>
                <h5 className="text-sm mb-1">Keep Local Version</h5>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Discard changes from {current.remoteVersion.device} and keep your local version
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleResolve('remote')}
            className="w-full p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-green)] transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <Smartphone size={20} className="text-[var(--color-accent-green)] mt-0.5" />
              <div>
                <h5 className="text-sm mb-1">Keep Remote Version</h5>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Accept changes from {current.remoteVersion.device} and discard your local changes
                </p>
              </div>
            </div>
          </button>

          {current.entityType === 'reflection' && (
            <button
              onClick={() => handleResolve('fork')}
              className="w-full p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-purple)] transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <GitBranch size={20} className="text-[var(--color-accent-purple)] mt-0.5" />
                <div>
                  <h5 className="text-sm mb-1">Create Fork (Keep Both)</h5>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Preserve both versions as separate reflections in your history
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Progress */}
        {conflicts.length > 1 && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1 bg-[var(--color-base-raised)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent-gold)] transition-all"
                  style={{ width: `${((currentIndex + 1) / conflicts.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">
                {currentIndex + 1} / {conflicts.length}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Resolve Later
          </Button>
        </div>
      </div>
    </div>
  );
}
