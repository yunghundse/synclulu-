/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRYSTAL CLOUD v27.0 - Sovereign Voice Room Design
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Premium Voice Room Visualization:
 * - Crystalline glass morphism with light refraction
 * - Dynamic iridescent edges based on activity
 * - Physics-based breathing animation
 * - Particle effects for active speakers
 *
 * @version 27.0.0
 * @design Chief Visionary Officer - synclulu
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Users, Mic, MicOff, Sparkles, Crown, Volume2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CrystalRoomData {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
  activityLevel: number;    // 0-1 conversation density
  vibeScore: number;        // 0-100
  topics?: string[];
  isLive: boolean;
  hasFounder?: boolean;
  isPremium?: boolean;
  speakingUsers?: string[]; // UIDs of currently speaking users
}

interface CrystalCloudProps {
  room: CrystalRoomData;
  onClick?: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'map' | 'list';
}

// ═══════════════════════════════════════════════════════════════════════════
// CRYSTAL COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const CRYSTAL_THEMES = {
  calm: {
    primary: 'rgba(99, 102, 241, 0.15)',      // Indigo
    edge: 'rgba(99, 102, 241, 0.4)',
    glow: '0 0 30px rgba(99, 102, 241, 0.3)',
    accent: '#818CF8',
  },
  moderate: {
    primary: 'rgba(139, 92, 246, 0.18)',      // Violet
    edge: 'rgba(139, 92, 246, 0.5)',
    glow: '0 0 40px rgba(139, 92, 246, 0.4)',
    accent: '#A78BFA',
  },
  active: {
    primary: 'rgba(168, 85, 247, 0.22)',      // Purple
    edge: 'rgba(168, 85, 247, 0.6)',
    glow: '0 0 50px rgba(168, 85, 247, 0.5)',
    accent: '#C084FC',
  },
  energetic: {
    primary: 'rgba(217, 70, 239, 0.25)',      // Fuchsia
    edge: 'rgba(217, 70, 239, 0.7)',
    glow: '0 0 60px rgba(217, 70, 239, 0.5), 0 0 100px rgba(217, 70, 239, 0.3)',
    accent: '#E879F9',
  },
  premium: {
    primary: 'rgba(251, 191, 36, 0.2)',       // Amber
    edge: 'rgba(251, 191, 36, 0.6)',
    glow: '0 0 50px rgba(251, 191, 36, 0.4)',
    accent: '#FCD34D',
  },
};

