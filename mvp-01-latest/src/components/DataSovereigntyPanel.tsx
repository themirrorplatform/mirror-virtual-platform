import { useState } from 'react';
import { Database, HardDrive, Cloud, Trash2, Download, Eye, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface DataStats {
  totalReflections: number;
  totalThreads: number;
  totalShared: number;
  totalResponses: number;
  storageUsed: string;
  lastBackup?: string;
}

interface DataSovereigntyPanelProps {
  stats: DataStats;
  onExportAll: () => void;
  onDeleteAll: () => void;
  onViewData: () => void;
}

export function DataSovereigntyPanel({
  stats,
  onExportAll,
  onDeleteAll,
  onViewData,
}: DataSovereigntyPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAll = () => {
    if (deleteConfirmText === 'DELETE ALL') {
      onDeleteAll();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl mb-3">Data Sovereignty</h3>
        <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
          You own your data. Here's what exists, where it lives, and how to control it.
        </p>
      </div>

      {/* Storage overview */}
      <div className="grid grid-cols-2 gap-5">
        {/* Local storage */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
          <div className="flex items-center gap-3 mb-5">
            <HardDrive size={20} className="text-[var(--color-accent-gold)]" />
            <h4 className="text-base">Local Storage</h4>
          </div>
          <div className="space-y-3 text-base">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Reflections</span>
              <span className="text-[var(--color-text-primary)]">{stats.totalReflections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Threads</span>
              <span className="text-[var(--color-text-primary)]">{stats.totalThreads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Storage used</span>
              <span className="text-[var(--color-text-primary)]">{stats.storageUsed}</span>
            </div>
          </div>
        </div>

        {/* Commons data */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-sm">
          <div className="flex items-center gap-3 mb-5">
            <Cloud size={20} className="text-[var(--color-accent-gold)]" />
            <h4 className="text-base">Commons Data</h4>
          </div>
          <div className="space-y-3 text-base">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Shared posts</span>
              <span className="text-[var(--color-text-primary)]">{stats.totalShared}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Responses</span>
              <span className="text-[var(--color-text-primary)]">{stats.totalResponses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Last backup</span>
              <span className="text-[var(--color-text-primary)] text-sm">
                {stats.lastBackup || 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What data exists */}
      <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <h4 className="text-base mb-4">What data exists</h4>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>All reflections you've written (stored locally on your device)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>Thread connections and relationships between reflections</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>Reflections you've shared to Commons (also stored on server)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>Your witness actions and responses in World</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>Identity axes you've defined in Self</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>Consent preferences and settings</span>
          </li>
        </ul>
      </div>

      {/* What data does NOT exist */}
      <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <h4 className="text-base mb-4">What data does NOT exist</h4>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>No analytics or behavioral tracking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>No IP addresses or location data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>No third-party cookies or trackers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>No marketing profiles or ad targeting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--color-accent-gold)] mt-1">•</span>
            <span>No AI training on your private reflections (unless explicitly consented)</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h4 className="text-sm text-[var(--color-text-muted)]">Actions</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onViewData}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors"
          >
            <Eye size={16} />
            <span className="text-sm">View raw data</span>
          </button>

          <button
            onClick={onExportAll}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Export all data</span>
          </button>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors w-full justify-center"
        >
          <Trash2 size={16} />
          <span className="text-sm">Delete all data</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-8 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--color-surface-card)] rounded-lg border border-red-500/30 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <h3 className="text-red-400">Delete All Data</h3>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                  This will permanently delete all reflections, threads, shared posts, and settings. 
                  This action cannot be undone.
                </p>

                <div className="mb-6">
                  <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                    Type "DELETE ALL" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE ALL"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-red-500/30 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-red-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDeleteAll}
                    disabled={deleteConfirmText !== 'DELETE ALL'}
                    className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                  >
                    Delete Everything
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}