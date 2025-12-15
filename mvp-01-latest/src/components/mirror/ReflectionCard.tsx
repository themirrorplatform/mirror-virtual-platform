/**
 * Reflection Card - Compact display of a reflection entry
 * 
 * Features:
 * - Reflection content preview
 * - Timestamp
 * - Lens tags
 * - Mirrorback count
 * - Thread association
 * - Emotional markers
 * - Quick actions (view, archive, publish)
 */

import { motion } from 'motion/react';
import { 
  MessageCircle,
  Calendar,
  Archive,
  Share2,
  MoreVertical,
  Sparkles,
  TrendingUp,
  Heart
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface Reflection {
  id: string;
  content: string;
  createdAt: Date;
  lensTags?: string[];
  threadTitle?: string;
  mirrorbackCount?: number;
  emotionalValence?: number; // -1 to 1
  tensionLevel?: number; // 0 to 1
  isArchived?: boolean;
  isPublished?: boolean;
}

interface ReflectionCardProps {
  reflection: Reflection;
  onView: (reflectionId: string) => void;
  onArchive?: (reflectionId: string) => void;
  onPublish?: (reflectionId: string) => void;
  onViewThread?: (reflectionId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ReflectionCard({
  reflection,
  onView,
  onArchive,
  onPublish,
  onViewThread,
  showActions = true,
  compact = false,
}: ReflectionCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  const emotionIcon = getEmotionIcon(reflection.emotionalValence);
  const tensionLevel = reflection.tensionLevel ?? 0;

  return (
    <motion.div
      whileHover={{ scale: compact ? 1 : 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer transition-shadow hover:shadow-md relative"
        onClick={() => onView(reflection.id)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDate(reflection.createdAt)}
              </span>
              {reflection.isArchived && (
                <Badge variant="secondary" size="sm">
                  Archived
                </Badge>
              )}
              {reflection.isPublished && (
                <Badge variant="primary" size="sm">
                  Published
                </Badge>
              )}
            </div>

            {showActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <MoreVertical size={16} />
              </button>
            )}
          </div>

          {/* Content */}
          <div>
            <p className={`text-sm text-[var(--color-text-secondary)] ${compact ? 'line-clamp-2' : 'line-clamp-4'}`}>
              {reflection.content}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs">
            {/* Mirrorback count */}
            {reflection.mirrorbackCount !== undefined && reflection.mirrorbackCount > 0 && (
              <div className="flex items-center gap-1 text-[var(--color-accent-blue)]">
                <Sparkles size={12} />
                <span>{reflection.mirrorbackCount} mirrorback{reflection.mirrorbackCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Thread association */}
            {reflection.threadTitle && onViewThread && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewThread(reflection.id);
                }}
                className="flex items-center gap-1 text-[var(--color-accent-blue)] hover:underline"
              >
                <MessageCircle size={12} />
                <span>{reflection.threadTitle}</span>
              </button>
            )}

            {/* Emotional markers */}
            {!compact && (
              <>
                {reflection.emotionalValence !== undefined && (
                  <div className="flex items-center gap-1" style={{ color: emotionIcon.color }}>
                    {emotionIcon.icon}
                    <span>{emotionIcon.label}</span>
                  </div>
                )}
                {tensionLevel > 0.5 && (
                  <div className="flex items-center gap-1 text-[var(--color-border-warning)]">
                    <TrendingUp size={12} />
                    <span>High tension</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lens Tags */}
          {reflection.lensTags && reflection.lensTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reflection.lensTags.slice(0, compact ? 2 : 4).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {reflection.lensTags.length > (compact ? 2 : 4) && (
                <Badge variant="secondary" size="sm">
                  +{reflection.lensTags.length - (compact ? 2 : 4)}
                </Badge>
              )}
            </div>
          )}

          {/* Actions Menu */}
          {showMenu && showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-12 right-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="shadow-lg min-w-40">
                <div className="space-y-1">
                  {onArchive && !reflection.isArchived && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(reflection.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-hover)] rounded flex items-center gap-2"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                  )}
                  {onPublish && !reflection.isPublished && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPublish(reflection.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-hover)] rounded flex items-center gap-2"
                    >
                      <Share2 size={14} />
                      Publish to Commons
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Utility Functions

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
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function getEmotionIcon(valence?: number): {
  icon: React.ReactNode;
  label: string;
  color: string;
} {
  if (valence === undefined) {
    return { 
      icon: <Heart size={12} />, 
      label: 'Neutral', 
      color: '#64748B' 
    };
  }

  if (valence > 0.3) {
    return { 
      icon: <Heart size={12} />, 
      label: 'Positive', 
      color: '#10B981' 
    };
  }
  
  if (valence < -0.3) {
    return { 
      icon: <Heart size={12} />, 
      label: 'Negative', 
      color: '#EF4444' 
    };
  }

  return { 
    icon: <Heart size={12} />, 
    label: 'Mixed', 
    color: '#F59E0B' 
  };
}

// Add React import for useState
import * as React from 'react';

export type { Reflection };
