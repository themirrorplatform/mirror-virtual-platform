/**
 * Animation Variants for Framer Motion
 * 
 * Provides consistent animation patterns across the Mirror Platform.
 */

import { Variants } from 'framer-motion';

/**
 * Page Transitions
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

/**
 * Fade Animations
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Slide Animations
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -100
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

/**
 * Scale Animations
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

export const popVariants: Variants = {
  hidden: {
    scale: 0
  },
  visible: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15
    }
  }
};

/**
 * Posture Transition Animations
 */
export const postureVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0
  },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95,
    rotate: 0
  },
  selected: {
    scale: 1.1,
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
  divergence: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

/**
 * Door Card Animations
 */
export const doorCardVariants: Variants = {
  hidden: {
    opacity: 0,
    rotateY: -90,
    transformPerspective: 1000
  },
  visible: (index: number) => ({
    opacity: 1,
    rotateY: 0,
    transition: {
      delay: index * 0.2,
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  }),
  hover: {
    scale: 1.05,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98
  }
};

/**
 * List Item Stagger
 */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

/**
 * Graph Node Animations
 */
export const graphNodeVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  },
  hover: {
    scale: 1.2,
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  selected: {
    scale: 1.3,
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15
    }
  }
};

/**
 * Modal/Dialog Animations
 */
export const modalBackdropVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Sidebar/Drawer Animations
 */
export const sidebarVariants: Variants = {
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  }
};

/**
 * Notification/Toast Animations
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -100,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Loading Spinner Animations
 */
export const spinnerVariants: Variants = {
  rotate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

/**
 * Voting Bar Animations
 */
export const votingBarVariants: Variants = {
  hidden: {
    width: 0,
    opacity: 0
  },
  visible: (width: number) => ({
    width: `${width}%`,
    opacity: 1,
    transition: {
      width: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay: 0.2
      },
      opacity: {
        duration: 0.2
      }
    }
  })
};

/**
 * Timeline Event Animations
 */
export const timelineEventVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -50
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.1,
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  })
};

/**
 * Heatmap Cell Animations
 */
export const heatmapCellVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0
  },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: delay * 0.01,
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  }),
  hover: {
    scale: 1.3,
    zIndex: 10,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  }
};

/**
 * Attention-grabbing Animations
 */
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5
    }
  }
};

export const bounceVariants: Variants = {
  bounce: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: 3
    }
  }
};

/**
 * Card Flip Animation
 */
export const cardFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      duration: 0.6
    }
  },
  back: {
    rotateY: 180,
    transition: {
      duration: 0.6
    }
  }
};

/**
 * Expand/Collapse Animations
 */
export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.3
      },
      opacity: {
        duration: 0.2
      }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3
      },
      opacity: {
        duration: 0.2,
        delay: 0.1
      }
    }
  }
};

/**
 * Reduce Motion Variants (for accessibility)
 */
export const getAccessibleVariants = (variants: Variants, prefersReducedMotion: boolean): Variants => {
  if (prefersReducedMotion) {
    return Object.keys(variants).reduce((acc, key) => {
      acc[key] = {
        ...variants[key],
        transition: { duration: 0 }
      };
      return acc;
    }, {} as Variants);
  }
  return variants;
};
