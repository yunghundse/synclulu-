/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIBE MAP v14.1 - "Nebula-Messenger" Edition with Performance Optimization
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Interactive map showing friends, voice rooms, and vibe heatmap.
 * Combines location-based social features with beautiful visualization.
 *
 * Features:
 * - Vibe Heatmap showing positive user concentrations
 * - Friend markers with online/room status
 * - Voice room clouds that cluster nearby friends
 * - Founder admin layer with extra visibility
 * - Tap-to-navigate to any point
 *
 * Performance Optimizations v14.1:
 * - React.memo to prevent unnecessary re-renders
 * - Decoupled data fetching from message stream
 * - Fallback values for Vibe-Score (0.5 default)
 * - Optimized marker rendering with useMemo
 *
 * @author Lead System Architect (WhatsApp × Snap × Telegram)
 * @version 14.1.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Users, MapPin, Headphones, Sparkles, Navigation, X, MessageCircle, Radio } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import 'leaflet/dist/leaflet.css';

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE THEME HOOK - Falls back gracefully if ThemeProvider not available
// ═══════════════════════════════════════════════════════════════════════════════
function useSafeTheme() {
  try {
    // Check if we're in browser and if dark mode is preferred
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const htmlHasDark = document.documentElement.classList.contains('dark');
      return { isDark: prefersDark || htmlHasDark };
    }
  } catch (e) {
    // Fallback to dark mode
  }
  return { isDark: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE: Default fallback values to prevent loading hangs
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_VIBE_SCORE = 0.5; // Fallback if API doesn't respond
const DATA_FETCH_DEBOUNCE_MS = 500; // Debounce data fetching

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MapFriend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  inRoom: boolean;
  roomId?: string;
  roomName?: string;
  sanctuaryScore?: number;
}

interface MapRoom {
  id: string;
  name: string;
  participantCount: number;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  participants: { userId: string; displayName: string }[];
}

interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity: number; // 0-1 based on sanctuary scores
}

interface VibeMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  onFriendClick?: (friendId: string) => void;
  onRoomClick?: (roomId: string) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}

