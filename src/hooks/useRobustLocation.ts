/**
 * useRobustLocation.ts
 * 📍 SOLID NEBULA v22.0 - Stale-While-Revalidate Location Hook
 *
 * Features:
 * - Holds last known position for 15 seconds on signal loss
 * - Graceful degradation in tunnels/buildings
 * - No user kick-out on temporary GPS loss
 * - Automatic recovery when signal returns
 *
 * @design Solid Nebula v22.0
 * @version 22.0.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STALE_TIMEOUT_MS = 15000; // 15 seconds - hold position before marking stale
const MAX_AGE_MS = 30000; // 30 seconds - maximum cache age
const HIGH_ACCURACY_TIMEOUT_MS = 10000;
const LOW_ACCURACY_TIMEOUT_MS = 20000;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RobustLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  isStale: boolean;
  source: 'gps' | 'cached' | 'fallback';
}

export interface UseRobustLocationResult {
  location: RobustLocation | null;
  error: string | null;
  isTracking: boolean;
  isStale: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useRobustLocation(): UseRobustLocationResult {
  const [location, setLocation] = useState<RobustLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for tracking state without re-renders
  const watchIdRef = useRef<number | null>(null);
  const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidLocationRef = useRef<RobustLocation | null>(null);

  // Clear stale timer
  const clearStaleTimer = useCallback(() => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  }, []);

  // Start stale timer
  const startStaleTimer = useCallback(() => {
    clearStaleTimer();
    staleTimerRef.current = setTimeout(() => {
      console.log('[RobustLocation] Position becoming stale after 15s');
      setIsStale(true);

      // Update location to mark as stale but keep the position
      if (lastValidLocationRef.current) {
        setLocation({
          ...lastValidLocationRef.current,
          isStale: true,
          source: 'cached',
        });
      }
    }, STALE_TIMEOUT_MS);
  }, [clearStaleTimer]);

  // Handle successful position
  const handlePosition = useCallback((position: GeolocationPosition) => {
    clearStaleTimer();
    setIsStale(false);
    setError(null);

    const newLocation: RobustLocation = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      isStale: false,
      source: 'gps',
    };

    lastValidLocationRef.current = newLocation;
    setLocation(newLocation);
    setLastUpdate(new Date());

    console.log('[RobustLocation] Fresh position received:', {
      lat: newLocation.lat.toFixed(6),
      lon: newLocation.lon.toFixed(6),
      accuracy: `${Math.round(newLocation.accuracy)}m`,
    });
  }, [clearStaleTimer]);

  // Handle position error - use stale-while-revalidate
  const handleError = useCallback((err: GeolocationPositionError) => {
    console.warn('[RobustLocation] Position error:', err.message);

    // Don't immediately fail - use cached position
    if (lastValidLocationRef.current) {
      console.log('[RobustLocation] Using cached position during error');

      // Start the stale timer if not already running
      if (!staleTimerRef.current) {
        startStaleTimer();
      }

      // Update location to mark source as cached
      setLocation({
        ...lastValidLocationRef.current,
        source: 'cached',
        isStale: false, // Not stale yet, just using cache
      });
    } else {
      // No cached position available
      setError(err.message);
    }
  }, [startStaleTimer]);

  // Refresh location manually
  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0, // Force fresh position
      }
    );
  }, [handlePosition, handleError]);

  // Main effect - start tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);

    // Get initial position with high accuracy
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (err) => {
        console.warn('[RobustLocation] Initial high-accuracy failed, trying low accuracy');

        // Fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          handlePosition,
          handleError,
          {
            enableHighAccuracy: false,
            timeout: LOW_ACCURACY_TIMEOUT_MS,
            maximumAge: MAX_AGE_MS,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 0,
      }
    );

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: MAX_AGE_MS,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      clearStaleTimer();
      setIsTracking(false);
    };
  }, [handlePosition, handleError, clearStaleTimer]);

  return {
    location,
    error,
    isTracking,
    isStale,
    lastUpdate,
    refresh,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Check if location is usable
// ═══════════════════════════════════════════════════════════════════════════

export function isLocationUsable(location: RobustLocation | null): boolean {
  if (!location) return false;

  // Even stale locations are usable for up to 15 seconds
  const age = Date.now() - location.timestamp;
  return age < STALE_TIMEOUT_MS + 5000; // Add 5s buffer
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Format location for display
// ═══════════════════════════════════════════════════════════════════════════

export function formatLocationStatus(result: UseRobustLocationResult): string {
  if (result.error) return `Error: ${result.error}`;
  if (!result.location) return 'Waiting for GPS...';
  if (result.isStale) return 'Using cached location';
  return `GPS active (±${Math.round(result.location.accuracy)}m)`;
}

export default useRobustLocation;
