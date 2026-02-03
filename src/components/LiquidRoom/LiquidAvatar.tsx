/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIQUID AVATAR - Fluid Nebula v14.0 Glow-Engine Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - SVG border-radius morphing (organic blob shape)
 * - Audio-reactive visualizer ring
 * - 🌟 GLOW-ENGINE: Enhanced box-shadow system (0 0 40px rgba(color, 0.3))
 * - Ghost Mode visualization for Founder silent entry
 * - Hover ripple effect
 * - Badge system (Founder/Premium/Host)
 * - Dynamic user-color based glow intensity
 *
 * @version 14.0.0 - Fluid Nebula Glow-Engine
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Shield, UserPlus, Mic, MicOff } from 'lucide-react';
import type { RoomParticipant } from './LiquidRoomExperience';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface LiquidAvatarProps {
  participant: RoomParticipant;
  size: number;
  isSelected: boolean;
  isCurrentUser: boolean;
  isGhost?: boolean; // 👻 Founder Ghost Mode - silent entry
  onClick: () => void;
  onSendFriendRequest: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOW-ENGINE COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dynamic user color based on level and status
 */
function getUserGlowColor(level: number, isFounder: boolean, isPremium: boolean): string {
  if (isFounder) return '255, 215, 0'; // Gold
  if (isPremium) return '168, 85, 247'; // Purple

  // Level-based color gradient (Cyan → Purple → Gold)
  if (level >= 50) return '255, 215, 0'; // Gold (elite)
  if (level >= 30) return '236, 72, 153'; // Pink (advanced)
  if (level >= 15) return '168, 85, 247'; // Purple (intermediate)
  if (level >= 5) return '59, 130, 246'; // Blue (beginner+)
  return '139, 92, 246'; // Default purple
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOB SHAPE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate organic blob border-radius values
 */
function generateBlobRadius(seed: number): string {
  const values = [
    40 + Math.sin(seed) * 20,
    60 + Math.cos(seed * 1.3) * 20,
    70 + Math.sin(seed * 0.7) * 15,
    30 + Math.cos(seed * 1.1) * 20,
    40 + Math.sin(seed * 0.9) * 15,
    50 + Math.cos(seed * 1.5) * 20,
    60 + Math.sin(seed * 1.2) * 15,
    50 + Math.cos(seed * 0.8) * 20,
  ];

  return `${values[0]}% ${values[1]}% ${values[2]}% ${values[3]}% / ${values[4]}% ${values[5]}% ${values[6]}% ${values[7]}%`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO VISUALIZER RING
// ═══════════════════════════════════════════════════════════════════════════════

const AudioVisualizerRing = ({
  audioLevel,
  isSpeaking,
  size,
}: {
  audioLevel: number;
  isSpeaking: boolean;
  size: number;
}) => {
  const bars = 24;
  const radius = size / 2 + 8;

  // Generate bar heights based on audio level
  const barHeights = useMemo(() => {
    return [...Array(bars)].map((_, i) => {
      const baseHeight = 4;
      const maxHeight = 20;
      const variation = Math.sin(i * 0.5 + Date.now() * 0.005) * 0.3 + 0.7;
      return baseHeight + (isSpeaking ? audioLevel * maxHeight * variation : 0);
    });
  }, [audioLevel, isSpeaking, bars]);

  if (!isSpeaking) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size + 40,
        height: size + 40,
        left: -20,
        top: -20,
      }}
    >
      <svg
        width={size + 40}
        height={size + 40}
        viewBox={`0 0 ${size + 40} ${size + 40}`}
      >
        {[...Array(bars)].map((_, i) => {
          const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const x1 = (size + 40) / 2 + Math.cos(angle) * radius;
          const y1 = (size + 40) / 2 + Math.sin(angle) * radius;
          const x2 = (size + 40) / 2 + Math.cos(angle) * (radius + barHeights[i]);
          const y2 = (size + 40) / 2 + Math.sin(angle) * (radius + barHeights[i]);

          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#visualizerGradient)"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isSpeaking ? 0.8 : 0,
                x2,
                y2,
              }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
        <defs>
          <linearGradient id="visualizerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOW EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🌟 GLOW-ENGINE v14.0
 * Enhanced glow system with dynamic box-shadow: 0 0 40px rgba(color, 0.3)
 */
const GlowEffect = ({
  isSpeaking,
  audioLevel,
  size,
  isFounder,
  isPremium,
  level,
  isGhost,
}: {
  isSpeaking: boolean;
  audioLevel: number;
  size: number;
  isFounder: boolean;
  isPremium: boolean;
  level: number;
  isGhost?: boolean;
}) => {
  // Dynamic user color from Glow-Engine
  const userColorRGB = getUserGlowColor(level, isFounder, isPremium);

  // Ghost mode: reduced opacity, ethereal appearance
  const ghostMultiplier = isGhost ? 0.4 : 1;

  // Base glow intensity scales with speaking
  const baseGlow = isSpeaking ? 0.4 + audioLevel * 0.4 : 0.25;
  const glowIntensity = baseGlow * ghostMultiplier;

  // Founder gets extra sparkle layer
  const isElite = isFounder || level >= 30;

  return (
    <>
      {/* 🌟 PRIMARY GLOW-ENGINE: box-shadow: 0 0 40px rgba(color, 0.3) */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 40,
          height: size + 40,
          left: -20,
          top: -20,
          background: `radial-gradient(circle, rgba(${userColorRGB}, ${glowIntensity}) 0%, transparent 60%)`,
          filter: 'blur(20px)',
          boxShadow: `0 0 40px rgba(${userColorRGB}, ${glowIntensity * 0.8})`,
        }}
        animate={{
          opacity: isGhost ? [0.3, 0.5, 0.3] : 1,
          scale: isSpeaking ? [1, 1.15, 1] : 1,
        }}
        transition={{
          duration: isGhost ? 2 : 0.5,
          repeat: isSpeaking || isGhost ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* 👻 Ghost Mode: Ethereal shimmer effect */}
      {isGhost && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size + 60,
            height: size + 60,
            left: -30,
            top: -30,
            background: `radial-gradient(circle, rgba(${userColorRGB}, 0.1) 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* ✨ Elite Sparkle Layer (Founder/High Level) */}
      {isElite && !isGhost && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: size + 30,
            height: size + 30,
            left: -15,
            top: -15,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: `rgba(${userColorRGB}, 0.8)`,
                left: `${50 + 40 * Math.cos(i * Math.PI / 3)}%`,
                top: `${50 + 40 * Math.sin(i * Math.PI / 3)}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 8px rgba(${userColorRGB}, 0.6)`,
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Speaking pulse ring */}
      {isSpeaking && !isGhost && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size,
            height: size,
            border: `2px solid rgba(${userColorRGB}, 0.6)`,
            boxShadow: `0 0 20px rgba(${userColorRGB}, 0.3)`,
          }}
          animate={{
            scale: [1, 1.4],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Second pulse ring for active speakers */}
      {isSpeaking && audioLevel > 0.5 && !isGhost && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size,
            height: size,
            border: `2px solid rgba(${userColorRGB}, 0.4)`,
          }}
          animate={{
            scale: [1, 1.6],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1.2,
            delay: 0.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AvatarBadge = ({
  isFounder,
  isPremium,
  isHost,
  size,
}: {
  isFounder: boolean;
  isPremium: boolean;
  isHost: boolean;
  size: number;
}) => {
  if (!isFounder && !isPremium && !isHost) return null;

  const badgeSize = Math.max(20, size * 0.22);

  return (
    <motion.div
      className="absolute flex items-center justify-center rounded-full"
      style={{
        width: badgeSize,
        height: badgeSize,
        right: 0,
        top: 0,
        background: isFounder
          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
          : isPremium
          ? 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)'
          : 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
        border: '2px solid rgba(0, 0, 0, 0.3)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {isFounder ? (
        <Crown size={badgeSize * 0.6} color="#000" />
      ) : isPremium ? (
        <Sparkles size={badgeSize * 0.6} color="#fff" />
      ) : (
        <Shield size={badgeSize * 0.6} color="#fff" />
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LIQUID AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LiquidAvatar = ({
  participant,
  size,
  isSelected,
  isCurrentUser,
  isGhost = false,
  onClick,
  onSendFriendRequest,
}: LiquidAvatarProps) => {
  const [blobSeed, setBlobSeed] = useState(Math.random() * 100);
  const [isHovered, setIsHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  // Dynamic user color for Glow-Engine
  const userColorRGB = getUserGlowColor(participant.level, participant.isFounder, participant.isPremium);

  // Animate blob morphing
  useEffect(() => {
    const interval = setInterval(() => {
      setBlobSeed(prev => prev + 0.05);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Generate blob shapes for animation
  const blobShapes = useMemo(() => [
    generateBlobRadius(blobSeed),
    generateBlobRadius(blobSeed + 2),
    generateBlobRadius(blobSeed + 4),
  ], [blobSeed]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setTimeout(() => setRipple(null), 600);
    onClick();
  };

  // Ghost mode opacity modifier
  const ghostOpacity = isGhost ? 0.6 : 1;

  return (
    <div
      className="relative cursor-pointer"
      style={{
        width: size,
        height: size,
        opacity: ghostOpacity,
        transition: 'opacity 0.3s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🌟 Glow-Engine v14.0 */}
      <GlowEffect
        isSpeaking={participant.isSpeaking}
        audioLevel={participant.audioLevel}
        size={size}
        isFounder={participant.isFounder}
        isPremium={participant.isPremium}
        level={participant.level}
        isGhost={isGhost}
      />

      {/* Audio Visualizer Ring */}
      <AudioVisualizerRing
        audioLevel={participant.audioLevel}
        isSpeaking={participant.isSpeaking}
        size={size}
      />

      {/* Main Blob Container - Glow-Engine Enhanced */}
      <motion.div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: blobShapes[0],
          border: isSelected
            ? `3px solid rgba(${userColorRGB}, 0.9)`
            : isCurrentUser
            ? `3px solid rgba(${userColorRGB}, 0.6)`
            : isGhost
            ? '2px dashed rgba(255, 255, 255, 0.2)'
            : '2px solid rgba(255, 255, 255, 0.15)',
          // 🌟 GLOW-ENGINE: Primary box-shadow effect
          boxShadow: isGhost
            ? `0 0 30px rgba(${userColorRGB}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
            : `
              0 0 40px rgba(${userColorRGB}, 0.3),
              0 4px 20px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
        }}
        animate={{
          borderRadius: blobShapes,
          scale: isHovered ? 1.08 : 1,
        }}
        transition={{
          borderRadius: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.3 },
        }}
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
      >
        {/* Avatar Image */}
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: participant.avatarUrl
              ? `url(${participant.avatarUrl})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        />

        {/* Glassmorphism overlay on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-white text-xs font-medium text-center px-2 truncate w-full">
                {participant.displayName}
              </span>
              <span className="text-white/60 text-[10px]">
                @{participant.username}
              </span>
              <span className="text-purple-300 text-[10px] mt-1">
                Lvl {participant.level}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ripple effect */}
        <AnimatePresence>
          {ripple && (
            <motion.span
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: size * 2, height: size * 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>

        {/* Muted indicator */}
        {participant.isMuted && (
          <div
            className="absolute bottom-1 right-1 p-1 rounded-full"
            style={{ background: 'rgba(239, 68, 68, 0.8)' }}
          >
            <MicOff size={10} color="#fff" />
          </div>
        )}
      </motion.div>

      {/* Badge */}
      <AvatarBadge
        isFounder={participant.isFounder}
        isPremium={participant.isPremium}
        isHost={participant.isHost}
        size={size}
      />

      {/* Name label (below avatar) - Glow-Engine Enhanced */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: isGhost ? 0.6 : 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            color: isCurrentUser ? `rgb(${userColorRGB})` : '#fff',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 0 10px rgba(${userColorRGB}, 0.2)`,
          }}
        >
          {/* 👻 Ghost indicator */}
          {isGhost && (
            <span className="text-[10px] opacity-70">👻</span>
          )}
          {isCurrentUser ? 'Du' : participant.displayName.split(' ')[0]}
        </span>
      </motion.div>

      {/* Add Friend button (on selected, not current user) */}
      <AnimatePresence>
        {isSelected && !isCurrentUser && (
          <motion.button
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onSendFriendRequest();
            }}
          >
            <UserPlus size={12} className="text-purple-300" />
            <span className="text-purple-200 text-xs">Hinzufügen</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiquidAvatar;
