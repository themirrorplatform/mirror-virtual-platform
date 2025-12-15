/**
 * Keyboard Shortcuts - Accessible keyboard navigation
 * 
 * Features:
 * - Global shortcuts display
 * - Context-aware shortcuts
 * - Visual shortcut hints
 * - Customizable bindings
 * - Help modal
 * - No forced shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Command,
  Search,
  Edit,
  Save,
  Settings,
  HelpCircle,
  X,
  Keyboard,
  Info
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: 'navigation' | 'editing' | 'system' | 'mirror';
  action: () => void;
  enabled?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  onToggleShortcut?: (shortcutId: string, enabled: boolean) => void;
  onCustomizeShortcut?: (shortcutId: string, newKeys: string[]) => void;
}

const CATEGORY_CONFIG = {
  navigation: {
    label: 'Navigation',
    description: 'Move around the interface',
    color: '#3B82F6',
  },
  editing: {
    label: 'Editing',
    description: 'Text and content editing',
    color: '#8B5CF6',
  },
  mirror: {
    label: 'Mirror',
    description: 'Reflection-specific actions',
    color: '#10B981',
  },
  system: {
    label: 'System',
    description: 'Application controls',
    color: '#64748B',
  },
};

export function KeyboardShortcuts({
  shortcuts,
  onToggleShortcut,
  onCustomizeShortcut,
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Listen for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKeys(prev => new Set(prev).add(e.key.toLowerCase()));

      // Find matching shortcut
      const matchedShortcut = shortcuts.find(shortcut => {
        if (!shortcut.enabled) return false;
        
        const keys = shortcut.keys.map(k => k.toLowerCase());
        const pressed = Array.from(activeKeys);
        pressed.push(e.key.toLowerCase());

        return keys.length === pressed.length &&
               keys.every(k => pressed.includes(k));
      });

      if (matchedShortcut) {
        e.preventDefault();
        matchedShortcut.action();
        setActiveKeys(new Set());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts, activeKeys]);

  // Help modal shortcut (? key)
  useEffect(() => {
    const handleHelpKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp(true);
      }
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleHelpKey);
    return () => window.removeEventListener('keydown', handleHelpKey);
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Floating Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-[var(--color-accent-blue)] text-white shadow-lg hover:shadow-xl transition-all z-40"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard size={20} />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Keyboard size={24} className="text-[var(--color-accent-blue)]" />
                      <div>
                        <h2 className="mb-1">Keyboard Shortcuts</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Press <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)]">?</kbd> to show this help
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}>
                      <X size={20} />
                    </Button>
                  </div>

                  {/* Shortcuts by Category */}
                  <div className="space-y-6">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
                      const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-1 h-6 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                            <div>
                              <h3 className="text-sm font-medium">{config.label}</h3>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {config.description}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {categoryShortcuts.map(shortcut => (
                              <ShortcutRow
                                key={shortcut.id}
                                shortcut={shortcut}
                                onToggle={onToggleShortcut}
                                onCustomize={onCustomizeShortcut}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Constitutional Notice */}
                  <Card className="border-2 border-[var(--color-accent-blue)]">
                    <div className="flex items-start gap-3">
                      <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        <p className="mb-2">
                          <strong>Shortcuts are optional.</strong> The Mirror is fully functional 
                          without keyboard shortcuts. They exist for those who prefer them.
                        </p>
                        <p className="text-[var(--color-text-muted)]">
                          You can disable any shortcut if it conflicts with your workflow or 
                          assistive technology.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Shortcut Row

interface ShortcutRowProps {
  shortcut: Shortcut;
  onToggle?: (shortcutId: string, enabled: boolean) => void;
  onCustomize?: (shortcutId: string, newKeys: string[]) => void;
}

function ShortcutRow({ shortcut, onToggle, onCustomize }: ShortcutRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const enabled = shortcut.enabled !== false;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        enabled
          ? 'bg-[var(--color-surface-hover)]'
          : 'bg-[var(--color-surface-hover)] opacity-50'
      }`}
    >
      <div className="flex-1">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {shortcut.description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Keys Display */}
        <div className="flex items-center gap-1">
          {shortcut.keys.map((key, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-[var(--color-text-muted)]">+</span>}
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs font-medium">
                {formatKey(key)}
              </kbd>
            </span>
          ))}
        </div>

        {/* Toggle */}
        {onToggle && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(shortcut.id, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[var(--color-border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-accent-blue)]"></div>
          </label>
        )}
      </div>
    </div>
  );
}

// Utility Functions

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'meta': '⌘',
    'cmd': '⌘',
    'command': '⌘',
    'ctrl': '⌃',
    'control': '⌃',
    'alt': '⌥',
    'option': '⌥',
    'shift': '⇧',
    'enter': '↵',
    'return': '↵',
    'escape': 'Esc',
    'esc': 'Esc',
    'backspace': '⌫',
    'delete': '⌦',
    'tab': '⇥',
    'space': '␣',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
  };

  const lowercaseKey = key.toLowerCase();
  return keyMap[lowercaseKey] || key.toUpperCase();
}

/**
 * Shortcut Hint - Inline shortcut display
 */
interface ShortcutHintProps {
  keys: string[];
  size?: 'sm' | 'md';
}

export function ShortcutHint({ keys, size = 'md' }: ShortcutHintProps) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className={`text-[var(--color-text-muted)] ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              +
            </span>
          )}
          <kbd
            className={`px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] font-medium ${
              size === 'sm' ? 'text-xs' : 'text-xs'
            }`}
          >
            {formatKey(key)}
          </kbd>
        </span>
      ))}
    </div>
  );
}

