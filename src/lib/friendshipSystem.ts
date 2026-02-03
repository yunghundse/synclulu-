/**
 * friendshipSystem.ts
 * 👥 NEBULA-BONDING SYSTEM v20.0 - Friendship Backend
 *
 * Firebase Firestore implementation for:
 * - Friendship management
 * - Streak tracking (daily interaction bonuses)
 * - Aura-Sync scores
 * - Star-Dust system (gifting stars)
 *
 * @version 20.0.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FriendshipStats {
  id: string;
  userOne: string;
  userTwo: string;
  streakCount: number;
  auraSyncScore: number;
  starsGiven: number;
  starsReceived: number;
  lastInteraction: Date;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'blocked';
}

export interface FriendWithStats {
  oderId: string;
  oderId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  streakCount: number;
  auraSyncScore: number;
  starsReceived: number;
  lastInteraction: Date;
  isFounder?: boolean;
}

export interface StreakUpdateResult {
  success: boolean;
  newStreakCount: number;
  streakBroken: boolean;
  bonusEarned: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLLECTIONS = {
  FRIENDSHIPS: 'friendships',
  FRIENDSHIP_STATS: 'friendship_stats',
  USERS: 'users',
  STARS: 'star_transfers',
} as const;

// Streak expires after 24 hours of no interaction
const STREAK_EXPIRY_HOURS = 24;

// Bonus multipliers for streaks
const STREAK_BONUSES = {
  7: 1.5,   // 7-day streak: 1.5x aura bonus
  14: 2.0,  // 14-day streak: 2x aura bonus
  30: 3.0,  // 30-day streak: 3x aura bonus
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a consistent friendship ID from two user IDs
 * Always sorts alphabetically to ensure same ID regardless of order
 */
function getFriendshipId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

/**
 * Check if streak should be broken (more than 24h since last interaction)
 */
function shouldBreakStreak(lastInteraction: Date): boolean {
  const now = new Date();
  const hoursSinceInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
  return hoursSinceInteraction > STREAK_EXPIRY_HOURS;
}

/**
 * Calculate bonus multiplier based on streak count
 */
function getStreakBonus(streakCount: number): number {
  if (streakCount >= 30) return STREAK_BONUSES[30];
  if (streakCount >= 14) return STREAK_BONUSES[14];
  if (streakCount >= 7) return STREAK_BONUSES[7];
  return 1.0;
}

/**
 * Check if it's a new day (for streak counting)
 */
