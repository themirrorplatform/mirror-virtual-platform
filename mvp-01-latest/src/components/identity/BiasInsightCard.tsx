/**
 * Bias Insight Card - Bias dimension visualization
 * 
 * Features:
 * - Dimension + direction display (e.g., "confirmation bias toward")
 * - Confidence meter (0-1)
 * - Associated reflection link
 * - Notes section
 * - "This is data, not judgment" reminder
 * - Timeline of bias evolution
 */

import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown,
  Info,
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Badge } from '../finder/Badge';

interface BiasInsight {
  id: string;
  dimension: string; // e.g., "confirmation", "availability", "anchoring"
  direction: 'toward' | 'away_from' | 'neutral';
  subject: string; // what the bias is about
  confidence: number; // 0.0 - 1.0
  detectedAt: Date;
  reflectionId?: string;
  reflectionPreview?: string;
  notes?: string;
  evolutionHistory?: Array<{
    timestamp: Date;
    confidence: number;
  }>;
}

interface BiasInsightCardProps {
  insight: BiasInsight;
  onViewReflection?: (reflectionId: string) => void;
  onViewHistory?: (insightId: string) => void;
  showEvolution?: boolean;
  compact?: boolean;
}

const BIAS_DIMENSIONS = {
  confirmation: {
    label: 'Confirmation Bias',
    description: 'Favoring information that confirms existing beliefs',
    color: '#3B82F6',
    icon: '🔍',
  },
  availability: {
    label: 'Availability Bias',
    description: 'Overweighting recent or memorable information',
    color: '#F59E0B',
    icon: '💡',
  },
  anchoring: {
    label: 'Anchoring Bias',
    description: 'Over-relying on first information encountered',
    color: '#8B5CF6',
    icon: '⚓',
  },
  negativity: {
    label: 'Negativity Bias',
    description: 'Giving more weight to negative experiences',
    color: '#EF4444',
    icon: '⚠️',
  },
  optimism: {
    label: 'Optimism Bias',
    description: 'Overestimating positive outcomes',
    color: '#10B981',
    icon: '🌟',
  },
  dunning_kruger: {
    label: 'Dunning-Kruger',
    description: 'Overconfidence or underconfidence in knowledge',
    color: '#EC4899',
    icon: '🎭',
  },
  status_quo: {
    label: 'Status Quo Bias',
    description: 'Preference for current state over change',
    color: '#64748B',
    icon: '⏸️',
  },
};

export function BiasInsightCard({
  insight,
  onViewReflection,
  onViewHistory,
  showEvolution = false,
  compact = false,
}: BiasInsightCardProps) {
  const biasConfig = BIAS_DIMENSIONS[insight.dimension as keyof typeof BIAS_DIMENSIONS] || {
    label: insight.dimension,
    description: 'Custom bias dimension',
    color: '#64748B',
    icon: '📊',
  };

  const directionConfig = {
    toward: { label: 'toward', icon: <TrendingUp size={16} />, color: '#3B82F6' },
    away_from: { label: 'away from', icon: <TrendingDown size={16} />, color: '#EF4444' },
    neutral: { label: 'neutral on', icon: '—', color: '#64748B' },
  }[insight.direction];

  const confidenceLevel = getConfidenceLevel(insight.confidence);

  return (
    <Card 
      className="border-l-4"
      style={{ borderLeftColor: biasConfig.color }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl" role="img" aria-label={biasConfig.label}>
              {biasConfig.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{biasConfig.label}</h4>
                <Badge 
                  variant={confidenceLevel.variant}
                  size="sm"
                >
                  {Math.round(insight.confidence * 100)}%
                </Badge>
              </div>
              {!compact && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  {biasConfig.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Leaning
                </span>
                <div style={{ color: directionConfig.color }}>
                  {typeof directionConfig.icon === 'string' ? (
                    <span>{directionConfig.icon}</span>
                  ) : (
                    directionConfig.icon
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: directionConfig.color }}>
                  {directionConfig.label}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  "{insight.subject}"
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        {!compact && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                Confidence
              </span>
              <span className="text-xs font-medium" style={{ color: confidenceLevel.color }}>
                {confidenceLevel.label}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${insight.confidence * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: confidenceLevel.color }}
              />
            </div>
          </div>
        )}

        {/* Associated Reflection */}
        {insight.reflectionId && insight.reflectionPreview && (
          <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">
              Detected in reflection:
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] italic mb-2">
              "{insight.reflectionPreview.substring(0, 100)}
              {insight.reflectionPreview.length > 100 ? '...' : ''}"
            </p>
            {onViewReflection && (
              <button
                onClick={() => onViewReflection(insight.reflectionId!)}
                className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
              >
                View full reflection
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        {insight.notes && !compact && (
          <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Notes:</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {insight.notes}
            </p>
          </div>
        )}

        {/* Evolution History */}
        {showEvolution && insight.evolutionHistory && insight.evolutionHistory.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                Confidence over time
              </span>
              {onViewHistory && (
                <button
                  onClick={() => onViewHistory(insight.id)}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline"
                >
                  View history
                </button>
              )}
            </div>
            <div className="flex items-end gap-1 h-16">
              {insight.evolutionHistory.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${point.confidence * 100}%` }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-1 rounded-t"
                  style={{ 
                    backgroundColor: biasConfig.color,
                    opacity: 0.3 + (point.confidence * 0.7)
                  }}
                  title={`${Math.round(point.confidence * 100)}% on ${point.timestamp.toLocaleDateString()}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Detected {formatDate(insight.detectedAt)}</span>
          </div>
        </div>

        {/* Reminder */}
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <Info size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
            <p className="text-xs text-[var(--color-text-secondary)]">
              <strong>This is data, not judgment.</strong> The system detects patterns in your 
              thinking. Biases are human and inevitable. Awareness is the first step to working with them.
            </p>
          </div>
        </Card>
      </div>
    </Card>
  );
}

// Utility Functions

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  variant: 'success' | 'warning' | 'error' | 'secondary';
} {
  if (confidence >= 0.8) {
    return {
      label: 'Very High',
      color: '#EF4444',
      variant: 'error',
    };
  }
  if (confidence >= 0.6) {
    return {
      label: 'High',
      color: '#F59E0B',
      variant: 'warning',
    };
  }
  if (confidence >= 0.4) {
    return {
      label: 'Moderate',
      color: '#3B82F6',
      variant: 'secondary',
    };
  }
  return {
    label: 'Low',
    color: '#10B981',
    variant: 'success',
  };
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export type { BiasInsight };
