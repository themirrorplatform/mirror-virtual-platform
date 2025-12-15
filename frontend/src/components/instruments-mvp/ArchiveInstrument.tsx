import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Clock, Network, Eye, Download, Search, Filter, ZoomIn, ZoomOut, Calendar, TrendingUp, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Layer } from './LayerHUD';

type ArchiveMode = 'timeline' | 'graph' | 'worldview-overlay';
type TimelineZoom = 'day' | 'week' | 'month' | 'year' | 'all';

interface ArchiveEntry {
  id: string;
  type: 'reflection' | 'thread' | 'mirrorback' | 'identity-shift';
  timestamp: string;
  content: string;
  connections: string[];
  worldviewTags?: string[];
}

interface ArchiveInstrumentProps {
  layer: Layer;
  entries: ArchiveEntry[];
  worldviews: string[];
  onCompare: (entryA: string, entryB: string) => void;
  onOpenThread: (threadId: string) => void;
  onExportSelection: (selectedIds: string[]) => void;
  onClose: () => void;
}

export function ArchiveInstrument({
  layer,
  entries,
  worldviews,
  onCompare,
  onOpenThread,
  onExportSelection,
  onClose
}: ArchiveInstrumentProps) {
  const [mode, setMode] = useState<ArchiveMode>('timeline');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorldview, setActiveWorldview] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>('all');

  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchQuery && !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type filter
    if (filterType !== 'all' && entry.type !== filterType) {
      return false;
    }
    // Worldview filter
    if (activeWorldview && mode === 'worldview-overlay') {
      return entry.worldviewTags?.includes(activeWorldview);
    }
    return true;
  });

  const toggleSelection = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedEntries.length === 2) {
      onCompare(selectedEntries[0], selectedEntries[1]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl flex flex-col overflow-hidden shadow-ambient-xl"
      >
        {/* Header - enhanced spacing */}
        <div className="p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-emphasis)]/20 to-transparent">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface-emphasis)] shadow-ambient-sm">
                <Archive size={22} className="text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="text-[var(--color-text-primary)] mb-2 text-xl font-semibold tracking-tight">Archive</h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} • Memory without shame
                </p>
              </div>
            </div>

            {/* Mode Selector - enhanced design */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('timeline')}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 shadow-ambient-sm ${
                  mode === 'timeline'
                    ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30 shadow-gold-sm'
                    : 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-secondary)] border-2 border-transparent hover:bg-[var(--color-surface-overlay)] hover:border-[var(--color-border-subtle)]'
                }`}
              >
                <Clock size={16} />
                <span className="font-medium">Timeline</span>
              </button>
              <button
                onClick={() => setMode('graph')}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 shadow-ambient-sm ${
                  mode === 'graph'
                    ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30 shadow-gold-sm'
                    : 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-secondary)] border-2 border-transparent hover:bg-[var(--color-surface-overlay)] hover:border-[var(--color-border-subtle)]'
                }`}
              >
                <Network size={16} />
                <span className="font-medium">Graph</span>
              </button>
              <button
                onClick={() => setMode('worldview-overlay')}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 shadow-ambient-sm ${
                  mode === 'worldview-overlay'
                    ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-2 border-[var(--color-accent-gold)]/30 shadow-gold-sm'
                    : 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-secondary)] border-2 border-transparent hover:bg-[var(--color-surface-overlay)] hover:border-[var(--color-border-subtle)]'
                }`}
              >
                <Eye size={16} />
                <span className="font-medium">Worldview</span>
              </button>
              
              <button
                onClick={onClose}
                className="ml-4 p-2.5 rounded-xl hover:bg-[var(--color-surface-emphasis)] transition-colors shadow-ambient-sm"
                aria-label="Close"
              >
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar - enhanced spacing */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search archive..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)] shadow-ambient-sm transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--color-text-muted)]" />
              <select
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
              >
                <option value="all">All Types</option>
                <option value="reflection">Reflections</option>
                <option value="thread">Threads</option>
                <option value="mirrorback">Mirrorbacks</option>
                <option value="identity-shift">Identity Shifts</option>
              </select>
            </div>

            {/* Worldview Filter (only in worldview mode) */}
            {mode === 'worldview-overlay' && worldviews.length > 0 && (
              <select
                value={activeWorldview || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActiveWorldview(e.target.value || null)}
                className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-gold)]"
              >
                <option value="">All Worldviews</option>
                {worldviews.map(wv => (
                  <option key={wv} value={wv}>{wv}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Timeline Mode */}
          {mode === 'timeline' && (
            <div className="space-y-4">
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative pl-8 pb-6 ${
                    index !== filteredEntries.length - 1 ? 'border-l-2 border-[var(--color-border-subtle)]' : ''
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-[var(--color-accent-gold)] border-2 border-[var(--color-surface-card)]" />

                  <div
                    onClick={() => toggleSelection(entry.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                      selectedEntries.includes(entry.id)
                        ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                        : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-surface-emphasis)] text-[var(--color-text-muted)] capitalize">
                          {entry.type.replace('-', ' ')}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">{entry.timestamp}</span>
                      </div>
                      {selectedEntries.includes(entry.id) && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                          <span className="text-xs text-black">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {entry.content}
                    </p>
                    {entry.worldviewTags && entry.worldviewTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.worldviewTags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Graph Mode */}
          {mode === 'graph' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Network size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
                <p className="text-sm text-[var(--color-text-muted)] mb-2">
                  Graph View
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Visual connection map of {filteredEntries.length} entries
                </p>
                {/* In real implementation, would render interactive graph visualization */}
                <div className="mt-8 p-8 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] max-w-md mx-auto">
                  <div className="space-y-3">
                    {filteredEntries.slice(0, 5).map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => toggleSelection(entry.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedEntries.includes(entry.id)
                            ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                        }`}
                      >
                        <div className="text-xs text-[var(--color-text-muted)] mb-1">{entry.timestamp}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {entry.content.substring(0, 60)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Worldview Overlay Mode */}
          {mode === 'worldview-overlay' && (
            <div className="space-y-4">
              {activeWorldview && (
                <div className="p-4 rounded-2xl bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={16} className="text-[var(--color-accent-gold)]" />
                    <span className="text-sm text-[var(--color-accent-gold)]">
                      Viewing through: {activeWorldview}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Showing only entries tagged with this worldview
                  </p>
                </div>
              )}
              
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleSelection(entry.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-colors ${
                    selectedEntries.includes(entry.id)
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-[var(--color-text-muted)]">{entry.timestamp}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {entry.worldviewTags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedEntries.includes(entry.id) && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                        <span className="text-xs text-black">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {entry.content}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredEntries.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Archive size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Nothing appears here yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            {selectedEntries.length > 0 && (
              <span>{selectedEntries.length} selected</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {selectedEntries.length === 2 && (
              <button
                onClick={handleCompare}
                className="px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
              >
                Compare
              </button>
            )}
            {selectedEntries.length > 0 && (
              <button
                onClick={() => onExportSelection(selectedEntries)}
                className="px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center gap-2"
              >
                <Download size={14} />
                <span>Export Selected</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


