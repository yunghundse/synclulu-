/**
 * SovereignHomeV3.tsx
 * NEBULA COMMAND CENTER - The Ultimate Home Dashboard
 * A high-end modular dashboard with Obsidian Glassmorphism styling
 *
 * Features:
 * - Smart Location Badge with dynamic vibe level
 * - Rising Stars carousel (trending creators)
 * - Hotspot Radar with live activity indicators
 * - Pathfinder Service for smart suggestions
 * - Orbital Menu for seamless navigation
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Settings,
  Plus,
  Sparkles,
  Shield,
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

// Components
import { SmartLocationBadge } from './SmartLocationBadge';
import { RisingStars, RisingStar } from './RisingStars';
import { HotspotRadar, Hotspot } from './HotspotRadar';
import { PathfinderService, PathfinderSuggestion } from './PathfinderService';
import { OrbitalMenu } from './OrbitalMenu';

// Types
interface UserProfile {
  displayName: string;
  photoURL?: string;
  trustScore?: number;
  auraScore?: number;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  userCount: number;
  maxUsers?: number;
  category?: string;
  creatorId: string;
  createdAt: Date;
  isActive: boolean;
}

// Utility functions
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const getActivityLevel = (userCount: number): Hotspot['activityLevel'] => {
  if (userCount >= 20) return 'hot';
  if (userCount >= 10) return 'sehr_aktiv';
  if (userCount >= 5) return 'aktiv';
  return 'ruhig';
};

const getVibeLevel = (
  hotspotCount: number,
  avgActivity: number
): 'niedrig' | 'mittel' | 'hoch' | 'extrem' => {
  const score = hotspotCount * 2 + avgActivity;
  if (score >= 50) return 'extrem';
  if (score >= 30) return 'hoch';
  if (score >= 15) return 'mittel';
  return 'niedrig';
};

// Header Component
const CommandHeader = memo(function CommandHeader({
  userProfile,
  unreadNotifications,
  unreadMessages,
  currentLocation,
  vibeLevel,
  nearestHotspot,
  onProfileClick,
  onNotificationsClick,
  onMessagesClick,
}: {
  userProfile: UserProfile | null;
  unreadNotifications: number;
  unreadMessages: number;
  currentLocation?: string;
  vibeLevel: 'niedrig' | 'mittel' | 'hoch' | 'extrem';
  nearestHotspot?: { name: string; distance: number };
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onMessagesClick: () => void;
}) {
  return (
    <div className="relative px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        {/* Left: Profile + Location Badge */}
        <div className="flex items-center gap-3">
          {/* Profile Avatar with Trust Ring */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onProfileClick}
            className="relative"
          >
            {/* Trust Ring */}
            <svg
              className="absolute -inset-1 w-[52px] h-[52px]"
              viewBox="0 0 52 52"
            >
              <circle
                cx="26"
                cy="26"
                r="24"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <motion.circle
                cx="26"
                cy="26"
                r="24"
                fill="none"
                stroke="url(#trustGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${(userProfile?.trustScore || 0) * 1.5} 150`}
                initial={{ strokeDashoffset: 150 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white">
                  {userProfile?.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Trust Badge */}
            {(userProfile?.trustScore || 0) >= 80 && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <Shield size={10} className="text-white" />
              </div>
            )}
          </motion.button>

          {/* Smart Location Badge */}
          <SmartLocationBadge
            currentLocation={currentLocation}
            vibeLevel={vibeLevel}
            nearestHotspot={nearestHotspot}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onNotificationsClick}
            className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <Bell size={18} className="text-white/70" />
            {unreadNotifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 flex items-center justify-center px-1"
              >
                <span className="text-[9px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </motion.div>
            )}
          </motion.button>

          {/* Messages */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onMessagesClick}
            className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <MessageCircle size={18} className="text-white/70" />
            {unreadMessages > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-violet-500 flex items-center justify-center px-1"
              >
                <span className="text-[9px] font-bold text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
});

// Quick Action Button
const QuickActionOrb = memo(function QuickActionOrb({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40"
    >
      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-violet-500"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Button */}
      <div
        className="relative w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center"
        style={{
          boxShadow: '0 4px 30px rgba(139, 92, 246, 0.5)',
        }}
      >
        <Plus size={24} className="text-white" />
      </div>
    </motion.button>
  );
});

