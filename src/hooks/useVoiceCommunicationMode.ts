/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VOICE COMMUNICATION MODE HOOK v3.5
 * "Distance-Based Voice Mode Switch"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Automatischer Wechsel zwischen Live-Voice und Cloud-Memo basierend auf
 * der Distanz zwischen zwei Nutzern.
 *
 * REGEL: > 5km → Cloud-Memo (Asynchrone Sprachnachrichten)
 *        ≤ 5km → Live-Voice (Echtzeit-Kommunikation)
 *
 * Integration mit dem Elastic Proximity Engine für Distanzberechnung.
 *
 * @version 3.5.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateDistance, GeoCoordinates } from '@/lib/elasticProximityEngine';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type VoiceCommunicationMode = 'live' | 'cloud-memo' | 'unavailable';

export interface VoiceModeState {
  /** Current communication mode */
  mode: VoiceCommunicationMode;
  /** Distance between users in km */
  distanceKm: number | null;
  /** Whether distance is being calculated */
  isCalculating: boolean;
  /** Error message if any */
  error: string | null;
  /** Human-readable distance string */
  distanceLabel: string;
  /** Whether the other user is online */
  isOtherUserOnline: boolean;
  /** Last known location of other user */
  otherUserLocation: GeoCoordinates | null;
}

export interface UseVoiceCommunicationModeOptions {
  /** Distance threshold in km for mode switch (default: 5km) */
  thresholdKm?: number;
  /** Polling interval for distance updates in ms (default: 30000 = 30s) */
  pollInterval?: number;
  /** Enable real-time location tracking (default: true) */
  enableRealtime?: boolean;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const DEFAULT_THRESHOLD_KM = 5;
const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

/**
 * Format distance for display
 */
function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) return 'Unbekannt';

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }

  return `${Math.round(distanceKm)}km`;
}

/**
 * Determine communication mode based on distance
 */
function determineMode(
  distanceKm: number | null,
  thresholdKm: number,
  isOtherUserOnline: boolean
): VoiceCommunicationMode {
  // No distance data available
  if (distanceKm === null) {
    return 'unavailable';
  }

  // Other user offline - default to cloud memo
  if (!isOtherUserOnline) {
    return 'cloud-memo';
  }

  // Distance check
  if (distanceKm <= thresholdKm) {
    return 'live';
  }

  return 'cloud-memo';
}

/**
 * Check if user is considered online based on last heartbeat
 */
function isUserOnline(lastSeen: Date | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - lastSeen.getTime() < HEARTBEAT_TIMEOUT_MS;
}

// ═══════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════

export function useVoiceCommunicationMode(
  currentUserLocation: GeoCoordinates | null,
  otherUserId: string | null,
  options: UseVoiceCommunicationModeOptions = {}
): VoiceModeState {
  const {
    thresholdKm = DEFAULT_THRESHOLD_KM,
    pollInterval = DEFAULT_POLL_INTERVAL,
    enableRealtime = true,
  } = options;

  // State
  const [otherUserLocation, setOtherUserLocation] = useState<GeoCoordinates | null>(null);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to other user's location updates
  useEffect(() => {
    if (!otherUserId || !enableRealtime) {
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);
    setError(null);

    const userDocRef = doc(db, 'users', otherUserId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Extract location
          if (data.location) {
            setOtherUserLocation({
              latitude: data.location.latitude || data.location._lat,
              longitude: data.location.longitude || data.location._long,
            });
          } else {
            setOtherUserLocation(null);
          }

          // Check online status
          const lastSeen = data.lastSeen?.toDate?.() || null;
          setIsOtherUserOnline(isUserOnline(lastSeen));
        } else {
          setOtherUserLocation(null);
          setIsOtherUserOnline(false);
        }

        setIsCalculating(false);
      },
      (err) => {
        console.error('Error fetching other user location:', err);
        setError('Standort konnte nicht geladen werden');
        setIsCalculating(false);
      }
    );

    return () => unsubscribe();
  }, [otherUserId, enableRealtime]);

  // Calculate distance
  const distanceKm = useMemo(() => {
    if (!currentUserLocation || !otherUserLocation) {
      return null;
    }

    return calculateDistance(currentUserLocation, otherUserLocation);
  }, [currentUserLocation, otherUserLocation]);

  // Determine mode
  const mode = useMemo(() => {
    return determineMode(distanceKm, thresholdKm, isOtherUserOnline);
  }, [distanceKm, thresholdKm, isOtherUserOnline]);

  // Format distance label
  const distanceLabel = useMemo(() => {
    return formatDistance(distanceKm);
  }, [distanceKm]);

  return {
    mode,
    distanceKm,
    isCalculating,
    error,
    distanceLabel,
    isOtherUserOnline,
    otherUserLocation,
  };
}

