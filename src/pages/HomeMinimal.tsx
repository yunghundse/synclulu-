/**
 * HomeMinimal.tsx
 * 🏠 SOVEREIGN HOME v39.0 - GODMODE MINIMAL
 *
 * Minimalistisches Dashboard:
 * - User Profile Card (Level, XP, Aura)
 * - Active Rooms Section
 * - Quick Actions
 * - Clean Sovereign Glass Design
 *
 * KEINE Map, KEINE Wölkchen, KEINE alte Übersicht
 *
 * @version 39.0.0 - GODMODE Architecture
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Zap,
  Bell,
  Users,
  ChevronRight,
  Flame,
  Radio,
  Sparkles,
  TrendingUp,
  Star,
  UserPlus,
  Settings,
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { subscribeToActiveRooms, getActivityLevel, getActivityColor, type Room } from '../lib/roomServiceV2';
import { triggerHaptic } from '../lib/haptics';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserProfile {
  displayName: string;
  username: string;
  photoURL?: string;
  xp: number;
  auraScore: number;
  isFounder: boolean;
  friendsCount: number;
  streakDays: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileCardProps {
  profile: UserProfile | null;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  unreadCount: number;
}

const ProfileCard = memo(function ProfileCard({
  profile,
  onProfileClick,
  onNotificationsClick,
  onSettingsClick,
  unreadCount,
}: ProfileCardProps) {
  const levelData = useMemo(() => {
    if (!profile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const tier = useMemo(() => getAscensionTier(levelData.level), [levelData.level]);
  const progress = useMemo(() => Math.min(100, (levelData.currentXP / levelData.neededXP) * 100), [levelData]);
  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-safe pb-4"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Profile Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onProfileClick();
          }}
          className="flex items-center gap-3"
        >
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
              border: `2px solid ${accentColor}50`,
              boxShadow: `0 0 20px ${accentColor}30`,
            }}
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl font-bold text-white/70">
                  {profile?.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            {profile?.isFounder && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                <Crown size={10} className="text-black" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">{profile?.displayName || 'Willkommen'}</p>
              {profile?.isFounder && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/20 text-amber-400">
                  FOUNDER
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/40">Level {levelData.level}</span>
              <span className="text-white/20">•</span>
              <span className="text-xs" style={{ color: accentColor }}>
                {tier.badge} {tier.name}
              </span>
            </div>
          </div>
        </motion.button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Settings */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onSettingsClick();
            }}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Settings size={20} className="text-white/60" />
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onNotificationsClick();
            }}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Bell size={20} className="text-white/60" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: '#ef4444' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      {/* XP Progress */}
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: accentColor }} />
            <span className="text-xs font-medium text-white/60">Level Fortschritt</span>
          </div>
          <span className="text-xs font-bold" style={{ color: accentColor }}>
            {levelData.currentXP} / {levelData.neededXP} XP
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// STATS ROW
// ═══════════════════════════════════════════════════════════════════════════

interface StatsRowProps {
  auraScore: number;
  friendsCount: number;
  streakDays: number;
  onFriendsClick: () => void;
  onStreaksClick: () => void;
}

const StatsRow = memo(function StatsRow({
  auraScore,
  friendsCount,
  streakDays,
  onFriendsClick,
  onStreaksClick,
}: StatsRowProps) {
  return (
    <div className="px-5 py-3">
      <div className="flex gap-3">
        {/* Aura Score */}
        <div
          className="flex-1 p-4 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <Star size={18} className="mx-auto text-amber-400 mb-1" />
          <p className="text-xl font-black text-white">{auraScore || 0}</p>
          <p className="text-[10px] text-white/40 font-medium">Aura</p>
        </div>

        {/* Friends */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onFriendsClick();
          }}
          className="flex-1 p-4 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Users size={18} className="mx-auto text-blue-400 mb-1" />
          <p className="text-xl font-black text-white">{friendsCount || 0}</p>
          <p className="text-[10px] text-white/40 font-medium">Friends</p>
        </motion.button>

        {/* Streaks */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onStreaksClick();
          }}
          className="flex-1 p-4 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <Flame size={18} className="mx-auto text-orange-400 mb-1" />
          <p className="text-xl font-black text-white">{streakDays || 0}</p>
          <p className="text-[10px] text-white/40 font-medium">Streak</p>
        </motion.button>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ROOM CARD (Mini)
// ═══════════════════════════════════════════════════════════════════════════

interface RoomMiniCardProps {
  room: Room;
  onJoin: () => void;
}

const RoomMiniCard = memo(function RoomMiniCard({ room, onJoin }: RoomMiniCardProps) {
  const activityLevel = getActivityLevel(room.participants.length);
  const activityColor = getActivityColor(activityLevel);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onJoin();
      }}
      className="w-full p-4 rounded-2xl flex items-center gap-3"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Activity Indicator */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center relative"
        style={{
          background: `${activityColor}20`,
          border: `1px solid ${activityColor}40`,
        }}
      >
        <Radio size={20} style={{ color: activityColor }} />
        {room.participants.length > 0 && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: `2px solid ${activityColor}` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-white truncate">{room.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Users size={10} className="text-white/40" />
          <span className="text-xs text-white/40">
            {room.participants.length}/{room.maxParticipants}
          </span>
          {room.participants.some((p) => p.isSpeaking) && (
            <span className="text-xs text-emerald-400">• Live</span>
          )}
        </div>
      </div>

      {/* Join Arrow */}
      <ChevronRight size={16} className="text-white/30" />
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE ROOMS SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface ActiveRoomsSectionProps {
  rooms: Room[];
  isLoading: boolean;
  onRoomJoin: (roomId: string) => void;
  onViewAll: () => void;
  onCreateRoom: () => void;
}

const ActiveRoomsSection = memo(function ActiveRoomsSection({
  rooms,
  isLoading,
  onRoomJoin,
  onViewAll,
  onCreateRoom,
}: ActiveRoomsSectionProps) {
  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-violet-400" />
          <h2 className="text-base font-bold text-white">Aktive Rooms</h2>
          {rooms.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
            >
              {rooms.length} LIVE
            </span>
          )}
        </div>
        {rooms.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              onViewAll();
            }}
            className="text-xs text-violet-400 font-medium flex items-center gap-1"
          >
            Alle
            <ChevronRight size={14} />
          </motion.button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className="h-24 rounded-2xl animate-pulse"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
        />
      ) : rooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Sparkles size={28} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-white/70 mb-1">Die Wolken sind leer.</p>
          <p className="text-xs text-white/40 mb-5">Eröffne den ersten Room!</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium');
              onCreateRoom();
            }}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Radio size={16} />
            Room erstellen
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {rooms.slice(0, 3).map((room) => (
            <RoomMiniCard key={room.id} room={room} onJoin={() => onRoomJoin(room.id)} />
          ))}
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

