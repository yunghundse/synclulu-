/**
 * NebulaBackground.tsx
 * 🌌 NEBULA DESIGN SYSTEM v20.0 - Immersive Background
 *
 * Apple × WhatsApp × Meta × Snapchat Fusion
 * Deep organic floating elements, particle systems, and cosmic effects.
 *
 * @version 20.0.0
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NebulaBackgroundProps {
  /** Intensity of the effect (0-1) */
  intensity?: number;
  /** Show cyan blob */
  showCyan?: boolean;
  /** Show fuchsia blob */
  showFuchsia?: boolean;
  /** Show purple blob */
  showPurple?: boolean;
  /** Show particle overlay */
  showParticles?: boolean;
  /** Additional className */
  className?: string;
  /** Variant: 'default' | 'room' | 'messenger' */
  variant?: 'default' | 'room' | 'messenger';
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

const blobAnimations = {
  cyan: {
    default: {
      x: [0, -50, 40, 0],
      y: [0, 30, -40, 0],
      scale: [1, 1.05, 0.95, 1],
    },
    room: {
      x: [0, -30, 20, 0],
      y: [0, 20, -30, 0],
      scale: [1, 1.1, 0.9, 1],
    },
  },
  fuchsia: {
    default: {
      x: [0, 60, -30, 0],
      y: [0, -20, 50, 0],
      scale: [1, 0.9, 1.1, 1],
    },
    room: {
      x: [0, 40, -10, 0],
      y: [0, -10, 40, 0],
      scale: [1, 0.95, 1.05, 1],
    },
  },
  purple: {
    default: {
      x: [0, -20, 50, 0],
      y: [0, 50, -20, 0],
      rotate: [0, 180, 360],
    },
    room: {
      x: [0, -20, 30, 0],
      y: [0, 30, -20, 0],
      rotate: [0, 90, 180],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// NEBULA BACKGROUND v20.0
// ═══════════════════════════════════════════════════════════════════════════

export const NebulaBackground: React.FC<NebulaBackgroundProps> = memo(({
  intensity = 1,
  showCyan = true,
  showFuchsia = true,
  showPurple = true,
  showParticles = true,
  className = '',
  variant = 'default',
}) => {
  const opacityMultiplier = intensity * 0.1;
  const animationType = variant === 'room' ? 'room' : 'default';

  // Memoized styles
  const gradientStyle = useMemo(() => ({
    background: `linear-gradient(
      135deg,
      rgba(168, 85, 247, ${0.08 * intensity}) 0%,
      transparent 40%,
      rgba(236, 72, 153, ${0.05 * intensity}) 60%,
      transparent 100%
    )`,
    backgroundSize: '400% 400%',
  }), [intensity]);

  const radialPulseStyle = useMemo(() => ({
    background: `radial-gradient(
      circle at 50% 50%,
      rgba(168, 85, 247, ${0.05 * intensity}) 0%,
      transparent 70%
    )`,
  }), [intensity]);

  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient overlay with animation */}
      <div
        className="absolute inset-0 animate-nebula-gradient"
        style={gradientStyle}
      />

      {/* Radial pulse effect */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={radialPulseStyle}
      />

      {/* Floating Blob 1 - Cyan (Top Left) */}
      {showCyan && (
        <motion.div
          className="absolute"
          style={{
            top: '15%',
            left: '15%',
            width: '28rem',
            height: '28rem',
            background: `rgba(34, 211, 238, ${opacityMultiplier * 0.5})`,
            filter: 'blur(120px)',
            borderRadius: '50%',
          }}
          animate={blobAnimations.cyan[animationType]}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Floating Blob 2 - Fuchsia (Bottom Right) */}
      {showFuchsia && (
        <motion.div
          className="absolute"
          style={{
            bottom: '20%',
            right: '15%',
            width: '24rem',
            height: '24rem',
            background: `rgba(232, 121, 249, ${opacityMultiplier * 0.5})`,
            filter: 'blur(120px)',
            borderRadius: '50%',
          }}
          animate={blobAnimations.fuchsia[animationType]}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Floating Blob 3 - Purple (Center) */}
      {showPurple && (
        <motion.div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36rem',
            height: '36rem',
            background: `rgba(168, 85, 247, ${opacityMultiplier * 0.3})`,
            filter: 'blur(150px)',
            borderRadius: '50%',
          }}
          animate={blobAnimations.purple[animationType]}
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Additional ambient glow for room variant */}
      {variant === 'room' && (
        <motion.div
          className="absolute top-1/4 right-1/4"
          style={{
            width: '24rem',
            height: '24rem',
            background: `rgba(34, 211, 238, ${opacityMultiplier * 0.6})`,
            filter: 'blur(150px)',
            borderRadius: '50%',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Particle overlay simulation */}
      {showParticles && (
        <div
          className="absolute inset-0 animate-scroll-particles-v20 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23A855F7' opacity='0.3'/%3E%3Ccircle cx='30' cy='40' r='0.5' fill='%2322D3EE' opacity='0.4'/%3E%3Ccircle cx='70' cy='20' r='0.8' fill='%23E879F9' opacity='0.3'/%3E%3Ccircle cx='90' cy='60' r='0.6' fill='%23A855F7' opacity='0.4'/%3E%3Ccircle cx='50' cy='80' r='0.7' fill='%2322D3EE' opacity='0.3'/%3E%3Ccircle cx='20' cy='70' r='0.5' fill='%23E879F9' opacity='0.4'/%3E%3Ccircle cx='80' cy='90' r='0.8' fill='%23A855F7' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Subtle noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

NebulaBackground.displayName = 'NebulaBackground';

// ═══════════════════════════════════════════════════════════════════════════
// NEBULA BACKGROUND LITE (Performance Version)
// ═══════════════════════════════════════════════════════════════════════════

export const NebulaBackgroundLite: React.FC<{ className?: string }> = memo(({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Simple static gradient - no animations for performance */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 75%, rgba(236, 72, 153, 0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(34, 211, 238, 0.05) 0%, transparent 70%)
          `,
        }}
      />
    </div>
  );
});

NebulaBackgroundLite.displayName = 'NebulaBackgroundLite';

// ═══════════════════════════════════════════════════════════════════════════
// ROOM-SPECIFIC NEBULA BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

export const NebulaRoomBackground: React.FC<{ className?: string }> = memo(({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Deep void base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
        }}
      />

      {/* Primary cyan glow */}
      <motion.div
        className="absolute top-1/4 right-1/4"
        style={{
          width: '24rem',
          height: '24rem',
          background: 'rgba(34, 211, 238, 0.08)',
          filter: 'blur(150px)',
          borderRadius: '50%',
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary purple glow */}
      <motion.div
        className="absolute bottom-1/3 left-1/4"
        style={{
          width: '20rem',
          height: '20rem',
          background: 'rgba(168, 85, 247, 0.06)',
          filter: 'blur(120px)',
          borderRadius: '50%',
        }}
        animate={{
          x: [0, 40, -10, 0],
          y: [0, -10, 40, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
});

NebulaRoomBackground.displayName = 'NebulaRoomBackground';

export default NebulaBackground;
