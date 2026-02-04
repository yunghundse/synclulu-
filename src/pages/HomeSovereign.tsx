/**
 * HomeSovereign.tsx
 * 🏠 SOVEREIGN HOME - Profile-Mirror Edition
 *
 * Features:
 * - Banner & Profilbild von /profile übernommen
 * - Banner NICHT editierbar (kein Kamera-Icon)
 * - Level-Button mit Glass-Morphism (ersetzt Bearbeiten-Button)
 * - Founder-Glow: Goldener pulsierender Effekt
 * - XP-Overlay bei Klick auf Level-Button
 * - Shop-Grid für Wölkchen darunter
 *
 * @version 26.0.0 - Profile-Mirror Edition
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Zap,
  Star,
  Sparkles,
  Bell,
  Users,
  Plus,
  ChevronRight,
  X,
  Trophy,
  Target,
  Flame,
  Camera,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { RoomCard } from '../components/SovereignUI/RoomCard';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfileData {
  displayName: string;
  username: string;
  photoURL?: string;
  bannerURL?: string;
  statusEmoji?: string;
  statusEmojiTimestamp?: number;
  xp: number;
  isFounder: boolean;
}

interface Room {
  id: string;
  name: string;
  category: string;
  activeUsers: number;
  distance?: number;
  hasBoost?: boolean;
  isHot?: boolean;
  emoji?: string;
  hostName?: string;
  isFounderRoom?: boolean;
}

const MILESTONES = [
  { level: 5, title: 'Newcomer', icon: '🌱', reward: 'Erste Aura freigeschaltet' },
  { level: 10, title: 'Explorer', icon: '🧭', reward: 'Custom Status' },
  { level: 25, title: 'Connector', icon: '🔗', reward: 'Premium Badge' },
  { level: 50, title: 'Influencer', icon: '⭐', reward: 'Exklusive Aura' },
  { level: 100, title: 'Legend', icon: '👑', reward: 'Founder-Status Vorteile' },
];

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════
// HEADER BANNER (Read-Only auf Home)
// ═══════════════════════════════════════════════════════════════

const HeaderBanner = ({ bannerURL }: { bannerURL?: string }) => {
  return (
    <div className="relative h-44 w-full overflow-hidden">
      {bannerURL ? (
        <img src={bannerURL} alt="Banner" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #0d0518 100%)' }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)' }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to top, #050505, transparent)' }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE AVATAR (Editierbar auf Home)
// ═══════════════════════════════════════════════════════════════

const ProfileAvatar = ({
  photoURL,
  displayName,
  isFounder,
  statusEmoji,
  onAvatarUpload,
}: {
  photoURL?: string;
  displayName: string;
  isFounder: boolean;
  statusEmoji?: string;
  onAvatarUpload: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

  return (
    <div className="relative -mt-16 ml-5">
      <motion.div
        className="relative w-24 h-24 rounded-full overflow-hidden"
        style={{ border: `4px solid #050505`, boxShadow: `0 0 30px ${accentColor}40` }}
      >
        <motion.div
          className="absolute -inset-1 rounded-full"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative w-full h-full rounded-full overflow-hidden z-10" style={{ background: '#050505' }}>
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
            >
              <span className="text-3xl font-black text-white/80">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        {/* Avatar Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onAvatarUpload(e.target.files[0])}
          className="hidden"
        />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center z-20"
          style={{ background: accentColor, boxShadow: `0 2px 10px ${accentColor}50` }}
        >
          <Camera size={12} className="text-black" />
        </motion.button>
      </motion.div>
      {isFounder && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center z-30"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)' }}
        >
          <Crown size={14} className="text-black" />
        </motion.div>
      )}
      {statusEmoji && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center z-30"
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '2px solid #a855f7',
          }}
        >
          <span className="text-lg">{statusEmoji}</span>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEVEL BUTTON (Glass-Morphism)
// ═══════════════════════════════════════════════════════════════

const LevelButton = ({
  level,
  isFounder,
  onClick,
}: {
  level: number;
  isFounder: boolean;
  onClick: () => void;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="relative px-5 py-2.5 rounded-2xl flex items-center gap-2 overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${accentColor}40`,
        boxShadow: isFounder ? `0 0 25px ${accentColor}30` : 'none',
      }}
    >
      {/* Founder Pulsing Glow */}
      {isFounder && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, transparent)`,
            boxShadow: `inset 0 0 20px ${accentColor}20`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <Zap size={16} className={isFounder ? 'text-amber-400' : 'text-violet-400'} />
      <span
        className="text-sm font-black tracking-wider relative z-10"
        style={{ color: accentColor }}
      >
        LVL {level}
      </span>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════
// XP OVERLAY MODAL
// ═══════════════════════════════════════════════════════════════

const XPOverlay = ({
  isOpen,
  onClose,
  level,
  currentXP,
  neededXP,
  totalXP,
  isFounder,
}: {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  currentXP: number;
  neededXP: number;
  totalXP: number;
  isFounder: boolean;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';
  const progress = Math.min(100, (currentXP / neededXP) * 100);
  const tier = getAscensionTier(level);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-lg rounded-t-[32px] p-6 pb-10"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 20, 50, 0.98), rgba(10, 5, 20, 0.98))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderBottom: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                    border: `2px solid ${accentColor}`,
                  }}
                  animate={isFounder ? { boxShadow: [`0 0 20px ${accentColor}40`, `0 0 40px ${accentColor}60`, `0 0 20px ${accentColor}40`] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl font-black" style={{ color: accentColor }}>
                    {level}
                  </span>
                </motion.div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Dein Level</p>
                  <p className="text-lg font-bold text-white">{tier.name}</p>
                </div>
              </div>
              <button onClick={onClose}>
                <X size={24} className="text-white/40" />
              </button>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Fortschritt zu Level {level + 1}</span>
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                  {currentXP} / {neededXP} XP
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})`,
                    boxShadow: `0 0 15px ${accentColor}50`,
                  }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                Gesamt: {totalXP.toLocaleString()} XP gesammelt
              </p>
            </div>

            {/* Milestones */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Nächste Meilensteine</p>
              <div className="space-y-2">
                {MILESTONES.filter((m) => m.level > level).slice(0, 3).map((milestone) => (
                  <div
                    key={milestone.level}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <span className="text-2xl">{milestone.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        Level {milestone.level} - {milestone.title}
                      </p>
                      <p className="text-xs text-white/40">{milestone.reward}</p>
                    </div>
                    <div
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      {milestone.level - level} LVL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOM GRID
// ═══════════════════════════════════════════════════════════════

const RoomGrid = ({
  rooms,
  onRoomClick,
  onCreateRoom,
}: {
  rooms: Room[];
  onRoomClick: (id: string) => void;
  onCreateRoom: () => void;
}) => {
  if (rooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 my-6"
      >
        <div
          className="relative p-8 rounded-3xl text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.03))',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ☁️
          </motion.div>
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2">
            Gerade ist nichts los
          </p>
          <h3 className="text-lg font-bold text-white mb-4">
            Eröffne dein eigenes Wölkchen
          </h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateRoom}
            className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Plus size={18} />
            <span>Wölkchen erstellen</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Live Wölkchen
        </span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {rooms.length}
        </span>
      </div>
      <div
        className="grid grid-cols-2 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        {rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onClick={() => onRoomClick(room.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function HomeSovereign() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showXPOverlay, setShowXPOverlay] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Level calculation
  const levelData = useMemo(() => {
    if (!profile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  // ───────────────────────────────────────────────────────────
  // Fetch Profile
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.id));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            displayName: data.displayName || data.username || 'Anonym',
            username: data.username || '',
            photoURL: data.photoURL,
            bannerURL: data.bannerURL,
            statusEmoji: data.statusEmoji,
            statusEmojiTimestamp: data.statusEmojiTimestamp,
            xp: data.xp || data.totalXP || 0,
            isFounder: user.id === FOUNDER_UID || data.role === 'founder' || data.isAdmin === true,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Rooms
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const roomsList: Room[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Unbenannt',
            category: data.category || 'chill',
            activeUsers: data.userCount || 0,
            hasBoost: data.hasXpBoost || data.isSponsored || false,
            isHot: (data.userCount || 0) >= 10,
            emoji: data.emoji || '☁️',
            hostName: data.hostName || data.creatorName,
            isFounderRoom: data.creatorId === FOUNDER_UID,
          };
        });
        setRooms(roomsList);
      },
      () => setRooms([])
    );

    return () => unsubscribe();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Notifications
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => setUnreadNotifications(snapshot.size),
      () => setUnreadNotifications(0)
    );

    return () => unsubscribe();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user?.id) return;

    try {
      const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.id), { photoURL: url });
      setProfile((prev) => prev ? { ...prev, photoURL: url } : null);
      triggerHaptic('medium');
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Banner (Read-Only) */}
      <HeaderBanner bannerURL={profile?.bannerURL} />

      {/* Profile Row */}
      <div className="flex items-end justify-between pr-5">
        <ProfileAvatar
          photoURL={profile?.photoURL}
          displayName={profile?.displayName || 'Anonym'}
          isFounder={profile?.isFounder || false}
          statusEmoji={profile?.statusEmoji}
          onAvatarUpload={handleAvatarUpload}
        />

        <div className="flex items-center gap-2 -mt-6">
          {/* Notifications */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Bell size={18} className="text-white/60" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </div>
            )}
          </motion.button>

          {/* Level Button */}
          <LevelButton
            level={levelData.level}
            isFounder={profile?.isFounder || false}
            onClick={() => setShowXPOverlay(true)}
          />
        </div>
      </div>

      {/* Name & Username */}
      <div className="px-5 mt-4 mb-2">
        <h1 className="text-xl font-bold text-white">{profile?.displayName || 'Anonym'}</h1>
        {profile?.username && (
          <p className="text-sm text-white/40">@{profile.username}</p>
        )}
      </div>

      {/* Live Counter */}
      <div className="px-5 mb-4">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            {rooms.reduce((sum, r) => sum + r.activeUsers, 0)} Menschen gerade aktiv
          </span>
        </motion.div>
      </div>

      {/* Room Grid */}
      <RoomGrid
        rooms={rooms}
        onRoomClick={(id) => navigate(`/room/${id}`)}
        onCreateRoom={() => navigate('/create-room')}
      />

      {/* Create Room FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          triggerHaptic('medium');
          navigate('/create-room');
        }}
        className="fixed bottom-28 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-50"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${profile?.isFounder ? '#fde047' : '#c084fc'})`,
          boxShadow: `0 8px 32px ${accentColor}40`,
        }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* XP Overlay */}
      <XPOverlay
        isOpen={showXPOverlay}
        onClose={() => setShowXPOverlay(false)}
        level={levelData.level}
        currentXP={levelData.currentXP}
        neededXP={levelData.neededXP}
        totalXP={profile?.xp || 0}
        isFounder={profile?.isFounder || false}
      />
    </div>
  );
}
