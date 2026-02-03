/**
 * FinalProfile.tsx
 * 🛡️ HARMONY PROFILE SYSTEM v20.0 - Trust & Connection
 *
 * Launch-Ready Profile with:
 * - Trust Score System (0-1000)
 * - Verified Badge
 * - Sanctuary Score Display
 * - Midnight Glass Design
 * - Friend List Integration
 *
 * @version 20.0.0
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  FriendAcceptedExplosion,
  StarReceivedExplosion,
} from '../ParticleExplosion';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Trust Level Thresholds
const TRUST_LEVELS = {
  NEWCOMER: { min: 0, max: 199, label: 'Newcomer', color: 'rgba(255, 255, 255, 0.4)' },
  RISING: { min: 200, max: 399, label: 'Rising', color: '#60a5fa' },
  TRUSTED: { min: 400, max: 599, label: 'Trusted', color: '#a855f7' },
  RESPECTED: { min: 600, max: 799, label: 'Respected', color: '#f59e0b' },
  LEGENDARY: { min: 800, max: 1000, label: 'Legendary', color: '#10b981' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  trustScore: number;
  isVerified: boolean;
  isFounder?: boolean;
  totalStarsReceived: number;
  totalFriends: number;
  createdAt: Date;
  sanctuaryScore?: number;
}

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  trustScore: number;
  isVerified: boolean;
  isFounder?: boolean;
}

interface FinalProfileProps {
  userId?: string;
  onClose?: () => void;
  onFriendSelect?: (friendId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getTrustLevel(score: number) {
  if (score >= TRUST_LEVELS.LEGENDARY.min) return TRUST_LEVELS.LEGENDARY;
  if (score >= TRUST_LEVELS.RESPECTED.min) return TRUST_LEVELS.RESPECTED;
  if (score >= TRUST_LEVELS.TRUSTED.min) return TRUST_LEVELS.TRUSTED;
  if (score >= TRUST_LEVELS.RISING.min) return TRUST_LEVELS.RISING;
  return TRUST_LEVELS.NEWCOMER;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUST BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TrustBadge: React.FC<{
  trustScore: number;
  isVerified: boolean;
  isFounder?: boolean;
  size?: 'small' | 'medium' | 'large';
}> = memo(({ trustScore, isVerified, isFounder, size = 'medium' }) => {
  const level = getTrustLevel(trustScore);

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-1.5',
  };

  if (isFounder) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]}`}
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
          border: '1px solid rgba(168, 85, 247, 0.5)',
        }}
      >
        <span className="text-lg">👑</span>
        <span className="font-bold text-white">Founder</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]}`}
      style={{
        background: `${level.color}20`,
        border: `1px solid ${level.color}50`,
      }}
    >
      {isVerified && <span className="text-sm">✓</span>}
      <span style={{ color: level.color }} className="font-medium">
        {level.label}
      </span>
    </motion.div>
  );
});

TrustBadge.displayName = 'TrustBadge';

// ═══════════════════════════════════════════════════════════════════════════
// TRUST SCORE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TrustScoreBar: React.FC<{
  score: number;
  showLabels?: boolean;
}> = memo(({ score, showLabels = true }) => {
  const level = getTrustLevel(score);
  const percentage = Math.min((score / 1000) * 100, 100);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            Trust Score
          </span>
          <span className="text-sm font-bold" style={{ color: level.color }}>
            {score}/1000
          </span>
        </div>
      )}

      <div className="trust-score-bar">
        <motion.div
          className="trust-score-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${level.color}80, ${level.color})`,
          }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between mt-2">
          {Object.values(TRUST_LEVELS).map((lvl, i) => (
            <div
              key={lvl.label}
              className="text-[10px] text-white/30"
              style={{
                color: score >= lvl.min ? level.color : undefined,
              }}
            >
              {i === 0 && '0'}
              {i === 2 && '500'}
              {i === 4 && '1K'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

TrustScoreBar.displayName = 'TrustScoreBar';

// ═══════════════════════════════════════════════════════════════════════════
// SANCTUARY SCORE DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

const SanctuaryScore: React.FC<{
  score: number;
  starsReceived: number;
  friendsCount: number;
}> = memo(({ score, starsReceived, friendsCount }) => {
  return (
    <div className="sanctuary-score">
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-5xl font-black text-white mb-1"
        >
          {score}
        </motion.div>
        <div className="text-xs text-white/40 uppercase tracking-widest">
          Sanctuary Score
        </div>
      </div>

      <div className="flex justify-center gap-8">
        <div className="text-center">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-lg font-bold text-white">{starsReceived}</div>
          <div className="text-[10px] text-white/40 uppercase">Stars</div>
        </div>

        <div className="w-px bg-white/10" />

        <div className="text-center">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-lg font-bold text-white">{friendsCount}</div>
          <div className="text-[10px] text-white/40 uppercase">Friends</div>
        </div>
      </div>
    </div>
  );
});

SanctuaryScore.displayName = 'SanctuaryScore';

// ═══════════════════════════════════════════════════════════════════════════
// FRIEND CARD (HARMONY STYLE)
// ═══════════════════════════════════════════════════════════════════════════

const FriendCardHarmony: React.FC<{
  friend: Friend;
  onSelect: () => void;
  index: number;
}> = memo(({ friend, onSelect, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="friend-card-harmony"
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full overflow-hidden"
          style={{
            background: friend.avatarUrl
              ? `url(${friend.avatarUrl}) center/cover`
              : 'linear-gradient(135deg, var(--harmony-purple), var(--harmony-accent))',
          }}
        >
          {!friend.avatarUrl && (
            <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Online Indicator */}
        {friend.isActive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
        )}

        {/* Founder Crown */}
        {friend.isFounder && (
          <div className="absolute -top-1 -right-1 text-sm">👑</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white truncate">
            {friend.displayName || friend.username}
          </span>
          {friend.isVerified && (
            <span className="text-xs text-harmony-purple">✓</span>
          )}
        </div>
        <div className="text-xs text-white/40">@{friend.username}</div>
      </div>

      {/* Streak */}
      {friend.streakCount > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-bold text-orange-400">
            {friend.streakCount}
          </span>
        </div>
      )}

      {/* Trust Badge */}
      <TrustBadge
        trustScore={friend.trustScore}
        isVerified={friend.isVerified}
        isFounder={friend.isFounder}
        size="small"
      />
    </motion.div>
  );
});

