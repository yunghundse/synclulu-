/**
 * AuraHeaderOverlay.tsx
 * 🔮 AURA PROGRESS OVERLAY - Floating Dashboard over Map
 *
 * Premium glass overlay showing:
 * - Mini avatar with level badge
 * - XP progress bar with neon glow
 * - Daily streak flame
 *
 * Positioned absolute over the map (z-index: 100)
 * Tapping opens full profile
 *
 * @version 1.0.0
 */

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Zap } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserData {
  displayName?: string;
  photoURL?: string;
  avatarUrl?: string;
}

interface AuraStats {
  level: number;
  current_xp: number;
  next_level_xp: number;
  streak: number;
}

interface AuraHeaderOverlayProps {
  userId: string;
  user?: UserData;
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

// ═══════════════════════════════════════════════════════════════════════════
// STREAK FLAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StreakFlame = memo(function StreakFlame({ streak }: { streak: number }) {
  const isHighStreak = streak >= 7;

  return (
    <div className="flex flex-col items-center px-3 border-l border-white/10">
      <motion.span
        className="text-lg"
        animate={isHighStreak ? {
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: isHighStreak ? Infinity : 0,
          repeatDelay: 2,
        }}
      >
        🔥
      </motion.span>
      <span className={`text-[9px] font-black ${
        isHighStreak ? 'text-orange-400' : 'text-orange-500/70'
      }`}>
        {streak}d
      </span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraHeaderOverlay: React.FC<AuraHeaderOverlayProps> = memo(({ userId, user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AuraStats>({
    level: 1,
    current_xp: 0,
    next_level_xp: 1000,
    streak: 0,
  });
  const [userData, setUserData] = useState<UserData>(user || {});

  // Subscribe to user stats
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Calculate XP and level
        const totalXP = (data.totalVoiceMinutes || 0) * 10 +
                        (data.roomsVisited || 0) * 50 +
                        (data.friendCount || 0) * 100 +
                        (data.starsReceived || 0) * 25;

        const level = Math.floor(totalXP / 1000) + 1;
        const currentLevelXP = totalXP % 1000;

        setStats({
          level: Math.min(level, 30),
          current_xp: currentLevelXP,
          next_level_xp: 1000,
          streak: data.dailyStreak || data.streak || 0,
        });

        setUserData({
          displayName: data.displayName || data.username || 'Anonym',
          photoURL: data.photoURL || data.avatarUrl,
          avatarUrl: data.avatarUrl || data.photoURL,
        });
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const xpPercentage = (stats.current_xp / stats.next_level_xp) * 100;
  const avatarUrl = userData.photoURL || userData.avatarUrl;

  const handleClick = () => {
    navigate('/profile');
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute top-0 left-0 right-0 z-[100] px-4 pt-14 pb-8"
      style={{
        background: 'linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.7) 60%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Clickable Container */}
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="w-full p-3 flex items-center gap-4 rounded-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Mini Profile & Level Badge */}
        <div className="relative flex-shrink-0">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/20 bg-gradient-to-br from-violet-500 to-purple-600">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userData.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {userData.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Level Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
            }}
          >
            LVL {stats.level}
          </motion.div>
        </div>

        {/* XP Progress Section */}
        <div className="flex-1 space-y-1.5">
          {/* Labels */}
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Aura-Resonanz
            </span>
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-purple-400" />
              <span className="text-[9px] font-black text-purple-400">
                {Math.round(xpPercentage)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)',
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              />
            </motion.div>
          </div>

          {/* XP Text */}
          <div className="flex justify-between">
            <span className="text-[8px] text-white/30">
              {stats.current_xp} / {stats.next_level_xp} XP
            </span>
            <span className="text-[8px] text-purple-400/60">
              {LEVEL_NAMES[stats.level] || 'Dreamer'}
            </span>
          </div>
        </div>

        {/* Streak Flame */}
        <StreakFlame streak={stats.streak} />
      </motion.button>
    </motion.div>
  );
});

AuraHeaderOverlay.displayName = 'AuraHeaderOverlay';

export default AuraHeaderOverlay;
