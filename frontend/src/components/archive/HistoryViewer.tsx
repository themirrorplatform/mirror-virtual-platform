/**
 * History Viewer - Browse reflection history with context
 * 
 * Features:
 * - Timeline view (day/week/month/year)
 * - Calendar interface
 * - Heatmap visualization
 * - Filter by type, lens, thread
 * - Entry preview
 * - "Then/Now" comparison
 * - Export date range
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Filter,
  Download,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HistoryEntry {
  id: string;
  date: Date;
  type: 'reflection' | 'mirrorback' | 'thread' | 'response';
  content: string;
  lensTags?: string[];
  threadTitle?: string;
  emotionalValence?: number;
}

interface HistoryViewerProps {
  entries: HistoryEntry[];
  onSelectEntry: (entryId: string) => void;
  onExportRange?: (startDate: Date, endDate: Date) => void;
}

type ViewMode = 'timeline' | 'calendar' | 'heatmap';
type TimeScale = 'day' | 'week' | 'month' | 'year';

export function HistoryViewer({
  entries,
  onSelectEntry,
  onExportRange,
}: HistoryViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEntries = entries.filter(entry => {
    if (filterType !== 'all' && entry.type !== filterType) return false;
    
    // Filter by time scale and selected date
    const entryDate = new Date(entry.date);
    const selected = new Date(selectedDate);
    
    switch (timeScale) {
      case 'day':
        return entryDate.toDateString() === selected.toDateString();
      case 'week':
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - selected.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        return entryDate >= weekStart && entryDate < weekEnd;
      case 'month':
        return entryDate.getMonth() === selected.getMonth() &&
               entryDate.getFullYear() === selected.getFullYear();
      case 'year':
        return entryDate.getFullYear() === selected.getFullYear();
      default:
        return true;
    }
  });

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (timeScale) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    switch (timeScale) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">History</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'} in {formatDateRange(selectedDate, timeScale)}
                </p>
              </div>
            </div>

            {onExportRange && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const { start, end } = getDateRange(selectedDate, timeScale);
                  onExportRange(start, end);
                }}
                className="flex items-center gap-2"
              >
                <Download size={14} />
                Export
              </Button>
            )}
          </div>

          {/* Time Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handlePrevious}>
              <ChevronLeft size={16} />
            </Button>

            <div className="flex items-center gap-2">
              {(['day', 'week', 'month', 'year'] as TimeScale[]).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTimeScale(scale)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    timeScale === scale
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {scale.charAt(0).toUpperCase() + scale.slice(1)}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={handleNext}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center justify-between">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded ${
                  viewMode === 'timeline'
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded ${
                  viewMode === 'calendar'
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                }`}
              >
                <Calendar size={16} />
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`p-2 rounded ${
                  viewMode === 'heatmap'
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                }`}
              >
                <Grid size={16} />
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--color-text-muted)]" />
              <select
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
                className="text-sm px-3 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
              >
                <option value="all">All Types</option>
                <option value="reflection">Reflections</option>
                <option value="mirrorback">Mirrorbacks</option>
                <option value="thread">Threads</option>
                <option value="response">Responses</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'timeline' && (
          <TimelineView entries={filteredEntries} onSelectEntry={onSelectEntry} />
        )}
        {viewMode === 'calendar' && (
          <CalendarView
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectEntry={onSelectEntry}
          />
        )}
        {viewMode === 'heatmap' && (
          <HeatmapView entries={entries} selectedDate={selectedDate} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Timeline View

interface TimelineViewProps {
  entries: HistoryEntry[];
  onSelectEntry: (entryId: string) => void;
}

function TimelineView({ entries, onSelectEntry }: TimelineViewProps) {
  const groupedByDate = entries.reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  const dates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (dates.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nothing appears here yet
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {dates.map((dateStr) => {
        const date = new Date(dateStr);
        const dayEntries = groupedByDate[dateStr];

        return (
          <div key={dateStr} className="relative pl-8">
            {/* Date marker */}
            <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-[var(--color-accent-blue)] border-4 border-[var(--color-surface-primary)]" />
            
            <Card>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{formatDateHeader(date)}</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {dayEntries.length} entr{dayEntries.length !== 1 ? 'ies' : 'y'}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => onSelectEntry(entry.id)}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </motion.div>
  );
}

// Calendar View

interface CalendarViewProps {
  entries: HistoryEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectEntry: (entryId: string) => void;
}

function CalendarView({ entries, selectedDate, onSelectDate, onSelectEntry }: CalendarViewProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= lastDay || current.getDay() !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const entriesForDate = (date: Date) =>
    entries.filter(e => new Date(e.date).toDateString() === date.toDateString());

  return (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-[var(--color-text-muted)] py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            const dayEntries = entriesForDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={index}
                onClick={() => onSelectDate(day)}
                className={`aspect-square p-2 rounded-lg text-sm transition-all ${
                  !isCurrentMonth
                    ? 'text-[var(--color-text-muted)] opacity-50'
                    : isSelected
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : isToday
                    ? 'border-2 border-[var(--color-accent-blue)]'
                    : 'hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{day.getDate()}</span>
                  {dayEntries.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {dayEntries.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[var(--color-accent-blue)]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected date entries */}
        {entriesForDate(selectedDate).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
            <h5 className="text-sm font-medium mb-2">
              {formatDateHeader(selectedDate)}
            </h5>
            {entriesForDate(selectedDate).map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onClick={() => onSelectEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// Heatmap View

function HeatmapView({ entries, selectedDate }: { entries: HistoryEntry[]; selectedDate: Date }) {
  const year = selectedDate.getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const entryCounts: Record<string, number> = {};
  entries.forEach(entry => {
    const dateKey = new Date(entry.date).toDateString();
    entryCounts[dateKey] = (entryCounts[dateKey] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(entryCounts), 1);
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <motion.div
      key="heatmap"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Activity Heatmap - {year}</h4>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                <div
                  key={intensity}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: intensity === 0
                      ? 'var(--color-border-subtle)'
                      : `rgba(59, 130, 246, ${intensity})`,
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const count = entryCounts[day.toDateString()] || 0;
                    const intensity = count / maxCount;
                    
                    return (
                      <div
                        key={day.toDateString()}
                        className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-[var(--color-accent-blue)]"
                        style={{
                          backgroundColor:
                            count === 0
                              ? 'var(--color-border-subtle)'
                              : `rgba(59, 130, 246, ${intensity})`,
                        }}
                        title={`${day.toDateString()}: ${count} entr${count !== 1 ? 'ies' : 'y'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Entry Card

function EntryCard({ entry, onClick }: { entry: HistoryEntry; onClick: () => void }) {
  const typeConfig = {
    reflection: { icon: Sparkles, color: '#3B82F6' },
    mirrorback: { icon: Sparkles, color: '#8B5CF6' },
    thread: { icon: TrendingUp, color: '#10B981' },
    response: { icon: Clock, color: '#F59E0B' },
  }[entry.type];

  const Icon = typeConfig.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-blue)]/10 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div style={{ color: typeConfig.color }}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              {entry.type}
            </Badge>
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatTime(entry.date)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {entry.content}
          </p>
          {entry.threadTitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Thread: {entry.threadTitle}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// Utility Functions

function formatDateRange(date: Date, scale: TimeScale): string {
  switch (scale) {
    case 'day':
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'year':
      return date.getFullYear().toString();
  }
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const days = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });

  return date.toLocaleDateString('en-US', { 
    month: 'long', 
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

function getDateRange(date: Date, scale: TimeScale): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (scale) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(date.getDate() - date.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export type { HistoryEntry };




