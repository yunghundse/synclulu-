/**
 * LocationGate - Cloud Entry Protocol
 *
 * Higher-Order Component that blocks access to Voice Cloud
 * without valid location permission
 */

import { useState, useEffect, ReactNode, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type LocationPermissionStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

export interface LocationState {
  status: LocationPermissionStatus;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  accuracy: number | null;
  lastUpdated: Date | null;
  error: string | null;
}

interface LocationGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  onLocationGranted?: (coords: { latitude: number; longitude: number }) => void;
  onLocationDenied?: () => void;
  requireHighAccuracy?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION GATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LocationGate({
  children,
  fallback,
  onLocationGranted,
  onLocationDenied,
  requireHighAccuracy = false
}: LocationGateProps) {
  const { user } = useAuth();
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'pending',
    coordinates: null,
    accuracy: null,
    lastUpdated: null,
    error: null
  });
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        status: 'unavailable',
        error: 'Geolocation nicht verfügbar'
      }));
      setShowOverlay(true);
      return;
    }

    // Check permission status if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });

        if (permission.state === 'denied') {
          setLocationState(prev => ({
            ...prev,
            status: 'denied',
            error: 'Standortzugriff verweigert'
          }));
          setShowOverlay(true);
          onLocationDenied?.();
          return;
        }

        if (permission.state === 'granted') {
          requestLocation();
          return;
        }

        // Permission is 'prompt' - show overlay to request
        setShowOverlay(true);
      } catch {
        // Permissions API not supported, try direct request
        requestLocation();
      }
    } else {
      // No Permissions API, try direct request
      requestLocation();
    }
  };

  const requestLocation = () => {
    setLocationState(prev => ({ ...prev, status: 'pending' }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocationState({
          status: 'granted',
          coordinates: coords,
          accuracy: position.coords.accuracy,
          lastUpdated: new Date(),
          error: null
        });

        setShowOverlay(false);

        // Update user location in Firestore
        if (user?.uid) {
          await syncLocationToFirestore(user.uid, coords);
        }

        onLocationGranted?.(coords);
      },
      (error) => {
        let errorMessage = 'Standort konnte nicht ermittelt werden';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Standortzugriff verweigert';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Standort nicht verfügbar';
            break;
          case error.TIMEOUT:
            errorMessage = 'Zeitüberschreitung bei Standortabfrage';
            break;
        }

        setLocationState({
          status: 'denied',
          coordinates: null,
          accuracy: null,
          lastUpdated: null,
          error: errorMessage
        });

        setShowOverlay(true);
        onLocationDenied?.();
      },
      {
        enableHighAccuracy: requireHighAccuracy,
        timeout: 10000,
        maximumAge: 60000 // 1 minute cache
      }
    );
  };

  const syncLocationToFirestore = async (
    userId: string,
    coords: { latitude: number; longitude: number }
  ) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastLocation: {
          latitude: coords.latitude,
          longitude: coords.longitude
        },
        locationUpdatedAt: serverTimestamp(),
        locationPermission: 'granted'
      });

      // Also update user_locations collection for Elastic Proximity
      await updateDoc(doc(db, 'user_locations', userId), {
        coordinates: {
          lat: coords.latitude,
          lng: coords.longitude
        },
        updatedAt: serverTimestamp(),
        isActive: true
      }).catch(() => {
        // Document might not exist, that's ok
      });
    } catch (error) {
      console.error('Error syncing location:', error);
    }
  };

  // If location is granted, render children
  if (locationState.status === 'granted' && locationState.coordinates) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback && showOverlay) {
    return <>{fallback}</>;
  }

  // Show default overlay
  return (
    <AnimatePresence>
      {showOverlay && (
        <LocationOverlay
          status={locationState.status}
          error={locationState.error}
          onRequestLocation={requestLocation}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LocationOverlayProps {
  status: LocationPermissionStatus;
  error: string | null;
  onRequestLocation: () => void;
  onClose: () => void;
}

function LocationOverlay({ status, error, onRequestLocation, onClose }: LocationOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-md w-full glass-card p-8 text-center"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Floating Cloud Icon */}
        <motion.div
          className="text-7xl mb-6"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          ☁️
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Keine Orientierung, keine Magie
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          Aktiviere deinen Standort, um in die Cloud zu schweben. ✨
        </p>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-start gap-3 text-left">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm text-gray-300 font-medium mb-1">
                Deine Privatsphäre ist geschützt
              </p>
              <p className="text-xs text-gray-500">
                Dein genauer Standort wird niemals anderen Usern gezeigt.
                Wir nutzen nur einen ungefähren Radius.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'pending' ? (
            <motion.div
              className="flex items-center justify-center gap-2 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-gray-400">Standort wird ermittelt...</span>
            </motion.div>
          ) : (
            <>
              <motion.button
                onClick={onRequestLocation}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="mr-2">📍</span>
                Standort aktivieren
              </motion.button>

              {status === 'denied' && (
                <div className="text-xs text-gray-500 mt-4">
                  <p className="mb-2">Standort in Browser blockiert?</p>
                  <p>
                    Gehe zu <strong>Einstellungen → Datenschutz → Standort</strong> und erlaube den Zugriff für diese Website.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Feature Preview */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-4">Was du verpasst:</p>
          <div className="flex justify-center gap-6 text-gray-400">
            <div className="text-center">
              <span className="text-2xl block mb-1">🎙️</span>
              <span className="text-xs">Voice Chat</span>
            </div>
            <div className="text-center">
              <span className="text-2xl block mb-1">📍</span>
              <span className="text-xs">Radar</span>
            </div>
            <div className="text-center">
              <span className="text-2xl block mb-1">✨</span>
              <span className="text-xs">Matches</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGHER-ORDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HOC to wrap any component with location requirement
 */
export function withLocationGate<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: Omit<LocationGateProps, 'children'>
) {
  return function LocationGatedComponent(props: P) {
    return (
      <LocationGate {...options}>
        <WrappedComponent {...props} />
      </LocationGate>
    );
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK FOR LOCATION STATUS
// ═══════════════════════════════════════════════════════════════════════════

export function useLocationPermission() {
  const [status, setStatus] = useState<LocationPermissionStatus>('pending');
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setStatus(permission.state as LocationPermissionStatus);

        permission.addEventListener('change', () => {
          setStatus(permission.state as LocationPermissionStatus);
        });
      } catch {
        setStatus('pending');
      }
    }
  };

  const requestPermission = () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCoordinates(coords);
          setStatus('granted');
          resolve(coords);
        },
        (error) => {
          setStatus('denied');
          reject(error);
        }
      );
    });
  };

  return {
    status,
    coordinates,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isPending: status === 'pending',
    requestPermission
  };
}

export default LocationGate;
