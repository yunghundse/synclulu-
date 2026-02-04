/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GEOLOCATION HOOK - Cross-Platform Location Access
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides unified geolocation access across web and native platforms.
 * Uses Capacitor Geolocation on native, falls back to browser API on web.
 *
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UseGeolocationResult {
  location: GeolocationState | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGeolocation(options?: {
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
  timeout?: number;
}): UseGeolocationResult {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    enableHighAccuracy = true,
    watchPosition = true,
    timeout = 10000
  } = options || {};

  // Convert Position to GeolocationState
  const positionToState = (position: Position): GeolocationState => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  });

  // Get current position
  const getCurrentPosition = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor Geolocation
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout
        });
        setLocation(positionToState(position));
      } else {
        // Web platform - use browser API
        if (!navigator.geolocation) {
          throw new Error('Geolocation wird nicht unterstützt');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy,
            timeout,
            maximumAge: 0
          });
        });

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      }
    } catch (err: any) {
      console.error('Geolocation error:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [enableHighAccuracy, timeout]);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
          await getCurrentPosition();
        } else {
          setError('Standort-Berechtigung wurde verweigert');
        }
      } else {
        // Web - requesting permission triggers the browser prompt
        await getCurrentPosition();
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPosition]);

  // Watch position changes
  useEffect(() => {
    let watchId: string | null = null;
    let browserWatchId: number | null = null;

    // Check if user has given consent before requesting location
    const hasConsent = typeof window !== 'undefined' &&
      localStorage.getItem('synclulu_consent_accepted') === 'true';

    const startWatching = async () => {
      // IMPORTANT: Only start watching if user has given consent
      // This prevents permission conflicts with ConsentScreen
      if (!hasConsent) {
        setIsLoading(false);
        return;
      }

      try {
        // Check permissions first
        if (Capacitor.isNativePlatform()) {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') {
            setIsLoading(false);
            return;
          }
        }

        // Get initial position
        await getCurrentPosition();

        // Set up watch if enabled
        if (watchPosition) {
          if (Capacitor.isNativePlatform()) {
            watchId = await Geolocation.watchPosition(
              { enableHighAccuracy },
              (position, err) => {
                if (err) {
                  console.error('Watch position error:', err);
                  return;
                }
                if (position) {
                  setLocation(positionToState(position));
                }
              }
            );
          } else if (navigator.geolocation) {
            browserWatchId = navigator.geolocation.watchPosition(
              (position) => {
                setLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp
                });
              },
              (err) => {
                console.error('Watch position error:', err);
              },
              { enableHighAccuracy, timeout }
            );
          }
        }
      } catch (err: any) {
        console.error('Geolocation setup error:', err);
        setError(getErrorMessage(err));
        setIsLoading(false);
      }
    };

    startWatching();

    // Cleanup
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
      if (browserWatchId !== null) {
        navigator.geolocation.clearWatch(browserWatchId);
      }
    };
  }, [getCurrentPosition, enableHighAccuracy, watchPosition, timeout]);

  return {
    location,
    error,
    isLoading,
    requestPermission,
    refresh: getCurrentPosition
  };
}

// Helper to get user-friendly error message
function getErrorMessage(err: any): string {
  if (err.code) {
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        return 'Standort-Berechtigung wurde verweigert. Bitte aktiviere sie in den Einstellungen.';
      case 2: // POSITION_UNAVAILABLE
        return 'Standort konnte nicht ermittelt werden. Bitte versuche es später erneut.';
      case 3: // TIMEOUT
        return 'Standort-Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
      default:
        return err.message || 'Unbekannter Standort-Fehler';
    }
  }
  return err.message || 'Standort konnte nicht ermittelt werden';
}

export default useGeolocation;
