/**
 * Commons Search - Discover public content in the Mirror network
 * 
 * Features:
 * - Text search across doors
 * - Filter by card type
 * - Filter by lens tags
 * - Filter by interaction style
 * - Sort options (recent, popular, relevant)
 * - Result cards with preview
 * - "Why shown?" transparency
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  X,
  TrendingUp,
  Clock,
  Star,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoorCard } from '../finder/DoorCard';
import type { CardType, InteractionStyle } from '../finder/DoorCard';

interface SearchFilters {
  query: string;
  cardTypes: CardType[];
  lensTags: string[];
  interactionStyles: InteractionStyle[];
  sortBy: 'recent' | 'popular' | 'relevant';
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  cardType: CardType;
  interactionStyle: InteractionStyle;
  lensTags: string[];
  attestationCount: number;
  createdAt: Date;
  creator: string;
  relevanceScore?: number;
  matchReason?: string;
}

interface CommonsSearchProps {
  results: SearchResult[];
  availableLensTags: string[];
  onSearch: (filters: SearchFilters) => void;
  onSelectDoor: (doorId: string) => void;
  onClearSearch?: () => void;
  isLoading?: boolean;
}

const CARD_TYPE_OPTIONS: CardType[] = ['person', 'room', 'artifact', 'practice'];
const INTERACTION_STYLE_OPTIONS: InteractionStyle[] = ['witness', 'dialogue', 'debate', 'structured'];

const SORT_OPTIONS = [
  { id: 'recent' as const, label: 'Recent', icon: <Clock size={16} /> },
  { id: 'popular' as const, label: 'Popular', icon: <TrendingUp size={16} /> },
  { id: 'relevant' as const, label: 'Relevant', icon: <Star size={16} /> },
];

export function CommonsSearch({
  results,
  availableLensTags,
  onSearch,
  onSelectDoor,
  onClearSearch,
  isLoading = false,
}: CommonsSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    cardTypes: [],
    lensTags: [],
    interactionStyles: [],
    sortBy: 'relevant',
  });

  const hasActiveFilters = 
    filters.cardTypes.length > 0 ||
    filters.lensTags.length > 0 ||
    filters.interactionStyles.length > 0;

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      cardTypes: [],
      lensTags: [],
      interactionStyles: [],
      sortBy: 'relevant',
    });
    onClearSearch?.();
  };

  const toggleCardType = (type: CardType) => {
    setFilters({
      ...filters,
      cardTypes: filters.cardTypes.includes(type)
        ? filters.cardTypes.filter(t => t !== type)
        : [...filters.cardTypes, type],
    });
  };

  const toggleLensTag = (tag: string) => {
    setFilters({
      ...filters,
      lensTags: filters.lensTags.includes(tag)
        ? filters.lensTags.filter(t => t !== tag)
        : [...filters.lensTags, tag],
    });
  };

  const toggleInteractionStyle = (style: InteractionStyle) => {
    setFilters({
      ...filters,
      interactionStyles: filters.interactionStyles.includes(style)
        ? filters.interactionStyles.filter(s => s !== style)
        : [...filters.interactionStyles, style],
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={filters.query}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFilters({ ...filters, query: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search the Commons..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && (
                <Badge variant="primary" size="sm">
                  {filters.cardTypes.length + filters.lensTags.length + filters.interactionStyles.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleSearch}
              className="flex items-center gap-2"
            >
              <Search size={16} />
              Search
            </Button>
          </div>

          {/* Quick Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">Sort by:</span>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilters({ ...filters, sortBy: option.id })}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                  filters.sortBy === option.id
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Card Types */}
              <div>
                <label className="block text-sm font-medium mb-2">Card Types</label>
                <div className="flex flex-wrap gap-2">
                  {CARD_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleCardType(type)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        filters.cardTypes.includes(type)
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Lens Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableLensTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleLensTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        filters.lensTags.includes(tag)
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interaction Styles */}
              <div>
                <label className="block text-sm font-medium mb-2">Interaction Styles</label>
                <div className="flex flex-wrap gap-2">
                  {INTERACTION_STYLE_OPTIONS.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleInteractionStyle(style)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        filters.interactionStyles.includes(style)
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-blue)] mx-auto mb-4" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Searching the Commons...
              </p>
            </div>
          </Card>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                {results.length} door{results.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onSelect={() => onSelectDoor(result.id)}
                />
              ))}
            </div>
          </>
        ) : filters.query || hasActiveFilters ? (
          <Card>
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                No doors found
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Try adjusting your search or filters
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border-2 border-[var(--color-accent-blue)]">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-[var(--color-accent-blue)] mt-1" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="mb-2">
                  <strong>Search the Mirror Commons</strong> to discover doors published 
                  by other users.
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Use filters to narrow by card type, lens tags, or interaction style. 
                  Results are sorted by relevance to your current posture and active lenses.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Transparency Notice */}
      {results.length > 0 && (
        <Card>
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="text-xs text-[var(--color-text-secondary)]">
              <p className="mb-2">
                <strong>Search is constitutional.</strong> Results are not manipulated by engagement 
                or popularity metrics.
              </p>
              <p className="text-[var(--color-text-muted)]">
                When "Relevant" is selected, results are ordered by alignment with your declared 
                posture and active lenses. You can always sort by Recent or Popular instead.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onSelect: () => void;
}

function SearchResultCard({ result, onSelect }: SearchResultCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer transition-shadow hover:shadow-lg h-full"
        onClick={onSelect}
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{result.title}</h4>
              <Badge variant="secondary" size="sm">
                {result.cardType}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {result.description}
            </p>
          </div>

          {result.lensTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.lensTags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {result.lensTags.length > 3 && (
                <Badge variant="secondary" size="sm">
                  +{result.lensTags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {result.matchReason && (
            <div className="p-2 rounded-lg bg-[var(--color-accent-blue)]/10">
              <p className="text-xs text-[var(--color-text-muted)]">
                <strong className="text-[var(--color-accent-blue)]">Why shown:</strong>{' '}
                {result.matchReason}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
            <span>By {result.creator}</span>
            <div className="flex items-center gap-3">
              <span>{result.attestationCount} attestations</span>
              <span>{formatDate(result.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
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

export type { SearchFilters, SearchResult };