/**
 * useKeyboardShortcut Hook - Register shortcuts in components
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: { enabled?: boolean; preventDefault?: boolean } = {}
) {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const pressedKeys = [];
      if (e.metaKey || e.ctrlKey) pressedKeys.push('meta');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.altKey) pressedKeys.push('alt');
      pressedKeys.push(e.key.toLowerCase());

      const normalizedKeys = keys.map(k => k.toLowerCase());
      const matches =
        pressedKeys.length === normalizedKeys.length &&
        normalizedKeys.every(k => pressedKeys.includes(k));

      if (matches) {
        if (preventDefault) e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keys, callback, enabled, preventDefault]);
}

/**
 * Default Shortcuts Configuration
 */
export const DEFAULT_SHORTCUTS: Omit<Shortcut, 'action'>[] = [
  // Navigation
  { id: 'nav-mirror', keys: ['meta', 'm'], description: 'Go to Mirror', category: 'navigation' },
  { id: 'nav-threads', keys: ['meta', 't'], description: 'Go to Threads', category: 'navigation' },
  { id: 'nav-world', keys: ['meta', 'w'], description: 'Go to World', category: 'navigation' },
  { id: 'nav-archive', keys: ['meta', 'a'], description: 'Go to Archive', category: 'navigation' },
  { id: 'nav-self', keys: ['meta', ','], description: 'Go to Self', category: 'navigation' },
  { id: 'nav-search', keys: ['meta', 'k'], description: 'Open search', category: 'navigation' },

  // Editing
  { id: 'edit-save', keys: ['meta', 's'], description: 'Save reflection', category: 'editing' },
  { id: 'edit-focus', keys: ['meta', 'e'], description: 'Focus editor', category: 'editing' },
  { id: 'edit-clear', keys: ['meta', 'shift', 'c'], description: 'Clear editor', category: 'editing' },

  // Mirror
  { id: 'mirror-new', keys: ['meta', 'n'], description: 'New reflection', category: 'mirror' },
  { id: 'mirror-request', keys: ['meta', 'r'], description: 'Request mirrorback', category: 'mirror' },
  { id: 'mirror-lens', keys: ['meta', 'l'], description: 'Open lens menu', category: 'mirror' },

  // System
  { id: 'sys-help', keys: ['?'], description: 'Show keyboard shortcuts', category: 'system' },
  { id: 'sys-settings', keys: ['meta', ','], description: 'Open settings', category: 'system' },
  { id: 'sys-notifications', keys: ['meta', 'shift', 'n'], description: 'Toggle notifications', category: 'system' },
];

export type { Shortcut, ShortcutRowProps };
