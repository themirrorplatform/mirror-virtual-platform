/**
 * ThreadLinker - Modal for linking reflections to threads
 * Constitutional flow: Mirror → Threads connection
 */

import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { storage, Thread } from '../utils/storage';
import { Link2, Plus, Layers } from 'lucide-react';

interface ThreadLinkerProps {
  isOpen: boolean;
  reflectionId: string;
  reflectionPreview: string;
  onClose: () => void;
  onLinked?: (threadId: string) => void;
}

export function ThreadLinker({
  isOpen,
  reflectionId,
  reflectionPreview,
  onClose,
  onLinked,
}: ThreadLinkerProps) {
  const [threads, setThreads] = useState<Thread[]>(storage.getThreads());
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const handleLinkToExisting = () => {
    if (!selectedThreadId) return;

    storage.linkReflectionToThread(reflectionId, selectedThreadId);
    
    if (onLinked) {
      onLinked(selectedThreadId);
    }

    onClose();
  };

  const handleCreateAndLink = () => {
    if (!newThreadName.trim()) return;

    const newThread: Thread = {
      id: `thread_${Date.now()}`,
      name: newThreadName.trim(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      reflectionIds: [],
      tensions: [],
      contradictions: [],
    };

    storage.saveThread(newThread);
    storage.linkReflectionToThread(reflectionId, newThread.id);

    if (onLinked) {
      onLinked(newThread.id);
    }

    setNewThreadName('');
    setShowNewThread(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link to thread"
      size="md"
    >
      <div className="space-y-8">
        {/* Reflection preview */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-4">
            <Link2 size={18} className="text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">
              Reflection
            </span>
          </div>
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7] line-clamp-3">
            {reflectionPreview}
          </p>
        </div>

        {/* Existing threads */}
        {!showNewThread && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base text-[var(--color-text-primary)]">
                Existing threads
              </h4>
              <button
                onClick={() => setShowNewThread(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[var(--color-accent-gold)] hover:bg-[var(--color-surface-card)] transition-colors"
              >
                <Plus size={16} />
                New thread
              </button>
            </div>

            {threads.length === 0 ? (
              <div className="py-12 text-center">
                <Layers size={32} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-40" />
                <p className="text-base text-[var(--color-text-muted)] mb-6">
                  No threads exist yet.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowNewThread(true)}
                >
                  Create first thread
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                      selectedThreadId === thread.id
                        ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                        : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/40 bg-[var(--color-surface-card)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-base text-[var(--color-text-primary)] mb-2">
                          {thread.name}
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                          <span>{thread.reflectionIds.length} reflections</span>
                          <span>•</span>
                          <span>
                            {new Date(thread.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {selectedThreadId === thread.id && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-base)]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {threads.length > 0 && (
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleLinkToExisting}
                  disabled={!selectedThreadId}
                >
                  Link to thread
                </Button>
              </div>
            )}
          </div>
        )}

        {/* New thread creation */}
        {showNewThread && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setShowNewThread(false)}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-4"
              >
                ← Back to existing threads
              </button>
              
              <h4 className="text-base text-[var(--color-text-primary)] mb-4">
                Name this thread
              </h4>
              
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-[1.7]">
                Threads collect reflections around themes that recur in your life. 
                Name this one something that captures what it's about.
              </p>

              <Input
                value={newThreadName}
                onChange={setNewThreadName}
                placeholder="e.g., Financial Uncertainty, Identity Questions..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateAndLink();
                }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewThread(false);
                  setNewThreadName('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateAndLink}
                disabled={!newThreadName.trim()}
              >
                Create and link
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
