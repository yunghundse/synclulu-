/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIQUID CLOUD COMPONENTS - Airbnb UI Chief × Framer Motion
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Adaptive cloud room buttons with:
 * - Dynamic size based on user count: size = 1 / (userCount × 0.5)
 * - Morphing border-radius (circle → hexagon as users increase)
 * - Color gradient from blue (calm) → violet (active)
 * - Blob animation effects when users join/speak
 * - Hexagon mesh for crowded rooms
 *
 * @author UI Chief (Airbnb) × Motion Designer
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Users, Mic, MicOff, Sparkles, Crown, MessageCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CloudRoomData {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
  activityLevel: number;    // 0-1 conversation density
  vibeScore: number;        // 0-100
  topics: string[];
  isLive: boolean;
  hasFounder?: boolean;
  isPremium?: boolean;
}

interface LiquidCloudProps {
  room: CloudRoomData;
  onClick?: () => void;
  isSelected?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const CLOUD_COLORS = {
  // Base gradients (activity-based)
  calm: {
    primary: '#3B82F6',      // Blue
    secondary: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  moderate: {
    primary: '#8B5CF6',      // Violet
    secondary: '#A78BFA',
    glow: 'rgba(139, 92, 246, 0.3)',
  },
  active: {
    primary: '#A855F7',      // Purple
    secondary: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  energetic: {
    primary: '#D946EF',      // Fuchsia
    secondary: '#E879F9',
    glow: 'rgba(217, 70, 239, 0.5)',
  },

  // Special states
  premium: {
    primary: '#FBBF24',
    secondary: '#FCD34D',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  founder: {
    primary: '#FFD700',
    secondary: '#FFF176',
    glow: 'rgba(255, 215, 0, 0.5)',
  },

  // Dark mode base
  bg: '#0a0a0f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
};

/**
 * Get color scheme based on activity level
 */
function getActivityColors(activityLevel: number, isPremium?: boolean, hasFounder?: boolean) {
  if (hasFounder) return CLOUD_COLORS.founder;
  if (isPremium) return CLOUD_COLORS.premium;

  if (activityLevel < 0.25) return CLOUD_COLORS.calm;
  if (activityLevel < 0.5) return CLOUD_COLORS.moderate;
  if (activityLevel < 0.75) return CLOUD_COLORS.active;
  return CLOUD_COLORS.energetic;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHAPE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate dynamic size based on user count
 * Formula: size = baseSize / (userCount × 0.5 + 0.5)
 */
function calculateCloudSize(userCount: number, baseSize: number): number {
  const scaleFactor = 1 / (userCount * 0.3 + 0.7);
  return Math.max(baseSize * 0.6, baseSize * scaleFactor);
}

/**
 * Calculate border radius based on user count
 * Few users = circle (50%), Many users = hexagon-ish (20%)
 */
function calculateBorderRadius(userCount: number): string {
  const maxRadius = 50; // Perfect circle
  const minRadius = 15; // Hexagon-ish
  const radius = Math.max(minRadius, maxRadius - userCount * 5);
  return `${radius}%`;
}

/**
 * Generate blob path for organic shapes
 */
function generateBlobPath(seed: number, variance: number = 0.1): string {
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  const baseRadius = 45;

  let path = 'M ';

  for (let i = 0; i <= points; i++) {
    const angle = i * angleStep;
    const randomVariance = Math.sin(seed + i * 1.5) * variance * baseRadius;
    const r = baseRadius + randomVariance;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);

    if (i === 0) {
      path += `${x},${y} `;
    } else {
      // Bezier curve for smooth blob
      const prevAngle = (i - 1) * angleStep;
      const cpRadius = r * 0.55;
      const cp1x = 50 + (baseRadius + randomVariance * 0.5) * Math.cos(prevAngle + angleStep * 0.5);
      const cp1y = 50 + (baseRadius + randomVariance * 0.5) * Math.sin(prevAngle + angleStep * 0.5);
      path += `Q ${cp1x},${cp1y} ${x},${y} `;
    }
  }

  return path + 'Z';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOB SVG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const BlobShape = ({
  colors,
  activityLevel,
  isAnimating
}: {
  colors: typeof CLOUD_COLORS.calm;
  activityLevel: number;
  isAnimating: boolean;
}) => {
  const [seed, setSeed] = useState(Math.random() * 100);

  // Animate blob morphing
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setSeed(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const path1 = generateBlobPath(seed, 0.1 + activityLevel * 0.15);
  const path2 = generateBlobPath(seed + 2, 0.08 + activityLevel * 0.12);

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      style={{ filter: `drop-shadow(0 0 20px ${colors.glow})` }}
    >
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.7" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow blob */}
      <motion.path
        d={path1}
        fill={`url(#grad-${seed})`}
        opacity={0.6}
        filter="url(#glow)"
        animate={{ d: path1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      {/* Inner blob */}
      <motion.path
        d={path2}
        fill={`url(#grad-${seed})`}
        animate={{ d: path2 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LIQUID CLOUD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LiquidCloud = ({
  room,
  onClick,
  isSelected = false,
  showDetails = true,
  size = 'md'
}: LiquidCloudProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Size configuration
  const baseSizes = { sm: 80, md: 120, lg: 160 };
  const baseSize = baseSizes[size];

  // Calculate dynamic properties
  const cloudSize = calculateCloudSize(room.userCount, baseSize);
  const borderRadius = calculateBorderRadius(room.userCount);
  const colors = getActivityColors(room.activityLevel, room.isPremium, room.hasFounder);

  // Simulate speaking activity
  useEffect(() => {
    if (room.activityLevel > 0.3 && room.isLive) {
      const interval = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 500 + Math.random() * 1000);
      return () => clearInterval(interval);
    }
  }, [room.activityLevel, room.isLive]);

  // Animation springs
  const scale = useSpring(isHovered ? 1.08 : 1, { stiffness: 300, damping: 20 });
  const glow = useSpring(isHovered ? 1.5 : 1, { stiffness: 200, damping: 25 });

  // Fill percentage (users / max)
  const fillPercent = (room.userCount / room.maxUsers) * 100;

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      style={{ width: cloudSize, height: cloudSize }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow ring (activity indicator) */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          transform: `scale(${glow.get()})`,
        }}
        animate={{
          opacity: room.isLive ? [0.5, 0.8, 0.5] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main cloud body */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius,
          scale,
          background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}10 100%)`,
          border: `2px solid ${isSelected ? colors.primary : colors.primary}40`,
          boxShadow: `
            0 0 20px ${colors.glow},
            inset 0 0 30px ${colors.primary}10
          `,
        }}
      >
        {/* Blob animation (for active rooms) */}
        {room.activityLevel > 0.2 && (
          <BlobShape
            colors={colors}
            activityLevel={room.activityLevel}
            isAnimating={isSpeaking}
          />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-10">
          {/* Room name */}
          <span
            className="text-xs font-medium text-center line-clamp-2 mb-1"
            style={{ color: CLOUD_COLORS.text }}
          >
            {room.name}
          </span>

          {/* User count with icon */}
          <div className="flex items-center gap-1">
            <Users size={12} color={colors.primary} />
            <span
              className="text-xs font-bold"
              style={{ color: colors.primary }}
            >
              {room.userCount}/{room.maxUsers}
            </span>
          </div>

          {/* Activity indicator */}
          {room.isLive && (
            <motion.div
              className="flex items-center gap-1 mt-1"
              animate={{ opacity: isSpeaking ? 1 : 0.5 }}
            >
              {isSpeaking ? (
                <Mic size={10} color={colors.primary} />
              ) : (
                <MicOff size={10} color={CLOUD_COLORS.textMuted} />
              )}
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ background: colors.primary }}
                    animate={{
                      height: isSpeaking ? [4, 12, 4] : 4,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Special badges */}
          {(room.hasFounder || room.isPremium) && (
            <motion.div
              className="absolute top-1 right-1"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {room.hasFounder ? (
                <Crown size={14} color={CLOUD_COLORS.founder.primary} />
              ) : (
                <Sparkles size={14} color={CLOUD_COLORS.premium.primary} />
              )}
            </motion.div>
          )}
        </div>

        {/* Fill indicator (bottom progress bar) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <motion.div
            className="h-full"
            style={{ background: colors.primary }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Topics tooltip on hover */}
      <AnimatePresence>
        {isHovered && showDetails && room.topics.length > 0 && (
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              background: 'rgba(10, 10, 15, 0.95)',
              border: `1px solid ${colors.primary}40`,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span className="text-xs" style={{ color: CLOUD_COLORS.textMuted }}>
              {room.topics.slice(0, 2).join(' • ')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLOUD GRID (Multiple rooms)
// ═══════════════════════════════════════════════════════════════════════════════

interface CloudGridProps {
  rooms: CloudRoomData[];
  onRoomClick?: (room: CloudRoomData) => void;
  selectedRoomId?: string;
}

export const CloudGrid = ({ rooms, onRoomClick, selectedRoomId }: CloudGridProps) => {
  // Sort by activity level (most active first)
  const sortedRooms = useMemo(() =>
    [...rooms].sort((a, b) => b.activityLevel - a.activityLevel),
    [rooms]
  );

  return (
    <div className="flex flex-wrap gap-4 justify-center p-4">
      <AnimatePresence mode="popLayout">
        {sortedRooms.map((room, index) => (
          <motion.div
            key={room.id}
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: index * 0.05 }}
          >
            <LiquidCloud
              room={room}
              onClick={() => onRoomClick?.(room)}
              isSelected={room.id === selectedRoomId}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {rooms.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '2px dashed rgba(139, 92, 246, 0.3)',
            }}
          >
            <MessageCircle size={32} color={CLOUD_COLORS.textMuted} />
          </div>
          <span style={{ color: CLOUD_COLORS.textMuted }}>
            Keine aktiven Räume in deiner Nähe
          </span>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CLOUD (Compact version for lists)
// ═══════════════════════════════════════════════════════════════════════════════

export const MiniCloud = ({
  room,
  onClick
}: {
  room: CloudRoomData;
  onClick?: () => void;
}) => {
  const colors = getActivityColors(room.activityLevel, room.isPremium, room.hasFounder);

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}10 0%, transparent 100%)`,
        border: `1px solid ${colors.primary}20`,
      }}
      whileHover={{
        scale: 1.02,
        borderColor: `${colors.primary}40`,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Mini blob indicator */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.secondary}20 100%)`,
          boxShadow: `0 0 10px ${colors.glow}`,
        }}
      >
        <Users size={16} color={colors.primary} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: CLOUD_COLORS.text }}
          >
            {room.name}
          </span>
          {room.isLive && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: colors.primary }}
            />
          )}
        </div>
        <span
          className="text-xs"
          style={{ color: CLOUD_COLORS.textMuted }}
        >
          {room.userCount} von {room.maxUsers} • {room.topics[0] || 'Offen'}
        </span>
      </div>

      {/* Activity bar */}
      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colors.primary }}
          initial={{ width: 0 }}
          animate={{ width: `${room.activityLevel * 100}%` }}
        />
      </div>
    </motion.div>
  );
};

export default LiquidCloud;
