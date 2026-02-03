/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROOM SERVICE v15.0 - WhatsApp × AWS Grade Stability
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Key Features:
 * - 30-second deletion buffer (rooms can't be deleted immediately)
 * - 60-second stale threshold for participant cleanup
 * - joinRoomSafe with proper handshake sequence
 * - Ghost Presence for Founders
 * - Transaction-based operations
 * - 20-second heartbeat mechanism
 * - 40-second stale participant removal
 *
 * @version 15.0.0 - Solid Infrastructure Edition
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { presenceVault } from './presenceVault';

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDER IDS - Ghost Presence Access
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_IDS = [
  'MIbamchs82Ve7y0ecX2TpPyymbw1', // Jan
];

export function isFounder(userId: string): boolean {
  return FOUNDER_IDS.includes(userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RoomParticipant {
  oderId: string;
  username: string;
  displayName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isAnonymous: boolean;
  level: number;
  joinedAt: Date;
  lastActiveAt: Date;
  connectionState: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
  isGhost?: boolean; // Founder ghost presence
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'regional';
  isAnonymous: boolean;
  participants: RoomParticipant[];
  maxParticipants: number;
  xpMultiplier: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  // v14.0 additions
  isTemporary?: boolean;
  markedForDeletion?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING CONSTANTS - WhatsApp Grade Stability
// ═══════════════════════════════════════════════════════════════════════════════

const DELETION_BUFFER_MS = 30000;     // 30 seconds before room can be deleted
const HEARTBEAT_INTERVAL_MS = 20000;  // Send heartbeat every 20 seconds
const STALE_THRESHOLD_MS = 40000;     // Remove user after 40 seconds without heartbeat
const ROOM_INACTIVITY_MS = 60000;     // Delete room after 60 seconds of inactivity

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class RoomService {
  private activeRoomId: string | null = null;
  private userId: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupScheduled: boolean = false;
  private pendingDeletions: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // JOIN ROOM SAFE - Proper Handshake Sequence
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Safe room join with proper handshake:
   * 1. Validate room exists and is active
   * 2. Check capacity
   * 3. Write user to participants (in transaction)
   * 4. Set local state
   * 5. Start heartbeat
   * 6. Return success
   */
  async joinRoomSafe(params: {
    roomId: string;
    userId: string;
    username: string;
    displayName: string;
    level: number;
    isAnonymous: boolean;
    isGhost?: boolean; // Founder ghost mode
  }): Promise<{ success: boolean; error?: string; room?: any }> {
    const { roomId, userId, username, displayName, level, isAnonymous, isGhost } = params;

    console.log('[RoomService] 🔗 joinRoomSafe starting...', { roomId, userId, isGhost });

    // If already in a room, leave first
    if (this.activeRoomId && this.activeRoomId !== roomId) {
      console.log('[RoomService] Already in room, leaving first:', this.activeRoomId);
      await this.leaveRoom(this.activeRoomId, userId);
    }

    try {
      const roomRef = doc(db, 'rooms', roomId);
      let roomData: any = null;

      // Step 1-3: Transaction for atomic join
      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) {
          throw new Error('Raum existiert nicht mehr');
        }

        roomData = roomSnap.data();

        // Check if room is active
        if (roomData.isActive === false) {
          throw new Error('Raum ist nicht mehr aktiv');
        }

        const currentParticipants = roomData.participants || [];

        // Check capacity (founders bypass)
        if (!isFounder(userId) && currentParticipants.length >= (roomData.maxParticipants || 8)) {
          throw new Error('Raum ist voll');
        }

        // Remove any existing entries for this user (cleanup duplicates)
        const cleanedParticipants = currentParticipants.filter(
          (p: any) => p.oderId !== userId
        );

        // Create new participant entry
        const newParticipant = {
          oderId: userId,
          username: username,
          displayName: isAnonymous || roomData.isAnonymous ? 'Wanderer' : displayName,
          isSpeaking: false,
          isMuted: true,
          isAnonymous: isAnonymous || roomData.isAnonymous,
          level: level,
          joinedAt: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          connectionState: 'connected',
          isGhost: isGhost || false,
        };

        // Cancel any pending deletion for this room
        if (this.pendingDeletions.has(roomId)) {
          clearTimeout(this.pendingDeletions.get(roomId)!);
          this.pendingDeletions.delete(roomId);
          console.log('[RoomService] ⏱️ Cancelled pending deletion for room:', roomId);
        }

        // Update room with new participant
        transaction.update(roomRef, {
          participants: [...cleanedParticipants, newParticipant],
          markedForDeletion: null, // Clear deletion mark
        });

        // Update roomData for return
        roomData.participants = [...cleanedParticipants, newParticipant];
      });

      // Step 4: Set local state
      this.activeRoomId = roomId;
      this.userId = userId;

      // Step 5: Start heartbeat
      this.startHeartbeat(roomId, userId);

      // Step 6: Sync presence - "Ich bin jetzt hier"
      try {
        const roomName = roomData?.name || 'Wölkchen';
        await presenceVault.syncPresence(userId, roomId, roomName);
        console.log('[RoomService] 🌟 Presence synced:', roomName);
      } catch (presenceError) {
        console.warn('[RoomService] ⚠️ Presence sync failed (non-blocking):', presenceError);
      }

      // Step 7: Return success with room data
      console.log('[RoomService] ✅ joinRoomSafe complete:', roomId);
      return {
        success: true,
        room: { id: roomId, ...roomData }
      };

    } catch (error: any) {
      console.error('[RoomService] ❌ joinRoomSafe failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVE ROOM - With 30-Second Deletion Buffer
  // ═══════════════════════════════════════════════════════════════════════════

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    console.log('[RoomService] 🚪 Leaving room:', roomId);

    // Stop heartbeat
    this.stopHeartbeat();

    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) {
          console.log('[RoomService] Room already deleted');
          return;
        }

        const roomData = roomSnap.data();
        const currentParticipants = roomData.participants || [];

        // Remove this user from participants
        const updatedParticipants = currentParticipants.filter(
          (p: any) => p.oderId !== userId
        );

        if (updatedParticipants.length === 0) {
          // Room is now empty - check if it's protected or old enough to delete
          const createdAt = roomData.createdAt?.toDate?.() || new Date();
          const roomAge = Date.now() - createdAt.getTime();

          // Check for creator grace period protection
          const creatorGraceUntil = roomData.creatorGraceUntil?.toDate?.();
          const isInGracePeriod = creatorGraceUntil && Date.now() < creatorGraceUntil.getTime();

          if (isInGracePeriod) {
            // CREATOR PROTECTION: Don't delete during grace period
            const remainingGrace = creatorGraceUntil.getTime() - Date.now();
            console.log('[RoomService] 🛡️ Room protected by creator grace period for', remainingGrace, 'ms');
            transaction.update(roomRef, {
              participants: [],
              markedForDeletion: Timestamp.now(),
            });
            // Schedule deletion for after grace period
            this.scheduleDelayedDeletion(roomId, remainingGrace + 1000);
          } else if (roomAge >= DELETION_BUFFER_MS) {
            // Room is old enough, delete immediately
            transaction.delete(roomRef);
            console.log('[RoomService] 🗑️ Empty room deleted immediately:', roomId);
          } else {
            // Room is too new - mark for delayed deletion
            const deleteAfter = DELETION_BUFFER_MS - roomAge;
            transaction.update(roomRef, {
              participants: [],
              markedForDeletion: Timestamp.now(),
            });
            console.log('[RoomService] ⏱️ Room marked for deletion in', deleteAfter, 'ms');

            // Schedule delayed deletion
            this.scheduleDelayedDeletion(roomId, deleteAfter);
          }
        } else {
          // Room still has participants
          transaction.update(roomRef, {
            participants: updatedParticipants,
            markedForDeletion: null,
          });
        }
      });

      // Clear local state if this was the active room
      if (this.activeRoomId === roomId) {
        this.activeRoomId = null;
        this.userId = null;
      }

      // Clear presence - "Ich bin nicht mehr hier"
      try {
        await presenceVault.clearRoomPresence(userId);
        console.log('[RoomService] 🌟 Presence cleared for user:', userId);
      } catch (presenceError) {
        console.warn('[RoomService] ⚠️ Presence clear failed:', presenceError);
      }

      console.log('[RoomService] ✅ Left room:', roomId);
    } catch (error) {
      console.error('[RoomService] ❌ Error leaving room:', error);
      // Even on error, clear local state
      if (this.activeRoomId === roomId) {
        this.activeRoomId = null;
        this.userId = null;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELAYED DELETION - 30 Second Buffer
  // ═══════════════════════════════════════════════════════════════════════════

  private scheduleDelayedDeletion(roomId: string, delay: number): void {
    // Cancel any existing deletion for this room
    if (this.pendingDeletions.has(roomId)) {
      clearTimeout(this.pendingDeletions.get(roomId)!);
    }

    const timeoutId = setTimeout(async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);

        await runTransaction(db, async (transaction) => {
          const roomSnap = await transaction.get(roomRef);

          if (!roomSnap.exists()) {
            console.log('[RoomService] Room already deleted');
            return;
          }

          const roomData = roomSnap.data();
          const participants = roomData.participants || [];

          // Only delete if still empty
          if (participants.length === 0) {
            transaction.delete(roomRef);
            console.log('[RoomService] 🗑️ Delayed deletion complete:', roomId);
          } else {
            // Someone joined while waiting, cancel deletion
            transaction.update(roomRef, { markedForDeletion: null });
            console.log('[RoomService] 🔄 Deletion cancelled - room has participants');
          }
        });
      } catch (error) {
        console.error('[RoomService] Delayed deletion error:', error);
      } finally {
        this.pendingDeletions.delete(roomId);
      }
    }, delay);

    this.pendingDeletions.set(roomId, timeoutId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE PARTICIPANT STATE
  // ═══════════════════════════════════════════════════════════════════════════

  async updateParticipantState(
    roomId: string,
    userId: string,
    updates: Partial<Pick<RoomParticipant, 'isMuted' | 'isSpeaking'>>
  ): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data();
        const participants = roomData.participants || [];

        const updatedParticipants = participants.map((p: any) => {
          if (p.oderId === userId) {
            return {
              ...p,
              ...updates,
              lastActiveAt: Timestamp.now(),
            };
          }
          return p;
        });

        transaction.update(roomRef, { participants: updatedParticipants });
      });
    } catch (error) {
      console.error('[RoomService] Error updating participant state:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEARTBEAT - 20 second intervals
  // ═══════════════════════════════════════════════════════════════════════════

  private startHeartbeat(roomId: string, userId: string): void {
    this.stopHeartbeat();

    console.log('[RoomService] 💓 Starting heartbeat for room:', roomId);

    // Send initial heartbeat immediately
    this.sendHeartbeat(roomId, userId);

    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat(roomId, userId);
    }, HEARTBEAT_INTERVAL_MS); // Every 20 seconds
  }

  private async sendHeartbeat(roomId: string, userId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        // Room was deleted, clear local state
        console.log('[RoomService] 💔 Room deleted, clearing state');
        this.activeRoomId = null;
        this.userId = null;
        this.stopHeartbeat();
        return;
      }

      // Update last active timestamp AND cleanup stale participants
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomRef);
        if (!snap.exists()) return;

        const roomData = snap.data();
        const participants = roomData.participants || [];
        const now = Date.now();

        // Update current user's timestamp AND remove stale participants
        const updatedParticipants = participants
          .filter((p: any) => {
            // Keep current user
            if (p.oderId === userId) return true;

            // Check if other participants are stale
            const lastActive = p.lastActiveAt?.toDate?.()?.getTime() || 0;
            const isStale = now - lastActive > STALE_THRESHOLD_MS;

            if (isStale) {
              console.log('[RoomService] 🧹 Removing stale participant:', p.username);
            }
            return !isStale;
          })
          .map((p: any) => {
            if (p.oderId === userId) {
              return { ...p, lastActiveAt: Timestamp.now() };
            }
            return p;
          });

        // Check if room became empty (excluding current user who might be leaving)
        const otherParticipants = updatedParticipants.filter((p: any) => p.oderId !== userId);

        transaction.update(roomRef, {
          participants: updatedParticipants,
          lastActivity: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('[RoomService] Heartbeat error:', error);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP STALE PARTICIPANTS & ROOMS
  // ═══════════════════════════════════════════════════════════════════════════

  async cleanupStaleParticipants(roomId: string): Promise<void> {
    if (this.cleanupScheduled) return;
    this.cleanupScheduled = true;

    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data();
        const participants = roomData.participants || [];
        const now = Date.now();

        // Filter out stale participants (40 seconds without heartbeat)
        const activeParticipants = participants.filter((p: any) => {
          const lastActive = p.lastActiveAt?.toDate?.()?.getTime() || 0;
          const isActive = now - lastActive < STALE_THRESHOLD_MS;
          if (!isActive) {
            console.log('[RoomService] 🧹 Removing stale:', p.username, '- inactive for', now - lastActive, 'ms');
          }
          return isActive;
        });

        if (activeParticipants.length === 0) {
          // Check room's last activity
          const lastActivity = roomData.lastActivity?.toDate?.()?.getTime() || roomData.createdAt?.toDate?.()?.getTime() || 0;
          const roomInactiveTime = now - lastActivity;

          if (roomInactiveTime >= ROOM_INACTIVITY_MS) {
            // Room has been inactive for 60+ seconds, delete immediately
            transaction.delete(roomRef);
            console.log('[RoomService] 🗑️ Deleted inactive room:', roomId);
          } else {
            // Room is fresh but empty, schedule delayed deletion
            this.scheduleDelayedDeletion(roomId, DELETION_BUFFER_MS);
            transaction.update(roomRef, {
              participants: [],
              markedForDeletion: Timestamp.now(),
            });
            console.log('[RoomService] ⏱️ Scheduled deletion for empty room:', roomId);
          }
        } else if (activeParticipants.length < participants.length) {
          transaction.update(roomRef, {
            participants: activeParticipants,
            lastActivity: Timestamp.now(),
          });
          console.log('[RoomService] 🧹 Cleaned', participants.length - activeParticipants.length, 'stale participants');
        }
      });
    } catch (error) {
      console.error('[RoomService] Error cleaning stale participants:', error);
    } finally {
      this.cleanupScheduled = false;
    }
  }

  /**
   * Global cleanup for all stale rooms
   * Call this periodically or on app startup
   */
  async globalCleanup(): Promise<{ deleted: number; cleaned: number }> {
    console.log('[RoomService] 🌍 Starting global cleanup...');

    const stats = { deleted: 0, cleaned: 0 };

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const roomsRef = collection(db, 'rooms');
      const activeRoomsQuery = query(roomsRef, where('isActive', '==', true));
      const snapshot = await getDocs(activeRoomsQuery);

      const now = Date.now();

      for (const docSnap of snapshot.docs) {
        const roomData = docSnap.data();
        const participants = roomData.participants || [];
        const roomId = docSnap.id;

        // Check for stale participants
        const activeParticipants = participants.filter((p: any) => {
          const lastActive = p.lastActiveAt?.toDate?.()?.getTime() || 0;
          return now - lastActive < STALE_THRESHOLD_MS;
        });

        if (activeParticipants.length === 0) {
          const lastActivity = roomData.lastActivity?.toDate?.()?.getTime() || roomData.createdAt?.toDate?.()?.getTime() || 0;

          if (now - lastActivity >= ROOM_INACTIVITY_MS) {
            // Delete the room
            const roomRef = doc(db, 'rooms', roomId);
            await deleteDoc(roomRef);
            stats.deleted++;
            console.log('[RoomService] 🗑️ Global cleanup deleted:', roomId);
          }
        } else if (activeParticipants.length < participants.length) {
          // Update with cleaned participants
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, { participants: activeParticipants });
          stats.cleaned++;
        }
      }

      console.log('[RoomService] 🌍 Global cleanup complete:', stats);
      return stats;
    } catch (error) {
      console.error('[RoomService] Global cleanup error:', error);
      return stats;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  forceLeave(): void {
    if (this.activeRoomId && this.userId) {
      this.leaveRoom(this.activeRoomId, this.userId).catch(() => {});
      this.activeRoomId = null;
      this.userId = null;
    }
    this.stopHeartbeat();
  }

  getActiveRoomId(): string | null {
    return this.activeRoomId;
  }

  isInRoom(): boolean {
    return this.activeRoomId !== null;
  }

  setActiveRoom(roomId: string, oderId: string): void {
    this.activeRoomId = roomId;
    this.userId = oderId;
    this.startHeartbeat(roomId, oderId);
    console.log('[RoomService] ✅ Manually set active room:', roomId);
  }

  // Legacy compatibility
  async joinRoom(params: {
    roomId: string;
    userId: string;
    username: string;
    displayName: string;
    level: number;
    isAnonymous: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    return this.joinRoomSafe(params);
  }
}

// Singleton instance
export const roomService = new RoomService();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

export function useRoomService(userId: string | null) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLeavingRef = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP HANDLERS - "Clean Sweep" Edition
  // Ensures user is properly removed from room on:
  // - Tab close / Browser close (beforeunload)
  // - Tab hidden for too long (visibilitychange)
  // - Network disconnection (offline)
  // - Page navigation (pagehide)
  // ═══════════════════════════════════════════════════════════════════════════

  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Handle tab close / browser close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[RoomService] 🚪 beforeunload triggered');

      // Use sendBeacon for reliable async cleanup
      const roomId = roomService.getActiveRoomId();
      if (roomId && userId) {
        // Fallback: force leave synchronously
        roomService.forceLeave();

        // Also clear presence
        try {
          presenceVault.clearRoomPresence(userId);
        } catch (err) {
          console.warn('[RoomService] Presence clear failed on unload');
        }
      }
    };

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[RoomService] 👁️ Tab hidden - starting 30s timer');

        // Clear any existing timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        // Leave room after 30 seconds of being hidden
        visibilityTimeoutRef.current = setTimeout(() => {
          if (document.visibilityState === 'hidden' && userId) {
            const roomId = roomService.getActiveRoomId();
            if (roomId) {
              console.log('[RoomService] ⏰ 30s hidden - leaving room');
              roomService.leaveRoom(roomId, userId);
            }
          }
        }, 30000);
      } else {
        // Tab became visible again - cancel the leave timer
        console.log('[RoomService] 👁️ Tab visible - cancelling leave timer');
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      }
    };

    // Handle network offline
    const handleOffline = () => {
      console.log('[RoomService] 📡 Network offline - force leave');
      roomService.forceLeave();
    };

    // Handle page hide (more reliable than beforeunload on mobile)
    const handlePageHide = (e: PageTransitionEvent) => {
      console.log('[RoomService] 📄 pagehide triggered, persisted:', e.persisted);

      if (!e.persisted) {
        // Page is being unloaded, not cached
        roomService.forceLeave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pagehide', handlePageHide);

      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [userId]);

  const joinRoom = useCallback(async (params: {
    roomId: string;
    username: string;
    displayName: string;
    level: number;
    isAnonymous: boolean;
    isGhost?: boolean;
  }) => {
    if (!userId || isJoining) return { success: false, error: 'Nicht eingeloggt' };

    setIsJoining(true);
    setError(null);

    const result = await roomService.joinRoomSafe({
      ...params,
      userId,
    });

    if (!result.success) {
      setError(result.error || 'Fehler beim Beitreten');
    }

    setIsJoining(false);
    return result;
  }, [userId, isJoining]);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!userId || isLeavingRef.current) return;

    isLeavingRef.current = true;
    setIsLeaving(true);

    await roomService.leaveRoom(roomId, userId);

    setIsLeaving(false);
    isLeavingRef.current = false;
  }, [userId]);

  const updateState = useCallback(async (
    roomId: string,
    updates: { isMuted?: boolean; isSpeaking?: boolean }
  ) => {
    if (!userId) return;
    await roomService.updateParticipantState(roomId, userId, updates);
  }, [userId]);

  return {
    joinRoom,
    leaveRoom,
    updateState,
    isJoining,
    isLeaving,
    error,
    isInRoom: roomService.isInRoom(),
    activeRoomId: roomService.getActiveRoomId(),
    isFounder: userId ? isFounder(userId) : false,
  };
}

export default roomService;
