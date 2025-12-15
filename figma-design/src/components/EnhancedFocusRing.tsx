import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// Enhanced focus indicators that are visible and beautiful
export function useEnhancedFocus() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

// Visual focus ring component
export function FocusRing({ 
  children, 
  color = 'var(--color-accent-gold)',
  offset = 2 
}: { 
  children: React.ReactNode; 
  color?: string;
  offset?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className="relative"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Animated focus ring */}
      {isFocused && (
        <motion.div
          className="absolute pointer-events-none rounded-xl"
          style={{
            inset: -offset,
            border: `2px solid ${color}`,
            boxShadow: `0 0 0 ${offset}px ${color}20, 0 0 16px ${color}40`
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {children}
    </div>
  );
}

// Global focus styles injector
export function GlobalFocusStyles() {
  return (
    <style>{`
      /* Remove default outline */
      *:focus {
        outline: none;
      }

      /* Keyboard users get enhanced focus */
      body.keyboard-user *:focus {
        outline: 2px solid var(--color-accent-gold);
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(203, 163, 93, 0.1);
        transition: outline-offset 0.2s ease, box-shadow 0.2s ease;
      }

      /* Skip link - accessibility */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--color-accent-gold);
        color: black;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 100;
        border-radius: 0 0 8px 0;
      }

      .skip-link:focus {
        top: 0;
      }
    `}</style>
  );
}