function isNewDay(lastInteraction: Date): boolean {
  const now = new Date();
  const last = new Date(lastInteraction);
  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FRIENDSHIP MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (fromUserId === toUserId) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }

    const friendshipId = getFriendshipId(fromUserId, toUserId);
    const friendshipRef = doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId);
    const existing = await getDoc(friendshipRef);

    if (existing.exists()) {
      const data = existing.data();
      if (data.status === 'accepted') {
        return { success: false, error: 'Already friends' };
      }
      if (data.status === 'pending') {
        return { success: false, error: 'Friend request already pending' };
      }
    }

    await setDoc(friendshipRef, {
      userOne: fromUserId,
      userTwo: toUserId,
      requestedBy: fromUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[FriendshipSystem] Error sending friend request:', error);
    return { success: false, error: 'Failed to send friend request' };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const friendshipId = getFriendshipId(userId, friendId);
    const friendshipRef = doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId);
    const statsRef = doc(db, COLLECTIONS.FRIENDSHIP_STATS, friendshipId);

    const batch = writeBatch(db);

    // Update friendship status
    batch.update(friendshipRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });

    // Initialize friendship stats
    batch.set(statsRef, {
      userOne: userId,
      userTwo: friendId,
      streakCount: 0,
      auraSyncScore: 0,
      starsGiven: 0,
      starsReceived: 0,
      lastInteraction: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('[FriendshipSystem] Error accepting friend request:', error);
    return { success: false, error: 'Failed to accept friend request' };
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const friendshipId = getFriendshipId(userId, friendId);
    const batch = writeBatch(db);

    batch.delete(doc(db, COLLECTIONS.FRIENDSHIPS, friendshipId));
    batch.delete(doc(db, COLLECTIONS.FRIENDSHIP_STATS, friendshipId));

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('[FriendshipSystem] Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK & INTERACTION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record an interaction and update streak
 * Call this when users interact in a room together
 */
export async function recordInteraction(
  userA: string,
  userB: string
): Promise<StreakUpdateResult> {
  try {
    const friendshipId = getFriendshipId(userA, userB);
    const statsRef = doc(db, COLLECTIONS.FRIENDSHIP_STATS, friendshipId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
      // Not friends, no stats to update
      return { success: false, newStreakCount: 0, streakBroken: false, bonusEarned: 0 };
    }

    const stats = statsDoc.data();
    const lastInteraction = stats.lastInteraction?.toDate() || new Date(0);
    const currentStreak = stats.streakCount || 0;

    let newStreakCount = currentStreak;
    let streakBroken = false;

    // Check if streak should be broken
    if (shouldBreakStreak(lastInteraction)) {
      newStreakCount = 1; // Reset to 1 (today's interaction)
      streakBroken = currentStreak > 0;
    } else if (isNewDay(lastInteraction)) {
      // New day, increment streak
      newStreakCount = currentStreak + 1;
    }
    // If same day, don't increment (already counted today)

    const bonus = getStreakBonus(newStreakCount);
    const auraPointsEarned = Math.floor(10 * bonus); // Base 10 points per interaction

    await updateDoc(statsRef, {
      streakCount: newStreakCount,
      auraSyncScore: increment(auraPointsEarned),
      lastInteraction: serverTimestamp(),
    });

    return {
      success: true,
      newStreakCount,
      streakBroken,
      bonusEarned: auraPointsEarned,
    };
  } catch (error) {
    console.error('[FriendshipSystem] Error recording interaction:', error);
    return { success: false, newStreakCount: 0, streakBroken: false, bonusEarned: 0 };
  }
}

/**
 * Trigger Aura-Sync (special interaction)
 * Gives bonus points to both users
 */
export async function triggerAuraSync(
  userId: string,
  friendId: string
): Promise<{ success: boolean; auraSyncBonus: number }> {
  try {
    const friendshipId = getFriendshipId(userId, friendId);
    const statsRef = doc(db, COLLECTIONS.FRIENDSHIP_STATS, friendshipId);

    const AURA_SYNC_BONUS = 25;

    await updateDoc(statsRef, {
      auraSyncScore: increment(AURA_SYNC_BONUS),
      lastInteraction: serverTimestamp(),
    });

    // Also record the interaction for streak
    await recordInteraction(userId, friendId);

    return { success: true, auraSyncBonus: AURA_SYNC_BONUS };
  } catch (error) {
    console.error('[FriendshipSystem] Error triggering aura sync:', error);
    return { success: false, auraSyncBonus: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAR-DUST SYSTEM (Gifting)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send a star to a friend
 */
export async function sendStar(
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const friendshipId = getFriendshipId(fromUserId, toUserId);
    const statsRef = doc(db, COLLECTIONS.FRIENDSHIP_STATS, friendshipId);

    const statsDoc = await getDoc(statsRef);
    if (!statsDoc.exists()) {
      return { success: false, error: 'Not friends' };
    }

    const batch = writeBatch(db);

    // Update friendship stats
    batch.update(statsRef, {
      starsGiven: increment(1),
      lastInteraction: serverTimestamp(),
    });

    // Record the star transfer
    const starRef = doc(collection(db, COLLECTIONS.STARS));
    batch.set(starRef, {
      from: fromUserId,
      to: toUserId,
      friendshipId,
      createdAt: serverTimestamp(),
    });

    // Update receiver's total stars
    const receiverRef = doc(db, COLLECTIONS.USERS, toUserId);
    batch.update(receiverRef, {
      totalStarsReceived: increment(1),
    });

    await batch.commit();

    // Also record interaction for streak
    await recordInteraction(fromUserId, toUserId);

    return { success: true };
  } catch (error) {
    console.error('[FriendshipSystem] Error sending star:', error);
    return { success: false, error: 'Failed to send star' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all friends with stats for a user
 */
export async function getFriendsWithStats(userId: string): Promise<FriendWithStats[]> {
  try {
    // Get all friendships where user is involved
    const friendshipsQuery1 = query(
      collection(db, COLLECTIONS.FRIENDSHIPS),
      where('userOne', '==', userId),
      where('status', '==', 'accepted')
    );

    const friendshipsQuery2 = query(
      collection(db, COLLECTIONS.FRIENDSHIPS),
      where('userTwo', '==', userId),
      where('status', '==', 'accepted')
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(friendshipsQuery1),
      getDocs(friendshipsQuery2),
    ]);

    const friendIds: string[] = [];

    snapshot1.forEach((doc) => {
      const data = doc.data();
      friendIds.push(data.userTwo);
    });

    snapshot2.forEach((doc) => {
      const data = doc.data();
      friendIds.push(data.userOne);
    });

    if (friendIds.length === 0) {
      return [];
    }

    // Fetch friend profiles and stats
    const friends: FriendWithStats[] = [];

    for (const friendId of friendIds) {
      const [userDoc, statsDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.USERS, friendId)),
        getDoc(doc(db, COLLECTIONS.FRIENDSHIP_STATS, getFriendshipId(userId, friendId))),
      ]);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const statsData = statsDoc.exists() ? statsDoc.data() : {};

        friends.push({
          id: friendId,
          oderId: friendId,
          username: userData.username || 'Unknown',
          displayName: userData.displayName,
          avatarUrl: userData.photoURL || userData.avatarUrl,
          isActive: userData.isOnline || false,
          streakCount: statsData.streakCount || 0,
          auraSyncScore: statsData.auraSyncScore || 0,
          starsReceived: statsData.starsGiven || 0,
          lastInteraction: statsData.lastInteraction?.toDate() || new Date(),
          isFounder: userData.isFounder || false,
        });
      }
    }

    return friends;
  } catch (error) {
    console.error('[FriendshipSystem] Error fetching friends:', error);
    return [];
  }
}

/**
 * Get friends at risk of losing streak (haven't interacted today)
 */
export async function getStreakAtRiskFriends(userId: string): Promise<FriendWithStats[]> {
  const friends = await getFriendsWithStats(userId);
  const now = new Date();

  return friends.filter((friend) => {
    if (friend.streakCount === 0) return false;

    const hoursSince = (now.getTime() - friend.lastInteraction.getTime()) / (1000 * 60 * 60);
    // At risk if between 18-24 hours since last interaction
    return hoursSince >= 18 && hoursSince < STREAK_EXPIRY_HOURS;
  });
}

/**
 * Subscribe to friendship updates in real-time
 */
export function subscribeFriendshipUpdates(
  userId: string,
  callback: (friends: FriendWithStats[]) => void
): () => void {
  const friendshipsQuery = query(
    collection(db, COLLECTIONS.FRIENDSHIPS),
    where('status', '==', 'accepted')
  );

  const unsubscribe = onSnapshot(friendshipsQuery, async (snapshot) => {
    // Check if user is involved in any of these friendships
    const relevantDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.userOne === userId || data.userTwo === userId;
    });

    if (relevantDocs.length > 0) {
      const friends = await getFriendsWithStats(userId);
      callback(friends);
    }
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const FriendshipSystem = {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  recordInteraction,
  triggerAuraSync,
  sendStar,
  getFriendsWithStats,
  getStreakAtRiskFriends,
  subscribeFriendshipUpdates,
  getFriendshipId,
  getStreakBonus,
};

export default FriendshipSystem;
