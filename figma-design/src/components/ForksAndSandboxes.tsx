import { useState } from 'react';
import { GitBranch, Plus, Play, Trash2, GitMerge, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface Fork {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  amendments: Amendment[];
  isActive: boolean;
}

interface Amendment {
  id: string;
  type: 'constraint' | 'feature' | 'behavior';
  label: string;
  description: string;
  enabled: boolean;
}

interface ForksAndSandboxesProps {
  forks: Fork[];
  onCreateFork: (name: string, description: string) => void;
  onActivateFork: (forkId: string) => void;
  onDeleteFork: (forkId: string) => void;
  onMergeFork: (forkId: string) => void;
  onViewFork: (forkId: string) => void;
}

export function ForksAndSandboxes({
  forks,
  onCreateFork,
  onActivateFork,
  onDeleteFork,
  onMergeFork,
  onViewFork,
}: ForksAndSandboxesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newForkName, setNewForkName] = useState('');
  const [newForkDescription, setNewForkDescription] = useState('');

  const handleCreate = () => {
    if (newForkName.trim()) {
      onCreateFork(newForkName, newForkDescription);
      setNewForkName('');
      setNewForkDescription('');
      setIsCreating(false);
    }
  };

  const activeFork = forks.find(f => f.isActive);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl mb-3">Forks & Sandboxes</h3>
        <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
          Test constitutional amendments in isolated environments before adopting them system-wide.
        </p>
      </div>

      {/* Active fork indicator */}
      {activeFork && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-[var(--color-accent-gold)]/20 border-2 border-[var(--color-accent-gold)]/30 shadow-ambient-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <GitBranch size={18} className="text-[var(--color-accent-gold)]" />
            <h4 className="text-base text-[var(--color-accent-gold)]">
              Currently active: {activeFork.name}
            </h4>
          </div>
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7] mb-4">
            {activeFork.description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onActivateFork('main')}
              className="text-sm px-4 py-2.5 rounded-xl border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 transition-colors"
            >
              Return to main
            </button>
            <button
              onClick={() => onMergeFork(activeFork.id)}
              className="text-sm px-4 py-2.5 rounded-xl border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10 transition-colors"
            >
              Merge to main
            </button>
          </div>
        </motion.div>
      )}

      {/* Explanation */}
      <div className="p-6 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <h4 className="text-base mb-3">What are forks?</h4>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
          A fork is a copy of The Mirror where you can test changes to the constitutional 
          rules, feature behaviors, or interface elements. Your main reflections remain 
          untouched while you experiment.
        </p>
        <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
          <li>• Test removing a constitutional constraint</li>
          <li>• Try different Mirrorback behaviors</li>
          <li>• Experiment with UI changes</li>
          <li>• Compare variants side-by-side</li>
        </ul>
      </div>

      {/* Existing forks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm text-[var(--color-text-muted)]">
            Your forks ({forks.length})
          </h4>
        </div>

        {forks.length === 0 && !isCreating && (
          <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
            No forks yet. Create one to test constitutional amendments.
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {forks.map((fork) => (
            <motion.div
              key={fork.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={`p-4 rounded-lg border transition-colors ${
                fork.isActive
                  ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)]/30'
                  : 'bg-[var(--color-surface-card)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={14} className="text-[var(--color-accent-gold)]" />
                    <h4 className="text-sm">{fork.name}</h4>
                    {fork.isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {fork.description}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Created {fork.createdAt}
                  </p>
                </div>
              </div>

              {/* Amendments */}
              {fork.amendments.length > 0 && (
                <div className="mb-3 space-y-1">
                  {fork.amendments.slice(0, 2).map((amendment) => (
                    <div
                      key={amendment.id}
                      className="text-xs px-2 py-1 rounded bg-[var(--color-base-raised)] text-[var(--color-text-muted)]"
                    >
                      {amendment.label}
                    </div>
                  ))}
                  {fork.amendments.length > 2 && (
                    <div className="text-xs text-[var(--color-text-muted)]">
                      +{fork.amendments.length - 2} more
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!fork.isActive && (
                  <button
                    onClick={() => onActivateFork(fork.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-accent-gold)] transition-colors"
                  >
                    <Play size={12} />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => onViewFork(fork.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-accent-gold)] transition-colors"
                >
                  <Eye size={12} />
                  View
                </button>
                {!fork.isActive && (
                  <>
                    <button
                      onClick={() => onMergeFork(fork.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] hover:border-[var(--color-accent-gold)] transition-colors"
                    >
                      <GitMerge size={12} />
                      Merge
                    </button>
                    <button
                      onClick={() => onDeleteFork(fork.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-400/50 transition-colors ml-auto"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Create fork form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)]/30"
          >
            <div className="space-y-3">
              <input
                type="text"
                value={newForkName}
                onChange={(e) => setNewForkName(e.target.value)}
                placeholder="Fork name (e.g., 'No Reflection Prompt')"
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none"
              />
              <textarea
                value={newForkDescription}
                onChange={(e) => setNewForkDescription(e.target.value)}
                placeholder="What are you testing?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewForkName('');
                    setNewForkDescription('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  disabled={!newForkName.trim()}
                >
                  Create fork
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors w-full justify-center"
        >
          <Plus size={16} />
          <span className="text-sm">Create new fork</span>
        </button>
      )}
    </div>
  );
}