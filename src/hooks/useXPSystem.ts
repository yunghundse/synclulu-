import { useCallback, useRef, useEffect } from 'react';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

// XP Configuration
export const XP_CONFIG = {
  voiceMinuteXP: 10,           // XP per minute in voice chat
  speakingBonusXP: 5,          // Extra XP per minute when actively speaking
  premiumMultiplier: 1.5,      // Premium users get 50% more XP
  maxXPPerSession: 500,        // Max XP per voice session (prevent abuse)
  xpTickIntervalMs: 60000,     // Give XP every 60 seconds (1 minute)
};

// Level calculation
export const calculateLevel = (xp: number): number => {
  // Level formula: Level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0 XP, Level 2: 100 XP, Level 5: 1600 XP, Level 10: 8100 XP, etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const calculateXPForLevel = (level: number): number => {
  // Inverse of above formula
  return Math.pow(level - 1, 2) * 100;
};

export const calculateXPProgress = (xp: number): { current: number; required: number; progress: number } => {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return {
    current: progressXP,
    required: requiredXP,
    progress: Math.min(100, (progressXP / requiredXP) * 100),
  };
};

interface UseXPSystemProps {
  userId: string | undefined;
  isPremium?: boolean;
  onXPGain?: (amount: number, reason: string) => void;
  onLevelUp?: (newLevel: number) => void;
}

export const useXPSystem = ({ userId, isPremium = false, onXPGain, onLevelUp }: UseXPSystemProps) => {
  const { showXPGain } = useStore();

  const xpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionXPRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const lastLevelRef = useRef<number>(1);

  // Award XP to user
  const awardXP = useCallback(async (amount: number, reason: string) => {
    if (!userId || amount <= 0) return;

    // Check session limit
    if (sessionXPRef.current >= XP_CONFIG.maxXPPerSession) {
      return;
    }

    // Apply premium multiplier
    const finalAmount = isPremium ? Math.round(amount * XP_CONFIG.premiumMultiplier) : amount;

    // Don't exceed session limit
    const cappedAmount = Math.min(finalAmount, XP_CONFIG.maxXPPerSession - sessionXPRef.current);
    if (cappedAmount <= 0) return;

    sessionXPRef.current += cappedAmount;

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentXP = userDoc.data().xp || 0;
        const currentLevel = userDoc.data().level || 1;
        lastLevelRef.current = currentLevel;

        const newXP = currentXP + cappedAmount;
        const newLevel = calculateLevel(newXP);

        // Update user XP and level
        await updateDoc(userRef, {
          xp: increment(cappedAmount),
          level: newLevel,
          totalVoiceMinutes: increment(1), // Track voice minutes
          lastXPGain: serverTimestamp(),
        });

        // Show XP toast
        showXPGain(cappedAmount, reason);
        onXPGain?.(cappedAmount, reason);

        // Check for level up
        if (newLevel > currentLevel) {
          onLevelUp?.(newLevel);
        }
      }
    } catch (error) {
      // Silent fail - don't break voice chat for XP errors
    }
  }, [userId, isPremium, showXPGain, onXPGain, onLevelUp]);

  // Start XP tick for voice chat
  const startVoiceXPTick = useCallback(() => {
    if (xpIntervalRef.current || !userId) return;

    isActiveRef.current = true;
    sessionXPRef.current = 0; // Reset session XP

    // Give XP every minute
    xpIntervalRef.current = setInterval(() => {
      if (!isActiveRef.current) return;

      let xpAmount = XP_CONFIG.voiceMinuteXP;
      let reason = 'Sprachchat Minute';

      // Bonus for actively speaking
      if (isSpeakingRef.current) {
        xpAmount += XP_CONFIG.speakingBonusXP;
        reason = 'Aktiv gesprochen';
      }

      awardXP(xpAmount, reason);
    }, XP_CONFIG.xpTickIntervalMs);

  }, [userId, awardXP]);

  // Stop XP tick
  const stopVoiceXPTick = useCallback(() => {
    isActiveRef.current = false;

    if (xpIntervalRef.current) {
      clearInterval(xpIntervalRef.current);
      xpIntervalRef.current = null;
    }
  }, []);

  // Update speaking status (for bonus XP)
  const updateSpeakingStatus = useCallback((isSpeaking: boolean) => {
    isSpeakingRef.current = isSpeaking;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceXPTick();
    };
  }, [stopVoiceXPTick]);

  // Award XP for various actions
  const awardDailyLoginXP = useCallback(async () => {
    await awardXP(50, 'Täglicher Login');
  }, [awardXP]);

  const awardPositiveRatingXP = useCallback(async () => {
    await awardXP(25, 'Positive Bewertung erhalten');
  }, [awardXP]);

  const awardStarReceivedXP = useCallback(async (starAmount: number) => {
    await awardXP(starAmount * 15, `${starAmount} Stern(e) erhalten`);
  }, [awardXP]);

  const awardFirstConnectionXP = useCallback(async () => {
    await awardXP(100, 'Erste Verbindung heute');
  }, [awardXP]);

  return {
    // Voice chat XP
    startVoiceXPTick,
    stopVoiceXPTick,
    updateSpeakingStatus,

    // Manual XP awards
    awardXP,
    awardDailyLoginXP,
    awardPositiveRatingXP,
    awardStarReceivedXP,
    awardFirstConnectionXP,

    // Utils
    sessionXP: sessionXPRef.current,
    calculateLevel,
    calculateXPProgress,
  };
};

export default useXPSystem;
