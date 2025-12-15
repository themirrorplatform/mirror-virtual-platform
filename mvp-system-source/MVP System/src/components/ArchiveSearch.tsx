import { useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryNode } from './MemoryNode';
import { Input } from './Input';

interface SearchResult {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  threadName?: string;
  threadId?: string;
  relevanceScore?: number;
  matchedPhrases?: string[];
}

interface Pattern {
  id: string;
  label: string;
  description: string;
  occurrences: number;
  relatedMemories: string[];
}

interface ArchiveSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult[];
  detectedPatterns?: Pattern[];
  isSearching?: boolean;
  onMemoryClick: (memoryId: string) => void;
  onThreadClick: (threadId: string) => void;
}

export function ArchiveSearch({
  onSearch,
  searchResults,
  detectedPatterns = [],
  isSearching = false,
  onMemoryClick,
  onThreadClick,
}: ArchiveSearchProps) {
  const [query, setQuery] = useState('');
  const [showPatterns, setShowPatterns] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search your reflections..."
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent-gold)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors outline-none"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="px-6 py-3 rounded-lg bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        </div>

        {/* Search suggestions */}
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Try:</span>
            {['anxiety', 'relationships', 'work', 'body', 'money'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  onSearch(suggestion);
                }}
                className="px-2 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pattern detection toggle */}
      {detectedPatterns.length > 0 && (
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50 transition-colors"
        >
          <Sparkles size={16} />
          <span>{showPatterns ? 'Hide' : 'Show'} detected patterns</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            ({detectedPatterns.length})
          </span>
        </button>
      )}

      {/* Detected patterns */}
      <AnimatePresence>
        {showPatterns && detectedPatterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-3 overflow-hidden"
          >
            {detectedPatterns.map(pattern => (
              <div
                key={pattern.id}
                className="p-4 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-accent-gold)]/30"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm text-[var(--color-accent-gold)]">
                    {pattern.label}
                  </h4>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {pattern.occurrences} occurrence{pattern.occurrences !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {pattern.description}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search results */}
      <div className="space-y-3">
        {isSearching ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-text-muted)]">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.23, 1, 0.32, 1]
                }}
              >
                <MemoryNode
                  id={result.id}
                  content={result.content}
                  timestamp={result.timestamp}
                  threadName={result.threadName}
                  threadId={result.threadId}
                  onClick={() => onMemoryClick(result.id)}
                  onThreadClick={onThreadClick}
                />
                {result.matchedPhrases && result.matchedPhrases.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-4">
                    {result.matchedPhrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/20"
                      >
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </>
        ) : query && !isSearching ? (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--color-text-muted)]">No results found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
