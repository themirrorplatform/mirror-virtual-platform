/**
 * Search Interface - Find reflections and content
 * 
 * Features:
 * - Full-text search
 * - Filter by date range, type, lens
 * - Sort by relevance, date, frequency
 * - Search suggestions
 * - Recent searches
 * - Search within results
 * - Export search results
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search,
  X,
  Filter,
  Calendar,
  Tag,
  Clock,
  TrendingUp,
  Download,
  ChevronDown
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface SearchResult {
  id: string;
  type: 'reflection' | 'mirrorback' | 'thread' | 'response';
  title?: string;
  content: string;
  date: Date;
  relevanceScore: number;
  matchedTerms: string[];
  lensTags?: string[];
  threadTitle?: string;
}

interface SearchFilters {
  types: string[];
  dateRange: 'all' | '7d' | '30d' | '90d' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  lenses: string[];
  minRelevance: number;
}

interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => SearchResult[];
  onSelectResult: (resultId: string) => void;
  onExport?: (results: SearchResult[]) => void;
  availableLenses?: string[];
}

type SortBy = 'relevance' | 'date' | 'frequency';

const DEFAULT_FILTERS: SearchFilters = {
  types: [],
  dateRange: 'all',
  lenses: [],
  minRelevance: 0,
};

export function SearchInterface({
  onSearch,
  onSelectResult,
  onExport,
  availableLenses = [],
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform search
  const handleSearch = () => {
    if (!query.trim()) return;

    setIsSearching(true);
    const searchResults = onSearch(query, filters);
    setResults(sortResults(searchResults, sortBy));
    setIsSearching(false);

    // Save to recent searches
    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)]);
    }
  };

  // Auto-search on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Sort results when sort option changes
  useEffect(() => {
    if (results.length > 0) {
      setResults(sortResults([...results], sortBy));
    }
  }, [sortBy]);

  const sortResults = (resultsToSort: SearchResult[], sortMethod: SortBy): SearchResult[] => {
    switch (sortMethod) {
      case 'relevance':
        return resultsToSort.sort((a, b) => b.relevanceScore - a.relevanceScore);
      case 'date':
        return resultsToSort.sort((a, b) => b.date.getTime() - a.date.getTime());
      case 'frequency':
        return resultsToSort.sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
      default:
        return resultsToSort;
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.lenses.length > 0 ||
    filters.minRelevance > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <div className="space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your reflections..."
              className="w-full pl-12 pr-24 py-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-base"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={16} />
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSearch}
                disabled={!query.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)]">Recent:</span>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-blue)]/10"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-[var(--color-accent-blue)] hover:underline"
            >
              <Filter size={14} />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="primary" size="sm">
                  {[
                    filters.types.length,
                    filters.lenses.length,
                    filters.dateRange !== 'all' ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {results.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="text-xs px-2 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="frequency">Frequency</option>
                </select>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]"
              >
                {/* Type Filter */}
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Content Type:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {['reflection', 'mirrorback', 'thread', 'response'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilters({
                            ...filters,
                            types: filters.types.includes(type)
                              ? filters.types.filter((t) => t !== type)
                              : [...filters.types, type],
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          filters.types.includes(type)
                            ? 'bg-[var(--color-accent-blue)] text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Date Range:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(['all', '7d', '30d', '90d'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setFilters({ ...filters, dateRange: range })}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          filters.dateRange === range
                            ? 'bg-[var(--color-accent-blue)] text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {range === 'all' ? 'All Time' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lens Filter */}
                {availableLenses.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                      Lenses:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {availableLenses.map((lens) => (
                        <button
                          key={lens}
                          onClick={() => {
                            setFilters({
                              ...filters,
                              lenses: filters.lenses.includes(lens)
                                ? filters.lenses.filter((l) => l !== lens)
                                : [...filters.lenses, lens],
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            filters.lenses.includes(lens)
                              ? 'bg-[var(--color-accent-blue)] text-white'
                              : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {lens}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear All Filters
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Results */}
      {isSearching ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent-blue)] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-[var(--color-text-muted)]">Searching...</p>
          </div>
        </Card>
      ) : results.length > 0 ? (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport(results)}
                className="flex items-center gap-2"
              >
                <Download size={14} />
                Export
              </Button>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                query={query}
                onClick={() => onSelectResult(result.id)}
              />
            ))}
          </div>
        </>
      ) : query ? (
        <Card variant="emphasis">
          <div className="text-center py-12">
            <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No results found for "{query}"
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Try different keywords or adjust your filters
            </p>
          </div>
        </Card>
      ) : null}
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
  const highlightText = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-[var(--color-accent-blue)]/20 text-[var(--color-text-primary)]">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const typeConfig = {
    reflection: { color: '#3B82F6', label: 'Reflection' },
    mirrorback: { color: '#8B5CF6', label: 'Mirrorback' },
    thread: { color: '#10B981', label: 'Thread' },
    response: { color: '#F59E0B', label: 'Response' },
  }[result.type];

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${typeConfig.color}20`,
                  color: typeConfig.color,
                }}
              >
                {typeConfig.label}
              </Badge>
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDate(result.date)}
              </span>
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  {Math.round(result.relevanceScore * 100)}% match
                </span>
              </div>
            </div>
            {result.title && (
              <h4 className="font-medium mb-1">{highlightText(result.title, query)}</h4>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">
          {highlightText(result.content, query)}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-2 flex-wrap">
          {result.threadTitle && (
            <Badge variant="secondary" size="sm">
              Thread: {result.threadTitle}
            </Badge>
          )}
          {result.lensTags?.map((lens) => (
            <Badge key={lens} variant="secondary" size="sm">
              <Tag size={10} className="mr-1" />
              {lens}
            </Badge>
          ))}
          {result.matchedTerms.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {result.matchedTerms.length} matched term{result.matchedTerms.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// Utility Functions

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export type { SearchResult, SearchFilters };
