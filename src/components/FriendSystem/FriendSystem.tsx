/**
 * FriendSystem.tsx
 * 👥 NEBULA-BONDING SYSTEM v20.0 - Friend & Social Hub
 *
 * High-End Navigation Center for Profile & Friends
 * Features: Aura-Sync, Streaks, Star-Dust System
 *
 * @version 20.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Star, Flame, X, Search,
  UserPlus, MessageCircle, Sparkles,
  Crown, Shield, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  auraLevel?: number;
  isFounder?: boolean;
  isVerified?: boolean;
}

interface FriendData {
  id: string;
  oderId: string;
  username: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  auraSyncScore: number;
  lastInteraction: Date;
  starsReceived?: number;
}

interface UserProfileHubProps {
  user: UserProfile;
  friends: FriendData[];
  onClose: () => void;
  onFriendSelect?: (friendId: string) => void;
  onAuraSync?: (friendId: string) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const slideVariants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ═══════════════════════════════════════════════════════════════════════════
// STREAK FLAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StreakFlame: React.FC<{ count: number }> = memo(({ count }) => {
  if (count < 1) return null;

  const getFlameColor = () => {
    if (count >= 30) return 'text-purple-500'; // Legendary
    if (count >= 14) return 'text-orange-500'; // Hot
    if (count >= 7) return 'text-yellow-500';  // Warm
    return 'text-orange-400'; // Starting
  };

  return (
    <motion.div
      className="flex items-center gap-1"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Flame size={12} className={getFlameColor()} />
      <span className={`text-[8px] font-black uppercase ${getFlameColor()}`}>
        {count} Day{count !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
});

StreakFlame.displayName = 'StreakFlame';

// ═══════════════════════════════════════════════════════════════════════════
// AURA LEVEL BADGE
// ═══════════════════════════════════════════════════════════════════════════

const AuraLevelBadge: React.FC<{ level: number; isFounder?: boolean }> = memo(({ level, isFounder }) => {
  return (
    <div className={`px-4 py-1 rounded-full border ${
      isFounder
        ? 'bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border-yellow-500/30'
        : 'bg-purple-500/20 border-purple-500/30'
    }`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${
        isFounder ? 'text-yellow-400' : 'text-purple-400'
      }`}>
        {isFounder ? '👑 Founder' : `Aura-Level ${level}`}
      </span>
    </div>
  );
});

AuraLevelBadge.displayName = 'AuraLevelBadge';

// ═══════════════════════════════════════════════════════════════════════════
// FRIEND CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const FriendCard: React.FC<{
  friend: FriendData;
  onSelect: () => void;
  onAuraSync: () => void;
}> = memo(({ friend, onSelect, onAuraSync }) => {
  const handleAuraSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onAuraSync();
  };

  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
      className="glass-deep p-4 flex items-center justify-between cursor-pointer
                 hover:bg-white/[0.08] transition-all duration-300"
      style={{ borderRadius: '24px' }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar with online indicator */}
        <div className="relative">
          <img
            src={friend.avatarUrl || '/default-avatar.png'}
            alt={friend.username}
            className="w-12 h-12 rounded-2xl object-cover border border-white/10"
          />
          {friend.isActive && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full
                         border-2 border-[#050505]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white">{friend.username}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <StreakFlame count={friend.streakCount} />
            {friend.starsReceived && friend.starsReceived > 0 && (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[8px] text-yellow-400 font-bold">
                  {friend.starsReceived}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aura Sync Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleAuraSync}
        className="p-3 bg-purple-500/10 rounded-xl text-purple-400 text-xs font-bold
                   border border-purple-500/20 hover:bg-purple-500/20 transition-all"
      >
        <Zap size={16} />
      </motion.button>
    </motion.div>
  );
});

FriendCard.displayName = 'FriendCard';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════

const ProfileView: React.FC<{
  user: UserProfile;
  friendsCount: number;
  onViewFriends: () => void;
}> = memo(({ user, friendsCount, onViewFriends }) => {
  const isFounder = user.id === FOUNDER_UID || user.isFounder;

  return (
    <motion.div
      key="profile"
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col items-center pt-12 p-8"
    >
      {/* Profile Avatar with Glow */}
      <div className="relative group">
        <motion.div
          className="absolute inset-0 bg-purple-600/20 blur-[60px] rounded-full"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <img
          src={user.avatarUrl || '/default-avatar.png'}
          alt={user.username}
          className={`w-32 h-32 rounded-[40px] object-cover relative z-10 ${
            isFounder
              ? 'border-2 border-transparent bg-gradient-to-r from-yellow-500 to-purple-500 p-[2px]'
              : 'border-2 border-purple-500'
          }`}
          style={isFounder ? {
            background: 'linear-gradient(#050505, #050505) padding-box, linear-gradient(135deg, #FFD700, #9333EA) border-box',
          } : undefined}
        />
        {isFounder && (
          <motion.div
            className="absolute -top-2 -right-2 z-20"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown size={24} className="text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      {/* Username */}
      <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
        {user.displayName || user.username}
      </h2>

      {/* Aura Level Badge */}
      <div className="mt-2">
        <AuraLevelBadge level={user.auraLevel || 1} isFounder={isFounder} />
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-4 w-full mt-12">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onViewFriends();
          }}
          className="glass-deep p-6 flex flex-col items-center gap-2
                     hover:bg-purple-500/10 transition-all"
          style={{ borderRadius: '32px' }}
        >
          <Users size={24} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase text-gray-400">
            Verbindungen
          </span>
          <span className="text-lg font-bold text-white">{friendsCount}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => triggerHaptic('light')}
          className="glass-deep p-6 flex flex-col items-center gap-2
                     hover:bg-purple-500/10 transition-all"
          style={{ borderRadius: '32px' }}
        >
          <Sparkles size={24} className="text-yellow-400" />
          <span className="text-[10px] font-black uppercase text-gray-400">
            Errungenschaften
          </span>
          <span className="text-lg font-bold text-white">12</span>
        </motion.button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm text-gray-400">Max Streak: <span className="text-white font-bold">14</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-400" />
          <span className="text-sm text-gray-400">Sterne: <span className="text-white font-bold">42</span></span>
        </div>
      </div>
    </motion.div>
  );
});

