import { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from './EmptyState';

interface IdentityAxis {
  id: string;
  label: string;
  value: string;
}

interface IdentityAxesProps {
  axes: IdentityAxis[];
  onAddAxis: (label: string, value: string) => void;
  onUpdateAxis: (id: string, label: string, value: string) => void;
  onDeleteAxis: (id: string) => void;
}

export function IdentityAxes({
  axes,
  onAddAxis,
  onUpdateAxis,
  onDeleteAxis,
}: IdentityAxesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newLabel.trim() && newValue.trim()) {
      onAddAxis(newLabel, newValue);
      setNewLabel('');
      setNewValue('');
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (newLabel.trim() && newValue.trim()) {
      onUpdateAxis(id, newLabel, newValue);
      setEditingId(null);
      setNewLabel('');
      setNewValue('');
    }
  };

  const startEdit = (axis: IdentityAxis) => {
    setEditingId(axis.id);
    setNewLabel(axis.label);
    setNewValue(axis.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setNewLabel('');
    setNewValue('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl mb-3">Identity Axes</h3>
        <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
          You define what dimensions matter. No fixed categories, no required fields.
        </p>
      </div>

      {/* Existing axes */}
      <div className="space-y-5">
        {axes.length === 0 && !isAdding && (
          <EmptyState />
        )}

        <AnimatePresence mode="popLayout">
          {axes.map((axis) => (
            <motion.div
              key={axis.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="p-6 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] group hover:border-[var(--color-accent-gold)]/30 transition-colors shadow-ambient-sm"
            >
              {editingId === axis.id ? (
                // Edit mode
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Dimension name (e.g., 'Current focus')"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Current value"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="p-3 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleUpdate(axis.id)}
                      disabled={!newLabel.trim() || !newValue.trim()}
                      className="p-3 rounded-xl text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-[var(--color-text-muted)] mb-1">
                      {axis.label}
                    </div>
                    <div className="text-[var(--color-text-primary)]">
                      {axis.value}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(axis)}
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] hover:bg-[var(--color-base-raised)] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteAxis(axis.id)}
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--color-base-raised)] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new axis form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)]/30"
          >
            <div className="space-y-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Dimension name (e.g., 'Current focus', 'Energy level', 'What I'm learning')"
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Current value"
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelEdit}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newLabel.trim() || !newValue.trim()}
                  className="p-2 rounded-lg text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors w-full justify-center"
        >
          <Plus size={16} />
          <span className="text-sm">Add identity axis</span>
        </button>
      )}

      {/* Guidance */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Identity axes can be anything: roles you inhabit, qualities you notice, 
          states that shift, questions you're holding. They can change as you change.
        </p>
      </div>
    </div>
  );
}