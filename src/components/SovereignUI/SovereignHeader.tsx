/**
 * SovereignHeader.tsx
 * Saubere Trennung von Profil und Settings
 *
 * Features:
 * - Profil-Icon führt NUR zum Profil
 * - Settings-Zahnrad führt NUR zu Settings
 * - Glass-Morphism Design
 * - Level Badge & XP Progress
 * - Founder Crown für Admins
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Crown, User } from 'lucide-react';

interface SovereignHeaderProps {
  user: {
    displayName?: string;
    photoURL?: string;
    level?: number;
    isFounder?: boolean;
    xpProgress?: number;
  };
  onProfileClick: () => void;
  onSettingsClick: () => void;
  showLocation?: boolean;
  locationText?: string;
}

export const SovereignHeader = memo(function SovereignHeader({
  user,
  onProfileClick,
  onSettingsClick,
  showLocation = false,
  locationText = '',
}: SovereignHeaderProps) {
  const accentColor = user.isFounder ? '#fbbf24' : '#a855f7';
  const progress = user.xpProgress || 0;

  return (
    <div className="px-5 pt-12 pb-4">
      {/* Location Sticker (Optional) */}
      {showLocation && locationText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 ml-1"
        >
          <span className="text-[8px] font-black text-white/25 uppercase tracking-[0.25em]">
            📍 {locationText}
          </span>
        </motion.div>
      )}

      {/* Main Header Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 rounded-[20px]"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Left: Profile Trigger */}
        <motion.div
          onClick={onProfileClick}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          {/* Avatar with Glow */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                filter: 'blur(8px)',
                transform: 'scale(1.4)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="relative w-11 h-11 rounded-xl object-cover"
                style={{
                  border: `2px solid ${accentColor}50`,
                  boxShadow: `0 0 15px ${accentColor}30`,
                }}
              />
            ) : (
              <div
                className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                  border: `2px solid ${accentColor}50`,
                }}
              >
                <User size={20} className="text-white/70" />
              </div>
            )}

            {/* Founder Crown */}
            {user.isFounder && (
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  boxShadow: '0 2px 6px rgba(251, 191, 36, 0.4)',
                }}
              >
                <Crown size={10} className="text-black" />
              </div>
            )}
          </div>

          {/* Name + Level + Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {user.displayName || 'Anonym'}
              </span>
              <span
                className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {user.isFounder ? '👑' : `L${user.level || 1}`}
              </span>
            </div>

            {/* XP Progress Bar */}
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${user.isFounder ? '#fde047' : '#c084fc'})`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Right: Settings Button (ONLY Settings!) */}
        <motion.button
          onClick={onSettingsClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Settings size={18} className="text-white/50" />
        </motion.button>
      </motion.div>
    </div>
  );
});

export default SovereignHeader;
