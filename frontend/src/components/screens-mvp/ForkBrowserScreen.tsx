import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Star,
  Download,
  Eye,
  Lock,
  Globe,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Filter,
  Code,
} from 'lucide-react';

type ForkVisibility = 'public' | 'private' | 'unlisted';
type ForkCategory = 'tone' | 'safety' | 'inference' | 'integration' | 'experimental';

interface Fork {
  id: string;
  name: string;
  author: string;
  description: string;
  category: ForkCategory;
  visibility: ForkVisibility;
  
  // Stats
  downloads: number;
  stars: number;
  forks: number;
  
  // Metadata
  createdAt: string;
  lastUpdated: string;
  version: string;
  
  // Changes
  modifiedModules: string[];
  constitutionalScore: number;
  
  // Status
  isStarred?: boolean;
  isInstalled?: boolean;
  isOfficial?: boolean;
}

export function ForkBrowserScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForkCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'stars'>('popular');
  const [selectedFork, setSelectedFork] = useState<Fork | null>(null);

  // Mock fork data
  const forks: Fork[] = [
    {
      id: '1',
      name: 'Gentle Reflector',
      author: 'commons:alice',
      description: 'Softer, more empathetic tone for crisis-adjacent states. Reduces question frequency and increases pure reflection.',
      category: 'tone',
      visibility: 'public',
      downloads: 1247,
      stars: 389,
      forks: 23,
      createdAt: '2 months ago',
      lastUpdated: '1 week ago',
      version: '1.3.0',
      modifiedModules: ['Mirrorback Tone', 'Probing Depth'],
      constitutionalScore: 98,
      isStarred: true,
      isOfficial: false,
    },
    {
      id: '2',
      name: 'Academic Mirror',
      author: 'commons:researcher_lab',
      description: 'Formal tone with citation of psychological frameworks. Designed for therapeutic professionals.',
      category: 'tone',
      visibility: 'public',
      downloads: 823,
      stars: 234,
      forks: 12,
      createdAt: '1 month ago',
      lastUpdated: '3 days ago',
      version: '2.0.1',
      modifiedModules: ['Mirrorback Tone', 'Pattern Recognition'],
      constitutionalScore: 92,
      isOfficial: false,
    },
    {
      id: '3',
      name: 'Crisis-Sensitive Mode',
      author: 'core-team',
      description: 'Lower detection threshold with softer transition to safety mode. Official experiment being evaluated for mainline inclusion.',
      category: 'safety',
      visibility: 'public',
      downloads: 2156,
      stars: 678,
      forks: 45,
      createdAt: '3 weeks ago',
      lastUpdated: '2 days ago',
      version: '1.0.0-beta',
      modifiedModules: ['Crisis Detection', 'Mirrorback Tone'],
      constitutionalScore: 96,
      isInstalled: true,
      isOfficial: true,
    },
    {
      id: '4',
      name: 'Minimal Inference',
      author: 'commons:minimalist',
      description: 'Conservative identity inference—only creates nodes when explicitly named by user. For those who want full manual control.',
      category: 'inference',
      visibility: 'public',
      downloads: 456,
      stars: 123,
      forks: 8,
      createdAt: '2 weeks ago',
      lastUpdated: '5 days ago',
      version: '1.1.2',
      modifiedModules: ['Identity Inference', 'Pattern Recognition'],
      constitutionalScore: 99,
      isOfficial: false,
    },
    {
      id: '5',
      name: 'Obsidian Sync',
      author: 'commons:pkm_enthusiast',
      description: 'Export reflections to Obsidian markdown with frontmatter tags. Bidirectional sync with your PKM system.',
      category: 'integration',
      visibility: 'public',
      downloads: 1889,
      stars: 567,
      forks: 34,
      createdAt: '1 month ago',
      lastUpdated: '1 week ago',
      version: '3.2.0',
      modifiedModules: ['Export System', 'Data Format'],
      constitutionalScore: 94,
      isStarred: true,
      isOfficial: false,
    },
    {
      id: '6',
      name: 'Voice-First Mirror',
      author: 'commons:accessibility_team',
      description: 'Optimized for voice input/output. Shorter responses, conversational flow, works great with screen readers.',
      category: 'experimental',
      visibility: 'public',
      downloads: 234,
      stars: 89,
      forks: 5,
      createdAt: '1 week ago',
      lastUpdated: '2 days ago',
      version: '0.8.0-alpha',
      modifiedModules: ['Mirrorback Tone', 'Input Processing', 'Voice Interface'],
      constitutionalScore: 88,
      isOfficial: false,
    },
  ];

  const filteredForks = forks
    .filter(fork => {
      const matchesSearch = fork.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fork.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || fork.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'stars':
          return b.stars - a.stars;
        case 'recent':
          return 0; // Would sort by actual dates
        default:
          return 0;
      }
    });

  const categories: { id: ForkCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Forks', icon: <GitBranch size={16} /> },
    { id: 'tone', label: 'Tone', icon: <Eye size={16} /> },
    { id: 'safety', label: 'Safety', icon: <Lock size={16} /> },
    { id: 'inference', label: 'Inference', icon: <TrendingUp size={16} /> },
    { id: 'integration', label: 'Integration', icon: <Code size={16} /> },
    { id: 'experimental', label: 'Experimental', icon: <GitBranch size={16} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-green)]/20">
            <GitBranch size={32} className="text-[var(--color-accent-green)]" />
          </div>
          <div>
            <h1 className="mb-1">Fork Browser</h1>
            <p className="text-[var(--color-text-secondary)]">
              Discover and install community modifications
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Globe size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Every Mirror can be forked, modified, and shared. All forks pass constitutional integrity 
                tests before being published. You can install, test, and remove forks without affecting 
                your core Mirror.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Installing a fork creates a sandbox variant. Your original data remains untouched.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search forks by name or description..."
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}
          className="px-4 py-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
        >
          <option value="popular">Most Popular</option>
          <option value="stars">Most Starred</option>
          <option value="recent">Recently Updated</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[var(--color-surface-emphasis)] border border-[var(--color-accent-gold)] text-[var(--color-text-primary)]'
                : 'bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            {cat.icon}
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Fork Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {filteredForks.map(fork => (
          <ForkCard
            key={fork.id}
            fork={fork}
            onClick={() => setSelectedFork(fork)}
          />
        ))}
      </div>

      {filteredForks.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <GitBranch size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
            <h3 className="mb-2">No forks found</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      )}

      {/* Fork Detail Modal */}
      {selectedFork && (
        <ForkDetailModal
          fork={selectedFork}
          onClose={() => setSelectedFork(null)}
        />
      )}
    </div>
  );
}

