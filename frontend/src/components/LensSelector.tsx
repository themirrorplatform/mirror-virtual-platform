import React, { useState } from 'react';
import { Eye, Check, Plus, TrendingUp, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * LensSelector - Lens Management Component
 * 
 * Features:
 * - Grid/list of available lenses
 * - Visual tags (politics, relationships, identity, etc.)
 * - Usage frequency indicator
 * - Quick-add to session
 * - Search/filter lenses
 * 
 * Constitutional Note: Lenses are user-controlled interpretive frameworks.
 * They shape what Finder surfaces but never restrict access to raw data.
 */

interface Lens {
  id: string;
  name: string;
  description: string;
  tags: string[];
  usageCount: number;
  isActive: boolean;
}

interface LensSelectorProps {
  availableLenses: Lens[];
  activeLenses: string[]; // Array of lens IDs currently in session
  onToggleLens: (lensId: string) => void;
  onCreateCustomLens?: () => void;
  maxActiveLenses?: number; // Default: 5
}

export function LensSelector({
  availableLenses,
  activeLenses,
  onToggleLens,
  onCreateCustomLens,
  maxActiveLenses = 5
}: LensSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get all unique tags
  const allTags = Array.from(
    new Set(availableLenses.flatMap(lens => lens.tags))
  ).sort();

  // Filter lenses by search and tag
  const filteredLenses = availableLenses.filter(lens => {
    const matchesSearch = lens.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lens.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || lens.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  // Sort by usage frequency
  const sortedLenses = [...filteredLenses].sort((a, b) => b.usageCount - a.usageCount);

  // Check if at capacity
  const isAtCapacity = activeLenses.length >= maxActiveLenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-600" />
            Select Lenses
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose up to {maxActiveLenses} lenses to shape your Finder experience
          </p>
        </div>
        
        {onCreateCustomLens && (
          <Button
            variant="outline"
            onClick={onCreateCustomLens}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Custom Lens
          </Button>
        )}
      </div>

      {/* Active Lenses Counter */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-purple-900">
              {activeLenses.length} / {maxActiveLenses} lenses active
            </span>
            {isAtCapacity && (
              <p className="text-xs text-purple-600 mt-1">
                At capacity. Remove a lens to add another.
              </p>
            )}
          </div>
          <Badge variant="outline" className="bg-white">
            {activeLenses.length === 0 ? 'None' : activeLenses.length === 1 ? '1 lens' : `${activeLenses.length} lenses`}
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <Input
          placeholder="Search lenses..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Tag Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filter by tag:</span>
          <Button
            variant={filterTag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTag(null)}
          >
            All
          </Button>
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={filterTag === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTag(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          Grid
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          List
        </Button>
      </div>

      {/* Lenses Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedLenses.map(lens => (
            <LensCard
              key={lens.id}
              lens={lens}
              isActive={activeLenses.includes(lens.id)}
              isAtCapacity={isAtCapacity}
              onToggle={() => onToggleLens(lens.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedLenses.map(lens => (
            <LensListItem
              key={lens.id}
              lens={lens}
              isActive={activeLenses.includes(lens.id)}
              isAtCapacity={isAtCapacity}
              onToggle={() => onToggleLens(lens.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredLenses.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No lenses found matching your filters</p>
        </Card>
      )}

      {/* Constitutional Note */}
      <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
        <strong>Lenses are interpretive, not restrictive:</strong> They shape what 
        Finder suggests but never hide information. You can always access your full 
        identity graph regardless of active lenses.
      </div>
    </div>
  );
}

// Lens Card Component (Grid View)
interface LensCardProps {
  lens: Lens;
  isActive: boolean;
  isAtCapacity: boolean;
  onToggle: () => void;
}

function LensCard({ lens, isActive, isAtCapacity, onToggle }: LensCardProps) {
  const canToggle = isActive || !isAtCapacity;

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-lg ${
      isActive ? 'border-2 border-purple-500 bg-purple-50' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{lens.name}</span>
          {isActive && <Check className="h-5 w-5 text-purple-600" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{lens.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {lens.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Usage Frequency */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <TrendingUp className="h-3 w-3" />
          <span>Used {lens.usageCount} times</span>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={onToggle}
          disabled={!canToggle}
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className="w-full"
        >
          {isActive ? 'Remove' : 'Add to Session'}
        </Button>

        {!canToggle && (
          <p className="text-xs text-amber-600 text-center">
            Remove a lens first
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Lens List Item Component (List View)
function LensListItem({ lens, isActive, isAtCapacity, onToggle }: LensCardProps) {
  const canToggle = isActive || !isAtCapacity;

  return (
    <Card className={`transition-all ${
      isActive ? 'border-l-4 border-l-purple-500 bg-purple-50' : 'border-l-4 border-l-transparent'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Lens Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-medium">{lens.name}</h3>
              {isActive && <Check className="h-4 w-4 text-purple-600" />}
              <div className="flex gap-1">
                {lens.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">{lens.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>Used {lens.usageCount} times</span>
            </div>
          </div>

          {/* Toggle Button */}
          <Button
            onClick={onToggle}
            disabled={!canToggle}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
          >
            {isActive ? 'Remove' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <LensSelector
 *   availableLenses={[
 *     {
 *       id: 'lens_politics',
 *       name: 'Political Lens',
 *       description: 'Surfaces tensions related to power, justice, and collective action',
 *       tags: ['politics', 'society', 'ethics'],
 *       usageCount: 42,
 *       isActive: false
 *     },
 *     {
 *       id: 'lens_relationships',
 *       name: 'Relationships Lens',
 *       description: 'Highlights interpersonal dynamics, boundaries, and connection patterns',
 *       tags: ['relationships', 'emotions', 'communication'],
 *       usageCount: 89,
 *       isActive: true
 *     }
 *   ]}
 *   activeLenses={['lens_relationships']}
 *   onToggleLens={(lensId) => console.log('Toggle lens:', lensId)}
 *   onCreateCustomLens={() => console.log('Create custom lens')}
 *   maxActiveLenses={5}
 * />
 */

