/**
 * activityTracker.ts
 * 📍 ACTIVITY TRACKING SYSTEM - Location-based presence tracking
 *
 * Features:
 * - Tracks time spent in different locations/clouds
 * - Updates sync rate based on voice activity
 * - Privacy-respecting (only tracks during active sync)
 * - Battery-efficient (piggybacks on existing sync events)
 *
 * Firebase Structure:
 * users/{userId}/activity_meta/{locationName}:
 *   - timeSpent: number (minutes)
 *   - syncRate: number (percentage 0-100)
 *   - lastVisit: timestamp
 *   - visitCount: number
 *
 * @version 1.0.0
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ActivityLocation {
  name: string;
  timeSpent: number; // in minutes
  syncRate: number; // percentage 0-100
  lastVisit: number; // timestamp
  visitCount: number;
}

export interface ActivityMeta {
  totalTimeInSync: number; // total minutes across all locations
  favoriteLocation?: string;
  uniqueLocationsVisited: number;
  lastActiveTimestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log sync activity when user joins or participates in a sync
 * Call this when:
 * - User joins a voice room
 * - User creates a sync
 * - Periodic heartbeat during active sync (every 5 minutes)
 */
export const logSyncActivity = async (
  userId: string,
  locationName: string,
  minutesSpent: number = 1
): Promise<void> => {
  if (!userId || !locationName) return;

  try {
    const activityRef = doc(db, 'users', userId, 'activity_meta', locationName);
    const activitySnap = await getDoc(activityRef);

    if (activitySnap.exists()) {
      // Update existing location
      await updateDoc(activityRef, {
        timeSpent: increment(minutesSpent),
        lastVisit: serverTimestamp(),
        visitCount: increment(1),
      });
    } else {
      // Create new location entry
      await setDoc(activityRef, {
        timeSpent: minutesSpent,
        syncRate: 100, // Start with 100%, will be calculated over time
        lastVisit: serverTimestamp(),
        visitCount: 1,
        createdAt: serverTimestamp(),
      });
    }

    // Update user's total activity meta
    await updateUserActivityMeta(userId, locationName, minutesSpent);
  } catch (error) {
    console.error('[ActivityTracker] Failed to log activity:', error);
  }
};

/**
 * Update the sync rate for a location based on successful syncs
 * Call this after a voice call ends
 */
export const updateSyncRate = async (
  userId: string,
  locationName: string,
  wasSuccessful: boolean
): Promise<void> => {
  if (!userId || !locationName) return;

  try {
    const activityRef = doc(db, 'users', userId, 'activity_meta', locationName);
    const activitySnap = await getDoc(activityRef);

    if (activitySnap.exists()) {
      const data = activitySnap.data();
      const currentRate = data.syncRate || 100;
      const visitCount = data.visitCount || 1;

      // Calculate new sync rate (weighted average)
      // More visits = more stable rate
      const weight = Math.min(visitCount, 10) / 10;
      const successValue = wasSuccessful ? 100 : 0;
      const newRate = Math.round(currentRate * weight + successValue * (1 - weight));

      await updateDoc(activityRef, {
        syncRate: Math.max(0, Math.min(100, newRate)),
      });
    }
  } catch (error) {
    console.error('[ActivityTracker] Failed to update sync rate:', error);
  }
};

/**
 * Update the user's overall activity metadata
 */
