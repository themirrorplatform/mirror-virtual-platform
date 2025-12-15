import React from 'react';
import { useUIMode } from '../contexts/UIModeContext';
import { Command, Layout } from 'lucide-react';

/**
 * HYBRID ARCHITECTURE - MODE TOGGLE
 * 
 * Allows users to switch between Power Mode and Simple Mode.
 * Shows current mode and keyboard shortcut.
 */

export function ModeToggle() {
  const { mode, toggleMode, isPowerMode } = useUIMode();

  return (
    <button
      onClick={toggleMode}
      className="
        flex items-center gap-3 px-4 py-3 rounded-lg
        border border-[var(--color-border-subtle)]
        bg-[var(--color-surface-card)]
        hover:bg-[var(--color-surface-emphasis)]
        transition-colors
        group
      "
      title={`Switch to ${isPowerMode ? 'Simple' : 'Power'} Mode (⌘M)`}
    >
      <div className="flex items-center gap-2">
        {isPowerMode ? (
          <Command className="w-4 h-4 text-[var(--color-accent-gold)]" />
        ) : (
          <Layout className="w-4 h-4 text-[var(--color-text-secondary)]" />
        )}
      </div>
      
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {isPowerMode ? 'Power Mode' : 'Simple Mode'}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {isPowerMode ? 'Instrument OS' : 'Traditional Nav'}
        </span>
      </div>

      <div className="ml-auto">
        <kbd className="
          px-2 py-1 text-xs rounded
          bg-[var(--color-base-sunken)]
          text-[var(--color-text-muted)]
          border border-[var(--color-border-subtle)]
          font-mono
        ">
          ⌘M
        </kbd>
      </div>
    </button>
  );
}
