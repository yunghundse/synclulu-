/**
 * usePreciseLocation.ts
 * GPS Hard-Fix with Reverse Geocoding
 * Provides stable location with fallback handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeocodedLocation {
  district?: string; // Stadtteil
  city?: string;
  country?: string;
  formatted: string;
}

export interface UsePreciseLocationResult {
  location: LocationData | null;
  geocoded: GeocodedLocation | null;
  error: string | null;
  isLoading: boolean;
  isWeak: boolean; // Signal is weak
  isDenied: boolean; // Permission denied
  retry: () => void;
}

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

// Reverse geocoding using OpenStreetMap Nominatim (free, no API key)
async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'de',
          'User-Agent': 'syncluluApp/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const address = data.address || {};

    // Extract district/neighborhood
    const district =
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      address.district;

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality;

    return {
      district,
      city,
      country: address.country,
      formatted: district
        ? `${district}, ${city || ''}`
        : city || data.display_name?.split(',')[0] || 'Unbekannter Ort',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Track if we already have an active location watcher globally
// This prevents multiple components from creating duplicate watchers
let globalWatcherId: number | null = null;
let globalWatcherCount = 0;

export function usePreciseLocation(): UsePreciseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [geocoded, setGeocoded] = useState<GeocodedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWeak, setIsWeak] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  // Use state for consent so it can be reactive
  const [hasConsent, setHasConsent] = useState(() => {
    return typeof window !== 'undefined' &&
      localStorage.getItem('synclulu_consent_accepted') === 'true';
  });

  // Listen for consent changes (when ConsentScreen sets it)
  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('synclulu_consent_accepted') === 'true';
      setHasConsent(consent);
    };

    // Check on mount and listen for storage events
    checkConsent();
    window.addEventListener('storage', checkConsent);

    // Also check periodically in case storage event doesn't fire (same tab)
    const interval = setInterval(checkConsent, 1000);

    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  const watchIdRef = useRef<number | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastGeocodedRef = useRef<{ lat: number; lon: number } | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    setLocation(newLocation);
    setIsLoading(false);
    setError(null);

    // Check if signal is weak (accuracy > 100m)
    setIsWeak(position.coords.accuracy > 100);

    // Debounced reverse geocoding (only if moved significantly)
    const shouldGeocode =
      !lastGeocodedRef.current ||
      Math.abs(lastGeocodedRef.current.lat - newLocation.latitude) > 0.001 ||
      Math.abs(lastGeocodedRef.current.lon - newLocation.longitude) > 0.001;

    if (shouldGeocode) {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      geocodeTimeoutRef.current = setTimeout(async () => {
        const result = await reverseGeocode(
          newLocation.latitude,
          newLocation.longitude
        );
        if (result) {
          setGeocoded(result);
          lastGeocodedRef.current = {
            lat: newLocation.latitude,
            lon: newLocation.longitude,
          };
        }
      }, 500);
    }
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setIsLoading(false);

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('Standort-Zugriff verweigert');
        setIsDenied(true);
        break;
      case err.POSITION_UNAVAILABLE:
        setError('Standort nicht verfügbar');
        setIsWeak(true);
        break;
      case err.TIMEOUT:
        setError('Standort-Anfrage timeout');
        setIsWeak(true);
        break;
      default:
        setError('Unbekannter Standort-Fehler');
    }

    console.error('GPS Error:', err.message);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird nicht unterstützt');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsDenied(false);

    // First, get current position
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      LOCATION_OPTIONS
    );

    // Then watch for updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        ...LOCATION_OPTIONS,
        maximumAge: 10000, // Allow slightly cached positions for watch
      }
    );
  }, [handleSuccess, handleError]);

  const retry = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    // IMPORTANT: Only start watching if user has given consent
    // This prevents permission conflicts with ConsentScreen
    if (!hasConsent) {
      setIsLoading(false);
      setError('Warte auf Consent...');
      return;
    }

    startWatching();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [startWatching, hasConsent]);

  return {
    location,
    geocoded,
    error,
    isLoading,
    isWeak,
    isDenied,
    retry,
  };
}

// Standalone function for one-time precise location
export function getPreciseLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
      (err) => {
        console.error('GPS Error:', err);
        reject(err);
      },
      LOCATION_OPTIONS
    );
  });
}

export default usePreciseLocation;
