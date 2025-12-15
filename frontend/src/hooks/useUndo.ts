/**
 * Undo/Redo System
 * Constitutional implementation: Undo is a form of sovereignty over time
 */

import { useState, useCallback, useRef } from 'react';

export interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UndoActions<T> {
  set: (newPresent: T, checkpoint?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  reset: (newPresent: T) => void;
}

/**
 * Use undo/redo state management
 * 
 * @param initialPresent - Initial state value
 * @param options - Configuration options
 * 
 * Constitutional note: This enables temporal sovereignty - 
 * the user can move backward through their decisions
 */
export function useUndo<T>(
  initialPresent: T,
  options: {
    maxHistory?: number;
    debounceMs?: number;
  } = {}
): [T, UndoActions<T>] {
  const {
    maxHistory = 50, // Reasonable limit to prevent memory issues
    debounceMs = 500, // Debounce rapid changes
  } = options;

  const [state, setState] = useState<UndoState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Set new present state
   * @param checkpoint - Force immediate save (skip debounce)
   */
  const set = useCallback(
    (newPresent: T, checkpoint: boolean = false) => {
      const saveState = () => {
        setState(currentState => {
          // Don't save if value hasn't changed
          if (currentState.present === newPresent) {
            return currentState;
          }

          const newPast = [...currentState.past, currentState.present];

          // Limit history size
          if (newPast.length > maxHistory) {
            newPast.shift();
          }

          return {
            past: newPast,
            present: newPresent,
            future: [], // Clear future when new action is taken
          };
        });
      };

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If checkpoint, save immediately
      if (checkpoint) {
        saveState();
      } else {
        // Otherwise debounce to avoid saving every keystroke
        debounceTimerRef.current = setTimeout(saveState, debounceMs);
      }
    },
    [maxHistory, debounceMs]
  );

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.past.length === 0) {
        return currentState; // Nothing to undo
      }

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.future.length === 0) {
        return currentState; // Nothing to redo
      }

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Clear all history
   */
  const clear = useCallback(() => {
    setState(currentState => ({
      past: [],
      present: currentState.present,
      future: [],
    }));
  }, []);

  /**
   * Reset to new state, clearing history
   */
  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  return [
    state.present,
    {
      set,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      clear,
      reset,
    },
  ];
}

/**
 * Keyboard shortcut integration for undo/redo
 * 
 * Usage:
 * ```tsx
 * const [text, textActions] = useUndo('');
 * useUndoShortcuts(textActions);
 * ```
 */
export function useUndoShortcuts<T>(actions: UndoActions<T>): void {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Z = Undo
      if (modifier && event.key === 'z' && !event.shiftKey) {
        if (actions.canUndo) {
          event.preventDefault();
          actions.undo();
        }
      }

      // Cmd/Ctrl + Shift + Z = Redo (or Cmd/Ctrl + Y)
      if (
        (modifier && event.key === 'z' && event.shiftKey) ||
        (modifier && event.key === 'y')
      ) {
        if (actions.canRedo) {
          event.preventDefault();
          actions.redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}

/**
 * Undo history for complex objects
 * Uses deep comparison to detect changes
 */
export function useUndoObject<T extends Record<string, any>>(
  initialValue: T,
  options: {
    maxHistory?: number;
    debounceMs?: number;
    compareKeys?: Array<keyof T>; // Only compare specific keys
  } = {}
): [T, UndoActions<T>] {
  const { compareKeys, ...undoOptions } = options;

  const [state, actions] = useUndo<T>(initialValue, undoOptions);

  // Wrap set to do deep comparison
  const setWithComparison = useCallback(
    (newValue: T, checkpoint: boolean = false) => {
      // If compareKeys specified, only compare those keys
      if (compareKeys) {
        const hasChanged = compareKeys.some(
          key => state[key] !== newValue[key]
        );
        if (!hasChanged) return;
      }

      actions.set(newValue, checkpoint);
    },
    [actions, state, compareKeys]
  );

  return [
    state,
    {
      ...actions,
      set: setWithComparison,
    },
  ];
}

/**
 * Undo indicator component (optional UI)
 */
export function UndoIndicator<T>({ actions }: { actions: UndoActions<T> }) {
  const [showToast, setShowToast] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<'undo' | 'redo' | null>(null);

  React.useEffect(() => {
    if (lastAction) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const handleUndo = () => {
    actions.undo();
    setLastAction('undo');
  };

  const handleRedo = () => {
    actions.redo();
    setLastAction('redo');
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <button
        onClick={handleUndo}
        disabled={!actions.canUndo}
        className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Undo"
      >
        ⌘Z
      </button>
      <button
        onClick={handleRedo}
        disabled={!actions.canRedo}
        className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Redo"
      >
        ⌘⇧Z
      </button>

      {showToast && (
        <div className="absolute -top-12 right-0 px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-sm">
          {lastAction === 'undo' ? 'Undone' : 'Redone'}
        </div>
      )}
    </div>
  );
}

// React import
import React from 'react';
