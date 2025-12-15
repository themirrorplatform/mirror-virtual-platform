import { useState, useEffect } from 'react';
import { Clock, Search as SearchIcon, GitCompare, Download, Calendar as CalendarIcon } from 'lucide-react';
import { ArchiveTimeline } from '../ArchiveTimeline';
import { ArchiveSearch } from '../ArchiveSearch';
import { ThenNowCompare } from '../ThenNowCompare';
import { ArchiveExport } from '../ArchiveExport';
import { storage, Reflection } from '../../utils/storage';

type ViewMode = 'timeline' | 'search' | 'compare' | 'export';

interface Memory {
  id: string;
  content: string;
  timestamp: string;
  date: Date;
  threadName?: string;
  threadId?: string;
  isShared?: boolean;
  witnessCount?: number;
  responseCount?: number;
}

interface SearchResult extends Memory {
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

export function ArchiveScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<Pattern[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Then/Now comparison state
  const [thenReflection, setThenReflection] = useState<Memory | null>(null);
  const [nowReflection, setNowReflection] = useState<Memory | null>(null);

  // Load memories from storage
  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = () => {
    const reflections = storage.getReflections();
    const threads = storage.getThreads();
    
    const mappedMemories: Memory[] = reflections.map(r => {
      const thread = threads.find(t => t.reflectionIds.includes(r.id));
      
      return {
        id: r.id,
        content: r.text,
        timestamp: new Date(r.timestamp).toLocaleString(),
        date: new Date(r.timestamp),
        threadName: thread?.name,
        threadId: thread?.id,
        isShared: r.metadata.isShared,
      };
    });

    // Sort by date descending
    mappedMemories.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setMemories(mappedMemories);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setDetectedPatterns([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      // Mock search - filter memories by content
      const results = memories
        .filter(m => 
          m.content.toLowerCase().includes(query.toLowerCase()) ||
          m.threadName?.toLowerCase().includes(query.toLowerCase())
        )
        .map(m => ({
          ...m,
          relevanceScore: 0.85,
          matchedPhrases: [query],
        }));

      setSearchResults(results);

      // Mock pattern detection
      if (results.length > 2) {
        setDetectedPatterns([
          {
            id: 'p1',
            label: 'Questions about origins',
            description: 'You frequently ask "where does this come from?" or "when did this start?" — a pattern of seeking roots.',
            occurrences: 3,
            relatedMemories: results.slice(0, 3).map(r => r.id),
          },
        ]);
      }

      setIsSearching(false);
    }, 500);
  };

  const handleMemoryClick = (memoryId: string) => {
    console.log('Memory clicked:', memoryId);
    // In production, this would open a detail view
  };

  const handleThreadClick = (threadId: string) => {
    console.log('Thread clicked:', threadId);
    // In production, this would navigate to Threads screen
  };

  const handleExport = (options: any) => {
    console.log('Exporting with options:', options);
    // In production, this would generate and download the file
    
    // Mock export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: options.format,
        dateRange: options.dateRange,
        totalReflections: memories.length,
      },
      reflections: memories.map(m => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
        date: m.date.toISOString(),
        threadName: m.threadName,
        isShared: m.isShared,
        witnessCount: m.witnessCount,
        responseCount: m.responseCount,
      })),
    };

    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirror-archive-${Date.now()}.${options.format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectThen = () => {
    // In production, this would open a reflection selector
    // For now, just select a random old reflection
    const olderMemories = memories.slice(4);
    setThenReflection(olderMemories[Math.floor(Math.random() * olderMemories.length)]);
  };

  const handleSelectNow = () => {
    // In production, this would open a reflection selector
    // For now, just select a random recent reflection
    const recentMemories = memories.slice(0, 3);
    setNowReflection(recentMemories[Math.floor(Math.random() * recentMemories.length)]);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Archive</h1>
        <p className="text-[var(--color-text-secondary)]">
          Memory without shame. Every reflection you've saved.
        </p>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2 mb-8 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'timeline'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Clock size={16} />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setViewMode('search')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'search'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <SearchIcon size={16} />
          <span>Search</span>
        </button>

        <button
          onClick={() => setViewMode('compare')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'compare'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <GitCompare size={16} />
          <span>Then / Now</span>
        </button>

        <button
          onClick={() => setViewMode('export')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'export'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'timeline' && (
        <ArchiveTimeline
          memories={memories}
          onMemoryClick={handleMemoryClick}
          onThreadClick={handleThreadClick}
        />
      )}

      {viewMode === 'search' && (
        <ArchiveSearch
          onSearch={handleSearch}
          searchResults={searchResults}
          detectedPatterns={detectedPatterns}
          isSearching={isSearching}
          onMemoryClick={handleMemoryClick}
          onThreadClick={handleThreadClick}
        />
      )}

      {viewMode === 'compare' && (
        <ThenNowCompare
          thenReflection={thenReflection}
          nowReflection={nowReflection}
          onSelectThen={handleSelectThen}
          onSelectNow={handleSelectNow}
        />
      )}

      {viewMode === 'export' && (
        <ArchiveExport
          onExport={handleExport}
        />
      )}
    </div>
  );
}