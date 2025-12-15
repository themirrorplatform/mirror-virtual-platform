import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 size={32} className="text-[var(--color-accent-gold)]" />
      </motion.div>
      {message && (
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="py-12">
      {content}
    </div>
  );
}

// Skeleton loader for content
export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-[var(--color-surface-card)] rounded w-3/4" />
      <div className="h-4 bg-[var(--color-surface-card)] rounded w-full" />
      <div className="h-4 bg-[var(--color-surface-card)] rounded w-5/6" />
    </div>
  );
}

// Inline loader for buttons
export function InlineLoader({ size = 16 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <Loader2 size={size} />
    </motion.div>
  );
}
