import { useState } from 'react';
import { PostCard } from './PostCard';
import { Button } from './Button';
import { LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    isAnonymous?: boolean;
  };
  timestamp: string;
  isWitnessed?: boolean;
  responseCount?: number;
}

interface WorldFeedProps {
  posts: Post[];
  onPostClick: (postId: string) => void;
  onWitness: (postId: string) => void;
  onRespond: (postId: string) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type ViewMode = 'timeline' | 'grid';

export function WorldFeed({
  posts,
  onPostClick,
  onWitness,
  onRespond,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: WorldFeedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  if (posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12">
        <div className="text-center py-32">
          <p className="text-[var(--color-text-muted)] text-base">...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="mb-2">World</h2>
          <p className="text-base text-[var(--color-text-secondary)]">
            Reflections shared to Commons
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 p-2 rounded-xl bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-3 rounded-lg transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {/* Feed */}
      {viewMode === 'timeline' ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              author={post.author}
              timestamp={post.timestamp}
              isWitnessed={post.isWitnessed}
              responseCount={post.responseCount}
              onWitness={() => onWitness(post.id)}
              onRespond={() => onRespond(post.id)}
              onClick={() => onPostClick(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              author={post.author}
              timestamp={post.timestamp}
              isWitnessed={post.isWitnessed}
              responseCount={post.responseCount}
              onWitness={() => onWitness(post.id)}
              onRespond={() => onRespond(post.id)}
              onClick={() => onPostClick(post.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination - explicit, no infinite scroll */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-sm text-[var(--color-text-muted)]">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}