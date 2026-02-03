/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROOM SCALING ENGINE - Automatic Cloud Room Management
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Mathematical room management that automatically:
 * - Splits rooms when they get too crowded
 * - Merges rooms when they're too empty
 * - Maintains optimal group size (3-5) for real conversations
 *
 * Formula: N(L) = ⌈U_total / U_optimal⌉ + σ
 * Where:
 * - N(L) = Number of rooms at location L
 * - U_total = Total users at location
 * - U_optimal = Optimal users per room (default: 4)
 * - σ = Variance factor for diversity
 *
 * @author Data Scientist (Tinder) × MIT Mathematician
 * @version 1.0.0
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { vibeMatcher, type UserProfile } from './vibeMatchingEngine';
import { calculateHaversineDistance } from './liveRadarService';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const SCALING_CONFIG = {
  // Optimal room sizes
  OPTIMAL_SIZE: 4,          // Ideal number of users
  MIN_SIZE: 2,              // Below this, consider merging
  MAX_SIZE: 6,              // Above this, consider splitting
  CRITICAL_SIZE: 8,         // Force split

  // Timing
  MERGE_DELAY_MS: 60000,    // Wait 1 min before merging (avoid flapping)
  SPLIT_DELAY_MS: 30000,    // Wait 30s before splitting
  INACTIVE_THRESHOLD_MS: 5 * 60 * 1000, // 5 min = inactive

  // Location
  LOCATION_CLUSTER_RADIUS: 500, // 500m = same "location"
  ROOM_DIVERSITY_FACTOR: 0.2,   // σ variance

  // Vibe thresholds
  MIN_VIBE_FOR_MERGE: 40,   // Minimum vibe compatibility to merge
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CloudRoom {
  id: string;
  name: string;
  hostId: string;
  participants: string[];
  participantCount: number;
  maxParticipants: number;
  vibeScore: number;
  activityLevel: number;
  topics: string[];
  location: { lat: number; lng: number };
  radius: number;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  parentRoomId?: string;    // If created from split
  mergedIntoId?: string;    // If merged into another room
}

export interface ScalingEvent {
  type: 'split' | 'merge' | 'create' | 'close';
  timestamp: Date;
  sourceRoomIds: string[];
  resultRoomIds: string[];
  reason: string;
  affectedUsers: string[];
}

export interface LocationCluster {
  center: { lat: number; lng: number };
  rooms: CloudRoom[];
  totalUsers: number;
  optimalRoomCount: number;
  needsRebalancing: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATHEMATICAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate optimal number of rooms for a location
 * N(L) = ⌈U_total / U_optimal⌉ + σ
 */
export function calculateOptimalRoomCount(
  totalUsers: number,
  optimalSize: number = SCALING_CONFIG.OPTIMAL_SIZE,
  variance: number = SCALING_CONFIG.ROOM_DIVERSITY_FACTOR
): number {
  if (totalUsers === 0) return 0;

  // Base calculation
  const baseCount = Math.ceil(totalUsers / optimalSize);

  // Add variance factor (σ) for diversity
  // More users = slightly more variance in room sizes
  const sigma = Math.random() * variance * Math.sqrt(totalUsers / 10);

  return Math.max(1, Math.round(baseCount + sigma));
}

/**
 * Calculate vibe compatibility between two rooms
 * Used for merge decisions
 */
export function calculateRoomCompatibility(room1: CloudRoom, room2: CloudRoom): number {
  // Topic overlap (Jaccard)
  const topics1 = new Set(room1.topics);
  const topics2 = new Set(room2.topics);
  const intersection = new Set([...topics1].filter(x => topics2.has(x)));
  const union = new Set([...topics1, ...topics2]);
  const topicScore = union.size > 0 ? intersection.size / union.size : 0;

  // Vibe score similarity
  const vibeDiff = Math.abs(room1.vibeScore - room2.vibeScore);
  const vibeScore = 1 - (vibeDiff / 100);

  // Activity level similarity
  const activityDiff = Math.abs(room1.activityLevel - room2.activityLevel);
  const activityScore = 1 - activityDiff;

  // Weighted average
  return (topicScore * 0.4 + vibeScore * 0.4 + activityScore * 0.2) * 100;
}

/**
 * Split users into two balanced groups based on vibe compatibility
 */
export async function splitUsersByVibe(
  participants: string[]
): Promise<[string[], string[]]> {
  if (participants.length < 4) {
    // Can't meaningfully split less than 4 users
    return [participants, []];
  }

  // Simple split for now - could be enhanced with K-means clustering
  const midpoint = Math.ceil(participants.length / 2);
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  return [
    shuffled.slice(0, midpoint),
    shuffled.slice(midpoint)
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM SCALING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class RoomScalingEngine {
  private scalingTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventLog: ScalingEvent[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOM OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * User joins a room
   */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Raum nicht gefunden');
    }

    const roomData = roomDoc.data() as CloudRoom;

    // Check capacity
    if (roomData.participantCount >= roomData.maxParticipants) {
      throw new Error('Raum ist voll');
    }

    // Add user to room
    await updateDoc(roomRef, {
      participants: arrayUnion(userId),
      participantCount: increment(1),
      lastActivity: serverTimestamp(),
    });

    // Check if room needs splitting
    await this.checkAndScheduleSplit(roomId);

    console.log(`[RoomScaling] 👤 User ${userId} joined room ${roomId}`);
  }

  /**
   * User leaves a room
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data() as CloudRoom;

    // Remove user from room
    await updateDoc(roomRef, {
      participants: arrayRemove(userId),
      participantCount: increment(-1),
      lastActivity: serverTimestamp(),
    });

    // If host leaves, transfer or close
    if (roomData.hostId === userId) {
      const remainingParticipants = roomData.participants.filter(p => p !== userId);
      if (remainingParticipants.length > 0) {
        // Transfer to next user
        await updateDoc(roomRef, {
          hostId: remainingParticipants[0],
        });
      } else {
        // Close empty room
        await this.closeRoom(roomId, 'Host left and no participants remaining');
      }
    }

    // Check if room should merge
    await this.checkAndScheduleMerge(roomId);

    console.log(`[RoomScaling] 👋 User ${userId} left room ${roomId}`);
  }

  /**
   * Create a new room
   */
  async createRoom(
    hostId: string,
    name: string,
    topics: string[],
    location: { lat: number; lng: number }
  ): Promise<string> {
    const roomId = `cloud_${hostId}_${Date.now()}`;

    await setDoc(doc(db, 'cloudRooms', roomId), {
      id: roomId,
      name,
      hostId,
      participants: [hostId],
      participantCount: 1,
      maxParticipants: SCALING_CONFIG.MAX_SIZE,
      vibeScore: 50,
      activityLevel: 0,
      topics,
      location,
      radius: SCALING_CONFIG.LOCATION_CLUSTER_RADIUS,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isActive: true,
    });

    this.logEvent({
      type: 'create',
      timestamp: new Date(),
      sourceRoomIds: [],
      resultRoomIds: [roomId],
      reason: 'New room created by user',
      affectedUsers: [hostId],
    });

    console.log(`[RoomScaling] 🆕 Room created: ${roomId}`);
    return roomId;
  }

  /**
   * Close a room
   */
  async closeRoom(roomId: string, reason: string): Promise<void> {
    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data() as CloudRoom;

    // Mark as inactive instead of deleting (for history)
    await updateDoc(roomRef, {
      isActive: false,
      closedAt: serverTimestamp(),
      closeReason: reason,
    });

    // Cancel any pending scaling operations
    this.cancelScheduledOperation(roomId);

    this.logEvent({
      type: 'close',
      timestamp: new Date(),
      sourceRoomIds: [roomId],
      resultRoomIds: [],
      reason,
      affectedUsers: roomData.participants,
    });

    console.log(`[RoomScaling] 🚫 Room closed: ${roomId} - ${reason}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPLIT LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if room needs splitting and schedule it
   */
  private async checkAndScheduleSplit(roomId: string): Promise<void> {
    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data() as CloudRoom;

    // Critical size = immediate split
    if (roomData.participantCount >= SCALING_CONFIG.CRITICAL_SIZE) {
      await this.splitRoom(roomId);
      return;
    }

    // Above max = schedule split
    if (roomData.participantCount > SCALING_CONFIG.MAX_SIZE) {
      this.scheduleOperation(roomId, 'split', SCALING_CONFIG.SPLIT_DELAY_MS);
    }
  }

  /**
   * Split a room into two smaller rooms
   */
  async splitRoom(roomId: string): Promise<[string, string]> {
    console.log(`[RoomScaling] ✂️ Splitting room: ${roomId}`);

    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Raum nicht gefunden');
    }

    const roomData = roomDoc.data() as CloudRoom;

    // Split participants by vibe
    const [group1, group2] = await splitUsersByVibe(roomData.participants);

    if (group2.length === 0) {
      console.log('[RoomScaling] ⚠️ Not enough users to split');
      return [roomId, roomId];
    }

    // Create new room for group 2
    const newRoomId = `cloud_split_${Date.now()}`;

    await setDoc(doc(db, 'cloudRooms', newRoomId), {
      id: newRoomId,
      name: `${roomData.name} II`,
      hostId: group2[0],
      participants: group2,
      participantCount: group2.length,
      maxParticipants: SCALING_CONFIG.MAX_SIZE,
      vibeScore: roomData.vibeScore,
      activityLevel: roomData.activityLevel * 0.5,
      topics: roomData.topics,
      location: roomData.location,
      radius: roomData.radius,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isActive: true,
      parentRoomId: roomId,
    });

    // Update original room with group 1
    await updateDoc(roomRef, {
      participants: group1,
      participantCount: group1.length,
      lastActivity: serverTimestamp(),
    });

    // Notify users about the split
    await this.notifyUsersSplit(group2, roomId, newRoomId);

    this.logEvent({
      type: 'split',
      timestamp: new Date(),
      sourceRoomIds: [roomId],
      resultRoomIds: [roomId, newRoomId],
      reason: `Room exceeded ${SCALING_CONFIG.MAX_SIZE} users`,
      affectedUsers: [...group1, ...group2],
    });

    console.log(`[RoomScaling] ✂️ Split complete: ${roomId} → ${roomId}, ${newRoomId}`);
    return [roomId, newRoomId];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MERGE LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if room should merge and schedule it
   */
  private async checkAndScheduleMerge(roomId: string): Promise<void> {
    const roomRef = doc(db, 'cloudRooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data() as CloudRoom;

    // Below minimum = schedule merge
    if (roomData.participantCount < SCALING_CONFIG.MIN_SIZE && roomData.participantCount > 0) {
      this.scheduleOperation(roomId, 'merge', SCALING_CONFIG.MERGE_DELAY_MS);
    }
  }

  /**
   * Merge two rooms into one
   */
  async mergeRooms(roomId1: string, roomId2: string): Promise<string> {
    console.log(`[RoomScaling] 🔗 Merging rooms: ${roomId1} + ${roomId2}`);

    const room1Doc = await getDoc(doc(db, 'cloudRooms', roomId1));
    const room2Doc = await getDoc(doc(db, 'cloudRooms', roomId2));

    if (!room1Doc.exists() || !room2Doc.exists()) {
      throw new Error('Einer der Räume existiert nicht');
    }

    const room1 = room1Doc.data() as CloudRoom;
    const room2 = room2Doc.data() as CloudRoom;

    // Check compatibility
    const compatibility = calculateRoomCompatibility(room1, room2);
    if (compatibility < SCALING_CONFIG.MIN_VIBE_FOR_MERGE) {
      console.log(`[RoomScaling] ⚠️ Rooms not compatible enough: ${compatibility}`);
      return roomId1;
    }

    // Determine which room to keep (larger one)
    const [keepRoom, closeRoom] = room1.participantCount >= room2.participantCount
      ? [room1, room2]
      : [room2, room1];

    const keepRoomId = keepRoom.id;
    const closeRoomId = closeRoom.id;

    // Merge participants
    const mergedParticipants = [...new Set([...keepRoom.participants, ...closeRoom.participants])];

    // Check if merged size is valid
    if (mergedParticipants.length > SCALING_CONFIG.MAX_SIZE) {
      console.log('[RoomScaling] ⚠️ Merged size too large, aborting');
      return roomId1;
    }

    // Update keep room
    await updateDoc(doc(db, 'cloudRooms', keepRoomId), {
      participants: mergedParticipants,
      participantCount: mergedParticipants.length,
      topics: [...new Set([...keepRoom.topics, ...closeRoom.topics])].slice(0, 5),
      vibeScore: (keepRoom.vibeScore + closeRoom.vibeScore) / 2,
      lastActivity: serverTimestamp(),
    });

    // Close merged room
    await updateDoc(doc(db, 'cloudRooms', closeRoomId), {
      isActive: false,
      mergedIntoId: keepRoomId,
      closedAt: serverTimestamp(),
    });

    // Notify users about merge
    await this.notifyUsersMerge(closeRoom.participants, closeRoomId, keepRoomId);

    this.logEvent({
      type: 'merge',
      timestamp: new Date(),
      sourceRoomIds: [keepRoomId, closeRoomId],
      resultRoomIds: [keepRoomId],
      reason: `Rooms merged for optimal size`,
      affectedUsers: mergedParticipants,
    });

    console.log(`[RoomScaling] 🔗 Merge complete: ${closeRoomId} → ${keepRoomId}`);
    return keepRoomId;
  }

  /**
   * Find best room to merge with
   */
  async findMergeCandidate(roomId: string): Promise<string | null> {
    const roomDoc = await getDoc(doc(db, 'cloudRooms', roomId));
    if (!roomDoc.exists()) return null;

    const room = roomDoc.data() as CloudRoom;

    // Find nearby rooms
    const roomsRef = collection(db, 'cloudRooms');
    const q = query(
      roomsRef,
      where('isActive', '==', true),
      where('participantCount', '<', SCALING_CONFIG.MAX_SIZE - room.participantCount)
    );

    const snapshot = await getDocs(q);

    let bestCandidate: string | null = null;
    let bestScore = 0;

    for (const candidateDoc of snapshot.docs) {
      if (candidateDoc.id === roomId) continue;

      const candidate = candidateDoc.data() as CloudRoom;

      // Check location proximity
      const distance = calculateHaversineDistance(
        room.location.lat, room.location.lng,
        candidate.location.lat, candidate.location.lng
      );

      if (distance > SCALING_CONFIG.LOCATION_CLUSTER_RADIUS) continue;

      // Check compatibility
      const compatibility = calculateRoomCompatibility(room, candidate);
      if (compatibility > bestScore && compatibility >= SCALING_CONFIG.MIN_VIBE_FOR_MERGE) {
        bestScore = compatibility;
        bestCandidate = candidateDoc.id;
      }
    }

    return bestCandidate;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULING & NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Schedule a scaling operation
   */
  private scheduleOperation(
    roomId: string,
    operation: 'split' | 'merge',
    delayMs: number
  ): void {
    const key = `${operation}_${roomId}`;

    // Cancel existing timer
    if (this.scalingTimers.has(key)) {
      clearTimeout(this.scalingTimers.get(key)!);
    }

    const timer = setTimeout(async () => {
      this.scalingTimers.delete(key);

      if (operation === 'split') {
        await this.splitRoom(roomId);
      } else {
        const candidate = await this.findMergeCandidate(roomId);
        if (candidate) {
          await this.mergeRooms(roomId, candidate);
        }
      }
    }, delayMs);

    this.scalingTimers.set(key, timer);
    console.log(`[RoomScaling] ⏰ Scheduled ${operation} for room ${roomId} in ${delayMs}ms`);
  }

  /**
   * Cancel scheduled operation
   */
  private cancelScheduledOperation(roomId: string): void {
    ['split', 'merge'].forEach(op => {
      const key = `${op}_${roomId}`;
      if (this.scalingTimers.has(key)) {
        clearTimeout(this.scalingTimers.get(key)!);
        this.scalingTimers.delete(key);
      }
    });
  }

  /**
   * Notify users about room split
   */
  private async notifyUsersSplit(
    movedUsers: string[],
    oldRoomId: string,
    newRoomId: string
  ): Promise<void> {
    for (const userId of movedUsers) {
      await setDoc(doc(db, 'notifications', `split_${Date.now()}_${userId}`), {
        userId,
        type: 'room_split',
        title: 'Raum wurde geteilt',
        body: 'Du wurdest in einen neuen Raum verschoben, um die Gesprächsqualität zu verbessern ✨',
        data: { oldRoomId, newRoomId },
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  /**
   * Notify users about room merge
   */
  private async notifyUsersMerge(
    movedUsers: string[],
    oldRoomId: string,
    newRoomId: string
  ): Promise<void> {
    for (const userId of movedUsers) {
      await setDoc(doc(db, 'notifications', `merge_${Date.now()}_${userId}`), {
        userId,
        type: 'room_merge',
        title: 'Räume wurden zusammengelegt',
        body: 'Dein Raum wurde mit einem anderen verschmolzen 🔗',
        data: { oldRoomId, newRoomId },
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  /**
   * Log scaling event
   */
  private logEvent(event: ScalingEvent): void {
    this.eventLog.push(event);
    // Keep only last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100);
    }
  }

  /**
   * Get recent scaling events
   */
  getRecentEvents(limit: number = 10): ScalingEvent[] {
    return this.eventLog.slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const roomScaling = new RoomScalingEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

export function useCloudRoom(roomId: string | null) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (userId: string) => {
    if (!roomId) return;
    setIsJoining(true);
    setError(null);
    try {
      await roomScaling.joinRoom(roomId, userId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  }, [roomId]);

  const leave = useCallback(async (userId: string) => {
    if (!roomId) return;
    setIsLeaving(true);
    try {
      await roomScaling.leaveRoom(roomId, userId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLeaving(false);
    }
  }, [roomId]);

  return { join, leave, isJoining, isLeaving, error };
}

export default roomScaling;
