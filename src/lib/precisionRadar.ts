/**
 * PRECISION RADAR SYSTEM
 * "The 5KM Limit" - Battery-efficient geofencing with rock-solid distance filtering
 *
 * ENGINEERING STANDARDS:
 * 1. Hard 5km cap - No exceptions
 * 2. Apple-level battery efficiency
 * 3. Graceful exclusion for out-of-range users
 * 4. Real-time updates with intelligent throttling
 *
 * @author Senior Principal Engineer
 * @version 2.0.0 - Silicon Valley Edition
 */

import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, Timestamp, GeoPoint } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// ═══════════════════════════════════════
// CONSTANTS - IMMUTABLE SYSTEM LIMITS
// ═══════════════════════════════════════

export const RADAR_CONSTANTS = {
  // Distance limits (meters)
  MAX_RADIUS: 5000,           // Hard 5km cap - NEVER exceeded
  MIN_RADIUS: 100,            // Minimum useful range
  DEFAULT_RADIUS: 1000,       // Default 1km
  STEP_SIZE: 50,              // Slider increments

  // Battery optimization
  HIGH_ACCURACY_THRESHOLD: 500,   // Use high accuracy within 500m
  UPDATE_INTERVAL_ACTIVE: 30000,  // 30s when app is active
  UPDATE_INTERVAL_BACKGROUND: 300000, // 5min in background
  LOCATION_MAX_AGE: 60000,        // Accept cached location up to 1min old
  LOCATION_TIMEOUT: 15000,        // 15s timeout

  // Cache settings
  NEARBY_CACHE_TTL: 30000,        // 30s cache for nearby users
  LOCATION_EXPIRY: 900000,        // 15min location validity

  // Earth's radius for calculations
  EARTH_RADIUS_METERS: 6371e3,
} as const;

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface NearbyUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatar?: string;
  distance: number;          // Meters from current user
  bearing: number;           // Compass direction (0-360)
  level: number;
  trustScore: number;
  isPremium: boolean;
  isActive: boolean;         // Active in last 5 mins
  lastSeen: Date;
  isWithinRadius: boolean;   // Explicitly flagged
}

export interface RadarState {
  isEnabled: boolean;
  radius: number;
  lastUpdate: Date | null;
  nearbyCount: number;
  batteryMode: 'high' | 'balanced' | 'low';
}

// ═══════════════════════════════════════
// HAVERSINE FORMULA - High Precision
// ═══════════════════════════════════════

/**
 * Calculate distance between two points using Haversine formula
 * Accuracy: ~0.5% error for distances up to 10km
 */
export const calculatePreciseDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = RADAR_CONSTANTS.EARTH_RADIUS_METERS;

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

/**
 * Calculate compass bearing from point 1 to point 2
 * Returns degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(x, y);
  return ((θ * 180) / Math.PI + 360) % 360;
};

// ═══════════════════════════════════════
// GEOFENCE BOUNDARY CHECK
// ═══════════════════════════════════════

/**
 * Strict boundary check - Returns false if outside 5km
 * This is the SINGLE SOURCE OF TRUTH for inclusion
 */
export const isWithinRadarBoundary = (
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = RADAR_CONSTANTS.MAX_RADIUS
): boolean => {
  // HARD LIMIT: Never allow radius > 5km
  const effectiveRadius = Math.min(radiusMeters, RADAR_CONSTANTS.MAX_RADIUS);

  const distance = calculatePreciseDistance(userLat, userLon, targetLat, targetLon);

  return distance <= effectiveRadius;
};

// ═══════════════════════════════════════
// BATTERY-EFFICIENT LOCATION OPTIONS
// ═══════════════════════════════════════

/**
 * Get optimized geolocation options based on context
 * Apple-standard battery efficiency
 */
export const getLocationOptions = (
  radius: number,
  isBackground: boolean = false
): PositionOptions => {
  // High accuracy only needed for close-range radar
  const needsHighAccuracy = radius <= RADAR_CONSTANTS.HIGH_ACCURACY_THRESHOLD;

  if (isBackground) {
    // Background mode: Maximum battery savings
    return {
      enableHighAccuracy: false,
      maximumAge: RADAR_CONSTANTS.LOCATION_MAX_AGE * 5, // Accept 5min old
      timeout: RADAR_CONSTANTS.LOCATION_TIMEOUT * 2,
    };
  }

  if (needsHighAccuracy) {
    // Close range: High accuracy, shorter cache
    return {
      enableHighAccuracy: true,
      maximumAge: 10000, // 10s cache
      timeout: RADAR_CONSTANTS.LOCATION_TIMEOUT,
    };
  }

  // Balanced mode for typical use
  return {
    enableHighAccuracy: false,
    maximumAge: RADAR_CONSTANTS.LOCATION_MAX_AGE,
    timeout: RADAR_CONSTANTS.LOCATION_TIMEOUT,
  };
};

// ═══════════════════════════════════════
// FIRESTORE OPERATIONS
// ═══════════════════════════════════════

/**
 * Update user's location in Firestore with expiry
 */
export const updateUserLocation = async (
  coords: GeoCoordinates
): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    await setDoc(doc(db, 'user_locations', user.uid), {
      userId: user.uid,
      geopoint: new GeoPoint(coords.latitude, coords.longitude),
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      updatedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + RADAR_CONSTANTS.LOCATION_EXPIRY),
      isActive: true,
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('[PrecisionRadar] Failed to update location:', error);
    return false;
  }
};

/**
 * Fetch nearby users within radius (capped at 5km)
 * Filters out expired and out-of-range users
 */
