/**
 * VibeIndicator - Fluid Blob Header Widget
 *
 * An abstract, fluid blob that visualizes the local vibe:
 * - Changes color based on nearby activity
 * - Morphs shape based on conversation density
 * - MIT-level cognitive hook
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface VibeIndicatorProps {
  nearbyCount: number;
  activeConversations: number;
  className?: string;
}

export const VibeIndicator: React.FC<VibeIndicatorProps> = ({
  nearbyCount = 0,
  activeConversations = 0,
  className = '',
}) => {
  // Calculate vibe level
  const vibeLevel = useMemo(() => {
    const score = nearbyCount * 2 + activeConversations * 5;
    if (score >= 30) return 'explosive';
    if (score >= 15) return 'vibrant';
    if (score >= 5) return 'active';
    return 'calm';
  }, [nearbyCount, activeConversations]);

  const vibeConfig = {
    calm: {
      colors: ['#6366f1', '#8b5cf6'],
      morphSpeed: 8,
      pulseSpeed: 4,
      label: 'Ruhig',
      emoji: '😌',
    },
    active: {
      colors: ['#8b5cf6', '#a855f7'],
      morphSpeed: 5,
      pulseSpeed: 3,
      label: 'Aktiv',
      emoji: '✨',
    },
    vibrant: {
      colors: ['#a855f7', '#ec4899'],
      morphSpeed: 3,
      pulseSpeed: 2,
      label: 'Lebendig',
      emoji: '🔥',
    },
    explosive: {
      colors: ['#ec4899', '#f43f5e'],
      morphSpeed: 1.5,
      pulseSpeed: 1,
      label: 'Explosiv',
      emoji: '💥',
    },
  };

  const config = vibeConfig[vibeLevel];

  // SVG path morphing for organic blob shape
  const blobPaths = [
    'M44.5,25 C55,10 75,15 80,30 C85,45 75,60 60,65 C45,70 25,65 20,50 C15,35 30,15 44.5,25',
    'M50,20 C70,15 85,25 85,45 C85,65 70,75 50,75 C30,75 15,60 15,40 C15,20 30,10 50,20',
    'M45,15 C65,10 80,20 85,40 C90,60 75,80 55,80 C35,80 15,65 15,45 C15,25 25,15 45,15',
    'M40,25 C60,10 80,20 80,40 C80,60 65,75 45,75 C25,75 10,55 15,35 C20,15 25,20 40,25',
  ];

  return (
    <motion.div
      className={`relative flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Fluid Blob */}
      <div className="relative w-10 h-10">
        {/* Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.colors[0]}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: config.pulseSpeed, repeat: Infinity }}
        />

        {/* Blob SVG */}
        <motion.svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ filter: `drop-shadow(0 0 10px ${config.colors[0]})` }}
        >
          <defs>
            <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop
                offset="0%"
                animate={{ stopColor: config.colors[0] }}
                transition={{ duration: 0.5 }}
              />
              <motion.stop
                offset="100%"
                animate={{ stopColor: config.colors[1] }}
                transition={{ duration: 0.5 }}
              />
            </linearGradient>
          </defs>

          <motion.path
            fill="url(#vibeGradient)"
            animate={{
              d: blobPaths,
            }}
            transition={{
              duration: config.morphSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.svg>

        {/* Inner shine */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Vibe Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-xs">{config.emoji}</span>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: config.colors[1] }}
          >
            {config.label}
          </span>
        </div>
        <span className="text-[10px] text-white/40">
          {nearbyCount} User • {activeConversations} aktiv
        </span>
      </div>
    </motion.div>
  );
};

// Compact version for tight spaces
export const VibeIndicatorCompact: React.FC<{
  nearbyCount: number;
  className?: string;
}> = ({ nearbyCount, className = '' }) => {
  const intensity = nearbyCount > 10 ? 'hot' : nearbyCount > 3 ? 'warm' : 'cool';

  const colors = {
    cool: '#6366f1',
    warm: '#a855f7',
    hot: '#ec4899',
  };

  return (
    <motion.div
      className={`relative w-8 h-8 ${className}`}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${colors[intensity]}` }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Core */}
      <div
        className="absolute inset-1 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: `linear-gradient(135deg, ${colors[intensity]} 0%, ${colors[intensity]}80 100%)`,
          boxShadow: `0 0 15px ${colors[intensity]}60`,
        }}
      >
        {nearbyCount}
      </div>
    </motion.div>
  );
};

export default VibeIndicator;
