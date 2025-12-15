// Advanced animation utilities for The Mirror
// Constitutional timing, natural easing, breathing rhythms

import { Variants, Transition } from 'motion/react';

// Core easing curves (natural, patient)
export const easings = {
  natural: [0.23, 1, 0.32, 1], // Default constitutional easing
  gentle: [0.25, 0.1, 0.25, 1], // Extra smooth
  patient: [0.16, 1, 0.3, 1], // Very patient entry
  swift: [0.4, 0, 0.2, 1], // Quick but not anxious
  breathing: [0.37, 0, 0.63, 1], // In-out breathing
};

// Core durations (patient by default)
export const durations = {
  instant: 0.15,
  micro: 0.25,
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  patient: 1.2,
  breathing: 2.5,
  ambient: 8,
};

// Spring configurations (natural physics)
export const springs = {
  gentle: { damping: 35, stiffness: 400 },
  natural: { damping: 28, stiffness: 320 },
  bouncy: { damping: 20, stiffness: 300 },
  stiff: { damping: 25, stiffness: 500 },
};

// Fade variants (most common)
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Scale variants (dimensional changes)
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Slide variants (directional hints)
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0, 
    x: -10,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.natural,
    }
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Blur variants (focus transitions)
export const blurVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: {
      duration: durations.slow,
      ease: easings.gentle,
    }
  },
  exit: { 
    opacity: 0, 
    filter: 'blur(10px)',
    transition: {
      duration: durations.normal,
      ease: easings.gentle,
    }
  },
};

// Breathing variants (organic pulse)
export const breathingVariants: Variants = {
  breathe: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: durations.breathing,
      repeat: Infinity,
      ease: easings.breathing,
    }
  },
};

// Glow variants (emphasis)
export const glowVariants: Variants = {
  idle: { 
    filter: 'drop-shadow(0 0 0px transparent)' 
  },
  glow: {
    filter: [
      'drop-shadow(0 0 8px rgba(203, 163, 93, 0.3))',
      'drop-shadow(0 0 16px rgba(203, 163, 93, 0.5))',
      'drop-shadow(0 0 8px rgba(203, 163, 93, 0.3))',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easings.breathing,
    }
  },
};

// Stagger children (list animations)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    }
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Modal/Overlay variants (backdrop + content)
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: durations.normal,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: durations.fast,
    }
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      ...springs.natural,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 20,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Shimmer effect (loading/emphasis)
export const shimmerTransition: Transition = {
  duration: 3,
  repeat: Infinity,
  repeatDelay: 5,
  ease: 'easeInOut',
};

// Particle drift (ambient)
export const particleDriftVariants: Variants = {
  drift: (custom: { x: number; y: number; duration: number }) => ({
    x: [0, custom.x, 0],
    y: [0, custom.y, 0],
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: custom.duration,
      repeat: Infinity,
      ease: easings.breathing,
    }
  }),
};

// Pulse (attention)
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: 3,
      ease: easings.breathing,
    }
  },
};

// Shake (error/warning)
export const shakeVariants: Variants = {
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: easings.natural,
    }
  },
};

// Rotate in (circular instruments)
export const rotateInVariants: Variants = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: { 
    opacity: 1, 
    rotate: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      ...springs.natural,
    }
  },
  exit: { 
    opacity: 0, 
    rotate: 10, 
    scale: 0.9,
    transition: {
      duration: durations.fast,
      ease: easings.natural,
    }
  },
};

// Height expand (accordions, panels)
export const heightVariants: Variants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: { duration: durations.normal, ease: easings.natural },
      opacity: { duration: durations.fast },
    }
  },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: { duration: durations.normal, ease: easings.natural },
      opacity: { duration: durations.slow, delay: 0.1 },
    }
  },
};

// Draw line (SVG paths, borders)
export const drawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      pathLength: { duration: durations.patient, ease: easings.natural },
      opacity: { duration: durations.fast },
    }
  },
};

// Utility: Create custom transition
export function createTransition(
  duration: number = durations.normal,
  easing: number[] = easings.natural,
  delay: number = 0
): Transition {
  return {
    duration,
    ease: easing,
    delay,
  };
}

// Utility: Create spring transition
export function createSpring(
  config: { damping?: number; stiffness?: number } = springs.natural,
  delay: number = 0
): Transition {
  return {
    type: 'spring',
    damping: config.damping,
    stiffness: config.stiffness,
    delay,
  };
}

// Utility: Respect reduced motion
export function getVariantsRespectingMotion(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (!prefersReducedMotion) return variants;

  // If reduced motion, only animate opacity
  return Object.keys(variants).reduce((acc, key) => {
    const state = variants[key];
    if (typeof state === 'object' && state !== null) {
      acc[key] = { 
        opacity: 'opacity' in state ? state.opacity : 1,
        transition: { duration: durations.instant },
      };
    }
    return acc;
  }, {} as Variants);
}

// Preset animation combinations for common patterns
export const presets = {
  // Instrument summoning
  instrumentSummon: {
    backdrop: backdropVariants,
    content: modalVariants,
  },
  
  // List items appearing
  list: {
    container: staggerContainerVariants,
    item: staggerItemVariants,
  },
  
  // Subtle emphasis
  emphasis: {
    scale: { scale: [1, 1.02, 1], transition: { duration: 0.3 } },
    glow: glowVariants,
  },
  
  // Error feedback
  error: {
    shake: shakeVariants,
    pulse: { ...pulseVariants, pulse: { ...pulseVariants.pulse, transition: { duration: 0.5, repeat: 2 } } },
  },
  
  // Success feedback
  success: {
    scale: { scale: [1, 1.05, 1], transition: { duration: 0.5 } },
    fade: { opacity: [1, 0.8, 1], transition: { duration: 0.5 } },
  },
};

// Export all for easy access
export default {
  easings,
  durations,
  springs,
  fadeVariants,
  scaleVariants,
  slideUpVariants,
  slideDownVariants,
  slideLeftVariants,
  slideRightVariants,
  blurVariants,
  breathingVariants,
  glowVariants,
  staggerContainerVariants,
  staggerItemVariants,
  backdropVariants,
  modalVariants,
  shimmerTransition,
  particleDriftVariants,
  pulseVariants,
  shakeVariants,
  rotateInVariants,
  heightVariants,
  drawVariants,
  presets,
  createTransition,
  createSpring,
  getVariantsRespectingMotion,
};
