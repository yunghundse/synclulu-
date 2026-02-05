/**
 * roomManagement.ts
 * 🏠 SOVEREIGN ROOM MANAGEMENT SYSTEM
 *
 * Features:
 * - User exit handling with host migration
 * - Auto-delete when room is empty
 * - Real-time participant tracking
 * - Presence management (app minimized = still visible)
 *
 * @version 35.1.0 - Room Lifecycle Edition
 */

import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  onSnapshot,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface RoomParticipant {
  oderId: string;
  odId?: string;
  displayName: string;
  photoURL?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: Timestamp;
  level?: number;
  isHost?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  isAnonymous: boolean;
  participants: RoomParticipant[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  hostId: string;
}

/**
 * Join a room - adds user to participants array
 */
export const joinRoom = async (
  roomId: string,
  userId: string,
  displayName: string,
  photoURL?: string,
  level?: number,
  isAnonymous?: boolean
): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.error('[RoomManagement] Room does not exist:', roomId);
      return false;
    }

    const roomData = roomSnap.data();
    const currentParticipants = roomData.participants || [];

    // Check if room is full
    if (currentParticipants.length >= (roomData.maxParticipants || 8)) {
      console.warn('[RoomManagement] Room is full');
      return false;
    }

    // Check if user is already in room
    const existingParticipant = currentParticipants.find(
      (p: RoomParticipant) => p.oderId === userId || p.odId === userId
    );
    if (existingParticipant) {
      console.log('[RoomManagement] User already in room');
      return true;
    }

    // Add participant
    const newParticipant: RoomParticipant = {
      oderId: userId,
      displayName: isAnonymous ? 'Wanderer' : displayName,
      photoURL: isAnonymous ? undefined : photoURL,
      isSpeaking: false,
      isMuted: true,
      joinedAt: Timestamp.now(),
      level: level || 0,
      isHost: currentParticipants.length === 0, // First person becomes host
    };

    await updateDoc(roomRef, {
      participants: arrayUnion(newParticipant),
      // Set hostId if this is the first participant
      ...(currentParticipants.length === 0 && { hostId: userId }),
    });

    console.log('[RoomManagement] User joined room:', userId);
    return true;
  } catch (error) {
    console.error('[RoomManagement] Error joining room:', error);
    return false;
  }
};

/**
 * Leave a room - handles host migration and auto-delete
 */
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      console.log('[RoomManagement] Room already deleted');
      return;
    }

    const roomData = roomSnap.data();
    const participants: RoomParticipant[] = roomData.participants || [];

    // Find the user's participant object
    const userParticipant = participants.find(
      (p) => p.oderId === userId || p.odId === userId
    );

    if (!userParticipant) {
      console.log('[RoomManagement] User not in room');
      return;
    }

    // Remove user from participants
    const updatedParticipants = participants.filter(
      (p) => p.oderId !== userId && p.odId !== userId
    );

    // If room is now empty, delete it
    if (updatedParticipants.length === 0) {
      await deleteDoc(roomRef);
      console.log('[RoomManagement] Room deleted (empty):', roomId);
      return;
    }

    // If the leaving user was the host, migrate host to next person
    const wasHost = roomData.hostId === userId || userParticipant.isHost;
    let newHostId = roomData.hostId;
    let updatedParticipantsWithHost = updatedParticipants;

    if (wasHost) {
      // Sort by joinedAt to get the earliest joiner
      const sortedByJoinTime = [...updatedParticipants].sort(
        (a, b) => a.joinedAt.toMillis() - b.joinedAt.toMillis()
      );
      const newHost = sortedByJoinTime[0];
      newHostId = newHost.oderId || newHost.odId;

      // Update isHost flags
      updatedParticipantsWithHost = updatedParticipants.map((p) => ({
        ...p,
        isHost: (p.oderId || p.odId) === newHostId,
      }));

      console.log('[RoomManagement] Host migrated to:', newHostId);
    }

    await updateDoc(roomRef, {
      participants: updatedParticipantsWithHost,
      hostId: newHostId,
    });

    console.log('[RoomManagement] User left room:', userId);
  } catch (error) {
    console.error('[RoomManagement] Error leaving room:', error);
  }
};

/**
 * Update participant speaking status
 */
