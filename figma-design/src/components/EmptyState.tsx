import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message?: string;
  variant?: 'minimal' | 'poetic' | 'ambient';
}

export function EmptyState({ 
  icon, 
  message = '...',
  variant = 'minimal'
}: EmptyStateProps) {
  
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2, delay: 1 }}
        className="flex items-center justify-center min-h-[400px] text-base text-[var(--color-text-muted)]"
      >
        {message}
      </motion.div>
    );
  }

  if (variant === 'poetic') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[500px] px-12"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, var(--color-accent-gold), transparent 70%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Icon with breathing animation */}
        {icon && (
          <motion.div
            className="relative mb-10"
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {icon}
          </motion.div>
        )}

        {/* Message - poetic typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="text-center text-[var(--color-text-muted)] tracking-wide"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            lineHeight: '2',
            letterSpacing: '0.03em'
          }}
        >
          {message}
        </motion.div>
      </motion.div>
    );
  }

  // Ambient variant - pure atmosphere
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3 }}
      className="relative flex items-center justify-center min-h-[600px] overflow-hidden"
    >
      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[var(--color-accent-gold)]"
          style={{
            left: `${20 + (i * 10)}%`,
            top: `${30 + Math.sin(i) * 20}%`
          }}
          animate={{
            y: [-100, 100],
            opacity: [0, 0.3, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Center message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 2, duration: 2 }}
        className="relative z-10 text-[var(--color-text-muted)]"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          letterSpacing: '0.1em'
        }}
      >
        {message}
      </motion.div>
    </motion.div>
  );
}
