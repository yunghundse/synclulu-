/**
 * InfiniteParticleField - Living Stardust Background
 *
 * A reactive particle system that responds to:
 * - Mouse/touch position
 * - Device gyroscope data
 * - Creates the feeling of navigating through real stardust
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
  color: string;
}

interface InfiniteParticleFieldProps {
  particleCount?: number;
  className?: string;
}

export const InfiniteParticleField: React.FC<InfiniteParticleFieldProps> = ({
  particleCount = 60,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Motion values for cursor/gyro tracking
  const cursorX = useMotionValue(0.5);
  const cursorY = useMotionValue(0.5);
  const springConfig = { stiffness: 50, damping: 30 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  // Color palette for particles
  const colors = [
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(168, 85, 247, 0.7)',   // Violet
    'rgba(192, 132, 252, 0.6)',  // Light Purple
    'rgba(99, 102, 241, 0.5)',   // Indigo
    'rgba(236, 72, 153, 0.4)',   // Pink accent
    'rgba(255, 255, 255, 0.9)',  // White stars
  ];

  // Initialize particles
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);
  }, [particleCount]);

  // Mouse/Touch tracking
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cursorX.set(x);
    cursorY.set(y);
  }, [cursorX, cursorY]);

  // Gyroscope tracking
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // Normalize to 0-1 range
        const x = (e.gamma + 45) / 90;
        const y = (e.beta + 45) / 90;
        cursorX.set(Math.max(0, Math.min(1, x)));
        cursorY.set(Math.max(0, Math.min(1, y)));
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [cursorX, cursorY]);

  // Animate particles
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setParticles(prev => prev.map(particle => {
        // Get cursor influence
        const cursorInfluenceX = (smoothX.get() - 0.5) * 0.3;
        const cursorInfluenceY = (smoothY.get() - 0.5) * 0.3;

        // Update position with cursor influence
        let newX = particle.x + Math.cos(particle.angle) * particle.speed * 50 + cursorInfluenceX;
        let newY = particle.y + Math.sin(particle.angle) * particle.speed * 50 + cursorInfluenceY;

        // Wrap around edges
        if (newX < -5) newX = 105;
        if (newX > 105) newX = -5;
        if (newY < -5) newY = 105;
        if (newY > 105) newY = -5;

        return {
          ...particle,
          x: newX,
          y: newY,
          // Slight angle drift
          angle: particle.angle + (Math.random() - 0.5) * 0.02,
        };
      }));

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [smoothX, smoothY]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      onPointerMove={handlePointerMove}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Depth Fog Layers */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
            opacity: particle.opacity,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.3, particle.opacity],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Large Nebula Blobs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          left: '20%',
          top: '30%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          right: '10%',
          bottom: '20%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -25, 0],
          y: [0, 15, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </div>
  );
};

export default InfiniteParticleField;
