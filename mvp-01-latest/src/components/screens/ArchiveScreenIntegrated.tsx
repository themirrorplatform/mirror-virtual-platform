/**
 * Archive Screen (Backend Integrated)
 * 
 * Memory without shame - time-indexed browsing
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, Search, Filter, Download } from 'lucide-react';
import { useAppState, useReflections } from '../../hooks/useAppState';
import { Card } from '../Card';
import { Input } from '../Input';
import { Button } from '../Button';
import { EmptyStateView, LoadingState } from '../EmptyStates';
import { Reflection } from '../../services/database';

type TimeGroup = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'earlier';
type ViewMode = 'timeline' | 'calendar' | 'list';

export function ArchiveScreenIntegrated() {
  const { isLoading, deleteReflection, exportAllData } = useAppState();
  const allReflections = useReflections();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterLayer, setFilterLayer] = useState<'all' | 'sovereign' | 'commons' | 'builder'>('all');

  // Filter reflections
  const filteredReflections = useMemo(() => {
    return allReflections.filter(r => {
      // Search filter
      if (searchQuery && !r.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Layer filter
      if (filterLayer !== 'all' && r.layer !== filterLayer) {
        return false;
      }

      // Date filter
      if (selectedDate) {
        const rDate = new Date(r.createdAt);
        if (rDate.toDateString() !== selectedDate.toDateString()) {
          return false;
        }
      }

      return true;
    });
  }, [allReflections, searchQuery, filterLayer, selectedDate]);

  // Group by time
  const groupedReflections = useMemo(() => {
    const groups: Record<TimeGroup, Reflection[]> = {
      'today': [],
      'yesterday': [],
      'this-week': [],
      'this-month': [],
      'earlier': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    filteredReflections.forEach(r => {
      const date = new Date(r.createdAt);
      
      if (date >= today) {
        groups.today.push(r);
      } else if (date >= yesterday) {
        groups.yesterday.push(r);
      } else if (date >= weekAgo) {
        groups['this-week'].push(r);
      } else if (date >= monthAgo) {
        groups['this-month'].push(r);
      } else {
        groups.earlier.push(r);
      }
    });

    return groups;
  }, [filteredReflections]);

  const handleExport = async () => {
    try {
      const blob = await exportAllData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-archive-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading archive..." />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
        <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium">Archive</h1>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-[var(--color-surface-hover)] rounded-lg p-1">
                {(['timeline', 'calendar', 'list'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                      viewMode === mode
                        ? 'bg-[var(--color-surface-card)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search reflections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>

            <select
              value={filterLayer}
              onChange={(e) => setFilterLayer(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm"
            >
              <option value="all">All Layers</option>
              <option value="sovereign">Sovereign</option>
              <option value="commons">Commons</option>
              <option value="builder">Builder</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <span>{filteredReflections.length} reflections</span>
            {searchQuery && <span>Filtered by: "{searchQuery}"</span>}
            {selectedDate && (
              <span>
                Date: {selectedDate.toLocaleDateString()}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-2 text-[var(--color-accent-blue)] hover:underline"
                >
                  Clear
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredReflections.length === 0 ? (
          <EmptyStateView type="archive" searchQuery={searchQuery} />
        ) : viewMode === 'timeline' ? (
          <TimelineView
            groups={groupedReflections}
            onDelete={deleteReflection}
          />
        ) : viewMode === 'calendar' ? (
          <CalendarView
            reflections={filteredReflections}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
          />
        ) : (
          <ListView
            reflections={filteredReflections}
            onDelete={deleteReflection}
          />
        )}
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({
  groups,
  onDelete,
}: {
  groups: Record<TimeGroup, Reflection[]>;
  onDelete: (id: string) => void;
}) {
  const groupLabels: Record<TimeGroup, string> = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'this-week': 'This Week',
    'this-month': 'This Month',
    'earlier': 'Earlier',
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {(Object.entries(groups) as [TimeGroup, Reflection[]][]).map(([group, reflections]) => {
        if (reflections.length === 0) return null;

        return (
          <div key={group} className="space-y-4">
            <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              {groupLabels[group]}
            </h2>
            <div className="space-y-4">
              {reflections
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((reflection, index) => (
                  <ReflectionCard
                    key={reflection.id}
                    reflection={reflection}
                    onDelete={() => onDelete(reflection.id)}
                    delay={index * 0.05}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Calendar View Component
function CalendarView({
  reflections,
  onDateSelect,
  selectedDate,
}: {
  reflections: Reflection[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month with reflection counts
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ date: Date; count: number }> = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const count = reflections.filter(r =>
        new Date(r.createdAt).toDateString() === date.toDateString()
      ).length;
      days.push({ date, count });
    }

    return days;
  }, [currentMonth, reflections]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Card>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              const prev = new Date(currentMonth);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentMonth(prev);
            }}
            className="px-3 py-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            ←
          </button>
          <h3 className="font-medium">
            {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => {
              const next = new Date(currentMonth);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonth(next);
            }}
            className="px-3 py-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[var(--color-text-muted)] pb-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for first week offset */}
          {Array.from({ length: daysInMonth[0].date.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {daysInMonth.map(({ date, count }) => {
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : isToday
                    ? 'border-2 border-[var(--color-accent-blue)]'
                    : count > 0
                    ? 'bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-blue)]/10'
                    : 'hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <span>{date.getDate()}</span>
                {count > 0 && (
                  <span className="text-xs opacity-70 mt-1">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// List View Component
function ListView({
  reflections,
  onDelete,
}: {
  reflections: Reflection[];
  onDelete: (id: string) => void;
}) {
  const sorted = [...reflections].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
      {sorted.map((reflection, index) => (
        <ReflectionCard
          key={reflection.id}
          reflection={reflection}
          onDelete={() => onDelete(reflection.id)}
          delay={index * 0.03}
        />
      ))}
    </div>
  );
}

// Reflection Card Component
function ReflectionCard({
  reflection,
  onDelete,
  delay = 0,
}: {
  reflection: Reflection;
  onDelete: () => void;
  delay?: number;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card className="hover:border-[var(--color-border-emphasis)] transition-colors">
        <div className="space-y-3">
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-3">
              <span>{new Date(reflection.createdAt).toLocaleString()}</span>
              <span className="px-2 py-0.5 rounded bg-[var(--color-surface-hover)] capitalize">
                {reflection.layer}
              </span>
              {reflection.identityAxis && (
                <span className="px-2 py-0.5 rounded bg-[var(--color-accent-blue)]/10">
                  {reflection.identityAxis}
                </span>
              )}
            </div>

            {showActions && (
              <button
                onClick={() => {
                  if (confirm('Delete this reflection?')) {
                    onDelete();
                  }
                }}
                className="text-[var(--color-border-error)] hover:underline"
              >
                Delete
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {reflection.content}
          </p>

          {/* Tags */}
          {reflection.tags && reflection.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reflection.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-[var(--color-surface-hover)] text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
