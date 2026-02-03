/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEBOUNCED LOCATION HOOK v1.0 - "Smooth-Operator" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Prevents infinite loops by:
 * - Debouncing location updates (min 5 seconds between updates)
 * - Requiring significant movement (50m) before triggering room search
 * - Rate-limiting database updates
 * - Caching last stable position
 *
 * This solves the "Dauerschleife" bug where every small GPS drift
 * triggers a new room search.
 *
 * @author Lead Developer (Uber Location-Tech)
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateDistance } from './useLocation';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Anti-Loop Thresholds
// ═══════════════════════════════════════════════════════════════════════════════

const DEBOUNCE_MS = 5000;           // Min 5 seconds between location updates
const MOVEMENT_THRESHOLD_M = 50;    // Min 50 meters before triggering update
const DB_UPDATE_INTERVAL_MS = 30000; // Update DB max every 30 seconds
const STALE_LOCATION_MS = 60000;    // Location considered stale after 60s

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface StableLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isStale: boolean;
}

interface UseDebouncedLocationOptions {
  /** Minimum meters to move before triggering callback (default: 50) */
  movementThreshold?: number;
  /** Minimum ms between callbacks (default: 5000) */
  debounceMs?: number;
  /** Enable/disable the hook */
  enabled?: boolean;
  /** Callback when location changes significantly */
  onSignificantMove?: (location: StableLocation) => void;
}

interface UseDebouncedLocationReturn {
  /** Current stable location */
  location: StableLocation | null;
  /** Whether location is being acquired */
  isAcquiring: boolean;
  /** Last error message */
  error: string | null;
  /** Distance moved since last significant update (meters) */
  distanceSinceLastUpdate: number;
  /** Time until next possible update (ms) */
  cooldownRemaining: number;
  /** Manually request location update (bypasses debounce) */
  forceUpdate: () => void;
  /** Check if movement is significant enough */
  isSignificantMove: (lat: number, lon: number) => boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useDebouncedLocation(
  options: UseDebouncedLocationOptions = {}
): UseDebouncedLocationReturn {
  const {
    movementThreshold = MOVEMENT_THRESHOLD_M,
    debounceMs = DEBOUNCE_MS,
    enabled = true,
    onSignificantMove,
  } = options;

  // State
  const [location, setLocation] = useState<StableLocation | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceSinceLastUpdate, setDistanceSinceLastUpdate] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Refs for tracking
  const lastUpdateRef = useRef<number>(0);
  const lastStableLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingLocationRef = useRef<GeolocationPosition | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Check if movement is significant
  // ═══════════════════════════════════════════════════════════════════════════

  const isSignificantMove = useCallback((lat: number, lon: number): boolean => {
    if (!lastStableLocationRef.current) return true;

    const distance = calculateDistance(
      lastStableLocationRef.current.lat,
      lastStableLocationRef.current.lon,
      lat,
      lon
    );

    return distance >= movementThreshold;
  }, [movementThreshold]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Process location update (with debounce)
  // ═══════════════════════════════════════════════════════════════════════════

  const processLocationUpdate = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Calculate distance from last stable position
    let distance = 0;
    if (lastStableLocationRef.current) {
      distance = calculateDistance(
        lastStableLocationRef.current.lat,
        lastStableLocationRef.current.lon,
        lat,
        lon
      );
      setDistanceSinceLastUpdate(Math.round(distance));
    }

    // Check debounce
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    if (timeSinceLastUpdate < debounceMs) {
      // Store pending location but don't trigger update
      pendingLocationRef.current = position;
      setCooldownRemaining(debounceMs - timeSinceLastUpdate);
      console.log(`[DebouncedLocation] ⏳ Cooldown: ${debounceMs - timeSinceLastUpdate}ms remaining`);
      return;
    }

    // Check movement threshold
    if (!isSignificantMove(lat, lon)) {
      console.log(`[DebouncedLocation] 📍 Minor movement (${Math.round(distance)}m) - skipping update`);
      return;
    }

    // ✅ Significant move + debounce passed - trigger update
    console.log(`[DebouncedLocation] 🚀 Significant move detected: ${Math.round(distance)}m`);

    const newLocation: StableLocation = {
      latitude: lat,
      longitude: lon,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp),
      isStale: false,
    };

    // Update refs
    lastUpdateRef.current = now;
    lastStableLocationRef.current = { lat, lon };
    pendingLocationRef.current = null;

    // Update state
    setLocation(newLocation);
    setDistanceSinceLastUpdate(0);
    setCooldownRemaining(0);

    // Trigger callback
    onSignificantMove?.(newLocation);
  }, [debounceMs, isSignificantMove, onSignificantMove]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Force update (bypasses debounce)
  // ═══════════════════════════════════════════════════════════════════════════

  const forceUpdate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird nicht unterstützt');
      return;
    }

    console.log('[DebouncedLocation] ⚡ Force update requested');
    setIsAcquiring(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Reset refs to force acceptance
        lastUpdateRef.current = 0;

        const newLocation: StableLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
          isStale: false,
        };

        lastStableLocationRef.current = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        lastUpdateRef.current = Date.now();

        setLocation(newLocation);
        setIsAcquiring(false);
        setError(null);

        onSignificantMove?.(newLocation);
      },
      (err) => {
        setIsAcquiring(false);
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onSignificantMove]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Start watching location
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    setIsAcquiring(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setIsAcquiring(false);
        setError(null);
        processLocationUpdate(position);
      },
      (err) => {
        setIsAcquiring(false);
        setError(err.message);
        console.error('[DebouncedLocation] ❌ Error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    // Cooldown timer
    cooldownIntervalRef.current = setInterval(() => {
      const remaining = debounceMs - (Date.now() - lastUpdateRef.current);
      setCooldownRemaining(Math.max(0, remaining));
    }, 500);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [enabled, processLocationUpdate, debounceMs]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Mark location as stale
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!location) return;

    const staleTimer = setTimeout(() => {
      setLocation(prev => prev ? { ...prev, isStale: true } : null);
    }, STALE_LOCATION_MS);

    return () => clearTimeout(staleTimer);
  }, [location?.timestamp]);

  return {
    location,
    isAcquiring,
    error,
    distanceSinceLastUpdate,
    cooldownRemaining,
    forceUpdate,
    isSignificantMove,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Location bucket for idempotency
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a stable location bucket key for idempotency.
 * Buckets are ~500m squares to prevent duplicate rooms.
 */
export function getLocationBucket(lat: number, lon: number): string {
  // ~500m precision (0.005 degrees ≈ 500m at equator)
  const latBucket = Math.floor(lat * 200) / 200;
  const lonBucket = Math.floor(lon * 200) / 200;
  return `${latBucket}_${lonBucket}`;
}

/**
 * Checks if two locations are in the same bucket.
 */
export function isSameBucket(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): boolean {
  return getLocationBucket(lat1, lon1) === getLocationBucket(lat2, lon2);
}

export default useDebouncedLocation;
