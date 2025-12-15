/**
 * Theme Customizer - Adaptive theme system controls
 * 
 * Features:
 * - Light / Dark / High Contrast modes
 * - Auto theme switching
 * - Color temperature adjustment
 * - Font size scaling
 * - Reduced motion toggle
 * - Preview changes live
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sun,
  Moon,
  Monitor,
  Contrast,
  Type,
  Zap,
  Eye,
  Check,
  Palette
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface ThemeCustomizerProps {
  currentTheme: 'light' | 'dark' | 'high-contrast';
  autoTheme: boolean;
  fontSize: number;
  reducedMotion: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
  onAutoThemeChange: (enabled: boolean) => void;
  onFontSizeChange: (size: number) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

type ThemeMode = 'light' | 'dark' | 'high-contrast';

const THEME_CONFIG = {
  light: {
    label: 'Light',
    description: 'Paper and ink',
    icon: Sun,
    color: '#F59E0B',
    preview: {
      bg: '#F6F5F2',
      text: '#1F2937',
      accent: '#3B82F6',
    },
  },
  dark: {
    label: 'Dark',
    description: 'Slate and glow',
    icon: Moon,
    color: '#8B5CF6',
    preview: {
      bg: '#14161A',
      text: '#F9FAFB',
      accent: '#3B82F6',
    },
  },
  'high-contrast': {
    label: 'High Contrast',
    description: 'Maximum clarity',
    icon: Contrast,
    color: '#10B981',
    preview: {
      bg: '#000000',
      text: '#FFFFFF',
      accent: '#00FF00',
    },
  },
};

const FONT_SIZES = [
  { value: 14, label: 'Small' },
  { value: 16, label: 'Default' },
  { value: 18, label: 'Large' },
  { value: 20, label: 'X-Large' },
];

export function ThemeCustomizer({
  currentTheme,
  autoTheme,
  fontSize,
  reducedMotion,
  onThemeChange,
  onAutoThemeChange,
  onFontSizeChange,
  onReducedMotionChange,
}: ThemeCustomizerProps) {
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>(currentTheme);

  // Detect system preference
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleThemeSelect = (theme: ThemeMode) => {
    setPreviewTheme(theme);
    onThemeChange(theme);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette size={24} className="text-[var(--color-accent-blue)]" />
        <div>
          <h3 className="mb-1">Appearance</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Customize how The Mirror looks and feels
          </p>
        </div>
      </div>

      {/* Auto Theme */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Monitor size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
              <div>
                <h4 className="text-sm font-medium mb-1">Automatic Theme</h4>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Match your system preference
                  {autoTheme && (
                    <span className="ml-1 text-[var(--color-text-muted)]">
                      (Currently: {systemPreference})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoTheme}
                onChange={(e) => onAutoThemeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--color-border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-blue)]"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Theme Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Theme</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(THEME_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = previewTheme === key;
            const isDisabled = autoTheme;

            return (
              <button
                key={key}
                onClick={() => !isDisabled && handleThemeSelect(key as ThemeMode)}
                disabled={isDisabled}
                className={`p-4 rounded-lg text-left transition-all ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-2 shadow-md'
                    : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)]'
                }`}
                style={{
                  borderColor: isSelected && !isDisabled ? config.color : undefined,
                  backgroundColor: isSelected && !isDisabled ? `${config.color}10` : undefined,
                }}
              >
                {/* Preview */}
                <div
                  className="w-full h-24 rounded-lg mb-3 overflow-hidden border border-[var(--color-border-subtle)]"
                  style={{ backgroundColor: config.preview.bg }}
                >
                  <div className="p-3 space-y-2">
                    <div
                      className="w-full h-2 rounded"
                      style={{ backgroundColor: config.preview.text, opacity: 0.8 }}
                    />
                    <div
                      className="w-2/3 h-2 rounded"
                      style={{ backgroundColor: config.preview.text, opacity: 0.6 }}
                    />
                    <div
                      className="w-1/3 h-2 rounded"
                      style={{ backgroundColor: config.preview.accent }}
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} style={{ color: config.color }} />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isSelected && !isDisabled && (
                    <Check size={14} className="ml-auto text-[var(--color-accent-green)]" />
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {config.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Type size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">Font Size</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Adjust the base text size
              </p>

              <div className="flex items-center gap-2">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => onFontSizeChange(size.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      fontSize === size.value
                        ? 'bg-[var(--color-accent-blue)] text-white'
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <p style={{ fontSize: `${fontSize}px` }} className="text-[var(--color-text-secondary)]">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Options */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-[var(--color-accent-blue)]" />
            <h4 className="text-sm font-medium">Accessibility</h4>
          </div>

          {/* Reduced Motion */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => onReducedMotionChange(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} />
                <span className="text-sm font-medium">Reduce Motion</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Minimize animations and transitions. Recommended for motion sensitivity or 
                performance.
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* Preview */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Preview</h4>
          
          <motion.div
            animate={reducedMotion ? {} : { scale: [1, 1.02, 1] }}
            transition={reducedMotion ? {} : { duration: 2, repeat: Infinity }}
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: THEME_CONFIG[previewTheme].preview.bg,
              color: THEME_CONFIG[previewTheme].preview.text,
            }}
          >
            <h5 className="mb-2" style={{ fontSize: `${fontSize}px` }}>
              Sample Heading
            </h5>
            <p className="text-sm mb-3" style={{ fontSize: `${fontSize - 2}px` }}>
              This is how your reflections will appear with these settings. The Mirror 
              adapts to your preferences while maintaining its constitutional principles.
            </p>
            <button
              className="px-3 py-1 rounded-full text-sm"
              style={{ 
                backgroundColor: THEME_CONFIG[previewTheme].preview.accent,
                color: previewTheme === 'high-contrast' ? '#000' : '#fff',
              }}
            >
              Sample Button
            </button>
          </motion.div>
        </div>
      </Card>

      {/* Reset */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() => {
            onThemeChange('light');
            onAutoThemeChange(true);
            onFontSizeChange(16);
            onReducedMotionChange(false);
          }}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

/**
 * Theme Toggle Button - Quick theme switch
 */
interface ThemeToggleProps {
  currentTheme: 'light' | 'dark' | 'high-contrast';
  onToggle: () => void;
}

export function ThemeToggle({ currentTheme, onToggle }: ThemeToggleProps) {
  const Icon = THEME_CONFIG[currentTheme].icon;
  const config = THEME_CONFIG[currentTheme];

  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
      title={`Current theme: ${config.label}`}
    >
      <Icon size={20} style={{ color: config.color }} />
    </button>
  );
}

/**
 * useTheme Hook - Access theme in components
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [autoTheme, setAutoTheme] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('mirror-theme');
    const savedAuto = localStorage.getItem('mirror-auto-theme');
    
    if (saved) setTheme(saved as ThemeMode);
    if (savedAuto) setAutoTheme(savedAuto === 'true');

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('mirror-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const changeAutoTheme = (enabled: boolean) => {
    setAutoTheme(enabled);
    localStorage.setItem('mirror-auto-theme', String(enabled));

    if (enabled) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      changeTheme(prefersDark ? 'dark' : 'light');
    }
  };

  return {
    theme,
    autoTheme,
    changeTheme,
    changeAutoTheme,
  };
}

export type { ThemeMode };
