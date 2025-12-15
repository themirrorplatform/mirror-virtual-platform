import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function AmbientField() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Generate ambient particles
  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.15 + 0.05
    }));
    setParticles(generated);
  }, []);

  // Track mouse for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient - deeper, more atmospheric */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#000000] to-[#0A0A0F] opacity-100" />

      {/* Radial gradient for depth */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(10, 10, 15, 0.8) 0%, rgba(0, 0, 0, 1) 70%)'
        }}
      />

      {/* Gold particle system - slower, more patient */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={`gold-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(203, 163, 93, 0.6), transparent)',
            filter: 'blur(1px)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 120, 0],
            y: [0, (Math.random() - 0.5) * 120, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            ease: [0.37, 0, 0.63, 1],
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Larger ambient orbs - more subtle */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: 300 + Math.random() * 200,
            height: 300 + Math.random() * 200,
            background: `radial-gradient(circle, ${
              i % 3 === 0 
                ? 'rgba(203, 163, 93, 0.03)' 
                : i % 3 === 1
                ? 'rgba(139, 123, 175, 0.02)'
                : 'rgba(58, 139, 255, 0.02)'
            }, transparent 70%)`,
            left: `${(i * 20 + 10)}%`,
            top: `${(i * 15 + 10)}%`,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 200, 0],
            y: [0, (Math.random() - 0.5) * 200, 0],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25 + Math.random() * 15,
            repeat: Infinity,
            ease: [0.37, 0, 0.63, 1],
            delay: Math.random() * 10,
          }}
        />
      ))}

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Vignette for focus */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
    </div>
  );
}