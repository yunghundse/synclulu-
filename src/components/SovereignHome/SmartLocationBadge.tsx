/**
 * SmartLocationBadge.tsx
 * Dynamic location badge showing current location, vibe level, and nearest hotspot
 * Part of the Nebula Command Center
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, Navigation, Wifi } from 'lucide-react';

interface SmartLocationBadgeProps {
  currentLocation?: string;
  vibeLevel: 'niedrig' | 'mittel' | 'hoch' | 'extrem';
  nearestHotspot?: {
    name: string;
    distance: number; // in meters
  };
  isLoading?: boolean;
}

const vibeLevelConfig = {
  niedrig: {
    color: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-400',
    pulseColor: 'bg-gray-500',
    icon: '💤',
  },
  mittel: {
    color: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-400',
    pulseColor: 'bg-blue-500',
    icon: '✨',
  },
  hoch: {
    color: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-400',
    pulseColor: 'bg-violet-500',
    icon: '🔥',
  },
  extrem: {
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-400',
    pulseColor: 'bg-amber-500',
    icon: '⚡',
  },
};

export const SmartLocationBadge = memo(function SmartLocationBadge({
  currentLocation = 'Standort ermitteln...',
  vibeLevel = 'mittel',
  nearestHotspot,
  isLoading = false,
}: SmartLocationBadgeProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const config = vibeLevelConfig[vibeLevel];

  // Cycle through different info displays
  useEffect(() => {
    if (!nearestHotspot) return;

    const interval = setInterval(() => {
      setDisplayIndex((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, [nearestHotspot]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Badge Container */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Animated Gradient Border */}
        <div
          className={`absolute inset-0 opacity-20 bg-gradient-to-r ${config.color}`}
          style={{
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />

        {/* Location Icon with Pulse */}
        <div className="relative flex-shrink-0">
          <MapPin size={16} className="text-violet-400" />
          <motion.div
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${config.pulseColor}`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Info Display with Animation */}
        <div className="flex items-center gap-2 min-w-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-20 h-3 rounded bg-white/10 animate-pulse" />
              </motion.div>
            ) : displayIndex === 0 ? (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-xs text-white/90 font-medium truncate max-w-[120px]">
                  {currentLocation}
                </span>
              </motion.div>
            ) : displayIndex === 1 ? (
              <motion.div
                key="vibe"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5"
              >
                <Zap size={12} className={config.textColor} />
                <span className={`text-xs font-medium ${config.textColor}`}>
                  Vibe: {vibeLevel.charAt(0).toUpperCase() + vibeLevel.slice(1)}
                </span>
                <span className="text-sm">{config.icon}</span>
              </motion.div>
            ) : (
              <motion.div
                key="hotspot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5"
              >
                <Navigation size={12} className="text-emerald-400" />
                <span className="text-xs text-white/90 font-medium truncate max-w-[100px]">
                  {nearestHotspot?.name || 'Kein Hotspot'}
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  {nearestHotspot ? formatDistance(nearestHotspot.distance) : '—'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Connection Status */}
        <div className="flex-shrink-0 ml-1">
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <Wifi size={12} className="text-emerald-500" />
          </motion.div>
        </div>
      </div>

      {/* Glow Effect */}
      <div
        className={`absolute inset-0 -z-10 blur-xl opacity-30 bg-gradient-to-r ${config.color}`}
        style={{ transform: 'scale(0.8)' }}
      />
    </motion.div>
  );
});

export default SmartLocationBadge;
