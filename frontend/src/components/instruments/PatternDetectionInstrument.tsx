/**
 * Pattern Detection Instrument
 * Shows detected patterns in reflections
 * Constitutional: transparency, user interprets meaning
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Eye, EyeOff, X } from 'lucide-react';

interface Pattern {
  id: string;
  type: 'frequency' | 'sentiment' | 'topic' | 'time';
  label: string;
  description: string;
  confidence: number;
  dataPoints: { date: Date; value: number }[];
  visible: boolean;
}

interface PatternDetectionInstrumentProps {
  patterns: Pattern[];
  onTogglePattern: (patternId: string) => void;
  onClose: () => void;
}

export function PatternDetectionInstrument({
  patterns,
  onTogglePattern,
  onClose,
}: PatternDetectionInstrumentProps) {
  const getPatternIcon = (type: Pattern['type']) => {
    switch (type) {
      case 'frequency':
        return Activity;
      case 'sentiment':
        return TrendingUp;
      case 'topic':
        return Activity;
      case 'time':
        return Activity;
      default:
        return Activity;
    }
  };

  const getPatternColor = (type: Pattern['type']) => {
    switch (type) {
      case 'frequency':
        return 'blue';
      case 'sentiment':
        return 'green';
      case 'topic':
        return 'purple';
      case 'time':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-5xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Pattern Detection</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Patterns we've noticed—you interpret them</p>
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
              <strong>Constitutional:</strong> We show what we detect. You decide what it means. No prescriptions, no "you should" statements.
            </p>
          </div>

          {patterns.length === 0 ? (
            <div className="py-12 text-center">
              <Activity size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
              <p className="text-[var(--color-text-muted)]">No patterns detected yet</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Continue reflecting to build data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((pattern) => {
                const Icon = getPatternIcon(pattern.type);
                const color = getPatternColor(pattern.type);
                
                return (
                  <div
                    key={pattern.id}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      pattern.visible
                        ? `border-${color}-400 bg-${color}-500/10`
                        : 'border-[var(--color-border-subtle)] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <Icon size={20} className={`text-${color}-400`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{pattern.label}</h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">{pattern.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onTogglePattern(pattern.id)}
                        className={`p-2 rounded-lg transition-all ${
                          pattern.visible
                            ? `bg-${color}-500/20 text-${color}-400`
                            : 'bg-white/5 text-[var(--color-text-muted)]'
                        }`}
                      >
                        {pattern.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--color-text-muted)] capitalize">{pattern.type} pattern</span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${color}-400 rounded-full transition-all`}
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="h-16 flex items-end gap-1">
                      {pattern.dataPoints.slice(-20).map((point, i) => {
                        const maxValue = Math.max(...pattern.dataPoints.map(p => p.value));
                        const height = (point.value / maxValue) * 100;
                        return (
                          <div
                            key={i}
                            className={`flex-1 bg-${color}-400 rounded-t opacity-70 transition-all hover:opacity-100`}
                            style={{ height: `${height}%` }}
                            title={`${point.date.toLocaleDateString()}: ${point.value}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 rounded-xl border border-[var(--color-border-subtle)]">
            <h3 className="font-semibold mb-2 text-[var(--color-text-primary)]">Pattern Types</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[var(--color-text-primary)]">Frequency</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] ml-4">How often you reflect</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[var(--color-text-primary)]">Sentiment</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] ml-4">Emotional tone trends</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-[var(--color-text-primary)]">Topic</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] ml-4">Recurring themes</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-[var(--color-text-primary)]">Time</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] ml-4">When you reflect</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

