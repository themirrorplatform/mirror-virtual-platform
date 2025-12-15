import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { WitnessButton } from './WitnessButton';

interface PostCardProps {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    isAnonymous?: boolean;
  };
  timestamp: string;
  isWitnessed?: boolean;
  responseCount?: number;
  onWitness: () => void;
  onRespond: () => void;
  onClick?: () => void;
}

export function PostCard({
  id,
  content,
  author,
  timestamp,
  isWitnessed = false,
  responseCount = 0,
  onWitness,
  onRespond,
  onClick,
}: PostCardProps) {
  // Content preview (max 280 chars)
  const preview = content.length > 280 ? content.slice(0, 280) + '...' : content;
  const hasMore = content.length > 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="p-8 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/30 transition-colors shadow-ambient-sm"
    >
      {/* Content - primary focus */}
      <button
        onClick={onClick}
        className="w-full text-left mb-6"
      >
        <p className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
          {preview}
        </p>
        {hasMore && (
          <span className="text-sm text-[var(--color-accent-gold)] mt-3 inline-block">
            Read more
          </span>
        )}
      </button>

      {/* Author and timestamp - subdued */}
      <div className="flex items-center justify-between mb-5 text-sm text-[var(--color-text-muted)]">
        <span>
          {author.isAnonymous ? 'Anonymous' : author.name}
        </span>
        <span>{timestamp}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <WitnessButton
          isWitnessed={isWitnessed}
          onToggle={onWitness}
        />

        <button
          onClick={onRespond}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] group"
        >
          <MessageCircle size={18} className="group-hover:text-[var(--color-accent-gold)]" />
          <span className="text-sm">Respond</span>
          {responseCount > 0 && (
            <span className="text-sm">({responseCount})</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}