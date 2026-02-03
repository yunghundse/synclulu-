/**
 * ADMIN UTILITIES
 * Functions for admin operations like user management
 */

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// Admin user ID - replace with actual admin ID
const ADMIN_USER_ID = 'admin'; // This should be set to actual admin ID

/**
 * Delete all users except admin
 * Also cleans up related data (blocks, referrals, etc.)
 */
export async function resetAllUsersExceptAdmin(adminUserId: string): Promise<{
  success: boolean;
  deletedUsers: number;
  deletedBlocks: number;
  deletedReferrals: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deletedUsers = 0;
  let deletedBlocks = 0;
  let deletedReferrals = 0;

  try {
    // 1. Get all users except admin
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const userIdsToDelete: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      // Skip admin users
      if (
        userDoc.id === adminUserId ||
        userData.isAdmin === true ||
        userData.role === 'admin' ||
        userData.email?.includes('admin')
      ) {
        console.log('Skipping admin user:', userDoc.id);
        continue;
      }
      userIdsToDelete.push(userDoc.id);
    }

    console.log(`Found ${userIdsToDelete.length} users to delete`);

    // 2. Delete blocks
    const blocksRef = collection(db, 'blocks');
    const blocksSnapshot = await getDocs(blocksRef);

    for (const blockDoc of blocksSnapshot.docs) {
      try {
        await deleteDoc(doc(db, 'blocks', blockDoc.id));
        deletedBlocks++;
      } catch (err) {
        errors.push(`Failed to delete block ${blockDoc.id}`);
      }
    }
    console.log(`Deleted ${deletedBlocks} blocks`);

    // 3. Delete referrals
    const referralsRef = collection(db, 'referrals');
    const referralsSnapshot = await getDocs(referralsRef);

    for (const refDoc of referralsSnapshot.docs) {
      // Skip admin's referrals
      if (refDoc.id === adminUserId) continue;

      try {
        await deleteDoc(doc(db, 'referrals', refDoc.id));
        deletedReferrals++;
      } catch (err) {
        errors.push(`Failed to delete referral ${refDoc.id}`);
      }
    }
    console.log(`Deleted ${deletedReferrals} referrals`);

    // 4. Delete users
    for (const userId of userIdsToDelete) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        deletedUsers++;
        console.log(`Deleted user: ${userId}`);
      } catch (err) {
        errors.push(`Failed to delete user ${userId}`);
      }
    }
    console.log(`Deleted ${deletedUsers} users`);

    // 5. Clean up other collections that might reference users
    const collectionsToClean = ['chats', 'messages', 'voiceChatHistory', 'reports'];

    for (const collectionName of collectionsToClean) {
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          // Check if document belongs to a deleted user
          if (
            userIdsToDelete.includes(data.userId) ||
            userIdsToDelete.includes(data.senderId) ||
            userIdsToDelete.includes(data.creatorId)
          ) {
            try {
              await deleteDoc(doc(db, collectionName, docSnap.id));
            } catch (err) {
              // Ignore errors for optional collections
            }
          }
        }
      } catch (err) {
        // Collection might not exist, ignore
      }
    }

    return {
      success: true,
      deletedUsers,
      deletedBlocks,
      deletedReferrals,
      errors,
    };
  } catch (error) {
    console.error('Error resetting users:', error);
    return {
      success: false,
      deletedUsers,
      deletedBlocks,
      deletedReferrals,
      errors: [...errors, `Critical error: ${error}`],
    };
  }
}

/**
 * Clean up orphaned data (blocks, referrals without valid users)
 */
export async function cleanupOrphanedData(): Promise<{
  success: boolean;
  cleanedBlocks: number;
  cleanedReferrals: number;
}> {
  let cleanedBlocks = 0;
  let cleanedReferrals = 0;

  try {
    // Get all user IDs
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const validUserIds = new Set(usersSnapshot.docs.map(d => d.id));

    // Clean blocks
    const blocksRef = collection(db, 'blocks');
    const blocksSnapshot = await getDocs(blocksRef);

    for (const blockDoc of blocksSnapshot.docs) {
      const data = blockDoc.data();
      if (
        !validUserIds.has(data.blockerId) ||
        !validUserIds.has(data.blockedUserId)
      ) {
        await deleteDoc(doc(db, 'blocks', blockDoc.id));
        cleanedBlocks++;
      }
    }

    // Clean referrals
    const referralsRef = collection(db, 'referrals');
    const referralsSnapshot = await getDocs(referralsRef);

    for (const refDoc of referralsSnapshot.docs) {
      if (!validUserIds.has(refDoc.id)) {
        await deleteDoc(doc(db, 'referrals', refDoc.id));
        cleanedReferrals++;
      }
    }

    return {
      success: true,
      cleanedBlocks,
      cleanedReferrals,
    };
  } catch (error) {
    console.error('Error cleaning orphaned data:', error);
    return {
      success: false,
      cleanedBlocks,
      cleanedReferrals,
    };
  }
}

export default {
  resetAllUsersExceptAdmin,
  cleanupOrphanedData,
};
