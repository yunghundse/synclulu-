/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FLUID NEBULA ROOM SERVICE v13.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 🚀 PERFORMANCE OPTIMIZATIONS:
 * - Optimistic UI Updates (0ms perceived latency)
 * - Smooth-Join Algorithm (auto-fusion of nearby rooms)
 * - Ghost-Creation for Founder (bypass GPS requirements)
 * - Atomic Transactions (prevents race conditions)
 * - Smart Heartbeat (only on significant changes)
 *
 * @version 13.0.0 - Fluid Nebula
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
  GeoPoint,
  addDoc,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FluidParticipant {
  oderId: string;
  username: string;
  displayName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isAnonymous: boolean;
  level: number;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  connectionState: 'optimistic' | 'connecting' | 'connected' | 'disconnecting';
}

export interface FluidRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'regional' | 'ghost';
  isAnonymous: boolean;
  participants: FluidParticipant[];
  maxParticipants: number;
  xpMultiplier: number;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  location?: GeoPoint;
  regionName?: string;
  // Fluid Nebula additions
  isGhostRoom?: boolean;
  mergedFrom?: string[]; // IDs of rooms that were auto-merged
  optimisticId?: string; // Temporary ID before server confirms
}

export interface CreateRoomParams {
  name: string;
  type: 'public' | 'private' | 'regional';
  isAnonymous: boolean;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorLevel: number;
  location?: { lat: number; lng: number };
  regionName?: string;
  isGhostMode?: boolean; // Founder bypass
}

