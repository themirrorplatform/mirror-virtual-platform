import { useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CrisisDetectionProps {
  isVisible: boolean;
  onDismiss: () => void;
  onExploreResources: () => void;
  onDismissForever: () => void;
}

export function CrisisDetection({
  isVisible,
  onDismiss,
  onExploreResources,
  onDismissForever,
}: CrisisDetectionProps) {
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)]/50 shadow-2xl">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20">
              <AlertCircle size={24} className="text-[var(--color-accent-gold)]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2">You might notice something</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Your recent reflections contain patterns that sometimes appear when someone 
                is carrying something heavy. This isn't a diagnosis—just a signal that 
                support exists, if you want it.
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Crisis hotline (immediate) */}
          <div className="mb-4 p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm mb-1">If this moment feels urgent</h4>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  988 Suicide & Crisis Lifeline — 24/7, free, confidential
                </p>
                <a
                  href="tel:988"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-accent-gold)] hover:underline"
                >
                  Call 988
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={onExploreResources}
              className="flex-1"
            >
              Explore resources
            </Button>
            <Button
              variant="ghost"
              onClick={onDismiss}
            >
              Not now
            </Button>
            <button
              onClick={() => setShowDismissConfirm(true)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Don't show this again
            </button>
          </div>

          {/* Dismiss forever confirmation */}
          {showDismissConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]"
            >
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                This will disable crisis detection. You can re-enable it anytime in Settings → Consent.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDismissConfirm(false)}
                  className="text-xs px-3 py-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDismissForever();
                    setShowDismissConfirm(false);
                  }}
                  className="text-xs px-3 py-2 rounded-lg text-[var(--color-text-primary)] bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors"
                >
                  Disable crisis detection
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function to detect crisis patterns (would use AI in production)
export function detectCrisisPatterns(reflectionText: string): boolean {
  const crisisIndicators = [
    'want to die',
    'end it all',
    'no point',
    'can\'t go on',
    'worthless',
    'better off without me',
    'no reason to live',
    'suicide',
    'kill myself',
    'harm myself',
  ];

  const lowerText = reflectionText.toLowerCase();
  return crisisIndicators.some(indicator => lowerText.includes(indicator));
}
