import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * HYBRID ARCHITECTURE - UI MODE CONTEXT
 * 
 * Allows users to choose between:
 * - Power Mode: Instrument OS (command palette, summoned windows)
 * - Simple Mode: Traditional navigation (routes, URLs)
 * 
 * Constitutional integrity maintained in both modes.
 */

export type UIMode = 'power' | 'simple';

interface UIModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  isPowerMode: boolean;
  isSimpleMode: boolean;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

const UI_MODE_KEY = 'mirror_ui_mode';

interface UIModeProviderProps {
  children: ReactNode;
  defaultMode?: UIMode;
}

export function UIModeProvider({ children, defaultMode = 'simple' }: UIModeProviderProps) {
  const [mode, setModeState] = useState<UIMode>(defaultMode);

  // Load mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(UI_MODE_KEY);
      if (stored === 'power' || stored === 'simple') {
        setModeState(stored);
      }
    }
  }, []);

  // Save mode to localStorage when it changes
  const setMode = (newMode: UIMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(UI_MODE_KEY, newMode);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'power' ? 'simple' : 'power');
  };

  const value = {
    mode,
    setMode,
    toggleMode,
    isPowerMode: mode === 'power',
    isSimpleMode: mode === 'simple',
  };

  return <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>;
}

export function useUIMode() {
  const context = useContext(UIModeContext);
  if (context === undefined) {
    throw new Error('useUIMode must be used within a UIModeProvider');
  }
  return context;
}
