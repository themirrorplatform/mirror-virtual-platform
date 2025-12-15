/**
 * Thread Timeline - Visual chronological view of thread evolution
 * 
 * Features:
 * - Time-based node layout
 * - Entry preview cards
 * - Tension/emotion markers
 * - Pattern annotations
 * - Zoom/pan controls
 * - Time range selector
 * - Entry clustering
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface ThreadEntry {
  id: string;
  content: string;
  timestamp: Date;
  emotionalValence?: number; // -1 to 1
  tensionLevel?: number; // 0 to 1
  hasPattern?: boolean;
  tags?: string[];
}

interface ThreadTimelineProps {
  entries: ThreadEntry[];
  threadTitle: string;
  onSelectEntry: (entryId: string) => void;
  onAddEntry?: () => void;
  compact?: boolean;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const TIME_RANGES = [
  { id: '7d' as TimeRange, label: 'Week' },
  { id: '30d' as TimeRange, label: 'Month' },
  { id: '90d' as TimeRange, label: '3 Months' },
  { id: 'all' as TimeRange, label: 'All Time' },
];

export function ThreadTimeline({
  entries,
  threadTitle,
  onSelectEntry,
  onAddEntry,
  compact = false,
}: ThreadTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredEntries = filterByTimeRange(entries, timeRange);
  const groupedEntries = groupByDate(filteredEntries);
  const dates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel + 0.25, 2));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel - 0.25, 0.5));

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">{threadTitle}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredEntries.length} entries across{' '}
                  {dates.length} day{dates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-xs text-[var(--color-text-muted)] min-w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn size={16} />
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  timeRange === range.id
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline axis */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[var(--color-border-subtle)]" />

        {/* Entries grouped by date */}
        <div 
          className="space-y-6"
          style={{ 
            fontSize: `${zoomLevel * 100}%`,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
          }}
        >
          {dates.map((dateStr) => {
            const date = new Date(dateStr);
            const dayEntries = groupedEntries[dateStr];

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {/* Date marker */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-accent-blue)] border-4 border-[var(--color-surface-primary)]" />
                  <div>
                    <h4 className="text-sm font-medium">
                      {formatDateHeader(date)}
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {dayEntries.length} entr{dayEntries.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                </div>

                {/* Entries for this date */}
                <div className="ml-12 space-y-3">
                  {dayEntries.map((entry) => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      onClick={() => onSelectEntry(entry.id)}
                      compact={compact}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {dates.length === 0 && (
          <Card variant="emphasis">
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                No entries in this time range
              </p>
              {onAddEntry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAddEntry}
                  className="mt-4"
                >
                  Add First Entry
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Legend */}
      {!compact && entries.length > 0 && (
        <Card variant="emphasis">
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-[var(--color-text-muted)]">
              Timeline Legend
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <LegendItem
                icon={<TrendingUp size={14} className="text-[var(--color-accent-green)]" />}
                label="High tension"
              />
              <LegendItem
                icon={<TrendingUp size={14} className="text-[var(--color-border-error)]" />}
                label="Negative emotion"
              />
              <LegendItem
                icon={<AlertCircle size={14} className="text-[var(--color-border-warning)]" />}
                label="Pattern detected"
              />
              <LegendItem
                icon={<Lightbulb size={14} className="text-[var(--color-accent-blue)]" />}
                label="Insight"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface TimelineEntryProps {
  entry: ThreadEntry;
  onClick: () => void;
  compact?: boolean;
}

function TimelineEntry({ entry, onClick, compact }: TimelineEntryProps) {
  const emotionColor = getEmotionColor(entry.emotionalValence);
  const tensionColor = getTensionColor(entry.tensionLevel);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={onClick}
      >
        <div className="space-y-3">
          {/* Header with time */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatTime(entry.timestamp)}
            </span>
            <div className="flex items-center gap-2">
              {entry.hasPattern && (
                <AlertCircle size={14} className="text-[var(--color-border-warning)]" />
              )}
              {entry.emotionalValence !== undefined && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: emotionColor }}
                  title={`Emotion: ${entry.emotionalValence > 0 ? 'Positive' : 'Negative'}`}
                />
              )}
              {entry.tensionLevel !== undefined && entry.tensionLevel > 0.5 && (
                <TrendingUp
                  size={14}
                  style={{ color: tensionColor }}
                  title={`Tension: ${Math.round(entry.tensionLevel * 100)}%`}
                />
              )}
            </div>
          </div>

          {/* Content preview */}
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {entry.content}
          </p>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <Badge variant="secondary" size="sm">
                  +{entry.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface LegendItemProps {
  icon: React.ReactNode;
  label: string;
}

function LegendItem({ icon, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

// Utility Functions

function filterByTimeRange(entries: ThreadEntry[], range: TimeRange): ThreadEntry[] {
  const now = Date.now();
  const cutoffs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const cutoff = cutoffs[range];
  return entries.filter((entry) => now - entry.timestamp.getTime() < cutoff);
}

function groupByDate(entries: ThreadEntry[]): Record<string, ThreadEntry[]> {
  const groups: Record<string, ThreadEntry[]> = {};

  entries.forEach((entry) => {
    const dateKey = entry.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
  });

  // Sort entries within each group
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  return groups;
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const days = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function getEmotionColor(valence?: number): string {
  if (valence === undefined) return '#64748B';
  if (valence > 0.3) return '#10B981';
  if (valence < -0.3) return '#EF4444';
  return '#F59E0B';
}

function getTensionColor(level?: number): string {
  if (level === undefined) return '#64748B';
  if (level > 0.7) return '#EF4444';
  if (level > 0.4) return '#F59E0B';
  return '#10B981';
}

export type { ThreadEntry };
