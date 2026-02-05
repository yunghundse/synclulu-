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
import { AuraOrb } from '../SovereignUI/AuraOrb';
import { getAscensionTier, getLevelFromXP } from '../../lib/ascensionSystem';
import ActiveWölkchen from '../ActiveWölkchen';

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
// QUICK STATS BAR WITH LOCATION
// ═══════════════════════════════════════════════════════════════
const QuickStats = memo(function QuickStats({
  nearbyCount,
  activeRooms,
  locationName,
  isLoadingLocation,
  onRefreshLocation,
  accuracy,
}: {
  nearbyCount: number;
  activeRooms: number;
  locationName?: string;
  isLoadingLocation?: boolean;
  onRefreshLocation?: () => void;
  accuracy?: number;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshLocation || isRefreshing) return;
    setIsRefreshing(true);
    onRefreshLocation();
    // Animation für 2 Sekunden
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="absolute top-[140px] left-5 right-5 z-40 space-y-2">
      {/* Location Display - Clickable to refresh */}
      <motion.button
        onClick={handleRefresh}
        disabled={isLoadingLocation || isRefreshing}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-left"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
        >
          <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
        </motion.div>
        <span className="text-xs text-white/80 truncate flex-1">
          {isLoadingLocation || isRefreshing ? (
            <span className="text-white/40">📍 Standort wird aktualisiert...</span>
          ) : locationName ? (
            <>
              <span className="text-emerald-400 font-medium">Dein Standort:</span>{' '}
              <span className="text-white">{locationName}</span>
              {accuracy && (
                <span className="text-white/30 ml-1">
                  (±{Math.round(accuracy)}m)
                </span>
              )}
            </>
          ) : (
            <span className="text-white/40">Tippe zum Aktualisieren</span>
          )}
        </span>
        {!isLoadingLocation && !isRefreshing && (
          <span className="text-[10px] text-emerald-400/60">↻</span>
        )}
      </motion.button>

      {/* Stats */}
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
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocationName, setIsLoadingLocationName] = useState(false);

  // Check if user has given consent (to avoid showing PermissionOverlay before ConsentScreen)
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('synclulu_consent_accepted') === 'true';
  });

  // Listen for consent changes
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

  // Permission Guard
  const {
    isBlocked: permissionBlocked,
    missingPermissions,
    requestGeolocation,
    requestMicrophone,
    requestNotifications,
    openSystemSettings,
  } = usePermissionGuard();

  // Location mit Retry-Funktion
  const {
    location: preciseLocation,
    isLoading: locationLoading,
    isDenied: locationDenied,
    retry: retryLocation,
  } = usePreciseLocation();

  const userCoords = preciseLocation
    ? { lat: preciseLocation.latitude, lng: preciseLocation.longitude }
    : null;

  // Reverse Geocoding - Ort aus Koordinaten ermitteln
  useEffect(() => {
    if (!preciseLocation?.latitude || !preciseLocation?.longitude) {
      setLocationName('');
      return;
    }

    const fetchLocationName = async () => {
      setIsLoadingLocationName(true);
      try {
        // Verwende OpenStreetMap Nominatim (kostenlos, kein API Key)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${preciseLocation.latitude}&lon=${preciseLocation.longitude}&zoom=16&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'de',
              'User-Agent': 'synclulu-app',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Priorität: Stadtteil > Stadt > Bundesland
          const address = data.address;
          const locationParts: string[] = [];

          if (address.suburb || address.neighbourhood || address.quarter) {
            locationParts.push(address.suburb || address.neighbourhood || address.quarter);
          }
          if (address.city || address.town || address.village || address.municipality) {
            locationParts.push(address.city || address.town || address.village || address.municipality);
          }

          if (locationParts.length > 0) {
            setLocationName(locationParts.join(', '));
          } else if (data.display_name) {
            // Fallback: Ersten Teil des display_name verwenden
            const parts = data.display_name.split(',');
            setLocationName(parts.slice(0, 2).join(',').trim());
          }
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setLocationName('');
      } finally {
        setIsLoadingLocationName(false);
      }
    };

    // Debounce: Nur alle 5 Sekunden aktualisieren
    const timeoutId = setTimeout(fetchLocationName, 1000);
    return () => clearTimeout(timeoutId);
  }, [preciseLocation?.latitude, preciseLocation?.longitude]);

  // Computed stats
  const nearbyCount = useMemo(() => {
    return mapHotspots.reduce((sum, h) => sum + h.userCount, 0);
  }, [mapHotspots]);

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
          // Check if user is currently in a room
          setIsInSync(!!data.currentRoomId);
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
        // Gracefully handle permission errors
        console.log('Rooms query error (may be permission):', error.code);
        setMapHotspots([]);
      }
    );

    return () => unsubscribe();
  }, []);

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
        // Gracefully handle permission errors
        console.log('Notifications query error (may be permission):', error.code);
        setUnreadNotifications(0);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

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

      {/* Quick Stats with Location - mit Refresh-Button */}
      <QuickStats
        nearbyCount={nearbyCount}
        activeRooms={mapHotspots.length}
        locationName={locationName}
        isLoadingLocation={locationLoading || isLoadingLocationName}
        onRefreshLocation={retryLocation}
        accuracy={preciseLocation?.accuracy}
      />

      {/* Main Content Area - Map + Active Wölkchen */}
      <div className="absolute inset-0 pt-[240px] pb-24 overflow-y-auto">
        {/* Map Section */}
        <div className="h-[300px] relative">
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

        {/* Active Wölkchen Section - Below Map */}
        <div className="mt-4">
          <ActiveWölkchen
            maxDisplay={5}
            showHeader={true}
            onCreateRoom={() => navigate('/discover')}
          />
        </div>
      </div>

      {/* Permission Overlay - Only show AFTER consent was given */}
      <PermissionOverlay
        isVisible={hasConsent && (permissionBlocked || locationDenied)}
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