const updateUserActivityMeta = async (
  userId: string,
  locationName: string,
  minutesSpent: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentTopLocations = data.topLocations || [];

      // Add new location if not already in top locations
      if (!currentTopLocations.includes(locationName)) {
        const updatedLocations = [...currentTopLocations, locationName].slice(-10); // Keep last 10
        await updateDoc(userRef, {
          topLocations: updatedLocations,
        });
      }

      // Update total time in sync
      await updateDoc(userRef, {
        totalTimeInSync: increment(minutesSpent),
        lastActiveTimestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[ActivityTracker] Failed to update user meta:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY RETRIEVAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get top locations for a user
 */
export const getTopLocations = async (
  userId: string,
  maxResults: number = 5
): Promise<ActivityLocation[]> => {
  try {
    const activityRef = collection(db, 'users', userId, 'activity_meta');
    const q = query(activityRef, orderBy('timeSpent', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);

    const locations: ActivityLocation[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        name: doc.id,
        timeSpent: data.timeSpent || 0,
        syncRate: data.syncRate || 0,
        lastVisit: data.lastVisit?.toMillis?.() || Date.now(),
        visitCount: data.visitCount || 0,
      });
    });

    return locations;
  } catch (error) {
    console.error('[ActivityTracker] Failed to get top locations:', error);
    return [];
  }
};

/**
 * Get activity summary for a user
 */
export const getActivitySummary = async (
  userId: string
): Promise<{
  totalTime: number;
  uniqueLocations: number;
  averageSyncRate: number;
} | null> => {
  try {
    const activityRef = collection(db, 'users', userId, 'activity_meta');
    const snapshot = await getDocs(activityRef);

    let totalTime = 0;
    let totalSyncRate = 0;
    let locationCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      totalTime += data.timeSpent || 0;
      totalSyncRate += data.syncRate || 0;
      locationCount++;
    });

    return {
      totalTime,
      uniqueLocations: locationCount,
      averageSyncRate: locationCount > 0 ? Math.round(totalSyncRate / locationCount) : 0,
    };
  } catch (error) {
    console.error('[ActivityTracker] Failed to get activity summary:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user can see detailed locations of another user
 * (requires friendship)
 */
export const canViewDetailedLocations = async (
  viewerId: string,
  profileUserId: string
): Promise<boolean> => {
  // Self-view always allowed
  if (viewerId === profileUserId) return true;

  try {
    // Check if they are friends
    const friendRef = doc(db, 'users', viewerId, 'friends', profileUserId);
    const friendSnap = await getDoc(friendRef);
    return friendSnap.exists();
  } catch (error) {
    return false;
  }
};

/**
 * Get privacy-safe location data
 * Returns detailed data for friends, city-only for strangers
 */
export const getPrivacySafeLocations = async (
  viewerId: string,
  profileUserId: string,
  city?: string
): Promise<{
  locations: ActivityLocation[];
  isDetailed: boolean;
  cityOnly?: string;
}> => {
  const canView = await canViewDetailedLocations(viewerId, profileUserId);

  if (canView) {
    const locations = await getTopLocations(profileUserId, 3);
    return { locations, isDetailed: true };
  } else {
    return {
      locations: [],
      isDetailed: false,
      cityOnly: city || 'Unbekannt',
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SYNC SESSION TRACKING
// ═══════════════════════════════════════════════════════════════════════════

let activeSession: {
  userId: string;
  locationName: string;
  startTime: number;
  intervalId: NodeJS.Timeout | null;
} | null = null;

/**
 * Start tracking a sync session
 * Call when user joins a voice room
 */
export const startSyncSession = (userId: string, locationName: string): void => {
  // End any existing session
  if (activeSession) {
    endSyncSession(true);
  }

  activeSession = {
    userId,
    locationName,
    startTime: Date.now(),
    intervalId: setInterval(() => {
      // Log activity every 5 minutes while in session
      logSyncActivity(userId, locationName, 5);
    }, 5 * 60 * 1000),
  };

  // Log initial join
  logSyncActivity(userId, locationName, 0);
};

/**
 * End the current sync session
 * Call when user leaves a voice room
 */
export const endSyncSession = (wasSuccessful: boolean = true): void => {
  if (!activeSession) return;

  // Clear interval
  if (activeSession.intervalId) {
    clearInterval(activeSession.intervalId);
  }

  // Calculate total minutes
  const totalMinutes = Math.round((Date.now() - activeSession.startTime) / (60 * 1000));

  // Log remaining time
  if (totalMinutes > 0) {
    logSyncActivity(activeSession.userId, activeSession.locationName, totalMinutes);
  }

  // Update sync rate based on session success
  updateSyncRate(activeSession.userId, activeSession.locationName, wasSuccessful);

  activeSession = null;
};

export default {
  logSyncActivity,
  updateSyncRate,
  getTopLocations,
  getActivitySummary,
  canViewDetailedLocations,
  getPrivacySafeLocations,
  startSyncSession,
  endSyncSession,
};
