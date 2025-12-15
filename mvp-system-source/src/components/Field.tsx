/**
 * The Field - The infinite reflective void
 * The core spatial environment where all instruments exist
 */

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FieldProps {
  children: ReactNode;
  layer: 'sovereign' | 'commons' | 'builder';
  crisisMode: boolean;
}

export function Field({ children, layer, crisisMode }: FieldProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Track mouse for ambient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate ambient particles
  useEffect(() => {
    const particleCount = 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
    }));
    setParticles(newParticles);
  }, []);

  // Layer colors
  const layerGlow = {
    sovereign: 'rgba(203, 163, 93, 0.15)', // Gold
    commons: 'rgba(147, 112, 219, 0.15)', // Violet
    builder: 'rgba(64, 224, 208, 0.15)', // Cyan
  };

  // Crisis mode overrides everything
  const atmosphereColor = crisisMode 
    ? 'rgba(239, 68, 68, 0.2)' // Red
    : layerGlow[layer];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#000000]">
      {/* Ambient gradient based on layer/crisis */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${atmosphereColor}, transparent 50%)`,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(203, 163, 93, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(203, 163, 93, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              background: crisisMode 
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(203, 163, 93, 0.3)',
              boxShadow: crisisMode
                ? '0 0 8px rgba(239, 68, 68, 0.6)'
                : '0 0 8px rgba(203, 163, 93, 0.4)',
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Layer indicator - subtle ambient glow at edges */}
      <AnimatePresence>
        {!crisisMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${layerGlow[layer]}, transparent)`,
                boxShadow: `0 0 20px ${layerGlow[layer]}`,
              }}
            />
            
            {/* Layer label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-6 left-6 px-4 py-2 rounded-full backdrop-blur-md text-xs uppercase tracking-wider"
              style={{
                background: `${layerGlow[layer]}20`,
                border: `1px solid ${layerGlow[layer]}`,
                color: layerGlow[layer],
              }}
            >
              {layer}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Crisis mode atmosphere */}
      <AnimatePresence>
        {crisisMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1), transparent 70%)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15), transparent 50%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />
    </div>
  );
}