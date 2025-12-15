/**
 * Time-Based Reflections Instrument
 * Schedule recurring reflection prompts
 * Constitutional: user-initiated, never pushed
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, Bell, BellOff, X } from 'lucide-react';

interface TimeSchedule {
  id: string;
  label: string;
  time: string;
  days: number[];
  enabled: boolean;
  prompt?: string;
}

interface TimeBasedReflectionsInstrumentProps {
  schedules: TimeSchedule[];
  onAdd: (schedule: Omit<TimeSchedule, 'id'>) => void;
  onToggle: (scheduleId: string) => void;
  onDelete: (scheduleId: string) => void;
  onClose: () => void;
}

export function TimeBasedReflectionsInstrument({
  schedules,
  onAdd,
  onToggle,
  onDelete,
  onClose,
}: TimeBasedReflectionsInstrumentProps) {
  const [creating, setCreating] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    label: '',
    time: '09:00',
    days: [1, 2, 3, 4, 5],
    prompt: '',
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCreate = () => {
    if (newSchedule.label && newSchedule.time) {
      onAdd({ ...newSchedule, enabled: true });
      setCreating(false);
      setNewSchedule({ label: '', time: '09:00', days: [1, 2, 3, 4, 5], prompt: '' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Time-Based Reflections</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Optional reminders you control</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Constitutional: These are <strong>reminders you set</strong>, not engagement optimization. You can disable or delete them anytime. No streaks, no guilt.
            </p>
          </div>

          {schedules.length === 0 && !creating && (
            <div className="py-12 text-center">
              <Clock size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-[var(--color-text-muted)] mb-4">No scheduled reflections</p>
            </div>
          )}

          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                schedule.enabled
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{schedule.label}</h3>
                  <div className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {schedule.time} • {schedule.days.map(d => dayNames[d]).join(', ')}
                  </div>
                  {schedule.prompt && (
                    <div className="text-sm text-[var(--color-text-muted)] italic mt-2">"{schedule.prompt}"</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggle(schedule.id)}
                    className={`p-2 rounded-lg transition-all ${
                      schedule.enabled ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]' : 'bg-white/5 text-[var(--color-text-muted)]'
                    }`}
                  >
                    {schedule.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                  </button>
                  <button
                    onClick={() => onDelete(schedule.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {creating && (
            <div className="p-6 rounded-xl border-2 border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Label</label>
                  <input
                    type="text"
                    value={newSchedule.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewSchedule({ ...newSchedule, label: e.target.value })}
                    placeholder="Morning reflection"
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Time</label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Days</label>
                  <div className="flex gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const days = newSchedule.days.includes(index)
                            ? newSchedule.days.filter(d => d !== index)
                            : [...newSchedule.days, index].sort();
                          setNewSchedule({ ...newSchedule, days });
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                          newSchedule.days.includes(index)
                            ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                            : 'bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Prompt (optional)</label>
                  <input
                    type="text"
                    value={newSchedule.prompt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewSchedule({ ...newSchedule, prompt: e.target.value })}
                    placeholder="What are you grateful for today?"
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCreating(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newSchedule.label || !newSchedule.time}
                    className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>Add Schedule</span>
            </button>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