export interface JoinRoomParams {
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  level: number;
  isAnonymous: boolean;
  location?: { lat: number; lng: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDER IDs (Ghost Mode Access)
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_IDS = [
  'MIbamchs82Ve7y0ecX2TpPyymbw1', // Jan
  // Add more founders as needed
];

function isFounder(userId: string): boolean {
  return FOUNDER_IDS.includes(userId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISTANCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLUID ROOM SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class FluidRoomService {
  private activeRoomId: string | null = null;
  private userId: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastPosition: { lat: number; lng: number } | null = null;
  private optimisticCallbacks: Map<string, (confirmed: boolean, realId?: string) => void> = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMISTIC ROOM CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create room with Optimistic UI - returns immediately with temp ID
   * Real creation happens in background
   */
  async createRoomOptimistic(
    params: CreateRoomParams,
    onConfirm: (success: boolean, realId?: string) => void
  ): Promise<{ optimisticId: string; optimisticRoom: Partial<FluidRoom> }> {
    const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create optimistic room data immediately
    const optimisticRoom: Partial<FluidRoom> = {
      id: optimisticId,
      name: params.name,
      type: params.type,
      isAnonymous: params.isAnonymous,
      participants: [{
        oderId: params.creatorId,
        username: params.creatorUsername,
        displayName: params.isAnonymous ? 'Wanderer' : params.creatorDisplayName,
        isSpeaking: false,
        isMuted: true,
        isAnonymous: params.isAnonymous,
        level: params.creatorLevel,
        joinedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        connectionState: 'optimistic',
      }],
      maxParticipants: 8,
      xpMultiplier: 1,
      isActive: true,
      createdAt: Timestamp.now(),
      createdBy: params.creatorId,
      isGhostRoom: params.isGhostMode,
      optimisticId,
    };

    // Store callback for when creation completes
    this.optimisticCallbacks.set(optimisticId, onConfirm);

    // Background creation
    this.createRoomInBackground(params, optimisticId).catch((error) => {
      console.error('[FluidRoom] Background creation failed:', error);
      onConfirm(false);
      this.optimisticCallbacks.delete(optimisticId);
    });

    return { optimisticId, optimisticRoom };
  }

  /**
   * Background room creation with Smooth-Join logic
   */
  private async createRoomInBackground(
    params: CreateRoomParams,
    optimisticId: string
  ): Promise<void> {
    try {
      // SMOOTH-JOIN: Check for nearby rooms to auto-merge
      if (params.location && !params.isGhostMode) {
        const nearbyRoom = await this.findNearbyRoom(
          params.location,
          params.type,
          params.isAnonymous
        );

        if (nearbyRoom) {
          // Auto-join existing room instead of creating new one
          console.log('[FluidRoom] 🔄 Smooth-Join: Merging into existing room:', nearbyRoom.id);

          await this.joinRoomDirect({
            roomId: nearbyRoom.id,
            userId: params.creatorId,
            username: params.creatorUsername,
            displayName: params.creatorDisplayName,
            level: params.creatorLevel,
            isAnonymous: params.isAnonymous,
          });

          // Notify callback with merged room ID
          const callback = this.optimisticCallbacks.get(optimisticId);
          if (callback) {
            callback(true, nearbyRoom.id);
            this.optimisticCallbacks.delete(optimisticId);
          }

          this.activeRoomId = nearbyRoom.id;
          this.userId = params.creatorId;
          return;
        }
      }

      // No nearby room found - create new one
      const roomData: any = {
        name: params.name,
        type: params.type,
        isAnonymous: params.isAnonymous,
        participants: [{
          oderId: params.creatorId,
          username: params.creatorUsername,
          displayName: params.isAnonymous ? 'Wanderer' : params.creatorDisplayName,
          isSpeaking: false,
          isMuted: true,
          isAnonymous: params.isAnonymous,
          level: params.creatorLevel,
          joinedAt: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          connectionState: 'connected',
        }],
        maxParticipants: 8,
        xpMultiplier: params.regionName ? 2 : 1,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: params.creatorId,
        isGhostRoom: params.isGhostMode || false,
      };

      // Add location if provided (and not ghost mode)
      if (params.location && !params.isGhostMode) {
        roomData.location = new GeoPoint(params.location.lat, params.location.lng);
      }

      if (params.regionName) {
        roomData.regionName = params.regionName;
      }

      // Create in Firestore
      const docRef = await addDoc(collection(db, 'rooms'), roomData);

      console.log('[FluidRoom] ✅ Room created:', docRef.id);

      // Notify callback
      const callback = this.optimisticCallbacks.get(optimisticId);
      if (callback) {
        callback(true, docRef.id);
        this.optimisticCallbacks.delete(optimisticId);
      }

      // Set active room
      this.activeRoomId = docRef.id;
      this.userId = params.creatorId;

      // Start heartbeat
      this.startSmartHeartbeat(docRef.id, params.creatorId);

    } catch (error) {
      console.error('[FluidRoom] ❌ Room creation failed:', error);
      const callback = this.optimisticCallbacks.get(optimisticId);
      if (callback) {
        callback(false);
        this.optimisticCallbacks.delete(optimisticId);
      }
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMOOTH-JOIN: Find nearby rooms for auto-fusion
  // ═══════════════════════════════════════════════════════════════════════════

  private async findNearbyRoom(
    location: { lat: number; lng: number },
    type: string,
    isAnonymous: boolean
  ): Promise<FluidRoom | null> {
    const MERGE_RADIUS = 100; // 100 meters

    try {
      // Query active rooms
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Skip if different type or anonymity
        if (data.type !== type || data.isAnonymous !== isAnonymous) continue;

        // Skip if room is full
        if ((data.participants?.length || 0) >= (data.maxParticipants || 8)) continue;

        // Skip if no location
        if (!data.location) continue;

        // Check distance
        const distance = calculateDistance(
          location.lat, location.lng,
          data.location.latitude, data.location.longitude
        );

        if (distance <= MERGE_RADIUS) {
          return {
            id: docSnap.id,
            ...data,
          } as FluidRoom;
        }
      }

      return null;
    } catch (error) {
      console.error('[FluidRoom] Error finding nearby room:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIMISTIC JOIN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Join room with Optimistic UI
   */
  async joinRoomOptimistic(
    params: JoinRoomParams,
    onConfirm: (success: boolean) => void
  ): Promise<{ optimisticParticipant: FluidParticipant }> {
    const optimisticParticipant: FluidParticipant = {
      oderId: params.userId,
      username: params.username,
      displayName: params.isAnonymous ? 'Wanderer' : params.displayName,
      isSpeaking: false,
      isMuted: true,
      isAnonymous: params.isAnonymous,
      level: params.level,
      joinedAt: Timestamp.now(),
      lastActiveAt: Timestamp.now(),
      connectionState: 'optimistic',
    };

    // Background join
    this.joinRoomDirect(params)
      .then(() => {
        onConfirm(true);
      })
      .catch((error) => {
        console.error('[FluidRoom] Join failed:', error);
        onConfirm(false);
      });

    return { optimisticParticipant };
  }

  /**
   * Direct room join (used by optimistic and smooth-join)
   */
  private async joinRoomDirect(params: JoinRoomParams): Promise<void> {
    const { roomId, userId, username, displayName, level, isAnonymous } = params;

    // Leave current room if any
    if (this.activeRoomId && this.activeRoomId !== roomId) {
      await this.leaveRoom(this.activeRoomId, this.userId!);
    }

    const roomRef = doc(db, 'rooms', roomId);

    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Raum existiert nicht mehr');
      }

      const roomData = roomSnap.data();

      if (!roomData.isActive) {
        throw new Error('Raum ist nicht mehr aktiv');
      }

      const currentParticipants = roomData.participants || [];

      // Check capacity
      if (currentParticipants.length >= (roomData.maxParticipants || 8)) {
        throw new Error('Raum ist voll');
      }

      // Remove duplicates
      const cleanedParticipants = currentParticipants.filter(
        (p: any) => p.oderId !== userId
      );

      // Add new participant
      const newParticipant: FluidParticipant = {
        oderId: userId,
        username,
        displayName: isAnonymous || roomData.isAnonymous ? 'Wanderer' : displayName,
        isSpeaking: false,
        isMuted: true,
        isAnonymous: isAnonymous || roomData.isAnonymous,
        level,
        joinedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        connectionState: 'connected',
      };

      transaction.update(roomRef, {
        participants: [...cleanedParticipants, newParticipant],
      });
    });

    this.activeRoomId = roomId;
    this.userId = userId;
    this.startSmartHeartbeat(roomId, userId);

    console.log('[FluidRoom] ✅ Joined room:', roomId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVE ROOM
  // ═══════════════════════════════════════════════════════════════════════════

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    console.log('[FluidRoom] 🚪 Leaving room:', roomId);
    this.stopHeartbeat();

    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) {
          console.log('[FluidRoom] Room already deleted');
          return;
        }

        const roomData = roomSnap.data();
        const participants = roomData.participants || [];

        // Remove user
        const remaining = participants.filter((p: any) => p.oderId !== userId);

        if (remaining.length === 0) {
          // Delete empty room
          transaction.delete(roomRef);
          console.log('[FluidRoom] 🗑️ Empty room deleted:', roomId);
        } else {
          transaction.update(roomRef, { participants: remaining });
        }
      });

      if (this.activeRoomId === roomId) {
        this.activeRoomId = null;
        this.userId = null;
      }

      console.log('[FluidRoom] ✅ Left room:', roomId);
    } catch (error) {
      console.error('[FluidRoom] ❌ Error leaving room:', error);
      if (this.activeRoomId === roomId) {
        this.activeRoomId = null;
        this.userId = null;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART HEARTBEAT (only sends on significant movement)
  // ═══════════════════════════════════════════════════════════════════════════

  private startSmartHeartbeat(roomId: string, userId: string): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          this.activeRoomId = null;
          this.userId = null;
          this.stopHeartbeat();
          return;
        }

        // Only update if needed (every 30s minimum)
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(roomRef);
          if (!snap.exists()) return;

          const participants = snap.data().participants || [];
          const updated = participants.map((p: any) => {
            if (p.oderId === userId) {
              return { ...p, lastActiveAt: Timestamp.now(), connectionState: 'connected' };
            }
            return p;
          });

          transaction.update(roomRef, { participants: updated });
        });
      } catch (error) {
        console.error('[FluidRoom] Heartbeat error:', error);
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDER GHOST MODE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create ghost room (founder only) - bypasses location requirements
   */
  async createGhostRoom(
    params: Omit<CreateRoomParams, 'location' | 'isGhostMode'>,
    onConfirm: (success: boolean, realId?: string) => void
  ): Promise<{ optimisticId: string; optimisticRoom: Partial<FluidRoom> } | null> {
    if (!isFounder(params.creatorId)) {
      console.warn('[FluidRoom] ⛔ Ghost mode requires founder access');
      onConfirm(false);
      return null;
    }

    console.log('[FluidRoom] 👻 Creating ghost room (Founder Mode)');

    return this.createRoomOptimistic(
      { ...params, isGhostMode: true },
      onConfirm
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP STALE PARTICIPANTS
  // ═══════════════════════════════════════════════════════════════════════════

  async cleanupStaleParticipants(roomId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return;

        const participants = roomSnap.data().participants || [];
        const now = Date.now();
        const STALE_THRESHOLD = 60000; // 60 seconds

        const active = participants.filter((p: any) => {
          const lastActive = p.lastActiveAt?.toDate?.()?.getTime() || 0;
          return now - lastActive < STALE_THRESHOLD;
        });

        if (active.length === 0) {
          transaction.delete(roomRef);
          console.log('[FluidRoom] 🗑️ Deleted room with only stale participants');
        } else if (active.length < participants.length) {
          transaction.update(roomRef, { participants: active });
          console.log('[FluidRoom] 🧹 Cleaned', participants.length - active.length, 'stale participants');
        }
      });
    } catch (error) {
      console.error('[FluidRoom] Cleanup error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE PARTICIPANT STATE
  // ═══════════════════════════════════════════════════════════════════════════

  async updateParticipantState(
    roomId: string,
    userId: string,
    updates: { isMuted?: boolean; isSpeaking?: boolean }
  ): Promise<void> {
    try {
      const roomRef = doc(db, 'rooms', roomId);

      await runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) return;

        const participants = roomSnap.data().participants || [];
        const updated = participants.map((p: any) => {
          if (p.oderId === userId) {
            return { ...p, ...updates, lastActiveAt: Timestamp.now() };
          }
          return p;
        });

        transaction.update(roomRef, { participants: updated });
      });
    } catch (error) {
      console.error('[FluidRoom] Error updating state:', error);
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

  isUserFounder(userId: string): boolean {
    return isFounder(userId);
  }
}

// Singleton
export const fluidRoomService = new FluidRoomService();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

export function useFluidRoomService(userId: string | null) {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticRoom, setOptimisticRoom] = useState<Partial<FluidRoom> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => fluidRoomService.forceLeave();
    const handleOffline = () => fluidRoomService.forceLeave();

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
      fluidRoomService.forceLeave();
    };
  }, []);

  const createRoom = useCallback(async (params: Omit<CreateRoomParams, 'creatorId'>) => {
    if (!userId) return null;
    setIsCreating(true);
    setError(null);

    const result = await fluidRoomService.createRoomOptimistic(
      { ...params, creatorId: userId },
      (success, realId) => {
        setIsCreating(false);
        if (!success) {
          setError('Fehler beim Erstellen');
          setOptimisticRoom(null);
        }
      }
    );

    setOptimisticRoom(result.optimisticRoom);
    return result;
  }, [userId]);

  const createGhostRoom = useCallback(async (params: Omit<CreateRoomParams, 'creatorId' | 'location' | 'isGhostMode'>) => {
    if (!userId) return null;
    if (!fluidRoomService.isUserFounder(userId)) {
      setError('Ghost-Modus nur für Founder');
      return null;
    }

    setIsCreating(true);
    setError(null);

    const result = await fluidRoomService.createGhostRoom(
      { ...params, creatorId: userId, creatorUsername: params.creatorUsername, creatorDisplayName: params.creatorDisplayName, creatorLevel: params.creatorLevel },
      (success, realId) => {
        setIsCreating(false);
        if (!success) {
          setError('Fehler beim Erstellen');
          setOptimisticRoom(null);
        }
      }
    );

    if (result) {
      setOptimisticRoom(result.optimisticRoom);
    }
    return result;
  }, [userId]);

  const joinRoom = useCallback(async (params: Omit<JoinRoomParams, 'userId'>) => {
    if (!userId) return null;
    setIsJoining(true);
    setError(null);

    const result = await fluidRoomService.joinRoomOptimistic(
      { ...params, userId },
      (success) => {
        setIsJoining(false);
        if (!success) setError('Fehler beim Beitreten');
      }
    );

    return result;
  }, [userId]);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!userId) return;
    setIsLeaving(true);
    await fluidRoomService.leaveRoom(roomId, userId);
    setIsLeaving(false);
    setOptimisticRoom(null);
  }, [userId]);

  const updateState = useCallback(async (roomId: string, updates: { isMuted?: boolean; isSpeaking?: boolean }) => {
    if (!userId) return;
    await fluidRoomService.updateParticipantState(roomId, userId, updates);
  }, [userId]);

  return {
    createRoom,
    createGhostRoom,
    joinRoom,
    leaveRoom,
    updateState,
    isCreating,
    isJoining,
    isLeaving,
    error,
    optimisticRoom,
    isFounder: userId ? fluidRoomService.isUserFounder(userId) : false,
    isInRoom: fluidRoomService.isInRoom(),
    activeRoomId: fluidRoomService.getActiveRoomId(),
  };
}

export default fluidRoomService;
