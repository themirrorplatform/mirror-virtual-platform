import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Link2, Tag, Download, Clock, List, ChevronDown, ChevronRight, Edit3, Plus, X, Search, ArrowUp, ArrowDown, Eye, BookOpen } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

interface Section {
  id: string;
  heading: string;
  content: string;
  claimMarkers: string[];
  linkedThreads?: string[];
  wordCount?: number;
  order: number;
}

interface LongformInstrumentProps {
  initialText: string;
  availableThreads?: Array<{ id: string; name: string }>;
  onRequestMirrorback: (sectionId: string) => void;
  onLinkToThread: (sectionId: string, threadId: string) => void;
  onExport: (format: 'md' | 'pdf' | 'json', options?: ExportOptions) => void;
  onSave?: (sections: Section[]) => void;
  onClose: () => void;
}

interface ExportOptions {
  includeMetadata: boolean;
  includeClaims: boolean;
  includeThreadLinks: boolean;
}

export function LongformInstrument({
  initialText,
  availableThreads = [],
  onRequestMirrorback,
  onLinkToThread,
  onExport,
  onSave,
  onClose
}: LongformInstrumentProps) {
  // Auto-detect sections by headings (markdown-style) or paragraphs
  const [sections, setSections] = useState<Section[]>(() => {
    const lines = initialText.split('\n');
    const detectedSections: Section[] = [];
    let currentSection: { heading: string; content: string[] } | null = null;
    let sectionCounter = 0;

    lines.forEach((line) => {
      // Check if line is a heading (starts with # or is all caps)
      const isHeading = line.match(/^#+\s+(.+)$/) || (line.length > 0 && line.length < 80 && line === line.toUpperCase());
      
      if (isHeading) {
        // Save previous section if exists
        if (currentSection) {
          detectedSections.push({
            id: `section-${sectionCounter++}`,
            heading: currentSection.heading,
            content: currentSection.content.join('\n').trim(),
            claimMarkers: [],
            linkedThreads: [],
            wordCount: currentSection.content.join(' ').split(/\s+/).length,
            order: detectedSections.length
          });
        }
        // Start new section
        const heading = line.replace(/^#+\s+/, '').trim();
        currentSection = { heading, content: [] };
      } else if (currentSection) {
        currentSection.content.push(line);
      } else if (line.trim()) {
        // No heading yet, create default section
        currentSection = { heading: 'Reflection', content: [line] };
      }
    });

    // Save last section
    if (currentSection) {
      detectedSections.push({
        id: `section-${sectionCounter}`,
        heading: currentSection.heading,
        content: currentSection.content.join('\n').trim(),
        claimMarkers: [],
        linkedThreads: [],
        wordCount: currentSection.content.join(' ').split(/\s+/).length,
        order: detectedSections.length
      });
    }

    return detectedSections.length > 0 ? detectedSections : [{
      id: 'section-0',
      heading: 'Reflection',
      content: initialText,
      claimMarkers: [],
      linkedThreads: [],
      wordCount: initialText.split(/\s+/).length,
      order: 0
    }];
  });
  
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedHeading, setEditedHeading] = useState('');
  const [showOutline, setShowOutline] = useState(true);
  const [showThreadLinker, setShowThreadLinker] = useState(false);
  const [linkingSectionId, setLinkingSectionId] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeClaims: true,
    includeThreadLinks: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [newClaimText, setNewClaimText] = useState('');
  const [addingClaimTo, setAddingClaimTo] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const totalWordCount = sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);
  const estimatedReadingTime = Math.ceil(totalWordCount / 200); // 200 words per minute

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    return sections.filter(s => 
      s.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.claimMarkers.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sections, searchQuery]);

  const addClaimMarker = (sectionId: string, claim: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, claimMarkers: [...s.claimMarkers, claim] }
        : s
    ));
    setNewClaimText('');
    setAddingClaimTo(null);
  };

  const removeClaimMarker = (sectionId: string, claimIndex: number) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, claimMarkers: s.claimMarkers.filter((_, i) => i !== claimIndex) }
        : s
    ));
  };

  const updateSectionHeading = (sectionId: string, newHeading: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, heading: newHeading } : s
    ));
    setEditingSection(null);
  };

  const reorderSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    
    // Update order
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };

  const linkThreadToSection = (sectionId: string, threadId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, linkedThreads: [...(s.linkedThreads || []), threadId] }
        : s
    ));
    onLinkToThread(sectionId, threadId);
    setShowThreadLinker(false);
    setLinkingSectionId(null);
  };

  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSelectedSection(sectionId);
  };

  const handleExport = (format: 'md' | 'pdf' | 'json') => {
    onExport(format, exportOptions);
    setShowExportOptions(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(sections);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-7xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl shadow-ambient-xl flex overflow-hidden"
        role="dialog"
        aria-label="Longform content editor"
      >
        {/* Sidebar - Outline Navigator */}
        <AnimatePresence>
          {showOutline && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-emphasis)] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <List size={18} className="text-[var(--color-accent-gold)]" />
                    <h3 className="text-base text-[var(--color-text-primary)]">Outline</h3>
                  </div>
                  <button
                    onClick={() => setShowOutline(false)}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-card)] transition-colors"
                    aria-label="Hide outline"
                  >
                    <X size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>

                {/* Reading Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-[var(--color-surface-card)]">
                    <div className="text-xs text-[var(--color-text-muted)]">Sections</div>
                    <div className="text-lg font-bold text-[var(--color-text-primary)]">{sections.length}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-surface-card)]">
                    <div className="text-xs text-[var(--color-text-muted)]">Read Time</div>
                    <div className="text-lg font-bold text-[var(--color-accent-gold)]">{estimatedReadingTime}m</div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                    placeholder="Search sections..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)]"
                  />
                </div>
              </div>

              {/* Section List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredSections.map((section, i) => {
                  const isSelected = selectedSection === section.id;
                  const isEditing = editingSection === section.id;

                  return (
                    <motion.div
                      key={section.id}
                      layout
                      className={`rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                          : 'border-transparent hover:border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left p-3"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedHeading}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedHeading(e.target.value)}
                            onBlur={() => updateSectionHeading(section.id, editedHeading)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateSectionHeading(section.id, editedHeading);
                              if (e.key === 'Escape') setEditingSection(null);
                            }}
                            autoFocus
                            className="w-full px-2 py-1 rounded bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)] text-sm text-[var(--color-text-primary)] focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-sm text-[var(--color-text-primary)] flex-1">
                              {i + 1}. {section.heading}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSection(section.id);
                                  setEditedHeading(section.heading);
                                }}
                                className="p-1 rounded hover:bg-[var(--color-surface-card)] transition-colors"
                                title="Edit heading"
                              >
                                <Edit3 size={10} className="text-[var(--color-text-muted)]" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                          {section.content.substring(0, 80)}...
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                          <div className="flex items-center gap-1">
                            <FileText size={10} />
                            <span>{section.wordCount} words</span>
                          </div>
                          {section.claimMarkers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag size={10} className="text-[var(--color-accent-gold)]" />
                              <span className="text-[var(--color-accent-gold)]">{section.claimMarkers.length}</span>
                            </div>
                          )}
                          {section.linkedThreads && section.linkedThreads.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Link2 size={10} className="text-[var(--color-accent-blue)]" />
                              <span className="text-[var(--color-accent-blue)]">{section.linkedThreads.length}</span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Reorder Controls */}
                      {!searchQuery && (
                        <div className="flex items-center gap-1 px-3 pb-2">
                          <button
                            onClick={() => reorderSection(section.id, 'up')}
                            disabled={i === 0}
                            className="p-1 rounded hover:bg-[var(--color-surface-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ArrowUp size={12} className="text-[var(--color-text-muted)]" />
                          </button>
                          <button
                            onClick={() => reorderSection(section.id, 'down')}
                            disabled={i === filteredSections.length - 1}
                            className="p-1 rounded hover:bg-[var(--color-surface-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ArrowDown size={12} className="text-[var(--color-text-muted)]" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {!showOutline && (
                    <button
                      onClick={() => setShowOutline(true)}
                      className="p-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] transition-colors"
                      title="Show outline"
                    >
                      <List size={16} className="text-[var(--color-text-muted)]" />
                    </button>
                  )}
                  <h2 className="text-xl text-[var(--color-text-primary)]">Longform Content</h2>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {totalWordCount.toLocaleString()} words • {estimatedReadingTime} min read • {sections.length} sections
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {sections.map((section, index) => {
              const isSelected = selectedSection === section.id;
              const isAddingClaim = addingClaimTo === section.id;

              return (
                <motion.div
                  key={section.id}
                  ref={(el) => (sectionRefs.current[section.id] = el)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5 shadow-lg'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }`}
                >
                  {/* Section Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg text-[var(--color-text-primary)]">
                      {index + 1}. {section.heading}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onRequestMirrorback(section.id)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors flex items-center gap-1"
                        title="Request Mirrorback for this section"
                      >
                        <Eye size={12} />
                        <span>Reflect</span>
                      </button>
                      <button
                        onClick={() => {
                          setLinkingSectionId(section.id);
                          setShowThreadLinker(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors"
                        title="Link to thread"
                      >
                        <Link2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="prose prose-invert prose-sm max-w-none mb-4">
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                  </div>

                  {/* Section Metadata */}
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-4">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{Math.ceil((section.wordCount || 0) / 200)} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={12} />
                      <span>{section.wordCount} words</span>
                    </div>
                  </div>

                  {/* Linked Threads */}
                  {section.linkedThreads && section.linkedThreads.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-[var(--color-surface-emphasis)]">
                      <div className="text-xs text-[var(--color-text-muted)] mb-2">Linked Threads</div>
                      <div className="flex flex-wrap gap-2">
                        {section.linkedThreads.map((threadId, i) => {
                          const thread = availableThreads.find(t => t.id === threadId);
                          return (
                            <div
                              key={i}
                              className="px-2 py-1 rounded bg-[var(--color-accent-blue)]/10 text-xs text-[var(--color-accent-blue)] flex items-center gap-1"
                            >
                              <Link2 size={10} />
                              <span>{thread?.name || threadId}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Claim Markers */}
                  {(section.claimMarkers.length > 0 || isAddingClaim) && (
                    <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-[var(--color-text-muted)]">
                          Claim Markers ({section.claimMarkers.length})
                        </div>
                        {!isAddingClaim && (
                          <button
                            onClick={() => setAddingClaimTo(section.id)}
                            className="text-xs text-[var(--color-accent-gold)] hover:underline"
                          >
                            Add Claim
                          </button>
                        )}
                      </div>

                      {isAddingClaim && (
                        <div className="mb-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={newClaimText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewClaimText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newClaimText.trim()) {
                                addClaimMarker(section.id, newClaimText.trim());
                              }
                              if (e.key === 'Escape') setAddingClaimTo(null);
                            }}
                            placeholder="Enter claim text..."
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => newClaimText.trim() && addClaimMarker(section.id, newClaimText.trim())}
                            className="px-3 py-2 rounded-lg bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-xs transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddingClaimTo(null)}
                            className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {section.claimMarkers.map((claim, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="group px-3 py-1.5 rounded-lg bg-[var(--color-accent-gold)]/10 text-xs text-[var(--color-accent-gold)] flex items-center gap-2"
                          >
                            <Tag size={10} />
                            <span>{claim}</span>
                            <button
                              onClick={() => removeClaimMarker(section.id, i)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Actions Footer */}
          <div className="p-6 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              {/* Export Options */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] text-sm transition-colors flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>

                <AnimatePresence>
                  {showExportOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute bottom-24 left-6 p-4 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-lg"
                    >
                      <div className="text-sm text-[var(--color-text-primary)] mb-3">Export Options</div>
                      
                      <div className="space-y-2 mb-4">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeMetadata}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportOptions({ ...exportOptions, includeMetadata: e.target.checked })}
                          />
                          <span className="text-[var(--color-text-secondary)]">Include metadata</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeClaims}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportOptions({ ...exportOptions, includeClaims: e.target.checked })}
                          />
                          <span className="text-[var(--color-text-secondary)]">Include claims</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeThreadLinks}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportOptions({ ...exportOptions, includeThreadLinks: e.target.checked })}
                          />
                          <span className="text-[var(--color-text-secondary)]">Include thread links</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleExport('md')}
                          className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors"
                        >
                          MD
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          className="px-3 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors"
                        >
                          JSON
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {onSave && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-sm transition-colors"
                >
                  Save Changes
                </button>
              )}

              <button
                onClick={onClose}
                className="ml-auto px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Thread Linker Modal */}
        <AnimatePresence>
          {showThreadLinker && linkingSectionId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
              onClick={() => setShowThreadLinker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6"
              >
                <h3 className="text-sm text-[var(--color-text-primary)] mb-4">Link to Thread</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {availableThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => linkThreadToSection(linkingSectionId, thread.id)}
                      className="w-full text-left p-3 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] transition-colors"
                    >
                      <div className="text-sm text-[var(--color-text-primary)]">{thread.name}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowThreadLinker(false)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] text-sm transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

