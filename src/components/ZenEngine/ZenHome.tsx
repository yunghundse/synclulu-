/**
 * ZenHome.tsx
 * SERENE COMMAND CENTER - Apple + Bose Aesthetic
 *
 * Extreme visuelle Ruhe kombiniert mit süchtigem Fortschritt.
 * - 50% langsamere Animationen
 * - Definierter, eleganter Orb (70-80px)
 * - Midnight-OLED Palette
 * - Aura-Level Fortschrittssystem
 * - Floating Dock Navigation
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Firebase
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { usePreciseLocation } from '../../hooks/usePreciseLocation';

// Components
import { NebulaMap, MapHotspot } from '../NebulaMap';

// ═══════════════════════════════════════════════════════════════
// ZEN ANIMATION CONFIG - 50% Slower, Ultra-Smooth
// ═══════════════════════════════════════════════════════════════
const ZEN_SPRING = {
  type: 'spring',
  stiffness: 100,  // Reduced from 200
  damping: 20,     // Increased for smoothness
  mass: 1.2,       // Heavier = slower
};

const ZEN_TRANSITION = {
  duration: 1.2,   // 50% slower than normal 0.8s
  ease: [0.25, 0.1, 0.25, 1], // Ultra-smooth easing
};

// ═══════════════════════════════════════════════════════════════
// AURA PROGRESS RING - The Addiction Engine
// ═══════════════════════════════════════════════════════════════
interface AuraProgressProps {
  progress: number; // 0-100
  level: number;
  avatarUrl?: string;
  displayName?: string;
  onProfileClick: () => void;
  isLevelingUp?: boolean;
}

const AuraProgressRing = memo(function AuraProgressRing({
  progress,
  level,
  avatarUrl,
  displayName,
  onProfileClick,
  isLevelingUp = false,
}: AuraProgressProps) {
  const circumference = 2 * Math.PI * 26; // r=26
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <motion.button
      onClick={onProfileClick}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={ZEN_TRANSITION}
    >
      {/* Avatar Container with Progress Ring */}
      <div className="relative w-14 h-14">
        {/* Background Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="2"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="url(#auraGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Avatar */}
        <div className="absolute inset-2 w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/20 to-purple-600/20">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-medium text-white/60">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Level-Up Golden Shimmer */}
        <AnimatePresence>
          {isLevelingUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 2 }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Level Info */}
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
          Aura Level
        </span>
        <span className="text-xs font-semibold text-white/80">
          Lvl {level}
        </span>
      </div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// DEFINED CLOUD ORB - Elegant Glass, No Glow Noise
// ═══════════════════════════════════════════════════════════════
interface ZenOrbProps {
  onTap: () => void;
  label?: string;
}

const ZenCloudOrb = memo(function ZenCloudOrb({ onTap, label = 'Entdecken' }: ZenOrbProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={ZEN_SPRING}
        className="relative w-20 h-20 flex items-center justify-center"
      >
        {/* Subtle Ambient Glow - Very Soft */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6, // Very slow breathing
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Glass Orb with Sharp Border */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 0 0 1px rgba(255, 255, 255, 0.02) inset,
              0 20px 40px -10px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          {/* Inner Icon */}
          <motion.span
            className="text-2xl"
            style={{ opacity: 0.7 }}
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            ☁️
          </motion.span>
        </div>
      </motion.button>

      {/* Label */}
      <motion.span
        className="text-[10px] font-medium text-white/30 uppercase tracking-[0.15em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {label}
      </motion.span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// FLOATING DOCK - iPad-Style Minimal Navigation
// ═══════════════════════════════════════════════════════════════
interface FloatingDockProps {
  activeTab: 'map' | 'messages' | 'friends' | 'profile';
  unreadMessages?: number;
  onNavigate: (tab: 'map' | 'messages' | 'friends' | 'profile') => void;
}

const FloatingDock = memo(function FloatingDock({
  activeTab,
  unreadMessages = 0,
  onNavigate,
}: FloatingDockProps) {
  const tabs = [
    { id: 'map' as const, icon: '🗺️', label: 'Karte' },
    { id: 'messages' as const, icon: '💬', label: 'Chat', badge: unreadMessages },
    { id: 'friends' as const, icon: '👥', label: 'Freunde' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ZEN_TRANSITION, delay: 0.3 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
    >
      <div
        className="px-8 py-4 flex items-center gap-12 rounded-full"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.6)',
        }}
      >
        {tabs.map((tab) => (
          <DockIcon
            key={tab.id}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            badge={tab.badge}
            onClick={() => onNavigate(tab.id)}
          />
        ))}
      </div>
    </motion.div>
  );
});

interface DockIconProps {
  icon: string;
  isActive: boolean;
  badge?: number;
  onClick: () => void;
}

const DockIcon = memo(function DockIcon({ icon, isActive, badge, onClick }: DockIconProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      transition={ZEN_SPRING}
      className="relative"
    >
      <motion.span
        className="text-xl block"
        animate={{
          opacity: isActive ? 1 : 0.3,
          scale: isActive ? 1.1 : 1,
        }}
        transition={ZEN_SPRING}
      >
        {icon}
      </motion.span>

      {/* Badge */}
      {badge && badge > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-violet-500/80 flex items-center justify-center px-1"
        >
          <span className="text-[8px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        </motion.div>
      )}

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="dockIndicator"
          className="absolute -bottom-2 left-1/2 w-1 h-1 rounded-full bg-white/40"
          style={{ transform: 'translateX(-50%)' }}
        />
      )}
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN ZEN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════
interface UserProfile {
  displayName: string;
  photoURL?: string;
  auraScore?: number;
  auraLevel?: number;
  auraProgress?: number;
}

