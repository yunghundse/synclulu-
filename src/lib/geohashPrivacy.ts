/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GEOHASH PRIVACY LAYER - Privacy-by-Design Location System
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Uses H3 Hexagonal Hierarchical Spatial Index (Uber) style approach
 * for ultra-fast geofencing without exposing exact coordinates.
 *
 * PATENT CORE: Exact coordinates are NEVER compared directly.
 * Only geohash cells are matched, ensuring privacy at the protocol level.
 *
 * @author synclulu Engineering
 * @version 2.0.0
 */

import { GeoCoordinates } from './elasticProximityEngine';

// ═══════════════════════════════════════════════════════════════════════════
// GEOHASH ENCODING (Base32)
// ═══════════════════════════════════════════════════════════════════════════

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode coordinates to geohash string
 * Precision levels:
 * 1 = ~5000km, 2 = ~1250km, 3 = ~156km, 4 = ~39km, 5 = ~4.9km
 * 6 = ~1.2km, 7 = ~153m, 8 = ~38m, 9 = ~4.8m
 */
export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision: number = 7
): string {
  let latRange = [-90, 90];
  let lonRange = [-180, 180];
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lonRange[0] = mid;
      } else {
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    even = !even;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Decode geohash to bounding box
 */
export function decodeGeohash(hash: string): {
  latitude: { min: number; max: number };
  longitude: { min: number; max: number };
  center: GeoCoordinates;
} {
  let latRange = [-90, 90];
  let lonRange = [-180, 180];
  let even = true;

  for (const c of hash) {
    const cd = BASE32.indexOf(c);
    for (let i = 4; i >= 0; i--) {
      const bit = (cd >> i) & 1;
      if (even) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (bit) {
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bit) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      even = !even;
    }
  }

  return {
    latitude: { min: latRange[0], max: latRange[1] },
    longitude: { min: lonRange[0], max: lonRange[1] },
    center: {
      latitude: (latRange[0] + latRange[1]) / 2,
      longitude: (lonRange[0] + lonRange[1]) / 2
    }
  };
}

/**
 * Get all neighboring geohash cells (8 directions + center)
 */
export function getNeighbors(hash: string): string[] {
  const decoded = decodeGeohash(hash);
  const { center } = decoded;
  const precision = hash.length;

  // Calculate cell size
  const latDelta = (decoded.latitude.max - decoded.latitude.min);
  const lonDelta = (decoded.longitude.max - decoded.longitude.min);

  const neighbors: string[] = [hash]; // Include center

  // 8 directional neighbors
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  for (const [latDir, lonDir] of directions) {
    const newLat = center.latitude + (latDir * latDelta);
    const newLon = center.longitude + (lonDir * lonDelta);

    if (newLat >= -90 && newLat <= 90 && newLon >= -180 && newLon <= 180) {
      neighbors.push(encodeGeohash(newLat, newLon, precision));
    }
  }

  return [...new Set(neighbors)]; // Remove duplicates
}

// ═══════════════════════════════════════════════════════════════════════════
// H3-STYLE HEXAGONAL CELLS (Simplified Implementation)
// ═══════════════════════════════════════════════════════════════════════════

export interface HexCell {
  id: string;
  center: GeoCoordinates;
  resolution: number;
  vertices: GeoCoordinates[];
}

/**
 * Generate hexagonal cell ID for a location
 * Resolution: 0 (largest) to 15 (smallest)
 * - Res 5: ~252km² average area
 * - Res 7: ~5.2km² average area (good for city districts)
 * - Res 9: ~0.1km² average area (neighborhood level)
 */
export function getHexCellId(
  latitude: number,
  longitude: number,
  resolution: number = 7
): string {
  // Simplified hex cell ID using modified geohash
  const baseHash = encodeGeohash(latitude, longitude, Math.ceil(resolution / 2) + 3);

  // Add resolution prefix for hierarchical indexing
  return `h${resolution}_${baseHash}`;
}

/**
 * Get all hex cells within a radius
 */
export function getHexCellsInRadius(
  center: GeoCoordinates,
  radiusKm: number,
  resolution: number = 7
): string[] {
  const cells: Set<string> = new Set();

  // Calculate step size based on resolution
  const stepKm = getHexCellRadiusKm(resolution);
  const steps = Math.ceil(radiusKm / stepKm);

  // Spiral outward from center
  cells.add(getHexCellId(center.latitude, center.longitude, resolution));

  for (let ring = 1; ring <= steps; ring++) {
    const ringCells = getHexRing(center, ring * stepKm, resolution);
    ringCells.forEach(cell => cells.add(cell));
  }

  return Array.from(cells);
}

/**
 * Get hex cells in a ring at specified distance
 */
function getHexRing(
  center: GeoCoordinates,
  distanceKm: number,
  resolution: number
): string[] {
  const cells: string[] = [];
  const points = 12; // 12 points around the ring

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = center.latitude + (distanceKm / 111) * Math.cos(angle);
    const lon = center.longitude + (distanceKm / (111 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(angle);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      cells.push(getHexCellId(lat, lon, resolution));
    }
  }

  return cells;
}

/**
 * Get approximate radius of a hex cell in km
 */
function getHexCellRadiusKm(resolution: number): number {
  // Approximate cell sizes (based on H3 specs)
  const sizes: Record<number, number> = {
    0: 1107, 1: 418, 2: 158, 3: 60, 4: 22.6,
    5: 8.5, 6: 3.2, 7: 1.2, 8: 0.46, 9: 0.17,
    10: 0.065, 11: 0.024, 12: 0.009
  };
  return sizes[resolution] || 1.2;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY-PRESERVING LOCATION MATCHING
// ═══════════════════════════════════════════════════════════════════════════

export interface PrivacyLocation {
  hexCell: string;
  geohash: string;
  fuzzyCenter: GeoCoordinates;
  precision: 'district' | 'neighborhood' | 'block';
}

/**
 * Convert exact location to privacy-preserving format
 * The exact coordinates are NEVER stored or transmitted
 */
export function toPrivacyLocation(
  latitude: number,
  longitude: number,
  precision: 'district' | 'neighborhood' | 'block' = 'neighborhood'
): PrivacyLocation {
  const precisionMap = {
    district: { geohash: 4, hexRes: 5 },      // ~25km
    neighborhood: { geohash: 6, hexRes: 7 },  // ~1km
    block: { geohash: 7, hexRes: 9 }          // ~150m
  };

  const { geohash: ghPrecision, hexRes } = precisionMap[precision];

  const geohash = encodeGeohash(latitude, longitude, ghPrecision);
  const hexCell = getHexCellId(latitude, longitude, hexRes);
  const decoded = decodeGeohash(geohash);

  return {
    hexCell,
    geohash,
    fuzzyCenter: decoded.center,
    precision
  };
}

/**
 * Check if two privacy locations are "near" each other
 * WITHOUT comparing exact coordinates
 */
export function areLocationsNear(
  loc1: PrivacyLocation,
  loc2: PrivacyLocation
): boolean {
  // Same hex cell = definitely near
  if (loc1.hexCell === loc2.hexCell) return true;

  // Check geohash prefix match
  const commonPrefix = getCommonPrefix(loc1.geohash, loc2.geohash);

  // At least 4 characters match = within ~40km
  // At least 5 characters match = within ~5km
  // At least 6 characters match = within ~1km
  return commonPrefix.length >= 5;
}

function getCommonPrefix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return a.slice(0, i);
}

/**
 * Find users in same or adjacent cells (privacy-preserving query)
 */
export function findUsersInPrivacyRadius(
  userLocation: PrivacyLocation,
  allUserLocations: { id: string; location: PrivacyLocation }[]
): string[] {
  // Get neighboring cells
  const geohashNeighbors = getNeighbors(userLocation.geohash);
  const hexCellsInRange = getHexCellsInRadius(
    userLocation.fuzzyCenter,
    2, // 2km radius
    7  // resolution 7
  );

  const nearbyUserIds: string[] = [];

  for (const user of allUserLocations) {
    // Check geohash match
    const geohashMatch = geohashNeighbors.some(gh =>
      user.location.geohash.startsWith(gh.slice(0, -1))
    );

    // Check hex cell match
    const hexMatch = hexCellsInRange.includes(user.location.hexCell);

    if (geohashMatch || hexMatch) {
      nearbyUserIds.push(user.id);
    }
  }

  return nearbyUserIds;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';

/**
 * Update user's privacy location in Firestore
 */
export async function updateUserPrivacyLocation(
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const privacyLocation = toPrivacyLocation(latitude, longitude, 'neighborhood');

  await updateDoc(doc(db, 'users', userId), {
    privacyLocation: {
      hexCell: privacyLocation.hexCell,
      geohash: privacyLocation.geohash,
      // NOTE: We store fuzzy center, NOT exact coordinates
      fuzzyLat: privacyLocation.fuzzyCenter.latitude,
      fuzzyLon: privacyLocation.fuzzyCenter.longitude,
      precision: privacyLocation.precision,
      updatedAt: new Date()
    }
  });
}

/**
 * Find nearby users using privacy-preserving query
 */
export async function findNearbyUsersPrivate(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<{ id: string; hexCell: string; distance: 'same' | 'near' | 'far' }[]> {
  const userLocation = toPrivacyLocation(latitude, longitude, 'neighborhood');
  const searchCells = getHexCellsInRadius({ latitude, longitude }, radiusKm, 7);

  const usersRef = collection(db, 'users');

  // Query by hex cells (efficient indexed query)
  const q = query(
    usersRef,
    where('privacyLocation.hexCell', 'in', searchCells.slice(0, 10)) // Firestore limit
  );

  const snapshot = await getDocs(q);
  const results: { id: string; hexCell: string; distance: 'same' | 'near' | 'far' }[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const userHex = data.privacyLocation?.hexCell;

    if (!userHex) return;

    let distance: 'same' | 'near' | 'far' = 'far';

    if (userHex === userLocation.hexCell) {
      distance = 'same';
    } else if (searchCells.slice(0, 9).includes(userHex)) {
      distance = 'near';
    }

    results.push({
      id: doc.id,
      hexCell: userHex,
      distance
    });
  });

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK FOR PRIVACY LOCATION
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

export function usePrivacyLocation(exactLocation: GeoCoordinates | null) {
  const [privacyLocation, setPrivacyLocation] = useState<PrivacyLocation | null>(null);

  useEffect(() => {
    if (!exactLocation) {
      setPrivacyLocation(null);
      return;
    }

    const pl = toPrivacyLocation(
      exactLocation.latitude,
      exactLocation.longitude,
      'neighborhood'
    );

    setPrivacyLocation(pl);
  }, [exactLocation?.latitude, exactLocation?.longitude]);

  return privacyLocation;
}
