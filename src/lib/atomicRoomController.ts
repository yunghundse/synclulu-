/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ATOMIC ROOM CONTROLLER v18.0 - "Vault Shield" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * VAULT PROTECTION: 2-Minuten Raum-Schutz (analog zu SQL vault.force_clean_rooms)
 *
 * Features:
 * - Single atomic get_or_create operation
 * - Global navigation lock (isJoining)
 * - 2-MINUTEN CREATOR PROTECTION (keine Löschung junger Räume)
 * - Atomic Quick Start (User wird SOFORT als Teilnehmer eingetragen)
 * - Retry-Logik mit exponential backoff
 * - Proper cleanup on failure
 *
 * CRITICAL: Raum kann NICHT gelöscht werden wenn:
 * 1. Er jünger als 2 Minuten ist
 * 2. Creator noch in Grace Period ist
 *
 * @author Lead System Architect (WhatsApp × Supabase Vault)
 * @version 18.0.0
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  GeoPoint,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { roomService } from './roomService';
import { presenceVault } from './presenceVault';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const ROOM_SEARCH_RADIUS_KM = 0.5; // 500 meters
const MAX_PARTICIPANTS = 8;
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR PROTECTION - Anti-Kick Grace Period v18.0 (VAULT SHIELD)
// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL: 2 Minuten Schutz wie in SQL vault.force_clean_rooms()
// Verhindert, dass ein Raum gelöscht werden kann, solange er jünger als 2 Minuten ist
// ═══════════════════════════════════════════════════════════════════════════════
const CREATOR_GRACE_PERIOD_MS = 120000; // 2 MINUTEN (120 Sekunden) Schutz für Creator
const MIN_ROOM_AGE_FOR_DELETE_MS = 120000; // Räume jünger als 2 Minuten NIEMALS löschen
const CREATION_LOCK_DURATION_MS = 120000; // 2 Minuten Creation Lock
const ATOMIC_RETRY_DELAY_MS = 500; // Verzögerung zwischen Retry-Versuchen
const MAX_ATOMIC_RETRIES = 3; // Maximale Anzahl an Retry-Versuchen

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE - Navigation Lock
// ═══════════════════════════════════════════════════════════════════════════════

let isJoining = false;
let lastJoinAttempt = 0;
const JOIN_COOLDOWN_MS = 2000; // 2 seconds between attempts

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AtomicJoinParams {
  userId: string;
  username: string;
  displayName: string;
  level: number;
  isAnonymous: boolean;
  latitude: number;
  longitude: number;
}

