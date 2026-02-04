/**
 * useFriendsRealtime.ts
 * 🔥 REAL-TIME FRIENDS STATUS HOOK
 *
 * Echtzeit-Freundes-Tracking mit Firebase onSnapshot
 * - Live Online-Status Updates
 * - Aktive Freunde Zähler
 * - Presence Pulse Detection
 *
 * @version 1.0.0 - Social-Nexus Edition
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RealtimeFriend {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
  isOnline: boolean;
  lastActiveAt?: Date;
  currentRoom?: string;
  statusEmoji?: string;
  isFounder?: boolean;
  auraColor?: string;
}

interface UseFriendsRealtimeOptions {
  userId?: string;
  maxFriends?: number;
}

interface UseFriendsRealtimeReturn {
  friends: RealtimeFriend[];
  activeFriends: RealtimeFriend[];
  activeCount: number;
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refreshFriends: () => void;
}

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useFriendsRealtime({
  userId,
  maxFriends = 50,
}: UseFriendsRealtimeOptions = {}): UseFriendsRealtimeReturn {
  const [friends, setFriends] = useState<RealtimeFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);

  // Step 1: Fetch friend IDs from friendships collection
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchFriendIds = async () => {
      try {
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('userIds', 'array-contains', userId),
          where('status', '==', 'accepted'),
          limit(maxFriends)
        );

        const snapshot = await getDocs(friendshipsQuery);
        const ids: string[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const friendId = (data.userIds as string[]).find((id) => id !== userId);
          if (friendId) {
            ids.push(friendId);
          }
        });

        setFriendIds(ids);
      } catch (err) {
        console.error('[useFriendsRealtime] Error fetching friend IDs:', err);
        setError(err as Error);
      }
    };

    fetchFriendIds();
  }, [userId, maxFriends]);

  // Step 2: Subscribe to real-time updates for each friend
  useEffect(() => {
    if (friendIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Subscribe to each friend's profile
    friendIds.forEach((friendId) => {
      const friendRef = doc(db, 'users', friendId);

      const unsubscribe = onSnapshot(
        friendRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const friend: RealtimeFriend = {
              id: friendId,
              displayName: data.displayName || data.username || 'Anonym',
              username: data.username || 'user',
              photoURL: data.photoURL,
              isOnline: data.isOnline || data.isActive || false,
              lastActiveAt: data.lastActiveAt?.toDate?.() || data.lastActiveAt,
              currentRoom: data.currentRoom,
              statusEmoji: data.statusEmoji,
              isFounder: friendId === FOUNDER_UID || data.role === 'founder',
              auraColor: data.auraColor || (friendId === FOUNDER_UID ? '#fbbf24' : '#a855f7'),
            };

            setFriends((prev) => {
              const existing = prev.findIndex((f) => f.id === friendId);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = friend;
                return updated;
              }
              return [...prev, friend];
            });
          }
        },
        (err) => {
          console.error(`[useFriendsRealtime] Error watching friend ${friendId}:`, err);
        }
      );

      unsubscribers.push(unsubscribe);
    });

    setIsLoading(false);

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [friendIds]);

  // Calculate active friends
  const activeFriends = friends.filter((f) => f.isOnline);
  const activeCount = activeFriends.length;
  const totalCount = friends.length;

  // Sort: Online first, then by name
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const sortedActiveFriends = [...activeFriends].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  // Refresh function
  const refreshFriends = useCallback(() => {
    setFriends([]);
    setFriendIds([]);
    setIsLoading(true);
  }, []);

  return {
    friends: sortedFriends,
    activeFriends: sortedActiveFriends,
    activeCount,
    totalCount,
    isLoading,
    error,
    refreshFriends,
  };
}

// ═══════════════════════════════════════════════════════════════
// PRESENCE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Set user online status
 */
export async function setUserOnline(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'users', userId), {
      isOnline: true,
      isActive: true,
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[setUserOnline] Error:', error);
  }
}

/**
 * Set user offline status
 */
export async function setUserOffline(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'users', userId), {
      isOnline: false,
      isActive: false,
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[setUserOffline] Error:', error);
  }
}

export default useFriendsRealtime;
