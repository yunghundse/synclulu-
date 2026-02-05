/**
 * databasePurge.ts
 * 🗑️ DATABASE PURGE & CLEAN START UTILITIES
 *
 * SOVEREIGN CORE v36.0
 * - Remove all dummy/test data
 * - Clean room creation
 * - Enforce database purity
 *
 * @version 36.0.0
 */

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
  Timestamp,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// Founder UID - protected from purge
const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Test/dummy patterns to detect
const TEST_PATTERNS = [
  /^test/i,
  /^demo/i,
  /^dummy/i,
  /^fake/i,
  /^placeholder/i,
  /^example/i,
  /user\d+/i,
  /testuser/i,
];

const isTestData = (name: string): boolean => {
  return TEST_PATTERNS.some(pattern => pattern.test(name));
};

/**
 * PURGE EMPTY ROOMS
 * Delete all rooms with 0 participants
 */
export const purgeEmptyRooms = async (): Promise<number> => {
  console.log('[DatabasePurge] Starting empty room cleanup...');

  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);

  let deletedCount = 0;
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const participants = data.participants || [];

    // Delete if no participants
    if (participants.length === 0) {
      batch.delete(docSnap.ref);
      deletedCount++;
      console.log(`[DatabasePurge] Marking room for deletion: ${docSnap.id}`);
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`[DatabasePurge] Deleted ${deletedCount} empty rooms`);
  }

  return deletedCount;
};

/**
 * PURGE TEST ROOMS
 * Delete all rooms with test/dummy names
 */
export const purgeTestRooms = async (): Promise<number> => {
  console.log('[DatabasePurge] Starting test room cleanup...');

  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);

  let deletedCount = 0;
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const roomName = data.name || '';

    if (isTestData(roomName)) {
      batch.delete(docSnap.ref);
      deletedCount++;
      console.log(`[DatabasePurge] Marking test room for deletion: ${roomName} (${docSnap.id})`);
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`[DatabasePurge] Deleted ${deletedCount} test rooms`);
  }

  return deletedCount;
};

/**
 * PURGE TEST USERS
 * Delete all users with test/dummy usernames (except founder)
 */
export const purgeTestUsers = async (): Promise<number> => {
  console.log('[DatabasePurge] Starting test user cleanup...');

  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  let deletedCount = 0;
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    // Never delete founder
    if (docSnap.id === FOUNDER_UID) return;

    const data = docSnap.data();
    const username = data.username || '';
    const displayName = data.displayName || '';

    if (isTestData(username) || isTestData(displayName)) {
      batch.delete(docSnap.ref);
      deletedCount++;
      console.log(`[DatabasePurge] Marking test user for deletion: ${username} (${docSnap.id})`);
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`[DatabasePurge] Deleted ${deletedCount} test users`);
  }

  return deletedCount;
};

/**
 * CLEAN USER XP - Reset to database-pure level system
 * xp:0 = Level 0 (no dummy XP)
 */
export const cleanUserXP = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) return;

  const data = userDoc.data();

  // Only reset if XP seems artificially high for new account
  const createdAt = data.createdAt?.toDate?.() || new Date();
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const currentXP = data.xp || data.totalXP || 0;

  // If more than 1000 XP per day average, likely test data
  const xpPerDay = currentXP / Math.max(1, daysSinceCreation);
  if (xpPerDay > 1000 && userId !== FOUNDER_UID) {
    await updateDoc(userRef, {
      xp: 0,
      totalXP: 0,
      level: 0,
    });
    console.log(`[DatabasePurge] Reset XP for suspicious account: ${userId}`);
  }
};

/**
 * CLEAN ROOM PARTICIPANTS
 * Remove any participants that don't exist in users collection
 */
export const cleanRoomParticipants = async (): Promise<number> => {
  console.log('[DatabasePurge] Cleaning room participants...');

  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);

  let cleanedCount = 0;

  for (const roomDoc of snapshot.docs) {
    const data = roomDoc.data();
    const participants = data.participants || [];

    if (participants.length === 0) continue;

    // Check each participant exists
    const validParticipants = [];
    for (const p of participants) {
      const userId = p.oderId || p.odId || p.id;
      if (!userId) continue;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          validParticipants.push(p);
        }
      } catch (e) {
        // User doesn't exist, skip
      }
    }

    // Update if any participants were removed
    if (validParticipants.length !== participants.length) {
      await updateDoc(roomDoc.ref, { participants: validParticipants });
      cleanedCount++;
      console.log(`[DatabasePurge] Cleaned room ${roomDoc.id}: ${participants.length} -> ${validParticipants.length} participants`);
    }
  }

  return cleanedCount;
};

/**
 * FULL DATABASE PURGE
 * Run all purge operations
 */
export const fullDatabasePurge = async (): Promise<{
  emptyRooms: number;
  testRooms: number;
  testUsers: number;
  cleanedRooms: number;
}> => {
  console.log('[DatabasePurge] ========== STARTING FULL PURGE ==========');

  const emptyRooms = await purgeEmptyRooms();
  const testRooms = await purgeTestRooms();
  const testUsers = await purgeTestUsers();
  const cleanedRooms = await cleanRoomParticipants();

  console.log('[DatabasePurge] ========== PURGE COMPLETE ==========');
  console.log(`Empty rooms deleted: ${emptyRooms}`);
  console.log(`Test rooms deleted: ${testRooms}`);
  console.log(`Test users deleted: ${testUsers}`);
  console.log(`Rooms cleaned: ${cleanedRooms}`);

  return { emptyRooms, testRooms, testUsers, cleanedRooms };
};

/**
 * VERIFY CLEAN DATABASE
 * Check if database is in clean state
 */
export const verifyCleanDatabase = async (): Promise<boolean> => {
  const roomsRef = collection(db, 'rooms');
  const roomsSnapshot = await getDocs(roomsRef);

  for (const roomDoc of roomsSnapshot.docs) {
    const data = roomDoc.data();

    // Check for test names
    if (isTestData(data.name || '')) {
      console.log(`[DatabasePurge] Found test room: ${data.name}`);
      return false;
    }

    // Check for empty inactive rooms
    if ((data.participants || []).length === 0 && !data.isActive) {
      console.log(`[DatabasePurge] Found empty inactive room: ${roomDoc.id}`);
      return false;
    }
  }

  console.log('[DatabasePurge] Database is clean!');
  return true;
};

export default {
  purgeEmptyRooms,
  purgeTestRooms,
  purgeTestUsers,
  cleanUserXP,
  cleanRoomParticipants,
  fullDatabasePurge,
  verifyCleanDatabase,
};
