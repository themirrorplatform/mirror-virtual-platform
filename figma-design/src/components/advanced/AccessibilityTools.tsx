/**
 * Accessibility Tools - Comprehensive accessibility features
 * 
 * Features:
 * - Screen reader optimization
 * - Keyboard navigation
 * - Focus management
 * - High contrast mode
 * - Text size controls
 * - Motion reduction
 * - ARIA labels and roles
 * - Skip links
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Accessibility,
  Eye,
  Type,
  Contrast,
  MousePointer,
  Keyboard,
  Volume2,
  Check,
  Zap
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
  keyboardNavOnly: boolean;
}

interface AccessibilityToolsProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
}

export function AccessibilityTools({ settings, onSettingsChange }: AccessibilityToolsProps) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-20 right-6 p-3 rounded-full bg-[var(--color-accent-blue)] text-white shadow-lg hover:shadow-xl transition-all z-40"
        aria-label="Accessibility Settings"
      >
        <Accessibility size={24} />
      </button>

      {/* Settings Panel */}
      <Modal
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        title="Accessibility Settings"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Customize your experience for better accessibility
          </p>

          <div className="space-y-3">
            <AccessibilityOption
              icon={Contrast}
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
              checked={settings.highContrast}
              onChange={(checked) => onSettingsChange({ highContrast: checked })}
            />

            <AccessibilityOption
              icon={Type}
              label="Large Text"
              description="Increase base text size throughout the app"
              checked={settings.largeText}
              onChange={(checked) => onSettingsChange({ largeText: checked })}
            />

            <AccessibilityOption
              icon={Zap}
              label="Reduce Motion"
              description="Minimize animations and transitions"
              checked={settings.reducedMotion}
              onChange={(checked) => onSettingsChange({ reducedMotion: checked })}
            />

            <AccessibilityOption
              icon={Volume2}
              label="Screen Reader Optimization"
              description="Enhanced support for screen readers"
              checked={settings.screenReaderMode}
              onChange={(checked) => onSettingsChange({ screenReaderMode: checked })}
            />

            <AccessibilityOption
              icon={MousePointer}
              label="Enhanced Focus Indicators"
              description="More visible focus outlines"
              checked={settings.focusIndicators}
              onChange={(checked) => onSettingsChange({ focusIndicators: checked })}
            />

            <AccessibilityOption
              icon={Keyboard}
              label="Keyboard Navigation Only"
              description="Disable mouse interactions for keyboard-only use"
              checked={settings.keyboardNavOnly}
              onChange={(checked) => onSettingsChange({ keyboardNavOnly: checked })}
            />
          </div>

          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            <Button
              variant="ghost"
              onClick={() => {
                onSettingsChange({
                  highContrast: false,
                  largeText: false,
                  reducedMotion: false,
                  screenReaderMode: false,
                  focusIndicators: false,
                  keyboardNavOnly: false,
                });
              }}
              className="w-full"
            >
              Reset All
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Accessibility Option Component

interface AccessibilityOptionProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function AccessibilityOption({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: AccessibilityOptionProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
      <Icon size={20} className="text-[var(--color-accent-blue)] mt-1 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-sm mb-1">{label}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded mt-1 flex-shrink-0"
      />
    </label>
  );
}

/**
 * Skip Links - Navigation shortcuts for keyboard users
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-[var(--color-accent-blue)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="fixed top-4 left-4 mt-12 z-50 px-4 py-2 bg-[var(--color-accent-blue)] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
      >
        Skip to navigation
      </a>
    </div>
  );
}

/**
 * Focus Trap - Keep focus within modal/dialog
 */
export function useFocusTrap(elementRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const element = elementRef.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive, elementRef]);
}

/**
 * Announce - Screen reader announcements
 */
interface AnnounceProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function Announce({ message, politeness = 'polite' }: AnnounceProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * useAnnounce Hook - Programmatic announcements
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  };

  return {
    announce,
    Announcer: () => announcement ? <Announce message={announcement} /> : null,
  };
}

/**
 * Keyboard Navigation Helper
 */
export function useKeyboardNavigation(
  onNext?: () => void,
  onPrevious?: () => void,
  onSelect?: () => void,
  onEscape?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onSelect, onEscape]);
}

/**
 * Focus Visible Indicator
 */
export function FocusIndicator() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!isFocusVisible) return null;

  return (
    <style>{`
      *:focus {
        outline: 3px solid var(--color-accent-blue) !important;
        outline-offset: 2px !important;
      }
    `}</style>
  );
}

/**
 * Landmark Regions - Semantic HTML helpers
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" role="main">
      {children}
    </main>
  );
}

export function Navigation({ children }: { children: React.ReactNode }) {
  return (
    <nav id="navigation" role="navigation" aria-label="Main navigation">
      {children}
    </nav>
  );
}

export function Complementary({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <aside role="complementary" aria-label={label}>
      {children}
    </aside>
  );
}

/**
 * Accessible Form Field
 */
interface AccessibleFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function AccessibleField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: AccessibleFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium block">
        {label}
        {required && <span className="text-[var(--color-border-error)] ml-1">*</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}

      <div
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : undefined}
      >
        {children}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-border-error)]">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible Button with loading state
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      aria-busy={isLoading}
      aria-live="polite"
      disabled={isLoading || props.disabled}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

/**
 * useAccessibility Hook - Manage accessibility state
 */
export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      highContrast: false,
      largeText: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      screenReaderMode: false,
      focusIndicators: true,
      keyboardNavOnly: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // Apply settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return {
    settings,
    updateSettings,
  };
}

/**
 * Accessibility Checker - Development tool
 */
export function AccessibilityChecker() {
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const checkAccessibility = () => {
      const newIssues: string[] = [];

      // Check for images without alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        newIssues.push(`${images.length} images missing alt text`);
      }

      // Check for buttons without labels
      const buttons = document.querySelectorAll('button:not([aria-label]):not(:has(*))');
      if (buttons.length > 0) {
        newIssues.push(`${buttons.length} buttons missing labels`);
      }

      // Check for inputs without labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
      if (inputs.length > 0) {
        newIssues.push(`${inputs.length} inputs missing labels`);
      }

      setIssues(newIssues);
    };

    checkAccessibility();
    const interval = setInterval(checkAccessibility, 5000);

    return () => clearInterval(interval);
  }, []);

  if (issues.length === 0) return null;

  return (
    <Card className="fixed bottom-24 left-4 max-w-sm z-50">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Accessibility size={16} className="text-[var(--color-accent-yellow)]" />
          <h4 className="text-sm font-medium">Accessibility Issues</h4>
        </div>
        <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
          {issues.map((issue, index) => (
            <li key={index}>• {issue}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export type { AccessibilitySettings, AccessibilityToolsProps };