interface Hotspot {
  id: string;
  name: string;
  userCount: number;
  activityLevel: 'ruhig' | 'aktiv' | 'sehr_aktiv' | 'hot';
}

export default function ZenHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mapHotspots, setMapHotspots] = useState<MapHotspot[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'messages' | 'friends' | 'profile'>('map');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [selectedMapHotspot, setSelectedMapHotspot] = useState<string | null>(null);

  // Location
  const { location: preciseLocation, isLoading: locationLoading } = usePreciseLocation();
  const userCoords = preciseLocation
    ? { lat: preciseLocation.latitude, lng: preciseLocation.longitude }
    : null;

  // Calculate aura progress (0-100 within current level)
  const auraProgress = useMemo(() => {
    const score = userProfile?.auraScore || 0;
    const level = Math.floor(score / 100) + 1;
    const progressInLevel = score % 100;
    return progressInLevel;
  }, [userProfile?.auraScore]);

  const auraLevel = useMemo(() => {
    const score = userProfile?.auraScore || 0;
    return Math.floor(score / 100) + 1;
  }, [userProfile?.auraScore]);

  // Fetch user profile
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newScore = data.auraScore || 0;
        const oldLevel = userProfile?.auraLevel || 1;
        const newLevel = Math.floor(newScore / 100) + 1;

        // Trigger level-up animation
        if (newLevel > oldLevel && oldLevel > 0) {
          setIsLevelingUp(true);
          setTimeout(() => setIsLevelingUp(false), 2000);
        }

        setUserProfile({
          displayName: data.displayName || data.username || 'Anonym',
          photoURL: data.photoURL,
          auraScore: newScore,
          auraLevel: newLevel,
          auraProgress: newScore % 100,
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to rooms for map
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms: MapHotspot[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.location?.latitude && data.location?.longitude) {
          rooms.push({
            id: doc.id,
            name: data.name || 'Unbenannt',
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            userCount: data.userCount || 0,
            activityLevel: getActivityLevel(data.userCount || 0),
            category: data.category,
          });
        }
      });
      setMapHotspots(rooms);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to unread messages
  useEffect(() => {
    if (!user?.uid) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setUnreadMessages(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Handlers
  const handleNavigate = useCallback((tab: 'map' | 'messages' | 'friends' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'messages') navigate('/messages');
    if (tab === 'friends') navigate('/friends');
    if (tab === 'profile') navigate('/profile');
  }, [navigate]);

  const handleDiscover = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #030305 0%, #050508 50%, #030305 100%)',
      }}
    >
      {/* Subtle Indigo Ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)',
        }}
      />

      {/* ═══════════════════════════════════════ */}
      {/* AURA PROGRESS (Top Left) */}
      {/* ═══════════════════════════════════════ */}
      <div className="absolute top-8 left-6 z-[100]">
        <AuraProgressRing
          progress={auraProgress}
          level={auraLevel}
          avatarUrl={userProfile?.photoURL}
          displayName={userProfile?.displayName}
          onProfileClick={() => navigate('/profile')}
          isLevelingUp={isLevelingUp}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* NEBULA MAP (Midnight-OLED Style) */}
      {/* ═══════════════════════════════════════ */}
      <div className="absolute inset-0 pt-24 pb-28">
        <NebulaMap
          userLocation={userCoords}
          hotspots={mapHotspots}
          selectedHotspotId={selectedMapHotspot}
          onHotspotSelect={setSelectedMapHotspot}
          onHotspotJoin={(id) => navigate(`/room/${id}`)}
          maxDistance={2000}
          isLoading={locationLoading && !userCoords}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ZEN CLOUD ORB (Center) */}
      {/* ═══════════════════════════════════════ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <ZenCloudOrb onTap={handleDiscover} />
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* FLOATING DOCK (Bottom) */}
      {/* ═══════════════════════════════════════ */}
      <FloatingDock
        activeTab={activeTab}
        unreadMessages={unreadMessages}
        onNavigate={handleNavigate}
      />

      {/* Level-Up Golden Particles */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-[200]"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-amber-400"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -50],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility
const getActivityLevel = (userCount: number): MapHotspot['activityLevel'] => {
  if (userCount >= 20) return 'hot';
  if (userCount >= 10) return 'sehr_aktiv';
  if (userCount >= 5) return 'aktiv';
  return 'ruhig';
};
