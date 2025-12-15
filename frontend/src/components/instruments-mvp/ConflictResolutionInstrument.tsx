import { motion } from 'framer-motion';
import { GitMerge, Monitor, Smartphone, GitBranch } from 'lucide-react';

interface Conflict {
  id: string;
  type: 'reflection' | 'thread' | 'identity' | 'settings';
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

interface ConflictResolutionInstrumentProps {
  conflicts: Conflict[];
  onResolveKeepLocal: (conflictId: string) => void;
  onResolveKeepRemote: (conflictId: string) => void;
  onForkTimeline: (conflictId: string) => void;
  onClose: () => void;
}

export function ConflictResolutionInstrument({
  conflicts,
  onResolveKeepLocal,
  onResolveKeepRemote,
  onForkTimeline,
  onClose
}: ConflictResolutionInstrumentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl shadow-ambient-xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-emphasis)]/20 to-transparent">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
              <GitMerge size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[var(--color-text-primary)] mb-2 text-xl font-semibold tracking-tight">Resolve Conflicts</h2>
              <p className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
                {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} between devices
              </p>
            </div>
          </div>

          {/* Conflict Explanation */}
          <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
            <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
              Changes were made on different devices while offline. Choose which version to keep, or fork the timeline to preserve both.
            </p>
          </div>
        </div>

        {/* Conflicts List */}
        <div className="p-8 space-y-8">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-8 rounded-2xl border border-[var(--color-border-subtle)] shadow-ambient-sm"
            >
              {/* Conflict Type */}
              <div className="mb-6">
                <span className="px-4 py-2 rounded-full bg-[var(--color-warning)]/20 text-[var(--color-warning)] text-sm capitalize font-medium">
                  {conflict.type} conflict
                </span>
              </div>

              {/* Two Versions Side by Side */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Local Version */}
                <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <Monitor size={18} className="text-[var(--color-accent-gold)]" />
                    <span className="text-sm text-[var(--color-text-muted)] font-medium">Local Version</span>
                  </div>
                  <div className="mb-5">
                    <div className="text-base text-[var(--color-text-primary)] mb-3 max-h-40 overflow-y-auto leading-[1.7]">
                      {conflict.localVersion.content}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                    <span>{conflict.localVersion.device}</span>
                    <span>{conflict.localVersion.timestamp}</span>
                  </div>
                </div>

                {/* Remote Version */}
                <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <Smartphone size={18} className="text-[var(--color-accent-blue)]" />
                    <span className="text-sm text-[var(--color-text-muted)] font-medium">Remote Version</span>
                  </div>
                  <div className="mb-5">
                    <div className="text-base text-[var(--color-text-primary)] mb-3 max-h-40 overflow-y-auto leading-[1.7]">
                      {conflict.remoteVersion.content}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                    <span>{conflict.remoteVersion.device}</span>
                    <span>{conflict.remoteVersion.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Why This Happened */}
              <div className="mb-6 p-5 rounded-2xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 shadow-ambient-sm">
                <p className="text-sm text-[var(--color-text-secondary)] leading-[1.7]">
                  This happened because changes were made offline on both devices before syncing. 
                  The Mirror cannot automatically determine which version is "correct."
                </p>
              </div>

              {/* Resolution Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onResolveKeepLocal(conflict.id)}
                  className="flex-1 px-6 py-4 rounded-xl bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-base transition-colors font-medium shadow-ambient-sm"
                >
                  Keep Local
                </button>
                <button
                  onClick={() => onResolveKeepRemote(conflict.id)}
                  className="flex-1 px-6 py-4 rounded-xl bg-[var(--color-accent-blue)]/10 hover:bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] text-base transition-colors font-medium shadow-ambient-sm"
                >
                  Keep Remote
                </button>
                <button
                  onClick={() => onForkTimeline(conflict.id)}
                  className="flex-1 px-6 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-base transition-colors flex items-center justify-center gap-3 shadow-ambient-sm"
                >
                  <GitBranch size={18} />
                  <span>Fork Timeline</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Close */}
        <div className="p-8 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-emphasis)]/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-base transition-colors shadow-ambient-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}