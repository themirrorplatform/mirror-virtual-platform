import React, { ReactNode, useState, useEffect } from 'react';
import { ModeToggle } from '../components/ModeToggle';

/**
 * INSTRUMENT OS LAYOUT - POWER MODE
 * 
 * Figma's revolutionary architecture:
 * - Command palette driven (⌘K)
 * - Summoned windows (no persistent nav)
 * - Multi-windowing (2-4 instruments)
 * - Constitutional layer system
 */

interface InstrumentOSLayoutProps {
  children: ReactNode;
}

export function InstrumentOSLayout({ children }: InstrumentOSLayoutProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen bg-[var(--color-base-default)] overflow-hidden">
      {/* MirrorField - The only persistent frame */}
      <div className="
        absolute inset-0
        flex flex-col items-center justify-center
        pointer-events-none
      ">
        {/* Time */}
        <div className="text-center mb-8">
          <div className="text-sm text-[var(--color-text-muted)] font-serif">
            {time}
          </div>
        </div>

        {/* Central instruction */}
        <div className="text-center">
          <div className="text-lg text-[var(--color-text-secondary)] font-serif">
            Press <kbd className="
              px-2 py-1 mx-1 text-sm rounded
              bg-[var(--color-base-raised)]
              text-[var(--color-accent-gold)]
              border border-[var(--color-border-subtle)]
              font-mono
            ">⌘K</kbd> to begin
          </div>
        </div>
      </div>

      {/* Instrument windows will be rendered here */}
      <div className="relative z-10 pointer-events-auto">
        {children}
      </div>

      {/* Mode Toggle - Fixed bottom left */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-auto">
        <ModeToggle />
      </div>

      {/* Constitutional indicator - Fixed top right */}
      <div className="absolute top-6 right-6 z-50 pointer-events-none">
        <div className="
          px-3 py-2 rounded-lg
          bg-[var(--color-surface-card)]
          border border-[var(--color-border-subtle)]
        ">
          <span className="text-xs text-[var(--color-text-muted)]">
            Layer: <span className="text-[var(--color-accent-gold)]">Sovereign</span>
          </span>
        </div>
      </div>
    </div>
  );
}
