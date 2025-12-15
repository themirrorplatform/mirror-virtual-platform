import { useState, useCallback, useEffect } from 'react';

// Centralized reflection state management with persistence
// Constitutional: All state changes are transparent and reversible

interface ReflectionEntry {
  id: string;
  content: string;
  timestamp: string;
  layer: 'sovereign' | 'commons' | 'builder';
  mirrorbacks?: Array<{
    id: string;
    content: string;
    timestamp: string;
  }>;
  threads?: string[];
  tags?: string[];
  claims?: string[];
  metadata?: {
    wordCount: number;
    readingTime: number;
    modality?: 'text' | 'voice' | 'video' | 'longform';
  };
}

interface ReflectionState {
  entries: ReflectionEntry[];
  currentEntry: ReflectionEntry | null;
  draftEntry: Partial<ReflectionEntry> | null;
}

const STORAGE_KEY = 'mirror_reflections_v1';

export function useReflectionState() {
  // Load from localStorage on mount
  const [state, setState] = useState<ReflectionState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load reflection state:', error);
    }
    return {
      entries: [],
      currentEntry: null,
      draftEntry: null
    };
  });

  // Persist to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist reflection state:', error);
    }
  }, [state]);

  // Create new reflection entry
  const createEntry = useCallback((
    content: string,
    layer: 'sovereign' | 'commons' | 'builder',
    metadata?: Partial<ReflectionEntry>
  ) => {
    const newEntry: ReflectionEntry = {
      id: `reflection_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      content,
      timestamp: new Date().toISOString(),
      layer,
      mirrorbacks: [],
      threads: [],
      tags: [],
      claims: [],
      metadata: {
        wordCount: content.split(/\s+/).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        ...metadata?.metadata
      },
      ...metadata
    };

    setState(prev => ({
      ...prev,
      entries: [newEntry, ...prev.entries],
      currentEntry: newEntry,
      draftEntry: null
    }));

    return newEntry;
  }, []);

  // Update existing entry
  const updateEntry = useCallback((
    id: string,
    updates: Partial<ReflectionEntry>
  ) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === id
          ? {
              ...entry,
              ...updates,
              metadata: {
                ...entry.metadata,
                wordCount: updates.content ? updates.content.split(/\s+/).length : entry.metadata?.wordCount || 0,
                readingTime: updates.content ? Math.ceil(updates.content.split(/\s+/).length / 200) : entry.metadata?.readingTime || 0,
                ...updates.metadata
              }
            }
          : entry
      ),
      currentEntry: prev.currentEntry?.id === id
        ? { ...prev.currentEntry, ...updates }
        : prev.currentEntry
    }));
  }, []);

  // Add mirrorback to entry
  const addMirrorback = useCallback((
    entryId: string,
    content: string
  ) => {
    const mirrorback = {
      id: `mirrorback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      content,
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              mirrorbacks: [...(entry.mirrorbacks || []), mirrorback]
            }
          : entry
      )
    }));

    return mirrorback;
  }, []);

  // Link entry to thread
  const linkToThread = useCallback((
    entryId: string,
    threadId: string
  ) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              threads: [...(entry.threads || []), threadId]
            }
          : entry
      )
    }));
  }, []);

  // Add tag to entry
  const addTag = useCallback((
    entryId: string,
    tag: string
  ) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              tags: [...(entry.tags || []), tag]
            }
          : entry
      )
    }));
  }, []);

  // Add claim to entry
  const addClaim = useCallback((
    entryId: string,
    claim: string
  ) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === entryId
          ? {
              ...entry,
              claims: [...(entry.claims || []), claim]
            }
          : entry
      )
    }));
  }, []);

  // Delete entry (with confirmation required)
  const deleteEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== id),
      currentEntry: prev.currentEntry?.id === id ? null : prev.currentEntry
    }));
  }, []);

  // Set current entry
  const setCurrentEntry = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      currentEntry: id ? prev.entries.find(e => e.id === id) || null : null
    }));
  }, []);

  // Save draft
  const saveDraft = useCallback((draft: Partial<ReflectionEntry>) => {
    setState(prev => ({
      ...prev,
      draftEntry: draft
    }));
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    setState(prev => ({
      ...prev,
      draftEntry: null
    }));
  }, []);

  // Get entries by layer
  const getEntriesByLayer = useCallback((layer: 'sovereign' | 'commons' | 'builder') => {
    return state.entries.filter(entry => entry.layer === layer);
  }, [state.entries]);

  // Get entries by date range
  const getEntriesByDateRange = useCallback((start: Date, end: Date) => {
    return state.entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= start && entryDate <= end;
    });
  }, [state.entries]);

  // Search entries
  const searchEntries = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return state.entries.filter(entry =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      entry.claims?.some(claim => claim.toLowerCase().includes(lowerQuery))
    );
  }, [state.entries]);

  // Export data
  const exportData = useCallback((format: 'json' | 'md' | 'csv') => {
    if (format === 'json') {
      return JSON.stringify(state, null, 2);
    }
    
    if (format === 'md') {
      return state.entries.map(entry => `
# ${new Date(entry.timestamp).toLocaleDateString()}

${entry.content}

${entry.mirrorbacks && entry.mirrorbacks.length > 0 ? `
## Mirrorbacks

${entry.mirrorbacks.map(mb => mb.content).join('\n\n')}
` : ''}

---
`).join('\n\n');
    }

    if (format === 'csv') {
      const headers = 'ID,Timestamp,Layer,Content,WordCount,Tags,Claims\n';
      const rows = state.entries.map(entry =>
        `"${entry.id}","${entry.timestamp}","${entry.layer}","${entry.content.replace(/"/g, '""')}","${entry.metadata?.wordCount || 0}","${(entry.tags || []).join(',')}","${(entry.claims || []).join(',')}"`
      ).join('\n');
      return headers + rows;
    }

    return '';
  }, [state]);

  // Import data (with validation)
  const importData = useCallback((data: string, format: 'json') => {
    try {
      if (format === 'json') {
        const parsed = JSON.parse(data);
        // Validate structure
        if (parsed.entries && Array.isArray(parsed.entries)) {
          setState(parsed);
          return { success: true, count: parsed.entries.length };
        }
      }
      return { success: false, error: 'Invalid format' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  // Clear all data (requires explicit confirmation)
  const clearAllData = useCallback(() => {
    setState({
      entries: [],
      currentEntry: null,
      draftEntry: null
    });
  }, []);

  return {
    // State
    entries: state.entries,
    currentEntry: state.currentEntry,
    draftEntry: state.draftEntry,
    
    // Actions
    createEntry,
    updateEntry,
    deleteEntry,
    setCurrentEntry,
    
    // Mirrorbacks
    addMirrorback,
    
    // Connections
    linkToThread,
    addTag,
    addClaim,
    
    // Drafts
    saveDraft,
    clearDraft,
    
    // Queries
    getEntriesByLayer,
    getEntriesByDateRange,
    searchEntries,
    
    // Data management
    exportData,
    importData,
    clearAllData,
    
    // Stats
    stats: {
      total: state.entries.length,
      sovereignCount: state.entries.filter(e => e.layer === 'sovereign').length,
      commonsCount: state.entries.filter(e => e.layer === 'commons').length,
      builderCount: state.entries.filter(e => e.layer === 'builder').length,
      totalWords: state.entries.reduce((sum, e) => sum + (e.metadata?.wordCount || 0), 0),
      withMirrorbacks: state.entries.filter(e => e.mirrorbacks && e.mirrorbacks.length > 0).length,
      withThreads: state.entries.filter(e => e.threads && e.threads.length > 0).length,
    }
  };
}

export type { ReflectionEntry, ReflectionState };