function ForkCard({ fork, onClick }: { fork: Fork; onClick: () => void }) {
  const categoryColors = {
    tone: 'text-[var(--color-accent-blue)]',
    safety: 'text-[var(--color-accent-red)]',
    inference: 'text-[var(--color-accent-purple)]',
    integration: 'text-[var(--color-accent-green)]',
    experimental: 'text-[var(--color-accent-gold)]',
  };

  return (
    <Card className="cursor-pointer hover:border-[var(--color-accent-gold)] transition-all" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4>{fork.name}</h4>
            {fork.isOfficial && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                Official
              </span>
            )}
            {fork.isInstalled && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]">
                Installed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
            <span>by {fork.author}</span>
            <span>•</span>
            <span>v{fork.version}</span>
          </div>
        </div>
        {fork.isStarred && (
          <Star size={16} className="text-[var(--color-accent-gold)] fill-[var(--color-accent-gold)]" />
        )}
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
        {fork.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1">
            <Download size={14} />
            <span>{fork.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} />
            <span>{fork.stars}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch size={14} />
            <span>{fork.forks}</span>
          </div>
        </div>
        <div className={`text-xs ${categoryColors[fork.category]}`}>
          {fork.category}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">
            Updated {fork.lastUpdated}
          </span>
          <span className={`${
            fork.constitutionalScore >= 95 ? 'text-[var(--color-accent-green)]'
            : fork.constitutionalScore >= 85 ? 'text-[var(--color-accent-gold)]'
            : 'text-[var(--color-accent-red)]'
          }`}>
            {fork.constitutionalScore}% constitutional
          </span>
        </div>
      </div>
    </Card>
  );
}

