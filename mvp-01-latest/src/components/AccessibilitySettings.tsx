import { useState } from 'react';
import { Eye, Type, Zap, Moon, Keyboard } from 'lucide-react';
import { motion } from 'motion/react';

interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largerText: boolean;
  keyboardShortcuts: boolean;
  darkMode: boolean;
}

interface AccessibilitySettingsProps {
  preferences: AccessibilityPreferences;
  onChange: (preferences: AccessibilityPreferences) => void;
}

export function AccessibilitySettings({
  preferences,
  onChange,
}: AccessibilitySettingsProps) {
  const handleToggle = (key: keyof AccessibilityPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="mb-2">Accessibility</h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Configure The Mirror to work the way you need it to.
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Reduced motion */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${
                preferences.reducedMotion
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)]'
              }`}>
                <Zap size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm mb-1">Reduced motion</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Minimize animations and transitions. Useful for motion sensitivity or focus needs.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('reducedMotion')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.reducedMotion
                  ? 'bg-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)]'
              }`}
            >
              <motion.div
                animate={{
                  x: preferences.reducedMotion ? 24 : 2,
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>
        </div>

        {/* High contrast */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${
                preferences.highContrast
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)]'
              }`}>
                <Eye size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm mb-1">High contrast</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Increase contrast between text and backgrounds for better readability.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('highContrast')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.highContrast
                  ? 'bg-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)]'
              }`}
            >
              <motion.div
                animate={{
                  x: preferences.highContrast ? 24 : 2,
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>
        </div>

        {/* Larger text */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${
                preferences.largerText
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)]'
              }`}>
                <Type size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm mb-1">Larger text</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Increase base font size across The Mirror for easier reading.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('largerText')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.largerText
                  ? 'bg-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)]'
              }`}
            >
              <motion.div
                animate={{
                  x: preferences.largerText ? 24 : 2,
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg ${
                preferences.keyboardShortcuts
                  ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)]'
              }`}>
                <Keyboard size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm mb-1">Keyboard shortcuts</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  Enable keyboard navigation and shortcuts for faster access.
                </p>
                {preferences.keyboardShortcuts && (
                  <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 rounded bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
                        Cmd+N
                      </kbd>
                      <span>New reflection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 rounded bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
                        Cmd+K
                      </kbd>
                      <span>Search</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 rounded bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
                        Cmd+,
                      </kbd>
                      <span>Settings</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggle('keyboardShortcuts')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.keyboardShortcuts
                  ? 'bg-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-base-raised)]'
              }`}
            >
              <motion.div
                animate={{
                  x: preferences.keyboardShortcuts ? 24 : 2,
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Screen reader note */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <h4 className="text-sm mb-2">Screen reader support</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          The Mirror includes ARIA labels and semantic HTML for screen reader compatibility. 
          If you encounter accessibility issues, please report them.
        </p>
      </div>
    </div>
  );
}

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largerText: false,
  keyboardShortcuts: true,
  darkMode: true,
};
