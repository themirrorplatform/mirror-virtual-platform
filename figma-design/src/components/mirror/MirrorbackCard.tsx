/**
 * Mirrorback Card - AI reflection response display
 * 
 * Features:
 * - Mirrorback content
 * - Reflection type (question, observation, tension, connection)
 * - Confidence level
 * - Hide/show toggle
 * - Archive option
 * - "Why this?" explainer
 * - Response threading
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles,
  Eye,
  EyeOff,
  Archive,
  Info,
  HelpCircle,
  Lightbulb,
  Link2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

export type MirrorbackType = 'question' | 'observation' | 'tension' | 'connection' | 'pattern';

interface Mirrorback {
  id: string;
  content: string;
  type: MirrorbackType;
  confidence: number; // 0.0 - 1.0
  createdAt: Date;
  reflectionId: string;
  explanation?: string;
  isHidden?: boolean;
  isArchived?: boolean;
  threadCount?: number;
}

interface MirrorbackCardProps {
  mirrorback: Mirrorback;
  onToggleVisibility?: (mirrorbackId: string) => void;
  onArchive?: (mirrorbackId: string) => void;
  onRespond?: (mirrorbackId: string) => void;
  showExplanation?: boolean;
  compact?: boolean;
}

const MIRRORBACK_TYPE_CONFIG = {
  question: {
    label: 'Question',
    description: 'An invitation to explore further',
    icon: <HelpCircle size={16} />,
    color: '#3B82F6',
  },
  observation: {
    label: 'Observation',
    description: 'A pattern noticed in your reflection',
    icon: <Eye size={16} />,
    color: '#8B5CF6',
  },
  tension: {
    label: 'Tension',
    description: 'A potential conflict or contradiction',
    icon: <AlertCircle size={16} />,
    color: '#F59E0B',
  },
  connection: {
    label: 'Connection',
    description: 'A link to previous reflections',
    icon: <Link2 size={16} />,
    color: '#10B981',
  },
  pattern: {
    label: 'Pattern',
    description: 'A recurring theme detected',
    icon: <Lightbulb size={16} />,
    color: '#EC4899',
  },
};

export function MirrorbackCard({
  mirrorback,
  onToggleVisibility,
  onArchive,
  onRespond,
  showExplanation = false,
  compact = false,
}: MirrorbackCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [showWhy, setShowWhy] = useState(showExplanation);

  const typeConfig = MIRRORBACK_TYPE_CONFIG[mirrorback.type];
  const confidenceLevel = getConfidenceLevel(mirrorback.confidence);

  if (mirrorback.isHidden) {
    return (
      <Card className="border-2 border-dashed border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <EyeOff size={16} />
            <span>Mirrorback hidden</span>
          </div>
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(mirrorback.id)}
            >
              Show
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card
        className="border-l-4"
        style={{ borderLeftColor: typeConfig.color }}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="p-1.5 rounded-lg"
                style={{ 
                  backgroundColor: `${typeConfig.color}20`,
                  color: typeConfig.color 
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{typeConfig.label}</span>
                  <Badge variant={confidenceLevel.variant} size="sm">
                    {Math.round(mirrorback.confidence * 100)}%
                  </Badge>
                </div>
                {!compact && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {typeConfig.description}
                  </p>
                )}
              </div>
            </div>

            {!compact && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>

          {/* Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                  <p className="text-sm text-[var(--color-text-secondary)] italic">
                    {mirrorback.content}
                  </p>
                </div>

                {/* Explanation */}
                {mirrorback.explanation && (
                  <>
                    <button
                      onClick={() => setShowWhy(!showWhy)}
                      className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
                    >
                      <Info size={12} />
                      {showWhy ? 'Hide' : 'Why this?'}
                    </button>

                    <AnimatePresence>
                      {showWhy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <Card className="border-2 border-[var(--color-accent-blue)]">
                            <div className="flex items-start gap-3">
                              <Info size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {mirrorback.explanation}
                              </p>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>{formatDate(mirrorback.createdAt)}</span>
                  {mirrorback.threadCount !== undefined && mirrorback.threadCount > 0 && (
                    <span>{mirrorback.threadCount} response{mirrorback.threadCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {!compact && expanded && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
              {onRespond && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRespond(mirrorback.id)}
                >
                  Respond
                </Button>
              )}
              {onToggleVisibility && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(mirrorback.id)}
                  className="flex items-center gap-1"
                >
                  <EyeOff size={14} />
                  Hide
                </Button>
              )}
              {onArchive && !mirrorback.isArchived && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchive(mirrorback.id)}
                  className="flex items-center gap-1"
                >
                  <Archive size={14} />
                  Archive
                </Button>
              )}
            </div>
          )}

          {/* Constitutional notice */}
          {!compact && expanded && (
            <Card variant="emphasis">
              <p className="text-xs text-[var(--color-text-muted)]">
                Mirrorbacks are reflections, not instructions. They appear based on patterns 
                in your writing, not optimization goals.
              </p>
            </Card>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Utility Functions

function getConfidenceLevel(confidence: number): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'secondary';
} {
  if (confidence >= 0.8) {
    return { label: 'High confidence', variant: 'success' };
  }
  if (confidence >= 0.6) {
    return { label: 'Medium confidence', variant: 'secondary' };
  }
  return { label: 'Low confidence', variant: 'warning' };
}

function formatDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export type { Mirrorback };
