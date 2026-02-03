/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRESENCE VAULT v15.0 - Celestial Trace System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time presence tracking system:
 * - Track user location in rooms (current_room_id)
 * - 15-second heartbeat for presence
 * - Friend activity notifications
 * - Founder Ghost Mode (sees all, hidden from all)
 * - Privacy-aware presence filtering
 *
 * @version 15.0.0 - WhatsApp Grade Stability
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PRESENCE_TIMEOUT_MS = 15000; // 15 seconds before marking as away
const HEARTBEAT_INTERVAL_MS = 10000; // Send heartbeat every 10 seconds
const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserPresence {
  oderId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  currentRoomId: string | null;
  currentRoomName: string | null;
  statusEmoji: string;
  lastSeen: Date;
  isOnline: boolean;
  isInCloud: boolean;
  privacyHideLocation: boolean;
  isFounder: boolean;
  isGhostMode: boolean; // Founder invisible mode
}

export interface PresenceUpdate {
  currentRoomId: string | null;
  currentRoomName: string | null;
  statusEmoji?: string;
  isGhostMode?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENCE VAULT CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class PresenceVault {
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string | null = null;
  private presenceListeners: Map<string, () => void> = new Map();

  /**
   * Initialize presence tracking for current user
   */
  async initPresence(userId: string): Promise<void> {
    this.currentUserId = userId;

    // Create/update presence document
    const presenceRef = doc(db, 'presence', userId);

    try {
      const presenceSnap = await getDoc(presenceRef);

      if (!presenceSnap.exists()) {
        // Create new presence document
        await setDoc(presenceRef, {
          oderId: userId,
          currentRoomId: null,
          currentRoomName: null,
          statusEmoji: '☁️',
          lastSeen: serverTimestamp(),
          isOnline: true,
          isGhostMode: false,
          createdAt: serverTimestamp(),
        });
      } else {
        // Update existing - mark as online
        await updateDoc(presenceRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      }

      // Start heartbeat
      this.startHeartbeat(userId);

      console.log('[PresenceVault] ✅ Presence initialized for:', userId);
    } catch (error) {
      console.error('[PresenceVault] Failed to init presence:', error);
    }
  }

  /**
   * Sync user presence when joining a room
   * Equivalent to: sync_user_presence(u_id, r_id)
   */
  async syncPresence(userId: string, roomId: string | null, roomName: string | null): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);

    try {
      await updateDoc(presenceRef, {
        currentRoomId: roomId,
        currentRoomName: roomName,
        lastSeen: serverTimestamp(),
        isOnline: true,
      });

      console.log('[PresenceVault] 🔄 Synced presence:', { userId, roomId, roomName });

      // Broadcast to friends (via activity feed)
      if (roomId) {
        await this.broadcastActivity(userId, 'joined', roomName || 'ein Wölkchen');
      }
    } catch (error) {
      console.error('[PresenceVault] Failed to sync presence:', error);
    }
  }

  /**
   * Clear presence when leaving a room
   */
  async clearRoomPresence(userId: string): Promise<void> {
    const presenceRef = doc(db, 'presence', userId);

    try {
      await updateDoc(presenceRef, {
        currentRoomId: null,
        currentRoomName: null,
        lastSeen: serverTimestamp(),
      });

      console.log('[PresenceVault] 🚪 Cleared room presence for:', userId);
    } catch (error) {
      console.error('[PresenceVault] Failed to clear presence:', error);
    }
  }

  /**
   * Set ghost mode (Founder only)
   */
  async setGhostMode(userId: string, enabled: boolean): Promise<boolean> {
    if (userId !== FOUNDER_UID) {
      console.warn('[PresenceVault] Ghost mode is Founder-only');
      return false;
    }

    const presenceRef = doc(db, 'presence', userId);

    try {
      await updateDoc(presenceRef, {
        isGhostMode: enabled,
        lastSeen: serverTimestamp(),
      });

      console.log('[PresenceVault] 👻 Ghost mode:', enabled ? 'ENABLED' : 'DISABLED');
      return true;
    } catch (error) {
      console.error('[PresenceVault] Failed to set ghost mode:', error);
      return false;
    }
  }

  /**
   * Get presence for a specific user
   * Respects privacy settings and ghost mode
   */
  async getPresence(
    targetUserId: string,
    viewerUserId: string
  ): Promise<UserPresence | null> {
    try {
      const presenceRef = doc(db, 'presence', targetUserId);
      const presenceSnap = await getDoc(presenceRef);

      if (!presenceSnap.exists()) return null;

      const data = presenceSnap.data();
      const isFounderViewer = viewerUserId === FOUNDER_UID;
      const isTargetGhost = data.isGhostMode && targetUserId === FOUNDER_UID;

      // Get user profile for additional data
      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Privacy filter: Hide location if user has privacy enabled
      // Unless viewer is Founder (sees all)
      const hideLocation = !isFounderViewer && (
        userData.privacyHideLocation ||
        isTargetGhost
      );

      const lastSeen = data.lastSeen?.toDate() || new Date();
      const isOnline = Date.now() - lastSeen.getTime() < PRESENCE_TIMEOUT_MS;

      return {
        oderId: targetUserId,
        username: userData.username || 'unknown',
        displayName: userData.displayName || 'Unbekannt',
        avatarUrl: userData.avatarUrl,
        currentRoomId: hideLocation ? null : data.currentRoomId,
        currentRoomName: hideLocation ? null : data.currentRoomName,
        statusEmoji: data.statusEmoji || '☁️',
        lastSeen,
        isOnline,
        isInCloud: !hideLocation && !!data.currentRoomId,
        privacyHideLocation: userData.privacyHideLocation || false,
        isFounder: targetUserId === FOUNDER_UID,
        isGhostMode: isTargetGhost,
      };
    } catch (error) {
      console.error('[PresenceVault] Failed to get presence:', error);
      return null;
    }
  }

