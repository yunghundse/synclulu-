/**
 * FRIENDS PAGE v21.0 - NEBULA SOVEREIGN
 * "Deine Aura" - Friend Management & Streaks
 *
 * FEATURES:
 * - Friend List with Streaks
 * - Search & Filter
 * - Add Friend Button
 * - Streak Flames Display
 *
 * @design Nebula Sovereign v21.0
 * @version 21.0.0
 */

import { useState, useEffect, useCallback } from 'react';
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
  Search,
  UserPlus,
  Users,
  Flame,
  Star,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  lastInteraction?: Date;
  isFounder?: boolean;
  isVerified?: boolean;
}

// Streak Colors based on days
const getStreakColor = (days: number) => {
  if (days >= 30) return 'text-purple-500 bg-purple-500/10';
  if (days >= 14) return 'text-orange-500 bg-orange-500/10';
  if (days >= 7) return 'text-amber-500 bg-amber-500/10';
  return 'text-red-400 bg-red-400/10';
};

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════
// FRIEND CARD COMPONENT
// ═══════════════════════════════════════

const FriendCard = ({
  friend,
  index,
  onSelect,
  onMessage,
}: {
  friend: Friend;
  index: number;
  onSelect: () => void;
  onMessage: () => void;
}) => {
  const streakColor = getStreakColor(friend.streakCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[var(--delulu-card)] rounded-2xl p-4 border border-[var(--delulu-border)] shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onSelect();
          }}
          className="relative"
        >
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
            {friend.avatarUrl ? (
              <img
                src={friend.avatarUrl}
                alt={friend.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                {(friend.displayName || friend.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Online Indicator */}
          {friend.isActive && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--delulu-bg)]" />
          )}

          {/* Founder Crown */}
          {friend.isFounder && (
            <div className="absolute -top-1 -right-1 text-sm">👑</div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--delulu-text)] truncate">
              {friend.displayName || friend.username}
            </span>
            {friend.isVerified && (
              <span className="text-emerald-500 text-xs">✓</span>
            )}
          </div>
          <div className="text-xs text-[var(--delulu-muted)]">
            @{friend.username}
          </div>
        </div>

        {/* Streak Badge */}
        {friend.streakCount > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${streakColor}`}>
            <Flame size={14} />
            <span className="text-sm font-bold">{friend.streakCount}</span>
          </div>
        )}

        {/* Message Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onMessage();
          }}
          className="w-10 h-10 rounded-xl bg-[var(--delulu-surface)] flex items-center justify-center hover:bg-purple-500/10 transition-colors"
        >
          <MessageCircle size={18} className="text-[var(--delulu-muted)]" />
        </button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch friends
  useEffect(() => {
    async function fetchFriends() {
      if (!user?.id) return;

      setLoading(true);

      try {
        // Fetch friendships where user is a participant
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('userIds', 'array-contains', user.id),
          where('status', '==', 'accepted'),
          limit(100)
        );

        const snapshot = await getDocs(friendshipsQuery);
        const friendIds: string[] = [];
        const friendshipData: Record<string, { streakCount: number; lastInteraction?: Date }> = {};

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const friendId = (data.userIds as string[]).find((id) => id !== user.id);
          if (friendId) {
            friendIds.push(friendId);
            friendshipData[friendId] = {
              streakCount: data.streakCount || 0,
              lastInteraction: data.lastInteraction?.toDate(),
            };
          }
        });

        // Fetch friend profiles
        const friendProfiles: Friend[] = [];
        for (const friendId of friendIds.slice(0, 50)) {
          try {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              const data = friendDoc.data();
              friendProfiles.push({
                id: friendId,
                username: data.username || 'User',
                displayName: data.displayName,
                avatarUrl: data.photoURL || data.avatarUrl,
                isActive: data.isOnline || false,
                streakCount: friendshipData[friendId]?.streakCount || 0,
                lastInteraction: friendshipData[friendId]?.lastInteraction,
                isFounder: friendId === FOUNDER_UID,
                isVerified: data.isVerified || false,
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

  // Filter friends by search
  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Online friends count
  const onlineCount = friends.filter((f) => f.isActive).length;

  // Handle friend selection
  const handleSelectFriend = useCallback((friendId: string) => {
    navigate(`/user/${friendId}`);
  }, [navigate]);

  // Handle message
  const handleMessage = useCallback((friendId: string) => {
    navigate(`/messages?userId=${friendId}`);
  }, [navigate]);

  return (
    <div className="min-h-screen page-gradient theme-transition pb-24">
      {/* ═══════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              triggerHaptic('light');
              navigate('/profile');
            }}
            className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] backdrop-blur-sm border border-[var(--delulu-border)] flex items-center justify-center hover:bg-[var(--delulu-soft)] transition-colors"
          >
            <ChevronLeft size={20} className="text-[var(--delulu-muted)]" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">
              Deine Aura
            </h1>
            <p className="text-xs text-[var(--delulu-muted)]">
              {friends.length} Freunde • {onlineCount} online
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Freunde suchen..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--delulu-surface)] border border-[var(--delulu-border)] text-[var(--delulu-text)] placeholder:text-[var(--delulu-muted)] focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              triggerHaptic('light');
              navigate('/invites');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30"
          >
            <UserPlus size={18} />
            <span>Freunde einladen</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              // Could open a modal to find friends nearby
            }}
            className="w-12 h-12 rounded-xl bg-[var(--delulu-surface)] border border-[var(--delulu-border)] flex items-center justify-center hover:bg-purple-500/10 transition-colors"
          >
            <Users size={20} className="text-[var(--delulu-muted)]" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* FRIENDS LIST */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-4" />
            <p className="text-sm text-[var(--delulu-muted)]">Lade Freunde...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Users size={32} className="text-purple-500" />
            </div>
            <h3 className="font-semibold text-[var(--delulu-text)] mb-2">
              {searchQuery ? 'Keine Treffer' : 'Noch keine Freunde'}
            </h3>
            <p className="text-sm text-[var(--delulu-muted)] max-w-xs">
              {searchQuery
                ? 'Versuche einen anderen Suchbegriff'
                : 'Lade Freunde ein und baut gemeinsam eure Streaks auf!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/invites')}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30"
              >
                Freunde einladen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Streak at Risk Section */}
            {filteredFriends.some((f) => f.streakCount > 0 && f.streakCount <= 1) && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Flame size={14} />
                  Streak gefährdet
                </h3>
                {filteredFriends
                  .filter((f) => f.streakCount > 0 && f.streakCount <= 1)
                  .map((friend, index) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      index={index}
                      onSelect={() => handleSelectFriend(friend.id)}
                      onMessage={() => handleMessage(friend.id)}
                    />
                  ))}
              </div>
            )}

            {/* All Friends */}
            <AnimatePresence>
              {filteredFriends
                .filter((f) => f.streakCount === 0 || f.streakCount > 1)
                .map((friend, index) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    index={index}
                    onSelect={() => handleSelectFriend(friend.id)}
                    onMessage={() => handleMessage(friend.id)}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