export const updateSpeakingStatus = async (
  roomId: string,
  oderId: string,
  isSpeaking: boolean
): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();
    const participants: RoomParticipant[] = roomData.participants || [];

    const updatedParticipants = participants.map((p) => {
      if (p.oderId === oderId || p.odId === oderId) {
        return { ...p, isSpeaking };
      }
      return p;
    });

    await updateDoc(roomRef, { participants: updatedParticipants });
  } catch (error) {
    console.error('[RoomManagement] Error updating speaking status:', error);
  }
};

/**
 * Update participant mute status
 */
export const updateMuteStatus = async (
  roomId: string,
  oderId: string,
  isMuted: boolean
): Promise<void> => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data();
    const participants: RoomParticipant[] = roomData.participants || [];

    const updatedParticipants = participants.map((p) => {
      if (p.oderId === oderId || p.odId === oderId) {
        return { ...p, isMuted };
      }
      return p;
    });

    await updateDoc(roomRef, { participants: updatedParticipants });
  } catch (error) {
    console.error('[RoomManagement] Error updating mute status:', error);
  }
};

/**
 * Subscribe to room changes (real-time)
 */
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: Room | null) => void
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
      name: data.name,
      type: data.type || 'public',
      isAnonymous: data.isAnonymous || false,
      participants: data.participants || [],
      maxParticipants: data.maxParticipants || 8,
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      hostId: data.hostId || data.createdBy,
    });
  });
};

/**
 * Subscribe to all active rooms (for Discover page)
 */
export const subscribeToActiveRooms = (
  onUpdate: (rooms: Room[]) => void
): (() => void) => {
  const roomsRef = collection(db, 'rooms');
  const activeRoomsQuery = query(roomsRef, where('isActive', '!=', false));

  return onSnapshot(activeRoomsQuery, (snapshot) => {
    const rooms: Room[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      rooms.push({
        id: doc.id,
        name: data.name || 'Unbenannt',
        type: data.type || 'public',
        isAnonymous: data.isAnonymous || false,
        participants: data.participants || [],
        maxParticipants: data.maxParticipants || 8,
        isActive: data.isActive !== false,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        hostId: data.hostId || data.createdBy,
      });
    });

    // Sort by participant count (most active first), then by creation time
    rooms.sort((a, b) => {
      const countDiff = b.participants.length - a.participants.length;
      if (countDiff !== 0) return countDiff;
      return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    });

    onUpdate(rooms);
  });
};

/**
 * Send friend request to a user
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<boolean> => {
  try {
    const fromUserRef = doc(db, 'users', fromUserId);
    const toUserRef = doc(db, 'users', toUserId);

    // Add to sender's sent requests
    await updateDoc(fromUserRef, {
      sentFriendRequests: arrayUnion({
        userId: toUserId,
        sentAt: Timestamp.now(),
      }),
    });

    // Add to receiver's pending requests
    await updateDoc(toUserRef, {
      pendingFriendRequests: arrayUnion({
        userId: fromUserId,
        receivedAt: Timestamp.now(),
      }),
    });

    console.log('[RoomManagement] Friend request sent:', fromUserId, '->', toUserId);
    return true;
  } catch (error) {
    console.error('[RoomManagement] Error sending friend request:', error);
    return false;
  }
};

/**
 * Give a star to a user
 */
export const giveStarToUser = async (
  fromUserId: string,
  toUserId: string
): Promise<boolean> => {
  try {
    const toUserRef = doc(db, 'users', toUserId);
    const toUserSnap = await getDoc(toUserRef);

    if (!toUserSnap.exists()) return false;

    const currentStars = toUserSnap.data().stars || 0;
    const starGivers = toUserSnap.data().starGivers || [];

    // Check if already given a star
    if (starGivers.includes(fromUserId)) {
      console.log('[RoomManagement] Already gave star');
      return false;
    }

    await updateDoc(toUserRef, {
      stars: currentStars + 1,
      starGivers: arrayUnion(fromUserId),
    });

    console.log('[RoomManagement] Star given to:', toUserId);
    return true;
  } catch (error) {
    console.error('[RoomManagement] Error giving star:', error);
    return false;
  }
};

export default {
  joinRoom,
  leaveRoom,
  updateSpeakingStatus,
  updateMuteStatus,
  subscribeToRoom,
  subscribeToActiveRooms,
  sendFriendRequest,
  giveStarToUser,
};
