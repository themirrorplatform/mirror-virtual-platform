/**
 * Keyboard Navigation Hook
 * 
 * Constitutional Principles:
 * - 100% keyboard accessible (true accessibility)
 * - Visible focus indicators
 * - Logical tab order
 * - Escape always works
 */

import { useEffect, useRef, useState } from 'react';

export interface KeyboardNavigationConfig {
  enabled?: boolean;
  trapFocus?: boolean; // For modals
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shift: boolean) => void;
}

/**
 * Complete keyboard navigation for lists/grids
 */
export function useKeyboardNavigation<T>(
  items: T[],
  config: {
    onSelect?: (item: T, index: number) => void;
    onEscape?: () => void;
    loop?: boolean; // Should arrow keys loop around?
    orientation?: 'vertical' | 'horizontal' | 'grid';
    gridColumns?: number;
  } = {}
) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { orientation = 'vertical', loop = false, gridColumns = 1 } = config;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (orientation === 'vertical' || orientation === 'grid') {
            setSelectedIndex(prev => {
              const next = prev + (orientation === 'grid' ? gridColumns : 1);
              if (next >= items.length) {
                return loop ? 0 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (orientation === 'vertical' || orientation === 'grid') {
            setSelectedIndex(prev => {
              const next = prev - (orientation === 'grid' ? gridColumns : 1);
              if (next < 0) {
                return loop ? items.length - 1 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (orientation === 'horizontal' || orientation === 'grid') {
            setSelectedIndex(prev => {
              const next = prev + 1;
              if (next >= items.length) {
                return loop ? 0 : prev;
              }
              return next;
            });
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (orientation === 'horizontal' || orientation === 'grid') {
            setSelectedIndex(prev => {
              const next = prev - 1;
              if (next < 0) {
                return loop ? items.length - 1 : prev;
              }
              return next;
            });
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            config.onSelect?.(items[selectedIndex], selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          config.onEscape?.();
          break;

        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, selectedIndex, config]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const items = containerRef.current.querySelectorAll('[data-keyboard-item]');
      const item = items[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return {
    containerRef,
    selectedIndex,
    setSelectedIndex,
    getItemProps: (index: number) => ({
      'data-keyboard-item': true,
      'data-selected': index === selectedIndex,
      'tabIndex': index === selectedIndex ? 0 : -1,
      'role': 'option',
      'aria-selected': index === selectedIndex,
    }),
  };
}

/**
 * Focus trap for modals/dialogs
 */
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return containerRef;
}

/**
 * Roving tabindex for toolbars/menubars
 */
export function useRovingTabIndex(itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setActiveIndex((index + 1) % itemCount);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        setActiveIndex((index - 1 + itemCount) % itemCount);
        break;

      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    getItemProps: (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e.nativeEvent, index),
      'aria-selected': index === activeIndex,
    }),
  };
}

/**
 * Skip links for screen readers
 */
export function useSkipLinks() {
  const [skipTarget, setSkipTarget] = useState<string | null>(null);

  const skipTo = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSkipTarget(targetId);
    }
  };

  return {
    skipTo,
    SkipLink: ({ targetId, children }: { targetId: string; children: React.ReactNode }) => (
      <a
        href={`#${targetId}`}
        onClick={(e) => {
          e.preventDefault();
          skipTo(targetId);
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--color-bg-primary)] focus:p-4 focus:rounded-lg focus:border-2 focus:border-[var(--color-accent-gold)]"
      >
        {children}
      </a>
    ),
  };
}

/**
 * Custom keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.ctrlKey && 'ctrl',
        e.metaKey && 'meta',
        e.shiftKey && 'shift',
        e.altKey && 'alt',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const handler = shortcuts[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Announce changes to screen readers
 */
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000);
  };

  const Announcer = () => (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, Announcer };
}
