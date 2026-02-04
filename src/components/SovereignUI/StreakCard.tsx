/**
 * STREAK CARD - Social Radar Component
 * Visualizes your strongest connection streak
 *
 * @design Sovereign Glass-Morphism
 * @version 1.0.0
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

interface StreakCardProps {
  friendName: string;
  friendAvatar?: string;
  streakCount: number;
  onClick?: () => void;
}

export const StreakCard = memo(function StreakCard({
  friendName,
  friendAvatar,
  streakCount,
  onClick,
}: StreakCardProps) {
  // Flame intensity based on streak
  const flameSize = streakCount >= 30 ? 'text-4xl' : streakCount >= 14 ? 'text-3xl' : 'text-2xl';
  const glowIntensity = Math.min(streakCount * 2, 100);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="relative w-full h-full flex flex-col items-center justify-center p-5 rounded-[24px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.08))',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Animated Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-[24px]"
        style={{
          background: `radial-gradient(circle at center, rgba(249, 115, 22, ${glowIntensity / 400}) 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Flame Icon with Animation */}
      <motion.span
        className={`${flameSize} mb-2 relative z-10`}
        animate={{
          y: [0, -4, 0],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🔥
      </motion.span>

      {/* Label */}
      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center relative z-10">
        Top Streak
      </span>

      {/* Streak Count */}
      <motion.span
        className="text-xl font-bold text-white mt-1 relative z-10"
        key={streakCount}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {streakCount} Tage
      </motion.span>

      {/* Friend Info */}
      <div className="flex items-center gap-2 mt-2 relative z-10">
        {friendAvatar ? (
          <div className="w-5 h-5 rounded-full overflow-hidden border border-orange-500/30">
            <img src={friendAvatar} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-[8px] text-orange-400">
              {friendName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-[9px] text-white/50 uppercase tracking-wide">
          mit {friendName}
        </span>
      </div>

      {/* Streak Milestone Badge */}
      {streakCount >= 7 && (
        <motion.div
          className="absolute top-3 right-3"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <span className="text-xs">
            {streakCount >= 30 ? '💎' : streakCount >= 14 ? '⭐' : '✨'}
          </span>
        </motion.div>
      )}
    </motion.button>
  );
});

export default StreakCard;
