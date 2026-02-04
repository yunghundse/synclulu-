/**
 * AuraOrb.tsx
 * Multi-Layered Glow-Orb mit Partikelsystem
 * Die Aura wächst und leuchtet basierend auf User-Level
 */

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type AuraLevel = 'spark' | 'flame' | 'nova' | 'sovereign';

interface AuraOrbProps {
  size?: number;
  level: number; // 1-100
  xp?: number;
  maxXp?: number;
  avatarUrl?: string;
  displayName?: string;
  isFounder?: boolean;
  isActive?: boolean;
  showProgress?: boolean;
  onClick?: () => void;
}

// Berechne Aura-Level aus numerischem Level
function getAuraLevel(level: number): AuraLevel {
  if (level >= 51) return 'sovereign';
  if (level >= 31) return 'nova';
  if (level >= 11) return 'flame';
  return 'spark';
}

// Aura-Konfiguration pro Level
const auraConfig: Record<AuraLevel, {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  particleCount: number;
  pulseIntensity: number;
}> = {
  spark: {
    primaryColor: '#60a5fa',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(96, 165, 250, 0.5)',
    particleCount: 4,
    pulseIntensity: 0.8,
  },
  flame: {
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    particleCount: 6,
    pulseIntensity: 1,
  },
  nova: {
    primaryColor: '#a855f7',
    secondaryColor: '#9333ea',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    particleCount: 8,
    pulseIntensity: 1.2,
  },
  sovereign: {
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    particleCount: 12,
    pulseIntensity: 1.5,
  },
};

// Partikel-Komponente
const Particle = memo(function Particle({
  index,
  total,
  color,
  size,
}: {
  index: number;
  total: number;
  color: string;
  size: number;
}) {
  const angle = (360 / total) * index;
  const radius = size * 0.7;
  const delay = (index / total) * 2;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4,
        height: 4,
        background: color,
        boxShadow: `0 0 8px ${color}`,
        left: '50%',
        top: '50%',
        marginLeft: -2,
        marginTop: -2,
      }}
      animate={{
        x: [
          Math.cos((angle * Math.PI) / 180) * radius * 0.8,
          Math.cos((angle * Math.PI) / 180) * radius,
          Math.cos((angle * Math.PI) / 180) * radius * 0.8,
        ],
        y: [
          Math.sin((angle * Math.PI) / 180) * radius * 0.8,
          Math.sin((angle * Math.PI) / 180) * radius,
          Math.sin((angle * Math.PI) / 180) * radius * 0.8,
        ],
        opacity: [0.4, 1, 0.4],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
});

// Orbitaler Progress-Ring
const OrbitalRing = memo(function OrbitalRing({
  progress,
  size,
  color,
}: {
  progress: number;
  size: number;
  color: string;
}) {
  const circumference = 2 * Math.PI * (size / 2 - 4);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className="absolute inset-0"
      style={{ transform: 'rotate(-90deg)' }}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="3"
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
    </svg>
  );
});

// God-Ray Effekt für Founder
const GodRay = memo(function GodRay() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `conic-gradient(
          from 0deg at 50% 50%,
          transparent 0deg,
          rgba(251, 191, 36, 0.15) 15deg,
          transparent 30deg,
          rgba(251, 191, 36, 0.1) 60deg,
          transparent 75deg,
          rgba(251, 191, 36, 0.12) 105deg,
          transparent 120deg
        )`,
        borderRadius: '50%',
        transform: 'scale(2)',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
});

export const AuraOrb = memo(function AuraOrb({
  size = 80,
  level,
  xp = 0,
  maxXp = 1000,
  avatarUrl,
  displayName,
  isFounder = false,
  isActive = true,
  showProgress = true,
  onClick,
}: AuraOrbProps) {
  const auraLevel = getAuraLevel(level);
  const config = auraConfig[auraLevel];
  const progress = (xp / maxXp) * 100;

  // Partikel generieren
  const particles = useMemo(() => {
    return Array.from({ length: config.particleCount }, (_, i) => (
      <Particle
        key={i}
        index={i}
        total={config.particleCount}
        color={config.primaryColor}
        size={size}
      />
    ));
  }, [config.particleCount, config.primaryColor, size]);

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* God-Ray für Founder */}
      {isFounder && <GodRay />}

      {/* Partikel-System */}
      <AnimatePresence>
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            {particles}
          </div>
        )}
      </AnimatePresence>

      {/* Äußerer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          transform: 'scale(1.5)',
        }}
        animate={{
          scale: [1.4, 1.6, 1.4],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3 / config.pulseIntensity,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Mittlerer Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%,
            rgba(255, 255, 255, 0.3) 0%,
            ${config.primaryColor} 40%,
            ${config.secondaryColor} 100%)`,
          boxShadow: `
            0 0 20px ${config.glowColor},
            0 0 40px ${config.glowColor},
            inset 0 0 20px rgba(255, 255, 255, 0.2)
          `,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}, inset 0 0 20px rgba(255, 255, 255, 0.2)`,
            `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}, inset 0 0 30px rgba(255, 255, 255, 0.3)`,
            `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}, inset 0 0 20px rgba(255, 255, 255, 0.2)`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbitaler Progress-Ring */}
      {showProgress && (
        <OrbitalRing
          progress={progress}
          size={size}
          color={config.primaryColor}
        />
      )}

      {/* Avatar */}
      <div
        className="absolute inset-2 rounded-full overflow-hidden"
        style={{
          border: `2px solid ${config.primaryColor}`,
          boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${config.secondaryColor}, ${config.primaryColor})`,
            }}
          >
            <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
              {displayName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Level Badge */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: isFounder
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
          color: 'white',
          boxShadow: `0 2px 8px ${config.glowColor}`,
          fontSize: size * 0.12,
        }}
      >
        {isFounder ? '👑' : `Lvl ${level}`}
      </div>
    </motion.div>
  );
});

export default AuraOrb;

// Helper-Funktion für memo
function memo<T extends React.ComponentType<any>>(Component: T): T {
  return React.memo(Component) as T;
}
