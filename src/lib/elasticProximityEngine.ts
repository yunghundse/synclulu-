/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ELASTIC PROXIMITY ENGINE (EPE) - Patent-Level Algorithm
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mathematical Formula:
 * R(D, T) = R_min + (R_max - R_min) × e^(-k × (D_active × ω))
 *
 * Where:
 * - R_min: Minimum radius (5km - golden standard for local relevance)
 * - R_max: Maximum district radius (100km)
 * - D_active: Number of users with heartbeat (activity < 10min)
 * - k: Damping factor (controls how aggressively the bubble shrinks)
 * - ω: Relevance coefficient (based on shared interests/behavior)
 *
 * Patent Core: The system calculates not just distance, but "social reachability"
 * It's a self-regulating feedback loop ensuring constant "magic density"
 * (interactions per square kilometer)
 *
 * @author synclulu Engineering
 * @version 2.0.0 - Silicon Valley Edition
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ActiveUser {
  id: string;
  location: GeoCoordinates;
  lastHeartbeat: Date;
  interests: string[];
  activityScore: number;
}

export interface AuraState {
  center: GeoCoordinates;
  currentRadius: number;
  targetRadius: number;
  activeUsersInRange: number;
  magicDensity: number;
  isExpanding: boolean;
  nearestHotspot?: DistrictHotspot;
  expansionMessage?: string;
}

export interface DistrictHotspot {
  id: string;
  center: GeoCoordinates;
  userCount: number;
  averageActivity: number;
  distanceKm: number;
}