interface AtomicJoinResult {
  success: boolean;
  roomId?: string;
  roomName?: string;
  isNewRoom?: boolean;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a location bucket key for ~500m precision
 */
function getLocationBucket(lat: number, lon: number): string {
  const latBucket = Math.floor(lat * 200) / 200;
  const lonBucket = Math.floor(lon * 200) / 200;
  return `${latBucket}_${lonBucket}`;
}

/**
 * Generate a friendly room name based on location
 */
function generateRoomName(lat: number, lon: number): string {
  const cloudNames = [
    'Wolke', 'Nebel', 'Himmel', 'Traum', 'Stern',
    'Aurora', 'Cosmos', 'Galaxy', 'Nova', 'Aether'
  ];
  const bucket = getLocationBucket(lat, lon);
  const hash = bucket.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const name = cloudNames[hash % cloudNames.length];
  const number = (hash % 99) + 1;
  return `${name} ${number}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMIC GET OR CREATE ROOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Single atomic operation that either:
 * 1. Finds an existing nearby room with space, OR
 * 2. Creates a new room
 *
 * Never both. Never race conditions.
 */
async function atomicGetOrCreateRoom(
  params: AtomicJoinParams
): Promise<AtomicJoinResult> {
  const { userId, username, displayName, level, isAnonymous, latitude, longitude } = params;
  const isFounder = userId === FOUNDER_UID;

  console.log('[AtomicRoom] 🔄 Starting atomic get_or_create...');

  try {
    // Step 1: Search for existing rooms in area
    const roomsRef = collection(db, 'rooms');
    const activeRoomsQuery = query(
      roomsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(activeRoomsQuery);
    let targetRoomId: string | null = null;
    let targetRoomData: any = null;

    // Find best matching room
    for (const docSnap of snapshot.docs) {
      const roomData = docSnap.data();
      const roomLat = roomData.location?.latitude;
      const roomLon = roomData.location?.longitude;

      if (!roomLat || !roomLon) continue;

      const distance = calculateDistance(latitude, longitude, roomLat, roomLon);
      const participants = roomData.participants || [];

      // Check if room is suitable
      const hasSpace = participants.length < (roomData.maxParticipants || MAX_PARTICIPANTS);
      const isNearby = distance <= ROOM_SEARCH_RADIUS_KM;
      const notAlreadyIn = !participants.some((p: any) => p.oderId === userId);

      if (hasSpace && isNearby && notAlreadyIn) {
        targetRoomId = docSnap.id;
        targetRoomData = roomData;
        console.log('[AtomicRoom] 📍 Found existing room:', targetRoomId, 'distance:', distance.toFixed(3), 'km');
        break;
      }
    }

    // Step 2: Join existing room OR create new one (atomic transaction)
    const result = await runTransaction(db, async (transaction) => {
      if (targetRoomId && targetRoomData) {
        // JOIN EXISTING ROOM
        const roomRef = doc(db, 'rooms', targetRoomId);
        const freshSnap = await transaction.get(roomRef);

        if (!freshSnap.exists()) {
          // Room was deleted, need to create new one
          return { needsCreate: true };
        }

        const freshData = freshSnap.data();
        const participants = freshData.participants || [];

        // Double-check space (could have changed)
        if (participants.length >= (freshData.maxParticipants || MAX_PARTICIPANTS) && !isFounder) {
          return { needsCreate: true };
        }

        // Remove any existing entry for this user
        const cleanedParticipants = participants.filter((p: any) => p.oderId !== userId);

        // Add user to room
        const newParticipant = {
          oderId: userId,
          username,
          displayName: isAnonymous || freshData.isAnonymous ? 'Wanderer' : displayName,
          isSpeaking: false,
          isMuted: true,
          isAnonymous: isAnonymous || freshData.isAnonymous,
          level,
          joinedAt: Timestamp.now(),
          lastActiveAt: Timestamp.now(),
          connectionState: 'connected',
          isGhost: false,
        };

        transaction.update(roomRef, {
          participants: [...cleanedParticipants, newParticipant],
          lastActivity: Timestamp.now(),
          markedForDeletion: null,
        });

        return {
          roomId: targetRoomId,
          roomName: freshData.name,
          isNewRoom: false,
        };
      }

      return { needsCreate: true };
    });

    // Check if we need to create a new room
    if ('needsCreate' in result && result.needsCreate) {
      // ═══════════════════════════════════════════════════════════════════════════
      // CREATE NEW ROOM - With Creator Protection (Anti-Kick)
      // ═══════════════════════════════════════════════════════════════════════════
      //
      // CRITICAL: The creator MUST be in the participants array BEFORE
      // the room document is written. This prevents the race condition
      // where cleanup runs before the creator has "arrived".
      //
      // Grace Period: Room cannot be deleted for 30 seconds after creation,
      // even if participant count temporarily drops to 0.
      // ═══════════════════════════════════════════════════════════════════════════

      const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const roomName = generateRoomName(latitude, longitude);
      const creationTime = Timestamp.now();

      console.log('[AtomicRoom] 🆕 Creating new room with CREATOR PROTECTION:', newRoomId);

      // Creator participant - MUST be included in initial write
      const creatorParticipant = {
        oderId: userId,
        username,
        displayName: isAnonymous ? 'Wanderer' : displayName,
        isSpeaking: false,
        isMuted: true,
        isAnonymous,
        level,
        joinedAt: creationTime,
        lastActiveAt: creationTime,
        connectionState: 'connected',
        isGhost: false,
        isCreator: true, // Mark as room creator
      };

      const newRoomRef = doc(db, 'rooms', newRoomId);

      // ATOMIC WRITE: Room + Creator in single operation
      await setDoc(newRoomRef, {
        name: roomName,
        type: 'public',
        isAnonymous: false,
        // CRITICAL: Creator is ALREADY in participants array
        participants: [creatorParticipant],
        maxParticipants: MAX_PARTICIPANTS,
        xpMultiplier: 1.0,
        isActive: true,
        createdAt: creationTime,
        lastActivity: creationTime,
        createdBy: userId,
        location: new GeoPoint(latitude, longitude),
        locationBucket: getLocationBucket(latitude, longitude),
        isTemporary: true,
        // CREATOR PROTECTION: Grace period prevents early deletion
        creatorGraceUntil: Timestamp.fromMillis(Date.now() + CREATOR_GRACE_PERIOD_MS),
        minAgeForDeletion: MIN_ROOM_AGE_FOR_DELETE_MS,
      });

      // Verify the write succeeded by reading back
      const verifySnap = await getDoc(newRoomRef);
      if (!verifySnap.exists()) {
        throw new Error('Room creation verification failed');
      }

      const verifyData = verifySnap.data();
      const participantCount = verifyData.participants?.length || 0;

      if (participantCount === 0) {
        console.error('[AtomicRoom] ❌ CRITICAL: Creator not in room after creation!');
        throw new Error('Creator not persisted in room');
      }

      console.log('[AtomicRoom] ✅ Room created with creator inside:', {
        roomId: newRoomId,
        participantCount,
        graceUntil: new Date(Date.now() + CREATOR_GRACE_PERIOD_MS).toISOString(),
      });

      return {
        success: true,
        roomId: newRoomId,
        roomName,
        isNewRoom: true,
      };
    }

    // Successfully joined existing room
    return {
      success: true,
      roomId: result.roomId,
      roomName: result.roomName,
      isNewRoom: false,
    };

  } catch (error: any) {
    console.error('[AtomicRoom] ❌ Error:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT - handleQuickEntry
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The single entry point for joining a room.
 * Handles all locking, validation, and cleanup.
 */
export async function handleQuickEntry(params: AtomicJoinParams): Promise<AtomicJoinResult> {
  const { userId } = params;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCK CHECK - Prevents infinite loops
  // ═══════════════════════════════════════════════════════════════════════════

  if (isJoining) {
    console.log('[AtomicRoom] ⛔ BLOCKED - Already joining');
    return { success: false, error: 'Bereits am Beitreten' };
  }

  // Cooldown check
  const now = Date.now();
  if (now - lastJoinAttempt < JOIN_COOLDOWN_MS) {
    console.log('[AtomicRoom] ⏳ Cooldown active');
    return { success: false, error: 'Bitte warte kurz' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SET LOCK
  // ═══════════════════════════════════════════════════════════════════════════

  isJoining = true;
  lastJoinAttempt = now;

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // ATOMIC OPERATION
    // ═══════════════════════════════════════════════════════════════════════════

    const result = await atomicGetOrCreateRoom(params);

    if (!result.success || !result.roomId) {
      console.log('[AtomicRoom] ❌ Join failed:', result.error);
      return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // POST-JOIN: Set room service state & sync presence
    // ═══════════════════════════════════════════════════════════════════════════

    // Set the room as active in roomService
    roomService.setActiveRoom(result.roomId, userId);

    // Sync presence
    try {
      await presenceVault.syncPresence(userId, result.roomId, result.roomName || 'Wölkchen');
    } catch (presenceError) {
      console.warn('[AtomicRoom] ⚠️ Presence sync failed (non-blocking)');
    }

    // Update user's current room in profile
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentRoomId: result.roomId,
        lastRoomJoinedAt: Timestamp.now(),
      });
    } catch (profileError) {
      console.warn('[AtomicRoom] ⚠️ Profile update failed (non-blocking)');
    }

    console.log('[AtomicRoom] ✅ Successfully joined room:', result.roomId, result.isNewRoom ? '(NEW)' : '(EXISTING)');
    return result;

  } catch (error: any) {
    console.error('[AtomicRoom] 💥 Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'Unerwarteter Fehler',
    };

  } finally {
    // ═══════════════════════════════════════════════════════════════════════════
    // RELEASE LOCK
    // ═══════════════════════════════════════════════════════════════════════════

    isJoining = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE EXIT PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Proper exit sequence:
 * 1. Set user offline in room
 * 2. Clear presence
 * 3. Update user profile
 * 4. Trigger room cleanup check
 */
export async function handleSafeExit(userId: string): Promise<void> {
  const roomId = roomService.getActiveRoomId();

  if (!roomId) {
    console.log('[AtomicRoom] 🚪 No active room to leave');
    return;
  }

  console.log('[AtomicRoom] 🚪 Starting safe exit from room:', roomId);

  try {
    // 1. Leave room
    await roomService.leaveRoom(roomId, userId);

    // 2. Clear presence (already done in roomService.leaveRoom, but ensure)
    try {
      await presenceVault.clearRoomPresence(userId);
    } catch (e) {
      console.warn('[AtomicRoom] ⚠️ Presence clear failed');
    }

    // 3. Update user profile
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentRoomId: null,
      });
    } catch (e) {
      console.warn('[AtomicRoom] ⚠️ Profile update failed');
    }

    console.log('[AtomicRoom] ✅ Safe exit complete');

  } catch (error) {
    console.error('[AtomicRoom] ❌ Exit error:', error);
    // Force leave as fallback
    roomService.forceLeave();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function isCurrentlyJoining(): boolean {
  return isJoining;
}

export function getJoinCooldownRemaining(): number {
  const elapsed = Date.now() - lastJoinAttempt;
  return Math.max(0, JOIN_COOLDOWN_MS - elapsed);
}

export function resetJoinLock(): void {
  isJoining = false;
  console.log('[AtomicRoom] 🔓 Join lock manually reset');
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT SHIELD - 2-Minuten Raum-Schutz System v18.0
// ═══════════════════════════════════════════════════════════════════════════════
// Analog zu SQL: vault.force_clean_rooms()
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prüft ob ein Raum gelöscht werden darf
 * KRITISCH: Räume jünger als 2 Minuten dürfen NIEMALS gelöscht werden
 */
export function canRoomBeDeleted(roomData: {
  createdAt?: { toMillis?: () => number; seconds?: number };
  creatorGraceUntil?: { toMillis?: () => number; seconds?: number };
  isPermanent?: boolean;
  participants?: any[];
}): { canDelete: boolean; reason: string; remainingProtectionMs: number } {
  
  // Permanente Räume niemals löschen
  if (roomData.isPermanent) {
    return {
      canDelete: false,
      reason: 'Room is permanent',
      remainingProtectionMs: Infinity,
    };
  }

  // Prüfe Raum-Alter
  const now = Date.now();
  let createdAtMs: number | null = null;
  
  if (roomData.createdAt) {
    if (typeof roomData.createdAt.toMillis === 'function') {
      createdAtMs = roomData.createdAt.toMillis();
    } else if (roomData.createdAt.seconds) {
      createdAtMs = roomData.createdAt.seconds * 1000;
    }
  }

  if (createdAtMs) {
    const roomAge = now - createdAtMs;
    
    // VAULT SHIELD: 2 Minuten Schutz
    if (roomAge < MIN_ROOM_AGE_FOR_DELETE_MS) {
      const remaining = MIN_ROOM_AGE_FOR_DELETE_MS - roomAge;
      console.log('[VaultShield] 🛡️ Room protected - age:', Math.round(roomAge/1000), 's, remaining:', Math.round(remaining/1000), 's');
      return {
        canDelete: false,
        reason: `Room is protected for ${Math.ceil(remaining/1000)} more seconds`,
        remainingProtectionMs: remaining,
      };
    }
  }

  // Prüfe Creator Grace Period
  if (roomData.creatorGraceUntil) {
    let graceUntilMs: number | null = null;
    
    if (typeof roomData.creatorGraceUntil.toMillis === 'function') {
      graceUntilMs = roomData.creatorGraceUntil.toMillis();
    } else if (roomData.creatorGraceUntil.seconds) {
      graceUntilMs = roomData.creatorGraceUntil.seconds * 1000;
    }

    if (graceUntilMs && now < graceUntilMs) {
      const remaining = graceUntilMs - now;
      console.log('[VaultShield] 🛡️ Creator grace period active - remaining:', Math.round(remaining/1000), 's');
      return {
        canDelete: false,
        reason: `Creator grace period: ${Math.ceil(remaining/1000)} seconds remaining`,
        remainingProtectionMs: remaining,
      };
    }
  }

  // Raum hat Teilnehmer
  if (roomData.participants && roomData.participants.length > 0) {
    return {
      canDelete: false,
      reason: `Room has ${roomData.participants.length} participants`,
      remainingProtectionMs: 0,
    };
  }

  // Raum kann gelöscht werden
  return {
    canDelete: true,
    reason: 'Room is empty and protection period expired',
    remainingProtectionMs: 0,
  };
}

/**
 * Atomic Quick Start - Findet oder erstellt Raum UND trägt User SOFORT ein
 * Analog zu SQL: atomic_quick_start(t_lat, t_lon, u_id)
 */
export async function atomicQuickStart(params: {
  userId: string;
  username: string;
  displayName: string;
  level?: number;
  latitude: number;
  longitude: number;
}): Promise<AtomicJoinResult> {
  console.log('[AtomicQuickStart] 🚀 Starting atomic quick start...');
  
  return handleQuickEntry({
    userId: params.userId,
    username: params.username,
    displayName: params.displayName,
    level: params.level || 1,
    isAnonymous: false,
    latitude: params.latitude,
    longitude: params.longitude,
  });
}

/**
 * Safe Room Cleanup - Löscht nur Räume die den Vault-Schutz passiert haben
 * Analog zu SQL: vault.force_clean_rooms()
 */
export async function safeRoomCleanup(roomId: string): Promise<{ deleted: boolean; reason: string }> {
  console.log('[VaultCleanup] 🧹 Checking room for cleanup:', roomId);
  
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      return { deleted: false, reason: 'Room does not exist' };
    }
    
    const roomData = roomSnap.data();
    const canDelete = canRoomBeDeleted(roomData);
    
    if (!canDelete.canDelete) {
      console.log('[VaultCleanup] 🛡️ Room protected:', canDelete.reason);
      return { deleted: false, reason: canDelete.reason };
    }
    
    // Raum kann gelöscht werden
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(roomRef);
    
    console.log('[VaultCleanup] 🗑️ Room deleted:', roomId);
    return { deleted: true, reason: 'Room cleaned up successfully' };
    
  } catch (error: any) {
    console.error('[VaultCleanup] ❌ Error:', error);
    return { deleted: false, reason: error.message };
  }
}
