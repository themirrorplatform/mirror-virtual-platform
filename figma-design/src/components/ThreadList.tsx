import { motion } from 'motion/react';
import { Thread } from 'lucide-react';

interface Thread {
  id: string;
  name: string;
  nodeCount: number;
  lastUpdated: string;
  hasTensions?: boolean;
  hasContradictions?: boolean;
}

interface ThreadListProps {
  threads: Thread[];
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
}

export function ThreadList({ threads, onSelectThread, onCreateThread }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12">
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-base text-[var(--color-text-muted)] mb-10">...</p>
          <button
            onClick={onCreateThread}
            className="px-5 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors"
          >
            Name a thread
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="mb-2">Threads</h2>
          <p className="text-base text-[var(--color-text-secondary)]">
            {threads.length} thread{threads.length !== 1 ? 's' : ''} collecting reflections
          </p>
        </div>
        <button
          onClick={onCreateThread}
          className="px-5 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors"
        >
          Name a thread
        </button>
      </div>

      {/* Vertical timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--color-border-subtle)]" />

        <div className="space-y-6">
          {threads.map((thread, index) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1] 
              }}
              onClick={() => onSelectThread(thread.id)}
              className="relative w-full text-left pl-20 pr-8 py-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors group shadow-ambient-sm"
            >
              {/* Timeline dot */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-surface-card)] border-2 border-[var(--color-accent-gold)] group-hover:bg-[var(--color-accent-gold)] transition-colors" />

              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg mb-3 group-hover:text-[var(--color-accent-gold)] transition-colors">
                    {thread.name}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
                    <span>{thread.nodeCount} reflection{thread.nodeCount !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{thread.lastUpdated}</span>
                  </div>
                </div>

                {/* Indicators */}
                <div className="flex items-center gap-2">
                  {thread.hasTensions && (
                    <div 
                      className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]"
                      style={{ boxShadow: '0 0 6px var(--color-accent-gold)' }}
                      title="Has tensions"
                    />
                  )}
                  {thread.hasContradictions && (
                    <div 
                      className="w-2 h-2 rounded-full bg-[var(--color-accent-purple)]"
                      style={{ boxShadow: '0 0 6px var(--color-accent-purple)' }}
                      title="Has contradictions"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}