/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE RADAR SERVICE - Uber/Snapchat Grade Location Tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * High-precision real-time location tracking with:
 * - watchPosition for continuous updates (every 10s or 5m movement)
 * - Battery-optimized high-accuracy GPS
 * - Founder Omnipresence (Ghost Mode / Sovereign View)
 * - Premium sync with higher refresh rates
 * - Distance-based blur/precision visualization
 *
 * @author Senior Geospatial Engineer (Uber + Snapchat)
 * @version 1.0.0
 */

import { doc, setDoc, onSnapshot, serverTimestamp, GeoPoint, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = import.meta.env.VITE_FOUNDER_ID || 'MIbamchs82Ve7y0ecX2TpPyymbw1';

export const RADAR_CONFIG = {
  // Update intervals (milliseconds)
  UPDATE_INTERVAL_PREMIUM: 5000,    // 5s for premium users
  UPDATE_INTERVAL_STANDARD: 10000,  // 10s for standard users
  UPDATE_INTERVAL_BACKGROUND: 30000, // 30s when backgrounded

  // Movement threshold (meters) - update if moved more than this
  MOVEMENT_THRESHOLD: 5,

  // GPS Options
  GPS_TIMEOUT: 15000,
  GPS_MAX_AGE: 0, // Always fresh position

  // Visibility tiers (meters)
  TIER_IMMEDIATE: 100,    // < 100m = Sharp, full visibility
  TIER_NEAR: 500,         // < 500m = Slight blur
  TIER_MEDIUM: 1000,      // < 1km = Medium blur
  TIER_FAR: 3000,         // < 3km = Heavy blur
  TIER_EDGE: 5000,        // < 5km = Maximum blur (standard)

  // Radius by tier
  RADIUS_FOUNDER: 40000000,  // 40,000km = Global
  RADIUS_ADMIN: 40000000,    // Global
  RADIUS_PREMIUM: 15000,     // 15km
  RADIUS_STANDARD: 5000,     // 5km

  // Earth radius for calculations
  EARTH_RADIUS: 6371000, // meters
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface LiveLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

export interface RadarUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  distance: number;           // meters
  bearing: number;            // 0-360 degrees
  distanceLabel: string;      // "150m", "1.2km"
  blurLevel: number;          // 0 = sharp, 1 = max blur
  opacity: number;            // 0-1 visibility
  tier: VisibilityTier;
  isActive: boolean;          // active in last 5 min
  isPremium: boolean;
  isVerified: boolean;
  isFounder: boolean;
  level: number;
  lastSeen: Date;
  position: { x: number; y: number }; // Radar position (normalized 0-1)
}

export type VisibilityTier = 'immediate' | 'near' | 'medium' | 'far' | 'edge' | 'hidden';

export interface FounderMode {
  ghostMode: boolean;        // Founder invisible but sees all
  sovereignView: boolean;    // See users regardless of their privacy
  globalReach: boolean;      // No distance limit
}

export interface TrackerState {
  isTracking: boolean;
  currentLocation: LiveLocation | null;
  lastUpdate: Date | null;
  watchId: number | null;
  error: string | null;
  batteryMode: 'high' | 'balanced' | 'low';
  isPremium: boolean;
  isFounder: boolean;
  founderMode: FounderMode;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE (High Precision)
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = RADAR_CONFIG.EARTH_RADIUS;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate compass bearing from point A to point B
 * Returns degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(x, y);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISIBILITY & BLUR CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get visibility tier based on distance
 */
export function getVisibilityTier(distanceMeters: number): VisibilityTier {
  if (distanceMeters < RADAR_CONFIG.TIER_IMMEDIATE) return 'immediate';
  if (distanceMeters < RADAR_CONFIG.TIER_NEAR) return 'near';
  if (distanceMeters < RADAR_CONFIG.TIER_MEDIUM) return 'medium';
  if (distanceMeters < RADAR_CONFIG.TIER_FAR) return 'far';
  if (distanceMeters < RADAR_CONFIG.TIER_EDGE) return 'edge';
  return 'hidden';
}

/**
 * Calculate blur level (0 = sharp, 1 = max blur)
 * Uses smooth exponential curve
 */
export function calculateBlurLevel(distanceMeters: number, maxRadius: number): number {
  if (distanceMeters < RADAR_CONFIG.TIER_IMMEDIATE) return 0;

  // Smooth exponential blur curve
  const normalizedDistance = distanceMeters / maxRadius;
  const blur = Math.min(1, Math.pow(normalizedDistance, 0.7));

  return blur;
}

/**
 * Calculate opacity (1 = fully visible, 0 = invisible)
 * Users fade out as they approach the edge
 */
export function calculateOpacity(distanceMeters: number, maxRadius: number): number {
  if (distanceMeters < RADAR_CONFIG.TIER_FAR) return 1;

  // Fade out in the last 40% of radius
  const fadeStart = maxRadius * 0.6;
  if (distanceMeters < fadeStart) return 1;

  const fadeProgress = (distanceMeters - fadeStart) / (maxRadius - fadeStart);
  return Math.max(0.3, 1 - fadeProgress * 0.7);
}

/**
 * Format distance for display (German)
 */
export function formatDistanceLabel(meters: number): string {
  if (meters < 50) return 'Direkt hier';
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSITION TO RADAR COORDINATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert distance + bearing to radar position (x, y in range 0-1)
 * Center of radar is (0.5, 0.5)
 */
export function toRadarPosition(
  distance: number,
  bearing: number,
  maxRadius: number
): { x: number; y: number } {
  // Normalize distance to 0-0.45 (leave margin at edge)
  const normalizedDistance = Math.min(0.45, (distance / maxRadius) * 0.45);

  // Convert bearing to radians (0 = up/north)
  const radians = ((bearing - 90) * Math.PI) / 180;

  // Calculate position
  const x = 0.5 + normalizedDistance * Math.cos(radians);
  const y = 0.5 + normalizedDistance * Math.sin(radians);

  return { x, y };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE RADAR SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class LiveRadarService {
  private state: TrackerState = {
    isTracking: false,
    currentLocation: null,
    lastUpdate: null,
    watchId: null,
    error: null,
    batteryMode: 'balanced',
    isPremium: false,
    isFounder: false,
    founderMode: {
      ghostMode: false,
      sovereignView: false,
      globalReach: true,
    },
  };

  private listeners: Set<(state: TrackerState) => void> = new Set();
  private nearbyListeners: Set<(users: RadarUser[]) => void> = new Set();
  private lastPosition: GeolocationPosition | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private nearbyUnsubscribe: (() => void) | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialize the tracker with user context
   */
  async initialize(userId: string, isPremium: boolean, role: string): Promise<void> {
    const isFounder = userId === FOUNDER_UID || role === 'founder';
    const isAdmin = role === 'admin';

    this.state = {
      ...this.state,
      isPremium,
      isFounder,
      founderMode: {
        ghostMode: false,
        sovereignView: isFounder || isAdmin,
        globalReach: isFounder || isAdmin,
      },
    };

    this.notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH-PRECISION GPS TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start continuous location tracking with watchPosition
   * Updates every 10s OR when moved > 5m
   */
  startTracking(): void {
    if (this.state.isTracking || !navigator.geolocation) {
      console.warn('[LiveRadar] Already tracking or geolocation unavailable');
      return;
    }

    console.log('[LiveRadar] 🛰️ Starting high-precision tracking...');

    // Start watchPosition with HIGH ACCURACY
    const watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: true,  // Use GPS, not cell towers
        timeout: RADAR_CONFIG.GPS_TIMEOUT,
        maximumAge: RADAR_CONFIG.GPS_MAX_AGE,
      }
    );

    this.state = {
      ...this.state,
      isTracking: true,
      watchId,
      error: null,
    };

    // Start periodic update timer (for Firestore sync)
    this.startUpdateTimer();

    this.notifyListeners();
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    if (this.state.watchId !== null) {
      navigator.geolocation.clearWatch(this.state.watchId);
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.nearbyUnsubscribe) {
      this.nearbyUnsubscribe();
      this.nearbyUnsubscribe = null;
    }

    this.state = {
      ...this.state,
      isTracking: false,
      watchId: null,
    };

    this.notifyListeners();
    console.log('[LiveRadar] 🛑 Tracking stopped');
  }

  /**
   * Handle new position from watchPosition
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;

    // Check if moved significantly (> 5m)
    if (this.lastPosition) {
      const moved = calculateHaversineDistance(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        latitude,
        longitude
      );

      // Only update if moved > threshold OR enough time passed
      const timeSinceLastUpdate = this.state.lastUpdate
        ? Date.now() - this.state.lastUpdate.getTime()
        : Infinity;

      const updateInterval = this.state.isPremium
        ? RADAR_CONFIG.UPDATE_INTERVAL_PREMIUM
        : RADAR_CONFIG.UPDATE_INTERVAL_STANDARD;

      if (moved < RADAR_CONFIG.MOVEMENT_THRESHOLD && timeSinceLastUpdate < updateInterval) {
        return; // Skip update - hasn't moved enough
      }
    }

    this.lastPosition = position;

    const location: LiveLocation = {
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      timestamp: new Date(),
    };

    this.state = {
      ...this.state,
      currentLocation: location,
      lastUpdate: new Date(),
      error: null,
    };

    // Sync to Firestore (unless in Ghost Mode)
    if (!this.state.founderMode.ghostMode) {
      this.syncLocationToFirestore(location);
    }

    this.notifyListeners();
    console.log(`[LiveRadar] 📍 Position updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy.toFixed(0)}m)`);
  }

  /**
   * Handle GPS errors
   */
  private handlePositionError(error: GeolocationPositionError): void {
    let errorMessage: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Standort-Berechtigung verweigert';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Standort nicht verfügbar';
        break;
      case error.TIMEOUT:
        errorMessage = 'Standort-Timeout';
        break;
      default:
        errorMessage = 'Unbekannter Standort-Fehler';
    }

    this.state = {
      ...this.state,
      error: errorMessage,
    };

    this.notifyListeners();
    console.error('[LiveRadar] ❌ GPS Error:', errorMessage);
  }

  /**
   * Start periodic timer for Firestore sync
   */
  private startUpdateTimer(): void {
    if (this.updateTimer) clearInterval(this.updateTimer);

    const interval = this.state.isPremium
      ? RADAR_CONFIG.UPDATE_INTERVAL_PREMIUM
      : RADAR_CONFIG.UPDATE_INTERVAL_STANDARD;

    this.updateTimer = setInterval(() => {
      if (this.state.currentLocation && !this.state.founderMode.ghostMode) {
        this.syncLocationToFirestore(this.state.currentLocation);
      }
    }, interval);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIRESTORE SYNC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sync location to Firestore for nearby discovery
   */
  private async syncLocationToFirestore(location: LiveLocation): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'user_locations', user.uid), {
        userId: user.uid,
        latitude: location.latitude,
        longitude: location.longitude,
        geopoint: new GeoPoint(location.latitude, location.longitude),
        accuracy: location.accuracy,
        altitude: location.altitude,
        heading: location.heading,
        speed: location.speed,
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)), // 15 min expiry
        isVisible: true,
        isActive: true,
      });
    } catch (error) {
      console.error('[LiveRadar] Failed to sync location:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDER MODE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Toggle Ghost Mode (founder invisible but sees all)
   */
  setGhostMode(enabled: boolean): void {
    if (!this.state.isFounder) {
      console.warn('[LiveRadar] Ghost Mode only available for Founder');
      return;
    }

    this.state = {
      ...this.state,
      founderMode: {
        ...this.state.founderMode,
        ghostMode: enabled,
      },
    };

    // If enabling ghost mode, remove location from Firestore
    if (enabled) {
      this.removeLocationFromFirestore();
    }

    this.notifyListeners();
    console.log(`[LiveRadar] 👻 Ghost Mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Remove location from Firestore (for ghost mode)
   */
  private async removeLocationFromFirestore(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'user_locations', user.uid), {
        isVisible: false,
        isActive: false,
      }, { merge: true });
    } catch (error) {
      console.error('[LiveRadar] Failed to remove location:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET NEARBY USERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's search radius based on tier
   */
  getSearchRadius(): number {
    if (this.state.isFounder || this.state.founderMode.globalReach) {
      return RADAR_CONFIG.RADIUS_FOUNDER;
    }
    if (this.state.isPremium) {
      return RADAR_CONFIG.RADIUS_PREMIUM;
    }
    return RADAR_CONFIG.RADIUS_STANDARD;
  }

  /**
   * Fetch nearby users for radar display
   */
  async getNearbyUsers(): Promise<RadarUser[]> {
    const user = auth.currentUser;
    if (!user || !this.state.currentLocation) return [];

    const { latitude, longitude } = this.state.currentLocation;
    const radius = this.getSearchRadius();

    try {
      // Calculate bounding box for Firestore query
      const latDelta = (radius / RADAR_CONFIG.EARTH_RADIUS) * (180 / Math.PI);
      const lonDelta = latDelta / Math.cos((latitude * Math.PI) / 180);

      const locationsRef = collection(db, 'user_locations');
      const q = query(
        locationsRef,
        where('isVisible', '==', true),
        where('latitude', '>=', latitude - latDelta),
        where('latitude', '<=', latitude + latDelta)
      );

      const snapshot = await getDocs(q);
      const nearbyUsers: RadarUser[] = [];

      for (const locationDoc of snapshot.docs) {
        const data = locationDoc.data();

        // Skip self (unless testing)
        if (data.userId === user.uid) continue;

        // Check longitude (Firestore limitation)
        if (data.longitude < longitude - lonDelta || data.longitude > longitude + lonDelta) continue;

        // Calculate precise distance
        const distance = calculateHaversineDistance(
          latitude,
          longitude,
          data.latitude,
          data.longitude
        );

        // Check if within radius
        if (distance > radius) continue;

        // Calculate bearing
        const bearing = calculateBearing(latitude, longitude, data.latitude, data.longitude);

        // Get visibility tier
        const tier = getVisibilityTier(distance);
        if (tier === 'hidden') continue;

        // Calculate blur and opacity
        const blurLevel = calculateBlurLevel(distance, radius);
        const opacity = calculateOpacity(distance, radius);

        // Calculate radar position
        const position = toRadarPosition(distance, bearing, radius);

        // Fetch user profile
        const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.userId)));
        if (userDoc.empty) continue;

        const userData = userDoc.docs[0].data();

        // Check if active (last 5 min)
        const lastUpdate = data.updatedAt?.toDate?.() || new Date(0);
        const isActive = Date.now() - lastUpdate.getTime() < 5 * 60 * 1000;

        // Founder always first
        const isUserFounder = data.userId === FOUNDER_UID;

        nearbyUsers.push({
          id: data.userId,
          username: userData.username || 'unknown',
          displayName: userData.displayName || 'Anonym',
          avatarUrl: userData.avatarUrl || null,
          distance,
          bearing,
          distanceLabel: formatDistanceLabel(distance),
          blurLevel,
          opacity,
          tier,
          isActive,
          isPremium: userData.isPremium || false,
          isVerified: userData.isVerified || false,
          isFounder: isUserFounder,
          level: userData.level || 1,
          lastSeen: lastUpdate,
          position,
        });
      }

      // Sort: Founder first, then by distance
      nearbyUsers.sort((a, b) => {
        if (a.isFounder && !b.isFounder) return -1;
        if (!a.isFounder && b.isFounder) return 1;
        return a.distance - b.distance;
      });

      return nearbyUsers;
    } catch (error) {
      console.error('[LiveRadar] Failed to get nearby users:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: TrackerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Immediate callback
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to nearby users changes
   */
  subscribeToNearbyUsers(listener: (users: RadarUser[]) => void): () => void {
    this.nearbyListeners.add(listener);

    // Fetch initial
    this.getNearbyUsers().then(listener);

    // Set up Firestore subscription
    if (!this.nearbyUnsubscribe && this.state.currentLocation) {
      this.setupNearbySubscription();
    }

    return () => this.nearbyListeners.delete(listener);
  }

  /**
   * Set up real-time Firestore subscription for nearby users
   */
  private setupNearbySubscription(): void {
    if (!this.state.currentLocation) return;

    const { latitude } = this.state.currentLocation;
    const radius = this.getSearchRadius();
    const latDelta = (radius / RADAR_CONFIG.EARTH_RADIUS) * (180 / Math.PI);

    const locationsRef = collection(db, 'user_locations');
    const q = query(
      locationsRef,
      where('isVisible', '==', true),
      where('latitude', '>=', latitude - latDelta),
      where('latitude', '<=', latitude + latDelta)
    );

    this.nearbyUnsubscribe = onSnapshot(q, async () => {
      const users = await this.getNearbyUsers();
      this.nearbyListeners.forEach(listener => listener(users));
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  getState(): TrackerState {
    return this.state;
  }

  getCurrentLocation(): LiveLocation | null {
    return this.state.currentLocation;
  }

  isFounder(): boolean {
    return this.state.isFounder;
  }

  isGhostMode(): boolean {
    return this.state.founderMode.ghostMode;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const liveRadar = new LiveRadarService();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to access live radar state
 */
export function useLiveRadar() {
  const [state, setState] = useState<TrackerState>(liveRadar.getState());

  useEffect(() => {
    return liveRadar.subscribe(setState);
  }, []);

  const startTracking = useCallback(() => liveRadar.startTracking(), []);
  const stopTracking = useCallback(() => liveRadar.stopTracking(), []);
  const setGhostMode = useCallback((enabled: boolean) => liveRadar.setGhostMode(enabled), []);

  return {
    ...state,
    startTracking,
    stopTracking,
    setGhostMode,
    searchRadius: liveRadar.getSearchRadius(),
  };
}

/**
 * Hook to get nearby users for radar display
 */
export function useNearbyRadarUsers() {
  const [users, setUsers] = useState<RadarUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = liveRadar.subscribeToNearbyUsers((nearbyUsers) => {
      setUsers(nearbyUsers);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const nearbyUsers = await liveRadar.getNearbyUsers();
    setUsers(nearbyUsers);
    setIsLoading(false);
  }, []);

  return { users, isLoading, refresh };
}

export default liveRadar;