ProfileView.displayName = 'ProfileView';

// ═══════════════════════════════════════════════════════════════════════════
// FRIENDS VIEW
// ═══════════════════════════════════════════════════════════════════════════

const FriendsView: React.FC<{
  friends: FriendData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFriendSelect: (friendId: string) => void;
  onAuraSync: (friendId: string) => void;
}> = memo(({ friends, searchQuery, onSearchChange, onFriendSelect, onAuraSync }) => {
  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by streak count (highest first), then by active status
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.streakCount - a.streakCount;
  });

  return (
    <motion.div
      key="friends"
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 p-6 overflow-y-auto no-scrollbar"
    >
      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Aura finden..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4
                     text-sm text-white placeholder-gray-500
                     focus:outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      {/* Streak Warning (if any friend's streak is about to expire) */}
      {sortedFriends.some(f => f.streakCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <Flame size={20} className="text-orange-500" />
            <p className="text-sm text-orange-400">
              <span className="font-bold">Streak-Alarm!</span> Interagiere heute mit deinen Freunden.
            </p>
          </div>
        </motion.div>
      )}

      {/* Friends List */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {sortedFriends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            onSelect={() => onFriendSelect(friend.id)}
            onAuraSync={() => onAuraSync(friend.id)}
          />
        ))}

        {/* Empty State */}
        {sortedFriends.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            {searchQuery ? (
              <p className="text-gray-500 text-sm">
                Keine Aura mit "{searchQuery}" gefunden.
              </p>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10
                               flex items-center justify-center">
                  <Users size={32} className="text-purple-400" />
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  Deine Nebula ist noch leer.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => triggerHaptic('medium')}
                  className="btn-aura-primary px-8 py-3 inline-flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  <span>Aura erweitern</span>
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});

FriendsView.displayName = 'FriendsView';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: USER PROFILE HUB
// ═══════════════════════════════════════════════════════════════════════════

export const UserProfileHub: React.FC<UserProfileHubProps> = memo(({
  user,
  friends,
  onClose,
  onFriendSelect,
  onAuraSync,
  className = '',
}) => {
  const [view, setView] = useState<'profile' | 'friends'>('profile');
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = useCallback(() => {
    triggerHaptic('light');
    onClose();
  }, [onClose]);

  const handleFriendSelect = useCallback((friendId: string) => {
    onFriendSelect?.(friendId);
  }, [onFriendSelect]);

  const handleAuraSync = useCallback((friendId: string) => {
    onAuraSync?.(friendId);
  }, [onAuraSync]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-[#050505] z-[150] flex flex-col overflow-hidden ${className}`}
    >
      {/* Dynamic Top Bar */}
      <div className="h-20 flex items-center justify-between px-8 glass-header">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            setView('profile');
          }}
          className={`text-xs font-black tracking-[0.2em] transition-colors ${
            view === 'profile' ? 'text-purple-400' : 'text-gray-500'
          }`}
        >
          PROFIL
        </motion.button>

        <div className="w-1 h-1 bg-white/20 rounded-full" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            setView('friends');
          }}
          className={`text-xs font-black tracking-[0.2em] transition-colors ${
            view === 'friends' ? 'text-purple-400' : 'text-gray-500'
          }`}
        >
          FREUNDE ({friends.length})
        </motion.button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {view === 'profile' ? (
          <ProfileView
            user={user}
            friendsCount={friends.length}
            onViewFriends={() => setView('friends')}
          />
        ) : (
          <FriendsView
            friends={friends}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFriendSelect={handleFriendSelect}
            onAuraSync={handleAuraSync}
          />
        )}
      </AnimatePresence>

      {/* Close Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClose}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 p-4
                   bg-white/5 rounded-full backdrop-blur-xl border border-white/10
                   text-white/40 hover:text-white hover:bg-white/10 transition-all"
      >
        <X size={24} />
      </motion.button>
    </motion.div>
  );
});

UserProfileHub.displayName = 'UserProfileHub';

export default UserProfileHub;
