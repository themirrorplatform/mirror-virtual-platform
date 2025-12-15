/**
 * Quick Actions - Command palette and quick access
 * 
 * Features:
 * - Command palette (Cmd+K)
 * - Fuzzy search actions
 * - Recent actions
 * - Contextual suggestions
 * - Keyboard navigation
 * - Custom action shortcuts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Command,
  Clock,
  Sparkles,
  TrendingUp,
  Archive,
  Settings,
  Eye,
  Download,
  FileText,
  User,
  ChevronRight
} from 'lucide-react';
import { Card } from '../Card';
import { Badge } from '../finder/Badge';

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  category: 'navigation' | 'create' | 'view' | 'export' | 'settings';
  keywords: string[];
  action: () => void;
  shortcut?: string[];
}

interface QuickActionsProps {
  actions: Action[];
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (actionId: string) => void;
}

const CATEGORY_CONFIG = {
  navigation: { label: 'Navigation', color: '#3B82F6' },
  create: { label: 'Create', color: '#10B981' },
  view: { label: 'View', color: '#8B5CF6' },
  export: { label: 'Export', color: '#F59E0B' },
  settings: { label: 'Settings', color: '#64748B' },
};

export function QuickActions({ 
  actions, 
  isOpen, 
  onClose,
  onExecuteAction 
}: QuickActionsProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter actions based on query
  const filteredActions = query
    ? actions.filter(action => {
        const searchText = query.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchText) ||
          action.description?.toLowerCase().includes(searchText) ||
          action.keywords.some(keyword => keyword.toLowerCase().includes(searchText))
        );
      })
    : actions;

  // Group actions by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, Action[]>);

  // Get recent actions
  const recentActionsList = recentActions
    .map(id => actions.find(a => a.id === id))
    .filter(Boolean) as Action[];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % filteredActions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + filteredActions.length) % filteredActions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            executeAction(filteredActions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const executeAction = (action: Action) => {
    // Add to recent actions
    setRecentActions(prev => {
      const updated = [action.id, ...prev.filter(id => id !== action.id)].slice(0, 5);
      localStorage.setItem('mirror-recent-actions', JSON.stringify(updated));
      return updated;
    });

    // Execute
    action.action();
    onExecuteAction(action.id);
    onClose();
  };

  // Load recent actions on mount
  useEffect(() => {
    const saved = localStorage.getItem('mirror-recent-actions');
    if (saved) {
      setRecentActions(JSON.parse(saved));
    }
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
            <Search size={20} className="text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
              placeholder="Search actions..."
              className="flex-1 bg-transparent border-none outline-none text-base"
            />
            <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {/* Recent Actions */}
            {!query && recentActionsList.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <Clock size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">Recent</span>
                </div>
                <div className="space-y-1">
                  {recentActionsList.map((action, index) => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      isSelected={selectedIndex === index}
                      onClick={() => executeAction(action)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Actions */}
            {filteredActions.length > 0 ? (
              <div className="p-2">
                {Object.entries(groupedActions).map(([category, categoryActions]) => (
                  <div key={category} className="mb-4">
                    <div
                      className="flex items-center gap-2 px-2 py-1 mb-2"
                      style={{ 
                        color: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].color 
                      }}
                    >
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ 
                          backgroundColor: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].color 
                        }}
                      />
                      <span className="text-xs font-medium">
                        {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG].label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {categoryActions.map((action, index) => {
                        const globalIndex = filteredActions.indexOf(action);
                        return (
                          <ActionItem
                            key={action.id}
                            action={action}
                            isSelected={selectedIndex === globalIndex}
                            onClick={() => executeAction(action)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No actions found for "{query}"
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    ↵
                  </kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command size={12} />
                <span>+K to open</span>
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Action Item Component

interface ActionItemProps {
  action: Action;
  isSelected: boolean;
  onClick: () => void;
}

function ActionItem({ action, isSelected, onClick }: ActionItemProps) {
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
        isSelected
          ? 'bg-[var(--color-accent-blue)] text-white'
          : 'hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <Icon size={16} className={isSelected ? 'text-white' : 'text-[var(--color-accent-blue)]'} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{action.label}</span>
          {action.shortcut && (
            <div className="flex items-center gap-0.5">
              {action.shortcut.map((key, i) => (
                <span key={i} className="flex items-center">
                  {i > 0 && <span className="mx-0.5 text-xs">+</span>}
                  <kbd
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]'
                    }`}
                  >
                    {key}
                  </kbd>
                </span>
              ))}
            </div>
          )}
        </div>
        {action.description && (
          <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`}>
            {action.description}
          </p>
        )}
      </div>
      <ChevronRight size={16} className={isSelected ? 'text-white' : 'text-[var(--color-text-muted)]'} />
    </button>
  );
}

/**
 * Quick Actions Trigger - Floating button
 */
export function QuickActionsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-accent-blue)]/10 transition-colors"
      title="Quick actions (⌘K)"
    >
      <Command size={16} className="text-[var(--color-accent-blue)]" />
      <span className="text-sm text-[var(--color-text-secondary)]">Quick actions</span>
      <kbd className="px-2 py-1 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs">
        ⌘K
      </kbd>
    </button>
  );
}

/**
 * Default Actions Configuration
 */
export const DEFAULT_ACTIONS: Omit<Action, 'action'>[] = [
  // Navigation
  {
    id: 'nav-mirror',
    label: 'Go to Mirror',
    description: 'Open your reflection space',
    icon: Sparkles,
    category: 'navigation',
    keywords: ['mirror', 'reflection', 'write'],
    shortcut: ['⌘', 'M'],
  },
  {
    id: 'nav-threads',
    label: 'Go to Threads',
    description: 'View conversation threads',
    icon: TrendingUp,
    category: 'navigation',
    keywords: ['threads', 'conversations', 'evolution'],
    shortcut: ['⌘', 'T'],
  },
  {
    id: 'nav-world',
    label: 'Go to World',
    description: 'Browse the Commons',
    icon: Eye,
    category: 'navigation',
    keywords: ['world', 'commons', 'community'],
    shortcut: ['⌘', 'W'],
  },
  {
    id: 'nav-archive',
    label: 'Go to Archive',
    description: 'Access your history',
    icon: Archive,
    category: 'navigation',
    keywords: ['archive', 'history', 'past'],
    shortcut: ['⌘', 'A'],
  },
  {
    id: 'nav-self',
    label: 'Go to Self',
    description: 'Manage your identity and data',
    icon: User,
    category: 'navigation',
    keywords: ['self', 'settings', 'profile'],
    shortcut: ['⌘', ','],
  },

  // Create
  {
    id: 'create-reflection',
    label: 'New Reflection',
    description: 'Start writing',
    icon: FileText,
    category: 'create',
    keywords: ['new', 'create', 'write', 'reflection'],
    shortcut: ['⌘', 'N'],
  },
  {
    id: 'create-thread',
    label: 'New Thread',
    description: 'Start a new conversation thread',
    icon: TrendingUp,
    category: 'create',
    keywords: ['new', 'thread', 'conversation'],
  },

  // Export
  {
    id: 'export-data',
    label: 'Export Data',
    description: 'Download your reflections',
    icon: Download,
    category: 'export',
    keywords: ['export', 'download', 'backup'],
    shortcut: ['⌘', 'E'],
  },

  // Settings
  {
    id: 'settings-appearance',
    label: 'Appearance Settings',
    description: 'Customize theme and display',
    icon: Settings,
    category: 'settings',
    keywords: ['settings', 'theme', 'appearance', 'customization'],
  },
  {
    id: 'settings-accessibility',
    label: 'Accessibility',
    description: 'Adjust for your needs',
    icon: Eye,
    category: 'settings',
    keywords: ['accessibility', 'a11y', 'screen reader', 'contrast'],
  },
];

/**
 * useQuickActions Hook - Manage quick actions in components
 */
export function useQuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

export type { Action, QuickActionsProps };

