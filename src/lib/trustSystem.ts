/**
 * trustSystem.ts
 * 🛡️ NEBULA TRUST SYSTEM v20.0 - User Reputation
 *
 * Firebase Firestore implementation for:
 * - Trust Score management (0-1000)
 * - Verification system
 * - Trust level calculations
 * - Reputation events
 *
 * @version 20.0.0
 */

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTIONS = {
  USERS: 'users',
  TRUST_EVENTS: 'trust_events',
} as const;

// Trust score boundaries
const TRUST_BOUNDS = {
  MIN: 0,
  MAX: 1000,
  DEFAULT: 500,
} as const;

// Trust levels with thresholds
export const TRUST_LEVELS = {
  NEWCOMER: { min: 0, max: 199, label: 'Newcomer', icon: '🌱' },
  RISING: { min: 200, max: 399, label: 'Rising', icon: '⬆️' },
  TRUSTED: { min: 400, max: 599, label: 'Trusted', icon: '✓' },
  RESPECTED: { min: 600, max: 799, label: 'Respected', icon: '⭐' },
  LEGENDARY: { min: 800, max: 1000, label: 'Legendary', icon: '👑' },
} as const;

// Trust point values for different actions
const TRUST_POINTS = {
  // Positive actions
  FRIEND_ACCEPTED: 5,
  STAR_RECEIVED: 3,
  STREAK_MILESTONE_7: 10,
  STREAK_MILESTONE_14: 15,
  STREAK_MILESTONE_30: 25,
  ROOM_HOSTED: 2,
  POSITIVE_INTERACTION: 1,
  VERIFIED_EMAIL: 50,
  VERIFIED_PHONE: 75,

  // Negative actions
  REPORTED_BY_USER: -10,
  SPAM_DETECTED: -25,
  LEFT_ROOM_EARLY: -1,
  BLOCKED_BY_USER: -5,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TrustEventType = keyof typeof TRUST_POINTS;

export interface TrustEvent {
  id: string;
  userId: string;
  type: TrustEventType;
  points: number;
  previousScore: number;
  newScore: number;
  relatedUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface TrustProfile {
  trustScore: number;
  isVerified: boolean;
  level: typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS];
  percentile: number;
}

export interface TrustUpdateResult {
  success: boolean;
  previousScore: number;
  newScore: number;
  levelChanged: boolean;
  newLevel?: typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the trust level for a given score
 */
export function getTrustLevel(score: number): typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS] {
  if (score >= TRUST_LEVELS.LEGENDARY.min) return TRUST_LEVELS.LEGENDARY;
  if (score >= TRUST_LEVELS.RESPECTED.min) return TRUST_LEVELS.RESPECTED;
  if (score >= TRUST_LEVELS.TRUSTED.min) return TRUST_LEVELS.TRUSTED;
  if (score >= TRUST_LEVELS.RISING.min) return TRUST_LEVELS.RISING;
  return TRUST_LEVELS.NEWCOMER;
}

/**
 * Clamp score to valid bounds
 */
function clampScore(score: number): number {
  return Math.max(TRUST_BOUNDS.MIN, Math.min(TRUST_BOUNDS.MAX, score));
}

/**
 * Check if a level change occurred
 */
function didLevelChange(oldScore: number, newScore: number): boolean {
  const oldLevel = getTrustLevel(oldScore);
  const newLevel = getTrustLevel(newScore);
  return oldLevel.label !== newLevel.label;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a user's trust profile
 */
export async function getTrustProfile(userId: string): Promise<TrustProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    const trustScore = data.trustScore ?? TRUST_BOUNDS.DEFAULT;
    const level = getTrustLevel(trustScore);

    return {
      trustScore,
      isVerified: data.isVerified ?? false,
      level,
      percentile: (trustScore / TRUST_BOUNDS.MAX) * 100,
    };
  } catch (error) {
    console.error('[TrustSystem] Error getting trust profile:', error);
    return null;
  }
}

/**
 * Update a user's trust score based on an event
 */