FriendCardHarmony.displayName = 'FriendCardHarmony';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════

const ProfileView: React.FC<{
  profile: UserProfile;
  onShowFriends: () => void;
}> = memo(({ profile, onShowFriends }) => {
  const isFounder = profile.id === FOUNDER_UID;
  const level = getTrustLevel(profile.trustScore);

  return (
    <div className="animate-harmony-fade-in">
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="profile-avatar-harmony"
          style={{
            '--avatar-glow': isFounder
              ? 'rgba(168, 85, 247, 0.4)'
              : `${level.color}40`,
          } as React.CSSProperties}
        >
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-harmony-purple to-harmony-accent text-white text-4xl font-black">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Founder Crown */}
          {isFounder && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -top-3 -right-3 text-3xl"
            >
              👑
            </motion.div>
          )}
        </motion.div>

        {/* Name & Username */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-black text-white mt-4"
        >
          {profile.displayName || profile.username}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-white/40 text-sm"
        >
          @{profile.username}
        </motion.p>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3"
        >
          <TrustBadge
            trustScore={profile.trustScore}
            isVerified={profile.isVerified}
            isFounder={isFounder}
            size="large"
          />
        </motion.div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-4 mb-6 text-center"
        >
          <p className="text-white/70 text-sm">{profile.bio}</p>
        </motion.div>
      )}

      {/* Trust Score Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-5 mb-6"
      >
        <TrustScoreBar score={profile.trustScore} />
      </motion.div>

      {/* Sanctuary Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6"
      >
        <SanctuaryScore
          score={profile.sanctuaryScore || profile.trustScore}
          starsReceived={profile.totalStarsReceived}
          friendsCount={profile.totalFriends}
        />
      </motion.div>

      {/* Friends Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => {
          triggerHaptic('light');
          onShowFriends();
        }}
        className="btn-harmony w-full"
      >
        <span className="mr-2">👥</span>
        Meine Freunde
        <span className="ml-auto text-sm opacity-60">
          {profile.totalFriends}
        </span>
      </motion.button>
    </div>
  );
});

ProfileView.displayName = 'ProfileView';

// ═══════════════════════════════════════════════════════════════════════════
// FRIENDS LIST VIEW
// ═══════════════════════════════════════════════════════════════════════════

const FriendsListView: React.FC<{
  friends: Friend[];
  onBack: () => void;
  onFriendSelect: (friendId: string) => void;
}> = memo(({ friends, onBack, onFriendSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: Online first, then by streak count
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.streakCount - a.streakCount;
  });

  return (
    <div className="animate-slide-left">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <span className="text-white/60">←</span>
        </button>
        <h2 className="text-xl font-bold text-white">
          Freunde ({friends.length})
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen..."
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-harmony-purple/50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
          🔍
        </span>
      </div>

      {/* Friends List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {sortedFriends.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            {searchQuery
              ? 'Keine Freunde gefunden'
              : 'Noch keine Freunde hinzugefügt'}
          </div>
        ) : (
          sortedFriends.map((friend, index) => (
            <FriendCardHarmony
              key={friend.id}
              friend={friend}
              onSelect={() => onFriendSelect(friend.id)}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
});

FriendsListView.displayName = 'FriendsListView';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const FinalProfile: React.FC<FinalProfileProps> = memo(({
  userId,
  onClose,
  onFriendSelect,
}) => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<'profile' | 'friends'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplosion, setShowExplosion] = useState(false);

  const targetUserId = userId || currentUser?.uid;
  const isOwnProfile = targetUserId === currentUser?.uid;

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!targetUserId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', targetUserId));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            id: targetUserId,
            username: data.username || 'User',
            displayName: data.displayName,
            photoURL: data.photoURL,
            bio: data.bio,
            trustScore: data.trustScore || 500,
            isVerified: data.isVerified || false,
            isFounder: targetUserId === FOUNDER_UID,
            totalStarsReceived: data.totalStarsReceived || 0,
            totalFriends: data.totalFriends || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            sanctuaryScore: data.sanctuaryScore,
          });
        }
      } catch (error) {
        console.error('[FinalProfile] Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [targetUserId]);

  // Fetch friends
  useEffect(() => {
    async function fetchFriends() {
      if (!targetUserId) return;

      try {
        // This would use the friendshipSystem in production
        // For now, we'll fetch from the user's friends subcollection
        const { getFriendsWithStats } = await import('../../lib/friendshipSystem');
        const friendsData = await getFriendsWithStats(targetUserId);

        setFriends(
          friendsData.map((f) => ({
            id: f.oderId,
            username: f.username,
            displayName: f.displayName,
            avatarUrl: f.avatarUrl,
            isActive: f.isActive,
            streakCount: f.streakCount,
            trustScore: 500, // Would come from user profile
            isVerified: false,
            isFounder: f.isFounder,
          }))
        );
      } catch (error) {
        console.error('[FinalProfile] Error fetching friends:', error);
      }
    }

    fetchFriends();
  }, [targetUserId]);

  const handleFriendSelect = useCallback((friendId: string) => {
    triggerHaptic('medium');
    onFriendSelect?.(friendId);
  }, [onFriendSelect]);

  if (loading) {
    return (
      <div className="glass-panel p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-white/40">Lädt...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-white/40">Profil nicht gefunden</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Explosion Effect */}
      <FriendAcceptedExplosion
        trigger={showExplosion}
        onComplete={() => setShowExplosion(false)}
      />

      {/* Header with Close Button */}
      {onClose && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-white/60">×</span>
          </button>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'profile' ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileView
              profile={profile}
              onShowFriends={() => {
                triggerHaptic('light');
                setView('friends');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="friends"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FriendsListView
              friends={friends}
              onBack={() => {
                triggerHaptic('light');
                setView('profile');
              }}
              onFriendSelect={handleFriendSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FinalProfile.displayName = 'FinalProfile';

export default FinalProfile;
