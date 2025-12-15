/**
 * Lens Usage Tracker - Session-based lens recording
 * 
 * Features:
 * - Visual feedback when lens is used
 * - Session-based tracking
 * - Usage history transparency
 * - Privacy-first design (local only)
 */

import { motion, AnimatePresence } from 'motion/react';
import { Eye, Clock, TrendingUp, Info } from 'lucide-react';
import { Card } from '../Card';
import { Badge } from './Badge';

interface LensUsageEvent {
  lensId: string;
  lensName: string;
  timestamp: Date;
  context: 'reflection' | 'door_selection' | 'tpv_computation' | 'manual';
  color: string;
}

interface LensUsageSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  events: LensUsageEvent[];
}

interface LensUsageTrackerProps {
  currentSession: LensUsageSession | null;
  recentEvents: LensUsageEvent[];
  onViewHistory?: () => void;
  compact?: boolean;
}

export function LensUsageTracker({
  currentSession,
  recentEvents,
  onViewHistory,
  compact = false,
}: LensUsageTrackerProps) {
  const sessionActive = currentSession && !currentSession.endTime;
  const sessionDuration = currentSession 
    ? calculateDuration(currentSession.startTime, currentSession.endTime || new Date())
    : 0;

  // Get unique lenses from recent events
  const uniqueLenses = Array.from(
    new Set(recentEvents.map(e => e.lensId))
  ).map(lensId => {
    const event = recentEvents.find(e => e.lensId === lensId)!;
    const count = recentEvents.filter(e => e.lensId === lensId).length;
    return { lensId, lensName: event.lensName, color: event.color, count };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {/* Session Status */}
      {sessionActive && currentSession && (
        <Card className="border-2 border-[var(--color-accent-blue)]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Eye size={20} className="text-[var(--color-accent-blue)]" />
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-accent-blue)] rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">Lens Session Active</h4>
                  <Badge variant="success" size="sm">
                    {formatDuration(sessionDuration)}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {currentSession.events.length} lens application{currentSession.events.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Lens Usage */}
      {!compact && uniqueLenses.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-text-muted)]" />
                <h4 className="text-sm font-medium">Recent Lens Usage</h4>
              </div>
              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline"
                >
                  View History
                </button>
              )}
            </div>

            <div className="space-y-2">
              {uniqueLenses.slice(0, 5).map((lens) => (
                <LensUsageBar key={lens.lensId} lens={lens} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Compact View */}
      {compact && uniqueLenses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uniqueLenses.slice(0, 3).map((lens) => (
            <Badge 
              key={lens.lensId} 
              variant="secondary" 
              size="sm"
            >
              {lens.lensName} ({lens.count})
            </Badge>
          ))}
        </div>
      )}

      {/* Live Events Feed */}
      {!compact && recentEvents.length > 0 && (
        <Card variant="emphasis">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Live Activity
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentEvents.slice(0, 10).map((event, index) => (
                  <LensEventItem key={index} event={event} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      )}

      {/* Privacy Notice */}
      {!compact && (
        <Card className="border-2 border-[var(--color-accent-blue)]">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="text-xs text-[var(--color-text-secondary)]">
              <p className="mb-1">
                <strong>Lens usage is tracked locally for transparency.</strong>
              </p>
              <p className="text-[var(--color-text-muted)]">
                This data never leaves your device and is used only to compute your TPV. 
                You can clear usage history at any time.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface LensUsageBarProps {
  lens: {
    lensId: string;
    lensName: string;
    color: string;
    count: number;
  };
}

function LensUsageBar({ lens }: LensUsageBarProps) {
  const maxCount = 20; // Arbitrary max for visualization
  const widthPercent = Math.min((lens.count / maxCount) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {lens.lensName}
        </span>
        <Badge variant="secondary" size="sm">
          {lens.count}
        </Badge>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: lens.color }}
        />
      </div>
    </div>
  );
}

interface LensEventItemProps {
  event: LensUsageEvent;
}

function LensEventItem({ event }: LensEventItemProps) {
  const timeAgo = formatTimeAgo(event.timestamp);
  const contextLabel = getContextLabel(event.context);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color }}
      />
      <span className="text-xs text-[var(--color-text-secondary)] flex-1">
        <strong>{event.lensName}</strong> used in {contextLabel}
      </span>
      <span className="text-xs text-[var(--color-text-muted)]">
        {timeAgo}
      </span>
    </motion.div>
  );
}

// Utility Functions

function calculateDuration(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function getContextLabel(context: LensUsageEvent['context']): string {
  const labels = {
    reflection: 'reflection',
    door_selection: 'door selection',
    tpv_computation: 'TPV computation',
    manual: 'manual activation',
  };
  return labels[context];
}

export type { LensUsageEvent, LensUsageSession };
