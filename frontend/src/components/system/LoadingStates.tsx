/**
 * Loading States - Constitutional loading indicators
 * 
 * Features:
 * - Non-intrusive loading states
 * - Skeleton screens
 * - Progressive disclosure
 * - Accessible announcements
 * - No spinners that demand attention
 * - Respects reduced motion
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * LoadingSpinner - Gentle spinner for inline loading
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 
          size={sizeMap[size]} 
          className="text-[var(--color-accent-blue)]" 
        />
      </motion.div>
      {label && (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * LoadingDots - Subtle animated dots
 */
interface LoadingDotsProps {
  label?: string;
}

export function LoadingDots({ label = 'Loading' }: LoadingDotsProps) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      {label && (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-blue)]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * LoadingBar - Horizontal progress indicator
 */
interface LoadingBarProps {
  progress?: number; // 0-100, undefined for indeterminate
  label?: string;
}

export function LoadingBar({ progress, label }: LoadingBarProps) {
  const isIndeterminate = progress === undefined;

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">{label}</span>
          {!isIndeterminate && (
            <span className="text-[var(--color-text-muted)]">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      
      <div className="h-1 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
        {isIndeterminate ? (
          <motion.div
            className="h-full w-1/3 bg-[var(--color-accent-blue)] rounded-full"
            animate={{
              x: ['-100%', '400%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ) : (
          <motion.div
            className="h-full bg-[var(--color-accent-blue)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      
      <span className="sr-only">
        {isIndeterminate ? 'Loading' : `${Math.round(progress)}% complete`}
      </span>
    </div>
  );
}

/**
 * LoadingSkeleton - Content placeholder
 */
interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
  count?: number;
}

export function LoadingSkeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1,
}: LoadingSkeletonProps) {
  const baseClass = "bg-[var(--color-surface-hover)] animate-pulse";
  
  const variantClass = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-lg',
  }[variant];

  const style = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'circle' ? '40px' : variant === 'text' ? '16px' : '100px'),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClass} ${className}`}
          style={style}
          role="status"
          aria-label="Loading"
        />
      ))}
    </>
  );
}

/**
 * LoadingCard - Skeleton card for content loading
 */
export function LoadingCard() {
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <LoadingSkeleton variant="circle" width="40px" height="40px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton width="60%" height="20px" />
          <LoadingSkeleton width="40%" height="14px" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSkeleton count={3} />
        <LoadingSkeleton width="80%" />
      </div>
    </Card>
  );
}

/**
 * LoadingOverlay - Full-screen loading state
 */
interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export function LoadingOverlay({ message = 'Loading...', isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-primary)]/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Card className="text-center p-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
      </Card>
    </motion.div>
  );
}

/**
 * LoadingInline - Inline content loading
 */
interface LoadingInlineProps {
  lines?: number;
  showAvatar?: boolean;
}

export function LoadingInline({ lines = 3, showAvatar = false }: LoadingInlineProps) {
  return (
    <div className="space-y-3">
      {showAvatar && (
        <div className="flex items-center gap-3">
          <LoadingSkeleton variant="circle" width="32px" height="32px" />
          <LoadingSkeleton width="120px" height="16px" />
        </div>
      )}
      <div className="space-y-2">
        <LoadingSkeleton count={lines} />
        {lines > 1 && <LoadingSkeleton width="60%" />}
      </div>
    </div>
  );
}

/**
 * EmptyState - When there's no content to load
 */
interface EmptyStateProps {
  icon?: React.ComponentType<{ size: number; className?: string }>;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon, 
  title = 'Nothing here yet',
  description,
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
      )}
      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
        {title}
      </p>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue)]/90 transition-colors text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ConstitutionalLoading - Loading state that doesn't demand attention
 */
interface ConstitutionalLoadingProps {
  message?: string;
  detail?: string;
}

export function ConstitutionalLoading({ 
  message = 'Loading', 
  detail = 'This will appear when ready' 
}: ConstitutionalLoadingProps) {
  return (
    <Card variant="emphasis" className="text-center py-8">
      <div className="space-y-4">
        <LoadingDots label={message} />
        <p className="text-xs text-[var(--color-text-muted)]">
          {detail}
        </p>
      </div>
    </Card>
  );
}

/**
 * SkeletonList - Loading state for list views
 */
interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
}

export function SkeletonList({ count = 3, showAvatar = true }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <div className="flex items-start gap-3">
            {showAvatar && (
              <LoadingSkeleton variant="circle" width="40px" height="40px" />
            )}
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width="70%" height="18px" />
              <LoadingSkeleton width="90%" height="14px" />
              <LoadingSkeleton width="60%" height="14px" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * ProgressiveLoader - Shows content as it loads
 */
interface ProgressiveLoaderProps {
  isLoading: boolean;
  hasContent: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export function ProgressiveLoader({ 
  isLoading, 
  hasContent, 
  skeleton, 
  children 
}: ProgressiveLoaderProps) {
  if (isLoading && !hasContent) {
    return <>{skeleton}</>;
  }

  return (
    <div className="space-y-4">
      {children}
      {isLoading && hasContent && (
        <div className="pt-4">
          <LoadingDots label="Loading more" />
        </div>
      )}
    </div>
  );
}

/**
 * useLoadingState Hook - Manage loading states
 */
import { useState, useCallback } from 'react';

export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((err: Error) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      startLoading();
      const result = await fn();
      stopLoading();
      return result;
    } catch (err) {
      setLoadingError(err as Error);
      return undefined;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
  };
}

export type { 
  LoadingSpinnerProps, 
  LoadingBarProps, 
  LoadingSkeletonProps,
  EmptyStateProps,
  LoadingOverlayProps 
};