  /**
   * Get presence for multiple friends
   * Returns filtered based on viewer permissions
   */
  async getFriendsPresence(
    friendIds: string[],
    viewerUserId: string
  ): Promise<UserPresence[]> {
    const presences: UserPresence[] = [];

    for (const friendId of friendIds) {
      const presence = await this.getPresence(friendId, viewerUserId);
      if (presence) {
        presences.push(presence);
      }
    }

    // Sort: In-cloud friends first, then by last seen
    return presences.sort((a, b) => {
      if (a.isInCloud && !b.isInCloud) return -1;
      if (!a.isInCloud && b.isInCloud) return 1;
      return b.lastSeen.getTime() - a.lastSeen.getTime();
    });
  }

  /**
   * Subscribe to presence changes for a user
   */
  subscribeToPresence(
    targetUserId: string,
    viewerUserId: string,
    callback: (presence: UserPresence | null) => void
  ): () => void {
    const presenceRef = doc(db, 'presence', targetUserId);

    const unsubscribe = onSnapshot(presenceRef, async (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }

      const presence = await this.getPresence(targetUserId, viewerUserId);
      callback(presence);
    });

    // Store for cleanup
    this.presenceListeners.set(targetUserId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Broadcast activity to friends
   */
  private async broadcastActivity(
    userId: string,
    action: 'joined' | 'left',
    roomName: string
  ): Promise<void> {
    try {
      // Check if user is in ghost mode
      const presenceRef = doc(db, 'presence', userId);
      const presenceSnap = await getDoc(presenceRef);

      if (presenceSnap.exists() && presenceSnap.data().isGhostMode) {
        console.log('[PresenceVault] 👻 Ghost mode - no broadcast');
        return;
      }

      // Get user data
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Create activity entry
      const activityRef = doc(collection(db, 'friendActivity'));
      await setDoc(activityRef, {
        userId,
        username: userData.username || 'unknown',
        action,
        roomName,
        message: action === 'joined'
          ? `ist in ${roomName} geschwebt ✨`
          : `hat ${roomName} verlassen`,
        timestamp: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // 5 min TTL
      });

      console.log('[PresenceVault] 📢 Broadcast activity:', { userId, action, roomName });
    } catch (error) {
      console.error('[PresenceVault] Failed to broadcast:', error);
    }
  }

  /**
   * Start heartbeat for presence
   */
  private startHeartbeat(userId: string): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      const presenceRef = doc(db, 'presence', userId);

      try {
        await updateDoc(presenceRef, {
          lastSeen: serverTimestamp(),
          isOnline: true,
        });
      } catch (error) {
        console.error('[PresenceVault] Heartbeat error:', error);
      }
    }, HEARTBEAT_INTERVAL_MS);

    console.log('[PresenceVault] 💓 Heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Go offline - call on app close/logout
   */
  async goOffline(): Promise<void> {
    if (!this.currentUserId) return;

    this.stopHeartbeat();

    const presenceRef = doc(db, 'presence', this.currentUserId);

    try {
      await updateDoc(presenceRef, {
        isOnline: false,
        currentRoomId: null,
        currentRoomName: null,
        lastSeen: serverTimestamp(),
      });

      console.log('[PresenceVault] 👋 Gone offline');
    } catch (error) {
      console.error('[PresenceVault] Failed to go offline:', error);
    }

    // Cleanup listeners
    this.presenceListeners.forEach((unsub) => unsub());
    this.presenceListeners.clear();

    this.currentUserId = null;
  }

  /**
   * Check if user is Founder
   */
  isFounder(userId: string): boolean {
    return userId === FOUNDER_UID;
  }
}

// Singleton instance
export const presenceVault = new PresenceVault();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

export function usePresence(userId: string | null) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize presence on mount
  useEffect(() => {
    if (!userId) return;

    presenceVault.initPresence(userId).then(() => {
      setIsInitialized(true);
    });

    // Cleanup on unmount
    return () => {
      presenceVault.goOffline();
    };
  }, [userId]);

  // Sync to room
  const syncToRoom = useCallback(async (roomId: string, roomName: string) => {
    if (!userId) return;
    await presenceVault.syncPresence(userId, roomId, roomName);
  }, [userId]);

  // Clear room presence
  const clearRoom = useCallback(async () => {
    if (!userId) return;
    await presenceVault.clearRoomPresence(userId);
  }, [userId]);

  // Toggle ghost mode (Founder only)
  const toggleGhostMode = useCallback(async (enabled: boolean) => {
    if (!userId) return false;
    return presenceVault.setGhostMode(userId, enabled);
  }, [userId]);

  return {
    isInitialized,
    syncToRoom,
    clearRoom,
    toggleGhostMode,
    isFounder: userId ? presenceVault.isFounder(userId) : false,
  };
}

export function useFriendPresence(friendId: string, viewerUserId: string | null) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!viewerUserId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = presenceVault.subscribeToPresence(
      friendId,
      viewerUserId,
      (p) => {
        setPresence(p);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [friendId, viewerUserId]);

  return { presence, isLoading };
}

export function useFriendsPresence(friendIds: string[], viewerUserId: string | null) {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!viewerUserId || friendIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadPresences = async () => {
      const results = await presenceVault.getFriendsPresence(friendIds, viewerUserId);
      setPresences(results);
      setIsLoading(false);
    };

    loadPresences();

    // Refresh every 15 seconds
    const interval = setInterval(loadPresences, 15000);

    return () => clearInterval(interval);
  }, [friendIds.join(','), viewerUserId]);

  return { presences, isLoading };
}

export default presenceVault;
