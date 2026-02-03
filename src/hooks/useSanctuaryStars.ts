/**
 * useSanctuaryStars.ts
 * Hook für Sanctuary Star-System Integration v1.0.0
 *
 * Verwaltet Star-Vergabe, Animation-Trigger und Firebase-Updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { doc, updateDoc, increment, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface SanctuaryUser {
  id: string;
  name: string;
  avatar?: string;
  sanctuaryScore: number;
  starsReceived: number;
  starsGiven: number;
}

export interface StarTransferTrigger {
  giverPosition: { x: number; y: number };
  receiverPosition: { x: number; y: number };
  giver: { id: string; name: string; avatar?: string };
  receiver: { id: string; name: string; avatar?: string };
  starCount: number;
}

export interface UseSanctuaryStarsOptions {
  userId: string;
  onStarReceived?: (fromUserId: string, count: number) => void;
  onStarGiven?: (toUserId: string, count: number) => void;
  onError?: (error: Error) => void;
}

export interface UseSanctuaryStarsReturn {
  myStars: number;
  mySanctuaryScore: number;
  starsGivenToday: number;
  canGiveStars: boolean;
  maxDailyStars: number;
  giveStar: (receiverId: string, receiverPosition: { x: number; y: number }, giverPosition: { x: number; y: number }) => Promise<StarTransferTrigger | null>;
  giveMultipleStars: (receiverId: string, count: number, receiverPosition: { x: number; y: number }, giverPosition: { x: number; y: number }) => Promise<StarTransferTrigger | null>;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_DAILY_STARS = 5;
const STAR_COOLDOWN_MS = 3000; // 3 Sekunden zwischen Stern-Vergaben

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSanctuaryStars(options: UseSanctuaryStarsOptions): UseSanctuaryStarsReturn {
  const { userId, onStarReceived, onStarGiven, onError } = options;

  const [myStars, setMyStars] = useState<number>(0);
  const [mySanctuaryScore, setMySanctuaryScore] = useState<number>(0);
  const [starsGivenToday, setStarsGivenToday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const lastStarGivenRef = useRef<number>(0);
  const previousStarsRef = useRef<number>(0);

  // Subscribe to user's sanctuary data
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const newStars = data.starsReceived || 0;

          // Check if stars increased (received new star)
          if (previousStarsRef.current > 0 && newStars > previousStarsRef.current) {
            const diff = newStars - previousStarsRef.current;
            onStarReceived?.('unknown', diff);
          }
          previousStarsRef.current = newStars;

          setMyStars(newStars);
          setMySanctuaryScore(data.sanctuaryScore || 0);
          setStarsGivenToday(data.starsGivenToday || 0);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('[SanctuaryStars] Error subscribing to user:', err);
        setError(err as Error);
        onError?.(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, onStarReceived, onError]);

  // Reset daily stars at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setStarsGivenToday(0);
        // Also update in Firebase
        if (userId) {
          const userRef = doc(db, 'users', userId);
          updateDoc(userRef, { starsGivenToday: 0 }).catch(console.error);
        }
      }
    };

    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  const canGiveStars = starsGivenToday < MAX_DAILY_STARS;

  // Give a single star
  const giveStar = useCallback(
    async (
      receiverId: string,
      receiverPosition: { x: number; y: number },
      giverPosition: { x: number; y: number }
    ): Promise<StarTransferTrigger | null> => {
      // Check cooldown
      const now = Date.now();
      if (now - lastStarGivenRef.current < STAR_COOLDOWN_MS) {
        console.warn('[SanctuaryStars] Cooldown active, please wait');
        return null;
      }

      // Check daily limit
      if (!canGiveStars) {
        console.warn('[SanctuaryStars] Daily star limit reached');
        setError(new Error('Daily star limit reached'));
        return null;
      }

      // Don't allow giving stars to yourself
      if (receiverId === userId) {
        console.warn('[SanctuaryStars] Cannot give stars to yourself');
        return null;
      }

      try {
        lastStarGivenRef.current = now;

        // Get receiver info
        const receiverRef = doc(db, 'users', receiverId);
        const receiverSnap = await getDoc(receiverRef);

        if (!receiverSnap.exists()) {
          throw new Error('Receiver not found');
        }

        const receiverData = receiverSnap.data();

        // Get giver info
        const giverRef = doc(db, 'users', userId);
        const giverSnap = await getDoc(giverRef);
        const giverData = giverSnap.data() || {};

        // Update receiver's stars
        await updateDoc(receiverRef, {
          starsReceived: increment(1),
          sanctuaryScore: increment(0.1), // Small boost to sanctuary score
        });

        // Update giver's stats
        await updateDoc(giverRef, {
          starsGiven: increment(1),
          starsGivenToday: increment(1),
        });

        setStarsGivenToday((prev) => prev + 1);

        // Callback
        onStarGiven?.(receiverId, 1);

        // Return transfer trigger data
        return {
          giverPosition,
          receiverPosition,
          giver: {
            id: userId,
            name: giverData.displayName || giverData.name || 'Anonymous',
            avatar: giverData.photoURL || giverData.avatar,
          },
          receiver: {
            id: receiverId,
            name: receiverData.displayName || receiverData.name || 'Anonymous',
            avatar: receiverData.photoURL || receiverData.avatar,
          },
          starCount: 1,
        };
      } catch (err) {
        console.error('[SanctuaryStars] Error giving star:', err);
        setError(err as Error);
        onError?.(err as Error);
        return null;
      }
    },
    [userId, canGiveStars, onStarGiven, onError]
  );

  // Give multiple stars at once
  const giveMultipleStars = useCallback(
    async (
      receiverId: string,
      count: number,
      receiverPosition: { x: number; y: number },
      giverPosition: { x: number; y: number }
    ): Promise<StarTransferTrigger | null> => {
      // Check cooldown
      const now = Date.now();
      if (now - lastStarGivenRef.current < STAR_COOLDOWN_MS) {
        console.warn('[SanctuaryStars] Cooldown active, please wait');
        return null;
      }

      // Check if enough stars available
      const availableStars = MAX_DAILY_STARS - starsGivenToday;
      const actualCount = Math.min(count, availableStars);

      if (actualCount <= 0) {
        console.warn('[SanctuaryStars] No stars available to give');
        setError(new Error('No stars available'));
        return null;
      }

      // Don't allow giving stars to yourself
      if (receiverId === userId) {
        console.warn('[SanctuaryStars] Cannot give stars to yourself');
        return null;
      }

      try {
        lastStarGivenRef.current = now;

        // Get receiver info
        const receiverRef = doc(db, 'users', receiverId);
        const receiverSnap = await getDoc(receiverRef);

        if (!receiverSnap.exists()) {
          throw new Error('Receiver not found');
        }

        const receiverData = receiverSnap.data();

        // Get giver info
        const giverRef = doc(db, 'users', userId);
        const giverSnap = await getDoc(giverRef);
        const giverData = giverSnap.data() || {};

        // Update receiver's stars
        await updateDoc(receiverRef, {
          starsReceived: increment(actualCount),
          sanctuaryScore: increment(actualCount * 0.1),
        });

        // Update giver's stats
        await updateDoc(giverRef, {
          starsGiven: increment(actualCount),
          starsGivenToday: increment(actualCount),
        });

        setStarsGivenToday((prev) => prev + actualCount);

        // Callback
        onStarGiven?.(receiverId, actualCount);

        // Return transfer trigger data
        return {
          giverPosition,
          receiverPosition,
          giver: {
            id: userId,
            name: giverData.displayName || giverData.name || 'Anonymous',
            avatar: giverData.photoURL || giverData.avatar,
          },
          receiver: {
            id: receiverId,
            name: receiverData.displayName || receiverData.name || 'Anonymous',
            avatar: receiverData.photoURL || receiverData.avatar,
          },
          starCount: actualCount,
        };
      } catch (err) {
        console.error('[SanctuaryStars] Error giving stars:', err);
        setError(err as Error);
        onError?.(err as Error);
        return null;
      }
    },
    [userId, starsGivenToday, onStarGiven, onError]
  );

  return {
    myStars,
    mySanctuaryScore,
    starsGivenToday,
    canGiveStars,
    maxDailyStars: MAX_DAILY_STARS,
    giveStar,
    giveMultipleStars,
    isLoading,
    error,
  };
}

export default useSanctuaryStars;
