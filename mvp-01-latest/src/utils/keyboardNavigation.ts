/**
 * Advanced Keyboard Navigation Utilities
 * Implements roving tabindex and focus management patterns
 */

/**
 * Focus management for lists and grids
 * Implements ARIA authoring practices
 */
export class FocusManager {
  private elements: HTMLElement[] = [];
  private currentIndex: number = 0;

  constructor(elements: HTMLElement[]) {
    this.elements = elements;
    this.updateTabIndex();
  }

  /**
   * Update tabindex values (roving tabindex pattern)
   * Only one element should be tabbable at a time
   */
  private updateTabIndex() {
    this.elements.forEach((el, index) => {
      el.tabIndex = index === this.currentIndex ? 0 : -1;
    });
  }

  /**
   * Focus the current element
   */
  focus() {
    this.elements[this.currentIndex]?.focus();
  }

  /**
   * Move focus to next element
   */
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.updateTabIndex();
    this.focus();
  }

  /**
   * Move focus to previous element
   */
  previous() {
    this.currentIndex = 
      (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.updateTabIndex();
    this.focus();
  }

  /**
   * Move focus to first element
   */
  first() {
    this.currentIndex = 0;
    this.updateTabIndex();
    this.focus();
  }

  /**
   * Move focus to last element
   */
  last() {
    this.currentIndex = this.elements.length - 1;
    this.updateTabIndex();
    this.focus();
  }

  /**
   * Update elements list (when DOM changes)
   */
  update(elements: HTMLElement[]) {
    this.elements = elements;
    this.currentIndex = Math.min(this.currentIndex, elements.length - 1);
    this.updateTabIndex();
  }
}

/**
 * Trap focus within a modal or dialog
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.previousFocus = document.activeElement as HTMLElement;
    this.updateFocusableElements();
  }

  /**
   * Get all focusable elements in container
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(
      this.container.querySelectorAll<HTMLElement>(selector)
    ).filter(el => {
      // Check if element is visible
      return el.offsetParent !== null;
    });
  }

  /**
   * Update first and last focusable elements
   */
  private updateFocusableElements() {
    const focusable = this.getFocusableElements();
    this.firstFocusable = focusable[0] || null;
    this.lastFocusable = focusable[focusable.length - 1] || null;
  }

  /**
   * Handle Tab key press
   */
  handleTab(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    // If no focusable elements, prevent default
    if (!this.firstFocusable) {
      event.preventDefault();
      return;
    }

    // Shift + Tab (going backwards)
    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    }
    // Tab (going forwards)
    else {
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }

  /**
   * Activate the trap
   */
  activate() {
    // Focus first element
    this.firstFocusable?.focus();
  }

  /**
   * Deactivate the trap and restore focus
   */
  deactivate() {
    this.previousFocus?.focus();
  }
}

/**
 * Keyboard event utilities
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

/**
 * Check if key event is an activation key (Enter/Space)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === Keys.ENTER || event.key === Keys.SPACE;
}

/**
 * Check if key event is a navigation key
 */
export function isNavigationKey(event: KeyboardEvent): boolean {
  return [
    Keys.ARROW_UP,
    Keys.ARROW_DOWN,
    Keys.ARROW_LEFT,
    Keys.ARROW_RIGHT,
    Keys.HOME,
    Keys.END,
  ].includes(event.key as any);
}

/**
 * Handle list navigation (vertical)
 */
export function handleListNavigation(
  event: KeyboardEvent,
  focusManager: FocusManager
): boolean {
  let handled = false;

  switch (event.key) {
    case Keys.ARROW_DOWN:
      focusManager.next();
      handled = true;
      break;
    case Keys.ARROW_UP:
      focusManager.previous();
      handled = true;
      break;
    case Keys.HOME:
      focusManager.first();
      handled = true;
      break;
    case Keys.END:
      focusManager.last();
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
  }

  return handled;
}

/**
 * Handle grid navigation (2D)
 */
export function handleGridNavigation(
  event: KeyboardEvent,
  row: number,
  col: number,
  totalRows: number,
  totalCols: number,
  onNavigate: (newRow: number, newCol: number) => void
): boolean {
  let handled = false;
  let newRow = row;
  let newCol = col;

  switch (event.key) {
    case Keys.ARROW_DOWN:
      newRow = Math.min(row + 1, totalRows - 1);
      handled = true;
      break;
    case Keys.ARROW_UP:
      newRow = Math.max(row - 1, 0);
      handled = true;
      break;
    case Keys.ARROW_RIGHT:
      newCol = Math.min(col + 1, totalCols - 1);
      handled = true;
      break;
    case Keys.ARROW_LEFT:
      newCol = Math.max(col - 1, 0);
      handled = true;
      break;
    case Keys.HOME:
      newCol = 0;
      handled = true;
      break;
    case Keys.END:
      newCol = totalCols - 1;
      handled = true;
      break;
  }

  if (handled) {
    event.preventDefault();
    onNavigate(newRow, newCol);
  }

  return handled;
}

/**
 * React hook for focus trap
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  isActive: boolean
): void {
  React.useEffect(() => {
    if (!isActive || !ref.current) return;

    const trap = new FocusTrap(ref.current);
    trap.activate();

    const handleKeyDown = (event: KeyboardEvent) => {
      trap.handleTab(event);
      
      // Close on Escape
      if (event.key === Keys.ESCAPE) {
        // Let parent handle close
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trap.deactivate();
    };
  }, [isActive, ref]);
}

/**
 * React hook for roving tabindex
 */
export function useRovingTabIndex(
  listRef: React.RefObject<HTMLElement>,
  itemSelector: string
): {
  handleKeyDown: (event: React.KeyboardEvent) => void;
} {
  const [focusManager, setFocusManager] = React.useState<FocusManager | null>(null);

  React.useEffect(() => {
    if (!listRef.current) return;

    const items = Array.from(
      listRef.current.querySelectorAll<HTMLElement>(itemSelector)
    );

    const manager = new FocusManager(items);
    setFocusManager(manager);

    // Update when DOM changes
    const observer = new MutationObserver(() => {
      const newItems = Array.from(
        listRef.current!.querySelectorAll<HTMLElement>(itemSelector)
      );
      manager.update(newItems);
    });

    observer.observe(listRef.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [listRef, itemSelector]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (focusManager) {
      handleListNavigation(event.nativeEvent, focusManager);
    }
  };

  return { handleKeyDown };
}

// React import for hooks
import React from 'react';
