/**
 * StarParticles.tsx
 * Magical particle explosion effect when receiving a star
 * Creates a stunning visual celebration on the home screen
 */

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
}

interface StarParticlesProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
}

const COLORS = [
  '#fbbf24', // Amber
  '#f59e0b', // Yellow
  '#fcd34d', // Light yellow
  '#fef3c7', // Cream
  '#a78bfa', // Violet
  '#c4b5fd', // Light violet
  '#f472b6', // Pink
];

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20, // Center with slight randomness
    y: 50 + (Math.random() - 0.5) * 20,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.2,
    duration: Math.random() * 0.5 + 0.8,
    angle: (i / count) * 360 + Math.random() * 30,
    distance: Math.random() * 150 + 100,
  }));
};

export const StarParticles = memo(function StarParticles({
  isActive,
  onComplete,
  particleCount = 30,
  duration = 1500,
}: StarParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showStar, setShowStar] = useState(false);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles(particleCount));
      setShowStar(true);

      const timer = setTimeout(() => {
        setShowStar(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
      setShowStar(false);
    }
  }, [isActive, particleCount, duration, onComplete]);

  return (
    <AnimatePresence>
      {showStar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[100]"
        >
          {/* Central Star Burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1.5, 1],
              rotate: [0, 180],
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="text-6xl">⭐</div>
          </motion.div>

          {/* Glow Effect */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 3, 4],
              opacity: [0, 0.8, 0],
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Particles */}
          {particles.map((particle) => {
            const radians = (particle.angle * Math.PI) / 180;
            const endX = Math.cos(radians) * particle.distance;
            const endY = Math.sin(radians) * particle.distance;

            return (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: endX,
                  y: endY,
                  scale: [0, 1.5, 0.5],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            );
          })}

          {/* Sparkle Trail */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute left-1/2 top-1/2 text-2xl"
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 120,
                y: Math.sin((i / 8) * Math.PI * 2) * 120,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 + i * 0.05,
                ease: 'easeOut',
              }}
            >
              ✨
            </motion.div>
          ))}

          {/* Ring Wave */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400"
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{
              width: 300,
              height: 300,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default StarParticles;
