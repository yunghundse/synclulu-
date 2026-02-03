/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEARBY RADAR COMPONENT - Snap Map Style Visualization
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Deep black dark mode radar
 * - Pulsing circle around own profile
 * - Users appear as glowing neon-violet points
 * - Distance-based blur (verschwommen → präzise)
 * - Founder omnipresence indicator
 * - Premium real-time fluidity
 *
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useLiveRadar,
  useNearbyRadarUsers,
  type RadarUser,
  RADAR_CONFIG
} from '@/lib/liveRadarService';
import {
  Radar,
  Ghost,
  Sparkles,
  Crown,
  Shield,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NearbyRadarProps {
  className?: string;
  size?: number;
  showControls?: boolean;
  onUserClick?: (user: RadarUser) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const RADAR_COLORS = {
  // Background
  bg: '#050507',
  bgGradient: 'radial-gradient(circle at center, #0a0a0f 0%, #050507 100%)',

  // Grid
  gridLine: 'rgba(139, 92, 246, 0.08)',
  gridCircle: 'rgba(139, 92, 246, 0.12)',

  // Center pulse
  centerPulse: '#8B5CF6',
  centerGlow: 'rgba(139, 92, 246, 0.3)',

  // User dots
  userDefault: '#A78BFA',
  userPremium: '#C4B5FD',
  userFounder: '#FFD700',
  userActive: '#4ADE80',
  userInactive: '#6B7280',

  // Glows
  neonViolet: '#8B5CF6',
  neonPurple: '#A855F7',
  neonGold: '#FBBF24',

  // Text
  text: '#f5f5f7',
  textMuted: '#71717a',
};

// ═══════════════════════════════════════════════════════════════════════════════
// RADAR GRID COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const RadarGrid = ({ size }: { size: number }) => {
  const center = size / 2;
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0]; // Percentage of radius

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Radial rings */}
      {rings.map((ring, i) => (
        <circle
          key={`ring-${i}`}
          cx={center}
          cy={center}
          r={center * ring * 0.9}
          fill="none"
          stroke={RADAR_COLORS.gridCircle}
          strokeWidth={1}
          strokeDasharray={i === rings.length - 1 ? '4 4' : 'none'}
        />
      ))}

      {/* Cross lines */}
      <line
        x1={center}
        y1={size * 0.05}
        x2={center}
        y2={size * 0.95}
        stroke={RADAR_COLORS.gridLine}
        strokeWidth={1}
      />
      <line
        x1={size * 0.05}
        y1={center}
        x2={size * 0.95}
        y2={center}
        stroke={RADAR_COLORS.gridLine}
        strokeWidth={1}
      />

      {/* Diagonal lines */}
      <line
        x1={size * 0.15}
        y1={size * 0.15}
        x2={size * 0.85}
        y2={size * 0.85}
        stroke={RADAR_COLORS.gridLine}
        strokeWidth={0.5}
      />
      <line
        x1={size * 0.85}
        y1={size * 0.15}
        x2={size * 0.15}
        y2={size * 0.85}
        stroke={RADAR_COLORS.gridLine}
        strokeWidth={0.5}
      />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CENTER PULSE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CenterPulse = ({ size }: { size: number }) => {
  return (
    <div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Outer pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: `2px solid ${RADAR_COLORS.centerPulse}`,
            opacity: 0.6 - i * 0.2,
          }}
          animate={{
            scale: [1, 2.5 + i * 0.5],
            opacity: [0.6 - i * 0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Center dot with glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.04,
          height: size * 0.04,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: RADAR_COLORS.centerPulse,
          boxShadow: `
            0 0 10px ${RADAR_COLORS.centerGlow},
            0 0 20px ${RADAR_COLORS.centerGlow},
            0 0 40px ${RADAR_COLORS.centerGlow}
          `,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* "Du" label */}
      <div
        className="absolute text-xs font-medium whitespace-nowrap"
        style={{
          left: '50%',
          top: '100%',
          transform: 'translate(-50%, 8px)',
          color: RADAR_COLORS.text,
          textShadow: `0 0 8px ${RADAR_COLORS.centerGlow}`,
        }}
      >
        Du
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER DOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const UserDot = ({
  user,
  size,
  onClick
}: {
  user: RadarUser;
  size: number;
  onClick?: () => void;
}) => {
  // Calculate position
  const x = user.position.x * size;
  const y = user.position.y * size;

  // Get color based on user type
  const getColor = () => {
    if (user.isFounder) return RADAR_COLORS.userFounder;
    if (user.isPremium) return RADAR_COLORS.userPremium;
    if (user.isActive) return RADAR_COLORS.userActive;
    return RADAR_COLORS.userDefault;
  };

  const color = getColor();

  // Size based on tier (closer = bigger)
  const dotSize = {
    immediate: 16,
    near: 14,
    medium: 12,
    far: 10,
    edge: 8,
    hidden: 6,
  }[user.tier];

  // Blur filter
  const blurFilter = user.blurLevel > 0
    ? `blur(${user.blurLevel * 4}px)`
    : 'none';

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: user.isFounder ? 100 : 10,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: user.opacity,
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.3 }}
      onClick={onClick}
    >
      {/* Glow ring for founders/premium */}
      {(user.isFounder || user.isPremium) && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: dotSize + 12,
            height: dotSize + 12,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main dot */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: dotSize,
          height: dotSize,
          background: color,
          filter: blurFilter,
          boxShadow: `
            0 0 6px ${color}80,
            0 0 12px ${color}40
          `,
        }}
      >
        {/* Icon for special users */}
        {user.isFounder && (
          <Crown size={dotSize * 0.6} color="#000" />
        )}
        {user.isPremium && !user.isFounder && (
          <Sparkles size={dotSize * 0.5} color="#000" />
        )}
      </div>

      {/* Distance label */}
      <div
        className="absolute text-[10px] font-medium whitespace-nowrap"
        style={{
          left: '50%',
          top: '100%',
          transform: 'translate(-50%, 4px)',
          color: RADAR_COLORS.textMuted,
          filter: blurFilter,
          opacity: user.opacity,
        }}
      >
        {user.distanceLabel}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RADAR SWEEP ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const RadarSweep = ({ size }: { size: number }) => {
  const center = size / 2;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: center,
        top: center,
        width: center * 0.9,
        height: center * 0.9,
        transformOrigin: '0 0',
        background: `conic-gradient(
          from 0deg,
          transparent 0deg,
          ${RADAR_COLORS.neonViolet}15 10deg,
          ${RADAR_COLORS.neonViolet}05 30deg,
          transparent 60deg
        )`,
        borderRadius: '0 100% 0 0',
      }}
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const NearbyRadar = ({
  className = '',
  size = 320,
  showControls = true,
  onUserClick,
}: NearbyRadarProps) => {
  const {
    isTracking,
    currentLocation,
    error,
    isFounder: isCurrentUserFounder,
    founderMode,
    startTracking,
    stopTracking,
    setGhostMode,
    searchRadius,
  } = useLiveRadar();

  const { users, isLoading, refresh } = useNearbyRadarUsers();
  const [showGhostToggle, setShowGhostToggle] = useState(false);

  // Auto-start tracking on mount
  useEffect(() => {
    if (!isTracking) {
      startTracking();
    }
    return () => {
      // Don't stop on unmount - let it run
    };
  }, []);

  // Format search radius
  const radiusLabel = useMemo(() => {
    if (searchRadius >= 40000000) return 'Global';
    if (searchRadius >= 1000) return `${(searchRadius / 1000).toFixed(0)}km`;
    return `${searchRadius}m`;
  }, [searchRadius]);

  return (
    <div className={`relative ${className}`}>
      {/* Main Radar Container */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          background: RADAR_COLORS.bgGradient,
          border: `2px solid ${RADAR_COLORS.gridCircle}`,
          boxShadow: `
            0 0 20px ${RADAR_COLORS.neonViolet}20,
            inset 0 0 40px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        {/* Grid */}
        <RadarGrid size={size} />

        {/* Sweep animation */}
        <RadarSweep size={size} />

        {/* User dots */}
        <AnimatePresence>
          {users.map((user) => (
            <UserDot
              key={user.id}
              user={user}
              size={size}
              onClick={() => onUserClick?.(user)}
            />
          ))}
        </AnimatePresence>

        {/* Center pulse (you) */}
        <CenterPulse size={size} />

        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(5, 5, 7, 0.7)' }}
          >
            <Loader2
              size={32}
              className="animate-spin"
              color={RADAR_COLORS.neonViolet}
            />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
            style={{ background: 'rgba(5, 5, 7, 0.9)' }}
          >
            <MapPin size={24} color={RADAR_COLORS.textMuted} />
            <span
              className="text-sm text-center"
              style={{ color: RADAR_COLORS.textMuted }}
            >
              {error}
            </span>
          </div>
        )}

        {/* Ghost mode indicator */}
        {founderMode.ghostMode && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Ghost size={14} color={RADAR_COLORS.neonViolet} />
            <span className="text-xs" style={{ color: RADAR_COLORS.neonViolet }}>
              Ghost Mode
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center justify-between mt-3 px-2"
        style={{ width: size }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isTracking ? RADAR_COLORS.userActive : RADAR_COLORS.userInactive,
              boxShadow: isTracking ? `0 0 6px ${RADAR_COLORS.userActive}` : 'none',
            }}
          />
          <span className="text-xs" style={{ color: RADAR_COLORS.textMuted }}>
            {isTracking ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: RADAR_COLORS.textMuted }}>
            {users.length} {users.length === 1 ? 'Person' : 'Personen'}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: RADAR_COLORS.neonViolet + '20',
              color: RADAR_COLORS.neonViolet,
            }}
          >
            {radiusLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div
          className="flex items-center justify-center gap-3 mt-4"
          style={{ width: size }}
        >
          {/* Refresh button */}
          <motion.button
            className="p-2.5 rounded-xl"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
          >
            <RefreshCw size={18} color={RADAR_COLORS.neonViolet} />
          </motion.button>

          {/* Ghost mode toggle (founder only) */}
          {isCurrentUserFounder && (
            <motion.button
              className="p-2.5 rounded-xl flex items-center gap-2"
              style={{
                background: founderMode.ghostMode
                  ? RADAR_COLORS.neonViolet + '30'
                  : 'rgba(139, 92, 246, 0.1)',
                border: `1px solid ${founderMode.ghostMode
                  ? RADAR_COLORS.neonViolet
                  : 'rgba(139, 92, 246, 0.2)'}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGhostMode(!founderMode.ghostMode)}
            >
              {founderMode.ghostMode ? (
                <EyeOff size={18} color={RADAR_COLORS.neonViolet} />
              ) : (
                <Eye size={18} color={RADAR_COLORS.neonViolet} />
              )}
              <span className="text-xs" style={{ color: RADAR_COLORS.neonViolet }}>
                {founderMode.ghostMode ? 'Sichtbar' : 'Ghost'}
              </span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI RADAR (for compact displays)
// ═══════════════════════════════════════════════════════════════════════════════

export const MiniRadar = ({
  size = 120,
  onClick,
}: {
  size?: number;
  onClick?: () => void;
}) => {
  const { isTracking } = useLiveRadar();
  const { users } = useNearbyRadarUsers();

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{
        width: size,
        height: size,
        background: RADAR_COLORS.bgGradient,
        borderRadius: '50%',
        border: `1px solid ${RADAR_COLORS.gridCircle}`,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Simple grid */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px dashed ${RADAR_COLORS.gridCircle}`,
          margin: size * 0.2,
        }}
      />

      {/* Center dot */}
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: RADAR_COLORS.centerPulse,
          boxShadow: `0 0 8px ${RADAR_COLORS.centerGlow}`,
        }}
      />

      {/* User count badge */}
      {users.length > 0 && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            background: RADAR_COLORS.neonViolet,
            color: '#fff',
          }}
        >
          {users.length}
        </div>
      )}

      {/* Status dot */}
      <div
        className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
        style={{
          background: isTracking ? RADAR_COLORS.userActive : RADAR_COLORS.userInactive,
        }}
      />
    </motion.div>
  );
};

export default NearbyRadar;
