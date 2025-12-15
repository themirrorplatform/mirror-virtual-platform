/**
 * Thread Weaver - Link reflections into evolving threads
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Plus, ChevronRight } from 'lucide-react';
import { storage, Thread } from '../../utils/storage';

interface ThreadWeaverProps {
  reflectionId?: string;
  onThreadSelected?: (threadId: string) => void;
}

export function ThreadWeaver({ reflectionId, onThreadSelected }: ThreadWeaverProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadName, setNewThreadName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setThreads(storage.getThreads());
  }, []);

  const handleCreateThread = () => {
    if (!newThreadName.trim()) return;

    const newThread: Thread = {
      id: Date.now().toString(),
      name: newThreadName,
      reflectionIds: reflectionId ? [reflectionId] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveThread(newThread);
    setThreads([...threads, newThread]);
    setNewThreadName('');
    setIsCreating(false);

    if (onThreadSelected) {
      onThreadSelected(newThread.id);
    }
  };

  const handleLinkToThread = (threadId: string) => {
    if (!reflectionId) return;

    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    if (!thread.reflectionIds.includes(reflectionId)) {
      thread.reflectionIds.push(reflectionId);
      thread.updatedAt = new Date().toISOString();
      storage.saveThread(thread);
      setThreads(threads.map(t => t.id === threadId ? thread : t));
    }

    if (onThreadSelected) {
      onThreadSelected(threadId);
    }
  };

  return (
    <div className="space-y-6">
      {reflectionId && (
        <div className="p-4 bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30 rounded-xl text-sm text-[var(--color-text-secondary)]">
          Link this reflection to a thread to track its evolution over time
        </div>
      )}

      {/* Existing threads */}
      <div className="space-y-3">
        <h4 className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
          Existing Threads
        </h4>

        {threads.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            <p>...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleLinkToThread(thread.id)}
                className="w-full p-4 bg-[var(--color-base-raised)] hover:bg-[var(--color-surface-card)] rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link2 size={18} className="text-[var(--color-accent-blue)]" />
                    <div>
                      <p className="text-[var(--color-text-primary)]">
                        {thread.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {thread.reflectionIds.length} reflection{thread.reflectionIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={18} 
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" 
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create new thread */}
      <div className="space-y-3">
        <h4 className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
          Create Thread
        </h4>

        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full p-4 border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] rounded-xl transition-all flex items-center justify-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <Plus size={18} />
            <span>New thread</span>
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={newThreadName}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewThreadName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateThread()}
              placeholder="Thread name..."
              autoFocus
              className="w-full px-5 py-3 bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateThread}
                disabled={!newThreadName.trim()}
                className="flex-1 px-4 py-2 bg-[var(--color-accent-gold)]/20 hover:bg-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewThreadName('');
                }}
                className="px-4 py-2 bg-[var(--color-base-raised)] hover:bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