export async function recordTrustEvent(
  userId: string,
  eventType: TrustEventType,
  relatedUserId?: string,
  metadata?: Record<string, unknown>
): Promise<TrustUpdateResult> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        previousScore: 0,
        newScore: 0,
        levelChanged: false,
        error: 'User not found',
      };
    }

    const userData = userDoc.data();
    const previousScore = userData.trustScore ?? TRUST_BOUNDS.DEFAULT;
    const points = TRUST_POINTS[eventType];
    const newScore = clampScore(previousScore + points);
    const levelChanged = didLevelChange(previousScore, newScore);

    // Update user's trust score
    await updateDoc(userRef, {
      trustScore: newScore,
      lastTrustUpdate: serverTimestamp(),
    });

    // Record the event for history/audit
    await addDoc(collection(db, COLLECTIONS.TRUST_EVENTS), {
      userId,
      type: eventType,
      points,
      previousScore,
      newScore,
      relatedUserId: relatedUserId || null,
      metadata: metadata || null,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      previousScore,
      newScore,
      levelChanged,
      newLevel: levelChanged ? getTrustLevel(newScore) : undefined,
    };
  } catch (error) {
    console.error('[TrustSystem] Error recording trust event:', error);
    return {
      success: false,
      previousScore: 0,
      newScore: 0,
      levelChanged: false,
      error: 'Failed to record trust event',
    };
  }
}

/**
 * Set a user's verification status
 */
export async function setVerificationStatus(
  userId: string,
  isVerified: boolean,
  verificationType: 'email' | 'phone' = 'email'
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    await updateDoc(userRef, {
      isVerified,
      verifiedAt: isVerified ? serverTimestamp() : null,
      verificationType: isVerified ? verificationType : null,
    });

    // Award trust points for verification
    if (isVerified) {
      const eventType = verificationType === 'phone' ? 'VERIFIED_PHONE' : 'VERIFIED_EMAIL';
      await recordTrustEvent(userId, eventType);
    }

    return { success: true };
  } catch (error) {
    console.error('[TrustSystem] Error setting verification:', error);
    return { success: false, error: 'Failed to update verification status' };
  }
}

/**
 * Get trust event history for a user
 */
export async function getTrustHistory(
  userId: string,
  limitCount: number = 50
): Promise<TrustEvent[]> {
  try {
    const eventsQuery = query(
      collection(db, COLLECTIONS.TRUST_EVENTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(eventsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        points: data.points,
        previousScore: data.previousScore,
        newScore: data.newScore,
        relatedUserId: data.relatedUserId,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('[TrustSystem] Error getting trust history:', error);
    return [];
  }
}

/**
 * Initialize trust score for a new user
 */
export async function initializeTrustScore(userId: string): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();

      // Only initialize if trust score doesn't exist
      if (data.trustScore === undefined) {
        await updateDoc(userRef, {
          trustScore: TRUST_BOUNDS.DEFAULT,
          isVerified: false,
          lastTrustUpdate: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('[TrustSystem] Error initializing trust score:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Award trust for friend being accepted
 */
export async function awardFriendAccepted(
  userId: string,
  friendId: string
): Promise<TrustUpdateResult> {
  return recordTrustEvent(userId, 'FRIEND_ACCEPTED', friendId);
}

/**
 * Award trust for receiving a star
 */
export async function awardStarReceived(
  userId: string,
  fromUserId: string
): Promise<TrustUpdateResult> {
  return recordTrustEvent(userId, 'STAR_RECEIVED', fromUserId);
}

/**
 * Award trust for streak milestones
 */
export async function awardStreakMilestone(
  userId: string,
  friendId: string,
  streakDays: number
): Promise<TrustUpdateResult | null> {
  if (streakDays === 7) {
    return recordTrustEvent(userId, 'STREAK_MILESTONE_7', friendId, { streakDays });
  }
  if (streakDays === 14) {
    return recordTrustEvent(userId, 'STREAK_MILESTONE_14', friendId, { streakDays });
  }
  if (streakDays === 30) {
    return recordTrustEvent(userId, 'STREAK_MILESTONE_30', friendId, { streakDays });
  }
  return null;
}

/**
 * Award trust for hosting a room
 */
export async function awardRoomHosted(userId: string): Promise<TrustUpdateResult> {
  return recordTrustEvent(userId, 'ROOM_HOSTED');
}

/**
 * Record a user report (negative trust)
 */
export async function recordUserReport(
  reportedUserId: string,
  reporterUserId: string,
  reason?: string
): Promise<TrustUpdateResult> {
  return recordTrustEvent(reportedUserId, 'REPORTED_BY_USER', reporterUserId, { reason });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const TrustSystem = {
  getTrustProfile,
  getTrustLevel,
  recordTrustEvent,
  setVerificationStatus,
  getTrustHistory,
  initializeTrustScore,
  awardFriendAccepted,
  awardStarReceived,
  awardStreakMilestone,
  awardRoomHosted,
  recordUserReport,
  TRUST_LEVELS,
  TRUST_POINTS,
};

export default TrustSystem;
