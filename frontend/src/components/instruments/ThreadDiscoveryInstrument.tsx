/**
 * Thread Discovery Instrument
 * Discovers connections between reflections
 * Constitutional: user explores, system reveals patterns
 */

import { motion } from 'framer-motion';
import { Network, GitBranch, Link2, ArrowRight, X } from 'lucide-react';

interface Thread {
  id: string;
  label: string;
  reflectionCount: number;
  strength: number;
  color: string;
  keywords: string[];
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  sharedKeywords: string[];
}

interface ThreadDiscoveryInstrumentProps {
  threads: Thread[];
  connections: Connection[];
  selectedThread?: string;
  onSelectThread: (threadId: string) => void;
  onCreateThread: (name: string, reflectionIds: string[]) => void;
  onClose: () => void;
}

export function ThreadDiscoveryInstrument({
  threads,
  connections,
  selectedThread,
  onSelectThread,
  onCreateThread,
  onClose,
}: ThreadDiscoveryInstrumentProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-6xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Network size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Thread Discovery</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Explore connections in your reflections</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Discovered Threads</h3>
              {threads.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">
                  <Network size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
                  <p className="text-[var(--color-text-muted)]">No threads discovered yet</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">Keep reflecting to build connections</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => onSelectThread(thread.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedThread === thread.id
                          ? 'border-purple-400 bg-purple-500/10'
                          : 'border-[var(--color-border-subtle)] hover:border-purple-400/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: thread.color }}
                          />
                          <h4 className="font-semibold text-[var(--color-text-primary)]">{thread.label}</h4>
                        </div>
                        <div className="text-sm text-[var(--color-text-muted)]">
                          {thread.reflectionCount} reflections
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {thread.keywords.slice(0, 3).map((keyword, i) => (
                          <span key={i} className="px-2 py-1 rounded-lg bg-[var(--color-surface-card)] text-xs text-[var(--color-text-secondary)]">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${thread.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {Math.round(thread.strength * 100)}% strength
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Connections</h3>
              {connections.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">
                  <GitBranch size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
                  <p className="text-[var(--color-text-muted)]">No connections found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">{connection.from}</span>
                        <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">{connection.to}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {connection.sharedKeywords.map((keyword, j) => (
                          <span key={j} className="px-2 py-1 rounded-lg bg-purple-500/10 text-xs text-purple-400">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${connection.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {Math.round(connection.strength * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-start gap-2">
              <Link2 size={16} className="text-purple-400 mt-0.5" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                Threads emerge from your reflections. The system reveals patterns—you decide if they matter.
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