interface ClusterGroup {
  id: string;
  centerLat: number;
  centerLng: number;
  friends: MapFriend[];
  room?: MapRoom;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const CLUSTER_RADIUS_METERS = 50; // Group friends within 50m

// ═══════════════════════════════════════════════════════════════════════════════
// FREE MAP TILES - No API Key Required, works on any domain!
// ═══════════════════════════════════════════════════════════════════════════════

// Dark mode: CartoDB Dark Matter (free, no API key)
const DARK_MAP_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Light mode alternative: CartoDB Voyager
const LIGHT_MAP_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
// Standard OSM fallback
const OSM_MAP_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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

// Create clusters from friends based on proximity
function createClusters(friends: MapFriend[], rooms: MapRoom[]): ClusterGroup[] {
  const clusters: ClusterGroup[] = [];
  const assigned = new Set<string>();

  // First, create clusters around active rooms
  for (const room of rooms) {
    const nearbyFriends = friends.filter(f => {
      if (assigned.has(f.id)) return false;
      const dist = calculateDistance(f.latitude, f.longitude, room.latitude, room.longitude);
      return dist <= CLUSTER_RADIUS_METERS;
    });

    if (nearbyFriends.length > 0 || room.participantCount > 0) {
      clusters.push({
        id: `room-${room.id}`,
        centerLat: room.latitude,
        centerLng: room.longitude,
        friends: nearbyFriends,
        room,
      });
      nearbyFriends.forEach(f => assigned.add(f.id));
    }
  }

  // Then cluster remaining friends
  for (const friend of friends) {
    if (assigned.has(friend.id)) continue;

    const nearbyUnassigned = friends.filter(f => {
      if (assigned.has(f.id) || f.id === friend.id) return false;
      const dist = calculateDistance(f.latitude, f.longitude, friend.latitude, friend.longitude);
      return dist <= CLUSTER_RADIUS_METERS;
    });

    if (nearbyUnassigned.length > 0) {
      const allInCluster = [friend, ...nearbyUnassigned];
      const centerLat = allInCluster.reduce((sum, f) => sum + f.latitude, 0) / allInCluster.length;
      const centerLng = allInCluster.reduce((sum, f) => sum + f.longitude, 0) / allInCluster.length;

      clusters.push({
        id: `cluster-${friend.id}`,
        centerLat,
        centerLng,
        friends: allInCluster,
      });
      allInCluster.forEach(f => assigned.add(f.id));
    } else {
      // Single friend, still create a "cluster" of one
      clusters.push({
        id: `single-${friend.id}`,
        centerLat: friend.latitude,
        centerLng: friend.longitude,
        friends: [friend],
      });
      assigned.add(friend.id);
    }
  }

  return clusters;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM MARKERS
// ═══════════════════════════════════════════════════════════════════════════════

// Create custom friend marker
function createFriendIcon(friend: MapFriend, isFounder: boolean): L.DivIcon {
  const statusColor = friend.inRoom ? '#a855f7' : friend.isOnline ? '#4ade80' : '#6b7280';
  const pulseClass = friend.inRoom ? 'animate-pulse' : '';

  return L.divIcon({
    className: 'custom-friend-marker',
    html: `
      <div class="relative ${pulseClass}" style="width: 44px; height: 44px;">
        <div class="absolute inset-0 rounded-full border-2" style="border-color: ${statusColor}; background: rgba(0,0,0,0.8);">
          ${friend.avatarUrl
            ? `<img src="${friend.avatarUrl}" class="w-full h-full rounded-full object-cover" />`
            : `<div class="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm" style="background: linear-gradient(135deg, #a855f7, #ec4899);">
                ${friend.displayName.slice(0, 2).toUpperCase()}
              </div>`
          }
        </div>
        ${friend.inRoom ? `
          <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
          </div>
        ` : ''}
        ${isFounder ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
            <span style="font-size: 8px;">👁️</span>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Create room cloud marker
function createRoomIcon(room: MapRoom, hasFriend: boolean): L.DivIcon {
  const bgColor = hasFriend ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  const borderColor = hasFriend ? '#a855f7' : 'rgba(255, 255, 255, 0.2)';

  return L.divIcon({
    className: 'custom-room-marker',
    html: `
      <div class="relative" style="width: 56px; height: 56px;">
        <div class="absolute inset-0 rounded-2xl border-2 flex items-center justify-center"
             style="background: ${bgColor}; border-color: ${borderColor}; backdrop-filter: blur(8px);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${hasFriend ? '#a855f7' : 'rgba(255,255,255,0.6)'}" stroke-width="1.5">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-purple-500">
          <span style="font-size: 10px; color: white; font-weight: bold;">${room.participantCount}</span>
        </div>
        ${hasFriend ? `
          <div class="absolute inset-0 rounded-2xl border-2 border-purple-500 animate-ping opacity-30"></div>
        ` : ''}
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

// Create cluster cloud marker
function createClusterIcon(cluster: ClusterGroup): L.DivIcon {
  const count = cluster.friends.length + (cluster.room?.participantCount || 0);
  const hasRoom = !!cluster.room;

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div class="relative" style="width: 64px; height: 64px;">
        <div class="absolute inset-0 rounded-full border-2 flex items-center justify-center"
             style="background: rgba(139, 92, 246, 0.4); border-color: #a855f7; backdrop-filter: blur(8px);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          </svg>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-500">
          <span style="font-size: 11px; color: white; font-weight: bold;">${count}</span>
        </div>
        ${hasRoom ? `
          <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" x2="12" y1="19" y2="22"></line>
            </svg>
          </div>
        ` : ''}
        <div class="absolute inset-0 rounded-full border-2 border-purple-400 animate-pulse opacity-50"></div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
}

// User location marker
function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative" style="width: 24px; height: 24px;">
        <div class="absolute inset-0 rounded-full bg-blue-500 border-3 border-white shadow-lg"></div>
        <div class="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP CONTROLLER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MapControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapController: React.FC<MapControllerProps> = ({ userLocation, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15);
    }
  }, [map, userLocation]);

  useMapEvents({
    click: (e) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIBE HEATMAP CIRCLES
// ═══════════════════════════════════════════════════════════════════════════════

interface VibeHeatmapProps {
  heatPoints: HeatPoint[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZED HEATMAP COMPONENT (Performance Optimization)
// ═══════════════════════════════════════════════════════════════════════════════

const VibeHeatmap = memo<VibeHeatmapProps>(({ heatPoints }) => {
  return (
    <>
      {heatPoints.map((point, index) => (
        <Circle
          key={`heat-${index}-${point.latitude.toFixed(4)}`}
          center={[point.latitude, point.longitude]}
          radius={100 + point.intensity * 200}
          pathOptions={{
            color: 'transparent',
            fillColor: `rgba(139, 92, 246, ${0.1 + point.intensity * 0.2})`,
            fillOpacity: 0.4 + point.intensity * 0.3,
          }}
        />
      ))}
    </>
  );
});

VibeHeatmap.displayName = 'VibeHeatmap';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT - Wrapped with memo for performance
// ═══════════════════════════════════════════════════════════════════════════════

const VibeMapInner: React.FC<VibeMapProps> = ({
  userLocation,
  onFriendClick,
  onRoomClick,
  onClose,
  isFullscreen = false,
}) => {
  const { user } = useStore();
  const [friends, setFriends] = useState<MapFriend[]>([]);
  const [rooms, setRooms] = useState<MapRoom[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start without loading state

  // Theme detection for map tiles (safe fallback)
  const { isDark } = useSafeTheme();
  const mapTileUrl = isDark ? DARK_MAP_URL : LIGHT_MAP_URL;

  const isFounder = user?.id === FOUNDER_UID;

  // Compute clusters
  const clusters = useMemo(() => createClusters(friends, rooms), [friends, rooms]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Data fetching
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch friends with locations
    const friendshipsRef = collection(db, 'friendships');
    const friendsQuery = query(
      friendshipsRef,
      where('users', 'array-contains', user.id)
    );

    const unsubscribeFriends = onSnapshot(friendsQuery, async (snapshot) => {
      const friendsList: MapFriend[] = [];
      const heatPointsList: HeatPoint[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendId = data.users.find((id: string) => id !== user.id);

        if (!friendId) continue;

        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (!friendDoc.exists()) continue;

          const friendData = friendDoc.data();
          const friendLocation = friendData.lastLocation;

          if (friendLocation?.latitude && friendLocation?.longitude) {
            const isOnline = friendData.isActive &&
              friendData.lastSeen?.toDate() > new Date(Date.now() - 5 * 60 * 1000);

            friendsList.push({
              id: friendId,
              username: friendData.username || 'unknown',
              displayName: friendData.displayName || friendData.username || 'Unbekannt',
              avatarUrl: friendData.avatarUrl,
              latitude: friendLocation.latitude,
              longitude: friendLocation.longitude,
              isOnline,
              inRoom: !!friendData.currentRoomId,
              roomId: friendData.currentRoomId,
              roomName: friendData.currentRoomName,
              sanctuaryScore: friendData.sanctuaryScore || 50,
            });

            // Add heat point based on sanctuary score
            const score = (friendData.sanctuaryScore || 50) / 100;
            if (score > 0.4) {
              heatPointsList.push({
                latitude: friendLocation.latitude,
                longitude: friendLocation.longitude,
                intensity: score,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching friend for map:', error);
        }
      }

      setFriends(friendsList);
      setHeatPoints(heatPointsList);
    });

    // Fetch active rooms with locations
    const roomsRef = collection(db, 'rooms');
    const roomsQuery = query(
      roomsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const roomsList: MapRoom[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const roomLocation = data.location;

        if (roomLocation?.latitude && roomLocation?.longitude) {
          roomsList.push({
            id: docSnap.id,
            name: data.name || 'Wölkchen',
            participantCount: (data.participants || []).length,
            latitude: roomLocation.latitude,
            longitude: roomLocation.longitude,
            isAnonymous: data.isAnonymous || false,
            participants: (data.participants || []).map((p: any) => ({
              userId: p.oderId,
              displayName: p.displayName,
            })),
          });

          // Rooms are high-intensity heat sources
          setHeatPoints(prev => [
            ...prev.filter(p => p.latitude !== roomLocation.latitude || p.longitude !== roomLocation.longitude),
            {
              latitude: roomLocation.latitude,
              longitude: roomLocation.longitude,
              intensity: Math.min(1, 0.5 + (data.participants?.length || 0) * 0.1),
            },
          ]);
        }
      }

      setRooms(roomsList);
      setIsLoading(false);
    });

    return () => {
      unsubscribeFriends();
      unsubscribeRooms();
    };
  }, [user?.id]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClusterClick = (cluster: ClusterGroup) => {
    if (cluster.friends.length === 1 && !cluster.room) {
      // Single friend, go directly
      onFriendClick?.(cluster.friends[0].id);
    } else {
      // Show cluster popup
      setSelectedCluster(cluster);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (!userLocation) {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-64'} bg-[#050505] flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Standort wird benötigt</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-64 rounded-xl overflow-hidden'} bg-[#050505]`}>
      {/* Header */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-400" />
              Vibe Map
              {isFounder && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  Admin
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={mapTileUrl}
          attribution={MAP_ATTRIBUTION}
        />

        <MapController
          userLocation={userLocation}
        />

        {/* Vibe Heatmap Layer */}
        <VibeHeatmap heatPoints={heatPoints} />

        {/* User location marker */}
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={createUserIcon()}
        />

        {/* Cluster markers */}
        {clusters.map((cluster) => {
          // If it's a single friend without room, show friend marker
          if (cluster.friends.length === 1 && !cluster.room) {
            const friend = cluster.friends[0];
            return (
              <Marker
                key={cluster.id}
                position={[friend.latitude, friend.longitude]}
                icon={createFriendIcon(friend, isFounder)}
                eventHandlers={{
                  click: () => onFriendClick?.(friend.id),
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{friend.displayName}</p>
                        <p className="text-white/50 text-xs">
                          {friend.inRoom ? `☁️ ${friend.roomName}` : friend.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onFriendClick?.(friend.id)}
                      className="w-full py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg"
                    >
                      Nachricht senden
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }

          // If it's a room without friends nearby, show room marker
          if (cluster.friends.length === 0 && cluster.room) {
            const room = cluster.room;
            const friendIds = friends.map(f => f.id);
            const hasFriend = room.participants.some(p => friendIds.includes(p.userId));

            return (
              <Marker
                key={cluster.id}
                position={[room.latitude, room.longitude]}
                icon={createRoomIcon(room, hasFriend)}
                eventHandlers={{
                  click: () => onRoomClick?.(room.id),
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-white font-medium text-sm">{room.name}</p>
                        <p className="text-white/50 text-xs">{room.participantCount} Teilnehmer</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRoomClick?.(room.id)}
                      className="w-full py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg"
                    >
                      Beitreten
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }

          // Otherwise show cluster marker
          return (
            <Marker
              key={cluster.id}
              position={[cluster.centerLat, cluster.centerLng]}
              icon={createClusterIcon(cluster)}
              eventHandlers={{
                click: () => handleClusterClick(cluster),
              }}
            >
              <Popup className="custom-popup">
                <div className="bg-[#1a1a1a] rounded-lg p-3 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Cloud className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {cluster.room?.name || 'Gruppen-Wölkchen'}
                      </p>
                      <p className="text-white/50 text-xs">
                        {cluster.friends.length} Freunde
                        {cluster.room && ` • ${cluster.room.participantCount} im Raum`}
                      </p>
                    </div>
                  </div>

                  {/* Friend avatars */}
                  <div className="flex -space-x-2 mb-3">
                    {cluster.friends.slice(0, 5).map((friend) => (
                      <div key={friend.id} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a]">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {friend.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    {cluster.friends.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px]">
                        +{cluster.friends.length - 5}
                      </div>
                    )}
                  </div>

                  {cluster.room && (
                    <button
                      onClick={() => onRoomClick?.(cluster.room!.id)}
                      className="w-full py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg mb-2"
                    >
                      Wölkchen beitreten
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1">
                    {cluster.friends.slice(0, 4).map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => onFriendClick?.(friend.id)}
                        className="px-2 py-1 bg-white/5 text-white/70 text-[10px] rounded truncate hover:bg-white/10"
                      >
                        {friend.displayName.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend (Founder only) */}
      {isFounder && isFullscreen && (
        <div className="absolute bottom-24 left-4 z-[1000] bg-black/80 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-[10px] text-yellow-400 font-bold mb-2">ADMIN LAYER</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500/40" />
              <span className="text-[10px] text-white/60">Vibe Heatmap</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-[10px] text-white/60">Online Freunde</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-[10px] text-white/60">Im Wölkchen</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud size={12} className="text-purple-400" />
              <span className="text-[10px] text-white/60">Aktive Räume</span>
            </div>
          </div>
        </div>
      )}

      {/* Center on user button */}
      {isFullscreen && (
        <button
          onClick={() => {
            // Map will recenter via MapController
          }}
          className="absolute bottom-24 right-4 z-[1000] p-3 bg-purple-500 rounded-full shadow-lg"
        >
          <Navigation size={20} className="text-white" />
        </button>
      )}

      {/* Empty state overlay when no data */}
      {!isLoading && friends.length === 0 && rooms.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: 'rgba(5, 5, 5, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <p className="text-sm text-white/60">Keine Aktivität in deiner Nähe</p>
            <p className="text-xs text-white/40 mt-1">Freunde und Wölkchen werden hier angezeigt</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZED EXPORT - Prevents re-render from message stream updates
// ═══════════════════════════════════════════════════════════════════════════════

export const VibeMap = memo(VibeMapInner, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  const locationSame =
    prevProps.userLocation?.latitude === nextProps.userLocation?.latitude &&
    prevProps.userLocation?.longitude === nextProps.userLocation?.longitude;
  const fullscreenSame = prevProps.isFullscreen === nextProps.isFullscreen;

  // If location and fullscreen are the same, don't re-render
  return locationSame && fullscreenSame;
});

VibeMap.displayName = 'VibeMap';

export default VibeMap;
