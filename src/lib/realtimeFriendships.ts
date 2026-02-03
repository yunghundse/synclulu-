/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * REALTIME FRIENDSHIPS SERVICE - Live WebSocket Subscriptions
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Fixes the issue where notifications arrive but the list stays empty.
 * Uses Firestore onSnapshot for real-time updates instead of static fetches.
 *
 * Features:
 * - Live subscription to pending friend requests
 * - Instant UI updates on INSERT events
 * - Automatic re-render when friendships change
 * - Optimized queries with proper indexes
 *
 * @author Backend Engineer
 * @version 1.0.0
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface FriendRequest {
  id: string;
  requesterId: string;        // Who sent the request
  addresseeId: string;        // Who receives the request
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  requesterProfile?: UserMiniProfile;
  addresseeProfile?: UserMiniProfile;
}

export interface UserMiniProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  isPremium: boolean;
  isVerified: boolean;
}

export interface Friendship {
  id: string;
  users: [string, string];     // Both user IDs
  since: Date;
  interactionCount: number;
  lastInteraction: Date;
  // Populated
  friendProfile?: UserMiniProfile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALTIME FRIENDSHIPS CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class RealtimeFriendshipsService {
  private unsubscribers: Map<string, () => void> = new Map();
  private profileCache: Map<string, UserMiniProfile> = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE SUBSCRIPTIONS (WebSocket-style)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Subscribe to incoming friend requests (where I am the addressee)
   * This is the FIX for the empty list issue - uses onSnapshot instead of getDocs
   */
  subscribeToIncomingRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    console.log('[Friendships] 📡 Subscribing to incoming requests for:', userId);

    const friendshipsRef = collection(db, 'friendships');

    // Query: Get all pending requests where I am the addressee
    const q = query(
      friendshipsRef,
      where('addresseeId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    // Real-time listener (WebSocket under the hood)
    const unsubscribe = onSnapshot(
      q,
      async (snapshot: QuerySnapshot<DocumentData>) => {
        console.log('[Friendships] 🔄 Incoming requests update:', snapshot.size, 'requests');

        const requests: FriendRequest[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          // Fetch requester profile
          const requesterProfile = await this.getUserProfile(data.requesterId);

          requests.push({
            id: docSnap.id,
            requesterId: data.requesterId,
            addresseeId: data.addresseeId,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            requesterProfile,
          });
        }

        callback(requests);
      },
      (error) => {
        console.error('[Friendships] ❌ Subscription error:', error);
        callback([]);
      }
    );

    // Store unsubscriber
    const key = `incoming_${userId}`;
    this.unsubscribers.set(key, unsubscribe);

    return () => {
      console.log('[Friendships] 🛑 Unsubscribing from incoming requests');
      unsubscribe();
      this.unsubscribers.delete(key);
    };
  }

  /**
   * Subscribe to outgoing friend requests (where I am the requester)
   */
  subscribeToOutgoingRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    console.log('[Friendships] 📡 Subscribing to outgoing requests for:', userId);

    const friendshipsRef = collection(db, 'friendships');

    const q = query(
      friendshipsRef,
      where('requesterId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log('[Friendships] 🔄 Outgoing requests update:', snapshot.size, 'requests');

        const requests: FriendRequest[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const addresseeProfile = await this.getUserProfile(data.addresseeId);

          requests.push({
            id: docSnap.id,
            requesterId: data.requesterId,
            addresseeId: data.addresseeId,
            status: data.status,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            addresseeProfile,
          });
        }

        callback(requests);
      },
      (error) => {
        console.error('[Friendships] ❌ Subscription error:', error);
        callback([]);
      }
    );

    const key = `outgoing_${userId}`;
    this.unsubscribers.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.unsubscribers.delete(key);
    };
  }

  /**
   * Subscribe to accepted friendships (my friends list)
   */
  subscribeToFriendsList(
    userId: string,
    callback: (friends: Friendship[]) => void
  ): () => void {
    console.log('[Friendships] 📡 Subscribing to friends list for:', userId);

    const friendshipsRef = collection(db, 'friendships');

    // Query where user is either requester or addressee AND status is accepted
    // Firestore limitation: Can't do OR queries easily, so we do two queries

    // Query 1: User as requester
    const q1 = query(
      friendshipsRef,
      where('requesterId', '==', userId),
      where('status', '==', 'accepted')
    );

    // Query 2: User as addressee
    const q2 = query(
      friendshipsRef,
      where('addresseeId', '==', userId),
      where('status', '==', 'accepted')
    );

    const friendsMap = new Map<string, Friendship>();

    const processSnapshot = async (
      snapshot: QuerySnapshot<DocumentData>,
      iAmRequester: boolean
    ) => {
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const friendId = iAmRequester ? data.addresseeId : data.requesterId;

        // Skip if already processed (dedup)
        if (friendsMap.has(friendId)) continue;

        const friendProfile = await this.getUserProfile(friendId);

        friendsMap.set(friendId, {
          id: docSnap.id,
          users: [data.requesterId, data.addresseeId],
          since: data.acceptedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
          interactionCount: data.interactionCount || 0,
          lastInteraction: data.lastInteraction?.toDate?.() || new Date(),
          friendProfile,
        });
      }
    };

