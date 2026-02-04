/**
 * SovereignHeader.tsx
 * 👑 FLOATING GLASS PROFILE - Leuchtender Level-Header
 *
 * Features:
 * - Floating Glass Panel mit Backdrop-Blur
 * - Neon-Aura-Ring um Avatar (sanft pulsierend)
 * - Horizontale Level-Fortschrittsanzeige
 * - Lila Gradient mit Glow-Effekt
 * - GPU-beschleunigte Animationen
 *
 * @version 1.0.0
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, Zap } from 'lucide-react';
import { useSyncProgress } from '@/hooks/useSyncProgress';
import { calculateLevelInfo, getRankForLevel } from '@/lib/levelSystem';

interface SovereignHeaderProps {
  user: {
    avatar?: string;
    displayName?: string;
    xp?: number;
  };
  isInSync?: boolean;
  notificationCount?: number;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
}

export const SovereignHeader = memo(function SovereignHeader({
  user,
  isInSync = false,
  notificationCount = 0,
  onProfileClick,
  onNotificationsClick,
}: SovereignHeaderProps) {
  // Use the advanced level system
  const levelInfo = useMemo(() => calculateLevelInfo(user.xp || 0), [user.xp]);
  const rank = useMemo(() => getRankForLevel(levelInfo.level), [levelInfo.level]);

  // Real-time progress tracking when in sync
  const { progressInLevel: realtimeProgress, isLevelingUp } = useSyncProgress(
    user.xp || 0,
    isInSync
  );

  // Use realtime progress when syncing, otherwise use calculated
  const displayProgress = isInSync ? realtimeProgress : levelInfo.progressPercent;
  const displayXP = isInSync
    ? Math.floor(realtimeProgress)
    : levelInfo.currentXP;

  return (
    <div className="fixed top-0 left-0 right-0 pt-safe z-[100]">
      {/* Main Glass Panel */}
      <div className="mx-4 mt-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative p-4 rounded-[28px] will-change-transform"
          style={{
            background: 'rgba(5, 5, 5, 0.6)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: isLevelingUp
              ? '0 0 40px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.4)',
            transform: 'translateZ(0)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Leuchtender Profil-Ring */}
            <button
              onClick={onProfileClick}
              className="relative flex-shrink-0"
            >
              {/* Äußerer Glow (Pulsierend wenn aktiv) */}
              <motion.div
                animate={
                  isInSync
                    ? {
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }
                    : {
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: isInSync ? 2 : 3,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-2xl will-change-transform"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)',
                  filter: 'blur(12px)',
                  transform: 'translateZ(0)',
                }}
              />

              {/* Gradient Border Ring */}
              <div
                className="relative w-14 h-14 rounded-2xl p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #D8B4FE 50%, #F0ABFC 100%)',
                }}
              >
                {/* Avatar Container */}
                <div
                  className="w-full h-full rounded-[14px] overflow-hidden"
                  style={{
                    background: '#0a0a0a',
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-500">
                      <span className="text-lg font-bold text-white">
                        {(user.displayName || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Indicator */}
              {isInSync && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
                    border: '2px solid #050505',
                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                  }}
                >
                  <Zap size={10} className="text-white" />
                </motion.div>
              )}
            </button>

            {/* Level & Fortschritt */}
            <div className="flex-1 min-w-0">
              {/* Top Row: Rank & Status */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em]"
                    style={{
                      textShadow: `0 0 10px ${rank.glow}`,
                      color: rank.color,
                    }}
                  >
                    {rank.name}
                  </span>
                  <span className="text-[10px] font-bold text-purple-400">
                    Lvl {levelInfo.level}
                  </span>
                </div>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
                  {isInSync ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-green-400"
                    >
                      ● Syncing
                    </motion.span>
                  ) : (
                    'Idle'
                  )}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                className="h-[6px] w-full rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 50,
                    damping: 20,
                  }}
                  className="h-full will-change-transform"
                  style={{
                    background: 'linear-gradient(90deg, #A855F7 0%, #D946EF 50%, #F0ABFC 100%)',
                    boxShadow: isLevelingUp
                      ? '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(217, 70, 239, 0.6)'
                      : '0 0 12px rgba(168, 85, 247, 0.5)',
                    transform: 'translateZ(0)',
                  }}
                />
              </div>

              {/* XP Text */}
              <div className="flex justify-between items-center mt-1">
                <span className="text-[8px] text-white/30">
                  {displayXP} / {levelInfo.xpForNextLevel} XP
                </span>
                {isLevelingUp && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[9px] font-bold text-yellow-400 flex items-center gap-1"
                  >
                    <Sparkles size={10} />
                    Level Up!
                  </motion.span>
                )}
              </div>
            </div>

            {/* Notifications Button */}
            <button
              onClick={onNotificationsClick}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Bell size={18} className="text-white/60" />

              {/* Notification Badge */}
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  }}
                >
                  <span className="text-[9px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                </motion.div>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Level-Up Celebration Overlay */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {/* Golden Shimmer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(234, 179, 8, 0.3) 50%, transparent 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SovereignHeader;
