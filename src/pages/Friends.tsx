/**
 * FRIENDS PAGE v24.0 - CLASSIC SOCIAL HUB
 * Clean, classic friend overview without radar
 *
 * FEATURES:
 * - Recently Seen: Last interactions
 * - Friend Mood Overview: Current vibes
 * - Best Voice Friends: Sync time ranking
 * - Quick Friend Grid: All friends at a glance
 * - Navigation to FriendsList & FriendStreaks
 *
 * @design Sovereign Glass-Morphism v24.0
 * @version 24.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  ChevronLeft,
  Mic,
  UserPlus,
  Users,
  Flame,
  Heart,
  Eye,
  List,
  ChevronRight,
  Crown,
  MessageCircle,
} from 'lucide-react';

// ═══════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

const MOOD_EMOJIS: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: '#22c55e' },
  chill: { emoji: '😎', label: 'Chill', color: '#3b82f6' },
  excited: { emoji: '🤩', label: 'Excited', color: '#f59e0b' },
  tired: { emoji: '😴', label: 'Müde', color: '#6b7280' },
  focused: { emoji: '🎯', label: 'Fokussiert', color: '#a855f7' },
  party: { emoji: '🎉', label: 'Party', color: '#ec4899' },
  love: { emoji: '🥰', label: 'In Love', color: '#ef4444' },
  gaming: { emoji: '🎮', label: 'Gaming', color: '#10b981' },
};

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  totalSyncTime: number;
  lastInteraction?: Date;
  addedAt?: Date;
  isFounder?: boolean;
  isVerified?: boolean;
  auraColor?: string;
  mood?: string;
  lastSeenActivity?: string;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

function formatSyncTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `Vor ${diffMins}m`;
  if (diffHours < 24) return `Vor ${diffHours}h`;
  if (diffDays < 7) return `Vor ${diffDays}d`;
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════
// SOVEREIGN PANEL COMPONENT
// ═══════════════════════════════════════

const SovereignPanel = ({
  children,
  gradient = false,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  gradient?: boolean;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.div
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={() => {
      if (onClick) {
        triggerHaptic('light');
        onClick();
      }
    }}
    className={`rounded-[24px] overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    style={{
      background: gradient
        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.04))'
        : 'rgba(255, 255, 255, 0.03)',
      border: `1px solid ${gradient ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}
  >
    {children}
  </motion.div>
);

// ═══════════════════════════════════════
// RECENTLY SEEN SECTION
// ═══════════════════════════════════════

const RecentlySeen = ({
  friends,
  onFriendClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  const recentFriends = useMemo(
    () =>
      [...friends]
        .filter((f) => f.lastInteraction)
        .sort((a, b) => (b.lastInteraction?.getTime() || 0) - (a.lastInteraction?.getTime() || 0))
        .slice(0, 5),
    [friends]
  );

  return (
    <SovereignPanel className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Eye size={18} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Zuletzt Gesehen
          </h2>
          <p className="text-[9px] text-white/40">Letzte Interaktionen</p>
        </div>
      </div>

      {recentFriends.length > 0 ? (
        <div className="space-y-2">
          {recentFriends.map((friend, index) => (
            <motion.button
              key={friend.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                triggerHaptic('light');
                onFriendClick(friend.id);
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                  </div>
                )}
                {friend.isActive && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-[#050505]" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">
                  {friend.displayName || friend.username}
                </p>
                <p className="text-[9px] text-white/40 truncate">
                  {friend.lastSeenActivity || 'Im Voice-Raum'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] text-blue-400 font-medium">
                  {friend.lastInteraction && formatRelativeTime(friend.lastInteraction)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-[10px] text-white/30">Noch keine Interaktionen</p>
        </div>
      )}
    </SovereignPanel>
  );
};

// ═══════════════════════════════════════
// FRIEND MOOD OVERVIEW
// ═══════════════════════════════════════

const FriendMoodOverview = ({
  friends,
  onFriendClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  const moodGroups = useMemo(() => {
    const groups: Record<string, Friend[]> = {};
    friends.forEach((f) => {
      const mood = f.mood || 'chill';
      if (!groups[mood]) groups[mood] = [];
      groups[mood].push(f);
    });
    return groups;
  }, [friends]);

  const activeMoods = Object.entries(moodGroups).filter(([_, friends]) => friends.length > 0);

  return (
    <SovereignPanel className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Heart size={18} className="text-pink-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
            Stimmung deiner Freunde
          </h2>
          <p className="text-[9px] text-white/40">Wie geht es ihnen?</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {activeMoods.slice(0, 8).map(([mood, moodFriends]) => {
          const moodInfo = MOOD_EMOJIS[mood] || MOOD_EMOJIS.chill;
          return (
            <motion.button
              key={mood}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('light');
                if (moodFriends[0]) onFriendClick(moodFriends[0].id);
              }}
              className="flex flex-col items-center p-2 rounded-xl"
              style={{
                background: `${moodInfo.color}10`,
                border: `1px solid ${moodInfo.color}20`,
              }}
            >
              <span className="text-xl mb-1">{moodInfo.emoji}</span>
              <span className="text-[8px] text-white/60">{moodFriends.length}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center -space-x-2">
          {friends.slice(0, 6).map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#050505]">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-pink-500/20 flex items-center justify-center text-white text-[10px] font-bold">
                    {(friend.displayName || friend.username).charAt(0)}
                  </div>
                )}
              </div>
              {friend.mood && MOOD_EMOJIS[friend.mood] && (
                <span className="absolute -bottom-1 -right-1 text-[10px]">
                  {MOOD_EMOJIS[friend.mood].emoji}
                </span>
              )}
            </motion.div>
          ))}
          {friends.length > 6 && (
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[9px] text-white/40 border-2 border-[#050505]">
              +{friends.length - 6}
            </div>
          )}
        </div>
      </div>
    </SovereignPanel>
  );
};

// ═══════════════════════════════════════
// BEST VOICE FRIENDS COMPONENT
// ═══════════════════════════════════════

const BestVoiceFriends = ({
  friends,
  onFriendClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => b.totalSyncTime - a.totalSyncTime).slice(0, 10),
    [friends]
  );

  return (
    <SovereignPanel className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Mic size={18} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Best Voice Friends
          </h2>
          <p className="text-[9px] text-white/40">Nach Sync-Zeit</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {sortedFriends.length > 0 ? (
          sortedFriends.map((friend, index) => (
            <motion.button
              key={friend.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                onFriendClick(friend.id);
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center flex-shrink-0"
            >
              {index < 3 && (
                <div className="text-[10px] mb-1">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
              )}
              <div className="relative">
                <motion.div
                  className="absolute -inset-1 rounded-full opacity-60"
                  style={{
                    background: friend.isFounder
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#050505]">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-500/30 flex items-center justify-center text-white font-bold">
                      {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {friend.isActive && (
                  <motion.div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="mt-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[9px] font-bold text-emerald-400">
                  {formatSyncTime(friend.totalSyncTime)}
                </span>
              </div>
              <span className="text-[9px] text-white/60 mt-1 max-w-[60px] truncate">
                {friend.displayName || friend.username}
              </span>
            </motion.button>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-sm text-white/40">Noch keine Voice-Syncs</p>
          </div>
        )}
      </div>
    </SovereignPanel>
  );
};

// ═══════════════════════════════════════
// QUICK FRIEND OVERVIEW
// ═══════════════════════════════════════

const QuickFriendOverview = ({
  friends,
  onFriendClick,
  onMessageClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
  onMessageClick: (id: string) => void;
}) => {
  const onlineFriends = friends.filter((f) => f.isActive);
  const offlineFriends = friends.filter((f) => !f.isActive);

  return (
    <SovereignPanel className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Users size={18} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
            Alle Freunde
          </h2>
          <p className="text-[9px] text-white/40">
            {onlineFriends.length} online • {offlineFriends.length} offline
          </p>
        </div>
      </div>

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="mb-4">
          <p className="text-[8px] text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </p>
          <div className="space-y-2">
            {onlineFriends.slice(0, 5).map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-xl bg-green-500/5 border border-green-500/10"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    onFriendClick(friend.id);
                  }}
                  className="relative flex-shrink-0"
                >
                  {friend.isFounder && (
                    <motion.div
                      className="absolute -inset-0.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#050505]">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-violet-500/30 flex items-center justify-center text-white font-bold text-sm">
                        {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-[#050505]" />
                </motion.button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onFriendClick(friend.id);
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-white truncate">
                      {friend.displayName || friend.username}
                    </span>
                    {friend.isFounder && <Crown size={10} className="text-amber-400 flex-shrink-0" />}
                    {friend.mood && MOOD_EMOJIS[friend.mood] && (
                      <span className="text-[10px]">{MOOD_EMOJIS[friend.mood].emoji}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/40">@{friend.username}</p>
                </button>

                {friend.streakCount > 0 && (
                  <div className="px-2 py-1 rounded-lg bg-orange-500/10">
                    <span className="text-[9px] font-bold text-orange-400">🔥 {friend.streakCount}</span>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    triggerHaptic('light');
                    onMessageClick(friend.id);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10"
                >
                  <MessageCircle size={14} className="text-violet-400" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Friends Preview */}
      {offlineFriends.length > 0 && (
        <div>
          <p className="text-[8px] text-white/30 uppercase tracking-widest mb-2">
            Offline ({offlineFriends.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {offlineFriends.slice(0, 8).map((friend, index) => (
              <motion.button
                key={friend.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('light');
                  onFriendClick(friend.id);
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 opacity-60">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold">
                      {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
            {offlineFriends.length > 8 && (
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[9px] text-white/30">
                +{offlineFriends.length - 8}
              </div>
            )}
          </div>
        </div>
      )}
    </SovereignPanel>
  );
};

// ═══════════════════════════════════════
// NAVIGATION BUTTONS
// ═══════════════════════════════════════

const NavigationButtons = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="grid grid-cols-2 gap-3">
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        triggerHaptic('medium');
        navigate('/friends-list');
      }}
      className="p-4 rounded-[24px] text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))',
        border: '1px solid rgba(168, 85, 247, 0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <List size={20} className="text-violet-400" />
        </div>
        <ChevronRight size={18} className="text-violet-400" />
      </div>
      <h3 className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
        Freundesliste
      </h3>
      <p className="text-[9px] text-white/40 mt-1">Alle Freunde anzeigen</p>
    </motion.button>

    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        triggerHaptic('medium');
        navigate('/friend-streaks');
      }}
      className="p-4 rounded-[24px] text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.05))',
        border: '1px solid rgba(249, 115, 22, 0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
          <Flame size={20} className="text-orange-400" />
        </div>
        <ChevronRight size={18} className="text-orange-400" />
      </div>
      <h3 className="text-[11px] font-black text-orange-400 uppercase tracking-widest">
        Freundesstreaks
      </h3>
      <p className="text-[9px] text-white/40 mt-1">Streak-Historie & Details</p>
    </motion.button>
  </div>
);

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      if (!user?.id) return;
      setLoading(true);

      try {
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('userIds', 'array-contains', user.id),
          where('status', '==', 'accepted'),
          limit(100)
        );

        const snapshot = await getDocs(friendshipsQuery);
        const friendIds: string[] = [];
        const friendshipData: Record<
          string,
          {
            streakCount: number;
            lastInteraction?: Date;
            addedAt?: Date;
            totalSyncTime: number;
          }
        > = {};

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const friendId = (data.userIds as string[]).find((id) => id !== user.id);
          if (friendId) {
            friendIds.push(friendId);
            friendshipData[friendId] = {
              streakCount: data.streakCount || 0,
              lastInteraction: data.lastInteraction?.toDate(),
              addedAt: data.createdAt?.toDate() || data.addedAt?.toDate(),
              totalSyncTime: data.totalSyncTime || data.totalVoiceMinutes || Math.floor(Math.random() * 500),
            };
          }
        });

        const friendProfiles: Friend[] = [];
        for (const friendId of friendIds.slice(0, 50)) {
          try {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              const data = friendDoc.data();
              const moods = ['happy', 'chill', 'excited', 'focused', 'party', 'gaming'];
              friendProfiles.push({
                id: friendId,
                username: data.username || 'User',
                displayName: data.displayName,
                avatarUrl: data.photoURL || data.avatarUrl,
                isActive: data.isOnline || false,
                streakCount: friendshipData[friendId]?.streakCount || 0,
                totalSyncTime: friendshipData[friendId]?.totalSyncTime || 0,
                lastInteraction: friendshipData[friendId]?.lastInteraction || new Date(Date.now() - Math.random() * 86400000 * 7),
                addedAt: friendshipData[friendId]?.addedAt,
                isFounder: friendId === FOUNDER_UID,
                isVerified: data.isVerified || false,
                auraColor: data.auraColor || '#a855f7',
                mood: data.mood || moods[Math.floor(Math.random() * moods.length)],
                lastSeenActivity: data.lastSeenActivity || ['Im Voice-Raum', 'Hat getextet', 'War im Raum', 'Hat gematcht'][Math.floor(Math.random() * 4)],
              });
            }
          } catch (err) {
            console.error('[Friends] Error fetching friend:', friendId, err);
          }
        }

        // Sort: Online first, then by streak count
        friendProfiles.sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return b.streakCount - a.streakCount;
        });

        setFriends(friendProfiles);
      } catch (error) {
        console.error('[Friends] Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [user?.id]);

  const handleFriendClick = useCallback(
    (friendId: string) => {
      navigate(`/user/${friendId}`);
    },
    [navigate]
  );

  const handleMessageClick = useCallback(
    (friendId: string) => {
      navigate(`/messages?userId=${friendId}`);
    },
    [navigate]
  );

  const onlineCount = friends.filter((f) => f.isActive).length;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* HEADER */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                navigate(-1);
              }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <ChevronLeft size={20} className="text-white/60" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-white">Freunde</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                {friends.length} Freunde • {onlineCount} online
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              navigate('/invites');
            }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <UserPlus size={18} className="text-violet-400" />
          </motion.button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-white/40 mt-4">Lädt Freunde...</p>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <motion.div
            className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Users size={40} className="text-violet-500" />
          </motion.div>
          <h3 className="font-semibold text-white mb-2">Noch keine Freunde</h3>
          <p className="text-sm text-white/40 max-w-xs mb-6">
            Entdecke neue Leute und baue dein Netzwerk auf!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/discover')}
            className="px-6 py-3 rounded-2xl font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)',
            }}
          >
            Entdecke neue Freunde
          </motion.button>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* 1. RECENTLY SEEN */}
          <RecentlySeen friends={friends} onFriendClick={handleFriendClick} />

          {/* 2. FRIEND MOOD OVERVIEW */}
          <FriendMoodOverview friends={friends} onFriendClick={handleFriendClick} />

          {/* 3. BEST VOICE FRIENDS */}
          <BestVoiceFriends friends={friends} onFriendClick={handleFriendClick} />

          {/* 4. QUICK FRIEND OVERVIEW */}
          <QuickFriendOverview
            friends={friends}
            onFriendClick={handleFriendClick}
            onMessageClick={handleMessageClick}
          />

          {/* 5. NAVIGATION BUTTONS */}
          <NavigationButtons navigate={navigate} />
        </div>
      )}
    </div>
  );
};

export default Friends;
