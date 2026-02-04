import { useEffect, useCallback, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/lib/store';

export const useLocation = () => {
  const {
    location,
    locationError,
    locationPermission,
    setLocation,
    setLocationError,
    setLocationPermission
  } = useStore();

  // Use state for consent so it can be reactive
  const [hasConsent, setHasConsent] = useState(() => {
    return typeof window !== 'undefined' &&
      localStorage.getItem('synclulu_consent_accepted') === 'true';
  });

  // Listen for consent changes
  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('synclulu_consent_accepted') === 'true';
      setHasConsent(consent);
    };

    checkConsent();
    window.addEventListener('storage', checkConsent);
    const interval = setInterval(checkConsent, 1000);

    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  const updateLocationInDB = useCallback(async (lat: number, lng: number, accuracy: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'user_locations', user.uid), {
        userId: user.uid,
        latitude: lat,
        longitude: lng,
        accuracy,
        updatedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation wird nicht unterstützt');
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(result.state);

      if (result.state === 'denied') {
        setLocationError('Standort-Zugriff verweigert');
        return false;
      }

      return true;
    } catch {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  }, [setLocationPermission, setLocationError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation wird nicht unterstützt');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        };

        setLocation(newLocation);
        setLocationError(null);
        setLocationPermission('granted');

        // Update in database
        updateLocationInDB(
          newLocation.latitude,
          newLocation.longitude,
          newLocation.accuracy
        );
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Standort-Zugriff verweigert');
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Standort nicht verfügbar');
            break;
          case error.TIMEOUT:
            setLocationError('Standort-Anfrage Timeout');
            break;
          default:
            setLocationError('Unbekannter Fehler');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return watchId;
  }, [setLocation, setLocationError, setLocationPermission, updateLocationInDB]);

  useEffect(() => {
    let watchId: number | null = null;

    // IMPORTANT: Only start watching if user has given consent
    // This prevents permission conflicts with ConsentScreen
    if (!hasConsent) {
      return;
    }

    const init = async () => {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        watchId = startWatching();
      }
    };

    init();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [requestPermission, startWatching, hasConsent]);

  return {
    location,
    error: locationError,
    permission: locationPermission,
    requestPermission,
  };
};

// Helper function to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};
