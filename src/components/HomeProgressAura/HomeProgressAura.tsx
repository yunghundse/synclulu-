/**
 * HomeProgressAura.tsx
 * 🔥 GAMIFICATION MODULE - Aura Progress & Daily Streak
 *
 * Maximizes user engagement through:
 * - Visual XP progress bar with neon glow
 * - Daily streak flame with pulse animation
 * - Level progression motivation
 * - Catalyst rank teaser
 *
 * @version 1.0.0
 */

import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserStats {
  current_xp: number;
  next_level_xp: number;
  level: number;
  streak: number;
  today_voice_minutes: number;
  total_aura: number;
}

interface HomeProgressAuraProps {
  userId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const LEVEL_NAMES: { [key: number]: string } = {
  1: 'Newcomer',
  5: 'Explorer',
  10: 'Dreamer',
  15: 'Visionary',
  20: 'Catalyst',
  25: 'Nebula Master',
  30: 'Legendary',
};

const getNextRankName = (level: number): string => {
  const ranks = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => a - b);
  const nextRank = ranks.find(r => r > level);
  return nextRank ? LEVEL_NAMES[nextRank] : 'Legendary';
};

const getNextRankLevel = (level: number): number => {
  const ranks = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => a - b);
  return ranks.find(r => r > level) || 30;
};

// ═══════════════════════════════════════════════════════════════════════════
// STREAK FLAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StreakFlame = memo(function StreakFlame({
  streak,
  isAtRisk
}: {
  streak: number;
  isAtRisk: boolean;
}) {
  return (
    <div className="relative flex items-center gap-1.5">
      {/* Flame Icon with animations */}
      <motion.div
        className="relative"
        animate={isAtRisk ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 1,
          repeat: isAtRisk ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-md"
          style={{
            background: streak >= 7
              ? 'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <Flame
          size={20}
          className={`relative ${
            streak >= 7
              ? 'text-orange-400'
              : streak >= 3
                ? 'text-orange-500'
                : 'text-orange-600'
          }`}
          fill={streak >= 3 ? 'currentColor' : 'none'}
        />
      </motion.div>

      {/* Streak Count */}
      <div className="flex flex-col items-start">
        <span className={`text-sm font-black ${
          streak >= 7 ? 'text-orange-400' : 'text-orange-500'
        }`}>
          {streak}
        </span>
        <span className="text-[8px] text-white/40 uppercase font-bold tracking-wider">
          {streak === 1 ? 'Tag' : 'Tage'}
        </span>
      </div>

      {/* Streak multiplier badge for high streaks */}
      {streak >= 7 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 px-1 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded text-[7px] font-black text-white"
        >
          x{Math.min(Math.floor(streak / 7) + 1, 5)}
        </motion.div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// VOICE ACTIVITY TILE
// ═══════════════════════════════════════════════════════════════════════════

const VoiceActivityTile = memo(function VoiceActivityTile({
  minutes
}: {
  minutes: number;
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const displayTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20"
    >
      <div className="relative">
        <Clock size={14} className="text-violet-400" />
        {minutes > 0 && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-white">{displayTime}</p>
        <p className="text-[8px] text-violet-400/60 uppercase">Heute Voice</p>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const HomeProgressAura: React.FC<HomeProgressAuraProps> = memo(({ userId }) => {
  const [stats, setStats] = useState<UserStats>({
    current_xp: 0,
    next_level_xp: 1000,
    level: 1,
    streak: 0,
    today_voice_minutes: 0,
    total_aura: 0,
  });
  const [isStreakAtRisk, setIsStreakAtRisk] = useState(false);

  // Subscribe to user stats
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Calculate XP and level from various metrics
        const totalXP = (data.totalVoiceMinutes || 0) * 10 +
                        (data.roomsVisited || 0) * 50 +
                        (data.friendCount || 0) * 100 +
                        (data.starsReceived || 0) * 25;

        const level = Math.floor(totalXP / 1000) + 1;
        const currentLevelXP = totalXP % 1000;

        setStats({
          current_xp: currentLevelXP,
          next_level_xp: 1000,
          level: Math.min(level, 30),
          streak: data.dailyStreak || data.streak || 1,
          today_voice_minutes: data.todayVoiceMinutes || 0,
          total_aura: data.auraScore || totalXP,
        });

        // Check if streak is at risk (last activity > 20 hours ago)
        const lastActive = data.lastActive?.toDate?.() || new Date();
        const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
        setIsStreakAtRisk(hoursSinceActive > 20 && hoursSinceActive < 24);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const progressPercent = (stats.current_xp / stats.next_level_xp) * 100;
  const xpToNextLevel = stats.next_level_xp - stats.current_xp;
  const nextRank = getNextRankName(stats.level);
  const nextRankLevel = getNextRankLevel(stats.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 mb-4"
    >
      <div
        className="relative rounded-2xl p-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(5, 5, 5, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/4 w-1/2 h-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Header Row */}
        <div className="relative flex justify-between items-start mb-3">
          {/* Level Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-purple-400" />
              <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest">
                Aura-Status
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-black text-white">
                Level {stats.level}
              </h3>
              <span className="text-[10px] text-white/40 font-medium">
                {LEVEL_NAMES[Math.min(stats.level, 30)] || 'Dreamer'}
              </span>
            </div>
          </div>

          {/* Streak & Voice */}
          <div className="flex items-center gap-3">
            <VoiceActivityTile minutes={stats.today_voice_minutes} />
            <StreakFlame streak={stats.streak} isAtRisk={isStreakAtRisk} />
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="relative mb-2">
          <div
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)',
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
          </div>

          {/* XP Numbers */}
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[9px] text-white/40 font-medium">
              {stats.current_xp} / {stats.next_level_xp} XP
            </span>
            <span className="text-[9px] text-purple-400 font-bold">
              +{xpToNextLevel} bis Level {stats.level + 1}
            </span>
          </div>
        </div>

        {/* Next Rank Teaser */}
        {stats.level < nextRankLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 pt-2 border-t border-white/5"
          >
            <TrendingUp size={10} className="text-fuchsia-400" />
            <p className="text-[9px] text-white/50">
              Noch <span className="text-fuchsia-400 font-bold">{(nextRankLevel - stats.level) * 1000 - stats.current_xp}</span> Aura bis zum{' '}
              <span className="text-fuchsia-400 font-bold">{nextRank}</span>-Rang
            </p>
          </motion.div>
        )}

        {/* Streak Warning */}
        <AnimatePresence>
          {isStreakAtRisk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20"
            >
              <Flame size={12} className="text-orange-400 animate-pulse" />
              <p className="text-[10px] text-orange-400 font-medium">
                Dein Streak droht zu brechen! Sei heute noch aktiv.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

HomeProgressAura.displayName = 'HomeProgressAura';

export default HomeProgressAura;