function getCrystalTheme(activityLevel: number, isPremium?: boolean) {
  if (isPremium) return CRYSTAL_THEMES.premium;
  if (activityLevel < 0.25) return CRYSTAL_THEMES.calm;
  if (activityLevel < 0.5) return CRYSTAL_THEMES.moderate;
  if (activityLevel < 0.75) return CRYSTAL_THEMES.active;
  return CRYSTAL_THEMES.energetic;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

const SIZE_MAP = {
  sm: { base: 80, icon: 16, text: 10 },
  md: { base: 110, icon: 20, text: 12 },
  lg: { base: 140, icon: 24, text: 14 },
};

// ═══════════════════════════════════════════════════════════════════════════
// CRYSTAL REFRACTION LAYER
// ═══════════════════════════════════════════════════════════════════════════

const CrystalRefraction = memo(function CrystalRefraction({
  size,
  activityLevel,
}: {
  size: number;
  activityLevel: number;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] will-change-transform" style={{ transform: 'translateZ(0)' }}>
      {/* Primary Refraction Line */}
      <motion.div
        className="absolute"
        style={{
          width: '200%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 30%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.3) 70%, transparent 100%)',
          top: '30%',
          left: '-50%',
          transform: 'rotate(-25deg)',
        }}
        animate={{
          x: ['-50%', '50%'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary Refraction */}
      <motion.div
        className="absolute"
        style={{
          width: '150%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
          top: '60%',
          left: '-25%',
          transform: 'rotate(15deg)',
        }}
        animate={{
          x: ['0%', '30%', '0%'],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Iridescent Edge Highlight */}
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `linear-gradient(
            ${activityLevel * 360}deg,
            rgba(255, 100, 100, 0.1) 0%,
            rgba(255, 200, 100, 0.1) 25%,
            rgba(100, 255, 200, 0.1) 50%,
            rgba(100, 100, 255, 0.1) 75%,
            rgba(255, 100, 255, 0.1) 100%
          )`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// SPEAKING INDICATOR PARTICLES
// ═══════════════════════════════════════════════════════════════════════════

const SpeakingParticles = memo(function SpeakingParticles({
  isActive,
  accentColor,
}: {
  isActive: boolean;
  accentColor: string;
}) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: accentColor,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 6px ${accentColor}`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            x: [0, Math.cos((i / 6) * Math.PI * 2) * 50],
            y: [0, Math.sin((i / 6) * Math.PI * 2) * 50],
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// USER COUNT BADGE
// ═══════════════════════════════════════════════════════════════════════════

const UserCountBadge = memo(function UserCountBadge({
  count,
  max,
  accentColor,
}: {
  count: number;
  max: number;
  accentColor: string;
}) {
  const isFull = count >= max;
  const isAlmostFull = count >= max * 0.8;

  return (
    <motion.div
      className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        background: isFull
          ? 'rgba(239, 68, 68, 0.9)'
          : isAlmostFull
          ? 'rgba(251, 191, 36, 0.9)'
          : 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isFull ? 'rgba(239, 68, 68, 0.5)' : accentColor}`,
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      <Users size={10} className="text-white/80" />
      <span className="text-[10px] font-bold text-white">
        {count}/{max}
      </span>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CRYSTAL CLOUD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CrystalCloud = memo(function CrystalCloud({
  room,
  onClick,
  isSelected = false,
  size = 'md',
  variant = 'default',
}: CrystalCloudProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localActivity, setLocalActivity] = useState(room.activityLevel);

  const sizeConfig = SIZE_MAP[size];
  const theme = getCrystalTheme(room.activityLevel, room.isPremium);
  const hasSpeakingUsers = room.speakingUsers && room.speakingUsers.length > 0;

  // Breathing animation based on activity
  const breathingScale = useMotionValue(1);
  const breathingSpring = useSpring(breathingScale, {
    stiffness: 50,
    damping: 10,
  });

  // Simulate activity changes
  useEffect(() => {
    if (!hasSpeakingUsers) return;

    const interval = setInterval(() => {
      const variation = Math.sin(Date.now() / 500) * 0.03;
      breathingScale.set(1 + variation);
    }, 50);

    return () => clearInterval(interval);
  }, [hasSpeakingUsers, breathingScale]);

  // Click handler
  const handleClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 10, 15]);
    }
    onClick?.();
  }, [onClick]);

  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      className="relative cursor-pointer touch-manipulation group"
      style={{
        width: sizeConfig.base,
        height: sizeConfig.base,
      }}
    >
      {/* Outer Glow */}
      <motion.div
        className="absolute -inset-3 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.edge} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered || hasSpeakingUsers ? 1 : 0.5,
          scale: hasSpeakingUsers ? [1, 1.1, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Main Crystal Body - GPU Accelerated */}
      <motion.div
        className="relative w-full h-full rounded-3xl overflow-hidden will-change-transform"
        style={{
          scale: breathingSpring,
          background: theme.primary,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1.5px solid ${theme.edge}`,
          boxShadow: isSelected ? theme.glow : 'none',
          transform: 'translateZ(0)', // GPU Layer
        }}
        animate={{
          borderRadius: isHovered ? '28px' : '24px',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Crystal Refraction Effects */}
        <CrystalRefraction size={sizeConfig.base} activityLevel={room.activityLevel} />

        {/* Speaking Particles */}
        <SpeakingParticles isActive={hasSpeakingUsers || false} accentColor={theme.accent} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-3">
          {/* Room Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {room.hasFounder ? (
              <Crown size={sizeConfig.icon} className="text-amber-400" />
            ) : hasSpeakingUsers ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Volume2 size={sizeConfig.icon} style={{ color: theme.accent }} />
              </motion.div>
            ) : (
              <Mic size={sizeConfig.icon} className="text-white/60" />
            )}
          </div>

          {/* Room Name */}
          <p
            className="text-white/90 font-semibold text-center line-clamp-1 px-1"
            style={{ fontSize: sizeConfig.text }}
          >
            {room.name}
          </p>

          {/* Live Indicator */}
          {room.isLive && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-medium">LIVE</span>
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* User Count Badge */}
      <UserCountBadge count={room.userCount} max={room.maxUsers} accentColor={theme.accent} />

      {/* Premium Indicator */}
      {room.isPremium && (
        <motion.div
          className="absolute -top-1 -left-1"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <Sparkles size={16} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' }} />
        </motion.div>
      )}

      {/* Selection Ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute -inset-2 rounded-[32px] pointer-events-none"
            style={{
              border: `2px solid ${theme.accent}`,
              boxShadow: theme.glow,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// CRYSTAL CLOUD GRID
// ═══════════════════════════════════════════════════════════════════════════

interface CrystalCloudGridProps {
  rooms: CrystalRoomData[];
  onRoomClick?: (roomId: string) => void;
  selectedRoomId?: string;
}

export const CrystalCloudGrid = memo(function CrystalCloudGrid({
  rooms,
  onRoomClick,
  selectedRoomId,
}: CrystalCloudGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles size={32} className="text-violet-400/50" />
        </motion.div>
        <p className="text-white/40 text-sm text-center">
          Keine Rooms in der Nähe
        </p>
        <p className="text-white/25 text-xs text-center mt-1">
          Erstelle den ersten Room!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {rooms.map((room, index) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.05,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          <CrystalCloud
            room={room}
            onClick={() => onRoomClick?.(room.id)}
            isSelected={selectedRoomId === room.id}
            size="md"
          />
        </motion.div>
      ))}
    </div>
  );
});

export default CrystalCloud;
