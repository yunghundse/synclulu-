/**
 * AuraLegacy.tsx
 * 🌟 AURA-LEGACY MODULE - Voice History & Stats
 *
 * Shows cumulative voice time and recent room activity
 * Obsidian Glassmorphism Design
 *
 * @version 1.0.0
 */

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, Clock, Cloud, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserStats {
  voice_minutes?: number;
  rooms_visited?: number;
  total_sessions?: number;
}

interface RecentRoom {
  id: string;
  name: string;
  visitedAt: Date;
  duration: number; // in minutes
}

interface AuraLegacyProps {
  userId: string;
  userStats: UserStats;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatVoiceTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `vor ${diffMins}m`;
  }
  if (diffHours < 24) {
    return `vor ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `vor ${diffDays}d`;
  }
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraLegacy: React.FC<AuraLegacyProps> = memo(({ userId, userStats }) => {
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState<UserStats>(userStats);

  // Subscribe to realtime user stats
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLiveStats({
          voice_minutes: data.totalVoiceMinutes || data.voice_minutes || 0,
          rooms_visited: data.roomsVisited || data.rooms_visited || 0,
          total_sessions: data.totalSessions || data.total_sessions || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Fetch recent room visits
  useEffect(() => {
    async function fetchRecentRooms() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const roomVisitsQuery = query(
          collection(db, 'room_visits'),
          where('userId', '==', userId),
          orderBy('visitedAt', 'desc'),
          limit(5)
        );

        const snapshot = await getDocs(roomVisitsQuery);
        const rooms: RecentRoom[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.roomName || 'Unbenanntes Wölkchen',
            visitedAt: data.visitedAt?.toDate() || new Date(),
            duration: data.duration || 0,
          };
        });

        setRecentRooms(rooms);
      } catch (error) {
        console.error('Error fetching recent rooms:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentRooms();
  }, [userId]);

  // Use live stats if available, fallback to props
  const voiceMinutes = liveStats.voice_minutes || userStats.voice_minutes || 0;
  const roomsVisited = liveStats.rooms_visited || userStats.rooms_visited || 0;
  const totalSessions = liveStats.total_sessions || userStats.total_sessions || 0;

  return (
    <div className="w-full mb-4">
      {/* Main Stats Card - Light Theme for Profile - Clickable */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/voice-stats')}
        className="w-full glass-card rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 text-left relative overflow-hidden group"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            <h3 className="text-sm font-bold text-gray-800">Voice-Aktivität</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-violet-500 font-medium">
            <span>Details</span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Voice Time */}
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Mic size={14} className="text-violet-500" />
            </div>
            <p className="text-lg font-bold text-violet-600">
              {formatVoiceTime(voiceMinutes)}
            </p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">
              Voice Zeit
            </p>
          </div>

          {/* Rooms Visited */}
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Cloud size={14} className="text-purple-500" />
            </div>
            <p className="text-lg font-bold text-purple-600">{roomsVisited}</p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">
              Wölkchen
            </p>
          </div>

          {/* Sessions */}
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-emerald-600">{totalSessions}</p>
            <p className="text-[9px] text-gray-500 uppercase font-medium">
              Sessions
            </p>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/5 transition-colors rounded-2xl pointer-events-none" />
      </motion.button>

      {/* Recent Rooms List */}
      {recentRooms.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">
              Letzte Räume
            </span>
          </div>

          {recentRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Cloud size={16} className="text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{room.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {formatTimeAgo(room.visitedAt)} • {room.duration}m
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recentRooms.length === 0 && voiceMinutes === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-6 text-center mt-3"
        >
          <Mic size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Noch keine Voice-Aktivität</p>
          <p className="text-[10px] text-gray-400 mt-1">
            Tritt einem Wölkchen bei, um deine Aura aufzubauen
          </p>
        </motion.div>
      )}
    </div>
  );
});

AuraLegacy.displayName = 'AuraLegacy';

export default AuraLegacy;
