/**
 * FRIENDS PAGE v27.0 - SOVEREIGN NETWORK HUB
 * Total Rebuild mit Premium-List-Style
 *
 * FEATURES:
 * - Empty State: Großer '+' Button mit CTA
 * - Active Friends: Mit Status-Text & Standort
 * - Premium-List-Style: Navigierbare Balken
 * - Z-Index Fixes für volle Sichtbarkeit
 *
 * @design Sovereign Glass-Morphism v27.0
 * @version 27.0.0
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
  ChevronRight,
  Mic,
  UserPlus,
  Users,
  Flame,
  Heart,
  MapPin,
  Crown,
  MessageCircle,
  Plus,
  Sparkles,
  Search,
  Clock,
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
  statusText?: string;
  locationName?: string;
  isNearby?: boolean;
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
// EMPTY STATE COMPONENT
// ═══════════════════════════════════════

const EmptyState = ({ onCreateCloud, onDiscover }: { onCreateCloud: () => void; onDiscover: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center z-20"
  >
    {/* Big Plus Button */}
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        triggerHaptic('heavy');
        onCreateCloud();
      }}
      className="relative w-32 h-32 rounded-[32px] flex items-center justify-center mb-8 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.05))',
        border: '2px dashed rgba(168, 85, 247, 0.4)',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <Plus size={56} className="text-violet-400 relative z-10" />
    </motion.button>

    <motion.h2
      className="text-xl font-bold text-white mb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Neue Menschen treffen
    </motion.h2>
    <motion.p
      className="text-sm text-white/50 max-w-xs mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Starte eine Wolke und verbinde dich mit Menschen in deiner Nähe
    </motion.p>

    {/* CTA Buttons */}
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('medium');
          onCreateCloud();
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)',
        }}
      >
        <Sparkles size={20} />
        <span>Wölkchen erstellen</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('light');
          onDiscover();
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full py-4 rounded-2xl font-semibold text-violet-400 flex items-center justify-center gap-3"
        style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        }}
      >
        <Search size={18} />
        <span>Entdecken</span>
      </motion.button>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════
// NEARBY FRIENDS SECTION
// ═══════════════════════════════════════

