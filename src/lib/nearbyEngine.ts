/**
 * NEARBY ENGINE - Location-Based User Discovery
 *
 * "Find dreamers floating near you"
 *
 * FEATURES:
 * - Real-time nearby user detection
 * - Distance calculation with Haversine formula
 * - Founder infinite radius (40,000 km = Global)
 * - Premium extended radius (15 km)
 * - Standard radius (5 km)
 *
 * @version 2.0.0
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { GATEKEEPER_CONFIG } from './gatekeeperSystem';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  updatedAt: Date;
  isVisible: boolean;
}

export interface NearbyUser {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  distance: number; // meters
  distanceLabel: string; // "500m", "1.2km"
  lastActive: Date;
  isPremium: boolean;
  isVerified: boolean;
  isStar: boolean;
  level: number;
}

export interface LocationUpdateResult {
  success: boolean;
  error?: string;
  nearbyCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_ID = import.meta.env.VITE_FOUNDER_ID || 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Search radius by tier (in meters)
export const RADIUS_CONFIG = {
  founder: GATEKEEPER_CONFIG.founderRadius,   // 40,000 km (global)
  premium: GATEKEEPER_CONFIG.premiumRadius,    // 15 km
  standard: GATEKEEPER_CONFIG.standardRadius   // 5 km
};

// Location update frequency (minimum ms between updates)
const MIN_UPDATE_INTERVAL = 30000; // 30 seconds

// ═══════════════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 100) {
    return 'Sehr nah';
  } else if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(meters / 1000)}km`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET USER SEARCH RADIUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the search radius for a user based on their tier
 */
