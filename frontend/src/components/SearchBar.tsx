import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  User,
  MessageSquare,
  Hash,
  Filter,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * SearchBar - Universal Search Interface
 * 
 * Features:
 * - Search reflections by content
 * - Search users by username/display name
 * - Search by hashtags
 * - Recent searches history
 * - Trending searches
 * - Search suggestions/autocomplete
 * - Filter by type (all/reflections/users/tags)
 * - Quick keyboard navigation (⌘K/Ctrl+K)
 * - Search analytics (optional)
 * 
 * Constitutional Note: Search is transparent and user-controlled.
 * No personalized algorithmic ranking - results sorted by relevance and recency.
 */

type SearchType = 'all' | 'reflections' | 'users' | 'tags';

interface SearchResult {
  id: string;
  type: 'reflection' | 'user' | 'tag';
  title: string;
  subtitle?: string;
  preview?: string;
  metadata?: {
    username?: string;
    avatar?: string;
    timestamp?: string;
    likesCount?: number;
    repliesCount?: number;
    usageCount?: number;
  };
}

interface SearchBarProps {
  onSearch?: (query: string, type: SearchType) => Promise<SearchResult[]>;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showTrending?: boolean;
  showRecent?: boolean;
  variant?: 'full' | 'compact';
  autoFocus?: boolean;
}

const recentSearchesKey = 'mirror_recent_searches';
const maxRecentSearches = 10;

// Mock trending searches
const mockTrendingSearches = [
  { query: 'identity', count: 234 },
  { query: 'authenticity', count: 189 },
  { query: 'boundaries', count: 156 },
  { query: 'vulnerability', count: 142 },
  { query: 'growth', count: 128 }
];

export function SearchBar({
  onSearch,
  onSelect,
  placeholder = 'Search reflections, people, or tags...',
  showTrending = true,
  showRecent = true,
  variant = 'full',
  autoFocus = false
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(recentSearchesKey);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  }, []);

  // Keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);

      try {
        if (onSearch) {
          const searchResults = await onSearch(query, type);
          setResults(searchResults);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, type, onSearch]);

  // Save to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, maxRecentSearches);
      setRecentSearches(updated);
      localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save recent search:', err);
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(recentSearchesKey);
  };

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      if (results.length > 0 && selectedIndex >= 0) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    saveRecentSearch(query);
    onSelect?.(result);
    setQuery('');
    setShowResults(false);
  };

  // Handle recent/trending search click
  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Result icon
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'reflection':
        return MessageSquare;
      case 'user':
        return User;
      case 'tag':
        return Hash;
    }
  };

  // Compact variant for header
  if (variant === 'compact') {
    return (
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10 pr-10"
            autoFocus={autoFocus}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Results dropdown */}
        {showResults && (query || showRecent || showTrending) && (
          <div
            ref={resultsRef}
            className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
          >
            {searching && (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="py-2">
                {results.map((result, idx) => {
                  const Icon = getResultIcon(result.type);
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                        idx === selectedIndex ? 'bg-purple-50' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!searching && !query && showRecent && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">Recent</p>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickSearch(search)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant for dedicated search page
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search input */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-12 pr-12 py-6 text-lg"
            autoFocus={autoFocus}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>

        {/* Type filters */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex gap-2">
            {(['all', 'reflections', 'users', 'tags'] as const).map(t => (
              <Button
                key={t}
                onClick={() => setType(t)}
                variant={type === t ? 'default' : 'outline'}
                size="sm"
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {searching && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
          <p className="text-sm text-gray-500 mt-3">Searching...</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
          </p>
          {results.map(result => {
            const Icon = getResultIcon(result.type);
            return (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{result.title}</p>
                      <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                    )}
                    {result.preview && (
                      <p className="text-sm text-gray-500 line-clamp-2">{result.preview}</p>
                    )}
                    {result.metadata && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {result.metadata.username && <span>by @{result.metadata.username}</span>}
                        {result.metadata.timestamp && <span>{new Date(result.metadata.timestamp).toLocaleDateString()}</span>}
                        {result.metadata.likesCount !== undefined && <span>{result.metadata.likesCount} likes</span>}
                        {result.metadata.repliesCount !== undefined && <span>{result.metadata.repliesCount} replies</span>}
                        {result.metadata.usageCount !== undefined && <span>{result.metadata.usageCount} uses</span>}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Trending searches */}
      {!query && showTrending && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Trending Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {mockTrendingSearches.map((trending, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSearch(trending.query)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm flex items-center gap-2"
              >
                <span>{trending.query}</span>
                <Badge className="bg-white text-gray-600 border-0 text-xs">
                  {trending.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches */}
      {!query && showRecent && recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Recent Searches</h3>
            </div>
            <button
              onClick={clearRecentSearches}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickSearch(search)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">{search}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Constitutional note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
        <strong>Transparent Search:</strong> Results are sorted by relevance and recency only.
        No personalized algorithmic ranking or tracking. Your searches are private and not used for profiling.
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * // Compact variant in header
 * <SearchBar
 *   variant="compact"
 *   onSearch={async (query, type) => {
 *     const results = await api.search(query, type);
 *     return results;
 *   }}
 *   onSelect={(result) => {
 *     if (result.type === 'reflection') {
 *       router.push(`/reflections/${result.id}`);
 *     } else if (result.type === 'user') {
 *       router.push(`/users/${result.id}`);
 *     } else {
 *       router.push(`/tags/${result.title}`);
 *     }
 *   }}
 * />
 * 
 * // Full variant on search page
 * <SearchBar
 *   variant="full"
 *   autoFocus
 *   showTrending
 *   showRecent
 *   onSearch={async (query, type) => {
 *     return await api.search(query, type);
 *   }}
 *   onSelect={(result) => console.log('Selected:', result)}
 * />
 */

