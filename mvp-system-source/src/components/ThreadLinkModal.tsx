import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Plus } from 'lucide-react';

interface Thread {
  id: string;
  name: string;
  nodeCount: number;
}

interface ThreadLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkToThread: (threadId: string) => void;
  onCreateThread: (threadName: string) => void;
  threads: Thread[];
}

export function ThreadLinkModal({
  isOpen,
  onClose,
  onLinkToThread,
  onCreateThread,
  threads,
}: ThreadLinkModalProps) {
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');

  const handleCreateAndLink = () => {
    if (newThreadName.trim()) {
      onCreateThread(newThreadName.trim());
      setNewThreadName('');
      setShowCreateNew(false);
    }
  };

  const handleClose = () => {
    setShowCreateNew(false);
    setNewThreadName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Link to thread"
    >
      <div className="space-y-4">
        {!showCreateNew ? (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Add this reflection to an existing thread or create a new one.
            </p>

            {/* Existing threads */}
            {threads.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      onLinkToThread(thread.id);
                      handleClose();
                    }}
                    className="w-full text-left p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors"
                  >
                    <div className="font-medium mb-1">{thread.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {thread.nodeCount} reflection{thread.nodeCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                ...
              </p>
            )}

            {/* Create new option */}
            <button
              onClick={() => setShowCreateNew(true)}
              className="w-full p-3 rounded-lg border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)]"
            >
              <Plus size={16} />
              <span className="text-sm">Name a new thread</span>
            </button>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Name this thread something that captures what it's about.
            </p>

            <Input
              value={newThreadName}
              onChange={setNewThreadName}
              placeholder="e.g., Financial Uncertainty..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAndLink();
                if (e.key === 'Escape') setShowCreateNew(false);
              }}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCreateNew(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateAndLink}
                disabled={!newThreadName.trim()}
              >
                Create and link
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}