// ═══════════════════════════════════════
// UTILITY HOOK: Get Both Users' Locations
// ═══════════════════════════════════════

export interface UserPairDistance {
  distanceKm: number | null;
  mode: VoiceCommunicationMode;
  distanceLabel: string;
  userAOnline: boolean;
  userBOnline: boolean;
  isCalculating: boolean;
}

/**
 * Calculate distance and mode between any two users
 * Useful for admin views or group chat mode determination
 */
export function useUserPairDistance(
  userAId: string | null,
  userBId: string | null,
  thresholdKm: number = DEFAULT_THRESHOLD_KM
): UserPairDistance {
  const [userALocation, setUserALocation] = useState<GeoCoordinates | null>(null);
  const [userBLocation, setUserBLocation] = useState<GeoCoordinates | null>(null);
  const [userAOnline, setUserAOnline] = useState(false);
  const [userBOnline, setUserBOnline] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);

  // Subscribe to both users
  useEffect(() => {
    if (!userAId || !userBId) {
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);

    const unsubA = onSnapshot(doc(db, 'users', userAId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.location) {
          setUserALocation({
            latitude: data.location.latitude || data.location._lat,
            longitude: data.location.longitude || data.location._long,
          });
        }
        setUserAOnline(isUserOnline(data.lastSeen?.toDate?.() || null));
      }
    });

    const unsubB = onSnapshot(doc(db, 'users', userBId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.location) {
          setUserBLocation({
            latitude: data.location.latitude || data.location._lat,
            longitude: data.location.longitude || data.location._long,
          });
        }
        setUserBOnline(isUserOnline(data.lastSeen?.toDate?.() || null));
      }
      setIsCalculating(false);
    });

    return () => {
      unsubA();
      unsubB();
    };
  }, [userAId, userBId]);

  const distanceKm = useMemo(() => {
    if (!userALocation || !userBLocation) return null;
    return calculateDistance(userALocation, userBLocation);
  }, [userALocation, userBLocation]);

  const mode = useMemo(() => {
    return determineMode(distanceKm, thresholdKm, userAOnline && userBOnline);
  }, [distanceKm, thresholdKm, userAOnline, userBOnline]);

  return {
    distanceKm,
    mode,
    distanceLabel: formatDistance(distanceKm),
    userAOnline,
    userBOnline,
    isCalculating,
  };
}

// ═══════════════════════════════════════
// MODE MESSAGES & UI HELPERS
// ═══════════════════════════════════════

export const VOICE_MODE_MESSAGES = {
  live: {
    title: 'Live Voice',
    description: 'Ihr seid nah genug für Echtzeit-Sprachkommunikation',
    icon: '🎙️',
    color: 'emerald',
  },
  'cloud-memo': {
    title: 'Cloud-Memo',
    description: 'Zu weit entfernt für Live-Voice. Sende eine Sprachnachricht!',
    icon: '☁️',
    color: 'violet',
  },
  unavailable: {
    title: 'Nicht verfügbar',
    description: 'Standort nicht verfügbar',
    icon: '📍',
    color: 'gray',
  },
} as const;

/**
 * Get display info for current mode
 */
export function getVoiceModeInfo(mode: VoiceCommunicationMode) {
  return VOICE_MODE_MESSAGES[mode];
}

export default useVoiceCommunicationMode;
