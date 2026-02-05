/**
 * wölkchenService.ts
 * ☁️ SOVEREIGN WÖLKCHEN SERVICE v37.0
 *
 * Clean Room Management System - No Dummy Data
 *
 * Features:
 * - Clean room creation (empty participants, only creatorId)
 * - Real-time room subscriptions
 * - Host migration on leave
 * - Auto-delete when empty
 * - Database-pure operations
 *
 * @version 37.0.0 - Clean Room Edition
 */

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WölkchenParticipant {
  oderId: string;
  displayName: string;
  photoURL?: string;
  level: number;
  isHost: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Timestamp;
}

export interface Wölkchen {
  id: string;
  name: string;
  description?: string;
  type: 'öffentlich' | 'privat' | 'anonym';
  participants: WölkchenParticipant[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  hostId: string;
  userCount: number;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  tags?: string[];
}

export interface CreateWölkchenParams {
  name: string;
  description?: string;
  type: 'öffentlich' | 'privat' | 'anonym';
  maxParticipants?: number;
  creatorId: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE WÖLKCHEN - Clean, no dummy data
// ═══════════════════════════════════════════════════════════════════════════

export const createWölkchen = async (params: CreateWölkchenParams): Promise<string | null> => {
  try {
    const roomData = {
      name: params.name.trim(),
      description: params.description?.trim() || '',
      type: params.type,
      participants: [], // CLEAN: Empty participants array
      maxParticipants: params.maxParticipants || 8,
      isActive: true,
      createdAt: Timestamp.now(),
      createdBy: params.creatorId, // Only store creator ID
      hostId: params.creatorId,
      userCount: 0,
      ...(params.location && { location: params.location }),
      ...(params.tags && { tags: params.tags }),
    };

    const docRef = await addDoc(collection(db, 'rooms'), roomData);
    console.log('[WölkchenService] Wölkchen created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[WölkchenService] Error creating Wölkchen:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// JOIN WÖLKCHEN
// ═══════════════════════════════════════════════════════════════════════════

export const joinWölkchen = async (
  roomId: string,
  userId: string,
  displayName: string,
  photoURL?: string,
  level: number = 0
): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.error('[WölkchenService] Wölkchen not found:', roomId);
      return false;
    }

    const roomData = roomSnap.data();
    const participants: WölkchenParticipant[] = roomData.participants || [];

    // Check if full
    if (participants.length >= (roomData.maxParticipants || 8)) {
      console.warn('[WölkchenService] Wölkchen is full');
      return false;
    }

    // Check if already joined
    const alreadyJoined = participants.some((p) => p.oderId === userId);
    if (alreadyJoined) {
      console.log('[WölkchenService] User already in Wölkchen');
      return true;
    }

    // Create participant entry
    const newParticipant: WölkchenParticipant = {
      oderId: userId,
      displayName: roomData.type === 'anonym' ? 'Wanderer' : displayName,
      photoURL: roomData.type === 'anonym' ? undefined : photoURL,
      level,
      isHost: participants.length === 0, // First person becomes host
      isMuted: true,
      isSpeaking: false,
      joinedAt: Timestamp.now(),
    };

    // Update room
    await updateDoc(roomRef, {
      participants: arrayUnion(newParticipant),
      userCount: increment(1),
      // Set hostId if this is the first participant
      ...(participants.length === 0 && { hostId: userId }),
    });

    // Update user's current room
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentRoomId: roomId,
        lastRoomJoinedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[WölkchenService] Could not update user document');
    }

    console.log('[WölkchenService] User joined Wölkchen:', userId);
    return true;
  } catch (error) {
    console.error('[WölkchenService] Error joining Wölkchen:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAVE WÖLKCHEN - With host migration and auto-delete
// ═══════════════════════════════════════════════════════════════════════════

export const leaveWölkchen = async (roomId: string, userId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.log('[WölkchenService] Wölkchen already deleted');
      return;
    }

    const roomData = roomSnap.data();
    const participants: WölkchenParticipant[] = roomData.participants || [];

    // Find user
    const userParticipant = participants.find((p) => p.oderId === userId);
    if (!userParticipant) {
      console.log('[WölkchenService] User not in Wölkchen');
      return;
    }

    // Remove user
    const updatedParticipants = participants.filter((p) => p.oderId !== userId);

    // AUTO-DELETE: If empty, delete the room
    if (updatedParticipants.length === 0) {
      await deleteDoc(roomRef);
      console.log('[WölkchenService] Wölkchen deleted (empty):', roomId);

      // Clear user's current room
      try {
        await updateDoc(doc(db, 'users', userId), {
          currentRoomId: null,
        });
      } catch (e) {
        console.warn('[WölkchenService] Could not clear user room');
      }
      return;
    }

    // HOST MIGRATION: If leaving user was host
    const wasHost = roomData.hostId === userId || userParticipant.isHost;
    let newHostId = roomData.hostId;
    let finalParticipants = updatedParticipants;

    if (wasHost) {
      // Sort by join time, earliest becomes new host
      const sorted = [...updatedParticipants].sort(
        (a, b) => a.joinedAt.toMillis() - b.joinedAt.toMillis()
      );
      const newHost = sorted[0];
      newHostId = newHost.oderId;

      // Update isHost flags
      finalParticipants = updatedParticipants.map((p) => ({
        ...p,
        isHost: p.oderId === newHostId,
      }));

      console.log('[WölkchenService] Host migrated to:', newHostId);
    }

    // Update room
    await updateDoc(roomRef, {
      participants: finalParticipants,
      hostId: newHostId,
      userCount: increment(-1),
    });

    // Clear user's current room
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentRoomId: null,
      });
    } catch (e) {
      console.warn('[WölkchenService] Could not clear user room');
    }

