/**
 * SovereignNexusHome.tsx
 * The Ultimate Portal System - Sovereign CTO Edition
 *
 * Features:
 * - Advanced Legacy Header mit Standort-Sticker
 * - Portal Cloud-Center Navigation
 * - Activity Toggle für XP-Boost
 * - GPU-Rendering mit Hyper-Violet Glow
 * - Quick-Sync Random Room Beaming
 * - KEINE Permission-Popups!
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Sparkles, Zap, Search, Plus, Crown } from 'lucide-react';

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
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// Level System
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';

// ═══════════════════════════════════════════════════════════════
// IP-BASED LOCATION (No Popup!)
// ═══════════════════════════════════════════════════════════════
interface IPLocation {
  city: string;
  country: string;
  countryCode: string;
}

const useIPLocation = () => {
  const [location, setLocation] = useState<IPLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('synclulu_ip_location');
    const cacheTime = localStorage.getItem('synclulu_ip_location_time');

    // Cache für 30 Minuten
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
      setLocation(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    // IP-basierte Location holen (KEIN Popup!)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const loc: IPLocation = {
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
        };
        setLocation(loc);
        localStorage.setItem('synclulu_ip_location', JSON.stringify(loc));
        localStorage.setItem('synclulu_ip_location_time', Date.now().toString());
      })
      .catch(() => {
        setLocation({ city: 'Vibe Zone', country: 'Universe', countryCode: '🌍' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { location, isLoading };
};

// ═══════════════════════════════════════════════════════════════
// HYPERSPACE ANIMATION (Quick-Sync Teleport)
// ═══════════════════════════════════════════════════════════════
const HyperspaceOverlay = ({ isActive, onComplete }: { isActive: boolean; onComplete: () => void }) => {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: '#050505' }}
    >
      {/* Hyperspace Lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] rounded-full"
            style={{
              left: '50%',
              top: '50%',
              width: '2px',
              background: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#7c3aed' : '#fbbf24',
              boxShadow: `0 0 10px ${i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#7c3aed' : '#fbbf24'}`,
            }}
            initial={{
              x: 0,
              y: 0,
              width: 2,
              rotate: (i * 360) / 50,
            }}
            animate={{
              x: [0, Math.cos((i * 360 / 50) * Math.PI / 180) * 1000],
              y: [0, Math.sin((i * 360 / 50) * Math.PI / 180) * 1000],
              width: [2, 200],
              opacity: [1, 0],
            }}
            transition={{
              duration: 1.2,
              ease: 'easeIn',
              delay: i * 0.01,
            }}
          />
        ))}
      </div>

      {/* Center Portal */}
      <motion.div
        className="w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 70%)',
          boxShadow: '0 0 100px rgba(168, 85, 247, 0.8)',
        }}
        animate={{
          scale: [1, 3, 0],
          opacity: [1, 1, 0],
        }}
        transition={{ duration: 1.2, ease: 'easeIn' }}
      >
        <span className="text-5xl">☁️</span>
      </motion.div>

      {/* Text */}
      <motion.div
        className="absolute bottom-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-sm font-black uppercase tracking-[0.5em] text-violet-400">
          Syncing...
        </span>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY STATUS TOGGLE (XP Engine)