    // Subscribe to both queries
    const unsub1 = onSnapshot(q1, async (snapshot) => {
      await processSnapshot(snapshot, true);
      callback(Array.from(friendsMap.values()));
    });

    const unsub2 = onSnapshot(q2, async (snapshot) => {
      await processSnapshot(snapshot, false);
      callback(Array.from(friendsMap.values()));
    });

    const key = `friends_${userId}`;
    const combinedUnsub = () => {
      unsub1();
      unsub2();
    };
    this.unsubscribers.set(key, combinedUnsub);

    return () => {
      combinedUnsub();
      this.unsubscribers.delete(key);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Send a friend request
   */
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<string> {
    console.log('[Friendships] 📤 Sending friend request:', requesterId, '→', addresseeId);

    // Check if request already exists
    const existingId = this.generateFriendshipId(requesterId, addresseeId);

    const friendshipRef = doc(db, 'friendships', existingId);
    const existingDoc = await getDoc(friendshipRef);

    if (existingDoc.exists()) {
      const status = existingDoc.data()?.status;
      if (status === 'accepted') {
        throw new Error('Ihr seid bereits befreundet');
      }
      if (status === 'pending') {
        throw new Error('Anfrage bereits gesendet');
      }
      if (status === 'blocked') {
        throw new Error('Diese Person kann nicht hinzugefügt werden');
      }
    }

    // Create new friend request
    await setDoc(friendshipRef, {
      requesterId,
      addresseeId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Send notification
    await this.sendFriendRequestNotification(requesterId, addresseeId);

    return existingId;
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: string, accepterId: string): Promise<void> {
    console.log('[Friendships] ✅ Accepting friend request:', friendshipId);

    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Anfrage nicht gefunden');
    }

    const data = friendshipDoc.data();

    // Verify accepter is the addressee
    if (data.addresseeId !== accepterId) {
      throw new Error('Du kannst diese Anfrage nicht annehmen');
    }

    // Update status
    await updateDoc(friendshipRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Send notification to requester
    await this.sendFriendAcceptedNotification(data.requesterId, accepterId);
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(friendshipId: string, declinerId: string): Promise<void> {
    console.log('[Friendships] ❌ Declining friend request:', friendshipId);

    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Anfrage nicht gefunden');
    }

    const data = friendshipDoc.data();

    if (data.addresseeId !== declinerId) {
      throw new Error('Du kannst diese Anfrage nicht ablehnen');
    }

    await updateDoc(friendshipRef, {
      status: 'declined',
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendshipId: string, userId: string): Promise<void> {
    console.log('[Friendships] 🗑️ Removing friend:', friendshipId);

    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Freundschaft nicht gefunden');
    }

    const data = friendshipDoc.data();

    // Verify user is part of this friendship
    if (data.requesterId !== userId && data.addresseeId !== userId) {
      throw new Error('Du kannst diese Freundschaft nicht beenden');
    }

    // Delete the friendship
    await deleteDoc(friendshipRef);

    // Also delete metadata
    try {
      await deleteDoc(doc(db, 'friendship_metadata', friendshipId));
    } catch (e) {
      // Metadata might not exist, ignore
    }
  }

  /**
   * Block a user (with IMEI/Device blacklist check)
   */
  async blockUser(blockerId: string, blockedUserId: string, reason?: string): Promise<void> {
    console.log('[Friendships] 🚫 Blocking user:', blockedUserId);

    // Create or update friendship to blocked status
    const friendshipId = this.generateFriendshipId(blockerId, blockedUserId);
    const friendshipRef = doc(db, 'friendships', friendshipId);

    await setDoc(friendshipRef, {
      requesterId: blockerId,
      addresseeId: blockedUserId,
      status: 'blocked',
      blockedBy: blockerId,
      blockReason: reason || 'User blocked',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Add to user's blocked list
    const blockerProfileRef = doc(db, 'users', blockerId);
    const blockerDoc = await getDoc(blockerProfileRef);

    if (blockerDoc.exists()) {
      const currentBlocked = blockerDoc.data().blockedUsers || [];
      if (!currentBlocked.includes(blockedUserId)) {
        await updateDoc(blockerProfileRef, {
          blockedUsers: [...currentBlocked, blockedUserId],
        });
      }
    }

    // Check IMEI/Device blacklist
    await this.checkAndFlagDeviceBlacklist(blockedUserId, blockerId);

    console.log('[Friendships] ✅ User blocked:', blockedUserId);
  }

  /**
   * Unblock a user
   */
  async unblockUser(unblockerId: string, unblockedUserId: string): Promise<void> {
    console.log('[Friendships] 🔓 Unblocking user:', unblockedUserId);

    const friendshipId = this.generateFriendshipId(unblockerId, unblockedUserId);
    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (friendshipDoc.exists() && friendshipDoc.data().status === 'blocked') {
      // Check if this user did the blocking
      if (friendshipDoc.data().blockedBy !== unblockerId) {
        throw new Error('Du kannst diesen User nicht entsperren');
      }

      // Delete the blocked friendship
      await deleteDoc(friendshipRef);
    }

    // Remove from blocked list
    const unblockerProfileRef = doc(db, 'users', unblockerId);
    const unblockerDoc = await getDoc(unblockerProfileRef);

    if (unblockerDoc.exists()) {
      const currentBlocked = unblockerDoc.data().blockedUsers || [];
      await updateDoc(unblockerProfileRef, {
        blockedUsers: currentBlocked.filter((id: string) => id !== unblockedUserId),
      });
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId1: string, userId2: string): Promise<{ blocked: boolean; blockedBy?: string }> {
    const friendshipId = this.generateFriendshipId(userId1, userId2);
    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (friendshipDoc.exists() && friendshipDoc.data().status === 'blocked') {
      return {
        blocked: true,
        blockedBy: friendshipDoc.data().blockedBy,
      };
    }

    return { blocked: false };
  }

  /**
   * Check IMEI/Device blacklist and flag suspicious accounts
   */
  private async checkAndFlagDeviceBlacklist(
    blockedUserId: string,
    blockerId: string
  ): Promise<void> {
    try {
      // Get blocked user's device fingerprint
      const safetyProfileRef = doc(db, 'user_safety_profiles', blockedUserId);
      const safetyProfileSnap = await getDoc(safetyProfileRef);

      if (!safetyProfileSnap.exists()) return;

      const deviceFingerprint = safetyProfileSnap.data().deviceFingerprintHash;
      if (!deviceFingerprint) return;

      // Check if this device has been blocked by multiple users
      const blockedCountRef = doc(db, 'device_block_counts', deviceFingerprint);
      const blockedCountSnap = await getDoc(blockedCountRef);

      let blockCount = 1;
      let blockers: string[] = [blockerId];

      if (blockedCountSnap.exists()) {
        blockCount = (blockedCountSnap.data().count || 0) + 1;
        blockers = [...(blockedCountSnap.data().blockers || []), blockerId];
      }

      await setDoc(blockedCountRef, {
        deviceFingerprintHash: deviceFingerprint,
        userId: blockedUserId,
        count: blockCount,
        blockers: [...new Set(blockers)], // Dedupe
        lastBlocked: serverTimestamp(),
      }, { merge: true });

      // If blocked by 3+ different users, flag for IMEI blacklist review
      if (blockCount >= 3) {
        console.warn('[Friendships] ⚠️ Device flagged for blacklist review:', deviceFingerprint);

        await setDoc(doc(db, 'device_blacklist_queue', deviceFingerprint), {
          deviceFingerprintHash: deviceFingerprint,
          userId: blockedUserId,
          blockCount,
          blockers: [...new Set(blockers)],
          status: 'pending_review',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('[Friendships] Error checking device blacklist:', error);
    }
  }

  /**
   * Cancel a sent friend request
   */
  async cancelFriendRequest(friendshipId: string, requesterId: string): Promise<void> {
    console.log('[Friendships] 🚫 Canceling friend request:', friendshipId);

    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Anfrage nicht gefunden');
    }

    const data = friendshipDoc.data();

    if (data.requesterId !== requesterId) {
      throw new Error('Du kannst diese Anfrage nicht zurückziehen');
    }

    await deleteDoc(friendshipRef);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate consistent friendship ID (alphabetically sorted)
   */
  private generateFriendshipId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Get user profile with caching
   */
  private async getUserProfile(userId: string): Promise<UserMiniProfile | undefined> {
    // Check cache
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId);
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return undefined;

      const data = userDoc.data();
      const profile: UserMiniProfile = {
        id: userId,
        displayName: data.displayName || 'Anonym',
        username: data.username || 'unknown',
        avatarUrl: data.avatarUrl || null,
        level: data.level || 1,
        isPremium: data.isPremium || false,
        isVerified: data.isVerified || false,
      };

      // Cache for 5 minutes
      this.profileCache.set(userId, profile);
      setTimeout(() => this.profileCache.delete(userId), 5 * 60 * 1000);

      return profile;
    } catch (error) {
      console.error('[Friendships] Failed to fetch profile:', userId, error);
      return undefined;
    }
  }

  /**
   * Send notification for new friend request
   */
  private async sendFriendRequestNotification(
    requesterId: string,
    addresseeId: string
  ): Promise<void> {
    const requesterProfile = await this.getUserProfile(requesterId);

    await setDoc(doc(db, 'notifications', `fr_${Date.now()}_${addresseeId}`), {
      userId: addresseeId,
      type: 'friend_request',
      title: 'Neue Freundschaftsanfrage',
      body: `${requesterProfile?.displayName || 'Jemand'} möchte dich als Freund hinzufügen`,
      data: {
        requesterId,
        requesterName: requesterProfile?.displayName,
        requesterAvatar: requesterProfile?.avatarUrl,
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Send notification when friend request is accepted
   */
  private async sendFriendAcceptedNotification(
    requesterId: string,
    accepterId: string
  ): Promise<void> {
    const accepterProfile = await this.getUserProfile(accepterId);

    await setDoc(doc(db, 'notifications', `fa_${Date.now()}_${requesterId}`), {
      userId: requesterId,
      type: 'friend_accepted',
      title: 'Freundschaftsanfrage angenommen!',
      body: `${accepterProfile?.displayName || 'Jemand'} hat deine Anfrage angenommen 🎉`,
      data: {
        accepterId,
        accepterName: accepterProfile?.displayName,
        accepterAvatar: accepterProfile?.avatarUrl,
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    console.log('[Friendships] 🧹 Cleaning up all subscriptions');
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers.clear();
    this.profileCache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const friendshipsService = new RealtimeFriendshipsService();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for incoming friend requests (real-time)
 */
export function useIncomingFriendRequests(userId: string | null) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = friendshipsService.subscribeToIncomingRequests(
      userId,
      (newRequests) => {
        setRequests(newRequests);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const accept = useCallback(async (friendshipId: string) => {
    if (!userId) return;
    await friendshipsService.acceptFriendRequest(friendshipId, userId);
  }, [userId]);

  const decline = useCallback(async (friendshipId: string) => {
    if (!userId) return;
    await friendshipsService.declineFriendRequest(friendshipId, userId);
  }, [userId]);

  return { requests, isLoading, accept, decline };
}

/**
 * Hook for outgoing friend requests (real-time)
 */
export function useOutgoingFriendRequests(userId: string | null) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = friendshipsService.subscribeToOutgoingRequests(
      userId,
      (newRequests) => {
        setRequests(newRequests);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const cancel = useCallback(async (friendshipId: string) => {
    if (!userId) return;
    await friendshipsService.cancelFriendRequest(friendshipId, userId);
  }, [userId]);

  const send = useCallback(async (addresseeId: string) => {
    if (!userId) return;
    await friendshipsService.sendFriendRequest(userId, addresseeId);
  }, [userId]);

  return { requests, isLoading, cancel, send };
}

/**
 * Hook for friends list (real-time)
 */
export function useFriendsList(userId: string | null) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFriends([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = friendshipsService.subscribeToFriendsList(
      userId,
      (newFriends) => {
        setFriends(newFriends);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const remove = useCallback(async (friendshipId: string) => {
    if (!userId) return;
    await friendshipsService.removeFriend(friendshipId, userId);
  }, [userId]);

  return { friends, isLoading, remove, count: friends.length };
}

/**
 * Hook for blocking/unblocking users
 */
export function useBlockUser(userId: string | null) {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBlockedUsers([]);
      setIsLoading(false);
      return;
    }

    // Subscribe to user's blocked list
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setBlockedUsers(docSnap.data().blockedUsers || []);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const block = useCallback(async (targetUserId: string, reason?: string) => {
    if (!userId) return;
    await friendshipsService.blockUser(userId, targetUserId, reason);
  }, [userId]);

  const unblock = useCallback(async (targetUserId: string) => {
    if (!userId) return;
    await friendshipsService.unblockUser(userId, targetUserId);
  }, [userId]);

  const isBlocked = useCallback((targetUserId: string) => {
    return blockedUsers.includes(targetUserId);
  }, [blockedUsers]);

  return { blockedUsers, isLoading, block, unblock, isBlocked };
}

export default friendshipsService;