function ForkDetailModal({ fork, onClose }: { fork: Fork; onClose: () => void }) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = () => {
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-base-raised)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-subtle)]">
        <div className="p-6 border-b border-[var(--color-border-subtle)] sticky top-0 bg-[var(--color-base-raised)] z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2>{fork.name}</h2>
                {fork.isOfficial && (
                  <span className="px-2 py-1 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                    Official Experiment
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <span>by {fork.author}</span>
                <span>•</span>
                <span>Version {fork.version}</span>
                <span>•</span>
                <span>{fork.downloads.toLocaleString()} downloads</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="mb-2">Description</h4>
            <p className="text-[var(--color-text-secondary)]">{fork.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <Download size={20} className="text-[var(--color-accent-blue)] mx-auto mb-2" />
              <div className="text-xl mb-1">{fork.downloads.toLocaleString()}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Downloads</div>
            </Card>
            <Card className="text-center">
              <Star size={20} className="text-[var(--color-accent-gold)] mx-auto mb-2" />
              <div className="text-xl mb-1">{fork.stars}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Stars</div>
            </Card>
            <Card className="text-center">
              <GitBranch size={20} className="text-[var(--color-accent-green)] mx-auto mb-2" />
              <div className="text-xl mb-1">{fork.forks}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Forks</div>
            </Card>
          </div>

          {/* Modified Modules */}
          <div>
            <h4 className="mb-3">Modified Modules</h4>
            <div className="flex flex-wrap gap-2">
              {fork.modifiedModules.map((module, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)]"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>

          {/* Constitutional Score */}
          <div>
            <h4 className="mb-3">Constitutional Alignment</h4>
            <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Integrity Score</span>
                <span className={`text-xl ${
                  fork.constitutionalScore >= 95 ? 'text-[var(--color-accent-green)]'
                  : fork.constitutionalScore >= 85 ? 'text-[var(--color-accent-gold)]'
                  : 'text-[var(--color-accent-red)]'
                }`}>
                  {fork.constitutionalScore}%
                </span>
              </div>
              <div className="h-2 bg-[var(--color-base-default)] rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    fork.constitutionalScore >= 95 ? 'bg-[var(--color-accent-green)]'
                    : fork.constitutionalScore >= 85 ? 'bg-[var(--color-accent-gold)]'
                    : 'bg-[var(--color-accent-red)]'
                  }`}
                  style={{ width: `${fork.constitutionalScore}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                All modifications tested against constitutional constraints
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Created</div>
              <div className="text-[var(--color-text-secondary)]">{fork.createdAt}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Last Updated</div>
              <div className="text-[var(--color-text-secondary)]">{fork.lastUpdated}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Visibility</div>
              <div className="text-[var(--color-text-secondary)] capitalize">{fork.visibility}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] mb-1">Category</div>
              <div className="text-[var(--color-text-secondary)] capitalize">{fork.category}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!fork.isInstalled ? (
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? 'Installing...' : 'Install Fork'}
              </Button>
            ) : (
              <Button variant="secondary" className="flex-1">
                Uninstall
              </Button>
            )}
            <Button variant="ghost">
              <Star size={16} className={fork.isStarred ? 'fill-[var(--color-accent-gold)]' : ''} />
            </Button>
            <Button variant="ghost">
              <GitBranch size={16} />
            </Button>
          </div>

          <Card>
            <p className="text-xs text-[var(--color-text-muted)]">
              Installing this fork creates a sandbox variant. Your original Mirror and data remain untouched. 
              You can switch between forks or remove them at any time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}





