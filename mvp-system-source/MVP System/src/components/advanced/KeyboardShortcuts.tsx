/**
 * Keyboard Shortcuts - Accessible keyboard navigation
 * 
 * Features:
 * - Global shortcuts
 * - Context-aware shortcuts
 * - Shortcut helper modal
 * - Customizable bindings
 * - Accessibility-first
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, Command, Search, X } from 'lucide-react';
import { Modal } from '../Modal';
import { Card } from '../Card';
import { Button } from '../Button';

interface Shortcut {
  id: string;
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  description: string;
  category: string;
  action: () => void;
  enabled?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  onShortcutTrigger?: (shortcutId: string) => void;
}

export function KeyboardShortcuts({ shortcuts, onShortcutTrigger }: KeyboardShortcutsProps) {
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show helper with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowHelper(true);
          return;
        }
      }

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        if (!shortcut.enabled && shortcut.enabled !== undefined) continue;

        const modifiersMatch =
          (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
          shortcut.modifiers.every(mod => {
            switch (mod) {
              case 'ctrl':
                return e.ctrlKey;
              case 'shift':
                return e.shiftKey;
              case 'alt':
                return e.altKey;
              case 'meta':
                return e.metaKey;
              default:
                return false;
            }
          });

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (modifiersMatch && keyMatch) {
          const target = e.target as HTMLElement;
          // Don't trigger shortcuts in input fields unless it's a navigation shortcut
          if (
            (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
            !shortcut.modifiers?.includes('meta') &&
            !shortcut.modifiers?.includes('ctrl')
          ) {
            continue;
          }

          e.preventDefault();
          shortcut.action();
          onShortcutTrigger?.(shortcut.id);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, onShortcutTrigger]);

  return (
    <>
      {/* Helper Button */}
      <button
        onClick={() => setShowHelper(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-[var(--color-surface-card)] shadow-lg hover:shadow-xl transition-all z-40"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard size={20} className="text-[var(--color-accent-blue)]" />
      </button>

      {/* Shortcuts Helper Modal */}
      <ShortcutsHelper
        isOpen={showHelper}
        onClose={() => setShowHelper(false)}
        shortcuts={shortcuts}
      />
    </>
  );
}

/**
 * Shortcuts Helper Modal
 */
interface ShortcutsHelperProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

