/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROXIMITY RADAR v14.1 - "Pulse-Radar Messenger" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Shows nearby friends and active voice rooms in a horizontal scrollable view.
 * Combines Snap Map-style proximity display with Telegram-style communication.
 *
 * Features:
 * - Live friend proximity display with distance badges
 * - Active voice room indicators (pulsing cloud icons)
 * - One-tap join for nearby voice rooms
 * - Founder ghost view mode
 * - "Breathing" Aura Pulse animation (synced 3-4s rhythm)
 * - Sanctuary-Score based glow intensity (Stardust-Shader)
 * - Parallax scroll effect on friend icons
 *
 * @author Lead System Architect (WhatsApp × Snap × Instagram)
 * @version 14.1.0
 */

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Cloud, Users, MapPin, Headphones, Sparkles, Radio } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL VIBE PULSE - Synced animation timing
// ═══════════════════════════════════════════════════════════════════════════════

const VIBE_PULSE_DURATION = 3; // 3 second breathing cycle

// Aura pulse animation variants (synced across all components)
const auraPulseVariants = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: VIBE_PULSE_DURATION,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Stardust particle animation for high-score users
const stardustVariants = {
  animate: {
    y: [0, -40],
    opacity: [0, 1, 0],
    scale: [0.5, 1.2, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatDelay: 1,
      ease: "easeOut"
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NearbyFriend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  distance: number; // in meters
  isOnline: boolean;
  inRoom: boolean;
  roomId?: string;
  roomName?: string;
  lastSeen?: Date;
  sanctuaryScore?: number; // 0-100 for glow intensity
}

interface NearbyRoom {
  id: string;
  name: string;
  participantCount: number;
  distance: number;
  isAnonymous: boolean;
  hasFreund: boolean; // Has a friend inside
}

interface ProximityRadarProps {
  onFriendClick?: (friendId: string) => void;
  onRoomClick?: (roomId: string) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const MAX_DISTANCE_KM = 2; // Only show friends within 2km

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const ProximityRadar: React.FC<ProximityRadarProps> = ({
  onFriendClick,
  onRoomClick,
  userLocation,
}) => {
  const { user } = useStore();
  const [nearbyFriends, setNearbyFriends] = useState<NearbyFriend[]>([]);
  const [nearbyRooms, setNearbyRooms] = useState<NearbyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start without loading state

  const isFounder = user?.id === FOUNDER_UID;

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch nearby friends based on their last known location
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!user?.id || !userLocation) {
      setIsLoading(false);
      return;
    }

    // Get user's friends
    const friendshipsRef = collection(db, 'friendships');
    const friendsQuery = query(
      friendshipsRef,
      where('users', 'array-contains', user.id)
    );

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friends: NearbyFriend[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendId = data.users.find((id: string) => id !== user.id);

        if (!friendId) continue;

        try {
          // Get friend's user data
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (!friendDoc.exists()) continue;

          const friendData = friendDoc.data();
          const friendLocation = friendData.lastLocation;

          // Calculate distance if location is available
          let distance = Infinity;
          if (friendLocation?.latitude && friendLocation?.longitude) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              friendLocation.latitude,
              friendLocation.longitude
            );
          }

          // Only include friends within MAX_DISTANCE_KM
          if (distance <= MAX_DISTANCE_KM * 1000 || isFounder) {
            const isOnline = friendData.isActive &&
              friendData.lastSeen?.toDate() > new Date(Date.now() - 5 * 60 * 1000);

            friends.push({
              id: friendId,
              username: friendData.username || 'unknown',
              displayName: friendData.displayName || friendData.username || 'Unbekannt',
              avatarUrl: friendData.avatarUrl,
              distance,
              isOnline,
              inRoom: !!friendData.currentRoomId,
              roomId: friendData.currentRoomId,
              roomName: friendData.currentRoomName,
              lastSeen: friendData.lastSeen?.toDate(),
              sanctuaryScore: friendData.sanctuaryScore || 50,
            });
          }
        } catch (error) {
          console.error('Error fetching friend data:', error);
        }
      }

      // Sort by distance (closest first)
      friends.sort((a, b) => a.distance - b.distance);
      setNearbyFriends(friends);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Fetch nearby voice rooms
    // ═══════════════════════════════════════════════════════════════════════════

    const roomsRef = collection(db, 'rooms');
    const roomsQuery = query(
      roomsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const rooms: NearbyRoom[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const roomLocation = data.location;

        // Calculate distance
        let distance = Infinity;
        if (roomLocation?.latitude && roomLocation?.longitude) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            roomLocation.latitude,
            roomLocation.longitude
          );
        }

        // Only include nearby rooms (within 2km) or all for founder
        if (distance <= MAX_DISTANCE_KM * 1000 || isFounder) {
          const participants = data.participants || [];

          // Check if any friend is in this room
          const friendIds = nearbyFriends.map(f => f.id);
          const hasFreund = participants.some((p: any) => friendIds.includes(p.oderId));

          rooms.push({
            id: docSnap.id,
            name: data.name || 'Wölkchen',
            participantCount: participants.length,
            distance,
            isAnonymous: data.isAnonymous || false,
            hasFreund,
          });
        }
      }

      // Sort by distance
      rooms.sort((a, b) => a.distance - b.distance);
      setNearbyRooms(rooms);
      setIsLoading(false);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeRooms();
    };
  }, [user?.id, userLocation, isFounder]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Don't show if no location
  if (!userLocation) {
    return (
      <div className="w-full border-b border-white/5 bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5">
            <MapPin size={14} className="text-white/30" />
            <span className="text-xs text-white/40">Standort wird benötigt</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - show friendly message instead of nothing
  const isEmpty = nearbyFriends.length === 0 && nearbyRooms.length === 0;

  return (
    <div className="w-full border-b border-white/5 bg-gradient-to-b from-[#0a0a0a] to-transparent">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="relative">
            <MapPin size={14} className="text-purple-400" />
            {!isEmpty && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          Vibe Radar
        </h3>
        {isFounder && (
          <span className="text-[10px] text-purple-400/50 flex items-center gap-1">
            <Sparkles size={10} />
            Ghost View
          </span>
        )}
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <div className="px-4 pb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Radio size={18} className="text-purple-400/50" />
            </div>
            <div>
              <p className="text-sm text-white/60">Niemand in der Nähe</p>
              <p className="text-[10px] text-white/30">Freunde und Wölkchen werden hier angezeigt</p>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Horizontal scroll container */
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 no-scrollbar">
        {/* Nearby Voice Rooms */}
        <AnimatePresence mode="popLayout">
          {nearbyRooms.map((room) => (
            <motion.button
              key={`room-${room.id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onRoomClick?.(room.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              {/* Room Icon with pulse */}
              <div className="relative">
                <div className={`
                  p-3 rounded-2xl border-2 transition-all
                  ${room.hasFreund
                    ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                    : 'bg-white/5 border-white/10 group-hover:border-purple-500/50'
                  }
                `}>
                  <Cloud size={24} className={`
                    ${room.hasFreund ? 'text-purple-400' : 'text-white/60'}
                  `} />

                  {/* Participant count badge */}
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-purple-500 rounded-full">
                    <span className="text-[10px] font-bold text-white">{room.participantCount}</span>
                  </div>
                </div>

                {/* Pulse animation for rooms with friends */}
                {room.hasFreund && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 animate-ping opacity-30" />
                )}
              </div>

              {/* Room name */}
              <span className="text-[10px] text-white/70 font-medium max-w-[60px] truncate">
                {room.name}
              </span>

              {/* Distance badge */}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                {formatDistance(room.distance)}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Divider if both rooms and friends exist */}
        {nearbyRooms.length > 0 && nearbyFriends.length > 0 && (
          <div className="flex-shrink-0 w-px bg-white/10 mx-1 self-stretch" />
        )}

        {/* Nearby Friends with Aura Pulse */}
        <AnimatePresence mode="popLayout">
          {nearbyFriends.map((friend, index) => {
            // Calculate glow intensity based on sanctuary score
            const glowIntensity = (friend.sanctuaryScore || 50) / 100;
            const hasHighScore = glowIntensity > 0.7;
            const auraColor = friend.inRoom
              ? 'rgba(139, 92, 246, 0.4)' // Purple when in room
              : hasHighScore
                ? 'rgba(250, 204, 21, 0.3)' // Gold for high sanctuary
                : 'rgba(34, 197, 94, 0.3)'; // Green for online

            return (
              <motion.button
                key={`friend-${friend.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onFriendClick?.(friend.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                // Parallax effect on scroll
                style={{
                  transform: `translateX(${index * 2}px)`,
                }}
              >
                {/* Avatar with Breathing Aura */}
                <div className="relative">
                  {/* Aura Pulse Ring - Breathing Animation */}
                  {friend.inRoom && (
                    <motion.div
                      className="absolute -inset-1 rounded-full blur-sm"
                      style={{ backgroundColor: auraColor }}
                      variants={auraPulseVariants}
                      animate="animate"
                    />
                  )}

                  {/* Stardust particles for high sanctuary score */}
                  {hasHighScore && friend.isOnline && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={`dust-${i}`}
                          className="absolute text-[8px] pointer-events-none"
                          style={{
                            left: `${30 + i * 15}%`,
                            top: '0',
                          }}
                          variants={stardustVariants}
                          animate="animate"
                          transition={{ delay: i * 0.5 }}
                        >
                          ✨
                        </motion.div>
                      ))}
                    </>
                  )}

                  <div className={`
                    relative p-0.5 rounded-full border-2 transition-all
                    ${friend.inRoom
                      ? 'border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                      : friend.isOnline
                        ? hasHighScore
                          ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                          : 'border-green-400'
                        : 'border-white/10'
                    }
                  `}>
                    {/* Avatar */}
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* In room indicator with Pulse */}
                    {friend.inRoom && (
                      <motion.div
                        className="absolute -bottom-1 -right-1 p-1 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(139, 92, 246, 0.4)',
                            '0 0 0 8px rgba(139, 92, 246, 0)',
                            '0 0 0 0 rgba(139, 92, 246, 0)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Headphones size={10} className="text-white" />
                      </motion.div>
                    )}

                    {/* Online indicator with subtle glow */}
                    {!friend.inRoom && friend.isOnline && (
                      <div className={`
                        absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a]
                        ${hasHighScore ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-green-400'}
                      `} />
                    )}
                  </div>
                </div>

                {/* Name with Sanctuary glow for high scores */}
                <span className={`
                  text-[10px] font-medium max-w-[60px] truncate
                  ${hasHighScore && friend.isOnline ? 'text-yellow-300' : 'text-white/70'}
                `}>
                  {friend.displayName.split(' ')[0]}
                </span>

                {/* Distance badge */}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  {formatDistance(friend.distance)}
                </span>

                {/* Room name if in room */}
                {friend.inRoom && friend.roomName && (
                  <span className="text-[8px] text-purple-400/80 max-w-[60px] truncate flex items-center gap-1">
                    <Radio size={8} className="animate-pulse" />
                    {friend.roomName}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        </div>
      )}
    </div>
  );
};

export default ProximityRadar;
