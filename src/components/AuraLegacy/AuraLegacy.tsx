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
import { Mic, Clock, Cloud, Sparkles, TrendingUp } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const rooms: RecentRoom[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
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

  const voiceMinutes = userStats.voice_minutes || 0;
  const roomsVisited = userStats.rooms_visited || 0;
  const totalSessions = userStats.total_sessions || 0;

  return (
    <div className="w-full mt-8 space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em]">
          Aura-Legacy
        </h3>
      </div>

      {/* Main Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 p-6 rounded-[24px]"
        style={{
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Voice Time */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Mic size={16} className="text-purple-400" />
              <span className="text-2xl font-black text-white">
                {formatVoiceTime(voiceMinutes)}
              </span>
            </div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wide">
              Voice Zeit
            </span>
            {voiceMinutes > 60 && (
              <span className="text-[9px] text-purple-400 mt-1">
                In der Nebula verbracht
              </span>
            )}
          </div>

          {/* Divider */}
          <div
            className="h-12 w-[1px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />

          {/* Rooms Visited */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <Cloud size={16} className="text-violet-400" />
              <span className="text-2xl font-black text-white">{roomsVisited}</span>
            </div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wide">
              Besuchte Wölkchen
            </span>
          </div>

          {/* Divider */}
          <div
            className="h-12 w-[1px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
          />

          {/* Sessions */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-2xl font-black text-white">{totalSessions}</span>
            </div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wide">
              Sessions
            </span>
          </div>
        </div>
      </motion.div>

      {/* Recent Rooms List */}
      {recentRooms.length > 0 && (
        <div className="mx-4 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Clock size={12} className="text-white/30" />
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-wide">
              Letzte Räume
            </span>
          </div>

          {recentRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  }}
                >
                  <Cloud size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{room.name}</p>
                  <p className="text-[10px] text-white/40">
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
          className="mx-4 p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Mic size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Noch keine Voice-Aktivität</p>
          <p className="text-[10px] text-white/20 mt-1">
            Tritt einem Wölkchen bei, um deine Aura aufzubauen
          </p>
        </motion.div>
      )}
    </div>
  );
});

AuraLegacy.displayName = 'AuraLegacy';

export default AuraLegacy;