function ShortcutsHelper({ isOpen, onClose, shortcuts }: ShortcutsHelperProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch =
      !search ||
      shortcut.description.toLowerCase().includes(search.toLowerCase()) ||
      shortcut.key.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !activeCategory || shortcut.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = filteredShortcuts.filter(s => s.category === category);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shortcuts..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
              activeCategory === null
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
                activeCategory === category
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Shortcuts List */}
        <div className="max-h-96 overflow-y-auto space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => {
            if (shortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map(shortcut => (
                    <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Press <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] font-mono">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Shortcut Row
 */
function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const getModifierSymbol = (modifier: string) => {
    if (isMac) {
      switch (modifier) {
        case 'meta':
          return '⌘';
        case 'ctrl':
          return '⌃';
        case 'shift':
          return '⇧';
        case 'alt':
          return '⌥';
        default:
          return modifier;
      }
    }
    return modifier.charAt(0).toUpperCase() + modifier.slice(1);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <span className="text-sm text-[var(--color-text-secondary)]">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {shortcut.modifiers?.map(mod => (
          <kbd
            key={mod}
            className="px-2 py-1 rounded bg-[var(--color-surface-card)] text-xs font-mono border border-[var(--color-border-subtle)]"
          >
            {getModifierSymbol(mod)}
          </kbd>
        ))}
        <kbd className="px-2 py-1 rounded bg-[var(--color-surface-card)] text-xs font-mono border border-[var(--color-border-subtle)]">
          {shortcut.key.toUpperCase()}
        </kbd>
      </div>
    </div>
  );
}

/**
 * useKeyboardShortcuts Hook
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [triggeredShortcut, setTriggeredShortcut] = useState<string | null>(null);

  useEffect(() => {
    if (triggeredShortcut) {
      const timer = setTimeout(() => setTriggeredShortcut(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [triggeredShortcut]);

  const handleShortcutTrigger = useCallback((shortcutId: string) => {
    setTriggeredShortcut(shortcutId);
  }, []);

  return {
    triggeredShortcut,
    handleShortcutTrigger,
  };
}

/**
 * Default Shortcuts Configuration
 */
export const defaultShortcuts: Omit<Shortcut, 'action'>[] = [
  // Navigation
  {
    id: 'goto-mirror',
    key: 'm',
    modifiers: ['meta'],
    description: 'Go to Mirror',
    category: 'Navigation',
  },
  {
    id: 'goto-threads',
    key: 't',
    modifiers: ['meta'],
    description: 'Go to Threads',
    category: 'Navigation',
  },
  {
    id: 'goto-world',
    key: 'w',
    modifiers: ['meta'],
    description: 'Go to World',
    category: 'Navigation',
  },
  {
    id: 'goto-archive',
    key: 'a',
    modifiers: ['meta'],
    description: 'Go to Archive',
    category: 'Navigation',
  },
  {
    id: 'goto-self',
    key: 's',
    modifiers: ['meta'],
    description: 'Go to Self',
    category: 'Navigation',
  },

  // Actions
  {
    id: 'new-reflection',
    key: 'n',
    modifiers: ['meta'],
    description: 'Begin reflection',
    category: 'Actions',
  },
  {
    id: 'save',
    key: 's',
    modifiers: ['meta'],
    description: 'Save',
    category: 'Actions',
  },
  {
    id: 'search',
    key: 'k',
    modifiers: ['meta'],
    description: 'Search',
    category: 'Actions',
  },
  {
    id: 'filter',
    key: 'f',
    modifiers: ['meta'],
    description: 'Filter',
    category: 'Actions',
  },

  // Editing
  {
    id: 'undo',
    key: 'z',
    modifiers: ['meta'],
    description: 'Undo',
    category: 'Editing',
  },
  {
    id: 'redo',
    key: 'z',
    modifiers: ['meta', 'shift'],
    description: 'Redo',
    category: 'Editing',
  },

  // View
  {
    id: 'focus-mode',
    key: 'f',
    modifiers: ['meta', 'shift'],
    description: 'Toggle focus mode',
    category: 'View',
  },
  {
    id: 'zen-mode',
    key: 'z',
    modifiers: ['meta', 'shift'],
    description: 'Toggle zen mode',
    category: 'View',
  },

  // Help
  {
    id: 'shortcuts',
    key: '?',
    description: 'Show shortcuts',
    category: 'Help',
  },
];

/**
 * Shortcut Indicator - Show when shortcut is triggered
 */
interface ShortcutIndicatorProps {
  shortcut: Shortcut | null;
}

export function ShortcutIndicator({ shortcut }: ShortcutIndicatorProps) {
  if (!shortcut) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      >
        <Card className="shadow-lg">
          <div className="flex items-center gap-3">
            <Command size={16} className="text-[var(--color-accent-blue)]" />
            <span className="text-sm">{shortcut.description}</span>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Custom Shortcut Editor - Allow users to customize shortcuts
 */
interface CustomShortcutEditorProps {
  shortcuts: Shortcut[];
  onUpdate: (shortcuts: Shortcut[]) => void;
}

export function CustomShortcutEditor({ shortcuts, onUpdate }: CustomShortcutEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const startEdit = (shortcut: Shortcut) => {
    setEditingId(shortcut.id);
    setEditingShortcut({ ...shortcut });
  };

  const saveEdit = () => {
    if (editingShortcut) {
      const updated = shortcuts.map(s =>
        s.id === editingShortcut.id ? editingShortcut : s
      );
      onUpdate(updated);
    }
    setEditingId(null);
    setEditingShortcut(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingShortcut(null);
  };

  const toggleEnabled = (id: string) => {
    const updated = shortcuts.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-2">
      {shortcuts.map(shortcut => (
        <Card key={shortcut.id} variant="emphasis">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">{shortcut.description}</p>
              <div className="flex items-center gap-1">
                {shortcut.modifiers?.map(mod => (
                  <kbd
                    key={mod}
                    className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs font-mono"
                  >
                    {mod}
                  </kbd>
                ))}
                <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortcut.enabled !== false}
                  onChange={() => toggleEnabled(shortcut.id)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs text-[var(--color-text-muted)]">Enabled</span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(shortcut)}
              >
                Edit
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export type { Shortcut, KeyboardShortcutsProps };
