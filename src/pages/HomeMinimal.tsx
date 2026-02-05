/**
 * HomeMinimal.tsx
 * 🏠 SOVEREIGN HOME v41.0 - FULL VISIBILITY FIX
 *
 * FIXES v41.0:
 * - Settings button: Now visible with violet gradient + glow
 * - Notifications button: Now visible with amber gradient + glow
 * - Invite Friends button: High visibility blue gradient with border + shadow
 * - Room Create button: High visibility violet gradient with border + shadow
 * - All buttons now have proper contrast against dark background
 *
 * @version 41.0.0 - Button Visibility Fix
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
  Plus,
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
// GLASS CARD COMPONENT - REUSABLE
// ═══════════════════════════════════════════════════════════════════════════

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: string;
}> = ({ children, className = '', onClick, glow }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: glow ? `0 0 30px ${glow}` : undefined,
    }}
  >
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileCardProps {
  profile: UserProfile | null;
  isLoading: boolean;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  unreadCount: number;
}

const ProfileCard = memo(function ProfileCard({
  profile,
  isLoading,
  onProfileClick,
  onNotificationsClick,
  onSettingsClick,
  unreadCount,
}: ProfileCardProps) {
  const levelData = useMemo(() => {
    if (!profile?.xp) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const tier = useMemo(() => getAscensionTier(levelData.level), [levelData.level]);
  const progress = useMemo(() => Math.min(100, (levelData.currentXP / levelData.neededXP) * 100), [levelData]);
  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-5">
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
            className="w-14 h-14 rounded-2xl overflow-hidden relative flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
              border: `2px solid ${accentColor}60`,
              boxShadow: `0 0 25px ${accentColor}40`,
            }}
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl font-black text-white">
                  {profile?.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            {profile?.isFounder && (
              <div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 8px rgba(251, 191, 36, 0.5)' }}
              >
                <Crown size={12} className="text-black" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">
                {isLoading ? 'Laden...' : profile?.displayName || 'Willkommen'}
              </p>
              {profile?.isFounder && (
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/30 text-amber-400">
                  FOUNDER
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-white/50">Level {levelData.level}</span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-semibold" style={{ color: accentColor }}>
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
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
            }}
          >
            <Settings size={22} className="text-white" />
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
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.15))',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 2px 10px rgba(251, 191, 36, 0.2)',
            }}
          >
            <Bell size={20} className="text-white" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-red-500"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      {/* XP Progress Card */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}30` }}
            >
              <Zap size={16} style={{ color: accentColor }} />
            </div>
            <span className="text-sm font-semibold text-white">Level Fortschritt</span>
          </div>
          <span className="text-sm font-bold" style={{ color: accentColor }}>
            {levelData.currentXP} / {levelData.neededXP} XP
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-white/40 mt-2 text-center">
          Noch {levelData.neededXP - levelData.currentXP} XP bis Level {levelData.level + 1}
        </p>
      </GlassCard>
    </div>
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
}

const StatsRow = memo(function StatsRow({
  auraScore,
  friendsCount,
  streakDays,
  onFriendsClick,
}: StatsRowProps) {
  return (
    <div className="px-5 py-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Aura Score */}
        <GlassCard className="p-4 text-center" glow="rgba(251, 191, 36, 0.15)">
          <div
            className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251, 191, 36, 0.2)' }}
          >
            <Star size={20} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{auraScore || 0}</p>
          <p className="text-[11px] text-white/50 font-medium mt-1">Aura Score</p>
        </GlassCard>

        {/* Friends */}
        <GlassCard
          className="p-4 text-center"
          onClick={() => {
            triggerHaptic('light');
            onFriendsClick();
          }}
        >
          <div
            className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.2)' }}
          >
            <Users size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{friendsCount || 0}</p>
          <p className="text-[11px] text-white/50 font-medium mt-1">Freunde</p>
        </GlassCard>

        {/* Streaks */}
        <GlassCard className="p-4 text-center" glow="rgba(249, 115, 22, 0.15)">
          <div
            className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(249, 115, 22, 0.2)' }}
          >
            <Flame size={20} className="text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white">{streakDays || 0}</p>
          <p className="text-[11px] text-white/50 font-medium mt-1">Tage Streak</p>
        </GlassCard>
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
  const activityLevel = getActivityLevel(room.participants?.length || 0);
  const activityColor = getActivityColor(activityLevel);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onJoin();
      }}
      className="w-full p-4 rounded-2xl flex items-center gap-4"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Activity Indicator */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center relative flex-shrink-0"
        style={{
          background: `${activityColor}25`,
          border: `2px solid ${activityColor}50`,
        }}
      >
        <Radio size={20} style={{ color: activityColor }} />
        {(room.participants?.length || 0) > 0 && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: `2px solid ${activityColor}` }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-base font-bold text-white truncate">{room.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-white/50" />
            <span className="text-xs font-medium text-white/50">
              {room.participants?.length || 0}/{room.maxParticipants || 8}
            </span>
          </div>
          {room.participants?.some((p) => p.isSpeaking) && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Join Button */}
      <div
        className="px-4 py-2 rounded-xl"
        style={{
          background: `${activityColor}20`,
          border: `1px solid ${activityColor}40`,
        }}
      >
        <span className="text-xs font-bold" style={{ color: activityColor }}>
          Join
        </span>
      </div>
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
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <Radio size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Aktive Rooms</h2>
            {rooms.length > 0 && (
              <span className="text-xs text-emerald-400 font-medium">{rooms.length} live</span>
            )}
          </div>
        </div>

        {rooms.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              onViewAll();
            }}
            className="px-3 py-1.5 rounded-lg text-xs text-violet-400 font-bold flex items-center gap-1"
            style={{ background: 'rgba(139, 92, 246, 0.15)' }}
          >
            Alle
            <ChevronRight size={14} />
          </motion.button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <GlassCard className="p-8 text-center" glow="rgba(139, 92, 246, 0.1)">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
            }}
          >
            <Sparkles size={36} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Die Wolken sind leer</h3>
          <p className="text-sm text-white/50 mb-6">Eröffne den ersten Room und lade Freunde ein!</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium');
              onCreateRoom();
            }}
            className="px-8 py-4 rounded-xl inline-flex items-center gap-3 font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5)',
            }}
          >
            <Plus size={20} />
            Room erstellen
          </motion.button>
        </GlassCard>
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
  onCreateRoom,
}: {
  onInviteFriends: () => void;
  onCreateRoom: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">Schnellaktionen</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Invite Friends */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onInviteFriends();
          }}
          className="p-4 rounded-2xl text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(59, 130, 246, 0.20))',
            border: '2px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(59, 130, 246, 0.3))',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            <UserPlus size={20} className="text-white" />
          </div>
          <p className="text-sm font-bold text-white">Freunde einladen</p>
          <p className="text-[11px] text-blue-300/70 mt-1">+100 XP pro Einladung</p>
        </motion.button>

        {/* Create Room */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onCreateRoom();
          }}
          className="p-4 rounded-2xl text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(168, 85, 247, 0.20))',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(168, 85, 247, 0.3))',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Radio size={20} className="text-white" />
          </div>
          <p className="text-sm font-bold text-white">Room erstellen</p>
          <p className="text-[11px] text-violet-300/70 mt-1">Starte eine Session</p>
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Subscribe to user profile
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingProfile(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            displayName: data.displayName || data.username || 'Anonym',
            username: data.username || 'anonym',
            photoURL: data.photoURL || data.avatarUrl,
            xp: data.xp || data.totalXP || 0,
            auraScore: data.auraScore || data.auraRating || 0,
            isFounder: data.role === 'founder' || data.isAdmin === true || user.id === FOUNDER_UID,
            friendsCount: data.friendsCount || 0,
            streakDays: data.streakDays || data.daysActive || 0,
          });
        }
        setIsLoadingProfile(false);
      },
      (error) => {
        console.error('Profile subscription error:', error);
        setIsLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Subscribe to active rooms
  useEffect(() => {
    try {
      const unsubscribe = subscribeToActiveRooms((fetchedRooms) => {
        setRooms(fetchedRooms || []);
        setIsLoadingRooms(false);
      }, 10);

      return () => unsubscribe();
    } catch (error) {
      console.error('Rooms subscription error:', error);
      setIsLoadingRooms(false);
    }
  }, []);

  // Subscribe to notifications count
  useEffect(() => {
    if (!user?.id) return;

    try {
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
    } catch (error) {
      console.error('Notifications subscription error:', error);
    }
  }, [user?.id]);

  // Navigation handlers
  const handleProfileClick = useCallback(() => navigate('/profile'), [navigate]);
  const handleNotificationsClick = useCallback(() => navigate('/notifications'), [navigate]);
  const handleSettingsClick = useCallback(() => navigate('/settings'), [navigate]);
  const handleFriendsClick = useCallback(() => navigate('/friends'), [navigate]);
  const handleRoomJoin = useCallback((roomId: string) => navigate(`/room/${roomId}`), [navigate]);
  const handleViewAllRooms = useCallback(() => navigate('/rooms'), [navigate]);
  const handleCreateRoom = useCallback(() => navigate('/rooms?create=true'), [navigate]);
  const handleInviteFriends = useCallback(() => navigate('/invites'), [navigate]);

  return (
    <div className="min-h-screen min-h-[100dvh] pb-32" style={{ background: '#050505' }}>
      {/* Profile Card */}
      <ProfileCard
        profile={profile}
        isLoading={isLoadingProfile}
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
      />

      {/* Active Rooms */}
      <ActiveRoomsSection
        rooms={rooms}
        isLoading={isLoadingRooms}
        onRoomJoin={handleRoomJoin}
        onViewAll={handleViewAllRooms}
        onCreateRoom={handleCreateRoom}
      />

      {/* Quick Actions */}
      <QuickActions onInviteFriends={handleInviteFriends} onCreateRoom={handleCreateRoom} />
    </div>
  );
}
