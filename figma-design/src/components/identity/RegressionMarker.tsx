/**
 * Regression Marker - Pattern alert for recurring negative patterns
 * 
 * Features:
 * - Pattern name and description
 * - Frequency chart (occurrences over time)
 * - Severity indicator (1-5)
 * - Last occurrence timestamp
 * - Related reflections
 * - "What triggers this?" insights
 * - Acknowledge/dismiss options
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3,
  FileText,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface RegressionPattern {
  id: string;
  type: 'loop' | 'self_attack' | 'judgment_spike' | 'avoidance' | 'rumination' | 'catastrophizing';
  name: string;
  description: string;
  severity: number; // 1-5
  frequency: number; // total occurrences
  lastOccurrence: Date;
  firstDetected: Date;
  occurrences: Array<{
    timestamp: Date;
    context?: string;
    reflectionId?: string;
  }>;
  triggers?: string[];
  insights?: string;
  acknowledged?: boolean;
}

interface RegressionMarkerProps {
  pattern: RegressionPattern;
  onAcknowledge?: (patternId: string) => void;
  onDismiss?: (patternId: string) => void;
  onViewReflection?: (reflectionId: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

const PATTERN_TYPE_CONFIG = {
  loop: {
    label: 'Recurring Loop',
    description: 'A pattern that repeats cyclically',
    icon: '🔄',
    color: '#F59E0B',
  },
  self_attack: {
    label: 'Self-Attack',
    description: 'Negative self-judgment',
    icon: '⚔️',
    color: '#EF4444',
  },
  judgment_spike: {
    label: 'Judgment Spike',
    description: 'Harsh evaluation of self or others',
    icon: '⚖️',
    color: '#DC2626',
  },
  avoidance: {
    label: 'Avoidance',
    description: 'Pattern of avoiding certain topics',
    icon: '🚪',
    color: '#F59E0B',
  },
  rumination: {
    label: 'Rumination',
    description: 'Repetitive dwelling on problems',
    icon: '🌀',
    color: '#8B5CF6',
  },
  catastrophizing: {
    label: 'Catastrophizing',
    description: 'Imagining worst-case scenarios',
    icon: '⚠️',
    color: '#EF4444',
  },
};

export function RegressionMarker({
  pattern,
  onAcknowledge,
  onDismiss,
  onViewReflection,
  showDetails = false,
  compact = false,
}: RegressionMarkerProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const typeConfig = PATTERN_TYPE_CONFIG[pattern.type];
  const severityConfig = getSeverityConfig(pattern.severity);
  const frequencyLevel = getFrequencyLevel(pattern.frequency);

  // Get last 7 occurrences for chart
  const recentOccurrences = pattern.occurrences
    .slice(-7)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="border-l-4"
        style={{ borderLeftColor: severityConfig.color }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-3xl" role="img" aria-label={typeConfig.label}>
                {typeConfig.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{pattern.name}</h4>
                  <Badge variant={severityConfig.variant}>
                    Severity {pattern.severity}/5
                  </Badge>
                  {pattern.acknowledged && (
                    <Badge variant="success" size="sm">
                      <Check size={12} className="mr-1" />
                      Acknowledged
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  {typeConfig.label}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {pattern.description}
                </p>
              </div>
            </div>

            {!compact && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<BarChart3 size={16} />}
              label="Occurrences"
              value={pattern.frequency.toString()}
              sublabel={frequencyLevel.label}
              color={frequencyLevel.color}
            />
            <StatCard
              icon={<Clock size={16} />}
              label="Last Seen"
              value={formatTimeAgo(pattern.lastOccurrence)}
              sublabel={formatDate(pattern.lastOccurrence)}
              color="#64748B"
            />
            <StatCard
              icon={<TrendingDown size={16} />}
              label="Severity"
              value={`${pattern.severity}/5`}
              sublabel={severityConfig.label}
              color={severityConfig.color}
            />
          </div>

          {/* Frequency Chart */}
          {!compact && recentOccurrences.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
                Recent Activity
              </h5>
              <div className="flex items-end gap-1 h-16 bg-[var(--color-surface-hover)] rounded-lg p-2">
                {recentOccurrences.map((occurrence, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex-1 rounded-t"
                    style={{
                      backgroundColor: severityConfig.color,
                      opacity: 0.3 + (index / recentOccurrences.length) * 0.7,
                    }}
                    title={formatDate(occurrence.timestamp)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4"
            >
              {/* Triggers */}
              {pattern.triggers && pattern.triggers.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Common Triggers</h5>
                  <div className="flex flex-wrap gap-2">
                    {pattern.triggers.map((trigger) => (
                      <Badge key={trigger} variant="warning" size="sm">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {pattern.insights && (
                <Card className="border-2 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium mb-1">Pattern Insights</h5>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {pattern.insights}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Recent Occurrences */}
              <div>
                <h5 className="text-sm font-medium mb-2">Recent Occurrences</h5>
                <div className="space-y-2">
                  {pattern.occurrences.slice(-3).reverse().map((occurrence, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-[var(--color-surface-hover)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatTimestamp(occurrence.timestamp)}
                        </span>
                        {occurrence.reflectionId && onViewReflection && (
                          <button
                            onClick={() => onViewReflection(occurrence.reflectionId!)}
                            className="flex items-center gap-1 text-xs text-[var(--color-accent-blue)] hover:underline"
                          >
                            <FileText size={12} />
                            View reflection
                          </button>
                        )}
                      </div>
                      {occurrence.context && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {occurrence.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <div className="text-xs text-[var(--color-text-muted)]">
                  <p>
                    First detected <strong>{formatDate(pattern.firstDetected)}</strong>
                  </p>
                  <p className="mt-1">
                    Active for <strong>{getDaysSince(pattern.firstDetected)} days</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
            {onAcknowledge && !pattern.acknowledged && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAcknowledge(pattern.id)}
                className="flex items-center gap-2"
              >
                <Check size={14} />
                Acknowledge Pattern
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(pattern.id)}
                className="flex items-center gap-2"
              >
                <X size={14} />
                Dismiss
              </Button>
            )}
          </div>

          {/* Info Notice */}
          <Card variant="emphasis">
            <div className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-[var(--color-border-warning)] mt-0.5" />
              <p className="text-xs text-[var(--color-text-secondary)]">
                <strong>Regression markers are observations, not judgments.</strong> The system 
                detects patterns that may indicate recursive loops or unhelpful thought spirals. 
                Awareness is the first step to change.
              </p>
            </div>
          </Card>
        </div>
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}

function StatCard({ icon, label, value, sublabel, color }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <div className="text-lg font-medium mb-1">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{sublabel}</div>
    </div>
  );
}

// Utility Functions

function getSeverityConfig(severity: number): {
  label: string;
  color: string;
  variant: 'success' | 'warning' | 'error';
} {
  if (severity <= 2) {
    return { label: 'Low', color: '#10B981', variant: 'success' };
  }
  if (severity <= 3) {
    return { label: 'Medium', color: '#F59E0B', variant: 'warning' };
  }
  return { label: 'High', color: '#EF4444', variant: 'error' };
}

function getFrequencyLevel(frequency: number): {
  label: string;
  color: string;
} {
  if (frequency <= 3) {
    return { label: 'Occasional', color: '#64748B' };
  }
  if (frequency <= 10) {
    return { label: 'Frequent', color: '#F59E0B' };
  }
  return { label: 'Very Frequent', color: '#EF4444' };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString();
}

function getDaysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export type { RegressionPattern };