    console.log('[WölkchenService] User left Wölkchen:', userId);
  } catch (error) {
    console.error('[WölkchenService] Error leaving Wölkchen:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE PARTICIPANT STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const updateParticipantStatus = async (
  roomId: string,
  userId: string,
  updates: Partial<Pick<WölkchenParticipant, 'isMuted' | 'isSpeaking'>>
): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const participants: WölkchenParticipant[] = roomSnap.data().participants || [];

    const updatedParticipants = participants.map((p) =>
      p.oderId === userId ? { ...p, ...updates } : p
    );

    await updateDoc(roomRef, { participants: updatedParticipants });
  } catch (error) {
    console.error('[WölkchenService] Error updating participant:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to a single Wölkchen
 */
export const subscribeToWölkchen = (
  roomId: string,
  onUpdate: (room: Wölkchen | null) => void
): (() => void) => {
  const roomRef = doc(db, 'rooms', roomId);

  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    const data = snapshot.data();
    onUpdate({
      id: snapshot.id,
      name: data.name || 'Unbenannt',
      description: data.description,
      type: data.type || 'öffentlich',
      participants: data.participants || [],
      maxParticipants: data.maxParticipants || 8,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      hostId: data.hostId || data.createdBy,
      userCount: data.userCount || (data.participants || []).length,
      location: data.location,
      tags: data.tags,
    });
  });
};

/**
 * Subscribe to all active Wölkchen (for Discover & Home)
 */
export const subscribeToActiveWölkchen = (
  onUpdate: (rooms: Wölkchen[]) => void,
  maxCount: number = 50
): (() => void) => {
  const roomsQuery = query(
    collection(db, 'rooms'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      const rooms: Wölkchen[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Unbenannt',
          description: data.description,
          type: data.type || 'öffentlich',
          participants: data.participants || [],
          maxParticipants: data.maxParticipants || 8,
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          hostId: data.hostId || data.createdBy,
          userCount: data.userCount || (data.participants || []).length,
          location: data.location,
          tags: data.tags,
        };
      });

      // Sort: Most participants first
      rooms.sort((a, b) => b.participants.length - a.participants.length);
      onUpdate(rooms);
    },
    (error) => {
      console.error('[WölkchenService] Subscription error:', error);
      onUpdate([]);
    }
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get activity level based on participant count
 */
export const getActivityLevel = (
  participantCount: number
): 'ruhig' | 'aktiv' | 'sehr_aktiv' | 'hot' => {
  if (participantCount >= 6) return 'hot';
  if (participantCount >= 4) return 'sehr_aktiv';
  if (participantCount >= 2) return 'aktiv';
  return 'ruhig';
};

/**
 * Get activity color
 */
export const getActivityColor = (level: ReturnType<typeof getActivityLevel>): string => {
  switch (level) {
    case 'hot':
      return '#ef4444'; // red
    case 'sehr_aktiv':
      return '#f97316'; // orange
    case 'aktiv':
      return '#22c55e'; // green
    default:
      return '#6b7280'; // gray
  }
};

/**
 * Get activity glow
 */
export const getActivityGlow = (level: ReturnType<typeof getActivityLevel>): string => {
  switch (level) {
    case 'hot':
      return '0 0 20px rgba(239, 68, 68, 0.5)';
    case 'sehr_aktiv':
      return '0 0 15px rgba(249, 115, 22, 0.4)';
    case 'aktiv':
      return '0 0 10px rgba(34, 197, 94, 0.3)';
    default:
      return 'none';
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clean up empty/stale rooms
 */
export const cleanupStaleRooms = async (): Promise<number> => {
  try {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);

    let deletedCount = 0;
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const participants = data.participants || [];
      const createdAt = data.createdAt?.toMillis() || 0;

      // Delete if:
      // 1. Empty and older than 1 hour
      // 2. Marked as inactive
      if (
        (participants.length === 0 && createdAt < oneHourAgo) ||
        data.isActive === false
      ) {
        await deleteDoc(docSnap.ref);
        deletedCount++;
        console.log('[WölkchenService] Deleted stale room:', docSnap.id);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('[WölkchenService] Cleanup error:', error);
    return 0;
  }
};

export default {
  createWölkchen,
  joinWölkchen,
  leaveWölkchen,
  updateParticipantStatus,
  subscribeToWölkchen,
  subscribeToActiveWölkchen,
  getActivityLevel,
  getActivityColor,
  getActivityGlow,
  cleanupStaleRooms,
};
