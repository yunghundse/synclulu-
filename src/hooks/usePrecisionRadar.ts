/**
 * PRECISION RADAR HOOK
 * Battery-efficient geofencing with 5km hard limit
 *
 * Features:
 * - Intelligent polling (reduces when app is in background)
 * - Automatic location caching
 * - Real-time nearby user updates
 * - Graceful degradation on permission denial
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import {
  RADAR_CONSTANTS,
  GeoCoordinates,
  NearbyUser,
  getLocationOptions,
  updateUserLocation,
  fetchNearbyUsers,
  getRadarPreferences,
  saveRadarPreferences,
} from '@/lib/precisionRadar';

// ═══════════════════════════════════════
// HOOK INTERFACE
// ═══════════════════════════════════════

interface UsePrecisionRadarReturn {
  // State
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  permission: PermissionState | null;

  // Location
  location: GeoCoordinates | null;
  radius: number;

  // Nearby users
  nearbyUsers: NearbyUser[];
  nearbyCount: number;

  // Actions
  setRadius: (radius: number) => Promise<void>;
  toggleRadar: () => Promise<void>;
  refreshNearby: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

// ═══════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════

export const usePrecisionRadar = (): UsePrecisionRadarReturn => {
  const { user } = useStore();

  // State
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [radius, setRadiusState] = useState(RADAR_CONSTANTS.DEFAULT_RADIUS);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);

  // Refs for cleanup
  const watchIdRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isBackgroundRef = useRef(false);

  // ═══════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      setIsLoading(true);

      try {
        // Load saved preferences
        const prefs = await getRadarPreferences();
        setRadiusState(prefs.radius);
        setIsEnabled(prefs.isEnabled);

        // Check permission
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermission(result.state);

          result.addEventListener('change', () => {
            setPermission(result.state);
          });
        }
      } catch (err) {
        console.error('[PrecisionRadar] Init failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [user?.id]);

  // ═══════════════════════════════════════
  // LOCATION WATCHING
  // ═══════════════════════════════════════

  const startLocationWatch = useCallback(() => {
    if (!navigator.geolocation || !isEnabled) return;

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options = getLocationOptions(radius, isBackgroundRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const coords: GeoCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        };

        setLocation(coords);
        setError(null);
        setPermission('granted');

        // Update in Firestore
        await updateUserLocation(coords);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Standortzugriff verweigert');
            setPermission('denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Standort nicht verfügbar');
            break;
          case err.TIMEOUT:
            setError('Standortanfrage Timeout');
            break;
          default:
            setError('Standortfehler');
        }
      },
      options
    );
  }, [isEnabled, radius]);

  // Start/stop watching based on enabled state
  useEffect(() => {
    if (isEnabled && permission !== 'denied') {
      startLocationWatch();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isEnabled, permission, startLocationWatch]);

  // ═══════════════════════════════════════
  // NEARBY USER POLLING
  // ═══════════════════════════════════════

  const refreshNearby = useCallback(async () => {
    if (!location || !isEnabled) {
      setNearbyUsers([]);
      return;
    }

    try {
      const users = await fetchNearbyUsers(location, radius);
      setNearbyUsers(users);
    } catch (err) {
      console.error('[PrecisionRadar] Failed to fetch nearby:', err);
    }
  }, [location, radius, isEnabled]);

  // Poll for nearby users
  useEffect(() => {
    if (!location || !isEnabled) return;

    // Initial fetch
    refreshNearby();

    // Set up polling
    const interval = isBackgroundRef.current
      ? RADAR_CONSTANTS.UPDATE_INTERVAL_BACKGROUND
      : RADAR_CONSTANTS.UPDATE_INTERVAL_ACTIVE;

    pollIntervalRef.current = setInterval(refreshNearby, interval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [location, isEnabled, refreshNearby]);

  // ═══════════════════════════════════════
  // VISIBILITY CHANGE (Battery optimization)
  // ═══════════════════════════════════════

  useEffect(() => {
    const handleVisibilityChange = () => {
      isBackgroundRef.current = document.hidden;

      // Restart watch with appropriate settings
      if (!document.hidden && isEnabled) {
        startLocationWatch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, startLocationWatch]);

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  const setRadius = useCallback(async (newRadius: number) => {
    // Enforce 5km limit
    const safeRadius = Math.min(
      Math.max(newRadius, RADAR_CONSTANTS.MIN_RADIUS),
      RADAR_CONSTANTS.MAX_RADIUS
    );

    setRadiusState(safeRadius);
    await saveRadarPreferences(safeRadius, isEnabled);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [isEnabled]);

  const toggleRadar = useCallback(async () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    await saveRadarPreferences(radius, newEnabled);

    if (!newEnabled) {
      setNearbyUsers([]);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20]);
    }
  }, [isEnabled, radius]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setError('Geolocation wird nicht unterstützt');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission('granted');
          setError(null);
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermission('denied');
            setError('Standortzugriff verweigert');
          }
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }, []);

  // ═══════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════

  return {
    isEnabled,
    isLoading,
    error,
    permission,
    location,
    radius,
    nearbyUsers,
    nearbyCount: nearbyUsers.length,
    setRadius,
    toggleRadar,
    refreshNearby,
    requestPermission,
  };
};

export default usePrecisionRadar;
