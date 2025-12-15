import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { X, Command, Option } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Core
  { key: '⌘K', description: 'Command Palette', category: 'Core' },
  { key: '⌘L', description: 'Toggle Layer HUD', category: 'Core' },
  { key: 'Esc', description: 'Close any instrument', category: 'Core' },
  
  // Instruments
  { key: '⌘S', description: 'Speech Contract', category: 'Instruments' },
  { key: '⌘E', description: 'Export reflection', category: 'Instruments' },
  { key: '⌘A', description: 'Archive', category: 'Instruments' },
  { key: '⌘G', description: 'Identity Graph', category: 'Instruments' },
  
  // Multimodal
  { key: 'Alt+V', description: 'Voice reflection', category: 'Multimodal' },
  { key: 'Alt+D', description: 'Video reflection', category: 'Multimodal' },
  { key: 'Alt+L', description: 'Longform mode', category: 'Multimodal' },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <>
      {/* Trigger hint - bottom right with perfect spacing */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-30 p-4 rounded-full bg-[var(--color-surface-card)]/90 backdrop-blur-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/40 shadow-ambient-md shadow-hover-lift transition-all group"
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Keyboard shortcuts (press ?)"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <kbd className="text-sm font-mono text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors">
          ?
        </kbd>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            />

            {/* Panel - enhanced spacing and shadows */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl shadow-ambient-xl overflow-hidden">
                {/* Header - perfect spacing */}
                <div className="px-10 py-8 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-gradient-to-b from-[var(--color-surface-emphasis)]/30 to-transparent">
                  <div>
                    <h3 className="text-[var(--color-text-primary)] mb-2 text-xl font-semibold tracking-tight">Keyboard Shortcuts</h3>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      Navigate The Mirror without leaving the keyboard
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-[var(--color-surface-emphasis)] transition-all shadow-ambient-sm"
                    aria-label="Close"
                  >
                    <X size={20} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>

                {/* Shortcuts by category - enhanced spacing */}
                <div className="px-10 py-8 space-y-10 max-h-[60vh] overflow-y-auto">
                  {categories.map(category => (
                    <div key={category}>
                      <h4 className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-5 font-medium">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {shortcuts
                          .filter(s => s.category === category)
                          .map((shortcut, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04, duration: 0.3 }}
                              className="flex items-center justify-between px-5 py-4 rounded-xl hover:bg-[var(--color-surface-emphasis)] transition-all shadow-ambient-sm hover:shadow-ambient-md"
                            >
                              <span className="text-sm text-[var(--color-text-secondary)] tracking-wide">
                                {shortcut.description}
                              </span>
                              <kbd className="px-4 py-2 rounded-lg bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-accent-gold)] font-mono shadow-ambient-sm tracking-wide">
                                {shortcut.key}
                              </kbd>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  ))}

                  {/* Pro tip - enhanced design */}
                  <div className="pt-8 border-t border-[var(--color-border-subtle)]">
                    <div className="p-6 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/10 shadow-gold-sm">
                      <p className="text-xs text-[var(--color-text-muted)] leading-[1.8] tracking-wide">
                        Press <kbd className="px-2 py-1 mx-1 rounded-md bg-[var(--color-surface-emphasis)] text-[var(--color-accent-gold)] font-mono border border-[var(--color-border-subtle)]">?</kbd> at any time to toggle this panel.
                        Press <kbd className="px-2 py-1 mx-1 rounded-md bg-[var(--color-surface-emphasis)] text-[var(--color-accent-gold)] font-mono border border-[var(--color-border-subtle)]">Esc</kbd> to close any open instrument.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}