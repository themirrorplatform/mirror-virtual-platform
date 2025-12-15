/**
 * Advanced Search - Sophisticated search with filters
 * 
 * Features:
 * - Full-text search
 * - Date range filtering
 * - Tag filtering
 * - Thread filtering
 * - Sort options
 * - Search history
 * - Export results
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Calendar,
  Tag,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  History,
  Download
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface SearchFilter {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  threads?: string[];
  sortBy?: 'relevance' | 'date' | 'length';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'reflection' | 'thread' | 'post';
  title?: string;
  content: string;
  excerpt: string;
  date: Date;
  tags?: string[];
  threadId?: string;
  relevance?: number;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter) => Promise<SearchResult[]>;
  availableTags?: string[];
  availableThreads?: Array<{ id: string; name: string }>;
  onResultClick?: (result: SearchResult) => void;
}

export function AdvancedSearch({
  onSearch,
  availableTags = [],
  availableThreads = [],
  onResultClick,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem('mirror-search-history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      const searchResults = await onSearch(query, filters);
      setResults(searchResults);
      
      // Add to history
      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);
      localStorage.setItem('mirror-search-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.threads && filters.threads.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Card>
        <div className="flex items-center gap-3">
          <Search size={20} className="text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search reflections, threads, posts..."
            className="flex-1 bg-transparent border-none outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
            }`}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="text-xs">{activeFilterCount}</span>
            )}
          </button>
          <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear All
                  </Button>
                </div>

                {/* Date Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar size={16} className="text-[var(--color-accent-blue)]" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: e.target.value ? new Date(e.target.value) : undefined,
                        },
                      })}
                      className="px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm"
                    />
                    <input
                      type="date"
                      value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: e.target.value ? new Date(e.target.value) : undefined,
                        },
                      })}
                      className="px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-sm"
                    />
                  </div>
                </div>

                {/* Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Tag size={16} className="text-[var(--color-accent-blue)]" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            const currentTags = filters.tags || [];
                            setFilters({
                              ...filters,
                              tags: currentTags.includes(tag)
                                ? currentTags.filter(t => t !== tag)
                                : [...currentTags, tag],
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.tags?.includes(tag)
                              ? 'bg-[var(--color-accent-blue)] text-white'
                              : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Threads */}
                {availableThreads.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <TrendingUp size={16} className="text-[var(--color-accent-blue)]" />
                      Threads
                    </label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {availableThreads.map((thread) => (
                        <label
                          key={thread.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.threads?.includes(thread.id)}
                            onChange={(e) => {
                              const currentThreads = filters.threads || [];
                              setFilters({
                                ...filters,
                                threads: e.target.checked
                                  ? [...currentThreads, thread.id]
                                  : currentThreads.filter(t => t !== thread.id),
                              });
                            }}
                            className="w-4 h-4 rounded border-[var(--color-border-subtle)]"
                          />
                          <span className="text-sm">{thread.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <div className="flex gap-2">
                    {(['relevance', 'date', 'length'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setFilters({ ...filters, sortBy: option })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.sortBy === option
                            ? 'bg-[var(--color-accent-blue)] text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search History */}
      {!query && searchHistory.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium">Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(term);
                    handleSearch();
                  }}
                  className="px-3 py-1 rounded-full bg-[var(--color-surface-hover)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Export results
                const data = JSON.stringify(results, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `search-results-${new Date().toISOString()}.json`;
                a.click();
              }}
            >
              <Download size={16} />
              Export
            </Button>
          </div>

          <div className="space-y-2">
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                query={query}
                onClick={() => onResultClick?.(result)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query && !isSearching && results.length === 0 && (
        <Card className="text-center py-8">
          <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nothing appears for "{query}"
          </p>
        </Card>
      )}
    </div>
  );
}

// Search Result Card

interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onClick: () => void;
}

function SearchResultCard({ result, query, onClick }: SearchResultCardProps) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[var(--color-accent-yellow)]/30 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Card 
      className="cursor-pointer hover:border-[var(--color-accent-blue)] transition-colors"
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {result.title && (
              <h4 className="font-medium mb-1">
                {highlightText(result.title, query)}
              </h4>
            )}
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {highlightText(result.excerpt, query)}
            </p>
          </div>
          <Badge variant={result.type === 'reflection' ? 'default' : 'success'}>
            {result.type}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{new Date(result.date).toLocaleDateString()}</span>
          {result.tags && result.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag size={12} />
              <span>{result.tags.length} tag{result.tags.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {result.relevance && (
            <span>{Math.round(result.relevance * 100)}% match</span>
          )}
        </div>

        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-muted)]"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                +{result.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export type { SearchFilter, SearchResult, AdvancedSearchProps };
