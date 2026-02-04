/**
 * ROOM CARD - Adidas-Style Grid Kachel
 * Premium Shop-Ästhetik für Wölkchen
 *
 * @design High-End Shop × Sovereign Glass
 * @version 1.0.0
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Users, MapPin } from 'lucide-react';

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    category: string;
    activeUsers: number;
    distance?: number;
    hasBoost?: boolean;
    isHot?: boolean;
    emoji?: string;
    hostAvatar?: string;
    hostName?: string;
    isFounderRoom?: boolean;
  };
  index: number;
  onClick: () => void;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

export const RoomCard = memo(function RoomCard({ room, index, onClick }: RoomCardProps) {
  // Determine visual intensity based on activity
  const isVeryActive = room.activeUsers >= 10;
  const isActive = room.activeUsers >= 3;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className="relative group cursor-pointer text-left w-full"
      style={{
        background: '#050505',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* XP Boost Badge */}
      {room.hasBoost && (
        <motion.div
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap size={10} className="text-white" />
          <span className="text-[8px] font-black text-white tracking-wider">XP BOOST</span>
        </motion.div>
      )}

      {/* Hot Badge */}
      {room.isHot && !room.hasBoost && (
        <motion.div
          className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[8px] font-black text-white tracking-wider">🔥 HOT</span>
        </motion.div>
      )}

      {/* Founder Badge */}
      {room.isFounderRoom && (
        <motion.div
          className="absolute top-2 left-2 z-10"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Crown size={16} className="text-amber-400" />
        </motion.div>
      )}

      {/* Card Content */}
      <div className="p-4">
        {/* Cloud Visual */}
        <div
          className="aspect-square rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative"
          style={{
            background: isVeryActive
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.08))'
              : isActive
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))'
                : 'rgba(255, 255, 255, 0.03)',
            border: isVeryActive
              ? '1px solid rgba(139, 92, 246, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Animated Glow for active rooms */}
          {isVeryActive && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Room Emoji/Icon */}
          <motion.span
            className="text-4xl relative z-10"
            animate={isVeryActive ? { y: [0, -4, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {room.emoji || '☁️'}
          </motion.span>

          {/* Live Activity Dots */}
          {isActive && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {Array.from({ length: Math.min(room.activeUsers, 5) }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="space-y-1">
          {/* Category */}
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
            {room.category}
          </p>

          {/* Name */}
          <p className="text-sm font-bold text-white truncate">{room.name}</p>

          {/* Stats Row */}
          <div className="flex justify-between items-center pt-2">
            {/* Active Users */}
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold text-emerald-400">
                {room.activeUsers} AKTIV
              </span>
            </div>

            {/* Distance */}
            {room.distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin size={10} className="text-white/20" />
                <span className="text-[10px] font-bold text-white/20">
                  {room.distance < 1 ? `${Math.round(room.distance * 1000)}m` : `${room.distance.toFixed(1)}km`}
                </span>
              </div>
            )}
          </div>

          {/* Host Info (if available) */}
          {room.hostName && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
              {room.hostAvatar ? (
                <img
                  src={room.hostAvatar}
                  alt=""
                  className="w-4 h-4 rounded-full border border-white/10"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="text-[8px] text-violet-400">
                    {room.hostName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[9px] text-white/40 truncate">by {room.hostName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent)',
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
});

export default RoomCard;