// ═══════════════════════════════════════════════════════════════
const ActivityToggle = ({
  isActive,
  onToggle,
  xpBonus = 50,
}: {
  isActive: boolean;
  onToggle: () => void;
  xpBonus?: number;
}) => {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className="w-full py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))'
          : 'rgba(255, 255, 255, 0.03)',
        border: isActive
          ? '1px solid rgba(34, 197, 94, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: isActive ? '0 0 30px rgba(34, 197, 94, 0.1)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="w-3 h-3 rounded-full"
          style={{
            background: isActive ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
            boxShadow: isActive ? '0 0 12px #22c55e' : 'none',
          }}
          animate={isActive ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="flex flex-col items-start">
          <span className={`text-xs font-bold ${isActive ? 'text-green-400' : 'text-white/50'}`}>
            {isActive ? 'Du bist aktiv!' : 'Heute aktiv gehen'}
          </span>
          <span className="text-[9px] text-white/30">
            {isActive ? '1.5x XP Multiplikator aktiv' : `+${xpBonus} XP Sofortbonus`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(34, 197, 94, 0.2)' }}
          >
            <Zap size={10} className="text-green-400" />
            <span className="text-[9px] font-bold text-green-400">1.5x</span>
          </motion.div>
        )}
        <div
          className={`w-10 h-5 rounded-full p-0.5 transition-all ${
            isActive ? 'bg-green-500' : 'bg-white/10'
          }`}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-white"
            animate={{ x: isActive ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════
// PORTAL CLOUD CENTER (The Heart)
// ═══════════════════════════════════════════════════════════════
const PortalCloudCenter = ({
  onSearch,
  onCreate,
  onQuickSync,
  isLoading,
}: {
  onSearch: () => void;
  onCreate: () => void;
  onQuickSync: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Portal Buttons Row */}
      <div className="flex items-center gap-6 mb-3">
        {/* Search Button */}
        <motion.button
          onClick={onSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
          style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.15)',
          }}
        >
          <Search size={20} className="text-violet-400" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-violet-400/70">
            Suchen
          </span>
        </motion.button>

        {/* Main Portal Orb */}
        <motion.button
          onClick={onQuickSync}
          disabled={isLoading}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.5), 0 0 100px rgba(168, 85, 247, 0.3), inset 0 2px 20px rgba(255, 255, 255, 0.2)',
            border: '3px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Pulsing Rings */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(168, 85, 247, 0.4)' }}
            animate={{
              scale: [1, 1.5, 1.8],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(168, 85, 247, 0.3)' }}
            animate={{
              scale: [1, 1.4, 1.7],
              opacity: [0.4, 0.2, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />

          {/* Cloud Icon */}
          <motion.span
            className="text-4xl z-10"
            animate={{
              y: [0, -3, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ☁️
          </motion.span>

          {/* Glow Effect */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 70%)',
            }}
          />
        </motion.button>

        {/* Create Button */}
        <motion.button
          onClick={onCreate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.15)',
          }}
        >
          <Plus size={20} className="text-amber-400" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400/70">
            Erstellen
          </span>
        </motion.button>
      </div>

      {/* Quick Sync Label */}
      <motion.span
        className="text-[9px] font-black uppercase tracking-[0.4em] text-violet-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ⚡ Quick Sync
      </motion.span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVE ROOMS PREVIEW
// ═══════════════════════════════════════════════════════════════
interface RoomPreview {
  id: string;
  name: string;
  userCount: number;
  category?: string;
}

const ActiveRoomsPreview = ({
  rooms,
  onRoomClick,
}: {
  rooms: RoomPreview[];
  onRoomClick: (id: string) => void;
}) => {
  if (rooms.length === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
          Aktive Wolken
        </span>
        <span className="text-[9px] font-bold text-violet-400">
          {rooms.length} live
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {rooms.slice(0, 5).map((room) => (
          <motion.button
            key={room.id}
            onClick={() => onRoomClick(room.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 px-4 py-3 rounded-xl min-w-[140px]"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#22c55e' }}
              />
              <span className="text-xs font-semibold text-white truncate">
                {room.name}
              </span>
            </div>
            <span className="text-[9px] text-white/40">
              {room.userCount} talking
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function SovereignNexusHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: ipLocation, isLoading: isLoadingLocation } = useIPLocation();

  // State
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    photoURL?: string;
    xp: number;
    isFounder: boolean;
    isActive?: boolean;
  } | null>(null);

  const [rooms, setRooms] = useState<RoomPreview[]>([]);
  const [isHyperspace, setIsHyperspace] = useState(false);
  const [isActivityActive, setIsActivityActive] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Level Berechnung
  const levelData = useMemo(() => {
    if (!userProfile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(userProfile.xp);
  }, [userProfile?.xp]);

  const progress = useMemo(() => {
    return Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
  }, [levelData]);

  const tier = useMemo(() => {
    return getAscensionTier(levelData.level);
  }, [levelData.level]);

  // Accent Colors
  const accentColor = userProfile?.isFounder ? '#fbbf24' : '#a855f7';

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
            isActive: data.isActive || false,
          });
          setIsActivityActive(data.isActive || false);
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
    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('isActive', '==', true),
        orderBy('userCount', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        roomsQuery,
        (snapshot) => {
          const roomsList: RoomPreview[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unbenannt',
              userCount: data.userCount || 0,
              category: data.category,
            };
          });
          setRooms(roomsList);
        },
        (error) => {
          console.log('Rooms query:', error.code);
          setRooms([]);
        }
      );

      return () => unsubscribe();
    } catch {
      console.log('Rooms subscription failed');
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleActivityToggle = useCallback(async () => {
    if (!user?.id) return;

    const newState = !isActivityActive;
    setIsActivityActive(newState);

    try {
      const userRef = doc(db, 'users', user.id);

      if (newState) {
        // XP Bonus geben
        await updateDoc(userRef, {
          isActive: true,
          lastActiveAt: serverTimestamp(),
          xp: increment(50), // Sofortbonus
        });
      } else {
        await updateDoc(userRef, {
          isActive: false,
        });
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
      setIsActivityActive(!newState); // Rollback
    }
  }, [user?.id, isActivityActive]);

  const handleQuickSync = useCallback(() => {
    if (rooms.length === 0) {
      navigate('/discover');
      return;
    }

    // Hyperspace Animation starten
    setIsHyperspace(true);
  }, [rooms, navigate]);

  const handleHyperspaceComplete = useCallback(() => {
    setIsHyperspace(false);

    // Random Room auswählen
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    if (randomRoom) {
      navigate(`/room/${randomRoom.id}`);
    } else {
      navigate('/discover');
    }
  }, [rooms, navigate]);

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: '#050505' }}
    >
      {/* Hyperspace Overlay */}
      <AnimatePresence>
        {isHyperspace && (
          <HyperspaceOverlay
            isActive={isHyperspace}
            onComplete={handleHyperspaceComplete}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          1. HEADER SECTION
          ═══════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-[100] px-5 pt-12">
        {/* Location Sticker */}
        <div className="mb-3 ml-1">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[8px] font-black text-white/25 uppercase tracking-[0.25em]"
          >
            📍 {isLoadingLocation ? 'Detecting Vibe...' : `${ipLocation?.city}, ${ipLocation?.countryCode}`}
          </motion.span>
        </div>

        {/* Profile Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-[20px]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Left: Avatar + Name + Progress */}
          <motion.div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar with Glow */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                  transform: 'scale(1.4)',
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="relative w-11 h-11 rounded-xl object-cover"
                  style={{
                    border: `2px solid ${accentColor}50`,
                    boxShadow: `0 0 15px ${accentColor}30`,
                  }}
                />
              ) : (
                <div
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                    border: `2px solid ${accentColor}50`,
                  }}
                >
                  <span className="text-lg font-bold text-white">
                    {(userProfile?.displayName || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Founder Crown */}
              {userProfile?.isFounder && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 2px 6px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  <Crown size={10} className="text-black" />
                </div>
              )}

              {/* Activity Dot */}
              {isActivityActive && (
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{
                    background: '#22c55e',
                    border: '2px solid #050505',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* Name + Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {userProfile?.displayName || 'Anonym'}
                </span>
                <span
                  className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase"
                  style={{
                    background: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  {userProfile?.isFounder ? '👑' : `L${levelData.level}`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${userProfile?.isFounder ? '#fde047' : '#c084fc'})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => navigate('/messages')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <Mail size={18} className="text-white/50" />
              {unreadMessages > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#ef4444' }}
                >
                  {unreadMessages}
                </span>
              )}
            </motion.button>

            <motion.button
              onClick={() => navigate('/friends')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <User size={18} className="text-white/50" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. ACTIVITY TOGGLE
          ═══════════════════════════════════════════════════════ */}
      <div className="absolute top-[165px] left-5 right-5 z-[50]">
        <ActivityToggle
          isActive={isActivityActive}
          onToggle={handleActivityToggle}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. ACTIVE ROOMS PREVIEW
          ═══════════════════════════════════════════════════════ */}
      <div className="absolute top-[240px] left-0 right-0">
        <ActiveRoomsPreview
          rooms={rooms}
          onRoomClick={(id) => navigate(`/room/${id}`)}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          4. PORTAL CLOUD CENTER
          ═══════════════════════════════════════════════════════ */}
      <div className="absolute bottom-12 left-0 right-0">
        <PortalCloudCenter
          onSearch={() => navigate('/discover')}
          onCreate={() => navigate('/create-room')}
          onQuickSync={handleQuickSync}
          isLoading={isHyperspace}
        />
      </div>

      {/* Background Ambient Glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