const QuickActions = memo(function QuickActions({
  onInviteFriends,
  onViewStats,
}: {
  onInviteFriends: () => void;
  onViewStats: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onInviteFriends();
          }}
          className="flex-1 p-4 rounded-2xl flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <UserPlus size={20} className="text-blue-400" />
          <div className="text-left">
            <p className="text-sm font-bold text-white">Freunde einladen</p>
            <p className="text-[10px] text-white/40">+100 XP pro Einladung</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onViewStats();
          }}
          className="p-4 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <TrendingUp size={20} className="text-white/60" />
        </motion.button>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function HomeMinimal() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to user profile
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          displayName: data.displayName || data.username || 'Anonym',
          username: data.username || 'anonym',
          photoURL: data.photoURL,
          xp: data.xp || data.totalXP || 0,
          auraScore: data.auraScore || 0,
          isFounder: data.role === 'founder' || data.isAdmin === true || user.id === FOUNDER_UID,
          friendsCount: data.friendsCount || 0,
          streakDays: data.streakDays || data.daysActive || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Subscribe to active rooms
  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
      setIsLoading(false);
    }, 10);

    return () => unsubscribe();
  }, []);

  // Subscribe to notifications count
  useEffect(() => {
    if (!user?.id) return;

    const notificationsQuery = query(
      collection(db, 'users', user.id, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Navigation handlers
  const handleProfileClick = useCallback(() => navigate('/profile'), [navigate]);
  const handleNotificationsClick = useCallback(() => navigate('/notifications'), [navigate]);
  const handleSettingsClick = useCallback(() => navigate('/settings'), [navigate]);
  const handleFriendsClick = useCallback(() => navigate('/friends'), [navigate]);
  const handleStreaksClick = useCallback(() => navigate('/streaks'), [navigate]);
  const handleRoomJoin = useCallback((roomId: string) => navigate(`/room/${roomId}`), [navigate]);
  const handleViewAllRooms = useCallback(() => navigate('/rooms'), [navigate]);
  const handleCreateRoom = useCallback(() => navigate('/rooms?create=true'), [navigate]);
  const handleInviteFriends = useCallback(() => navigate('/invites'), [navigate]);
  const handleViewStats = useCallback(() => navigate('/statistics'), [navigate]);

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Profile Card */}
      <ProfileCard
        profile={profile}
        onProfileClick={handleProfileClick}
        onNotificationsClick={handleNotificationsClick}
        onSettingsClick={handleSettingsClick}
        unreadCount={unreadNotifications}
      />

      {/* Stats Row */}
      <StatsRow
        auraScore={profile?.auraScore || 0}
        friendsCount={profile?.friendsCount || 0}
        streakDays={profile?.streakDays || 0}
        onFriendsClick={handleFriendsClick}
        onStreaksClick={handleStreaksClick}
      />

      {/* Active Rooms */}
      <ActiveRoomsSection
        rooms={rooms}
        isLoading={isLoading}
        onRoomJoin={handleRoomJoin}
        onViewAll={handleViewAllRooms}
        onCreateRoom={handleCreateRoom}
      />

      {/* Quick Actions */}
      <QuickActions onInviteFriends={handleInviteFriends} onViewStats={handleViewStats} />
    </div>
  );
}