export const fetchNearbyUsers = async (
  userLocation: GeoCoordinates,
  radiusMeters: number = RADAR_CONSTANTS.DEFAULT_RADIUS
): Promise<NearbyUser[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  // ENFORCE 5KM LIMIT
  const effectiveRadius = Math.min(radiusMeters, RADAR_CONSTANTS.MAX_RADIUS);

  try {
    // Calculate bounding box for initial filter (reduces Firestore reads)
    const latDelta = (effectiveRadius / RADAR_CONSTANTS.EARTH_RADIUS_METERS) * (180 / Math.PI);
    const lonDelta = latDelta / Math.cos((userLocation.latitude * Math.PI) / 180);

    const minLat = userLocation.latitude - latDelta;
    const maxLat = userLocation.latitude + latDelta;
    const minLon = userLocation.longitude - lonDelta;
    const maxLon = userLocation.longitude + lonDelta;

    // Query locations within bounding box
    const locationsRef = collection(db, 'user_locations');
    const q = query(
      locationsRef,
      where('latitude', '>=', minLat),
      where('latitude', '<=', maxLat),
      where('expiresAt', '>', new Date())
    );

    const snapshot = await getDocs(q);
    const nearbyUsers: NearbyUser[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Skip self
      if (data.userId === user.uid) continue;

      // Longitude filter (Firestore can't compound on two different fields)
      if (data.longitude < minLon || data.longitude > maxLon) continue;

      // PRECISION DISTANCE CHECK - This is the real filter
      const distance = calculatePreciseDistance(
        userLocation.latitude,
        userLocation.longitude,
        data.latitude,
        data.longitude
      );

      // STRICT 5KM BOUNDARY - Graceful exclusion
      const isWithinRadius = distance <= effectiveRadius;
      if (!isWithinRadius) continue; // Excluded from results

      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', data.userId));
      if (!userDoc.exists()) continue;

      const userData = userDoc.data();

      // Calculate bearing
      const bearing = calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        data.latitude,
        data.longitude
      );

      // Determine if user is currently active (within last 5 mins)
      const lastUpdate = data.updatedAt?.toDate?.() || new Date(0);
      const isActive = Date.now() - lastUpdate.getTime() < 300000; // 5 minutes

      nearbyUsers.push({
        id: data.userId,
        username: userData.username || '',
        displayName: userData.displayName || userData.username || 'Anonym',
        avatarUrl: userData.avatarUrl,
        avatar: userData.avatar,
        distance: Math.round(distance),
        bearing: Math.round(bearing),
        level: userData.level || 1,
        trustScore: userData.trustScore || 50,
        isPremium: userData.isPremium || false,
        isActive,
        lastSeen: lastUpdate,
        isWithinRadius: true, // Always true here (filtered out otherwise)
      });
    }

    // Sort by distance (closest first)
    return nearbyUsers.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('[PrecisionRadar] Failed to fetch nearby users:', error);
    return [];
  }
};

// ═══════════════════════════════════════
// RADAR STATE MANAGEMENT
// ═══════════════════════════════════════

/**
 * Get user's radar preferences
 */
export const getRadarPreferences = async (): Promise<{
  radius: number;
  isEnabled: boolean;
}> => {
  const user = auth.currentUser;
  if (!user) {
    return { radius: RADAR_CONSTANTS.DEFAULT_RADIUS, isEnabled: true };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      return { radius: RADAR_CONSTANTS.DEFAULT_RADIUS, isEnabled: true };
    }

    const data = userDoc.data();
    return {
      radius: Math.min(data.searchRadius || RADAR_CONSTANTS.DEFAULT_RADIUS, RADAR_CONSTANTS.MAX_RADIUS),
      isEnabled: data.friendRadarEnabled !== false,
    };
  } catch {
    return { radius: RADAR_CONSTANTS.DEFAULT_RADIUS, isEnabled: true };
  }
};

/**
 * Save user's radar preferences
 */
export const saveRadarPreferences = async (
  radius: number,
  isEnabled: boolean
): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  // ENFORCE 5KM LIMIT on save
  const safeRadius = Math.min(
    Math.max(radius, RADAR_CONSTANTS.MIN_RADIUS),
    RADAR_CONSTANTS.MAX_RADIUS
  );

  try {
    await setDoc(doc(db, 'users', user.uid), {
      searchRadius: safeRadius,
      friendRadarEnabled: isEnabled,
    }, { merge: true });

    return true;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════

/**
 * Format distance for display (German locale)
 */
export const formatDistance = (meters: number): string => {
  if (meters < 50) return 'Sehr nah';
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  if (meters < 5000) return `${(meters / 1000).toFixed(1)}km`;
  return '5km+'; // Beyond radar range
};

/**
 * Get compass direction label
 */
export const getBearingLabel = (bearing: number): string => {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Get distance tier for visual representation
 */
export const getDistanceTier = (meters: number): 'immediate' | 'near' | 'mid' | 'far' | 'edge' => {
  if (meters < 100) return 'immediate';
  if (meters < 500) return 'near';
  if (meters < 1000) return 'mid';
  if (meters < 3000) return 'far';
  return 'edge';
};

export default {
  RADAR_CONSTANTS,
  calculatePreciseDistance,
  calculateBearing,
  isWithinRadarBoundary,
  getLocationOptions,
  updateUserLocation,
  fetchNearbyUsers,
  getRadarPreferences,
  saveRadarPreferences,
  formatDistance,
  getBearingLabel,
  getDistanceTier,
};
