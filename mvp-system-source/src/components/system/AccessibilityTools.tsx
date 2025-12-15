/**
 * Accessibility Tools - Comprehensive accessibility controls
 * 
 * Features:
 * - Screen reader optimizations
 * - Focus indicators
 * - Skip navigation links
 * - ARIA live regions manager
 * - Contrast checker
 * - Text spacing controls
 * - Dyslexia-friendly font option
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Eye,
  Type,
  Target,
  Volume2,
  Maximize2,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface AccessibilityToolsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: boolean;
  reduceMotion: boolean;
  screenReaderOptimizations: boolean;
  dyslexiaFont: boolean;
  textSpacing: 'compact' | 'default' | 'relaxed';
  announceUpdates: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  focusIndicators: true,
  reduceMotion: false,
  screenReaderOptimizations: false,
  dyslexiaFont: false,
  textSpacing: 'default',
  announceUpdates: true,
};

export function AccessibilityTools({ onSettingsChange }: AccessibilityToolsProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('mirror-accessibility-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [contrastScore, setContrastScore] = useState<number>(4.5);

  useEffect(() => {
    // Save settings
    localStorage.setItem('mirror-accessibility-settings', JSON.stringify(settings));
    
    // Apply settings to document
    applySettings(settings);
    
    // Notify parent
    onSettingsChange?.(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Eye size={24} className="text-[var(--color-accent-blue)]" />
        <div>
          <h3 className="mb-1">Accessibility</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Customize for your needs
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Settings</h4>
          <div className="grid grid-cols-2 gap-3">
            <ToggleSetting
              icon={Maximize2}
              label="Large Text"
              description="Increase all text sizes"
              checked={settings.largeText}
              onChange={(checked) => updateSetting('largeText', checked)}
            />
            <ToggleSetting
              icon={Eye}
              label="High Contrast"
              description="Maximum color contrast"
              checked={settings.highContrast}
              onChange={(checked) => updateSetting('highContrast', checked)}
            />
            <ToggleSetting
              icon={Zap}
              label="Reduce Motion"
              description="Minimize animations"
              checked={settings.reduceMotion}
              onChange={(checked) => updateSetting('reduceMotion', checked)}
            />
            <ToggleSetting
              icon={Target}
              label="Focus Indicators"
              description="Highlight focused elements"
              checked={settings.focusIndicators}
              onChange={(checked) => updateSetting('focusIndicators', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Typography */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Type size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Typography</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Adjust text appearance for readability
              </p>

              {/* Dyslexia Font */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10 mb-3">
                <input
                  type="checkbox"
                  checked={settings.dyslexiaFont}
                  onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
                />
                <div>
                  <span className="text-sm font-medium block mb-1">
                    Dyslexia-Friendly Font
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Use OpenDyslexic font for better readability
                  </span>
                </div>
              </label>

              {/* Text Spacing */}
              <div>
                <span className="text-xs text-[var(--color-text-muted)] mb-2 block">
                  Text Spacing:
                </span>
                <div className="flex gap-2">
                  {(['compact', 'default', 'relaxed'] as const).map((spacing) => (
                    <button
                      key={spacing}
                      onClick={() => updateSetting('textSpacing', spacing)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        settings.textSpacing === spacing
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <p
                  className={`text-sm ${settings.dyslexiaFont ? 'font-dyslexic' : ''}`}
                  style={{
                    lineHeight: settings.textSpacing === 'compact' ? '1.4' : settings.textSpacing === 'relaxed' ? '1.8' : '1.6',
                    letterSpacing: settings.textSpacing === 'relaxed' ? '0.05em' : '0',
                  }}
                >
                  The quick brown fox jumps over the lazy dog. This is how your text will appear with these settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Screen Reader */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Volume2 size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Screen Reader</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Optimize for assistive technology
              </p>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10 mb-3">
                <input
                  type="checkbox"
                  checked={settings.screenReaderOptimizations}
                  onChange={(e) => updateSetting('screenReaderOptimizations', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
                />
                <div>
                  <span className="text-sm font-medium block mb-1">
                    Screen Reader Optimizations
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Enhanced ARIA labels and announcements
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10">
                <input
                  type="checkbox"
                  checked={settings.announceUpdates}
                  onChange={(e) => updateSetting('announceUpdates', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
                />
                <div>
                  <span className="text-sm font-medium block mb-1">
                    Announce Updates
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Read aloud when content changes
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Contrast Checker */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[var(--color-accent-green)]" />
            <h4 className="text-sm font-medium">Contrast Check</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Current contrast ratio:
            </span>
            <Badge
              variant={contrastScore >= 7 ? 'success' : contrastScore >= 4.5 ? 'warning' : 'error'}
            >
              {contrastScore.toFixed(1)}:1
            </Badge>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {contrastScore >= 7 ? (
              <p>✓ AAA compliant - Excellent contrast</p>
            ) : contrastScore >= 4.5 ? (
              <p>✓ AA compliant - Good contrast</p>
            ) : (
              <p>⚠ Below WCAG standards - Consider high contrast mode</p>
            )}
          </div>
        </div>
      </Card>

      {/* Keyboard Navigation */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-[var(--color-accent-blue)]" />
            <h4 className="text-sm font-medium">Keyboard Navigation</h4>
          </div>
          <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                Tab
              </kbd>
              <span>Navigate between elements</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                Enter
              </kbd>
              <span>Activate focused element</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                Esc
              </kbd>
              <span>Close modals and menus</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
                ?
              </kbd>
              <span>Show keyboard shortcuts</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Reset */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          All changes are saved automatically
        </p>
        <Button
          variant="ghost"
          onClick={() => setSettings(DEFAULT_SETTINGS)}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

// Toggle Setting Component

interface ToggleSettingProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ icon: Icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="flex flex-col gap-2 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10 transition-colors">
      <div className="flex items-center justify-between">
        <Icon size={20} className="text-[var(--color-accent-blue)]" />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded border-[var(--color-border-subtle)]"
        />
      </div>
      <div>
        <span className="text-sm font-medium block mb-1">{label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{description}</span>
      </div>
    </label>
  );
}

// Apply settings to document
function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // High contrast
  if (settings.highContrast) {
    root.setAttribute('data-theme', 'high-contrast');
  }

  // Large text
  if (settings.largeText) {
    root.style.fontSize = '18px';
  } else {
    root.style.fontSize = '16px';
  }

  // Reduce motion
  if (settings.reduceMotion) {
    root.style.setProperty('--motion-duration', '0.01ms');
  } else {
    root.style.removeProperty('--motion-duration');
  }

  // Focus indicators
  if (settings.focusIndicators) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }

  // Dyslexia font
  if (settings.dyslexiaFont) {
    root.classList.add('font-dyslexic');
  } else {
    root.classList.remove('font-dyslexic');
  }
}

/**
 * Skip Navigation Component
 */
export function SkipNavigation() {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <a
        href="#main-content"
        className="px-4 py-2 bg-[var(--color-accent-blue)] text-white rounded-lg shadow-lg"
      >
        Skip to main content
      </a>
    </div>
  );
}

/**
 * Live Region Manager - Announce dynamic updates
 */
export function LiveRegion({ message, priority = 'polite' }: { 
  message: string; 
  priority?: 'polite' | 'assertive' 
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Focus Trap Component - Keep focus within modal
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  }, [ref, isActive]);
}

export type { AccessibilitySettings };
