/**
 * SOVEREIGN HOME SHOP v25.0
 * High-End Shop-Ästhetik für synclulu
 *
 * Die App fühlt sich an wie ein Katalog der Möglichkeiten,
 * der den User sofort in den aktivsten Raum zieht.
 *
 * @design Adidas Shop × Apple HIG × Sovereign Glass
 * @version 25.0.0
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  Users,
  Plus,
  MapPin,
  Zap,
  Crown,
  Bell,
  Search,
} from 'lucide-react';

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
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePreciseLocation } from '../../hooks/usePreciseLocation';

// Components
import { RoomCard } from '../SovereignUI/RoomCard';
import { PermissionOverlay } from '../PermissionOverlay';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Types
interface Room {
  id: string;
  name: string;
  category: string;
  activeUsers: number;
  distance?: number;
  hasBoost?: boolean;
  isHot?: boolean;
  emoji?: string;
  hostAvatar?: string;
  hostName?: string;
  isFounderRoom?: boolean;
  latitude?: number;
  longitude?: number;
  popularity?: number;
}

interface UserProfile {
  displayName: string;
  photoURL?: string;
  auraScore?: number;
  xp?: number;
}

// Categories for Quick-Nav
const CATEGORIES = [
  { id: 'all', label: 'ALLE', emoji: '✨' },
  { id: 'chill', label: 'CHILL', emoji: '😌' },
  { id: 'party', label: 'PARTY', emoji: '🎉' },
  { id: 'gaming', label: 'GAMING', emoji: '🎮' },
  { id: 'music', label: 'MUSIK', emoji: '🎵' },
  { id: 'study', label: 'LERNEN', emoji: '📚' },
  { id: 'dating', label: 'DATING', emoji: '💕' },
];

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// Calculate distance between two points in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ═══════════════════════════════════════════════════════════════
// HERO SECTION - "JETZT ENTDECKEN"
// ═══════════════════════════════════════════════════════════════
const HeroSection = memo(function HeroSection({
  liveCount,
  userProfile,
  onNotificationsClick,
  unreadNotifications,
}: {
  liveCount: number;
  userProfile: UserProfile | null;
  onNotificationsClick: () => void;
  unreadNotifications: number;
}) {
  return (
    <div className="relative px-5 pt-14 pb-6">
      {/* Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top Row: Greeting + Notifications */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            WILLKOMMEN ZURÜCK
          </p>
          <p className="text-lg font-bold text-white">
            {userProfile?.displayName || 'Hey'} 👋
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNotificationsClick}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Bell size={18} className="text-white/60" />
          {unreadNotifications > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Hero Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
            JETZT ENTDECKEN
          </span>
        </div>

        <h1 className="text-3xl font-black text-white leading-tight mb-3">
          FINDE DEIN
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            WÖLKCHEN
          </span>
        </h1>

        {/* Live Counter */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
            {liveCount} MENSCHEN GERADE AKTIV
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// QUICK NAV - Kategorie Navigation
// ═══════════════════════════════════════════════════════════════
const QuickNav = memo(function QuickNav({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  categoryCounts: Record<string, number>;
}) {
  return (
    <div className="px-5 mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('light');
                onSelectCategory(cat.id);
              }}
              className="flex-shrink-0 px-4 py-2 rounded-xl flex items-center gap-2"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isSelected
                  ? '1px solid rgba(139, 92, 246, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <span className="text-sm">{cat.emoji}</span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isSelected ? 'text-violet-400' : 'text-white/40'
                }`}
              >
                {cat.label}
              </span>
              {count > 0 && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-white/30'
                  }`}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// ZERO STATE - Keine Räume
// ═══════════════════════════════════════════════════════════════
const ZeroState = memo(function ZeroState({ onCreateRoom }: { onCreateRoom: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 my-8"
    >
      <div
        className="relative p-8 rounded-3xl text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.03))',
          border: '1px solid rgba(139, 92, 246, 0.15)',
        }}
      >
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 60%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Cloud Animation */}
        <motion.div
          className="text-6xl mb-4 relative z-10"
          animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          ☁️
        </motion.div>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 relative z-10">
          GERADE IST NICHTS LOS
        </p>

        <h3 className="text-xl font-bold text-white mb-2 relative z-10">
          Eröffne dein eigenes
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Wölkchen
          </span>
        </h3>

        <p className="text-xs text-white/40 mb-6 relative z-10">
          Sei der Erste und ziehe andere an!
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            triggerHaptic('medium');
            onCreateRoom();
          }}
          className="px-6 py-3 rounded-2xl font-bold text-white relative z-10 flex items-center gap-2 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Plus size={18} />
          <span className="text-sm uppercase tracking-wider">Wölkchen erstellen</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════
