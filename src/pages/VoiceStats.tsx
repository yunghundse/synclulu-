/**
 * VoiceStats.tsx
 * 🎤 VOICE STATISTICS PAGE - Detailed Voice Activity History
 *
 * Shows where the user has been and how much they've spoken
 * Beautiful timeline with room visits and voice duration
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Clock,
  Cloud,
  Calendar,
  TrendingUp,
  MapPin,
  Users,
  Sparkles,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface RoomVisit {
  id: string;
  roomId: string;
  roomName: string;
  visitedAt: Date;
  duration: number; // in minutes
  participantCount?: number;
  location?: string;
}

interface DailyStats {
  date: string;
  totalMinutes: number;
  roomCount: number;
  visits: RoomVisit[];
}

interface UserVoiceStats {
  totalVoiceMinutes: number;
  roomsVisited: number;
  totalSessions: number;
  longestSession: number;
  favoriteRoom?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatVoiceTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} Min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} Std`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Heute';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Gestern';
  }
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDate(visits: RoomVisit[]): DailyStats[] {
  const grouped: { [key: string]: DailyStats } = {};

  visits.forEach((visit) => {
    const dateKey = visit.visitedAt.toDateString();
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        totalMinutes: 0,
        roomCount: 0,
        visits: [],
      };
    }
    grouped[dateKey].totalMinutes += visit.duration;
    grouped[dateKey].roomCount += 1;
    grouped[dateKey].visits.push(visit);
  });

  return Object.values(grouped).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
  >
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </motion.div>
);

const RoomVisitCard = ({
  visit,
  index,
  onRoomClick,
}: {
  visit: RoomVisit;
  index: number;
  onRoomClick: (roomId: string) => void;
}) => (
  <motion.button
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={() => onRoomClick(visit.roomId)}
    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-violet-200 transition-colors"
  >
    {/* Timeline Dot */}
    <div className="flex flex-col items-center">
      <div className="w-3 h-3 rounded-full bg-violet-500" />
      {index < 10 && <div className="w-0.5 h-8 bg-gray-200 -mb-4" />}
    </div>

    {/* Room Icon */}
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
      <Cloud size={22} className="text-violet-500" />
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0 text-left">
      <p className="text-sm font-semibold text-gray-800 truncate">{visit.roomName}</p>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={10} />
          {formatTime(visit.visitedAt)}
        </span>
        <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
          <Mic size={10} />
          {visit.duration} Min
        </span>
        {visit.participantCount && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users size={10} />
            {visit.participantCount}
          </span>
        )}
      </div>
    </div>

    <ChevronRight size={16} className="text-gray-300" />
  </motion.button>
);

const DaySection = ({
  stats,
  onRoomClick,
}: {
  stats: DailyStats;
  onRoomClick: (roomId: string) => void;
}) => (
  <div className="mb-6">
    {/* Day Header */}
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">
          {formatDate(new Date(stats.date))}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Mic size={10} className="text-violet-500" />
          {formatVoiceTime(stats.totalMinutes)}
        </span>
        <span className="flex items-center gap-1">
          <Cloud size={10} className="text-purple-500" />
          {stats.roomCount} Räume
        </span>
      </div>
    </div>

    {/* Room Visits */}
    <div className="space-y-2">
      {stats.visits.map((visit, index) => (
        <RoomVisitCard
          key={visit.id}
          visit={visit}
          index={index}
          onRoomClick={onRoomClick}
        />
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function VoiceStats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visits, setVisits] = useState<RoomVisit[]>([]);
  const [stats, setStats] = useState<UserVoiceStats>({
    totalVoiceMinutes: 0,
    roomsVisited: 0,
    totalSessions: 0,
    longestSession: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user stats
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStats({
          totalVoiceMinutes: data.totalVoiceMinutes || data.voice_minutes || 0,
          roomsVisited: data.roomsVisited || data.rooms_visited || 0,
          totalSessions: data.totalSessions || data.total_sessions || 0,
          longestSession: data.longestSession || 0,
          favoriteRoom: data.favoriteRoom,
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch room visits
  useEffect(() => {
    async function fetchVisits() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const visitsQuery = query(
          collection(db, 'room_visits'),
          where('userId', '==', user.uid),
          orderBy('visitedAt', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(visitsQuery);
        const visitsList: RoomVisit[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            roomId: data.roomId || docSnap.id,
            roomName: data.roomName || 'Unbenanntes Wölkchen',
            visitedAt: data.visitedAt?.toDate() || new Date(),
            duration: data.duration || 0,
            participantCount: data.participantCount,
            location: data.location,
          };
        });

        setVisits(visitsList);
      } catch (error) {
        console.error('Error fetching room visits:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVisits();
  }, [user?.uid]);

  // Group visits by date
  const dailyStats = useMemo(() => groupByDate(visits), [visits]);

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Voice-Statistiken</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Mic}
            value={formatVoiceTime(stats.totalVoiceMinutes)}
            label="Gesamte Voice-Zeit"
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <StatCard
            icon={Cloud}
            value={stats.roomsVisited}
            label="Besuchte Wölkchen"
            color="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.totalSessions}
            label="Sessions"
            color="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <StatCard
            icon={Timer}
            value={formatVoiceTime(stats.longestSession)}
            label="Längste Session"
            color="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>

        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="text-sm font-bold text-gray-800">Aktivitätsverlauf</h2>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && visits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"
          >
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Mic size={28} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Noch keine Aktivität
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Tritt einem Wölkchen bei, um deine Voice-Geschichte zu starten.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl"
            >
              Wölkchen entdecken
            </button>
          </motion.div>
        )}

        {/* Timeline */}
        {!isLoading && dailyStats.length > 0 && (
          <div>
            {dailyStats.map((dayStats) => (
              <DaySection
                key={dayStats.date}
                stats={dayStats}
                onRoomClick={handleRoomClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
