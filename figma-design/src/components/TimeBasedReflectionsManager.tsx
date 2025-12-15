/**
 * Time-Based Reflections Manager
 * 
 * Constitutional Principles:
 * - User schedules reflections
 * - Optional reminders (never forced)
 * - No pressure to complete
 * - Can be dismissed anytime
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Bell, BellOff, CheckCircle, Trash2, Plus } from 'lucide-react';
import { timeBasedReflections, TimeBasedReflection } from '../services/timeBasedReflections';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';
import { Input } from './Input';

export function TimeBasedReflectionsManager() {
  const [scheduled, setScheduled] = useState<TimeBasedReflection[]>([]);
  const [upcoming, setUpcoming] = useState<TimeBasedReflection[]>([]);
  const [pastDue, setPastDue] = useState<TimeBasedReflection[]>([]);
  const [completed, setCompleted] = useState<TimeBasedReflection[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past-due' | 'completed'>('upcoming');

  // Form state
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    loadReflections();
  }, []);

  const loadReflections = () => {
    setScheduled(timeBasedReflections.getScheduled());
    setUpcoming(timeBasedReflections.getUpcoming(7));
    setPastDue(timeBasedReflections.getPastDue());
    setCompleted(timeBasedReflections.getCompleted());
  };

  const handleCreate = () => {
    if (!content.trim() || !scheduledDate || !scheduledTime) {
      alert('Please fill in all required fields');
      return;
    }

    const datetime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    timeBasedReflections.schedule(content, datetime, {
      reminderEnabled,
      recurring: isRecurring ? { frequency } : undefined,
    });

    setShowCreateModal(false);
    resetForm();
    loadReflections();
  };

  const resetForm = () => {
    setContent('');
    setScheduledDate('');
    setScheduledTime('');
    setReminderEnabled(false);
    setIsRecurring(false);
    setFrequency('weekly');
  };

  const handleComplete = (id: string) => {
    timeBasedReflections.complete(id);
    loadReflections();
  };

  const handleSnooze = (id: string, hours: number) => {
    timeBasedReflections.snooze(id, hours);
    loadReflections();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this scheduled reflection?')) {
      timeBasedReflections.delete(id);
      loadReflections();
    }
  };

  const handleToggleReminder = (id: string, enabled: boolean) => {
    timeBasedReflections.update(id, { reminderEnabled: enabled });
    loadReflections();
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      if (hours < 24) return `${hours} hours overdue`;
      return `${days} days overdue`;
    } else {
      if (hours < 24) return `in ${hours} hours`;
      return `in ${days} days`;
    }
  };

  const stats = timeBasedReflections.getStats();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Scheduled Reflections</h3>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Schedule New
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Scheduled</p>
            <p className="text-2xl">{stats.scheduled}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Past Due</p>
            <p className="text-2xl text-[var(--color-accent-amber)]">{stats.pastDue}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Recurring</p>
            <p className="text-2xl">{stats.recurring}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Completed</p>
            <p className="text-2xl text-[var(--color-accent-green)]">{stats.completed}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past-due')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'past-due'
              ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Past Due ({pastDue.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'completed'
              ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <Card variant="emphasis">
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                No upcoming scheduled reflections
              </p>
            </Card>
          ) : (
            upcoming.map(reflection => (
              <Card key={reflection.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Calendar size={20} className="text-[var(--color-accent-blue)]" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm mb-2">{reflection.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-2">
                      <span>{formatDateTime(reflection.scheduledFor)}</span>
                      <span className="text-[var(--color-accent-blue)]">
                        {getRelativeTime(reflection.scheduledFor)}
                      </span>
                      {reflection.recurring && (
                        <span className="flex items-center gap-1">
                          <Repeat size={12} />
                          {reflection.recurring.frequency}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleComplete(reflection.id)}
                      >
                        <CheckCircle size={14} />
                        Complete
                      </Button>

                      <button
                        onClick={() => handleToggleReminder(reflection.id, !reflection.reminderEnabled)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
                      >
                        {reflection.reminderEnabled ? (
                          <>
                            <Bell size={14} />
                            Reminder On
                          </>
                        ) : (
                          <>
                            <BellOff size={14} />
                            Reminder Off
                          </>
                        )}
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reflection.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Past Due */}
      {activeTab === 'past-due' && (
        <div className="space-y-3">
          {pastDue.length === 0 ? (
            <Card variant="emphasis">
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                No past due reflections
              </p>
            </Card>
          ) : (
            pastDue.map(reflection => (
              <Card key={reflection.id} variant="emphasis">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Clock size={20} className="text-[var(--color-accent-amber)]" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm mb-2">{reflection.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs mb-2">
                      <span className="text-[var(--color-text-muted)]">
                        {formatDateTime(reflection.scheduledFor)}
                      </span>
                      <span className="text-[var(--color-accent-amber)]">
                        {getRelativeTime(reflection.scheduledFor)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleComplete(reflection.id)}
                      >
                        <CheckCircle size={14} />
                        Complete Now
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSnooze(reflection.id, 1)}
                      >
                        Snooze 1h
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reflection.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Completed */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <Card variant="emphasis">
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                No completed reflections yet
              </p>
            </Card>
          ) : (
            completed.map(reflection => (
              <Card key={reflection.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle size={20} className="text-[var(--color-accent-green)]" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm mb-2">{reflection.content}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                      <span>Scheduled: {formatDateTime(reflection.scheduledFor)}</span>
                      {reflection.completedAt && (
                        <span>Completed: {formatDateTime(reflection.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Schedule Reflection"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">What do you want to reflect on?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="..."
              className="w-full min-h-[100px] px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <Input
              type="time"
              label="Time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reminder"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="reminder" className="text-sm">
              Enable reminder
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="recurring" className="text-sm">
              Make this recurring
            </label>
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleCreate}
              disabled={!content.trim() || !scheduledDate || !scheduledTime}
            >
              Schedule
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