// ROOM MATRIX - Grid Layout
// ═══════════════════════════════════════════════════════════════
const RoomMatrix = memo(function RoomMatrix({
  rooms,
  onRoomClick,
}: {
  rooms: Room[];
  onRoomClick: (id: string) => void;
}) {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            LIVE WÖLKCHEN
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {rooms.length}
          </span>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div
        className="grid grid-cols-2 rounded-2xl overflow-hidden"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
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
});

// ═══════════════════════════════════════════════════════════════
// CREATE ROOM FAB
// ═══════════════════════════════════════════════════════════════
const CreateRoomFAB = memo(function CreateRoomFAB({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="fixed bottom-28 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-50"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
      }}
    >
      <Plus size={24} className="text-white" />
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function SovereignHomeShop() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Permission & Location
  const {
    isBlocked: permissionBlocked,
    missingPermissions,
    requestGeolocation,
    requestMicrophone,
    requestNotifications,
    openSystemSettings,
  } = usePermissionGuard();

  const { location: preciseLocation, isLoading: locationLoading } = usePreciseLocation();

  const userCoords = preciseLocation
    ? { lat: preciseLocation.latitude, lng: preciseLocation.longitude }
    : null;

  // Consent check
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('synclulu_consent_accepted') === 'true';
  });

  useEffect(() => {
    const checkConsent = () => {
      setHasConsent(localStorage.getItem('synclulu_consent_accepted') === 'true');
    };
    window.addEventListener('storage', checkConsent);
    const interval = setInterval(checkConsent, 500);
    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  // Fetch user profile
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
            auraScore: data.auraScore || 0,
            xp: data.xp || data.totalXP || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Subscribe to rooms
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const roomsData: Room[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();

          // Calculate distance if user location available
          let distance: number | undefined;
          if (userCoords && data.location?.latitude && data.location?.longitude) {
            distance = calculateDistance(
              userCoords.lat,
              userCoords.lng,
              data.location.latitude,
              data.location.longitude
            );
          }

          roomsData.push({
            id: docSnap.id,
            name: data.name || 'Unbenannt',
            category: data.category || 'chill',
            activeUsers: data.userCount || 0,
            distance,
            hasBoost: data.hasXpBoost || data.isSponsored || false,
            isHot: (data.userCount || 0) >= 10,
            emoji: data.emoji || '☁️',
            hostAvatar: data.hostAvatar,
            hostName: data.hostName || data.creatorName,
            isFounderRoom: data.creatorId === FOUNDER_UID,
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            popularity: data.totalJoins || data.userCount || 0,
          });
        });
        setRooms(roomsData);
        setLoading(false);
      },
      (error) => {
        console.log('Rooms query error:', error.code);
        setRooms([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userCoords?.lat, userCoords?.lng]);

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.id) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setUnreadNotifications(snapshot.size);
      },
      (error) => {
        console.log('Notifications query error:', error.code);
        setUnreadNotifications(0);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Filter and sort rooms
  // Priority: Nähe > Beliebtheit > XP-BOOST
  const filteredRooms = useMemo(() => {
    let result = rooms;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category.toLowerCase() === selectedCategory);
    }

    // Sort by priority: Distance first (if available), then popularity, then boost
    result = [...result].sort((a, b) => {
      // XP Boost rooms always first
      if (a.hasBoost && !b.hasBoost) return -1;
      if (!a.hasBoost && b.hasBoost) return 1;

      // Then by distance (closer = higher priority)
      if (a.distance !== undefined && b.distance !== undefined) {
        if (Math.abs(a.distance - b.distance) > 0.5) {
          return a.distance - b.distance;
        }
      }

      // Then by popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }, [rooms, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rooms.length };
    rooms.forEach((r) => {
      const cat = r.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  // Live user count
  const liveCount = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.activeUsers, 0);
  }, [rooms]);

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Hero Section */}
      <HeroSection
        liveCount={liveCount}
        userProfile={userProfile}
        onNotificationsClick={() => navigate('/notifications')}
        unreadNotifications={unreadNotifications}
      />

      {/* Quick Nav Categories */}
      <QuickNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-xs text-white/30 mt-4 uppercase tracking-wider">Lade Wölkchen...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <ZeroState onCreateRoom={() => navigate('/create-room')} />
      ) : (
        <RoomMatrix rooms={filteredRooms} onRoomClick={(id) => navigate(`/room/${id}`)} />
      )}

      {/* Create Room FAB */}
      <CreateRoomFAB onClick={() => navigate('/create-room')} />

      {/* Permission Overlay */}
      <PermissionOverlay
        isVisible={hasConsent && permissionBlocked}
        missingPermissions={missingPermissions}
        onRequestGeolocation={requestGeolocation}
        onRequestMicrophone={requestMicrophone}
        onRequestNotifications={requestNotifications}
        onOpenSettings={openSystemSettings}
      />
    </div>
  );
}
