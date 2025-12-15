/**
 * Quick Actions - Command palette and quick action menu
 * 
 * Features:
 * - Command palette (⌘K style)
 * - Quick action menu
 * - Fuzzy search
 * - Recent actions
 * - Context-aware suggestions
 * - Constitutional language only
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search,
  Zap,
  Clock,
  ChevronRight,
  ArrowRight,
  Hash,
  FileText,
  Archive,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { Card } from '../Card';
import { Modal } from '../Modal';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  category: string;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  isOpen: boolean;
  onClose: () => void;
  recentActions?: string[];
  onActionExecute?: (actionId: string) => void;
}

export function QuickActions({
  actions,
  isOpen,
  onClose,
  recentActions = [],
  onActionExecute,
}: QuickActionsProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and rank actions
  const filteredActions = useMemo(() => {
    if (!search.trim()) {
      // Show recent actions first
      const recent = recentActions
        .map(id => actions.find(a => a.id === id))
        .filter(Boolean) as QuickAction[];
      const others = actions.filter(a => !recentActions.includes(a.id));
      return [...recent, ...others];
    }

    const searchLower = search.toLowerCase();
    return actions
      .map(action => {
        let score = 0;

        // Exact match in label
        if (action.label.toLowerCase() === searchLower) {
          score += 100;
        }
        // Starts with search
        else if (action.label.toLowerCase().startsWith(searchLower)) {
          score += 50;
        }
        // Contains search
        else if (action.label.toLowerCase().includes(searchLower)) {
          score += 25;
        }

        // Check description
        if (action.description?.toLowerCase().includes(searchLower)) {
          score += 10;
        }

        // Check keywords
        if (action.keywords?.some(k => k.toLowerCase().includes(searchLower))) {
          score += 15;
        }

        return { action, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ action }) => action);
  }, [search, actions, recentActions]);

  // Group by category
  const groupedActions = useMemo(() => {
    const groups: Record<string, QuickAction[]> = {};
    filteredActions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    return groups;
  }, [filteredActions]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
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

  const executeAction = (action: QuickAction) => {
    action.action();
    onActionExecute?.(action.id);
    onClose();
    setSearch('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions..."
            className="w-full pl-12 pr-4 py-4 bg-transparent border-b border-[var(--color-border-subtle)] text-lg focus:outline-none"
          />
        </div>

        {/* Actions List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <div key={category} className="mb-4">
              {search && (
                <div className="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase">
                  {category}
                </div>
              )}
              <div>
                {categoryActions.map((action, index) => {
                  const globalIndex = filteredActions.indexOf(action);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <QuickActionItem
                      key={action.id}
                      action={action}
                      isSelected={isSelected}
                      isRecent={recentActions.includes(action.id)}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                No actions found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Quick Action Item

interface QuickActionItemProps {
  action: QuickAction;
  isSelected: boolean;
  isRecent: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function QuickActionItem({
  action,
  isSelected,
  isRecent,
  onClick,
  onMouseEnter,
}: QuickActionItemProps) {
  const Icon = action.icon || Zap;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
        isSelected
          ? 'bg-[var(--color-accent-blue)]/10'
          : 'hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        isSelected
          ? 'bg-[var(--color-accent-blue)] text-white'
          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
      }`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{action.label}</p>
          {isRecent && (
            <Clock size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
          )}
        </div>
        {action.description && (
          <p className="text-xs text-[var(--color-text-muted)] truncate">
            {action.description}
          </p>
        )}
      </div>

      {action.shortcut && (
        <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs font-mono text-[var(--color-text-muted)] flex-shrink-0">
          {action.shortcut}
        </kbd>
      )}

      <ChevronRight
        size={16}
        className={`flex-shrink-0 ${
          isSelected ? 'text-[var(--color-accent-blue)]' : 'text-[var(--color-text-muted)]'
        }`}
      />
    </button>
  );
}

/**
 * Quick Action Button - Floating action button
 */
interface QuickActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function QuickActionButton({ onClick, className = '' }: QuickActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`fixed bottom-6 right-6 p-4 rounded-full bg-[var(--color-accent-blue)] text-white shadow-lg hover:shadow-xl transition-shadow z-40 ${className}`}
      title="Quick Actions (⌘K)"
    >
      <Zap size={24} />
    </motion.button>
  );
}

/**
 * Context Menu - Right-click actions
 */
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 50,
      }}
    >
      <Card className="min-w-[200px] p-1">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.variant === 'danger'
                  ? 'hover:bg-[var(--color-border-error)]/10 text-[var(--color-border-error)]'
                  : 'hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {Icon && <Icon size={16} />}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs font-mono text-[var(--color-text-muted)]">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          );
        })}
      </Card>
    </motion.div>
  );
}

/**
 * useQuickActions Hook
 */
export function useQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

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

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const recordAction = (actionId: string) => {
    setRecentActions(prev => {
      const filtered = prev.filter(id => id !== actionId);
      return [actionId, ...filtered].slice(0, 5); // Keep last 5
    });
  };

  return {
    isOpen,
    open,
    close,
    recentActions,
    recordAction,
  };
}

/**
 * useContextMenu Hook
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    items: ContextMenuItem[];
    position: { x: number; y: number };
  } | null>(null);

  const showContextMenu = (
    e: React.MouseEvent,
    items: ContextMenuItem[]
  ) => {
    e.preventDefault();
    setContextMenu({
      items,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}

/**
 * Default Actions Configuration
 */
export const defaultQuickActions: Omit<QuickAction, 'action'>[] = [
  // Navigation
  {
    id: 'goto-mirror',
    label: 'Mirror',
    description: 'Enter reflection space',
    icon: FileText,
    category: 'Navigation',
    keywords: ['reflection', 'write', 'think'],
    shortcut: '⌘M',
  },
  {
    id: 'goto-threads',
    label: 'Threads',
    description: 'View evolution over time',
    icon: Hash,
    category: 'Navigation',
    keywords: ['threads', 'evolution', 'time'],
    shortcut: '⌘T',
  },
  {
    id: 'goto-archive',
    label: 'Archive',
    description: 'Browse past reflections',
    icon: Archive,
    category: 'Navigation',
    keywords: ['archive', 'memory', 'past'],
    shortcut: '⌘A',
  },

  // Actions
  {
    id: 'new-reflection',
    label: 'Begin Reflection',
    description: 'Start a new reflection',
    icon: FileText,
    category: 'Actions',
    keywords: ['new', 'create', 'start', 'begin'],
    shortcut: '⌘N',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Search reflections',
    icon: Search,
    category: 'Actions',
    keywords: ['find', 'search', 'look'],
    shortcut: '⌘F',
  },
  {
    id: 'add-tag',
    label: 'Add Tag',
    description: 'Organize with tags',
    icon: Tag,
    category: 'Actions',
    keywords: ['tag', 'label', 'organize'],
  },
  {
    id: 'change-axis',
    label: 'Change Identity Axis',
    description: 'Switch identity context',
    icon: User,
    category: 'Actions',
    keywords: ['axis', 'identity', 'context'],
  },
  {
    id: 'view-calendar',
    label: 'View by Time',
    description: 'Browse by date',
    icon: Calendar,
    category: 'Actions',
    keywords: ['calendar', 'date', 'time'],
  },
];

export type { QuickAction, QuickActionsProps, ContextMenuItem, ContextMenuProps };
