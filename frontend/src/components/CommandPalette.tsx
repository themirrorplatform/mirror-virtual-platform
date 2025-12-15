/**
 * Command Palette - Quick navigation and instrument summoner
 * Press Cmd/Ctrl+K to open
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useMirrorStateContext } from '../contexts/MirrorStateContext';
import { 
  MessageSquare, User, Settings, BarChart3, 
  Shield, Search, Home, Sparkles, Layers, Globe, Wrench, AlertCircle,
  FileText, Mic, Video, GitBranch, Eye, Scale, Download, Zap,
  BookOpen, Archive, Compass, Lock, Users, Clock, CheckCircle, XCircle
} from 'lucide-react';

export type CommandId = 
  | 'home' | 'reflect' | 'identity' | 'governance' 
  | 'analytics' | 'settings'
  | 'layer_sovereign' | 'layer_commons' | 'layer_builder' | 'crisis'
  | 'instrument_entry' | 'instrument_speech' | 'instrument_license'
  | 'instrument_constitution' | 'instrument_fork' | 'instrument_worldview'
  | 'instrument_export' | 'instrument_provenance' | 'instrument_refusal'
  | 'instrument_voice' | 'instrument_video' | 'instrument_longform'
  | 'instrument_thread' | 'instrument_identity' | 'instrument_archive'
  | 'instrument_crisis' | 'instrument_recognition' | 'instrument_sync'
  | 'instrument_conflict' | 'instrument_consent' | 'instrument_failure';

interface Command {
  id: CommandId;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action';
  keywords: string[];
  href?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const commands: Command[] = [
  {
    id: 'home',
    name: 'Home',
    description: 'View reflection feed',
    icon: <Home size={20} />,
    category: 'navigation',
    keywords: ['home', 'feed', 'start'],
    href: '/',
  },
  {
    id: 'reflect',
    name: 'Reflect',
    description: 'Create new reflection',
    icon: <MessageSquare size={20} />,
    category: 'navigation',
    keywords: ['reflect', 'write', 'create', 'new'],
    href: '/reflect',
  },
  {
    id: 'identity',
    name: 'Identity',
    description: 'Explore identity graph',
    icon: <Sparkles size={20} />,
    category: 'navigation',
    keywords: ['identity', 'graph', 'self', 'explore'],
    href: '/identity',
  },
  {
    id: 'governance',
    name: 'Governance',
    description: 'Multi-Guardian system',
    icon: <Shield size={20} />,
    category: 'navigation',
    keywords: ['governance', 'guardian', 'vote'],
    href: '/governance',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'View insights',
    icon: <BarChart3 size={20} />,
    category: 'navigation',
    keywords: ['analytics', 'insights', 'data'],
    href: '/analytics',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Manage preferences',
    icon: <Settings size={20} />,
    category: 'navigation',
    keywords: ['settings', 'preferences', 'config'],
    href: '/settings',
  },
  {
    id: 'layer_sovereign',
    name: 'Sovereign Layer',
    description: 'Private, local-only mode',
    icon: <Shield size={20} />,
    category: 'action',
    keywords: ['sovereign', 'layer', 'private', 'local'],
  },
  // Constitutional Instruments
  {
    id: 'instrument_entry',
    name: 'Entry Instrument',
    description: 'Constitutional onboarding flow',
    icon: <CheckCircle size={20} />,
    category: 'action',
    keywords: ['entry', 'onboarding', 'start', 'begin'],
  },
  {
    id: 'instrument_speech',
    name: 'Speech Contract',
    description: 'Constitutional language agreement',
    icon: <MessageSquare size={20} />,
    category: 'action',
    keywords: ['speech', 'contract', 'language'],
  },
  {
    id: 'instrument_license',
    name: 'License Stack',
    description: 'View acknowledged licenses',
    icon: <FileText size={20} />,
    category: 'action',
    keywords: ['license', 'stack', 'agreements'],
  },
  {
    id: 'instrument_constitution',
    name: 'Constitution Stack',
    description: 'Active constitutional layers',
    icon: <BookOpen size={20} />,
    category: 'action',
    keywords: ['constitution', 'stack', 'rules'],
  },
  {
    id: 'instrument_fork',
    name: 'Fork Entry',
    description: 'Enter constitutional fork',
    icon: <GitBranch size={20} />,
    category: 'action',
    keywords: ['fork', 'variant', 'alternate'],
  },
  {
    id: 'instrument_worldview',
    name: 'Worldview Lens',
    description: 'Apply perspective filter',
    icon: <Eye size={20} />,
    category: 'action',
    keywords: ['worldview', 'lens', 'perspective'],
  },
  {
    id: 'instrument_export',
    name: 'Export Data',
    description: 'Download your reflections',
    icon: <Download size={20} />,
    category: 'action',
    keywords: ['export', 'download', 'data'],
  },
  {
    id: 'instrument_provenance',
    name: 'Provenance',
    description: 'Track data origins',
    icon: <Compass size={20} />,
    category: 'action',
    keywords: ['provenance', 'origin', 'source'],
  },
  {
    id: 'instrument_refusal',
    name: 'Refusal Log',
    description: 'View constitutional refusals',
    icon: <XCircle size={20} />,
    category: 'action',
    keywords: ['refusal', 'boundaries', 'no'],
  },
  {
    id: 'instrument_voice',
    name: 'Voice Input',
    description: 'Speak your reflection',
    icon: <Mic size={20} />,
    category: 'action',
    keywords: ['voice', 'speak', 'audio'],
  },
  {
    id: 'instrument_video',
    name: 'Video Input',
    description: 'Record video reflection',
    icon: <Video size={20} />,
    category: 'action',
    keywords: ['video', 'record', 'camera'],
  },
  {
    id: 'instrument_longform',
    name: 'Longform Editor',
    description: 'Extended reflection space',
    icon: <FileText size={20} />,
    category: 'action',
    keywords: ['longform', 'extended', 'document'],
  },
  {
    id: 'instrument_thread',
    name: 'Thread Weaver',
    description: 'Connect reflections',
    icon: <Layers size={20} />,
    category: 'action',
    keywords: ['thread', 'weave', 'connect'],
  },
  {
    id: 'instrument_identity',
    name: 'Identity Graph',
    description: 'Explore identity dimensions',
    icon: <Sparkles size={20} />,
    category: 'action',
    keywords: ['identity', 'graph', 'self'],
  },
  {
    id: 'instrument_archive',
    name: 'Archive',
    description: 'Browse past reflections',
    icon: <Archive size={20} />,
    category: 'action',
    keywords: ['archive', 'history', 'past'],
  },
  {
    id: 'instrument_crisis',
    name: 'Crisis Compass',
    description: 'Support resources',
    icon: <AlertCircle size={20} />,
    category: 'action',
    keywords: ['crisis', 'support', 'help', '988'],
  },
  {
    id: 'instrument_recognition',
    name: 'Recognition Status',
    description: 'View community standing',
    icon: <Users size={20} />,
    category: 'action',
    keywords: ['recognition', 'status', 'standing'],
  },
  {
    id: 'instrument_sync',
    name: 'Sync Reality',
    description: 'Multi-device sync status',
    icon: <Zap size={20} />,
    category: 'action',
    keywords: ['sync', 'devices', 'reality'],
  },
  {
    id: 'instrument_conflict',
    name: 'Conflict Resolution',
    description: 'Resolve data conflicts',
    icon: <Scale size={20} />,
    category: 'action',
    keywords: ['conflict', 'resolution', 'merge'],
  },
  {
    id: 'instrument_consent',
    name: 'Consent Delta',
    description: 'Modify consent settings',
    icon: <Lock size={20} />,
    category: 'action',
    keywords: ['consent', 'privacy', 'permissions'],
  },
  {
    id: 'layer_commons',
    name: 'Commons Layer',
    description: 'Shared, collaborative mode',
    icon: <Globe size={20} />,
    category: 'action',
    keywords: ['commons', 'layer', 'shared', 'public'],
  },
  {
    id: 'layer_builder',
    name: 'Builder Layer',
    description: 'Experimental features',
    icon: <Wrench size={20} />,
    category: 'action',
    keywords: ['builder', 'layer', 'experimental', 'dev'],
  },
  {
    id: 'crisis',
    name: 'Crisis Mode',
    description: 'Activate crisis support',
    icon: <AlertCircle size={20} />,
    category: 'action',
    keywords: ['crisis', 'help', 'support', 'emergency'],
  },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { state, switchLayer, toggleCrisisMode, addReceipt } = useMirrorStateContext();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter commands
  const filteredCommands = commands.filter(command => {
    const searchText = query.toLowerCase();
    return (
      command.name.toLowerCase().includes(searchText) ||
      command.description.toLowerCase().includes(searchText) ||
      command.keywords.some(k => k.includes(searchText))
    );
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        
        if (command) {
          // Handle layer switching
          if (command.id === 'layer_sovereign') {
            switchLayer('sovereign');
          } else if (command.id === 'layer_commons') {
            switchLayer('commons');
          } else if (command.id === 'layer_builder') {
            switchLayer('builder');
          } else if (command.id === 'crisis') {
            toggleCrisisMode(true);
            addReceipt({
              type: 'refusal',
              title: 'Crisis Mode Activated',
              details: { timestamp: new Date() },
            });
          } else if (command.href) {
            router.push(command.href);
          }
          
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
  }, [isOpen, filteredCommands, selectedIndex, router, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const categoryColors = {
    navigation: 'rgba(203, 163, 93, 0.6)', // Gold
    action: 'rgba(147, 112, 219, 0.6)', // Violet
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] px-4"
          >
            <div 
              className="relative bg-[#0F1419] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#2A2D35] overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(203, 163, 93, 0.2), 0 20px 60px rgba(0, 0, 0, 0.9)',
              }}
            >
              {/* Search input */}
              <div className="relative">
                <Search 
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9CA3AF]" 
                  size={20} 
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="w-full pl-16 pr-6 py-5 bg-transparent text-[#F3F4F6] text-lg placeholder:text-[#9CA3AF] focus:outline-none border-b border-[#2A2D35]"
                />
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[#9CA3AF]">
                    No commands found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((command, index) => {
                      const isSelected = index === selectedIndex;
                      const isActive = router.pathname === command.href;

                      return (
                        <motion.button
                          key={command.id}
                          onClick={() => {
                            if (command.href) {
                              router.push(command.href);
                              onClose();
                              setQuery('');
                            }
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className="w-full px-6 py-4 flex items-center gap-4 transition-all"
                          style={{
                            background: isSelected 
                              ? `linear-gradient(90deg, ${categoryColors[command.category]}15, transparent)`
                              : 'transparent',
                            borderLeft: isSelected 
                              ? `3px solid ${categoryColors[command.category]}`
                              : '3px solid transparent',
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{
                              background: `${categoryColors[command.category]}20`,
                              color: categoryColors[command.category],
                            }}
                          >
                            {command.icon}
                          </div>
                          
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[#F3F4F6]">
                                {command.name}
                              </span>
                              {isActive && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#CBA35D]/20 text-[#CBA35D]">
                                  current
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[#9CA3AF] mt-0.5">
                              {command.description}
                            </div>
                          </div>

                          <div 
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: `${categoryColors[command.category]}15`,
                              color: categoryColors[command.category],
                            }}
                          >
                            {command.category}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-6 py-3 bg-black/30 border-t border-[#2A2D35] flex items-center justify-between text-xs text-[#9CA3AF]">
                <div className="flex items-center gap-4">
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                  <span>esc close</span>
                </div>
                <div>
                  {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

