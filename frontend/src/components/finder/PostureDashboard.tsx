/**
 * Posture Dashboard - Posture history & insights
 * 
 * Features:
 * - Current posture large display
 * - Posture history timeline
 * - Suggested posture with reasoning
 * - "Why this suggestion?" explainer
 * - Pattern insights
 */

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Info,
  AlertCircle,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PostureType } from './PostureSelector';

interface PostureEntry {
  posture: PostureType;
  timestamp: Date;
  declaredBy: 'user' | 'system_suggestion' | 'default';
}

interface PosturePattern {
  type: 'morning_overwhelm' | 'evening_grounded' | 'monday_guarded' | 'weekend_open' | 'custom';
  description: string;
  frequency: number; // 0.0 - 1.0
}

interface PostureDashboardData {
  current: PostureType;
  suggested: PostureType | null;
  suggestionReason: string;
  history: PostureEntry[];
  patterns: PosturePattern[];
  averageDuration: number; // minutes
}

interface PostureDashboardProps {
  data: PostureDashboardData;
  onViewHistory?: () => void;
  compact?: boolean;
}

const POSTURE_CONFIG = {
  unknown: { 
    label: 'Unknown', 
    color: '#94A3B8',
    icon: '❓',
    description: 'Not sure how I am right now'
  },
  overwhelmed: { 
    label: 'Overwhelmed', 
    color: '#EF4444',
    icon: '⚠️',
    description: 'Cannot process more right now'
  },
  guarded: { 
    label: 'Guarded', 
    color: '#F59E0B',
    icon: '🛡️',
    description: 'Protective, cautious, need safety'
  },
  grounded: { 
    label: 'Grounded', 
    color: '#10B981',
    icon: '⚓',
    description: 'Stable, centered, can receive'
  },
  open: { 
    label: 'Open', 
    color: '#3B82F6',
    icon: '😊',
    description: 'Curious, receptive, exploring'
  },
  exploratory: { 
    label: 'Exploratory', 
    color: '#8B5CF6',
    icon: '🔭',
    description: 'Seeking edges, ready for challenge'
  },
};

export function PostureDashboard({
  data,
  onViewHistory,
  compact = false,
}: PostureDashboardProps) {
  const currentConfig = POSTURE_CONFIG[data.current];
  const suggestedConfig = data.suggested ? POSTURE_CONFIG[data.suggested] : null;
  const hasSuggestion = data.suggested && data.suggested !== data.current;

  // Get last 7 entries for timeline
  const recentHistory = data.history.slice(-7).reverse();

  return (
    <div className="space-y-4">
      {/* Current Posture */}
      <Card 
        className="border-2"
        style={{
          borderColor: currentConfig.color,
          backgroundColor: `${currentConfig.color}10`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="text-5xl"
              role="img"
              aria-label={currentConfig.label}
            >
              {currentConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 style={{ color: currentConfig.color }}>
                  {currentConfig.label}
                </h3>
                <Badge variant="primary" size="sm">Current</Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {currentConfig.description}
              </p>
            </div>
          </div>

          {!compact && onViewHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewHistory}
              className="flex items-center gap-1"
            >
              <Calendar size={14} />
              <span className="text-xs">History</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Suggested Posture */}
      {hasSuggestion && suggestedConfig && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-[var(--color-accent-blue)]">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="flex-1">
                  <h4 className="mb-1">Suggested Posture</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{suggestedConfig.icon}</span>
                    <span 
                      className="font-medium"
                      style={{ color: suggestedConfig.color }}
                    >
                      {suggestedConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {data.suggestionReason}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[var(--color-surface-hover)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  💡 <strong>This is a suggestion, not a directive.</strong> Your declared 
                  posture is always respected. The system notices patterns but you decide.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Posture Timeline */}
      {!compact && recentHistory.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Recent History</h4>
            </div>

            <div className="space-y-2">
              {recentHistory.map((entry, index) => (
                <PostureTimelineEntry 
                  key={index} 
                  entry={entry}
                  isLatest={index === 0}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Patterns */}
      {!compact && data.patterns.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-medium">Patterns Noticed</h4>
            </div>

            <div className="space-y-2">
              {data.patterns.map((pattern, index) => (
                <PatternCard key={index} pattern={pattern} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {!compact && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                Average Duration
              </p>
              <p className="text-lg font-medium">
                {formatDuration(data.averageDuration)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                Total Entries
              </p>
              <p className="text-lg font-medium">
                {data.history.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                Most Common
              </p>
              <p className="text-lg font-medium">
                {getMostCommonPosture(data.history)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Explainer */}
      {!compact && (
        <Card className="border-2 border-[var(--color-accent-blue)]">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="text-xs text-[var(--color-text-secondary)]">
              <p className="mb-2">
                <strong>Posture tracking is local and private.</strong> No data leaves your device. 
                The Finder uses this to suggest—never to manipulate.
              </p>
              <p>
                Patterns are observations, not judgments. You can ignore suggestions entirely.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface PostureTimelineEntryProps {
  entry: PostureEntry;
  isLatest: boolean;
}

function PostureTimelineEntry({ entry, isLatest }: PostureTimelineEntryProps) {
  const config = POSTURE_CONFIG[entry.posture];
  const timeAgo = formatTimeAgo(entry.timestamp);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
      <span className="text-xl">{config.icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {isLatest && (
            <Badge variant="success" size="sm">Now</Badge>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {timeAgo}
          {entry.declaredBy === 'system_suggestion' && ' • suggested'}
        </p>
      </div>
    </div>
  );
}

interface PatternCardProps {
  pattern: PosturePattern;
}

function PatternCard({ pattern }: PatternCardProps) {
  const frequencyPercent = Math.round(pattern.frequency * 100);

  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {pattern.description}
        </p>
        <Badge variant="secondary" size="sm">
          {frequencyPercent}%
        </Badge>
      </div>
      <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${frequencyPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-[var(--color-accent-blue)] rounded-full"
        />
      </div>
    </div>
  );
}

// Utility Functions

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getMostCommonPosture(history: PostureEntry[]): string {
  if (history.length === 0) return 'Unknown';
  
  const counts: Record<PostureType, number> = {
    unknown: 0,
    overwhelmed: 0,
    guarded: 0,
    grounded: 0,
    open: 0,
    exploratory: 0,
  };

  history.forEach(entry => {
    counts[entry.posture]++;
  });

  const mostCommon = Object.entries(counts).reduce((a, b) => 
    b[1] > a[1] ? b : a
  );

  return POSTURE_CONFIG[mostCommon[0] as PostureType].label;
}

export type { PostureDashboardData, PostureEntry, PosturePattern };


