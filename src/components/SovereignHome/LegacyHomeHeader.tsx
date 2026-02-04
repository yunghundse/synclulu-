/**
 * LegacyHomeHeader.tsx
 * Delulu-Style Header - Die Seele von Delulu in synclulu
 *
 * Features:
 * - Avatar mit Aura-Glow
 * - Name + Level Badge
 * - Progress Bar für XP
 * - Discovery Row (Gespräche + Freunde aktiv)
 *
 * KEIN Standort mehr!
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Crown, MessageCircle } from 'lucide-react';

interface LegacyHomeHeaderProps {
  user: {
    avatar?: string;
    name: string;
    level: number;
    progress: number; // 0-100
    isFounder?: boolean;
  };
  activeFriendsCount: number;
  nearbyCount?: number; // Jetzt = Users Online statt Nearby
  onProfileClick: () => void;
  onNearMeClick: () => void;
  onFriendsClick?: () => void;
}

export const LegacyHomeHeader = memo(function LegacyHomeHeader({
  user,
  activeFriendsCount,
  nearbyCount = 0,
  onProfileClick,
  onNearMeClick,
  onFriendsClick,
}: LegacyHomeHeaderProps) {
  // Farben basierend auf Founder-Status
  const accentColor = user.isFounder ? '#fbbf24' : '#a855f7';
  const accentColorLight = user.isFounder ? '#fde047' : '#c084fc';

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[150] px-5 pt-12 pb-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(5, 5, 5, 0.95) 0%, rgba(5, 5, 5, 0.8) 60%, transparent 100%)',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════
          1. DELULU STYLE PROFILE BAR
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        onClick={onProfileClick}
        className="flex items-center gap-4 cursor-pointer group"
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar mit Aura-Glow */}
        <div className="relative">
          {/* Pulsierender Glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: user.isFounder
                ? 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
              filter: 'blur(12px)',
              transform: 'scale(1.5)',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1.4, 1.6, 1.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Avatar Image */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="relative w-14 h-14 rounded-2xl object-cover"
              style={{
                border: `2px solid ${accentColor}40`,
                boxShadow: `0 4px 20px ${accentColor}30`,
              }}
            />
          ) : (
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                border: `2px solid ${accentColor}40`,
              }}
            >
              <span className="text-xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Founder Crown */}
          {user.isFounder && (
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.5)',
              }}
            >
              <Crown size={12} className="text-black" />
            </div>
          )}
        </div>

        {/* Name + Level + Progress */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-white tracking-tight">
              {user.name}
            </span>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider"
              style={{
                background: `${accentColor}20`,
                color: accentColorLight,
                boxShadow: `0 0 10px ${accentColor}20`,
              }}
            >
              {user.isFounder ? '👑 Founder' : `Lvl ${user.level}`}
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, ${accentColorLight})`,
                boxShadow: `0 0 10px ${accentColor}`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${user.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          2. DISCOVERY ROW (Gespräche + Freunde)
          ═══════════════════════════════════════════════════════════ */}
      <div className="mt-6 flex justify-between items-center">
        {/* "Alle Gespräche" Button - KEIN Standort mehr! */}
        <motion.button
          onClick={onNearMeClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 py-3 px-4 rounded-2xl transition-all"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <MessageCircle size={20} className="text-violet-400" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
              Alle Gespräche
            </span>
            <span className="text-[9px] text-white/40">entdecken</span>
          </div>
          {nearbyCount > 0 && (
            <span
              className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
              }}
            >
              {nearbyCount}
            </span>
          )}
        </motion.button>

        {/* Freunde aktiv */}
        <motion.button
          onClick={onFriendsClick}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 py-2 px-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: '#22c55e' }}
            animate={{
              opacity: [1, 0.5, 1],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className="text-[11px] font-semibold text-white/50">
            <span className="text-white font-bold">{activeFriendsCount}</span> Freunde aktiv
          </span>
        </motion.button>
      </div>
    </div>
  );
});

export default LegacyHomeHeader;
