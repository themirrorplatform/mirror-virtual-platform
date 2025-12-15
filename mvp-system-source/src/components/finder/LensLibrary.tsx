/**
 * Lens Library - Browse and manage available lenses
 * 
 * Features:
 * - Grid/list view of all lenses
 * - Search and filter
 * - Category grouping
 * - Lens preview with description
 * - Activate/deactivate lenses
 * - Custom lens creation
 * - Usage statistics
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Glasses,
  Search,
  Grid,
  List,
  Plus,
  Filter,
  X,
  TrendingUp,
  Eye,
  Check
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from './Badge';

interface Lens {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive?: boolean;
  isCustom?: boolean;
  usageCount?: number;
  examples?: string[];
}

interface LensLibraryProps {
  lenses: Lens[];
  activeLensIds?: string[];
  onToggleLens: (lensId: string) => void;
  onCreateCustomLens?: () => void;
  allowMultiple?: boolean;
}

type ViewMode = 'grid' | 'list';

const LENS_CATEGORIES = [
  { id: 'all', label: 'All Lenses' },
  { id: 'emotion', label: 'Emotional' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'identity', label: 'Identity' },
  { id: 'social', label: 'Social' },
  { id: 'custom', label: 'Custom' },
];

export function LensLibrary({
  lenses,
  activeLensIds = [],
  onToggleLens,
  onCreateCustomLens,
  allowMultiple = true,
}: LensLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('name');

  const filteredLenses = lenses
    .filter((lens) => {
      const matchesSearch = 
        lens.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lens.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        selectedCategory === 'all' || lens.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') {
        return (b.usageCount || 0) - (a.usageCount || 0);
      }
      return a.name.localeCompare(b.name);
    });

  const groupedByCategory = filteredLenses.reduce((acc, lens) => {
    if (!acc[lens.category]) acc[lens.category] = [];
    acc[lens.category].push(lens);
    return acc;
  }, {} as Record<string, Lens[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Glasses size={24} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3 className="mb-1">Lens Library</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {lenses.length} lenses • {activeLensIds.length} active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface-hover)]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-[var(--color-surface-card)] shadow-sm'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-[var(--color-surface-card)] shadow-sm'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Create Custom Lens */}
              {onCreateCustomLens && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCreateCustomLens}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Lens
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lenses..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {LENS_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'usage')}
                className="text-sm px-2 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
              >
                <option value="name">Name</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Lenses */}
      {filteredLenses.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLenses.map((lens) => (
              <LensGridCard
                key={lens.id}
                lens={lens}
                isActive={activeLensIds.includes(lens.id)}
                onToggle={() => onToggleLens(lens.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLenses.map((lens) => (
              <LensListItem
                key={lens.id}
                lens={lens}
                isActive={activeLensIds.includes(lens.id)}
                onToggle={() => onToggleLens(lens.id)}
              />
            ))}
          </div>
        )
      ) : (
        <Card variant="emphasis">
          <div className="text-center py-12">
            <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No lenses found
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

interface LensCardProps {
  lens: Lens;
  isActive: boolean;
  onToggle: () => void;
}

function LensGridCard({ lens, isActive, onToggle }: LensCardProps) {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isActive ? 'border-2 border-[var(--color-accent-blue)]' : ''
        }`}
        onClick={onToggle}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{lens.name}</h4>
                {lens.isCustom && (
                  <Badge variant="secondary" size="sm">Custom</Badge>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {lens.description}
              </p>
            </div>

            {isActive && (
              <div className="w-6 h-6 rounded-full bg-[var(--color-accent-blue)] flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Stats */}
          {lens.usageCount !== undefined && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Eye size={12} />
              <span>Used {lens.usageCount} times</span>
            </div>
          )}

          {/* Examples Toggle */}
          {lens.examples && lens.examples.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExamples(!showExamples);
              }}
              className="text-xs text-[var(--color-accent-blue)] hover:underline"
            >
              {showExamples ? 'Hide' : 'Show'} examples
            </button>
          )}

          {/* Examples */}
          {showExamples && lens.examples && (
            <div className="p-2 rounded-lg bg-[var(--color-surface-hover)] space-y-1">
              {lens.examples.map((example, index) => (
                <p key={index} className="text-xs text-[var(--color-text-muted)] italic">
                  "{example}"
                </p>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function LensListItem({ lens, isActive, onToggle }: LensCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-l-4 border-[var(--color-accent-blue)]' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-medium">{lens.name}</h4>
            {lens.isCustom && (
              <Badge variant="secondary" size="sm">Custom</Badge>
            )}
            {lens.usageCount !== undefined && (
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Eye size={12} />
                <span>{lens.usageCount}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {lens.description}
          </p>
        </div>

        {isActive && (
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)] flex items-center justify-center ml-4">
            <Check size={16} className="text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}

export type { Lens };
