import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AmbientBackgroundProps {
  variant?: 'default' | 'crisis' | 'commons' | 'governance';
}

export function AmbientBackground({ variant = 'default' }: AmbientBackgroundProps) {
  const [showBreathingEffect, setShowBreathingEffect] = useState(true);
  
  // Breathing effect for idle state
  useEffect(() => {
    const interval = setInterval(() => {
      setShowBreathingEffect((prev) => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  // Variant-specific color and glow configurations
  const variantConfig = {
    default: { 
      color: 'rgba(203, 163, 93, 0.15)', 
      glow: 'rgba(203, 163, 93, 0.35)',
      duration: 8 
    },
    crisis: { 
      color: 'rgba(240, 100, 73, 0.2)', 
      glow: 'rgba(240, 100, 73, 0.4)',
      duration: 6 
    },
    commons: { 
      color: 'rgba(122, 212, 168, 0.15)', 
      glow: 'rgba(122, 212, 168, 0.3)',
      duration: 10 
    },
    governance: { 
      color: 'rgba(174, 85, 255, 0.15)', 
      glow: 'rgba(174, 85, 255, 0.35)',
      duration: 9 
    },
  };
  
  const config = variantConfig[variant];
  
  return (
    <>
      {/* Tone-aware ambient background effect */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          opacity: showBreathingEffect ? 0.2 : 0.08,
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <div 
          className="w-full h-full"
          style={{
            background: `radial-gradient(circle at 30% 40%, ${config.color}, transparent 60%)`
          }}
        />
      </motion.div>
      
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${config.glow}, transparent)` }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${config.color}, transparent)` }}
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: config.duration + 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </>
  );
}