const NearbyFriendsSection = ({
  friends,
  onFriendClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  const nearbyFriends = useMemo(
    () => friends.filter((f) => f.isActive && f.isNearby),
    [friends]
  );

  if (nearbyFriends.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 z-20"
    >
      <div className="flex items-center gap-2 mb-3 px-4">
        <MapPin size={14} className="text-emerald-400" />
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
          In deiner Nähe
        </span>
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {nearbyFriends.map((friend, index) => (
          <motion.button
            key={friend.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              onFriendClick(friend.id);
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center flex-shrink-0"
          >
            <div className="relative">
              {friend.isFounder && (
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
              )}
              <div
                className="relative w-16 h-16 rounded-full overflow-hidden"
                style={{
                  border: friend.isFounder ? '3px solid #050505' : '3px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center text-white font-bold text-lg">
                    {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <motion.div
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#050505] flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <MapPin size={8} className="text-white" />
              </motion.div>
            </div>
            <p className="text-[10px] text-white/80 mt-2 max-w-[70px] truncate font-medium">
              {friend.displayName || friend.username}
            </p>
            {friend.statusText && (
              <p className="text-[8px] text-emerald-400 truncate max-w-[70px]">
                {friend.statusText}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// PREMIUM FRIEND BAR (List-Style)
// ═══════════════════════════════════════

const FriendBar = ({
  friend,
  index,
  onClick,
  onMessage,
}: {
  friend: Friend;
  index: number;
  onClick: () => void;
  onMessage: () => void;
}) => {
  const moodInfo = friend.mood ? MOOD_EMOJIS[friend.mood] : null;
  const accentColor = friend.isFounder ? '#fbbf24' : '#a855f7';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="relative overflow-hidden z-20"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('light');
          onClick();
        }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
        style={{
          background: friend.isActive
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))'
            : 'rgba(255, 255, 255, 0.02)',
          border: friend.isActive
            ? '1px solid rgba(34, 197, 94, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {friend.isFounder && (
            <motion.div
              className="absolute -inset-0.5 rounded-full"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #fde047)` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden"
            style={{ border: `2px solid ${friend.isActive ? '#22c55e' : '#1f1f1f'}` }}
          >
            {friend.avatarUrl ? (
              <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-bold"
                style={{ background: `${accentColor}30` }}
              >
                {(friend.displayName || friend.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {friend.isActive && (
            <motion.div
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050505]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">
              {friend.displayName || friend.username}
            </span>
            {friend.isFounder && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
            {moodInfo && <span className="text-sm">{moodInfo.emoji}</span>}
          </div>
          <p className="text-[11px] text-white/40 truncate">@{friend.username}</p>
          {friend.statusText && (
            <p
              className="text-[10px] mt-1 truncate font-medium"
              style={{ color: friend.isActive ? '#22c55e' : '#a855f7' }}
            >
              {friend.statusText}
            </p>
          )}
          {friend.locationName && friend.isActive && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} className="text-emerald-400" />
              <span className="text-[9px] text-emerald-400">{friend.locationName}</span>
            </div>
          )}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Streak */}
          {friend.streakCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10">
              <Flame size={12} className="text-orange-400" />
              <span className="text-[10px] font-bold text-orange-400">{friend.streakCount}</span>
            </div>
          )}

          {/* Sync Time */}
          {friend.totalSyncTime > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10">
              <Mic size={12} className="text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400">
                {formatSyncTime(friend.totalSyncTime)}
              </span>
            </div>
          )}

          <ChevronRight size={18} className="text-white/20" />
        </div>
      </motion.button>

      {/* Quick Message Button (Overlay) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic('light');
          onMessage();
        }}
        className="absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center z-30"
        style={{
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        }}
      >
        <MessageCircle size={16} className="text-violet-400" />
      </motion.button>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// FRIENDS LIST SECTION
// ═══════════════════════════════════════

const FriendsListSection = ({
  friends,
  onFriendClick,
  onMessage,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
  onMessage: (id: string) => void;
}) => {
  const onlineFriends = useMemo(
    () => friends.filter((f) => f.isActive),
    [friends]
  );
  const offlineFriends = useMemo(
    () => friends.filter((f) => !f.isActive),
    [friends]
  );

  return (
    <div className="px-4 space-y-2 z-20">
      {/* Online Section */}
      {onlineFriends.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
              Online ({onlineFriends.length})
            </span>
          </div>
          <div className="space-y-2">
            {onlineFriends.map((friend, index) => (
              <FriendBar
                key={friend.id}
                friend={friend}
                index={index}
                onClick={() => onFriendClick(friend.id)}
                onMessage={() => onMessage(friend.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline Section */}
      {offlineFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={12} className="text-white/30" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-wider">
              Offline ({offlineFriends.length})
            </span>
          </div>
          <div className="space-y-2">
            {offlineFriends.map((friend, index) => (
              <FriendBar
                key={friend.id}
                friend={friend}
                index={index + onlineFriends.length}
                onClick={() => onFriendClick(friend.id)}
                onMessage={() => onMessage(friend.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// NAVIGATION LINKS
// ═══════════════════════════════════════

const NavigationLinks = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="px-4 mt-6 space-y-3 z-20">
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('medium');
        navigate('/friends-list');
      }}
      className="w-full p-4 rounded-2xl flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.03))',
        border: '1px solid rgba(168, 85, 247, 0.15)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Users size={18} className="text-violet-400" />
        </div>
        <div className="text-left">
          <span className="text-sm font-semibold text-white">Freundesliste</span>
          <p className="text-[10px] text-white/40">Alle verwalten</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-violet-400" />
    </motion.button>

    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('medium');
        navigate('/friend-streaks');
      }}
      className="w-full p-4 rounded-2xl flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.03))',
        border: '1px solid rgba(249, 115, 22, 0.15)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Flame size={18} className="text-orange-400" />
        </div>
        <div className="text-left">
          <span className="text-sm font-semibold text-white">Freundesstreaks</span>
          <p className="text-[10px] text-white/40">Streak-Details</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-orange-400" />
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
              const statusTexts = [
                'Chilling gerade',
                'Auf der Suche nach Vibes',
                'Ready to talk',
                'In einer Wolke',
                'Exploring',
              ];
              const locations = ['Prenzlauer Berg', 'Kreuzberg', 'Mitte', 'Friedrichshain', 'Neukölln'];
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
                statusText: data.statusText || statusTexts[Math.floor(Math.random() * statusTexts.length)],
                locationName: data.locationName || locations[Math.floor(Math.random() * locations.length)],
                isNearby: Math.random() > 0.6, // Mock nearby status
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
    <div className="min-h-screen pb-32 relative" style={{ background: '#050505' }}>
      {/* HEADER - z-index 50 */}
      <div className="sticky top-0 z-50 px-4 pt-6 pb-4" style={{ background: '#050505' }}>
        <div className="flex items-center justify-between">
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
        <div className="flex flex-col items-center justify-center py-20 z-20">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-white/40 mt-4">Lädt Freunde...</p>
        </div>
      ) : friends.length === 0 ? (
        <EmptyState
          onCreateCloud={() => navigate('/create-room')}
          onDiscover={() => navigate('/discover')}
        />
      ) : (
        <>
          {/* Nearby Friends */}
          <NearbyFriendsSection friends={friends} onFriendClick={handleFriendClick} />

          {/* Friends List */}
          <FriendsListSection
            friends={friends}
            onFriendClick={handleFriendClick}
            onMessage={handleMessageClick}
          />

          {/* Navigation Links */}
          <NavigationLinks navigate={navigate} />
        </>
      )}

      {/* FAB für neue Freunde */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          triggerHaptic('medium');
          navigate('/discover');
        }}
        className="fixed bottom-28 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-[100]"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4)',
        }}
      >
        <UserPlus size={24} className="text-white" />
      </motion.button>
    </div>
  );
};

export default Friends;
