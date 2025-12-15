/**
 * useGlobalKeyboard - Global keyboard shortcuts
 * Cmd+K, Cmd+Shift+C, Escape
 */

import { useEffect } from 'react';

export interface KeyboardHandlers {
  openCommandPalette: () => void;
  openCrisis: () => void;
  closeAllInstruments: () => void;
  closePalette?: () => void;
}

export function useGlobalKeyboard(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handlers.openCommandPalette();
      }
      
      // Cmd/Ctrl + Shift + C → Crisis Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        handlers.openCrisis();
      }
      
      // Escape → Close palette or instruments
      if (e.key === 'Escape') {
        if (handlers.closePalette) {
          handlers.closePalette();
        } else {
          handlers.closeAllInstruments();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
