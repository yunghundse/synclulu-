/**
 * HomeLegacy.tsx
 * Simplified Home Page - NO LOCATION FEATURES
 *
 * Standort komplett deaktiviert - zeigt nur Rooms und Freunde
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, MessageCircle, Compass } from 'lucide-react';

// Firebase
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// Components
import { LegacyHomeHeader } from '../components/SovereignHome/LegacyHomeHeader';

// Level System
import { getLevelFromXP } from '../lib/ascensionSystem';

// ═══════════════════════════════════════════════════════════════
// ROOM CARD COMPONENT
// ═══════════════════════════════════════════════════════════════
interface RoomData {
  id: string;
  name: string;
  topic?: string;
  userCount: number;
  category?: string;
  createdAt?: any;
}

const RoomCard = ({
  room,
  onJoin
}: {
  room: RoomData;
  onJoin: (id: string) => void;
}) => {
  const activityColor = room.userCount >= 10 ? '#22c55e' :
                        room.userCount >= 5 ? '#fbbf24' : '#a855f7';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onJoin(room.id)}
      className="p-4 rounded-2xl cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {room.name}
          </h3>
          {room.topic && (
            <p className="text-xs text-white/40 truncate mt-0.5">
              {room.topic}
            </p>
          )}
        </div>

        {/* Activity Indicator */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full ml-3"
          style={{ background: `${activityColor}20` }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: activityColor }}
          />
          <span className="text-xs font-medium" style={{ color: activityColor }}>
            {room.userCount}
          </span>
        </div>
      </div>

      {room.category && (
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full text-white/50"
          style={{ background: 'rgba(168, 85, 247, 0.1)' }}
        >
          {room.category}
        </span>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
const EmptyState = ({ onCreateRoom }: { onCreateRoom: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
      style={{ background: 'rgba(168, 85, 247, 0.1)' }}
    >
      <MessageCircle size={36} className="text-violet-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">
      Noch keine Gespräche
    </h3>
    <p className="text-sm text-white/50 text-center mb-6">
      Starte das erste Gespräch und lade andere ein!
    </p>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onCreateRoom}
      className="px-6 py-3 rounded-xl font-semibold text-white"
      style={{
        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
      }}
    >
      Raum erstellen
    </motion.button>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HomeLegacy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    photoURL?: string;
    xp: number;
    isFounder: boolean;
  } | null>(null);

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [activeFriendsCount, setActiveFriendsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Level aus XP berechnen
  const levelData = useMemo(() => {
    if (!userProfile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(userProfile.xp);
  }, [userProfile?.xp]);

  const progress = useMemo(() => {
    return Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
  }, [levelData]);

  // ───────────────────────────────────────────────────────────
  // Fetch User Profile
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.id));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile({
            displayName: data.displayName || data.username || 'Anonym',
            photoURL: data.photoURL,
            xp: data.xp || data.totalXP || 0,
            isFounder: data.role === 'founder' || data.isAdmin === true,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Active Rooms
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);

    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('isActive', '==', true),
        orderBy('userCount', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(
        roomsQuery,
        (snapshot) => {
          const roomsList: RoomData[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unbenannt',
              topic: data.topic,
              userCount: data.userCount || 0,
              category: data.category,
              createdAt: data.createdAt,
            };
          });
          setRooms(roomsList);
          setIsLoading(false);
        },
        (error) => {
          console.log('Rooms query info:', error.code);
          setRooms([]);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      console.log('Rooms subscription setup failed');
      setIsLoading(false);
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleJoinRoom = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  const handleCreateRoom = useCallback(() => {
    navigate('/create-room');
  }, [navigate]);

  const handleDiscoverClick = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  // ───────────────────────────────────────────────────────────
  // Total Users Online
  // ───────────────────────────────────────────────────────────
  const totalUsersOnline = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.userCount, 0);
  }, [rooms]);

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: '#050505' }}
    >
      {/* Legacy Header - Delulu Style */}
      <LegacyHomeHeader
        user={{
          avatar: userProfile?.photoURL,
          name: userProfile?.displayName || 'Anonym',
          level: levelData.level,
          progress,
          isFounder: userProfile?.isFounder,
        }}
        activeFriendsCount={activeFriendsCount}
        nearbyCount={totalUsersOnline}
        onProfileClick={() => navigate('/profile')}
        onNearMeClick={handleDiscoverClick}
        onFriendsClick={() => navigate('/friends')}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-[180px] pb-24 px-4">
        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet-400" />
            <span className="text-sm text-white/70">
              <span className="font-semibold text-white">{totalUsersOnline}</span> online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-sm text-white/70">
              <span className="font-semibold text-white">{rooms.length}</span> aktive Räume
            </span>
          </div>
        </div>

        {/* Room List or Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState onCreateRoom={handleCreateRoom} />
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={handleJoinRoom}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button - Create Room */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCreateRoom}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
        }}
      >
        <span className="text-2xl text-white">+</span>
      </motion.button>

      {/* Discover Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDiscoverClick}
        className="fixed bottom-24 left-5 px-4 py-3 rounded-xl flex items-center gap-2 z-50"
        style={{
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <Compass size={18} className="text-violet-400" />
        <span className="text-sm font-medium text-violet-300">Entdecken</span>
      </motion.button>
    </div>
  );
}
