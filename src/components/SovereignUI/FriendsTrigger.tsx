/**
 * FriendsTrigger.tsx
 * 🔗 FRIENDS NETWORK BUTTON - Instagram-Style Profil Integration
 *
 * Ein prominenter Button für die Profilseite der zum Netzwerk führt.
 * Zeigt dynamisch die Anzahl aktiver Freunde.
 *
 * @version 1.0.0 - Social-Nexus Edition
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface FriendsTriggerProps {
  activeCount: number;
  totalCount?: number;
  onClick: () => void;
  variant?: 'default' | 'compact';
  accentColor?: string;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const FriendsTrigger = memo(function FriendsTrigger({
  activeCount,
  totalCount = 0,
  onClick,
  variant = 'default',
  accentColor = '#a855f7',
}: FriendsTriggerProps) {
  if (variant === 'compact') {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl"
        style={{
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
        }}
      >
        <div className="relative">
          <Users size={16} style={{ color: accentColor }} />
          {activeCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          {activeCount} aktiv
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all"
      style={{
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
        border: `1px solid ${accentColor}25`,
        boxShadow: `0 4px 20px ${accentColor}10`,
      }}
    >
      {/* Icon with Pulse */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}20` }}
        >
          <span className="text-lg">👥</span>
        </div>
        {activeCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              background: '#22c55e',
              border: '2px solid #050505',
              boxShadow: '0 0 8px #22c55e',
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start">
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          Mein Netzwerk
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wide"
          style={{ color: accentColor }}
        >
          {activeCount > 0 ? (
            <>{activeCount} {activeCount === 1 ? 'Freund' : 'Freunde'} aktiv</>
          ) : (
            <>Alle offline</>
          )}
        </span>
      </div>

      {/* Arrow Indicator */}
      <motion.div
        className="ml-auto"
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ color: accentColor }}
        >
          <path
            d="M7.5 5L12.5 10L7.5 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// LIVE FRIENDS PREVIEW (Für Home-Screen)
// ═══════════════════════════════════════════════════════════════

interface FriendAvatarProps {
  photoURL?: string;
  displayName: string;
  isOnline: boolean;
  auraColor?: string;
  onClick?: () => void;
}

export const FriendAvatar = memo(function FriendAvatar({
  photoURL,
  displayName,
  isOnline,
  auraColor = '#a855f7',
  onClick,
}: FriendAvatarProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center gap-1"
    >
      {/* Avatar with Aura Ring */}
      <div className="relative">
        {/* Pulsing Aura Ring for online friends */}
        {isOnline && (
          <motion.div
            className="absolute -inset-1 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${auraColor}, ${auraColor}80)`,
              filter: 'blur(3px)',
            }}
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Avatar Image */}
        <div
          className="relative w-12 h-12 rounded-full overflow-hidden"
          style={{
            border: isOnline ? `2px solid ${auraColor}` : '2px solid rgba(255,255,255,0.1)',
          }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${auraColor}40, ${auraColor}20)` }}
            >
              <span className="text-sm font-bold text-white/80">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Online Indicator */}
        {isOnline && (
          <motion.div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
            style={{
              background: '#22c55e',
              border: '2px solid #050505',
              boxShadow: '0 0 8px #22c55e',
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Name */}
      <span className="text-[9px] text-white/60 font-medium truncate max-w-[50px]">
        {displayName.split(' ')[0]}
      </span>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// LIVE FRIENDS ROW (Horizontale Scroll-Liste)
// ═══════════════════════════════════════════════════════════════

interface LiveFriendsRowProps {
  friends: {
    id: string;
    displayName: string;
    photoURL?: string;
    isOnline: boolean;
    auraColor?: string;
  }[];
  onFriendClick?: (friendId: string) => void;
  onViewAll?: () => void;
}

export const LiveFriendsRow = memo(function LiveFriendsRow({
  friends,
  onFriendClick,
  onViewAll,
}: LiveFriendsRowProps) {
  const onlineFriends = friends.filter((f) => f.isOnline);

  if (onlineFriends.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {onlineFriends.slice(0, 8).map((friend) => (
          <FriendAvatar
            key={friend.id}
            photoURL={friend.photoURL}
            displayName={friend.displayName}
            isOnline={friend.isOnline}
            auraColor={friend.auraColor}
            onClick={() => onFriendClick?.(friend.id)}
          />
        ))}

        {/* View All Button */}
        {onlineFriends.length > 8 && (
          <motion.button
            onClick={onViewAll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(168, 85, 247, 0.2)' }}
            >
              <span className="text-xs font-bold text-purple-400">
                +{onlineFriends.length - 8}
              </span>
            </div>
            <span className="text-[9px] text-white/40">Mehr</span>
          </motion.button>
        )}
      </div>
    </div>
  );
});

export default FriendsTrigger;
