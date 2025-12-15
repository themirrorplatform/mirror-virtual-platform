/**
 * MirrorField - The Only Persistent Frame
 * 
 * Constitutional Principles:
 * - "Adaptive. Human. Waiting."
 * - Silent by default, no hints
 * - Layer-based tint colors
 * - No persistent navigation
 * - Crisis mode support
 */

import { useState, useEffect, useCallback } from 'react';
import { autoRecoveryService } from '../lib/services/autoRecovery';
import { RecoveryBanner } from './RecoveryBanner';
import { CrisisDetectionBanner } from './CrisisDetectionBanner';
import { crisisDetectionService } from '../lib/services/crisisDetection';
import { InlineActionBar } from './InlineActionBar';

interface MirrorFieldProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  layer?: 'sovereign' | 'commons' | 'builder';
  crisisMode?: boolean;
}

export function MirrorField({ 
  onSubmit, 
  placeholder = '...',
  layer = 'sovereign',
  crisisMode = false 
}: MirrorFieldProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [time, setTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [crisisBannerVisible, setCrisisBannerVisible] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<'concern' | 'urgent'>('concern');
  const [showActionBar, setShowActionBar] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-recovery with save indicator + crisis detection
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Hide action bar while typing
    setShowActionBar(false);
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Show saving indicator
    setIsSaving(true);
    
    // Save to recovery (100ms debounced)
    autoRecoveryService.saveSnapshot(newContent, { modality: 'text' });
    
    // Crisis detection (constitutional: local only, respectful)
    const crisisResult = crisisDetectionService.analyze(newContent);
    if (crisisResult.detected && !crisisDetectionService.isDismissedRecently()) {
      setCrisisSeverity(crisisResult.severity as 'concern' | 'urgent');
      setCrisisBannerVisible(true);
    }
    
    // Update save indicator after debounce
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 150);
    
    // Show action bar after 2 seconds of no typing
    if (newContent.trim().length > 0) {
      const timeout = setTimeout(() => {
        setShowActionBar(true);
      }, 2000);
      setTypingTimeout(timeout);
    }
  }, [typingTimeout]);

  const handleRecover = useCallback((recoveredContent: string) => {
    setContent(recoveredContent);
  }, []);

  const handleDismissRecovery = useCallback(() => {
    // Recovery dismissed
  }, []);

  const handleCrisisDismiss = useCallback(() => {
    setCrisisBannerVisible(false);
    crisisDetectionService.recordDismissal();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      autoRecoveryService.clearSnapshot();
      setContent('');
    } catch (error) {
      console.error('Failed to submit reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Format time since last save
  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <RecoveryBanner onRecover={handleRecover} onDismiss={handleDismissRecovery} />
      <CrisisDetectionBanner 
        isVisible={crisisBannerVisible} 
        onDismiss={handleCrisisDismiss}
        severity={crisisSeverity}
      />
      
      <div className="relative h-screen flex flex-col items-center justify-center bg-[var(--color-base-default)] overflow-hidden">
        {/* Time display */}
        <div className="relative mb-8">
          <div className="text-sm text-[var(--color-text-muted)] font-serif text-center">
            {time}
          </div>
        </div>

        {/* Central field */}
        <div className="relative w-full max-w-2xl px-6">
          <textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="
              w-full h-48 px-6 py-4 rounded-xl
              bg-[var(--color-surface-card)]
              border border-[var(--color-border-subtle)]
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-muted)]
              font-serif text-lg leading-relaxed
              resize-none outline-none
              transition-all duration-300
              focus:border-[var(--color-accent-gold)]
              focus:shadow-[0_0_0_3px_rgba(203,163,93,0.1)]
              disabled:opacity-50 disabled:cursor-not-allowed
              custom-scrollbar
            "
          />

          {/* Save status and submit hint */}
          <div className="mt-3 flex items-center justify-between">
            {/* Auto-save indicator */}
            <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
              {isSaving && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                  saving...
                </span>
              )}
              {!isSaving && lastSaved && content.trim() && (
                <span className="flex items-center gap-1 opacity-60">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                  saved {formatTimeSince(lastSaved)}
                </span>
              )}
            </div>

            {/* Submit hint */}
          {content.trim() && !isSubmitting && !showActionBar && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Press <kbd className="px-2 py-1 rounded text-xs bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] font-mono">⌘↵</kbd> to reflect
            </span>
          )}
          </div>

          {/* Inline Action Bar - appears on pause */}
          <div className="mt-4 flex justify-center">
            <InlineActionBar
              isVisible={showActionBar && content.trim().length > 0 && !isSubmitting}
              onReflect={handleSubmit}
              isReflecting={isSubmitting}
            />
          </div>

          {/* Submitting state */}
          {isSubmitting && (
            <div className="mt-3 text-center">
              <span className="text-xs text-[var(--color-text-muted)]">
                Reflecting...
              </span>
            </div>
          )}
        </div>

        {/* Crisis mode indicator */}
        {crisisMode && (
          <div className="absolute top-6 right-6">
            <div className="px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-medium animate-pulse">
              Crisis Mode
            </div>
          </div>
        )}
      </div>
    </>
  );
}

