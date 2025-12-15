import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MemoryNode } from './MemoryNode';

interface Memory {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  threadName?: string;
  threadId?: string;
  isShared?: boolean;
  witnessCount?: number;
  responseCount?: number;
}

interface ArchiveTimelineProps {
  memories: Memory[];
  onMemoryClick: (memoryId: string) => void;
  onThreadClick: (threadId: string) => void;
}

export function ArchiveTimeline({
  memories,
  onMemoryClick,
  onThreadClick,
}: ArchiveTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'month' | 'week'>('all');

  // Group memories by date
  const groupedMemories = memories.reduce((groups, memory) => {
    const dateKey = memory.date.toISOString().split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(memory);
    return groups;
  }, {} as Record<string, Memory[]>);

  const dates = Object.keys(groupedMemories).sort().reverse();

  // Filter by view mode
  const filteredDates = dates.filter(date => {
    if (viewMode === 'all') return true;
    
    const dateObj = new Date(date);
    const now = new Date();
    
    if (viewMode === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return dateObj >= weekAgo;
    }
    
    if (viewMode === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return dateObj >= monthAgo;
    }
    
    return true;
  });

  return (
    <div className="space-y-8">
      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
              viewMode === 'all'
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
            }`}
          >
            All time
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
              viewMode === 'month'
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
            }`}
          >
            Past month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
              viewMode === 'week'
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
            }`}
          >
            Past week
          </button>
        </div>

        <span className="text-base text-[var(--color-text-muted)]">
          {memories.length} reflection{memories.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-10">
        {filteredDates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base text-[var(--color-text-muted)]">...</p>
          </div>
        ) : (
          filteredDates.map((date, dateIndex) => {
            const dateObj = new Date(date);
            const memoriesForDate = groupedMemories[date];

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: dateIndex * 0.05,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="relative"
              >
                {/* Date header */}
                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[var(--color-base)] py-3 z-10">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <Calendar size={16} className="text-[var(--color-accent-gold)]" />
                    <span className="text-base text-[var(--color-text-primary)]">
                      {dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {memoriesForDate.length} reflection{memoriesForDate.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Memories for this date */}
                <div className="space-y-5 pl-8 border-l-2 border-[var(--color-border-subtle)]">{memoriesForDate.map((memory, memoryIndex) => (
                    <MemoryNode
                      key={memory.id}
                      id={memory.id}
                      content={memory.content}
                      timestamp={memory.timestamp}
                      threadName={memory.threadName}
                      threadId={memory.threadId}
                      isShared={memory.isShared}
                      witnessCount={memory.witnessCount}
                      responseCount={memory.responseCount}
                      onClick={() => onMemoryClick(memory.id)}
                      onThreadClick={onThreadClick}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}