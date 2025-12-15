import { CheckCircle2, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export type SyncStatus = 'ok' | 'conflicted' | 'offline' | 'syncing';

interface SyncBannerProps {
  status: SyncStatus;
  conflictCount?: number;
  onResolve?: () => void;
}

export function SyncBanner({ status, conflictCount = 0, onResolve }: SyncBannerProps) {
  if (status === 'ok') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 rounded-lg">
        <CheckCircle2 size={16} className="text-[var(--color-accent-green)]" />
        <span className="text-sm text-[var(--color-accent-green)]">All mirrors in sync</span>
      </div>
    );
  }

  if (status === 'conflicted') {
    return (
      <button
        onClick={onResolve}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 rounded-lg hover:border-[var(--color-accent-gold)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[var(--color-accent-gold)]" />
          <span className="text-sm text-[var(--color-accent-gold)]">
            {conflictCount} {conflictCount === 1 ? 'change needs' : 'changes need'} your decision
          </span>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">Click to resolve →</span>
      </button>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] rounded-lg">
        <WifiOff size={16} className="text-[var(--color-text-muted)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          Working offline — changes will sync when back online
        </span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-lg">
        <RefreshCw size={16} className="text-[var(--color-accent-blue)] animate-spin" />
        <span className="text-sm text-[var(--color-accent-blue)]">Syncing...</span>
      </div>
    );
  }

  return null;
}
