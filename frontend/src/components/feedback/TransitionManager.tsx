import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface TransitionManagerProps {
  children: ReactNode;
  mode?: 'fade' | 'slide' | 'scale' | 'breath';
  duration?: number;
}

// Smooth transitions that respect the constitutional principle of patience
export function TransitionManager({ 
  children, 
  mode = 'fade',
  duration = 0.5 
}: TransitionManagerProps) {
  
  const transitions = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration, ease: [0.23, 1, 0.32, 1] }
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration, ease: [0.23, 1, 0.32, 1] }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration, ease: [0.23, 1, 0.32, 1] }
    },
    breath: {
      initial: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
      transition: { duration: duration * 1.5, ease: [0.23, 1, 0.32, 1] }
    }
  };

  const config = transitions[mode];

  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children, id }: { children: ReactNode; id: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
