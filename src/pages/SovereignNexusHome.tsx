/**
 * SovereignNexusHome.tsx
 * Grid-Logic & Unified UI - Head of Design System Edition
 *
 * Features:
 * - Unified Panel Design (Settings-Style)
 * - "Wer redet in deiner Nähe?" als Panel-Grid
 * - "Freunde aktiv" als Panel-Grid
 * - Karte als Ambient Background
 * - GPU-beschleunigte Animationen
 * - KEINE Permission-Popups!
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Zap,
  Crown,
  MessageCircle,
  Users,
  Mic,
  Radio,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Unified Panel System
import {
  UnifiedPanel,
  PanelGroup,
  TogglePanel,
  StatusPanel,
} from '../components/SovereignUI/UnifiedPanel';

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

    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
      setLocation(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

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
// HYPERSPACE ANIMATION
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
            initial={{ x: 0, y: 0, width: 2, rotate: (i * 360) / 50 }}
            animate={{
              x: [0, Math.cos((i * 360 / 50) * Math.PI / 180) * 1000],
              y: [0, Math.sin((i * 360 / 50) * Math.PI / 180) * 1000],
              width: [2, 200],
              opacity: [1, 0],
            }}
            transition={{ duration: 1.2, ease: 'easeIn', delay: i * 0.01 }}
          />
        ))}
      </div>

      <motion.div
        className="w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, transparent 70%)',
          boxShadow: '0 0 100px rgba(168, 85, 247, 0.8)',
        }}
        animate={{ scale: [1, 3, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 1.2, ease: 'easeIn' }}
      >
        <span className="text-5xl">☁️</span>
      </motion.div>

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
// ROOM PREVIEW TYPES
// ═══════════════════════════════════════════════════════════════
interface RoomPreview {
  id: string;
  name: string;
  userCount: number;
  category?: string;
  hostName?: string;
}

interface FriendPreview {
  id: string;
  displayName: string;
  photoURL?: string;
  isActive: boolean;
  currentRoom?: string;
}

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
  const [activeFriends, setActiveFriends] = useState<FriendPreview[]>([]);
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
              hostName: data.hostName,
            };
          });
          setRooms(roomsList);
        },
        () => setRooms([])
      );

      return () => unsubscribe();
    } catch {
      setRooms([]);
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Active Friends
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    try {
      const friendsQuery = query(
        collection(db, 'users'),
        where('isActive', '==', true),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        friendsQuery,
        (snapshot) => {
          const friendsList: FriendPreview[] = snapshot.docs
            .filter(d => d.id !== user.id)
            .slice(0, 5)
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                displayName: data.displayName || data.username || 'Anonym',
                photoURL: data.photoURL,
                isActive: true,
                currentRoom: data.currentRoom,
              };
            });
          setActiveFriends(friendsList);
        },
        () => setActiveFriends([])
      );

      return () => unsubscribe();
    } catch {
      setActiveFriends([]);
    }
  }, [user?.id]);

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
        await updateDoc(userRef, {
          isActive: true,
          lastActiveAt: serverTimestamp(),
          xp: increment(50),
        });
      } else {
        await updateDoc(userRef, { isActive: false });
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
      setIsActivityActive(!newState);
    }
  }, [user?.id, isActivityActive]);

  const handleQuickSync = useCallback(() => {
    if (rooms.length === 0) {
      navigate('/discover');
      return;
    }
    setIsHyperspace(true);
  }, [rooms, navigate]);

  const handleHyperspaceComplete = useCallback(() => {
    setIsHyperspace(false);
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
      className="fixed inset-0 overflow-y-auto select-none pb-28"
      style={{ background: '#050505' }}
    >
      {/* Hyperspace Overlay */}
      <AnimatePresence>
        {isHyperspace && (
          <HyperspaceOverlay isActive={isHyperspace} onComplete={handleHyperspaceComplete} />
        )}
      </AnimatePresence>

      {/* Ambient Map Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(168, 85, 247, 0.08) 0%, transparent 40%)
          `,
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 px-5 pt-12">
        {/* Location Sticker */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 ml-1"
        >
          <span className="text-[8px] font-black text-white/25 uppercase tracking-[0.25em]">
            📍 {isLoadingLocation ? 'Detecting Vibe...' : `${ipLocation?.city}, ${ipLocation?.countryCode}`}
          </span>
        </motion.div>

        {/* Profile Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-[20px] mb-5"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Avatar + Name + Progress */}
          <motion.div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {userProfile?.displayName || 'Anonym'}
                </span>
                <span
                  className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase"
                  style={{ background: `${accentColor}15`, color: accentColor }}
                >
                  {userProfile?.isFounder ? '👑' : `L${levelData.level}`}
                </span>
              </div>

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

          {/* Action Icons */}
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

        {/* ═══════════════════════════════════════════════════════
            ACTIVITY TOGGLE PANEL
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TogglePanel
            icon={<Zap size={20} />}
            iconColor={isActivityActive ? '#22c55e' : '#a855f7'}
            title={isActivityActive ? 'Du bist aktiv!' : 'Heute aktiv gehen'}
            description={isActivityActive ? '1.5x XP Multiplikator aktiv' : '+50 XP Sofortbonus'}
            isActive={isActivityActive}
            onToggle={handleActivityToggle}
          />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            WER REDET IN DEINER NÄHE?
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <PanelGroup title="Wer redet in deiner Nähe?">
            {rooms.length === 0 ? (
              <UnifiedPanel
                icon={<Radio size={20} />}
                iconColor="#6b7280"
                title="Keine aktiven Räume"
                description="Sei der Erste und erstelle einen Raum!"
                onClick={() => navigate('/create-room')}
              />
            ) : (
              rooms.slice(0, 4).map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <UnifiedPanel
                    icon={<Mic size={20} />}
                    iconColor="#a855f7"
                    title={room.name}
                    description={room.hostName ? `Host: ${room.hostName}` : room.category || 'Offener Raum'}
                    badge={room.userCount}
                    badgeColor="#22c55e"
                    onClick={() => navigate(`/room/${room.id}`)}
                    variant={index === 0 ? 'highlight' : 'default'}
                    rightContent={
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-400"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    }
                  />
                </motion.div>
              ))
            )}

            {/* Quick Sync Button */}
            {rooms.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-2"
              >
                <UnifiedPanel
                  icon={<Sparkles size={20} />}
                  iconColor="#fbbf24"
                  iconBg="rgba(251, 191, 36, 0.15)"
                  title="⚡ Quick Sync"
                  description="Zufällig in einen aktiven Raum beamen"
                  onClick={handleQuickSync}
                  variant="warning"
                  showArrow={false}
                  rightContent={
                    <motion.span
                      className="text-lg"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      ☁️
                    </motion.span>
                  }
                />
              </motion.div>
            )}
          </PanelGroup>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            FREUNDE AKTIV
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <PanelGroup title="Freunde aktiv">
            {activeFriends.length === 0 ? (
              <UnifiedPanel
                icon={<Users size={20} />}
                iconColor="#6b7280"
                title="Keine Freunde online"
                description="Lade Freunde ein oder entdecke neue Leute!"
                onClick={() => navigate('/discover')}
              />
            ) : (
              activeFriends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <StatusPanel
                    icon={
                      friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} />
                      )
                    }
                    iconColor="#22c55e"
                    title={friend.displayName}
                    description={friend.currentRoom ? `In: ${friend.currentRoom}` : 'Online'}
                    status="online"
                    onClick={() => navigate(`/chat/${friend.id}`)}
                  />
                </motion.div>
              ))
            )}

            {/* Alle Freunde Link */}
            <UnifiedPanel
              icon={<Users size={20} />}
              iconColor="#a855f7"
              title="Alle Freunde"
              description={`${activeFriends.length} online`}
              onClick={() => navigate('/friends')}
              showArrow
            />
          </PanelGroup>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            DISCOVERY CTA
            ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 mb-8"
        >
          <UnifiedPanel
            icon={
              <motion.span
                className="text-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🌍
              </motion.span>
            }
            iconColor="#a855f7"
            iconBg="linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.2))"
            title="Entdecke die Welt von synclulu"
            description="Finde neue Räume, Leute & Vibes"
            onClick={() => navigate('/discover')}
            variant="highlight"
            rightContent={
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight size={20} className="text-violet-400" />
              </motion.div>
            }
          />
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-[50]"
        style={{
          background: 'linear-gradient(to top, #050505, transparent)',
        }}
      />
    </div>
  );
}
