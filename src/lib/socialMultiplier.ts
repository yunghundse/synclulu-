/**
 * synclulu DIGITAL OPERATING SYSTEM
 * Social Multiplier System - Dynamic XP Bonuses
 */

import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { getReferralStats } from './referralSystem';

// ═══════════════════════════════════════
// SOCIAL MULTIPLIER CONFIGURATION
// ═══════════════════════════════════════

export const SOCIAL_MULTIPLIER_CONFIG = {
  // Base multiplier is 1.0x
  baseMultiplier: 1.0,

  // Referral bonuses
  referral: {
    perReferral: 0.05, // +5% per successful referral
    maxBonus: 0.50, // Max 50% bonus from referrals (10 referrals)
  },

  // Streak bonuses
  streak: {
    perDay: 0.02, // +2% per consecutive day
    maxBonus: 0.30, // Max 30% bonus (15 days)
  },

  // Premium bonus
  premium: {
    bonus: 0.50, // +50% for premium users
  },

  // Community engagement bonuses
  engagement: {
    voiceMinutesThreshold: 60, // 1 hour
    voiceMinutesBonus: 0.10, // +10% for active voice users
    friendsThreshold: 5,
    friendsBonus: 0.10, // +10% for having 5+ friends
    eventsAttendedThreshold: 3,
    eventsBonus: 0.10, // +10% for attending 3+ events
  },

  // Time-based bonuses
  timeBonuses: {
    weekendBonus: 0.10, // +10% on weekends
    happyHourBonus: 0.15, // +15% during happy hours (18:00-21:00)
    nightOwlBonus: 0.05, // +5% late night (00:00-05:00)
  },
};

// ═══════════════════════════════════════
// MULTIPLIER TYPES
// ═══════════════════════════════════════

export interface MultiplierBreakdown {
  base: number;
  referral: number;
  streak: number;
  premium: number;
  voiceActivity: number;
  friends: number;
  events: number;
  timeBonus: number;
  total: number;
  activeBonuses: string[];
}

// ═══════════════════════════════════════
// MULTIPLIER CALCULATIONS
// ═══════════════════════════════════════

/**
 * Calculate the current social multiplier for a user
 */
export const calculateSocialMultiplier = async (userId: string): Promise<MultiplierBreakdown> => {
  const breakdown: MultiplierBreakdown = {
    base: SOCIAL_MULTIPLIER_CONFIG.baseMultiplier,
    referral: 0,
    streak: 0,
    premium: 0,
    voiceActivity: 0,
    friends: 0,
    events: 0,
    timeBonus: 0,
    total: SOCIAL_MULTIPLIER_CONFIG.baseMultiplier,
    activeBonuses: [],
  };

  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return breakdown;

    const userData = userDoc.data();

    // 1. Referral Bonus
    const referralStats = await getReferralStats(userId);
    if (referralStats.totalReferrals > 0) {
      breakdown.referral = Math.min(
        referralStats.totalReferrals * SOCIAL_MULTIPLIER_CONFIG.referral.perReferral,
        SOCIAL_MULTIPLIER_CONFIG.referral.maxBonus
      );
      breakdown.activeBonuses.push(`+${Math.round(breakdown.referral * 100)}% Referral`);
    }

    // 2. Streak Bonus
    const currentStreak = userData.currentStreak || 0;
    if (currentStreak > 0) {
      breakdown.streak = Math.min(
        currentStreak * SOCIAL_MULTIPLIER_CONFIG.streak.perDay,
        SOCIAL_MULTIPLIER_CONFIG.streak.maxBonus
      );
      breakdown.activeBonuses.push(`+${Math.round(breakdown.streak * 100)}% Streak (${currentStreak}🔥)`);
    }

    // 3. Premium Bonus
    if (userData.isPremium) {
      breakdown.premium = SOCIAL_MULTIPLIER_CONFIG.premium.bonus;
      breakdown.activeBonuses.push(`+${Math.round(breakdown.premium * 100)}% Premium`);
    }

    // 4. Voice Activity Bonus
    const totalVoiceMinutes = userData.totalVoiceMinutes || 0;
    if (totalVoiceMinutes >= SOCIAL_MULTIPLIER_CONFIG.engagement.voiceMinutesThreshold) {
      breakdown.voiceActivity = SOCIAL_MULTIPLIER_CONFIG.engagement.voiceMinutesBonus;
      breakdown.activeBonuses.push(`+${Math.round(breakdown.voiceActivity * 100)}% Voice Active`);
    }

    // 5. Friends Bonus
    const friendCount = userData.friendCount || 0;
    if (friendCount >= SOCIAL_MULTIPLIER_CONFIG.engagement.friendsThreshold) {
      breakdown.friends = SOCIAL_MULTIPLIER_CONFIG.engagement.friendsBonus;
      breakdown.activeBonuses.push(`+${Math.round(breakdown.friends * 100)}% Social`);
    }

    // 6. Events Bonus
    const eventsAttended = userData.eventsAttended || 0;
    if (eventsAttended >= SOCIAL_MULTIPLIER_CONFIG.engagement.eventsAttendedThreshold) {
      breakdown.events = SOCIAL_MULTIPLIER_CONFIG.engagement.eventsBonus;
      breakdown.activeBonuses.push(`+${Math.round(breakdown.events * 100)}% Event Fan`);
    }

    // 7. Time-based Bonuses
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Weekend bonus (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      breakdown.timeBonus += SOCIAL_MULTIPLIER_CONFIG.timeBonuses.weekendBonus;
      breakdown.activeBonuses.push(`+${Math.round(SOCIAL_MULTIPLIER_CONFIG.timeBonuses.weekendBonus * 100)}% Weekend`);
    }

    // Happy hour bonus (18:00-21:00)
    if (hour >= 18 && hour < 21) {
      breakdown.timeBonus += SOCIAL_MULTIPLIER_CONFIG.timeBonuses.happyHourBonus;
      breakdown.activeBonuses.push(`+${Math.round(SOCIAL_MULTIPLIER_CONFIG.timeBonuses.happyHourBonus * 100)}% Happy Hour`);
    }

    // Night owl bonus (00:00-05:00)
    if (hour >= 0 && hour < 5) {
      breakdown.timeBonus += SOCIAL_MULTIPLIER_CONFIG.timeBonuses.nightOwlBonus;
      breakdown.activeBonuses.push(`+${Math.round(SOCIAL_MULTIPLIER_CONFIG.timeBonuses.nightOwlBonus * 100)}% Night Owl`);
    }

    // Calculate total
    breakdown.total =
      breakdown.base +
      breakdown.referral +
      breakdown.streak +
      breakdown.premium +
      breakdown.voiceActivity +
      breakdown.friends +
      breakdown.events +
      breakdown.timeBonus;

  } catch (error) {
    console.error('Error calculating social multiplier:', error);
  }

  return breakdown;
};

