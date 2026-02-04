/**
 * FRIENDS LIST PAGE - Complete Friend Directory
 * Full searchable list of all friends
 *
 * @design Sovereign Glass-Morphism
 * @version 1.0.0
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
  Search,
  UserPlus,
  MessageCircle,
  MoreHorizontal,
  Filter,
  Users,
  Crown,
  Check,
} from 'lucide-react';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  isFounder?: boolean;
  isVerified?: boolean;
  statusEmoji?: string;
  lastActiveAt?: Date;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════
// FRIEND ROW COMPONENT
// ═══════════════════════════════════════

const FriendRow = ({
  friend,
  index,
  onSelect,
  onMessage,
}: {
  friend: Friend;
  index: number;
  onSelect: () => void;
  onMessage: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="flex items-center gap-3 p-3 rounded-2xl"
    style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
    }}
  >
    {/* Avatar */}
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
      className="relative flex-shrink-0"
    >
      {/* Aura Ring */}
      {friend.isFounder && (
        <motion.div
          className="absolute -inset-0.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#050505]">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-violet-500/30 flex items-center justify-center text-white font-bold">
            {(friend.displayName || friend.username).charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {/* Online Indicator */}
      {friend.isActive && (
        <motion.div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>

    {/* Info */}
    <button
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
      className="flex-1 text-left min-w-0"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white truncate">
          {friend.displayName || friend.username}
        </span>
        {friend.isFounder && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
        {friend.isVerified && <Check size={12} className="text-emerald-400 flex-shrink-0" />}
        {friend.statusEmoji && <span className="text-sm">{friend.statusEmoji}</span>}
      </div>
      <p className="text-[10px] text-white/40">@{friend.username}</p>
    </button>

    {/* Streak Badge */}
    {friend.streakCount > 0 && (
      <div className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <span className="text-[10px] font-bold text-orange-400">🔥 {friend.streakCount}</span>
      </div>
    )}

    {/* Message Button */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        triggerHaptic('light');
        onMessage();
      }}
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}
    >
      <MessageCircle size={18} className="text-violet-400" />
    </motion.button>
  </motion.div>
);

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const FriendsList = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'streaks'>('all');

  // Fetch friends
  useEffect(() => {
    async function fetchFriends() {
      if (!user?.id) return;
      setLoading(true);

      try {
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('userIds', 'array-contains', user.id),
          where('status', '==', 'accepted'),
          limit(200)
        );

        const snapshot = await getDocs(friendshipsQuery);
        const friendIds: string[] = [];
        const friendshipData: Record<string, { streakCount: number }> = {};

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const friendId = (data.userIds as string[]).find((id) => id !== user.id);
          if (friendId) {
            friendIds.push(friendId);
            friendshipData[friendId] = { streakCount: data.streakCount || 0 };
          }
        });

        const friendProfiles: Friend[] = [];
        for (const friendId of friendIds) {
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
                isFounder: friendId === FOUNDER_UID,
                isVerified: data.isVerified || false,
                statusEmoji: data.statusEmoji,
                lastActiveAt: data.lastActiveAt?.toDate(),
              });
            }
          } catch (err) {
            console.error('[FriendsList] Error:', err);
          }
        }

        // Sort: Online first, then by name
        friendProfiles.sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return (a.displayName || a.username).localeCompare(b.displayName || b.username);
        });

        setFriends(friendProfiles);
      } catch (error) {
        console.error('[FriendsList] Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [user?.id]);

  // Filter friends
  const filteredFriends = useMemo(() => {
    let result = friends;

    // Apply search
    if (searchQuery) {
      result = result.filter(
        (f) =>
          f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (filter === 'online') {
      result = result.filter((f) => f.isActive);
    } else if (filter === 'streaks') {
      result = result.filter((f) => f.streakCount > 0).sort((a, b) => b.streakCount - a.streakCount);
    }

    return result;
  }, [friends, searchQuery, filter]);

  const onlineCount = friends.filter((f) => f.isActive).length;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* HEADER */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              navigate('/friends');
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
            <h1 className="text-xl font-bold text-white">Freundesliste</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              {friends.length} Freunde • {onlineCount} online
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Freunde suchen..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-white placeholder:text-white/30 focus:outline-none"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Alle', count: friends.length },
            { key: 'online', label: 'Online', count: onlineCount },
            { key: 'streaks', label: 'Streaks', count: friends.filter((f) => f.streakCount > 0).length },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                setFilter(tab.key as typeof filter);
              }}
              className="flex-1 py-2 rounded-xl text-center"
              style={{
                background: filter === tab.key ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${filter === tab.key ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.04)'}`,
              }}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  filter === tab.key ? 'text-violet-400' : 'text-white/40'
                }`}
              >
                {tab.label} ({tab.count})
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FRIENDS LIST */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-white/20 mb-3" />
            <p className="text-white/40">{searchQuery ? 'Keine Treffer' : 'Keine Freunde'}</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredFriends.map((friend, index) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                index={index}
                onSelect={() => navigate(`/user/${friend.id}`)}
                onMessage={() => navigate(`/messages?userId=${friend.id}`)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
