import React, { useState } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Globe,
  User,
  Tag,
  FileText,
  ExternalLink,
  CheckCircle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import type { LicenseType, Visibility } from './CommonsPublisher';

/**
 * CommonsSearch - Search Public Reflection Commons
 * 
 * Features:
 * - Full-text search across public reflections
 * - Filter by lens tags, license type, instance origin
 * - Sort by attestations, date, relevance
 * - Preview before viewing full content
 * - View author profiles
 * - Respect content warnings
 * 
 * Constitutional Note: The commons is a gift economy—
 * people share their reflections to help others grow.
 */

export type SortOption = 'relevance' | 'attestations' | 'newest' | 'oldest';

interface Author {
  id: string;
  displayName: string;
  instanceUrl: string;
}

interface CommonsReflection {
  id: string;
  content: string;
  preview: string; // First ~200 chars
  author: Author;
  visibility: Visibility;
  license: LicenseType;
  lensTags: string[];
  contentWarnings: string[];
  attestationCount: number;
  publishedAt: string;
}

interface SearchFilters {
  tags: string[];
  licenses: LicenseType[];
  instances: string[];
  hasContentWarnings?: boolean;
}

interface CommonsSearchProps {
  onSearch: (query: string, filters: SearchFilters, sort: SortOption) => Promise<CommonsReflection[]>;
  onViewReflection: (reflectionId: string) => void;
  onViewAuthor: (authorId: string) => void;
  onAttest?: (reflectionId: string) => void;
  availableTags?: string[];
  availableInstances?: string[];
}

// License labels (reuse from CommonsPublisher)
const LICENSE_LABELS: Record<LicenseType, string> = {
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
  cc0: 'CC0',
  all_rights_reserved: 'All Rights Reserved'
};

export function CommonsSearch({
  onSearch,
  onViewReflection,
  onViewAuthor,
  onAttest,
  availableTags = [],
  availableInstances = []
}: CommonsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommonsReflection[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseType[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [hideContentWarnings, setHideContentWarnings] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {
        tags: selectedTags,
        licenses: selectedLicenses,
        instances: selectedInstances,
        hasContentWarnings: hideContentWarnings ? false : undefined
      };
      const searchResults = await onSearch(query, filters, sortBy);
      setResults(searchResults);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleLicense = (license: LicenseType) => {
    setSelectedLicenses((prev) =>
      prev.includes(license) ? prev.filter((l) => l !== license) : [...prev, license]
    );
  };

  const toggleInstance = (instance: string) => {
    setSelectedInstances((prev) =>
      prev.includes(instance) ? prev.filter((i) => i !== instance) : [...prev, instance]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLicenses([]);
    setSelectedInstances([]);
    setHideContentWarnings(false);
  };

  const activeFilterCount =
    selectedTags.length +
    selectedLicenses.length +
    selectedInstances.length +
    (hideContentWarnings ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-7 w-7 text-blue-600" />
          Commons Search
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Discover reflections shared by the Mirror network
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search reflections, themes, insights..."
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Relevance
                  </div>
                </SelectItem>
                <SelectItem value="attestations">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Attestations
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Newest
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Oldest
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-blue-600">{activeFilterCount}</Badge>
              )}
            </Button>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4" />
                  Lens Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* License Filter */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" />
                License Type
              </Label>
              <div className="space-y-2">
                {(Object.keys(LICENSE_LABELS) as LicenseType[]).map((license) => (
                  <div key={license} className="flex items-center space-x-2">
                    <Checkbox
                      id={`license-${license}`}
                      checked={selectedLicenses.includes(license)}
                      onCheckedChange={() => toggleLicense(license)}
                    />
                    <Label
                      htmlFor={`license-${license}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {LICENSE_LABELS[license]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Instance Filter */}
            {availableInstances.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4" />
                  Instance Origin
                </Label>
                <div className="space-y-2">
                  {availableInstances.map((instance) => (
                    <div key={instance} className="flex items-center space-x-2">
                      <Checkbox
                        id={`instance-${instance}`}
                        checked={selectedInstances.includes(instance)}
                        onCheckedChange={() => toggleInstance(instance)}
                      />
                      <Label
                        htmlFor={`instance-${instance}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {instance}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Warnings */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-warnings"
                  checked={hideContentWarnings}
                  onCheckedChange={(checked: boolean) => setHideContentWarnings(checked as boolean)}
                />
                <Label htmlFor="hide-warnings" className="text-sm cursor-pointer">
                  Hide reflections with content warnings
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Found {results.length} reflections</span>
          </div>
        )}

        {results.map((reflection) => (
          <Card key={reflection.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              {/* Content Warnings */}
              {reflection.contentWarnings.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 mb-2">Content Warnings:</p>
                  <div className="flex flex-wrap gap-2">
                    {reflection.contentWarnings.map((warning) => (
                      <Badge key={warning} variant="outline" className="text-xs bg-amber-100">
                        {warning}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="mb-4">
                <p className="text-gray-800 line-clamp-3">{reflection.preview}</p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <button
                  onClick={() => onViewAuthor(reflection.author.id)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  {reflection.author.displayName}
                </button>
                <span className="text-gray-500">•</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Globe className="h-4 w-4" />
                  {new URL(reflection.author.instanceUrl).hostname}
                </div>
                <span className="text-gray-500">•</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(reflection.publishedAt).toLocaleDateString()}
                </div>
                {onAttest && (
                  <>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <CheckCircle className="h-4 w-4" />
                      {reflection.attestationCount} attestations
                    </div>
                  </>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {reflection.lensTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {LICENSE_LABELS[reflection.license]}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onViewReflection(reflection.id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Full Reflection
                </Button>
                {onAttest && (
                  <Button
                    onClick={() => onAttest(reflection.id)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Attest
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && !loading && query && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500 italic">No reflections found matching your search</p>
            </CardContent>
          </Card>
        )}

        {!query && results.length === 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    About the Commons
                  </p>
                  <p className="text-sm text-blue-800">
                    The Mirror Commons is a shared space where users across instances voluntarily 
                    publish reflections to help others grow. All content is licensed by creators—
                    respect their choices. This is a gift economy: people share because they want 
                    to contribute, not because they expect something in return.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <CommonsSearch
 *   onSearch={async (query, filters, sort) => {
 *     // Call API to search commons
 *     return [
 *       {
 *         id: 'refl_123',
 *         content: 'Full content here...',
 *         preview: 'Today I realized that my relationship with...',
 *         author: {
 *           id: 'user_456',
 *           displayName: 'Alex',
 *           instanceUrl: 'https://mirror.example.com'
 *         },
 *         visibility: 'public',
 *         license: 'cc_by',
 *         lensTags: ['relationships', 'personal-growth'],
 *         contentWarnings: [],
 *         attestationCount: 12,
 *         publishedAt: '2024-01-15T10:00:00Z'
 *       }
 *     ];
 *   }}
 *   onViewReflection={(id) => console.log('View:', id)}
 *   onViewAuthor={(id) => console.log('View author:', id)}
 *   onAttest={(id) => console.log('Attest:', id)}
 *   availableTags={['relationships', 'work', 'personal-growth', 'mental-health']}
 *   availableInstances={['mirror.example.com', 'mirror2.example.org']}
 * />
 */