/**
 * Apply social multiplier to XP amount
 */
export const applyMultiplier = async (
  userId: string,
  baseXP: number
): Promise<{
  finalXP: number;
  multiplier: MultiplierBreakdown;
}> => {
  const multiplier = await calculateSocialMultiplier(userId);
  const finalXP = Math.round(baseXP * multiplier.total);

  return {
    finalXP,
    multiplier,
  };
};

/**
 * Award XP with social multiplier applied
 */
export const awardXPWithMultiplier = async (
  userId: string,
  baseXP: number,
  reason: string
): Promise<{
  success: boolean;
  xpAwarded: number;
  multiplier: number;
  bonuses: string[];
}> => {
  try {
    const { finalXP, multiplier } = await applyMultiplier(userId, baseXP);

    // Update user's XP
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      xp: increment(finalXP),
    });

    return {
      success: true,
      xpAwarded: finalXP,
      multiplier: multiplier.total,
      bonuses: multiplier.activeBonuses,
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return {
      success: false,
      xpAwarded: 0,
      multiplier: 1,
      bonuses: [],
    };
  }
};

/**
 * Get a formatted multiplier display string
 */
export const formatMultiplier = (multiplier: number): string => {
  return `${multiplier.toFixed(1)}x`;
};

/**
 * Get multiplier tier info for display
 */
export const getMultiplierTier = (multiplier: number): {
  tier: string;
  color: string;
  emoji: string;
} => {
  if (multiplier >= 3.0) return { tier: 'Legendär', color: '#FFD700', emoji: '🏆' };
  if (multiplier >= 2.5) return { tier: 'Mythisch', color: '#FF00FF', emoji: '🌟' };
  if (multiplier >= 2.0) return { tier: 'Episch', color: '#9400D3', emoji: '💎' };
  if (multiplier >= 1.5) return { tier: 'Selten', color: '#4169E1', emoji: '⚡' };
  if (multiplier >= 1.2) return { tier: 'Gut', color: '#32CD32', emoji: '✨' };
  return { tier: 'Normal', color: '#9CA3AF', emoji: '💫' };
};

export default {
  calculateSocialMultiplier,
  applyMultiplier,
  awardXPWithMultiplier,
  formatMultiplier,
  getMultiplierTier,
  SOCIAL_MULTIPLIER_CONFIG,
};
