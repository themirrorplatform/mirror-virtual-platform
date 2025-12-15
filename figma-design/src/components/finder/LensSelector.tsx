/**
 * Lens Selector - Lens activation UI
 * 
 * Features:
 * - Grid/list of available lenses
 * - Visual tags (politics, relationships, identity, etc.)
 * - Usage frequency indicator
 * - Quick-add to session
 * - Active lens management
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Plus, 
  Check,
  X,
  Search,
  TrendingUp,
  Info,
  Filter
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from './Badge';

export interface Lens {
  id: string;
  name: string;
  description: string;
  category: 'politics' | 'relationships' | 'identity' | 'work' | 'philosophy' | 'emotion' | 'custom';
  tags: string[];
  usageCount: number;
  color: string;
  isActive: boolean;
}

interface LensSelectorProps {
  lenses: Lens[];
  activeLenses: string[];
  onToggleLens: (lensId: string) => void;
  onViewLensDetails?: (lensId: string) => void;
  compact?: boolean;
  maxActive?: number;
}

const CATEGORY_CONFIG = {
  politics: { label: 'Politics', color: '#EF4444', icon: '⚖️' },
  relationships: { label: 'Relationships', color: '#EC4899', icon: '💗' },
  identity: { label: 'Identity', color: '#8B5CF6', icon: '🪞' },
  work: { label: 'Work', color: '#F59E0B', icon: '💼' },
  philosophy: { label: 'Philosophy', color: '#3B82F6', icon: '🤔' },
  emotion: { label: 'Emotion', color: '#10B981', icon: '🎭' },
  custom: { label: 'Custom', color: '#64748B', icon: '⚙️' },
};

export function LensSelector({
  lenses,
  activeLenses,
  onToggleLens,
  onViewLensDetails,
  compact = false,
  maxActive = 5,
}: LensSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');

  const filteredLenses = lenses
    .filter((lens) => {
      const matchesSearch = lens.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lens.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || lens.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      return a.name.localeCompare(b.name);
    });

  const activeCount = activeLenses.length;
  const canAddMore = activeCount < maxActive;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye size={20} className="text-[var(--color-accent-blue)]" />
            <h3>Lenses</h3>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {activeCount} of {maxActive} active
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(sortBy === 'name' ? 'usage' : 'name')}
              className="flex items-center gap-1"
            >
              <Filter size={14} />
              <span className="text-xs">
                {sortBy === 'usage' ? 'Most Used' : 'A-Z'}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {!compact && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lenses..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm"
          />
        </div>
      )}

      {/* Category Filter */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              !selectedCategory
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                selectedCategory === key
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Active Lenses */}
      {activeCount > 0 && (
        <Card variant="emphasis">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-[var(--color-accent-green)]" />
              <span className="text-sm font-medium">Active Lenses</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lenses
                .filter((lens) => activeLenses.includes(lens.id))
                .map((lens) => (
                  <ActiveLensBadge
                    key={lens.id}
                    lens={lens}
                    onRemove={() => onToggleLens(lens.id)}
                  />
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Lens Grid */}
      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
        <AnimatePresence mode="popLayout">
          {filteredLenses.map((lens) => (
            <LensCard
              key={lens.id}
              lens={lens}
              isActive={activeLenses.includes(lens.id)}
              canActivate={canAddMore || activeLenses.includes(lens.id)}
              onToggle={() => onToggleLens(lens.id)}
              onViewDetails={() => onViewLensDetails?.(lens.id)}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Max Active Warning */}
      {activeCount >= maxActive && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--color-border-warning)] mt-0.5" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              You've reached the maximum of {maxActive} active lenses. 
              Remove a lens to activate another.
            </p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredLenses.length === 0 && (
        <Card variant="emphasis">
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              No lenses found
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Try adjusting your search or category filter
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
  canActivate: boolean;
  onToggle: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

function LensCard({ 
  lens, 
  isActive, 
  canActivate, 
  onToggle, 
  onViewDetails,
  compact 
}: LensCardProps) {
  const categoryConfig = CATEGORY_CONFIG[lens.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card 
        className={`transition-all ${
          isActive ? 'border-2' : 'border'
        }`}
        style={{
          borderColor: isActive ? lens.color : 'var(--color-border-subtle)',
          backgroundColor: isActive ? `${lens.color}08` : 'var(--color-surface-card)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-lg"
                role="img" 
                aria-label={categoryConfig.label}
              >
                {categoryConfig.icon}
              </span>
              <h4 className="font-medium">{lens.name}</h4>
            </div>

            {!compact && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                {lens.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" size="sm">
                {categoryConfig.label}
              </Badge>
              {lens.usageCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <TrendingUp size={12} />
                  <span>{lens.usageCount}x used</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={onToggle}
              disabled={!canActivate && !isActive}
              className="flex items-center gap-1"
            >
              {isActive ? (
                <>
                  <Check size={14} />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Add</span>
                </>
              )}
            </Button>

            {onViewDetails && !compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetails}
              >
                <Info size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface ActiveLensBadgeProps {
  lens: Lens;
  onRemove: () => void;
}

function ActiveLensBadge({ lens, onRemove }: ActiveLensBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
      style={{
        backgroundColor: `${lens.color}20`,
        color: lens.color,
      }}
    >
      <span>{lens.name}</span>
      <button
        onClick={onRemove}
        className="hover:scale-110 transition-transform"
        aria-label={`Remove ${lens.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export type { Lens };
