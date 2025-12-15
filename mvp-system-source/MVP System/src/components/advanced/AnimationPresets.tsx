/**
 * Animation Presets - Constitutional animation library
 * 
 * Features:
 * - Gentle, non-demanding animations
 * - Respects reduced motion
 * - State-based, not attention-seeking
 * - Slow, ignorable ambient motion
 * - No celebration or gamification
 */

import { motion, Variants } from 'motion/react';

/**
 * Animation Configuration
 */
export const ANIMATION_CONFIG = {
  // Durations - slower than typical UIs
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
    ambient: 2.0,
  },
  
  // Easing - gentle, not dramatic
  easing: {
    default: [0.4, 0.0, 0.2, 1], // ease-out
    gentle: [0.25, 0.1, 0.25, 1], // very gentle
    ambient: [0.5, 0, 0.5, 1], // smooth loop
  },
};

/**
 * Fade Variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
    },
  },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { opacity: 0, y: 10 },
};

/**
 * Scale Variants
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
    },
  },
};

/**
 * Slide Variants
 */
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { opacity: 0, x: -20 },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { opacity: 0, x: 20 },
};

/**
 * Stagger Variants - for lists
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { opacity: 0, y: -5 },
};

/**
 * Ambient Motion - slow, ignorable background movement
 */
export const ambientFloatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: ANIMATION_CONFIG.duration.ambient,
      repeat: Infinity,
      ease: ANIMATION_CONFIG.easing.ambient,
    },
  },
};

export const ambientPulseVariants: Variants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: ANIMATION_CONFIG.duration.ambient,
      repeat: Infinity,
      ease: ANIMATION_CONFIG.easing.ambient,
    },
  },
};

/**
 * Page Transition Variants
 */
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.slow,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
    },
  },
};

/**
 * Modal Variants
 */
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
    },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
    },
  },
};

/**
 * Presence Animation Components
 */
interface AnimatedPresenceProps {
  children: React.ReactNode;
  variant?: 'fade' | 'fadeUp' | 'fadeDown' | 'scale' | 'slideLeft' | 'slideRight';
  className?: string;
}

export function AnimatedPresence({ 
  children, 
  variant = 'fade',
  className = '' 
}: AnimatedPresenceProps) {
  const variantMap = {
    fade: fadeVariants,
    fadeUp: fadeUpVariants,
    fadeDown: fadeDownVariants,
    scale: scaleVariants,
    slideLeft: slideLeftVariants,
    slideRight: slideRightVariants,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variantMap[variant]}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered List Animation
 */
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredList({ children, className = '' }: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggeredItem({ children, className = '' }: StaggeredItemProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Ambient Motion Component
 */
interface AmbientMotionProps {
  children: React.ReactNode;
  type?: 'float' | 'pulse';
  className?: string;
}

export function AmbientMotion({ 
  children, 
  type = 'float',
  className = '' 
}: AmbientMotionProps) {
  const variantMap = {
    float: ambientFloatVariants,
    pulse: ambientPulseVariants,
  };

  return (
    <motion.div
      variants={variantMap[type]}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * useReducedMotion Hook
 */
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Conditional Animation Wrapper
 */
interface ConditionalAnimationProps {
  children: React.ReactNode;
  animate?: boolean;
  variant?: 'fade' | 'fadeUp' | 'scale';
  className?: string;
}

export function ConditionalAnimation({ 
  children, 
  animate = true,
  variant = 'fade',
  className = '' 
}: ConditionalAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!animate || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatedPresence variant={variant} className={className}>
      {children}
    </AnimatedPresence>
  );
}

/**
 * Gentle Hover Animation
 */
export const gentleHoverProps = {
  whileHover: { 
    scale: 1.02,
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
      ease: ANIMATION_CONFIG.easing.gentle,
    },
  },
  whileTap: { 
    scale: 0.98,
    transition: {
      duration: ANIMATION_CONFIG.duration.instant,
    },
  },
};

/**
 * Focus Ring Animation
 */
export const focusRingProps = {
  whileFocus: {
    boxShadow: '0 0 0 3px var(--color-accent-blue-alpha)',
    transition: {
      duration: ANIMATION_CONFIG.duration.fast,
    },
  },
};

export type { AnimatedPresenceProps, StaggeredListProps, AmbientMotionProps };
