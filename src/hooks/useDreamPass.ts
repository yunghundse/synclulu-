/**
 * DREAM PASS HOOK
 * React Hook für Dream Pass Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import {
  getDreamPassProgress,
  initializeDreamPass,
  addDreamPassXP,
  checkPremiumUnlock,
  subscribeToDreamPassProgress,
  getSeasonCountdown,
  UserDreamPassProgress,
  XPSource,
  XP_SOURCES,
  BETA_SEASON_REWARDS,
} from '@/lib/dreamPassSystem';

export interface DreamPassHookResult {
  progress: UserDreamPassProgress | null;
  isLoading: boolean;
  countdown: ReturnType<typeof getSeasonCountdown>;
  unclaimedRewards: number;
  addXP: (source: XPSource) => Promise<{
    success: boolean;
    leveledUp: boolean;
    newLevel?: number;
  }>;
  refreshProgress: () => Promise<void>;
  awardDailyQuestXP: (difficulty: 'easy' | 'medium' | 'hard' | 'bonus') => Promise<void>;
  awardStreakXP: (streakDays: number) => Promise<void>;
  awardSocialXP: (type: 'invite' | 'inviteActive' | 'cloudInteraction' | 'friendMade') => Promise<void>;
}

export const useDreamPass = (): DreamPassHookResult => {
  const { user, showXPGain } = useStore();
  const [progress, setProgress] = useState<UserDreamPassProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(getSeasonCountdown());

  // Load initial progress
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      let userProgress = await getDreamPassProgress(user.id);

      if (!userProgress) {
        userProgress = await initializeDreamPass(user.id);
      }

      await checkPremiumUnlock(user.id);
      userProgress = await getDreamPassProgress(user.id);

      setProgress(userProgress);
      setIsLoading(false);
    };

    loadProgress();
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToDreamPassProgress(user.id, (newProgress) => {
      setProgress(newProgress);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getSeasonCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate unclaimed rewards
  const unclaimedRewards = progress
    ? progress.unlockedRewards.filter(id => !progress.claimedRewards.includes(id)).length
    : 0;

  // Add XP function
  const addXP = useCallback(async (source: XPSource) => {
    if (!user?.id) return { success: false, leveledUp: false };

    const result = await addDreamPassXP(user.id, source);

    if (result.success && result.leveledUp && result.newLevel) {
      // Show toast for level up
      showXPGain(source.amount, `Dream Pass Level ${result.newLevel}! 🎉`);
    }

    return result;
  }, [user?.id, showXPGain]);

  // Refresh progress
  const refreshProgress = useCallback(async () => {
    if (!user?.id) return;

    const newProgress = await getDreamPassProgress(user.id);
    setProgress(newProgress);
  }, [user?.id]);

  // Award Daily Quest XP
  const awardDailyQuestXP = useCallback(async (difficulty: 'easy' | 'medium' | 'hard' | 'bonus') => {
    const xpAmount = XP_SOURCES.dailyQuest[difficulty];
    await addXP({
      type: 'daily_quest',
      amount: xpAmount,
      description: `Daily Quest (${difficulty})`,
    });
  }, [addXP]);

  // Award Streak XP
  const awardStreakXP = useCallback(async (streakDays: number) => {
    let xpAmount = XP_SOURCES.cloudStreak.base * streakDays;

    // Add milestone bonuses
    if (streakDays >= 100) xpAmount += XP_SOURCES.cloudStreak.milestone100;
    else if (streakDays >= 30) xpAmount += XP_SOURCES.cloudStreak.milestone30;
    else if (streakDays >= 14) xpAmount += XP_SOURCES.cloudStreak.milestone14;
    else if (streakDays >= 7) xpAmount += XP_SOURCES.cloudStreak.milestone7;

    await addXP({
      type: 'cloud_streak',
      amount: xpAmount,
      description: `${streakDays} Tage Streak`,
    });
  }, [addXP]);

  // Award Social XP
  const awardSocialXP = useCallback(async (type: 'invite' | 'inviteActive' | 'cloudInteraction' | 'friendMade') => {
    const xpAmount = XP_SOURCES.social[type];
    await addXP({
      type: 'social',
      amount: xpAmount,
      description: type === 'invite'
        ? 'Freund eingeladen'
        : type === 'inviteActive'
        ? 'Eingeladener Freund aktiv'
        : type === 'friendMade'
        ? 'Neue Freundschaft'
        : 'Cloud Interaktion',
    });
  }, [addXP]);

  return {
    progress,
    isLoading,
    countdown,
    unclaimedRewards,
    addXP,
    refreshProgress,
    awardDailyQuestXP,
    awardStreakXP,
    awardSocialXP,
  };
};

export default useDreamPass;
