/**
 * Recovery Banner - Auto-Recovery UI
 * 
 * Constitutional Principles:
 * - User chooses to recover or discard
 * - Never automatic restoration
 * - Transparent about what was recovered
 * - Dismissible forever
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Check, X } from 'lucide-react';
import { autoRecoveryService } from '../services/autoRecovery';
import { Button } from './Button';
import { Card } from './Card';

interface RecoveryBannerProps {
  onRecover: (content: string) => void;
  onDismiss: () => void;
}

export function RecoveryBanner({ onRecover, onDismiss }: RecoveryBannerProps) {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkRecovery = async () => {
      if (autoRecoveryService.hasRecovery()) {
        const age = autoRecoveryService.getRecoveryAge();
        if (age && age < 3600) { // Less than 1 hour old
          const recovered = await autoRecoveryService.getSnapshot();
          if (recovered && recovered.content.trim().length > 20) {
            setSnapshot(recovered);
            setShowBanner(true);
          }
        }
      }
    };

    checkRecovery();
  }, []);

  const handleRecover = async () => {
    if (snapshot) {
      onRecover(snapshot.content);
      autoRecoveryService.clearSnapshot();
      setShowBanner(false);
    }
  };

  const handleDiscard = () => {
    autoRecoveryService.clearSnapshot();
    setShowBanner(false);
    onDismiss();
  };

  if (!showBanner || !snapshot) return null;

  const age = Math.floor((Date.now() - snapshot.timestamp) / 1000);
  const minutes = Math.floor(age / 60);
  const timeAgo = minutes < 1 ? 'just now' : 
                  minutes === 1 ? '1 minute ago' :
                  minutes < 60 ? `${minutes} minutes ago` :
                  `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''} ago`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <Card variant="emphasis" className="border-l-4 border-[var(--color-accent-amber)]">
          <div className="flex items-start gap-4">
            <AlertCircle 
              size={20} 
              className="text-[var(--color-accent-amber)] mt-0.5 flex-shrink-0" 
            />
            
            <div className="flex-1">
              <p className="font-medium mb-1">Unsaved reflection found</p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Written {timeAgo} • {snapshot.content.length} characters
              </p>
              
              {/* Preview */}
              <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-lg p-3 mb-3">
                <p className="text-sm text-[var(--color-text-secondary)] italic line-clamp-2">
                  {snapshot.content}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRecover}
                >
                  <Check size={16} />
                  Recover
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                >
                  <X size={16} />
                  Discard
                </Button>
              </div>
            </div>

            <button
              onClick={handleDiscard}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Save Status Indicator (subtle dot)
 * Constitutional: visible but not intrusive
 */
export function SaveStatusIndicator({ status }: { 
  status: 'idle' | 'saving' | 'saved' 
}) {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <div className="flex items-center gap-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-full px-3 py-2 shadow-lg">
          {status === 'saving' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent-amber)] animate-pulse" />
              <span className="text-xs text-[var(--color-text-muted)]">Saving</span>
            </>
          )}
          {status === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
              <span className="text-xs text-[var(--color-text-muted)]">Saved</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
