import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calendar } from 'lucide-react';

interface Reflection {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  threadName?: string;
}

interface ThenNowCompareProps {
  thenReflection: Reflection | null;
  nowReflection: Reflection | null;
  onSelectThen: () => void;
  onSelectNow: () => void;
  onClose?: () => void;
}

export function ThenNowCompare({
  thenReflection,
  nowReflection,
  onSelectThen,
  onSelectNow,
  onClose,
}: ThenNowCompareProps) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-3">Then / Now</h2>
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
            What exists in the distance between two moments
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-base text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors p-2"
          >
            Close
          </button>
        )}
      </div>

      {/* Comparison view */}
      <div className="grid grid-cols-2 gap-8">
        {/* Then */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-[var(--color-text-muted)]">Then</h3>
            <button
              onClick={onSelectThen}
              className="text-sm text-[var(--color-accent-gold)] hover:underline px-2 py-1"
            >
              {thenReflection ? 'Change' : 'Select'}
            </button>
          </div>

          {thenReflection ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="p-8 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-sm"
            >
              {/* Date */}
              <div className="flex items-center gap-3 mb-5 text-sm text-[var(--color-text-muted)]">
                <Calendar size={14} />
                <span>{thenReflection.timestamp}</span>
              </div>

              {/* Content */}
              <p className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
                {thenReflection.content}
              </p>

              {/* Thread */}
              {thenReflection.threadName && (
                <div className="mt-5 pt-5 border-t border-[var(--color-border-subtle)]">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Thread: {thenReflection.threadName}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <button
              onClick={onSelectThen}
              className="w-full p-16 rounded-2xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors text-center"
            >
              <p className="text-base text-[var(--color-text-muted)]">
                Select a past reflection
              </p>
            </button>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <ArrowRight
            size={28}
            className="text-[var(--color-accent-gold)]"
          />
        </div>

        {/* Now */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-[var(--color-text-muted)]">Now</h3>
            <button
              onClick={onSelectNow}
              className="text-sm text-[var(--color-accent-gold)] hover:underline px-2 py-1"
            >
              {nowReflection ? 'Change' : 'Select'}
            </button>
          </div>

          {nowReflection ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="p-8 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-sm"
            >
              {/* Date */}
              <div className="flex items-center gap-3 mb-5 text-sm text-[var(--color-text-muted)]">
                <Calendar size={14} />
                <span>{nowReflection.timestamp}</span>
              </div>

              {/* Content */}
              <p className="text-base text-[var(--color-text-primary)] leading-[1.8] whitespace-pre-wrap">
                {nowReflection.content}
              </p>

              {/* Thread */}
              {nowReflection.threadName && (
                <div className="mt-5 pt-5 border-t border-[var(--color-border-subtle)]">
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Thread: {nowReflection.threadName}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <button
              onClick={onSelectNow}
              className="w-full p-16 rounded-2xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors text-center"
            >
              <p className="text-base text-[var(--color-text-muted)]">
                Select a recent reflection
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Observation space */}
      {thenReflection && nowReflection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="p-8 rounded-2xl bg-[var(--color-base-raised)] border border-[var(--color-accent-gold)]/30"
        >
          <h4 className="text-base text-[var(--color-text-muted)] mb-4">
            What appears in the distance
          </h4>
          <p className="text-base text-[var(--color-text-secondary)] leading-[1.8]">
            You might notice patterns, shifts, or contradictions between these two moments. 
            The space between them contains what has changed—or what has stayed the same.
          </p>
        </motion.div>
      )}
    </div>
  );
}
