/**
 * MirrorField - The only persistent frame
 * Adaptive. Human. Waiting.
 */

import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MirrorFieldProps {
  children?: ReactNode;
  layer: 'sovereign' | 'commons' | 'builder';
  crisisMode: boolean;
  hasActiveInstruments?: boolean;
}

export function MirrorField({ children, layer, crisisMode, hasActiveInstruments = false }: MirrorFieldProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particlesEnabled, setParticlesEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load particle preference (off by default)
  useEffect(() => {
    const pref = localStorage.getItem('mirror_particles_enabled');
    setParticlesEnabled(pref === 'true');
  }, []);

  // Minimal mouse tracking (for crisis mode only)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    if (crisisMode) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [crisisMode]);

  // Layer colors (muted tints, only when instruments active or crisis)
  const layerTint = {
    sovereign: 'rgba(203, 163, 93, 0.08)',
    commons: 'rgba(147, 112, 219, 0.08)',
    builder: 'rgba(64, 224, 208, 0.08)',
  };

  const crisisTint = 'rgba(239, 68, 68, 0.12)';

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative w-full h-screen bg-[var(--color-base-default)] overflow-hidden transition-colors duration-500">
      {/* Optional ambient particles (off by default, max 12) */}
      {particlesEnabled && !crisisMode && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${100 + Math.random() * 20}%`,
                background: layerTint[layer],
              }}
              animate={{
                y: [-100, -window.innerHeight - 100],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 20 + Math.random() * 15,
                repeat: Infinity,
                delay: Math.random() * 15,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Crisis atmosphere (controlled, not dramatic) */}
      {crisisMode && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${crisisTint}, transparent 50%)`,
          }}
        />
      )}

      {/* Waiting state - only shown when no instruments active */}
      <AnimatePresence>
        {!hasActiveInstruments && !crisisMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          >
            {/* Subtle ambient glow */}
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
              style={{
                background: `radial-gradient(circle, ${layerTint[layer]}, transparent)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative z-10 text-center"
            >
              <h1 
                className="text-6xl tracking-[0.2em] mb-8 font-light"
                style={{ 
                  color: 'var(--color-text-primary)',
                  opacity: 0.4,
                  fontFamily: 'var(--font-serif)',
                }}
              >
                THE MIRROR
              </h1>

              {/* Current time/date - mirrors reflect the present */}
              <motion.div
                className="space-y-2 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <p 
                  className="text-3xl font-light tracking-wide"
                  style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
                >
                  {formatTime(currentTime)}
                </p>
                <p 
                  className="text-sm tracking-wider uppercase"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}
                >
                  {formatDate(currentTime)}
                </p>
              </motion.div>

              {/* Layer indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 1 }}
                className="mb-8"
              >
                <span 
                  className="text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border"
                  style={{ 
                    color: 'var(--color-text-muted)',
                    borderColor: 'var(--color-border-subtle)',
                    opacity: 0.5,
                  }}
                >
                  {layer}
                </span>
              </motion.div>

              {/* Subtle invitation (just the fact, no instruction) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.2 }}
                className="flex items-center justify-center gap-2 text-xs"
                style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}
              >
                <kbd className="px-2 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  ⌘K
                </kbd>
                <span className="tracking-wide">or</span>
                <kbd className="px-2 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  Ctrl K
                </kbd>
              </motion.div>
            </motion.div>

            {/* Breathing pulse (very subtle) */}
            <motion.div
              className="absolute bottom-12 w-2 h-2 rounded-full"
              style={{
                background: 'var(--color-accent-gold)',
                opacity: 0.2,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Subtle vignette (very minimal) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle at center, transparent 60%, var(--color-base-default) 100%)',
        }}
      />
    </div>
  );
}