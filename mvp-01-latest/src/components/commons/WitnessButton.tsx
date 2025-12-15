/**
 * Witness Button - Constitutional alternative to "like"
 * 
 * Features:
 * - Single-click witnessing
 * - "I have witnessed this" framing
 * - Witness count display
 * - No notification spam
 * - Undo option
 * - Visual feedback
 * - Explainer on first use
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Info } from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface WitnessButtonProps {
  postId: string;
  witnessCount: number;
  hasWitnessed: boolean;
  onWitness: (postId: string) => void;
  onUnwitness: (postId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  disabled?: boolean;
}

const SIZE_CONFIG = {
  sm: { iconSize: 14, padding: 'px-2 py-1', textSize: 'text-xs' },
  md: { iconSize: 16, padding: 'px-3 py-1.5', textSize: 'text-sm' },
  lg: { iconSize: 20, padding: 'px-4 py-2', textSize: 'text-base' },
};

export function WitnessButton({
  postId,
  witnessCount,
  hasWitnessed,
  onWitness,
  onUnwitness,
  size = 'md',
  showCount = true,
  disabled = false,
}: WitnessButtonProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [justWitnessed, setJustWitnessed] = useState(false);

  const config = SIZE_CONFIG[size];

  const handleClick = () => {
    if (disabled) return;

    if (hasWitnessed) {
      onUnwitness(postId);
    } else {
      onWitness(postId);
      setJustWitnessed(true);
      setTimeout(() => setJustWitnessed(false), 1000);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-full transition-all ${config.padding} ${config.textSize} ${
          hasWitnessed
            ? 'bg-[var(--color-accent-blue)] text-white shadow-md'
            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <motion.div
          animate={justWitnessed ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Eye size={config.iconSize} />
        </motion.div>

        {showCount && (
          <span className="font-medium">
            {witnessCount}
          </span>
        )}

        {hasWitnessed && (
          <span className="hidden sm:inline">Witnessed</span>
        )}
      </motion.button>

      {/* Explainer trigger */}
      <button
        onClick={() => setShowExplainer(!showExplainer)}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-blue)] transition-colors"
      >
        <Info size={12} />
      </button>

      {/* Explainer popup */}
      <AnimatePresence>
        {showExplainer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute bottom-full mb-2 left-0 z-20"
          >
            <Card className="shadow-lg max-w-xs">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h5 className="text-sm font-medium">What is Witnessing?</h5>
                  <button
                    onClick={() => setShowExplainer(false)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)]">
                  When you witness a post, you're saying <strong>"I have seen this"</strong> or{' '}
                  <strong>"This resonated with me."</strong>
                </p>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2 text-xs">
                  <div>
                    <p className="text-[var(--color-accent-green)] mb-1">✓ Witnessing is:</p>
                    <ul className="space-y-1 ml-4 text-[var(--color-text-secondary)]">
                      <li>• Acknowledgment</li>
                      <li>• Presence</li>
                      <li>• "I hear you"</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-[var(--color-border-error)] mb-1">✗ Witnessing is not:</p>
                    <ul className="space-y-1 ml-4 text-[var(--color-text-secondary)]">
                      <li>• Endorsement</li>
                      <li>• Agreement</li>
                      <li>• Ranking signal</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Witness counts are not used to rank or promote content. They exist only 
                    as a quiet signal of connection.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Witness List - Show who has witnessed a post
 */
interface WitnessListProps {
  witnesses: Array<{
    id: string;
    name: string;
    initials: string;
    witnessedAt: Date;
  }>;
  maxDisplay?: number;
}

export function WitnessList({ witnesses, maxDisplay = 5 }: WitnessListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? witnesses : witnesses.slice(0, maxDisplay);
  const remaining = witnesses.length - maxDisplay;

  if (witnesses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
        {witnesses.length} Witness{witnesses.length !== 1 ? 'es' : ''}
      </h5>

      <div className="flex items-center gap-2">
        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {displayed.slice(0, 5).map((witness) => (
            <div
              key={witness.id}
              className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/20 border-2 border-[var(--color-surface-card)] flex items-center justify-center text-[var(--color-accent-blue)] text-xs font-medium"
              title={`${witness.name} witnessed ${formatRelativeTime(witness.witnessedAt)}`}
            >
              {witness.initials}
            </div>
          ))}
          {!showAll && remaining > 0 && (
            <div
              className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] border-2 border-[var(--color-surface-card)] flex items-center justify-center text-[var(--color-text-muted)] text-xs font-medium"
            >
              +{remaining}
            </div>
          )}
        </div>

        {/* Show all toggle */}
        {witnesses.length > maxDisplay && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-[var(--color-accent-blue)] hover:underline"
          >
            {showAll ? 'Show less' : 'Show all'}
          </button>
        )}
      </div>

      {/* Full list when expanded */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 max-h-48 overflow-y-auto"
          >
            {witnesses.map((witness) => (
              <div
                key={witness.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface-hover)]"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center text-[var(--color-accent-blue)] font-medium text-sm">
                  {witness.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {witness.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Witnessed {formatRelativeTime(witness.witnessedAt)}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility function
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  return date.toLocaleDateString();
}

export type { WitnessButtonProps, WitnessListProps };
