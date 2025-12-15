/**
 * Enhanced Field - The infinite reflective void with advanced visual systems
 * Constellations, depth layers, parallax, breathing atmosphere
 */

import { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';

interface EnhancedFieldProps {
  children: ReactNode;
  layer: 'sovereign' | 'commons' | 'builder';
  crisisMode: boolean;
  instrumentCount: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  speed: number;
  size: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function EnhancedField({ children, layer, crisisMode, instrumentCount }: EnhancedFieldProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [constellations, setConstellations] = useState<Array<[number, number]>>([]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax layers
  const parallaxX1 = useTransform(mouseX, [0, window.innerWidth], [-20, 20]);
  const parallaxY1 = useTransform(mouseY, [0, window.innerHeight], [-20, 20]);
  const parallaxX2 = useTransform(mouseX, [0, window.innerWidth], [-10, 10]);
  const parallaxY2 = useTransform(mouseY, [0, window.innerHeight], [-10, 10]);

  // Track mouse for ambient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate ambient particles
  useEffect(() => {
    const particleCount = 40;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 15,
      speed: 10 + Math.random() * 10,
      size: 1 + Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  // Generate starfield
  useEffect(() => {
    const starCount = 200;
    const newStars = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.3,
    }));
    setStars(newStars);
  }, []);

  // Generate constellation connections
  useEffect(() => {
    if (particles.length < 2) return;
    
    const connections: Array<[number, number]> = [];
    const maxDistance = 15; // percent
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          connections.push([i, j]);
        }
      }
    }
    
    setConstellations(connections);
  }, [particles]);

  // Layer colors
  const layerGlow = {
    sovereign: 'rgba(203, 163, 93, 0.15)', // Gold
    commons: 'rgba(147, 112, 219, 0.15)', // Violet
    builder: 'rgba(64, 224, 208, 0.15)', // Cyan
  };

  const layerGlowStrong = {
    sovereign: 'rgba(203, 163, 93, 0.6)',
    commons: 'rgba(147, 112, 219, 0.6)',
    builder: 'rgba(64, 224, 208, 0.6)',
  };

  // Crisis mode overrides everything
  const atmosphereColor = crisisMode 
    ? 'rgba(239, 68, 68, 0.2)'
    : layerGlow[layer];

  const atmosphereColorStrong = crisisMode
    ? 'rgba(239, 68, 68, 0.6)'
    : layerGlowStrong[layer];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#000000]">
      {/* Deep starfield (background layer) */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ x: parallaxX1, y: parallaxY1 }}
      >
        {stars.map((star) => (
          <motion.div
            key={`star-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 0.3, star.opacity],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </motion.div>

      {/* Breathing atmosphere */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${atmosphereColor}, transparent 60%)`,
        }}
      />

      {/* Mouse-reactive gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${atmosphereColor}, transparent 50%)`,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Grid overlay with parallax */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          x: parallaxX2,
          y: parallaxY2,
          backgroundImage: `
            linear-gradient(${atmosphereColorStrong} 1px, transparent 1px),
            linear-gradient(90deg, ${atmosphereColorStrong} 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Constellation layer */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full">
        {constellations.map(([i, j], idx) => (
          <motion.line
            key={`constellation-${idx}`}
            x1={`${particles[i]?.x}%`}
            y1={`${particles[i]?.y}%`}
            x2={`${particles[j]?.x}%`}
            y2={`${particles[j]?.y}%`}
            stroke={atmosphereColorStrong}
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: idx * 0.2,
            }}
          />
        ))}
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: crisisMode 
                ? 'rgba(239, 68, 68, 0.6)'
                : atmosphereColorStrong,
              boxShadow: crisisMode
                ? '0 0 12px rgba(239, 68, 68, 0.8)'
                : `0 0 12px ${atmosphereColorStrong}`,
            }}
            animate={{
              y: [-100, -window.innerHeight - 100],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: particle.speed,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Instrument presence indicator - aurora effect */}
      <AnimatePresence>
        {instrumentCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  `linear-gradient(180deg, ${atmosphereColor}, transparent)`,
                  `linear-gradient(180deg, ${atmosphereColor}00, transparent)`,
                  `linear-gradient(180deg, ${atmosphereColor}, transparent)`,
                ],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer indicator */}
      <AnimatePresence>
        {!crisisMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${layerGlowStrong[layer]}, transparent)`,
                boxShadow: `0 0 20px ${layerGlowStrong[layer]}`,
              }}
            />
            
            {/* Layer label with pulse */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-6 left-6 px-4 py-2 rounded-full backdrop-blur-md text-xs uppercase tracking-wider"
              style={{
                background: `${layerGlow[layer]}40`,
                border: `1px solid ${layerGlowStrong[layer]}`,
                color: layerGlowStrong[layer],
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: `0 0 30px ${layerGlowStrong[layer]}`,
              }}
            >
              <motion.span
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {layer}
              </motion.span>
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
          >
            {/* Pulsing red atmosphere */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent 60%)',
                  'radial-gradient(circle at center, rgba(239, 68, 68, 0.3), transparent 70%)',
                  'radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent 60%)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Crisis indicator */}
            <motion.div
              className="absolute top-6 left-6 px-4 py-2 rounded-full backdrop-blur-md text-xs uppercase tracking-wider border-2"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 0.6)',
                color: 'rgba(239, 68, 68, 1)',
              }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.6)',
                  '0 0 40px rgba(239, 68, 68, 0.8)',
                  '0 0 20px rgba(239, 68, 68, 0.6)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Crisis Support Active
            </motion.div>
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
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      {/* Edge glow based on instrument count */}
      <AnimatePresence>
        {instrumentCount > 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 ${instrumentCount * 20}px ${atmosphereColorStrong}`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
