/**
 * Loading & Error States - Constitutional UI feedback
 * Silent, non-directive feedback for system states
 */

import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = '...' }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-[var(--color-surface-primary)]"
    >
      <div className="text-center space-y-4">
        {/* Constitutional loading indicator - ambient, not urgent */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-12 h-12 mx-auto rounded-full border-2 border-[var(--color-border-subtle)]"
        />
        
        {/* Descriptive, never directive */}
        <p className="text-[var(--color-text-secondary)]">
          {message}
        </p>
      </div>
    </motion.div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorState({ error, onRetry, onDismiss }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-[var(--color-surface-primary)] p-8"
    >
      <div className="max-w-md text-center space-y-6">
        <AlertCircle 
          size={48} 
          className="mx-auto text-[var(--color-text-secondary)]"
          strokeWidth={1.5}
        />
        
        {/* Descriptive, not alarming */}
        <div className="space-y-2">
          <h2>Something prevented initialization</h2>
          <p className="text-[var(--color-text-secondary)]">
            {error}
          </p>
        </div>

        {/* Optional actions - descriptive labels */}
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg border border-[var(--color-border-emphasis)] hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              Attempt again
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Continue anyway
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface OperationLoadingProps {
  message?: string;
}

export function OperationLoading({ message = 'Processing...' }: OperationLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-4 h-4 border-2 border-[var(--color-border-subtle)] border-t-[var(--color-accent-gold)] rounded-full"
      />
      <span>{message}</span>
    </motion.div>
  );
}

interface InlineErrorProps {
  error: string;
  onDismiss?: () => void;
}

export function InlineError({ error, onDismiss }: InlineErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-[var(--color-text-secondary)] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[var(--color-text-primary)]">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}