export function getUserSearchRadius(
  userId: string,
  role: string,
  isPremium: boolean
): number {
  // Founder = Global
  if (userId === FOUNDER_ID || role === 'founder') {
    return RADIUS_CONFIG.founder;
  }

  // Admin = Global
  if (role === 'admin') {
    return RADIUS_CONFIG.founder;
  }

  // Premium = 15km
  if (isPremium) {
    return RADIUS_CONFIG.premium;
  }

  // Standard = 5km
  return RADIUS_CONFIG.standard;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE USER LOCATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update user's current location in Firestore
 */
export async function updateUserLocation(
  userId: string,
  position: GeolocationPosition
): Promise<LocationUpdateResult> {
  try {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

    // Store location in dedicated collection for fast queries
    await setDoc(doc(db, 'user_locations', userId), {
      userId,
      latitude,
      longitude,
      accuracy,
      altitude: altitude || null,
      heading: heading || null,
      speed: speed || null,
      geopoint: new GeoPoint(latitude, longitude),
      updatedAt: serverTimestamp(),
      isVisible: true
    });

    // Also update user document
    await setDoc(doc(db, 'users', userId), {
      location: {
        lat: latitude,
        lng: longitude,
        accuracy,
        updatedAt: serverTimestamp()
      },
      lastLocationUpdate: serverTimestamp()
    }, { merge: true });

    return { success: true };

  } catch (error) {
    console.error('[NearbyEngine] Error updating location:', error);
    return { success: false, error: 'Failed to update location' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET NEARBY USERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get users within the specified radius
 *
 * NOTE: Firebase doesn't support native geospatial queries like PostGIS ST_DWithin.
 * We use geohashing with a bounding box approximation, then filter by exact distance.
 */
export async function getNearbyUsers(
  userId: string,
  userLat: number,
  userLon: number,
  radiusMeters: number,
  maxResults: number = 50
): Promise<NearbyUser[]> {
  try {
    // Get all visible user locations
    // In production, use geohash-based queries for efficiency
    const locationsRef = collection(db, 'user_locations');
    const q = query(
      locationsRef,
      where('isVisible', '==', true),
      limit(200) // Get more to filter
    );

    const snapshot = await getDocs(q);

    // Calculate distances and filter
    const usersWithDistance: { userId: string; distance: number }[] = [];

    for (const locationDoc of snapshot.docs) {
      const data = locationDoc.data();

      // Skip self
      if (data.userId === userId) continue;

      // Calculate distance
      const distance = calculateDistance(
        userLat,
        userLon,
        data.latitude,
        data.longitude
      );

      // Check if within radius
      if (distance <= radiusMeters) {
        usersWithDistance.push({
          userId: data.userId,
          distance
        });
      }
    }

    // Sort by distance
    usersWithDistance.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limitedUsers = usersWithDistance.slice(0, maxResults);

    // Fetch full user data
    const nearbyUsers: NearbyUser[] = [];

    for (const { userId: nearbyUserId, distance } of limitedUsers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', nearbyUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          nearbyUsers.push({
            userId: nearbyUserId,
            displayName: userData.displayName || 'Anonym',
            username: userData.username || 'unknown',
            avatarUrl: userData.avatarUrl || null,
            distance,
            distanceLabel: formatDistance(distance),
            lastActive: userData.lastLocationUpdate?.toDate?.() || new Date(),
            isPremium: userData.isPremium || false,
            isVerified: userData.isVerified || false,
            isStar: userData.isStar || false,
            level: userData.level || 1
          });
        }
      } catch {
        // Skip users we can't fetch
      }
    }

    return nearbyUsers;

  } catch (error) {
    console.error('[NearbyEngine] Error getting nearby users:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIBE TO NEARBY USERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to real-time nearby user updates
 */
export function subscribeToNearbyUsers(
  userId: string,
  userLat: number,
  userLon: number,
  radiusMeters: number,
  callback: (users: NearbyUser[]) => void,
  maxResults: number = 50
): () => void {
  const locationsRef = collection(db, 'user_locations');
  const q = query(
    locationsRef,
    where('isVisible', '==', true)
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const usersWithDistance: { userId: string; distance: number; data: any }[] = [];

    for (const locationDoc of snapshot.docs) {
      const data = locationDoc.data();

      if (data.userId === userId) continue;

      const distance = calculateDistance(
        userLat,
        userLon,
        data.latitude,
        data.longitude
      );

      if (distance <= radiusMeters) {
        usersWithDistance.push({ userId: data.userId, distance, data });
      }
    }

    usersWithDistance.sort((a, b) => a.distance - b.distance);
    const limitedUsers = usersWithDistance.slice(0, maxResults);

    // Fetch user details
    const nearbyUsers: NearbyUser[] = [];

    for (const { userId: nearbyUserId, distance } of limitedUsers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', nearbyUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          nearbyUsers.push({
            userId: nearbyUserId,
            displayName: userData.displayName || 'Anonym',
            username: userData.username || 'unknown',
            avatarUrl: userData.avatarUrl || null,
            distance,
            distanceLabel: formatDistance(distance),
            lastActive: userData.lastLocationUpdate?.toDate?.() || new Date(),
            isPremium: userData.isPremium || false,
            isVerified: userData.isVerified || false,
            isStar: userData.isStar || false,
            level: userData.level || 1
          });
        }
      } catch {
        // Skip
      }
    }

    callback(nearbyUsers);
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════════════════
// SET VISIBILITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toggle user's visibility in nearby searches
 */
export async function setLocationVisibility(
  userId: string,
  isVisible: boolean
): Promise<void> {
  await setDoc(doc(db, 'user_locations', userId), {
    isVisible
  }, { merge: true });

  await setDoc(doc(db, 'users', userId), {
    'location.isVisible': isVisible
  }, { merge: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useStore } from './store';

/**
 * Hook to get current position
 */
export function useCurrentPosition() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error, isLoading };
}

/**
 * Hook to get nearby users with automatic updates
 */
export function useNearbyUsers(maxResults: number = 50) {
  const { user } = useStore();
  const { position, error: positionError, isLoading: positionLoading } = useCurrentPosition();

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's search radius
  const radius = user
    ? getUserSearchRadius(
        user.id,
        (user as any).role || 'user',
        (user as any).isPremium || false
      )
    : RADIUS_CONFIG.standard;

  useEffect(() => {
    if (!user?.id || !position) return;

    setIsLoading(true);

    // Update our own location first
    updateUserLocation(user.id, position);

    // Subscribe to nearby users
    const unsubscribe = subscribeToNearbyUsers(
      user.id,
      position.coords.latitude,
      position.coords.longitude,
      radius,
      (users) => {
        setNearbyUsers(users);
        setIsLoading(false);
        setError(null);
      },
      maxResults
    );

    return unsubscribe;
  }, [user?.id, position, radius, maxResults]);

  // Combine errors
  useEffect(() => {
    if (positionError) {
      setError(positionError);
    }
  }, [positionError]);

  return {
    nearbyUsers,
    isLoading: isLoading || positionLoading,
    error,
    radius,
    radiusLabel: formatDistance(radius),
    position
  };
}

/**
 * Hook to manage location updates
 */
export function useLocationManager() {
  const { user } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateLocation = useCallback(async () => {
    if (!user?.id || isUpdating) return;

    // Check minimum interval
    if (lastUpdate && Date.now() - lastUpdate.getTime() < MIN_UPDATE_INTERVAL) {
      return;
    }

    setIsUpdating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      await updateUserLocation(user.id, position);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('[LocationManager] Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, isUpdating, lastUpdate]);

  return {
    updateLocation,
    isUpdating,
    lastUpdate
  };
}

export default {
  calculateDistance,
  formatDistance,
  getUserSearchRadius,
  updateUserLocation,
  getNearbyUsers,
  subscribeToNearbyUsers,
  setLocationVisibility,
  useCurrentPosition,
  useNearbyUsers,
  useLocationManager,
  RADIUS_CONFIG
};
