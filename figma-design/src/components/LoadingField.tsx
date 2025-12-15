import { motion } from 'motion/react';

interface LoadingFieldProps {
  message?: string;
  progress?: number;
}

export function LoadingField({ message = 'Processing...', progress }: LoadingFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Orbital loading animation */}
        <div className="relative w-24 h-24">
          {/* Center dot */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-[var(--color-accent-gold)]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Orbiting particles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]"
              style={{
                marginLeft: -3,
                marginTop: -3
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 1
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.66
                },
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.66
                }
              }}
            >
              <div
                className="absolute w-full h-full"
                style={{
                  transform: `translateX(${36}px)`
                }}
              />
            </motion.div>
          ))}

          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-[var(--color-accent-gold)]/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-[var(--color-text-secondary)]"
        >
          {message}
        </motion.div>

        {/* Progress bar (if provided) */}
        {progress !== undefined && (
          <div className="w-48 h-1 bg-[var(--color-surface-emphasis)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-accent-gold)] to-[var(--color-accent-gold-deep)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
