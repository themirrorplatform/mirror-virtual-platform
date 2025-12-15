import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export function useKeyboardShortcut(
  config: ShortcutConfig,
  callback: () => void,
  enabled: boolean = true
) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, ctrl = false, meta = false, alt = false, shift = false } = config;

      const modifiersMatch =
        event.ctrlKey === ctrl &&
        event.metaKey === meta &&
        event.altKey === alt &&
        event.shiftKey === shift;

      if (event.key.toLowerCase() === key.toLowerCase() && modifiersMatch) {
        event.preventDefault();
        callback();
      }
    },
    [config, callback, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}
