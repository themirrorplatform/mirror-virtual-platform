/**
 * World Screen (Backend Integrated)
 * 
 * Commons layer - witnessing others
 * Only accessible when in Commons layer with consent
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, MessageSquare, Search, Filter } from 'lucide-react';
import { useAppState, useReflections } from '../../hooks/useAppState';
import { Card } from '../Card';
import { Input } from '../Input';
import { Button } from '../Button';
import { EmptyStateView, LoadingState } from '../EmptyStates';
import { Reflection } from '../../services/database';

export function WorldScreenIntegrated() {
  const { currentLayer, isLoading } = useAppState();
  const allReflections = useReflections({ layer: 'commons' }); // Only commons reflections

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'witnessed'>('recent');
  const [witnessedPosts, setWitnessedPosts] = useState<Set<string>>(new Set());

  // Filter and sort
  const filteredReflections = useMemo(() => {
    let filtered = allReflections.filter(r => {
      if (searchQuery && !r.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return r.isPublic; // Only show public reflections
    });

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Could implement witness count sorting when we have that data
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [allReflections, searchQuery, sortBy]);

  const handleWitness = (reflectionId: string) => {
    setWitnessedPosts(prev => {
      const next = new Set(prev);
      if (next.has(reflectionId)) {
        next.delete(reflectionId);
      } else {
        next.add(reflectionId);
      }
      return next;
    });
  };

  // Check if user is in commons layer
  if (currentLayer !== 'commons') {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="space-y-4">
            <Eye size={48} className="mx-auto text-[var(--color-text-muted)]" />
            <div>
              <h3 className="font-medium mb-2">Commons Layer Required</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Switch to Commons layer to witness others' reflections.
              </p>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Press Cmd+K → Layer → Commons
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading world..." />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
        <div className="max-w-3xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium">World</h1>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'witnessed')}
                className="px-3 py-1 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm"
              >
                <option value="recent">Recent</option>
                <option value="witnessed">Most Witnessed</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <Input
            type="search"
            placeholder="Search the commons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />

          {/* Stats */}
          <div className="text-sm text-[var(--color-text-muted)]">
            {filteredReflections.length} public reflections
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {filteredReflections.length === 0 ? (
          <EmptyStateView type="world" searchQuery={searchQuery} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {filteredReflections.map((reflection, index) => (
              <PostCard
                key={reflection.id}
                reflection={reflection}
                isWitnessed={witnessedPosts.has(reflection.id)}
                onWitness={() => handleWitness(reflection.id)}
                delay={index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Post Card Component
function PostCard({
  reflection,
  isWitnessed,
  onWitness,
  delay = 0,
}: {
  reflection: Reflection;
  isWitnessed: boolean;
  onWitness: () => void;
  delay?: number;
}) {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');

  const handleRespond = () => {
    // TODO: Implement response system
    console.log('Response:', responseText);
    setResponseText('');
    setShowResponse(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-3">
              <span>{new Date(reflection.createdAt).toLocaleString()}</span>
              {reflection.identityAxis && (
                <span className="px-2 py-0.5 rounded bg-[var(--color-accent-blue)]/10">
                  {reflection.identityAxis}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {reflection.content}
          </p>

          {/* Tags */}
          {reflection.tags && reflection.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reflection.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-[var(--color-surface-hover)] text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={onWitness}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isWitnessed
                  ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
                  : 'hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <Eye size={16} />
              {isWitnessed ? 'Witnessed' : 'Witness'}
            </button>

            <button
              onClick={() => setShowResponse(!showResponse)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <MessageSquare size={16} />
              Respond
            </button>
          </div>

          {/* Response Field */}
          <AnimatePresence>
            {showResponse && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-[var(--color-border-subtle)]"
              >
                <p className="text-xs text-[var(--color-text-secondary)]">
                  What part are you responding to?
                </p>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm resize-none focus:outline-none focus:border-[var(--color-accent-blue)]"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResponse(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRespond}
                    disabled={!responseText.trim()}
                  >
                    Send Response
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