// Main Component
export default function SovereignHomeV3() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [risingStars, setRisingStars] = useState<RisingStar[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [suggestions, setSuggestions] = useState<PathfinderSuggestion[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<string>('Berlin');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Calculate vibe level based on hotspots
  const vibeLevel = useMemo(() => {
    if (hotspots.length === 0) return 'niedrig';
    const avgActivity =
      hotspots.reduce((sum, h) => sum + h.userCount, 0) / hotspots.length;
    return getVibeLevel(hotspots.length, avgActivity);
  }, [hotspots]);

  // Nearest hotspot
  const nearestHotspot = useMemo(() => {
    if (hotspots.length === 0) return undefined;
    const nearest = hotspots.reduce((prev, curr) =>
      curr.distance < prev.distance ? curr : prev
    );
    return { name: nearest.name, distance: nearest.distance };
  }, [hotspots]);

  // Fetch user profile
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile({
            displayName: data.displayName || data.username || 'Anonym',
            photoURL: data.photoURL,
            trustScore: data.trustScore || 50,
            auraScore: data.auraScore || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.uid]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Subscribe to active rooms (hotspots)
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const rooms: Hotspot[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const distance = userCoords && data.location
          ? calculateDistance(
              userCoords.lat,
              userCoords.lng,
              data.location.latitude,
              data.location.longitude
            )
          : Math.random() * 2000 + 100; // Fallback random distance

        return {
          id: doc.id,
          name: data.name || 'Unbenannt',
          description: data.description,
          distance: Math.round(distance),
          userCount: data.userCount || 0,
          maxUsers: data.maxUsers,
          activityLevel: getActivityLevel(data.userCount || 0),
          category: data.category,
          creatorName: data.creatorName,
          isNew: data.createdAt?.toDate() > new Date(Date.now() - 3600000), // New if < 1 hour
        };
      });

      // Sort by distance
      rooms.sort((a, b) => a.distance - b.distance);
      setHotspots(rooms);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userCoords]);

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

  // Subscribe to notifications
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Generate mock rising stars (would be real API in production)
  useEffect(() => {
    // Simulate trending creators
    const mockStars: RisingStar[] = [
      {
        id: '1',
        username: 'vibemaster',
        displayName: 'VibeMaster',
        auraScore: 12500,
        auraChange: 47,
        rank: 1,
        isCrown: true,
      },
      {
        id: '2',
        username: 'cloudqueen',
        displayName: 'CloudQueen',
        auraScore: 9800,
        auraChange: 32,
        rank: 2,
      },
      {
        id: '3',
        username: 'nightowl',
        displayName: 'NightOwl',
        auraScore: 8200,
        auraChange: 28,
        rank: 3,
      },
      {
        id: '4',
        username: 'sparklex',
        displayName: 'SparkleX',
        auraScore: 6500,
        auraChange: 21,
        rank: 4,
      },
      {
        id: '5',
        username: 'zenmaster',
        displayName: 'ZenMaster',
        auraScore: 5100,
        auraChange: 18,
        rank: 5,
      },
    ];
    setRisingStars(mockStars);
  }, []);

  // Generate pathfinder suggestions based on hotspots
  useEffect(() => {
    if (hotspots.length === 0) return;

    const topHotspot = hotspots[0];
    const newSuggestions: PathfinderSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'hotspot',
        title: `${topHotspot.name} ist gerade 🔥`,
        subtitle: `${topHotspot.userCount} Leute sind dort aktiv`,
        location: topHotspot.name,
        distance: topHotspot.distance,
        userCount: topHotspot.userCount,
        activityScore: Math.min(topHotspot.userCount * 5, 100),
        actionLabel: 'Jetzt beitreten',
        targetId: topHotspot.id,
      },
    ];

    if (hotspots.length > 2) {
      const trendingArea = hotspots[2];
      newSuggestions.push({
        id: 'suggestion-2',
        type: 'trending_area',
        title: 'Neuer Hotspot entdeckt',
        subtitle: `${trendingArea.name} wird immer beliebter`,
        location: trendingArea.name,
        distance: trendingArea.distance,
        userCount: trendingArea.userCount,
        activityScore: Math.min(trendingArea.userCount * 5, 100),
        actionLabel: 'Erkunden',
        targetId: trendingArea.id,
      });
    }

    setSuggestions(newSuggestions);
  }, [hotspots]);

  // Handlers
  const handleCreateCloud = useCallback(() => {
    navigate('/create-room');
  }, [navigate]);

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
      }}
    >
      {/* Ambient Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <CommandHeader
        userProfile={userProfile}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        currentLocation={currentLocation}
        vibeLevel={vibeLevel}
        nearestHotspot={nearestHotspot}
        onProfileClick={() => navigate('/profile')}
        onNotificationsClick={() => navigate('/notifications')}
        onMessagesClick={() => navigate('/messages')}
      />

      {/* Main Content */}
      <div className="space-y-6 pt-4">
        {/* Rising Stars Module */}
        <RisingStars
          stars={risingStars}
          isLoading={isLoading}
        />

        {/* Pathfinder Service */}
        <PathfinderService
          suggestions={suggestions}
          isLoading={isLoading}
        />

        {/* Hotspot Radar */}
        <HotspotRadar
          hotspots={hotspots}
          isLoading={isLoading}
          maxItems={5}
        />
      </div>

      {/* Quick Action Orb */}
      <QuickActionOrb onClick={handleCreateCloud} />

      {/* Orbital Menu */}
      <OrbitalMenu
        unreadMessages={unreadMessages}
        newDiscoveries={hotspots.filter(h => h.isNew).length}
        onCreateClick={handleCreateCloud}
      />
    </div>
  );
}
