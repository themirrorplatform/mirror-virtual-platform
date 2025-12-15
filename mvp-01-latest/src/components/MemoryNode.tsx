import { motion } from 'motion/react';
import { Link2, Eye, MessageCircle, Clock } from 'lucide-react';

interface MemoryNodeProps {
  id: string;
  content: string;
  timestamp: string;
  threadName?: string;
  threadId?: string;
  isShared?: boolean;
  witnessCount?: number;
  responseCount?: number;
  onClick?: () => void;
  onThreadClick?: (threadId: string) => void;
}

export function MemoryNode({
  id,
  content,
  timestamp,
  threadName,
  threadId,
  isShared = false,
  witnessCount = 0,
  responseCount = 0,
  onClick,
  onThreadClick,
}: MemoryNodeProps) {
  // Preview content (max 200 chars)
  const preview = content.length > 200 ? content.slice(0, 200) + '...' : content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group p-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/30 transition-colors shadow-ambient-sm"
    >
      {/* Timestamp */}
      <div className="flex items-center gap-3 mb-3 text-sm text-[var(--color-text-muted)]">
        <Clock size={14} />
        <span>{timestamp}</span>
        {isShared && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/20">
            Shared to Commons
          </span>
        )}
      </div>

      {/* Content */}
      <button
        onClick={onClick}
        className="w-full text-left mb-4"
      >
        <p className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
          {preview}
        </p>
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Thread link */}
        {threadName && threadId && (
          <button
            onClick={() => onThreadClick?.(threadId)}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
          >
            <Link2 size={14} />
            <span>{threadName}</span>
          </button>
        )}

        {/* Engagement (if shared) */}
        {isShared && (witnessCount > 0 || responseCount > 0) && (
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
            {witnessCount > 0 && (
              <span className="flex items-center gap-2">
                <Eye size={14} />
                {witnessCount}
              </span>
            )}
            {responseCount > 0 && (
              <span className="flex items-center gap-2">
                <MessageCircle size={14} />
                {responseCount}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}