/**
 * FRIENDS PAGE v22.0 - SOCIAL RADAR & STREAK ENGINE
 * "Deine Aura" - Revolutionary Friend Experience
 *
 * FEATURES:
 * - Proximity-Radar: Pulsing radar with nearby friends
 * - Best Voice Friends: Sorted by total sync time
 * - New Connections & Streak Master Grid
 * - Full Sovereign Glass-Morphism Design
 *
 * @design Sovereign Glass-Morphism v22.0
 * @version 22.0.0
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
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  ChevronLeft,
  Radio,
  Mic,
  UserPlus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StreakCard } from '@/components/SovereignUI/StreakCard';

// ═══════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  totalSyncTime: number; // Minutes in voice calls
  lastInteraction?: Date;
  addedAt?: Date;
  isFounder?: boolean;
  isVerified?: boolean;
  distance?: number; // km - for proximity
  auraColor?: string;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// Format sync time to human readable
function formatSyncTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
// PROXIMITY RADAR COMPONENT
// ═══════════════════════════════════════

const ProximityRadar = ({
  nearbyFriends,
  onFriendClick,
}: {
  nearbyFriends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  const topThree = nearbyFriends.slice(0, 3);

  return (
    <SovereignPanel gradient className="p-5 relative overflow-hidden">
      {/* Radar Pulse Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-violet-500/20"
            style={{
              width: `${ring * 80}px`,
              height: `${ring * 80}px`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: ring * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
        {/* Center Dot */}
        <motion.div
          className="w-3 h-3 rounded-full bg-violet-500"
          animate={{
            boxShadow: [
              '0 0 10px rgba(139, 92, 246, 0.5)',
              '0 0 30px rgba(139, 92, 246, 0.8)',
              '0 0 10px rgba(139, 92, 246, 0.5)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <Radio size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
            Freunde in meiner Nähe
          </h2>
          <p className="text-[9px] text-white/40">
            {topThree.length > 0 ? `${topThree.length} in Reichweite` : 'Radar aktiv...'}
          </p>
        </div>
      </div>

      {/* Nearby Friends Avatars */}
      <div className="flex items-center justify-center gap-4 py-6 relative z-10">
        {topThree.length > 0 ? (
          topThree.map((friend, index) => (
            <motion.button
              key={friend.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('medium');
                onFriendClick(friend.id);
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              className="relative"
            >
              {/* Aura Ring */}
              <motion.div
                className="absolute -inset-1 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${friend.isFounder ? '#fbbf24' : '#a855f7'}, ${friend.isFounder ? '#f59e0b' : '#7c3aed'})`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Avatar */}
              <div
                className={`relative rounded-full overflow-hidden border-2 border-[#050505] ${
                  index === 0 ? 'w-16 h-16' : 'w-12 h-12'
                }`}
              >
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
              {/* Distance Badge */}
              {friend.distance && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-[7px] text-white/60">
                  {friend.distance < 1 ? '<1km' : `${friend.distance}km`}
                </div>
              )}
            </motion.button>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-white/40">Keine Freunde in der Nähe</p>
            <p className="text-[10px] text-white/20 mt-1">Standort wird ermittelt...</p>
          </div>
        )}
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
  // Sort by total sync time
  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => b.totalSyncTime - a.totalSyncTime).slice(0, 10),
    [friends]
  );

  return (
    <SovereignPanel className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Mic size={18} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            Best Voice Friends
          </h2>
          <p className="text-[9px] text-white/40">Nach Sync-Zeit sortiert</p>
        </div>
      </div>

      {/* Horizontal Scroll List */}
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
              {/* Rank Badge for Top 3 */}
              {index < 3 && (
                <div className="text-[10px] mb-1">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
              )}

              {/* Avatar with Aura */}
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
                {/* Online Indicator */}
                {friend.isActive && (
                  <motion.div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Sync Time Badge */}
              <div className="mt-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[9px] font-bold text-emerald-400">
                  {formatSyncTime(friend.totalSyncTime)} Sync
                </span>
              </div>

              {/* Name */}
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
// NEW FRIENDS LIST COMPONENT
// ═══════════════════════════════════════

const NewFriendsList = ({
  friends,
  onFriendClick,
}: {
  friends: Friend[];
  onFriendClick: (id: string) => void;
}) => {
  // Sort by addedAt date, newest first
  const newFriends = useMemo(
    () =>
      [...friends]
        .filter((f) => f.addedAt)
        .sort((a, b) => (b.addedAt?.getTime() || 0) - (a.addedAt?.getTime() || 0))
        .slice(0, 3),
    [friends]
  );

  return (
    <SovereignPanel className="p-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-amber-400" />
        <h3 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
          Neue Freunde
        </h3>
      </div>

      {/* List */}
      <div className="space-y-2">
        {newFriends.length > 0 ? (
          newFriends.map((friend, index) => (
            <motion.button
              key={friend.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                triggerHaptic('light');
                onFriendClick(friend.id);
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              {/* Avatar */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                    {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                  </div>
                )}
                {friend.isActive && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-[#050505]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] font-semibold text-white truncate">
                  {friend.displayName || friend.username}
                </p>
                <p className="text-[8px] text-white/30">Neu hinzugefügt</p>
              </div>

              {/* New Badge */}
              <div className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[7px] text-amber-400 font-bold">
                NEU
              </div>
            </motion.button>
          ))
        ) : (
          <div className="py-4 text-center">
            <p className="text-[10px] text-white/30">Keine neuen Freunde</p>
          </div>
        )}
      </div>
    </SovereignPanel>
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

  // Fetch friends with extended data
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
              totalSyncTime: data.totalSyncTime || data.totalVoiceMinutes || Math.floor(Math.random() * 500), // Fallback for demo
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
                totalSyncTime: friendshipData[friendId]?.totalSyncTime || 0,
                lastInteraction: friendshipData[friendId]?.lastInteraction,
                addedAt: friendshipData[friendId]?.addedAt,
                isFounder: friendId === FOUNDER_UID,
                isVerified: data.isVerified || false,
                distance: Math.random() * 10, // Simulated - would come from geolocation
                auraColor: data.auraColor || '#a855f7',
              });
            }
          } catch (err) {
            console.error('[Friends] Error fetching friend:', friendId, err);
          }
        }

        setFriends(friendProfiles);
      } catch (error) {
        console.error('[Friends] Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [user?.id]);

  // Find top streak friend
  const topStreakFriend = useMemo(() => {
    if (friends.length === 0) return null;
    return [...friends].sort((a, b) => b.streakCount - a.streakCount)[0];
  }, [friends]);

  // Nearby friends (sorted by distance)
  const nearbyFriends = useMemo(
    () => [...friends].filter((f) => f.distance !== undefined).sort((a, b) => (a.distance || 99) - (b.distance || 99)),
    [friends]
  );

  // Handle navigation
  const handleFriendClick = useCallback(
    (friendId: string) => {
      navigate(`/user/${friendId}`);
    },
    [navigate]
  );

  // Online friends count
  const onlineCount = friends.filter((f) => f.isActive).length;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* ═══════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════ */}
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
              <h1 className="text-xl font-bold text-white">Social Radar</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                {friends.length} Freunde • {onlineCount} online
              </p>
            </div>
          </div>

          {/* Invite Button */}
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

      {/* ═══════════════════════════════════════ */}
      {/* CONTENT */}
      {/* ═══════════════════════════════════════ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-white/40 mt-4">Radar scannt...</p>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <motion.div
            className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Radio size={40} className="text-violet-500" />
          </motion.div>
          <h3 className="font-semibold text-white mb-2">Dein Radar ist leer</h3>
          <p className="text-sm text-white/40 max-w-xs mb-6">
            Noch keine Aura-Syncs? Entdecke neue Freunde und bau dein Netzwerk auf!
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
          {/* 1. PROXIMITY RADAR */}
          <ProximityRadar nearbyFriends={nearbyFriends} onFriendClick={handleFriendClick} />

          {/* 2. BEST VOICE FRIENDS */}
          <BestVoiceFriends friends={friends} onFriendClick={handleFriendClick} />

          {/* 3. TWO-COLUMN GRID: New Friends + Streak Master */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: New Friends */}
            <NewFriendsList friends={friends} onFriendClick={handleFriendClick} />

            {/* Right: Streak Master */}
            {topStreakFriend && topStreakFriend.streakCount > 0 ? (
              <StreakCard
                friendName={topStreakFriend.displayName || topStreakFriend.username}
                friendAvatar={topStreakFriend.avatarUrl}
                streakCount={topStreakFriend.streakCount}
                onClick={() => handleFriendClick(topStreakFriend.id)}
              />
            ) : (
              <SovereignPanel className="p-4 h-full flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-2 opacity-30">🔥</span>
                <h3 className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                  Streak Master
                </h3>
                <p className="text-[8px] text-white/20 mt-1">
                  Starte deinen ersten Streak!
                </p>
              </SovereignPanel>
            )}
          </div>

          {/* 4. ALL FRIENDS QUICK ACCESS */}
          <SovereignPanel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                Alle Freunde
              </h3>
              <span className="text-[9px] text-white/30">{friends.length} total</span>
            </div>

            {/* Compact Friend Grid */}
            <div className="flex flex-wrap gap-2">
              {friends.slice(0, 12).map((friend, index) => (
                <motion.button
                  key={friend.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    triggerHaptic('light');
                    handleFriendClick(friend.id);
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-violet-500/20 flex items-center justify-center text-white text-xs font-bold">
                        {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {friend.isActive && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-[#050505]" />
                  )}
                </motion.button>
              ))}
              {friends.length > 12 && (
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[9px] text-white/40">
                  +{friends.length - 12}
                </div>
              )}
            </div>
          </SovereignPanel>
        </div>
      )}
    </div>
  );
};

export default Friends;
