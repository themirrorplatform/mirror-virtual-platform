/**
 * Instrument - Floating panel container
 * All instruments appear as glass morphism panels that can be positioned and resized
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface InstrumentProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  position?: 'center' | 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  category?: 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';
}

export function Instrument({ 
  children, 
  title, 
  icon,
  onClose,
  position = 'center',
  size = 'md',
  isMinimized = false,
  onToggleMinimize,
  category = 'input',
}: InstrumentProps) {
  const categoryGlow = {
    input: 'rgba(203, 163, 93, 0.4)', // Gold
    reflection: 'rgba(147, 112, 219, 0.4)', // Violet
    time: 'rgba(100, 181, 246, 0.4)', // Blue
    identity: 'rgba(129, 212, 250, 0.4)', // Cyan
    commons: 'rgba(147, 112, 219, 0.4)', // Violet
    sovereignty: 'rgba(239, 68, 68, 0.4)', // Red
    builder: 'rgba(64, 224, 208, 0.4)', // Turquoise
  };

  const positionStyles = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    left: 'top-1/2 left-8 -translate-y-1/2',
    right: 'top-1/2 right-8 -translate-y-1/2',
    bottom: 'bottom-8 left-1/2 -translate-x-1/2',
  };

  const sizeStyles = {
    sm: 'w-[400px]',
    md: 'w-[600px]',
    lg: 'w-[800px]',
    xl: 'w-[1000px]',
    full: 'w-[calc(100%-4rem)] h-[calc(100%-4rem)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        height: isMinimized ? 'auto' : undefined,
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed ${positionStyles[position]} ${sizeStyles[size]} z-30`}
    >
      <div
        className="relative bg-[var(--color-surface-card)] backdrop-blur-2xl rounded-2xl overflow-hidden border"
        style={{
          borderColor: categoryGlow[category],
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            borderColor: `${categoryGlow[category]}40`,
            background: `linear-gradient(135deg, ${categoryGlow[category]}10, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: `${categoryGlow[category]}20`,
                  color: categoryGlow[category],
                }}
              >
                {icon}
              </div>
            )}
            <h2 className="text-lg text-[var(--color-text-primary)]">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        )}
      </div>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${categoryGlow[category]}, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}