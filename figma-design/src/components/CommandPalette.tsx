/**
 * Command Palette - The instrument summoner
 * Appears with Cmd/Ctrl+K to summon any instrument
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Sparkles, Link2, Clock, User, Globe, 
  FileText, Mic, Video, Upload, Shield, GitFork, 
  Layers, Eye, Archive, Zap, Settings, AlertCircle,
  Download, Search, Network, Accessibility, Ban, 
  Volume2, Copy, Activity, Bug, BookOpen, Users, Wrench
} from 'lucide-react';

export type InstrumentId = 
  | 'reflection' | 'mirrorback' | 'threads' | 'time' | 'identity' | 'world'
  | 'constitution' | 'crisis' | 'voice' | 'document' | 'video' | 'consent'
  | 'vault' | 'fork' | 'amendment' | 'layer' | 'worldview' | 'export'
  | 'memory' | 'governance' | 'showcase'
  // Constitutional instruments (special behavior)
  | 'speech_contract' | 'license_stack' | 'constitution_stack' | 'fork_entry'
  | 'worldview_lens' | 'export_instrument' | 'provenance' | 'refusal';

interface Instrument {
  id: InstrumentId;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';
  keywords: string[];
  requiresCommons?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrument: (id: InstrumentId) => void;
  commonsEnabled: boolean;
  activeInstruments: InstrumentId[];
}

const instruments: Instrument[] = [
  {
    id: 'reflection',
    name: 'Reflection',
    description: 'Multimodal thought capture',
    icon: <MessageSquare size={20} />,
    category: 'input',
    keywords: ['write', 'text', 'thought', 'reflect'],
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Spoken reflection',
    icon: <Mic size={20} />,
    category: 'input',
    keywords: ['speak', 'audio', 'record', 'voice'],
  },
  {
    id: 'video',
    name: 'Video Mirror',
    description: 'Visual self-witnessing',
    icon: <Video size={20} />,
    category: 'input',
    keywords: ['camera', 'record', 'visual', 'witness'],
  },
  {
    id: 'document',
    name: 'Document Portal',
    description: 'Import external thoughts',
    icon: <Upload size={20} />,
    category: 'input',
    keywords: ['upload', 'import', 'file', 'document'],
  },
  {
    id: 'mirrorback',
    name: 'Mirrorback',
    description: 'AI reflection companion',
    icon: <Sparkles size={20} />,
    category: 'reflection',
    keywords: ['ai', 'response', 'reflection', 'mirror'],
  },
  {
    id: 'threads',
    name: 'Thread Weaver',
    description: 'Evolution over time',
    icon: <Link2 size={20} />,
    category: 'time',
    keywords: ['threads', 'evolution', 'connect', 'weave'],
  },
  {
    id: 'time',
    name: 'Time Navigator',
    description: 'Browse memory',
    icon: <Clock size={20} />,
    category: 'time',
    keywords: ['archive', 'history', 'past', 'memory'],
  },
  {
    id: 'memory',
    name: 'Memory Stream',
    description: 'Search reflections',
    icon: <Search size={20} />,
    category: 'time',
    keywords: ['search', 'find', 'query', 'memory'],
  },
  {
    id: 'identity',
    name: 'Identity Constellation',
    description: 'Explore your axes',
    icon: <User size={20} />,
    category: 'identity',
    keywords: ['self', 'identity', 'axes', 'constellation'],
  },
  {
    id: 'worldview',
    name: 'Worldview Lens',
    description: 'Activate perspectives',
    icon: <Eye size={20} />,
    category: 'identity',
    keywords: ['worldview', 'perspective', 'lens', 'view'],
  },
  {
    id: 'world',
    name: 'World Window',
    description: 'Witness the Commons',
    icon: <Globe size={20} />,
    category: 'commons',
    keywords: ['commons', 'world', 'witness', 'public'],
    requiresCommons: true,
  },
  {
    id: 'governance',
    name: 'Governance Hall',
    description: 'Participate in evolution',
    icon: <Zap size={20} />,
    category: 'commons',
    keywords: ['governance', 'vote', 'participate', 'commons'],
    requiresCommons: true,
  },
  {
    id: 'constitution',
    name: 'Constitutional Viewer',
    description: 'View governing principles',
    icon: <FileText size={20} />,
    category: 'sovereignty',
    keywords: ['constitution', 'principles', 'rules', 'law'],
  },
  {
    id: 'consent',
    name: 'Consent Matrix',
    description: 'Control data flow',
    icon: <Shield size={20} />,
    category: 'sovereignty',
    keywords: ['consent', 'privacy', 'control', 'data'],
  },
  {
    id: 'vault',
    name: 'Data Vault',
    description: 'Export and delete',
    icon: <Archive size={20} />,
    category: 'sovereignty',
    keywords: ['export', 'delete', 'data', 'sovereignty'],
  },
  {
    id: 'export',
    name: 'Export Nexus',
    description: 'Extract your data',
    icon: <Download size={20} />,
    category: 'sovereignty',
    keywords: ['export', 'download', 'extract', 'backup'],
  },
  {
    id: 'crisis',
    name: 'Crisis Compass',
    description: 'Immediate support',
    icon: <AlertCircle size={20} />,
    category: 'sovereignty',
    keywords: ['crisis', 'help', 'support', 'emergency'],
  },
  {
    id: 'fork',
    name: 'Fork Chamber',
    description: 'Test constitutional variants',
    icon: <GitFork size={20} />,
    category: 'builder',
    keywords: ['fork', 'test', 'sandbox', 'experiment'],
  },
  {
    id: 'amendment',
    name: 'Amendment Studio',
    description: 'Propose changes',
    icon: <FileText size={20} />,
    category: 'builder',
    keywords: ['amendment', 'propose', 'change', 'evolve'],
  },
  {
    id: 'layer',
    name: 'Layer Shifter',
    description: 'Switch context',
    icon: <Layers size={20} />,
    category: 'builder',
    keywords: ['layer', 'switch', 'context', 'mode'],
  },
  {
    id: 'showcase',
    name: 'Showcase',
    description: 'Display your work',
    icon: <BookOpen size={20} />,
    category: 'builder',
    keywords: ['showcase', 'display', 'work', 'presentation'],
  },
  // Constitutional instruments (special behavior)
  {
    id: 'speech_contract',
    name: 'Speech Contract',
    description: 'Define speech rights',
    icon: <Mic size={20} />,
    category: 'builder',
    keywords: ['speech', 'contract', 'rights', 'define'],
  },
  {
    id: 'license_stack',
    name: 'License Stack',
    description: 'Manage licenses',
    icon: <FileText size={20} />,
    category: 'builder',
    keywords: ['license', 'stack', 'manage', 'rights'],
  },
  {
    id: 'constitution_stack',
    name: 'Constitution Stack',
    description: 'Organize constitutional elements',
    icon: <Layers size={20} />,
    category: 'builder',
    keywords: ['constitution', 'stack', 'organize', 'elements'],
  },
  {
    id: 'fork_entry',
    name: 'Fork Entry',
    description: 'Create a fork entry',
    icon: <GitFork size={20} />,
    category: 'builder',
    keywords: ['fork', 'entry', 'create', 'variant'],
  },
  {
    id: 'worldview_lens',
    name: 'Worldview Lens',
    description: 'Activate perspectives',
    icon: <Eye size={20} />,
    category: 'identity',
    keywords: ['worldview', 'perspective', 'lens', 'view'],
  },
  {
    id: 'export_instrument',
    name: 'Export Instrument',
    description: 'Extract your data',
    icon: <Download size={20} />,
    category: 'sovereignty',
    keywords: ['export', 'download', 'extract', 'backup'],
  },
  {
    id: 'provenance',
    name: 'Provenance',
    description: 'Track data origins',
    icon: <Archive size={20} />,
    category: 'sovereignty',
    keywords: ['provenance', 'track', 'data', 'origins'],
  },
  {
    id: 'refusal',
    name: 'Refusal',
    description: 'Refuse data access',
    icon: <Ban size={20} />,
    category: 'sovereignty',
    keywords: ['refusal', 'data', 'access', 'deny'],
  },
];

export function CommandPalette({ 
  isOpen, 
  onClose, 
  onSelectInstrument, 
  commonsEnabled,
  activeInstruments 
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentInstruments, setRecentInstruments] = useState<InstrumentId[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent instruments from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_instruments');
    if (stored) {
      try {
        setRecentInstruments(JSON.parse(stored));
      } catch (e) {
        // Invalid data
      }
    }
  }, [isOpen]);

  // Save to recents when instrument selected
  const addToRecents = (id: InstrumentId) => {
    const updated = [id, ...recentInstruments.filter(i => i !== id)].slice(0, 5);
    setRecentInstruments(updated);
    localStorage.setItem('recent_instruments', JSON.stringify(updated));
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter instruments
  const filteredInstruments = instruments.filter(instrument => {
    // Filter out Commons-only if not enabled
    if (instrument.requiresCommons && !commonsEnabled) return false;
    
    // Search in name, description, and keywords
    const searchText = query.toLowerCase();
    return (
      instrument.name.toLowerCase().includes(searchText) ||
      instrument.description.toLowerCase().includes(searchText) ||
      instrument.keywords.some(k => k.includes(searchText))
    );
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredInstruments.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredInstruments[selectedIndex]) {
          onSelectInstrument(filteredInstruments[selectedIndex].id);
          addToRecents(filteredInstruments[selectedIndex].id);
          onClose();
          setQuery('');
        }
      } else if (e.key === 'Escape') {
        onClose();
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredInstruments, selectedIndex, onSelectInstrument, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const categoryColors = {
    input: 'rgba(203, 163, 93, 0.6)', // Gold
    reflection: 'rgba(147, 112, 219, 0.6)', // Violet
    time: 'rgba(100, 181, 246, 0.6)', // Blue
    identity: 'rgba(129, 212, 250, 0.6)', // Cyan
    commons: 'rgba(147, 112, 219, 0.6)', // Violet
    sovereignty: 'rgba(239, 68, 68, 0.6)', // Red
    builder: 'rgba(64, 224, 208, 0.6)', // Turquoise
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div 
              className="relative bg-[var(--color-surface-card)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(203, 163, 93, 0.2), 0 20px 60px rgba(0, 0, 0, 0.9)',
              }}
            >
              {/* Search input */}
              <div className="relative">
                <Search 
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
                  size={20} 
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Summon an instrument..."
                  className="w-full pl-16 pr-6 py-5 bg-transparent text-[var(--color-text-primary)] text-lg placeholder:text-[var(--color-text-muted)] focus:outline-none border-b border-[var(--color-border-subtle)]"
                />
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredInstruments.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    ...
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredInstruments.map((instrument, index) => {
                      const isActive = activeInstruments.includes(instrument.id);
                      const isSelected = index === selectedIndex;

                      return (
                        <motion.button
                          key={instrument.id}
                          onClick={() => {
                            onSelectInstrument(instrument.id);
                            addToRecents(instrument.id);
                            onClose();
                            setQuery('');
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className="w-full px-6 py-4 flex items-center gap-4 transition-all"
                          style={{
                            background: isSelected 
                              ? `linear-gradient(90deg, ${categoryColors[instrument.category]}15, transparent)`
                              : 'transparent',
                            borderLeft: isSelected 
                              ? `3px solid ${categoryColors[instrument.category]}`
                              : '3px solid transparent',
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{
                              background: `${categoryColors[instrument.category]}20`,
                              color: categoryColors[instrument.category],
                            }}
                          >
                            {instrument.icon}
                          </div>
                          
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--color-text-primary)]">
                                {instrument.name}
                              </span>
                              {isActive && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                                  active
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
                              {instrument.description}
                            </div>
                          </div>

                          <div 
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: `${categoryColors[instrument.category]}15`,
                              color: categoryColors[instrument.category],
                            }}
                          >
                            {instrument.category}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-6 py-3 bg-black/30 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <div className="flex items-center gap-4">
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                  <span>esc close</span>
                </div>
                <div>
                  {filteredInstruments.length} instrument{filteredInstruments.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}