/**
 * HomeLegacy.tsx
 * Privacy-First Home Page - Delulu Legacy Style
 *
 * KEINE automatischen Permission-Requests!
 * - Startet im Guest-Discovery-Modus
 * - Location nur bei explizitem Klick
 * - Klassischer Delulu-Header
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Sparkles, X } from 'lucide-react';

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
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// Components
import { LegacyHomeHeader } from '../components/SovereignHome/LegacyHomeHeader';
import { NebulaMap, MapHotspot } from '../components/NebulaMap';

// Privacy-First Location
import {
  getQuickLocation,
  getPreciseLocationOnDemand,
  checkLocationPermission,
  getDefaultLocation,
  QuickLocation,
} from '../lib/privacyAwareLocation';

// Level System
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';

// ═══════════════════════════════════════════════════════════════
// LOCATION REQUEST MODAL
// ═══════════════════════════════════════════════════════════════
const LocationRequestModal = ({
  isOpen,
  onClose,
  onAllow,
  onSkip,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onSkip: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm p-6 rounded-3xl"
          style={{
            background: 'rgba(15, 15, 20, 0.95)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.1))',
            }}
          >
            <MapPin size={32} className="text-violet-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Wer redet in deiner Nähe?
          </h2>

          {/* Description */}
          <p className="text-sm text-white/60 text-center mb-6">
            Erlaube Standortzugriff, um Gespräche in deiner Umgebung zu entdecken.
            Du kannst dies jederzeit ändern.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onAllow}
              className="w-full py-3.5 rounded-xl font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
              }}
            >
              Standort erlauben
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className="w-full py-3 rounded-xl font-medium text-white/60"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              Später entscheiden
            </motion.button>
          </div>

          {/* Privacy Note */}
          <p className="text-[10px] text-white/30 text-center mt-4">
            Dein Standort wird niemals ohne deine Zustimmung geteilt.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HomeLegacy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    photoURL?: string;
    xp: number;
    isFounder: boolean;
  } | null>(null);

  const [location, setLocation] = useState<QuickLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasAskedForLocation, setHasAskedForLocation] = useState(false);

  const [mapHotspots, setMapHotspots] = useState<MapHotspot[]>([]);
  const [activeFriendsCount, setActiveFriendsCount] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  // Level aus XP berechnen
  const levelData = useMemo(() => {
    if (!userProfile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(userProfile.xp);
  }, [userProfile?.xp]);

  const progress = useMemo(() => {
    return Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
  }, [levelData]);

  // ───────────────────────────────────────────────────────────
  // PRIVACY-FIRST: Hole IP-Location beim Start (KEIN Popup!)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const initLocation = async () => {
      // Prüfe ob Permission schon erteilt wurde
      const permissionStatus = await checkLocationPermission();

      if (permissionStatus === 'granted') {
        // Permission schon da - nutze GPS
        setIsLoadingLocation(true);
        const preciseLocation = await getPreciseLocationOnDemand();
        setLocation(preciseLocation);
        setIsLoadingLocation(false);
      } else {
        // Keine Permission - nutze IP-Location (KEIN Popup!)
        setIsLoadingLocation(true);
        const quickLocation = await getQuickLocation();
        setLocation(quickLocation || getDefaultLocation());
        setIsLoadingLocation(false);
      }
    };

    initLocation();
  }, []);

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
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Rooms (graceful error handling)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
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
          // Graceful handling - keine Error-Anzeige für User
          console.log('Rooms query info:', error.code);
          setMapHotspots([]);
        }
      );

      return () => unsubscribe();
    } catch {
      console.log('Rooms subscription setup failed');
    }
  }, []);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleNearMeClick = useCallback(async () => {
    // Prüfe ob wir schon präzise Location haben
    if (location && !location.isApproximate) {
      // Schon präzise - zeige die Map/Liste
      navigate('/discover');
      return;
    }

    // Prüfe Permission-Status
    const permissionStatus = await checkLocationPermission();

    if (permissionStatus === 'granted') {
      // Permission da - hole präzise Location
      setIsLoadingLocation(true);
      const preciseLocation = await getPreciseLocationOnDemand();
      setLocation(preciseLocation);
      setIsLoadingLocation(false);
      navigate('/discover');
    } else if (permissionStatus === 'denied') {
      // Permission denied - zeige Hinweis
      alert('Standort wurde verweigert. Du kannst dies in den Einstellungen ändern.');
    } else {
      // Permission noch nicht gefragt - zeige Modal
      setShowLocationModal(true);
    }
  }, [location, navigate]);

  const handleAllowLocation = useCallback(async () => {
    setShowLocationModal(false);
    setIsLoadingLocation(true);

    const preciseLocation = await getPreciseLocationOnDemand();
    setLocation(preciseLocation);
    setIsLoadingLocation(false);
    setHasAskedForLocation(true);

    // Nach erfolgreicher Permission - navigiere zu Discover
    if (preciseLocation) {
      navigate('/discover');
    }
  }, [navigate]);

  const handleSkipLocation = useCallback(() => {
    setShowLocationModal(false);
    setHasAskedForLocation(true);
    // Nutze weiterhin IP-Location
    navigate('/discover');
  }, [navigate]);

  // ───────────────────────────────────────────────────────────
  // Computed Values
  // ───────────────────────────────────────────────────────────
  const nearbyCount = useMemo(() => {
    return mapHotspots.reduce((sum, h) => sum + h.userCount, 0);
  }, [mapHotspots]);

  const userCoords = useMemo(() => {
    if (!location) return null;
    return { lat: location.lat, lng: location.lng };
  }, [location]);

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Legacy Header - Delulu Style */}
      <LegacyHomeHeader
        user={{
          avatar: userProfile?.photoURL,
          name: userProfile?.displayName || 'Anonym',
          level: levelData.level,
          progress,
          isFounder: userProfile?.isFounder,
        }}
        activeFriendsCount={activeFriendsCount}
        nearbyCount={nearbyCount}
        onProfileClick={() => navigate('/profile')}
        onNearMeClick={handleNearMeClick}
        onFriendsClick={() => navigate('/friends')}
      />

      {/* Map Background */}
      <div className="absolute inset-0 pt-[180px] pb-24">
        <NebulaMap
          userLocation={userCoords}
          hotspots={mapHotspots}
          selectedHotspotId={selectedHotspot}
          onHotspotSelect={setSelectedHotspot}
          onHotspotJoin={(id) => navigate(`/room/${id}`)}
          maxDistance={2000}
          isLoading={isLoadingLocation}
        />

        {/* Approximate Location Indicator */}
        {location?.isApproximate && !isLoadingLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <span className="text-xs text-amber-400">
              📍 Ungefährer Standort ({location.city || 'Unbekannt'})
            </span>
          </motion.div>
        )}
      </div>

      {/* Location Request Modal */}
      <LocationRequestModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onAllow={handleAllowLocation}
        onSkip={handleSkipLocation}
      />
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
