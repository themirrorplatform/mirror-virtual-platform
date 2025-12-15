/**
 * Empty States - Constitutional zero-state messaging
 * 
 * All empty states follow constitutional language:
 * - No directives ("create one to start")
 * - No pressure
 * - Simple existence statements
 */

import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Link2, 
  Globe, 
  Archive, 
  User,
  Search,
  Sparkles,
  Clock
} from 'lucide-react';

interface EmptyStateProps {
  type: 
    | 'reflections' 
    | 'threads' 
    | 'world' 
    | 'archive' 
    | 'identity-axes'
    | 'search'
    | 'mirrorback'
    | 'patterns';
  searchQuery?: string;
}

export function EmptyStateView({ type, searchQuery }: EmptyStateProps) {
  const states = {
    reflections: {
      icon: MessageSquare,
      message: '...',
      description: 'Nothing appears here yet.',
    },
    threads: {
      icon: Link2,
      message: '...',
      description: 'No threads exist.',
    },
    world: {
      icon: Globe,
      message: '...',
      description: 'The commons is empty.',
    },
    archive: {
      icon: Archive,
      message: '...',
      description: 'Nothing appears in memory yet.',
    },
    'identity-axes': {
      icon: User,
      message: '...',
      description: 'No identity axes defined.',
    },
    search: {
      icon: Search,
      message: searchQuery ? `No results for "${searchQuery}"` : '...',
      description: searchQuery ? 'Nothing matches.' : 'Enter a query.',
    },
    mirrorback: {
      icon: Sparkles,
      message: '...',
      description: 'No reflection yet.',
    },
    patterns: {
      icon: Clock,
      message: '...',
      description: 'Not enough data for patterns.',
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <Icon size={48} className="text-[var(--color-text-muted)] mb-4" strokeWidth={1.5} />
      <p className="text-lg text-[var(--color-text-secondary)] mb-2">
        {state.message}
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">
        {state.description}
      </p>
    </motion.div>
  );
}

/**
 * First Time Experience - Appears once, never again
 */
export function FirstTimeWelcome({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 bg-[var(--color-surface-base)]/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-3xl font-medium">The Mirror</h1>
        
        <div className="space-y-4 text-[var(--color-text-secondary)]">
          <p className="text-lg">A space for reflection.</p>
          <p>Not productivity. Not optimization. Not self-improvement in the conventional sense.</p>
        </div>

        <div className="pt-6">
          <button
            onClick={onDismiss}
            className="px-6 py-3 rounded-lg bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue)]/90 transition-colors"
          >
            Enter
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] italic">
          Press Cmd+K to summon instruments
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Loading State - Before data loads
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--color-accent-blue)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error State - When something fails
 */
export function ErrorState({ 
  message = 'Something went wrong',
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-[var(--color-border-error)]/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠</span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-card)] transition-colors text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Skeleton Loader - While content loads
 */
export function SkeletonLoader({ type }: { type: 'reflection' | 'thread' | 'post' }) {
  const reflectionSkeleton = (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-[var(--color-surface-hover)] rounded w-3/4" />
      <div className="h-4 bg-[var(--color-surface-hover)] rounded w-full" />
      <div className="h-4 bg-[var(--color-surface-hover)] rounded w-5/6" />
    </div>
  );

  const threadSkeleton = (
    <div className="space-y-2 animate-pulse">
      <div className="h-5 bg-[var(--color-surface-hover)] rounded w-1/2" />
      <div className="h-3 bg-[var(--color-surface-hover)] rounded w-1/4" />
    </div>
  );

  const skeletons = {
    reflection: reflectionSkeleton,
    thread: threadSkeleton,
    post: reflectionSkeleton,
  };

  return <div className="p-4">{skeletons[type]}</div>;
}
