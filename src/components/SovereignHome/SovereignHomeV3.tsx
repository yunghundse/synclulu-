/**
 * SovereignHomeV3.tsx
 * CLEAN HOME - Minimalistisches Design
 *
 * Nur das Wesentliche:
 * - Header mit Profil & Notifications
 * - Nebula Map (Hauptelement)
 * - Schnellzugriff auf Wölkchen
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, MapPin, Users } from 'lucide-react';

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
import { NebulaMap, MapHotspot } from '../NebulaMap';
import { PermissionOverlay } from '../PermissionOverlay';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { SovereignHeader } from './SovereignHeader';
import { useNebulaToast } from '../NebulaToast';

// Types
interface UserProfile {
  displayName: string;
  photoURL?: string;
  auraScore?: number;
  xp?: number;
}

// ═══════════════════════════════════════════════════════════════
// MINIMAL HEADER
// ═══════════════════════════════════════════════════════════════
const MinimalHeader = memo(function MinimalHeader({
  userProfile,
  unreadNotifications,
  unreadMessages,
  onProfileClick,
  onNotificationsClick,
}: {
  userProfile: UserProfile | null;
  unreadNotifications: number;
  unreadMessages: number;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        {/* Left: Profile */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onProfileClick}
          className="flex items-center gap-3"
        >
          <div
            className="w-11 h-11 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-base font-semibold text-white/70">
                  {userProfile?.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              {userProfile?.displayName || 'Hallo'}
            </p>
            <p className="text-[10px] text-white/40">
              {userProfile?.auraScore || 0} Aura
            </p>
          </div>
        </motion.button>

        {/* Right: Notifications */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onNotificationsClick}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Bell size={18} className="text-white/60" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// QUICK STATS BAR
// ═══════════════════════════════════════════════════════════════
const QuickStats = memo(function QuickStats({
  nearbyCount,
  activeRooms,
}: {
  nearbyCount: number;
  activeRooms: number;
}) {
  return (
    <div className="absolute top-[140px] left-5 right-5 z-40">
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60">
            <span className="text-white font-medium">{nearbyCount}</span> in der Nähe
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-violet-400" />
          <span className="text-xs text-white/60">
            <span className="text-white font-medium">{activeRooms}</span> aktive Wölkchen
          </span>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function SovereignHomeV3() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Nebula Toast System
  const { ToastContainer, showSync, showLevelUp } = useNebulaToast();

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mapHotspots, setMapHotspots] = useState<MapHotspot[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedMapHotspot, setSelectedMapHotspot] = useState<string | null>(null);
  const [isInSync, setIsInSync] = useState(false); // Ob User in einem Wölkchen ist

  // Permission Guard
  const {
    isBlocked: permissionBlocked,
    missingPermissions,
    requestGeolocation,
    requestMicrophone,
    requestNotifications,
    openSystemSettings,
  } = usePermissionGuard();

  // Location
  const {
    location: preciseLocation,
    isLoading: locationLoading,
    isDenied: locationDenied,
  } = usePreciseLocation();

  const userCoords = preciseLocation
    ? { lat: preciseLocation.latitude, lng: preciseLocation.longitude }
    : null;

  // Computed stats
  const nearbyCount = useMemo(() => {
    return mapHotspots.reduce((sum, h) => sum + h.userCount, 0);
  }, [mapHotspots]);

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
            auraScore: data.auraScore || 0,
            xp: data.xp || data.totalXP || 0,
          });
          // Check if user is currently in a room
          setIsInSync(!!data.currentRoomId);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.uid]);

  // Subscribe to rooms
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
      },
      (error) => {
        console.error('Error fetching hotspots:', error);
        setMapHotspots([]);
      }
    );

    return () => unsubscribe();
  }, []);

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

  return (
    <div
      className="fixed inset-0 overflow-hidden will-change-transform"
      style={{
        background: '#050505',
        transform: 'translateZ(0)', // GPU Layer
      }}
    >
      {/* Subtle ambient glow - GPU accelerated */}
      <div
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Sovereign Header - Leuchtender Level-Header */}
      <SovereignHeader
        user={{
          avatar: userProfile?.photoURL,
          displayName: userProfile?.displayName || 'Anonym',
          xp: userProfile?.xp || 0,
        }}
        isInSync={isInSync}
        notificationCount={unreadNotifications}
        onProfileClick={() => navigate('/profile')}
        onNotificationsClick={() => navigate('/notifications')}
      />

      {/* Quick Stats */}
      <QuickStats
        nearbyCount={nearbyCount}
        activeRooms={mapHotspots.length}
      />

      {/* Full-Screen Map */}
      <div className="absolute inset-0 pt-[200px] pb-24">
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

      {/* Permission Overlay */}
      <PermissionOverlay
        isVisible={permissionBlocked || locationDenied}
        missingPermissions={missingPermissions}
        onRequestGeolocation={requestGeolocation}
        onRequestMicrophone={requestMicrophone}
        onRequestNotifications={requestNotifications}
        onOpenSettings={openSystemSettings}
      />

      {/* Nebula Toast Notifications */}
      <ToastContainer />
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
