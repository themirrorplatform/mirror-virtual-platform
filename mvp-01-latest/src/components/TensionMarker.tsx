import { motion } from 'motion/react';

interface TensionMarkerProps {
  label: string;
  count: number;
  intensity?: 'low' | 'medium' | 'high';
  description?: string;
}

export function TensionMarker({ 
  label, 
  count, 
  intensity = 'medium',
  description 
}: TensionMarkerProps) {
  const intensityColors = {
    low: 'var(--color-accent-blue)',
    medium: 'var(--color-accent-gold)',
    high: 'var(--color-accent-purple)',
  };

  const color = intensityColors[intensity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]"
    >
      {/* Glow indicator */}
      <div className="relative flex-shrink-0 mt-1">
        <motion.div
          animate={{
            boxShadow: [
              `0 0 8px ${color}`,
              `0 0 16px ${color}`,
              `0 0 8px ${color}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm" style={{ color }}>
            {label}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {count} reflection{count !== 1 ? 's' : ''}
          </span>
        </div>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