export interface EPEConfig {
  R_MIN: number;           // Minimum radius in km
  R_MAX: number;           // Maximum radius in km
  K_DAMPING: number;       // Damping factor
  HEARTBEAT_THRESHOLD: number; // Minutes for active status
  TARGET_MAGIC_DENSITY: number; // Ideal users per km²
  EXPANSION_STEP: number;  // Radius expansion step in km
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: EPEConfig = {
  R_MIN: 5,                // 5km - Golden standard
  R_MAX: 100,              // 100km - Maximum district
  K_DAMPING: 0.15,         // Smooth decay
  HEARTBEAT_THRESHOLD: 10, // 10 minutes
  TARGET_MAGIC_DENSITY: 3, // 3 users per km²
  EXPANSION_STEP: 2.5      // 2.5km steps
};

// ═══════════════════════════════════════════════════════════════════════════
// CORE ALGORITHM: ELASTIC PROXIMITY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate dynamic aura radius using exponential decay
 * This is the heart of the patent-level algorithm
 */
export function calculateDynamicAura(
  activeUsers: number,
  relevanceCoefficient: number = 1.0,
  config: EPEConfig = DEFAULT_CONFIG
): number {
  const { R_MIN, R_MAX, K_DAMPING } = config;

  // The magic formula: R(D, T) = R_min + (R_max - R_min) × e^(-k × (D_active × ω))
  const exponent = -K_DAMPING * (activeUsers * relevanceCoefficient);
  const radius = R_MIN + (R_MAX - R_MIN) * Math.exp(exponent);

  // Clamp to valid range
  return Math.max(R_MIN, Math.min(R_MAX, radius));
}

/**
 * Calculate relevance coefficient based on shared interests
 * Higher relevance = tighter, more focused aura
 */
export function calculateRelevanceCoefficient(
  userInterests: string[],
  nearbyUsersInterests: string[][]
): number {
  if (nearbyUsersInterests.length === 0) return 0.5;

  let totalOverlap = 0;

  for (const otherInterests of nearbyUsersInterests) {
    const overlap = userInterests.filter(i => otherInterests.includes(i)).length;
    const maxPossible = Math.max(userInterests.length, otherInterests.length);
    totalOverlap += maxPossible > 0 ? overlap / maxPossible : 0;
  }

  // Average overlap, scaled to 0.5 - 1.5 range
  const avgOverlap = totalOverlap / nearbyUsersInterests.length;
  return 0.5 + avgOverlap; // Range: 0.5 (low relevance) to 1.5 (high relevance)
}

/**
 * Calculate magic density (interactions per km²)
 */
export function calculateMagicDensity(
  activeUsers: number,
  radiusKm: number
): number {
  const areaKmSq = Math.PI * radiusKm * radiusKm;
  return areaKmSq > 0 ? activeUsers / areaKmSq : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOSPATIAL CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Haversine formula for accurate distance calculation
 */
export function calculateDistance(
  point1: GeoCoordinates,
  point2: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in km

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
    Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bounding box for efficient geo queries
 */
export function calculateBoundingBox(
  center: GeoCoordinates,
  radiusKm: number
): { north: number; south: number; east: number; west: number } {
  const latDelta = radiusKm / 111; // 1 degree ≈ 111km
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  return {
    north: center.latitude + latDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lonDelta,
    west: center.longitude - lonDelta
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ELASTIC PROXIMITY ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ElasticProximityEngine {
  private config: EPEConfig;
  private currentAura: AuraState | null = null;
  private updateCallbacks: ((aura: AuraState) => void)[] = [];

  constructor(config: Partial<EPEConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the engine with user's location
   */
  async initialize(userLocation: GeoCoordinates, userInterests: string[] = []): Promise<AuraState> {
    // Start with minimum radius
    let currentRadius = this.config.R_MIN;

    // Find active users in initial radius
    const { users, count } = await this.findActiveUsersInRadius(userLocation, currentRadius);

    // Calculate relevance coefficient
    const relevance = calculateRelevanceCoefficient(
      userInterests,
      users.map(u => u.interests)
    );

    // Calculate optimal radius
    const targetRadius = calculateDynamicAura(count, relevance, this.config);

    // Calculate magic density
    const magicDensity = calculateMagicDensity(count, currentRadius);

    // Check if we need to expand
    const isExpanding = magicDensity < this.config.TARGET_MAGIC_DENSITY;

    // Find nearest hotspot if expanding
    let nearestHotspot: DistrictHotspot | undefined;
    let expansionMessage: string | undefined;

    if (isExpanding && count < 3) {
      nearestHotspot = await this.findNearestHotspot(userLocation, currentRadius);
      if (nearestHotspot) {
        expansionMessage = `Deine Aura weitet sich aus, um Magie zu finden... (${nearestHotspot.distanceKm.toFixed(1)}km entfernt)`;
      }
    }

    this.currentAura = {
      center: userLocation,
      currentRadius,
      targetRadius,
      activeUsersInRange: count,
      magicDensity,
      isExpanding,
      nearestHotspot,
      expansionMessage
    };

    // Start expansion animation if needed
    if (isExpanding) {
      this.animateExpansion();
    }

    return this.currentAura;
  }

  /**
   * Animate radius expansion smoothly
   */
  private async animateExpansion(): Promise<void> {
    if (!this.currentAura) return;

    const { targetRadius, currentRadius } = this.currentAura;

    if (currentRadius >= targetRadius) {
      this.currentAura.isExpanding = false;
      this.notifyUpdate();
      return;
    }

    // Expand in steps
    const newRadius = Math.min(
      currentRadius + this.config.EXPANSION_STEP,
      targetRadius
    );

    this.currentAura.currentRadius = newRadius;

    // Recalculate users and density
    const { count } = await this.findActiveUsersInRadius(
      this.currentAura.center,
      newRadius
    );

    this.currentAura.activeUsersInRange = count;
    this.currentAura.magicDensity = calculateMagicDensity(count, newRadius);

    this.notifyUpdate();

    // Continue expansion if needed
    if (newRadius < targetRadius) {
      setTimeout(() => this.animateExpansion(), 500);
    } else {
      this.currentAura.isExpanding = false;
      this.currentAura.expansionMessage = undefined;
      this.notifyUpdate();
    }
  }

  /**
   * Find active users within radius
   */
  async findActiveUsersInRadius(
    center: GeoCoordinates,
    radiusKm: number
  ): Promise<{ users: ActiveUser[]; count: number }> {
    try {
      const heartbeatThreshold = new Date();
      heartbeatThreshold.setMinutes(
        heartbeatThreshold.getMinutes() - this.config.HEARTBEAT_THRESHOLD
      );

      const bbox = calculateBoundingBox(center, radiusKm);

      // Query Firestore with bounding box (efficient geo query)
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('isActive', '==', true),
        where('location.latitude', '>=', bbox.south),
        where('location.latitude', '<=', bbox.north)
      );

      const snapshot = await getDocs(q);

      const users: ActiveUser[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.location) return;

        const userLocation: GeoCoordinates = {
          latitude: data.location.latitude,
          longitude: data.location.longitude
        };

        // Check longitude (can't do compound geo query in Firestore)
        if (userLocation.longitude < bbox.west || userLocation.longitude > bbox.east) {
          return;
        }

        // Check actual distance (more accurate than bounding box)
        const distance = calculateDistance(center, userLocation);
        if (distance > radiusKm) return;

        // Check heartbeat
        const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
        if (lastSeen < heartbeatThreshold) return;

        users.push({
          id: doc.id,
          location: userLocation,
          lastHeartbeat: lastSeen,
          interests: data.interests || [],
          activityScore: data.activityScore || 0
        });
      });

      return { users, count: users.length };
    } catch (error) {
      console.error('Error finding active users:', error);
      return { users: [], count: 0 };
    }
  }

  /**
   * Find nearest activity hotspot for expansion tunneling
   */
  async findNearestHotspot(
    center: GeoCoordinates,
    currentRadius: number
  ): Promise<DistrictHotspot | undefined> {
    try {
      // Search in expanded radius for clusters
      const searchRadius = Math.min(currentRadius * 3, this.config.R_MAX);
      const { users } = await this.findActiveUsersInRadius(center, searchRadius);

      if (users.length < 2) return undefined;

      // Simple clustering: find centroid of user clusters
      const clusters = this.clusterUsers(users);

      if (clusters.length === 0) return undefined;

      // Find nearest cluster
      let nearest: DistrictHotspot | undefined;
      let minDistance = Infinity;

      for (const cluster of clusters) {
        const distance = calculateDistance(center, cluster.center);
        if (distance > currentRadius && distance < minDistance) {
          minDistance = distance;
          nearest = {
            id: `cluster-${cluster.center.latitude.toFixed(4)}-${cluster.center.longitude.toFixed(4)}`,
            center: cluster.center,
            userCount: cluster.users.length,
            averageActivity: cluster.users.reduce((sum, u) => sum + u.activityScore, 0) / cluster.users.length,
            distanceKm: distance
          };
        }
      }

      return nearest;
    } catch (error) {
      console.error('Error finding hotspot:', error);
      return undefined;
    }
  }

  /**
   * Simple k-means style clustering
   */
  private clusterUsers(users: ActiveUser[]): { center: GeoCoordinates; users: ActiveUser[] }[] {
    if (users.length < 3) return [];

    const clusters: { center: GeoCoordinates; users: ActiveUser[] }[] = [];
    const assigned = new Set<string>();
    const clusterRadius = 2; // 2km cluster radius

    for (const user of users) {
      if (assigned.has(user.id)) continue;

      const clusterUsers = users.filter(u => {
        if (assigned.has(u.id)) return false;
        return calculateDistance(user.location, u.location) <= clusterRadius;
      });

      if (clusterUsers.length >= 2) {
        // Calculate centroid
        const center: GeoCoordinates = {
          latitude: clusterUsers.reduce((sum, u) => sum + u.location.latitude, 0) / clusterUsers.length,
          longitude: clusterUsers.reduce((sum, u) => sum + u.location.longitude, 0) / clusterUsers.length
        };

        clusters.push({ center, users: clusterUsers });
        clusterUsers.forEach(u => assigned.add(u.id));
      }
    }

    return clusters;
  }

  /**
   * Subscribe to aura updates
   */
  onUpdate(callback: (aura: AuraState) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyUpdate(): void {
    if (this.currentAura) {
      this.updateCallbacks.forEach(cb => cb(this.currentAura!));
    }
  }

  /**
   * Get current aura state
   */
  getAuraState(): AuraState | null {
    return this.currentAura;
  }

  /**
   * Update user location and recalculate
   */
  async updateLocation(newLocation: GeoCoordinates, userInterests: string[] = []): Promise<AuraState> {
    return this.initialize(newLocation, userInterests);
  }

  /**
   * Force recalculation
   */
  async recalculate(): Promise<AuraState | null> {
    if (!this.currentAura) return null;
    return this.initialize(this.currentAura.center);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export const proximityEngine = new ElasticProximityEngine();

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

export function useElasticProximity(
  userLocation: GeoCoordinates | null,
  userInterests: string[] = []
) {
  const [aura, setAura] = useState<AuraState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    proximityEngine.initialize(userLocation, userInterests)
      .then(state => {
        setAura(state);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });

    const unsubscribe = proximityEngine.onUpdate(setAura);

    return () => {
      unsubscribe();
    };
  }, [userLocation?.latitude, userLocation?.longitude]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await proximityEngine.recalculate();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { aura, isLoading, error, refresh };
}
