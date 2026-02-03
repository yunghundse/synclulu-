/**
 * BLOCKED USERS HOOK - v2.0 VOID-LOGIC
 * =====================================
 * Manage user blocking with advanced "Void" handling for ghost users.
 *
 * VOID-LOGIC PRINCIPLE:
 * A non-existent user cannot possess any status (like "blocked").
 * Instead of throwing errors, we treat these as "Void" entries and
 * silently remove them from both the UI and database.
 *
 * Features:
 * - Existence-check before validation
 * - Auto-cleanup of orphaned/void block entries
 * - Silent removal without error messages
 * - Real-time Firestore sync
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { BlockedUser, BlockReason } from '@/types';

interface UseBlockedUsersReturn {
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  blockUser: (userId: string, reason?: BlockReason, customReason?: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  isBlocked: (userId: string) => boolean;
  isBlockedBy: (userId: string) => boolean;
  refreshBlockedUsers: () => Promise<void>;
}

export function useBlockedUsers(): UseBlockedUsersReturn {
  const { user } = useStore();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedByUsers, setBlockedByUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch blocked users with validation - removes orphaned entries
  const fetchBlockedUsers = useCallback(async () => {
    if (!user?.id) {
      setBlockedUsers([]);
      setIsLoading(false);
      return;
    }

    try {
      const blocksRef = collection(db, 'blocks');
      const q = query(blocksRef, where('blockerId', '==', user.id));
      const snapshot = await getDocs(q);

      const blocked: BlockedUser[] = [];
      const invalidBlockIds: string[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Validate blocked user exists
        try {
          const userDoc = await getDoc(doc(db, 'users', data.blockedUserId));

          if (!userDoc.exists()) {
            // User doesn't exist - mark for cleanup
            invalidBlockIds.push(docSnap.id);
            continue;
          }

          const userData = userDoc.data();

          blocked.push({
            id: docSnap.id,
            blockerId: data.blockerId,
            blockedUserId: data.blockedUserId,
            username: userData?.username || 'Gelöschter Nutzer',
            displayName: userData?.displayName,
            avatar: userData?.avatar,
            avatarUrl: userData?.avatarUrl || userData?.photoURL,
            blockedAt: data.blockedAt?.toDate() || new Date(),
            reason: data.reason,
            customReason: data.customReason,
          });
        } catch (err) {
          // Error fetching user - mark as invalid
          invalidBlockIds.push(docSnap.id);
        }
      }

      // Clean up invalid/orphaned block entries
      for (const invalidId of invalidBlockIds) {
        try {
          await deleteDoc(doc(db, 'blocks', invalidId));
          console.log('Cleaned up orphaned block entry:', invalidId);
        } catch (err) {
          console.error('Failed to clean up block entry:', err);
        }
      }

      setBlockedUsers(blocked);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch users who blocked the current user
  const fetchBlockedByUsers = useCallback(async () => {
    if (!user?.id) return;

    try {
      const blocksRef = collection(db, 'blocks');
      const q = query(blocksRef, where('blockedUserId', '==', user.id));
      const snapshot = await getDocs(q);

      const blockerIds = snapshot.docs.map((doc) => doc.data().blockerId);
      setBlockedByUsers(blockerIds);
    } catch (error) {
      console.error('Error fetching blocked by users:', error);
    }
  }, [user?.id]);

  // Listen for real-time updates with validation
  useEffect(() => {
    if (!user?.id) {
      setBlockedUsers([]);
      setBlockedByUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener for blocked users
    const blocksRef = collection(db, 'blocks');
    const q = query(blocksRef, where('blockerId', '==', user.id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const blocked: BlockedUser[] = [];
      const invalidBlockIds: string[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Validate blocked user exists
        try {
          const userDoc = await getDoc(doc(db, 'users', data.blockedUserId));

          if (!userDoc.exists()) {
            // User doesn't exist - mark for cleanup
            invalidBlockIds.push(docSnap.id);
            continue;
          }

          const userData = userDoc.data();

          blocked.push({
            id: docSnap.id,
            blockerId: data.blockerId,
            blockedUserId: data.blockedUserId,
            username: userData?.username || 'Gelöschter Nutzer',
            displayName: userData?.displayName,
            avatar: userData?.avatar,
            avatarUrl: userData?.avatarUrl || userData?.photoURL,
            blockedAt: data.blockedAt?.toDate() || new Date(),
            reason: data.reason,
            customReason: data.customReason,
          });
        } catch {
          // Skip invalid entries
          invalidBlockIds.push(docSnap.id);
        }
      }

      // Auto-clean invalid entries
      for (const invalidId of invalidBlockIds) {
        try {
          await deleteDoc(doc(db, 'blocks', invalidId));
        } catch {}
      }

      setBlockedUsers(blocked);
      setIsLoading(false);
    }, (error) => {
      console.error('Error in blocked users listener:', error);
      setBlockedUsers([]);
      setIsLoading(false);
    });

    // Also fetch blocked by users
    fetchBlockedByUsers();

    return () => unsubscribe();
  }, [user?.id, fetchBlockedByUsers]);

  // Block a user - validates user exists first
  const blockUser = useCallback(async (
    userId: string,
    reason?: BlockReason,
    customReason?: string
  ): Promise<boolean> => {
    if (!user?.id || userId === user.id) return false;

    try {
      // Verify the user exists before blocking
      const targetUserDoc = await getDoc(doc(db, 'users', userId));
      if (!targetUserDoc.exists()) {
        console.error('Cannot block non-existent user');
        return false;
      }

      // Check if already blocked
      const existing = blockedUsers.find((b) => b.blockedUserId === userId);
      if (existing) return true;

      // Add to blocks collection
      await addDoc(collection(db, 'blocks'), {
        blockerId: user.id,
        blockedUserId: userId,
        blockedAt: serverTimestamp(),
        reason: reason || 'personal',
        customReason: customReason || null,
      });

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 30]);
      }

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }, [user?.id, blockedUsers]);

  // Unblock a user
  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Find the block document
      const blockDoc = blockedUsers.find((b) => b.blockedUserId === userId);
      if (!blockDoc) return false;

      // Delete the block
      await deleteDoc(doc(db, 'blocks', blockDoc.id));

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }, [user?.id, blockedUsers]);

  // Check if a user is blocked
  const isBlocked = useCallback((userId: string): boolean => {
    return blockedUsers.some((b) => b.blockedUserId === userId);
  }, [blockedUsers]);

  // Check if blocked by a user
  const isBlockedBy = useCallback((userId: string): boolean => {
    return blockedByUsers.includes(userId);
  }, [blockedByUsers]);

  return {
    blockedUsers,
    isLoading,
    blockUser,
    unblockUser,
    isBlocked,
    isBlockedBy,
    refreshBlockedUsers: fetchBlockedUsers,
  };
}
