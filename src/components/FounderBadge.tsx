/**
 * Founder Badge Component - Premium Visual Indicators
 *
 * Exclusive badges with gold/purple gradient styling
 */

import { motion } from 'framer-motion';
import { useUserBadge, UserRole } from '../hooks/useFounderAccess';

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface FounderBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  showLabel?: boolean;
}

export function FounderBadge({ size = 'md', animate = true, showLabel = true }: FounderBadgeProps) {
  const sizeClasses = {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[10px] px-3 py-1',
    lg: 'text-xs px-4 py-1.5'
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1 rounded-full font-black uppercase tracking-widest border border-yellow-500 ${sizeClasses[size]}`}
      style={{
        background: 'rgba(255, 215, 0, 0.1)',
        color: '#FFD700',
      }}
      animate={animate ? {
        boxShadow: [
          '0 0 10px #FFD700',
          '0 0 20px #B8860B',
          '0 0 10px #FFD700'
        ]
      } : undefined}
      transition={{ repeat: Infinity, duration: 3 }}
      whileHover={{ scale: 1.05 }}
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
    >
      <span>👑</span>
      {showLabel && <span>Founder</span>}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE BADGE (Generic)
// ═══════════════════════════════════════════════════════════════════════════

interface RoleBadgeProps {
  role: UserRole;
  isPremium?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RoleBadge({ role, isPremium, size = 'md', showIcon = true }: RoleBadgeProps) {
  const badge = useUserBadge(role, isPremium);

  // Founder gets special treatment
  if (role === 'founder') {
    return <FounderBadge size={size} />;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        background: badge.gradient || badge.color,
        color: '#fff'
      }}
      whileHover={{ scale: 1.02 }}
    >
      {showIcon && <span>{badge.icon}</span>}
      <span>{badge.label}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

interface PremiumIndicatorProps {
  isFounder?: boolean;
  isPremium?: boolean;
  expiresAt?: Date | null;
  compact?: boolean;
}

export function PremiumIndicator({ isFounder, isPremium, expiresAt, compact }: PremiumIndicatorProps) {
  if (isFounder) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #9333EA)',
            color: '#000'
          }}
          animate={{
            boxShadow: [
              '0 0 10px rgba(255, 215, 0, 0.5)',
              '0 0 20px rgba(147, 51, 234, 0.5)',
              '0 0 10px rgba(255, 215, 0, 0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👑 ∞
        </motion.div>
        {!compact && <span className="text-xs text-gray-400">Ghost Premium</span>}
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
        ✨ Premium
      </div>
      {!compact && expiresAt && (
        <span className="text-xs text-gray-500">
          bis {expiresAt.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER LEVEL INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

interface PowerLevelProps {
  level: number;
  maxLevel?: number;
  showNumber?: boolean;
}

export function PowerLevelIndicator({ level, maxLevel = 999, showNumber = false }: PowerLevelProps) {
  const percentage = Math.min((level / maxLevel) * 100, 100);
  const isMax = level >= maxLevel;

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isMax
              ? 'linear-gradient(90deg, #FFD700, #9333EA, #FFD700)'
              : level >= 4
                ? 'linear-gradient(90deg, #9333EA, #6B21A8)'
                : level >= 3
                  ? '#3B82F6'
                  : '#6B7280',
            backgroundSize: isMax ? '200% 100%' : '100% 100%',
            animation: isMax ? 'founderShimmer 2s linear infinite' : 'none'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showNumber && (
        <span className={`text-xs font-mono ${isMax ? 'text-yellow-400' : 'text-gray-400'}`}>
          {isMax ? '∞' : level}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFIED CHECKMARK
// ═══════════════════════════════════════════════════════════════════════════

interface VerifiedBadgeProps {
  type: 'founder' | 'admin' | 'verified' | 'premium';
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({ type, size = 'md' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const config = {
    founder: {
      bg: 'linear-gradient(135deg, #FFD700, #9333EA)',
      icon: '👑',
      glow: 'rgba(255, 215, 0, 0.5)'
    },
    admin: {
      bg: 'linear-gradient(135deg, #9333EA, #6B21A8)',
      icon: '⚡',
      glow: 'rgba(147, 51, 234, 0.5)'
    },
    verified: {
      bg: '#3B82F6',
      icon: '✓',
      glow: 'rgba(59, 130, 246, 0.5)'
    },
    premium: {
      bg: '#F59E0B',
      icon: '✨',
      glow: 'rgba(245, 158, 11, 0.5)'
    }
  };

  const { bg, icon, glow } = config[type];

  return (
    <motion.div
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size]}`}
      style={{
        background: bg,
        boxShadow: `0 0 10px ${glow}`
      }}
      whileHover={{ scale: 1.1 }}
    >
      <span className="text-xs">{icon}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default FounderBadge;
