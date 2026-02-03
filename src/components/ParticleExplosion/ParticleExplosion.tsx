/**
 * ParticleExplosion.tsx
 * ✨ NEBULA PARTICLE SYSTEM v20.0 - Reward Animations
 *
 * Beautiful particle explosions for:
 * - Friend request accepted
 * - Star received
 * - Streak milestone reached
 * - Aura level up
 *
 * @version 20.0.0
 */

import React, { useEffect, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ParticleType = 'purple' | 'gold' | 'star' | 'confetti' | 'aura';

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
  rotation: number;
}

interface ParticleExplosionProps {
  /** Trigger the explosion */
  trigger: boolean;
  /** Type of particles */
  type?: ParticleType;
  /** Number of particles */
  count?: number;
  /** Duration in ms */
  duration?: number;
  /** Center position (default: center of screen) */
  position?: { x: number; y: number };
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Custom colors override */
  colors?: string[];
  /** Size range [min, max] */
  sizeRange?: [number, number];
  /** Distance range [min, max] */
  distanceRange?: [number, number];
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PRESETS
// ═══════════════════════════════════════════════════════════════════════════

const PARTICLE_COLORS: Record<ParticleType, string[]> = {
  purple: ['#A855F7', '#9333EA', '#C084FC', '#7C3AED', '#E879F9'],
  gold: ['#FFD700', '#FFA500', '#FFCC00', '#FFB800', '#FFE066'],
  star: ['#FFD700', '#FFFFFF', '#FFF8DC', '#FFFACD', '#FFE4B5'],
  confetti: ['#A855F7', '#EC4899', '#22D3EE', '#FFD700', '#22C55E', '#F59E0B'],
  aura: ['#A855F7', '#EC4899', '#9333EA', '#C084FC', '#E879F9'],
};

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateParticles(
  count: number,
  colors: string[],
  sizeRange: [number, number],
  distanceRange: [number, number]
): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.2,
    duration: 0.6 + Math.random() * 0.4,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    distance: Math.random() * (distanceRange[1] - distanceRange[0]) + distanceRange[0],
    rotation: Math.random() * 720 - 360,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE PARTICLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ParticleElement: React.FC<{
  particle: Particle;
  type: ParticleType;
}> = memo(({ particle, type }) => {
  const { size, color, delay, duration, angle, distance, rotation } = particle;

  // Calculate final position based on angle and distance
  const radians = (angle * Math.PI) / 180;
  const finalX = Math.cos(radians) * distance;
  const finalY = Math.sin(radians) * distance;

  // Render star shape for star type
  if (type === 'star') {
    return (
      <motion.div
        initial={{
          x: 0,
          y: 0,
          scale: 0,
          opacity: 1,
          rotate: 0,
        }}
        animate={{
          x: finalX,
          y: finalY,
          scale: [0, 1.5, 1, 0],
          opacity: [1, 1, 0.8, 0],
          rotate: rotation,
        }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="absolute"
        style={{
          fontSize: size,
          color: color,
          textShadow: `0 0 ${size / 2}px ${color}`,
        }}
      >
        ⭐
      </motion.div>
    );
  }

  // Default: circular particles
  return (
    <motion.div
      initial={{
        x: 0,
        y: 0,
        scale: 0,
        opacity: 1,
      }}
      animate={{
        x: finalX,
        y: finalY,
        scale: [0, 1, 0.5, 0],
        opacity: [1, 1, 0.5, 0],
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size}px ${color}`,
      }}
    />
  );
});

ParticleElement.displayName = 'ParticleElement';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ParticleExplosion: React.FC<ParticleExplosionProps> = memo(({
  trigger,
  type = 'purple',
  count = 30,
  duration = 1000,
  position,
  onComplete,
  colors,
  sizeRange = [4, 12],
  distanceRange = [50, 150],
}) => {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles when triggered
  useEffect(() => {
    if (trigger && !isActive) {
      const particleColors = colors || PARTICLE_COLORS[type];
      setParticles(generateParticles(count, particleColors, sizeRange, distanceRange));
      setIsActive(true);

      // Trigger haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      // Complete callback
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, type, count, colors, sizeRange, distanceRange, duration, onComplete]);

  // Default to center of screen if no position
  const pos = position || {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[9999]"
        >
          {/* Center point */}
          <div
            className="absolute"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Initial flash */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 2, 3], opacity: [1, 0.5, 0] }}
              transition={{ duration: 0.4 }}
              className="absolute rounded-full"
              style={{
                width: 40,
                height: 40,
                background: `radial-gradient(circle, ${PARTICLE_COLORS[type][0]}, transparent)`,
                left: -20,
                top: -20,
              }}
            />

            {/* Particles */}
            {particles.map((particle) => (
              <ParticleElement
                key={particle.id}
                particle={particle}
                type={type}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ParticleExplosion.displayName = 'ParticleExplosion';

// ═══════════════════════════════════════════════════════════════════════════
// PRESET EXPLOSIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Friend accepted explosion (purple confetti)
 */
export const FriendAcceptedExplosion: React.FC<{
  trigger: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = memo(({ trigger, position, onComplete }) => (
  <ParticleExplosion
    trigger={trigger}
    type="confetti"
    count={50}
    duration={1200}
    position={position}
    onComplete={onComplete}
    distanceRange={[80, 200]}
  />
));

FriendAcceptedExplosion.displayName = 'FriendAcceptedExplosion';

/**
 * Star received explosion (golden stars)
 */
export const StarReceivedExplosion: React.FC<{
  trigger: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = memo(({ trigger, position, onComplete }) => (
  <ParticleExplosion
    trigger={trigger}
    type="star"
    count={20}
    duration={1000}
    position={position}
    onComplete={onComplete}
    sizeRange={[12, 24]}
    distanceRange={[40, 120]}
  />
));

StarReceivedExplosion.displayName = 'StarReceivedExplosion';

/**
 * Streak milestone explosion (fire colors)
 */
export const StreakMilestoneExplosion: React.FC<{
  trigger: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = memo(({ trigger, position, onComplete }) => (
  <ParticleExplosion
    trigger={trigger}
    type="gold"
    count={40}
    duration={1100}
    position={position}
    onComplete={onComplete}
    colors={['#FF6B00', '#FF9500', '#FFB800', '#FFCC00', '#FFD700']}
    distanceRange={[60, 160]}
  />
));

StreakMilestoneExplosion.displayName = 'StreakMilestoneExplosion';

/**
 * Aura level up explosion (purple aura)
 */
export const AuraLevelUpExplosion: React.FC<{
  trigger: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = memo(({ trigger, position, onComplete }) => (
  <ParticleExplosion
    trigger={trigger}
    type="aura"
    count={60}
    duration={1500}
    position={position}
    onComplete={onComplete}
    sizeRange={[6, 16]}
    distanceRange={[100, 250]}
  />
));

AuraLevelUpExplosion.displayName = 'AuraLevelUpExplosion';

// ═══════════════════════════════════════════════════════════════════════════
// HOOK FOR EASY USAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to trigger particle explosions
 */
export function useParticleExplosion() {
  const [explosionState, setExplosionState] = useState<{
    trigger: boolean;
    type: ParticleType;
    position?: { x: number; y: number };
  }>({
    trigger: false,
    type: 'purple',
  });

  const explode = useCallback((
    type: ParticleType = 'purple',
    position?: { x: number; y: number }
  ) => {
    setExplosionState({ trigger: true, type, position });

    // Reset trigger after animation
    setTimeout(() => {
      setExplosionState((prev) => ({ ...prev, trigger: false }));
    }, 100);
  }, []);

  return {
    explosionState,
    explode,
    ParticleExplosionComponent: (
      <ParticleExplosion
        trigger={explosionState.trigger}
        type={explosionState.type}
        position={explosionState.position}
      />
    ),
  };
}

export default ParticleExplosion;
