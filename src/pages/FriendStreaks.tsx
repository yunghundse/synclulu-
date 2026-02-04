/**
 * FRIEND STREAKS PAGE - Streak Details & History
 * Complete streak information with first meeting, duration, etc.
 *
 * @design Sovereign Glass-Morphism
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from 'react';
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
  Flame,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Trophy,
  Sparkles,
  Crown,
} from 'lucide-react';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

interface FriendStreak {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isFounder?: boolean;
  streakCount: number;
  friendsSince: Date;
  firstMeetingPlace?: string;
  totalSyncTime: number;
  longestStreak: number;
  lastInteraction?: Date;
}

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// Format date to relative time
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen`;
  if (diffDays < 365) return `Vor ${Math.floor(diffDays / 30)} Monaten`;
  return `Vor ${Math.floor(diffDays / 365)} Jahren`;
}

// Format full date
function formatFullDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Get streak tier
function getStreakTier(days: number): { emoji: string; label: string; color: string } {
  if (days >= 365) return { emoji: '💎', label: 'Diamant', color: '#60a5fa' };
  if (days >= 100) return { emoji: '👑', label: 'Legende', color: '#fbbf24' };
  if (days >= 30) return { emoji: '⭐', label: 'Gold', color: '#f59e0b' };
  if (days >= 14) return { emoji: '🔥', label: 'Feuer', color: '#ef4444' };
  if (days >= 7) return { emoji: '✨', label: 'Funke', color: '#a855f7' };
  return { emoji: '🌱', label: 'Anfang', color: '#22c55e' };
}

// ═══════════════════════════════════════
// STREAK CARD COMPONENT
// ═══════════════════════════════════════

const StreakDetailCard = ({
  streak,
  index,
  onClick,
}: {
  streak: FriendStreak;
  index: number;
  onClick: () => void;
}) => {
  const tier = getStreakTier(streak.streakCount);
  const friendshipDays = Math.floor(
    (new Date().getTime() - streak.friendsSince.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      className="w-full p-4 rounded-[20px] text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Top Row: Avatar + Name + Streak */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar with Rank */}
        <div className="relative">
          {index < 3 && (
            <div className="absolute -top-2 -left-2 z-10">
              <span className="text-lg">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </span>
            </div>
          )}
          {streak.isFounder && (
            <motion.div
              className="absolute -inset-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#050505]">
            {streak.avatarUrl ? (
              <img src={streak.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-violet-500/30 flex items-center justify-center text-white font-bold text-lg">
                {(streak.displayName || streak.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name + Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate">
              {streak.displayName || streak.username}
            </span>
            {streak.isFounder && <Crown size={14} className="text-amber-400" />}
          </div>
          <p className="text-[10px] text-white/40">@{streak.username}</p>
        </div>

        {/* Streak Badge */}
        <div
          className="px-3 py-2 rounded-xl text-center"
          style={{
            background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}10)`,
            border: `1px solid ${tier.color}30`,
          }}
        >
          <div className="text-lg">{tier.emoji}</div>
          <div className="text-lg font-black" style={{ color: tier.color }}>
            {streak.streakCount}
          </div>
          <div className="text-[8px] text-white/40 uppercase">Tage</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Friends Since */}
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={12} className="text-violet-400" />
            <span className="text-[8px] text-white/40 uppercase">Freunde seit</span>
          </div>
          <p className="text-[10px] font-semibold text-white">
            {formatFullDate(streak.friendsSince)}
          </p>
          <p className="text-[8px] text-white/30">{friendshipDays} Tage</p>
        </div>

        {/* First Meeting Place */}
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={12} className="text-emerald-400" />
            <span className="text-[8px] text-white/40 uppercase">Erstes Treffen</span>
          </div>
          <p className="text-[10px] font-semibold text-white truncate">
            {streak.firstMeetingPlace || 'Unbekannt'}
          </p>
        </div>

        {/* Total Sync Time */}
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} className="text-amber-400" />
            <span className="text-[8px] text-white/40 uppercase">Sync-Zeit</span>
          </div>
          <p className="text-[10px] font-semibold text-white">
            {Math.floor(streak.totalSyncTime / 60)}h {streak.totalSyncTime % 60}m
          </p>
        </div>

        {/* Longest Streak */}
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy size={12} className="text-orange-400" />
            <span className="text-[8px] text-white/40 uppercase">Rekord</span>
          </div>
          <p className="text-[10px] font-semibold text-white">
            {streak.longestStreak} Tage
          </p>
        </div>
      </div>

      {/* Last Interaction */}
      {streak.lastInteraction && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[9px] text-white/30 text-center">
            Letzte Interaktion: {formatRelativeDate(streak.lastInteraction)}
          </p>
        </div>
      )}
    </motion.button>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

const FriendStreaks = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [streaks, setStreaks] = useState<FriendStreak[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch streak data
  useEffect(() => {
    async function fetchStreaks() {
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
        const streakData: FriendStreak[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const friendId = (data.userIds as string[]).find((id) => id !== user.id);
          if (!friendId) continue;

          try {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              const userData = friendDoc.data();
              streakData.push({
                id: friendId,
                username: userData.username || 'User',
                displayName: userData.displayName,
                avatarUrl: userData.photoURL || userData.avatarUrl,
                isFounder: friendId === FOUNDER_UID,
                streakCount: data.streakCount || 0,
                friendsSince: data.createdAt?.toDate() || new Date(),
                firstMeetingPlace: data.firstMeetingPlace || data.metAt || 'synclulu',
                totalSyncTime: data.totalSyncTime || data.totalVoiceMinutes || Math.floor(Math.random() * 1000),
                longestStreak: data.longestStreak || data.streakCount || 0,
                lastInteraction: data.lastInteraction?.toDate(),
              });
            }
          } catch (err) {
            console.error('[FriendStreaks] Error:', err);
          }
        }

        // Sort by streak count (highest first)
        streakData.sort((a, b) => b.streakCount - a.streakCount);
        setStreaks(streakData);
      } catch (error) {
        console.error('[FriendStreaks] Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreaks();
  }, [user?.id]);

  // Stats
  const totalStreaks = streaks.filter((s) => s.streakCount > 0).length;
  const totalDays = streaks.reduce((sum, s) => sum + s.streakCount, 0);
  const longestStreak = Math.max(...streaks.map((s) => s.streakCount), 0);

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
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame size={24} className="text-orange-500" />
              Freundesstreaks
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">
              Deine stärksten Verbindungen
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div
          className="grid grid-cols-3 gap-2 p-4 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.05))',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-black text-orange-400">{totalStreaks}</div>
            <div className="text-[8px] text-white/40 uppercase">Aktive Streaks</div>
          </div>
          <div className="text-center border-x border-white/5">
            <div className="text-2xl font-black text-amber-400">{totalDays}</div>
            <div className="text-[8px] text-white/40 uppercase">Gesamt Tage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-400">{longestStreak}</div>
            <div className="text-[8px] text-white/40 uppercase">Längster Streak</div>
          </div>
        </div>

        {/* Tier Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { days: 365, emoji: '💎', label: 'Diamant' },
            { days: 100, emoji: '👑', label: 'Legende' },
            { days: 30, emoji: '⭐', label: 'Gold' },
            { days: 14, emoji: '🔥', label: 'Feuer' },
            { days: 7, emoji: '✨', label: 'Funke' },
          ].map((tier) => (
            <div
              key={tier.days}
              className="px-2 py-1 rounded-lg bg-white/[0.02] flex items-center gap-1"
            >
              <span className="text-xs">{tier.emoji}</span>
              <span className="text-[8px] text-white/40">{tier.days}+</span>
            </div>
          ))}
        </div>
      </div>

      {/* STREAKS LIST */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : streaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Flame size={50} className="text-white/10 mb-4" />
            <h3 className="font-semibold text-white mb-2">Noch keine Streaks</h3>
            <p className="text-sm text-white/40 max-w-xs">
              Starte Streaks mit deinen Freunden durch tägliche Interaktionen!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {streaks.map((streak, index) => (
              <StreakDetailCard
                key={streak.id}
                streak={streak}
                index={index}
                onClick={() => navigate(`/user/${streak.id}`)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FriendStreaks;
