/**
 * DELULU DREAM PASS SYSTEM
 * Battle Pass für Season-basierte Belohnungen
 * Beta Season 1 Start: 01. März 2026
 */

import {
  doc, getDoc, setDoc, updateDoc, collection,
  Timestamp, increment, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { getReferralStats } from './referralSystem';

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const DREAM_PASS_CONFIG = {
  seasonId: 'beta_s1',
  seasonName: 'Beta Season 1',
  seasonNameDE: 'Beta Staffel 1',
  maxLevel: 100,
  xpPerLevel: 1000,
  seasonStart: new Date('2026-03-01T00:00:00Z'),
  seasonEnd: new Date('2026-05-31T23:59:59Z'),
  premiumUnlockInvites: 5, // 5 Freunde einladen = Premium gratis
  colors: {
    free: {
      primary: '#A78BFA',
      secondary: '#818CF8',
    },
    premium: {
      primary: '#F472B6',
      secondary: '#FB923C',
      gradient: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #F472B6 100%)',
    },
  },
};

// ═══════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════

export type RewardType =
  | 'avatar_frame'
  | 'name_effect'
  | 'chat_bubble'
  | 'profile_banner'
  | 'coins'
  | 'xp_boost'
  | 'exclusive_badge'
  | 'glow_effect'
  | 'cloud_theme'
  | 'sound_pack'
  | 'emoji_pack'
  | 'title';

export interface PassReward {
  id: string;
  level: number;
  type: RewardType;
  name: string;
  nameDE: string;
  description: string;
  descriptionDE: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  isPremium: boolean;
  previewUrl?: string;
  value?: number; // For coins/xp_boost
  unlockDate?: Date; // For sneak peek items
}

export interface UserDreamPassProgress {
  id: string;
  oderId: string;
  seasonId: string;
  currentLevel: number;
  currentXP: number;
  totalXPEarned: number;
  isPremium: boolean;
  premiumUnlockedVia: 'purchase' | 'referral' | 'gift' | null;
  unlockedRewards: string[]; // Reward IDs
  claimedRewards: string[]; // Rewards that have been claimed
  lastXPGain: Date;
  streakBonus: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XPSource {
  type: 'daily_quest' | 'cloud_streak' | 'social' | 'achievement' | 'bonus';
  amount: number;
  description: string;
  multiplier?: number;
}

// ═══════════════════════════════════════
// REWARDS CATALOG (BETA SEASON 1)
// ═══════════════════════════════════════

export const BETA_SEASON_REWARDS: PassReward[] = [
  // Level 1-10 (Starter Rewards)
  {
    id: 'bs1_r01',
    level: 1,
    type: 'coins',
    name: 'Starter Coins',
    nameDE: 'Starter Coins',
    description: '50 Delulu Coins to start your journey',
    descriptionDE: '50 Delulu Coins für deinen Start',
    rarity: 'common',
    isPremium: false,
    value: 50,
  },
  {
    id: 'bs1_r02',
    level: 1,
    type: 'avatar_frame',
    name: 'Beta Dreamer Frame',
    nameDE: 'Beta Träumer Rahmen',
    description: 'Exclusive frame for Beta participants',
    descriptionDE: 'Exklusiver Rahmen für Beta-Teilnehmer',
    rarity: 'rare',
    isPremium: true,
    previewUrl: '/assets/frames/beta-dreamer.png',
  },
  {
    id: 'bs1_r03',
    level: 5,
    type: 'xp_boost',
    name: 'XP Boost x1.5',
    nameDE: 'XP Boost x1.5',
    description: '24h of 1.5x XP',
    descriptionDE: '24h lang 1.5x XP',
    rarity: 'common',
    isPremium: false,
    value: 1.5,
  },
  {
    id: 'bs1_r04',
    level: 5,
    type: 'chat_bubble',
    name: 'Cloud Bubble',
    nameDE: 'Wolken-Bubble',
    description: 'Dreamy cloud-shaped chat bubbles',
    descriptionDE: 'Verträumte Wolken-Chat-Bubbles',
    rarity: 'rare',
    isPremium: true,
    previewUrl: '/assets/bubbles/cloud.png',
  },
  {
    id: 'bs1_r05',
    level: 10,
    type: 'coins',
    name: 'Coin Bundle',
    nameDE: 'Coin Bundle',
    description: '100 Delulu Coins',
    descriptionDE: '100 Delulu Coins',
    rarity: 'common',
    isPremium: false,
    value: 100,
  },
  {
    id: 'bs1_r06',
    level: 10,
    type: 'glow_effect',
    name: 'Soft Lavender Glow',
    nameDE: 'Sanftes Lavendel-Leuchten',
    description: 'Gentle purple aura around your avatar',
    descriptionDE: 'Sanfte lila Aura um deinen Avatar',
    rarity: 'epic',
    isPremium: true,
    previewUrl: '/assets/effects/lavender-glow.png',
  },
  // Level 11-25
  {
    id: 'bs1_r07',
    level: 15,
    type: 'emoji_pack',
    name: 'Dreamy Emojis',
    nameDE: 'Verträumte Emojis',
    description: '12 exclusive dreamy emojis',
    descriptionDE: '12 exklusive verträumte Emojis',
    rarity: 'rare',
    isPremium: false,
  },
  {
    id: 'bs1_r08',
    level: 15,
    type: 'profile_banner',
    name: 'Aurora Banner',
    nameDE: 'Aurora Banner',
    description: 'Beautiful aurora borealis header',
    descriptionDE: 'Wunderschöner Nordlicht-Header',
    rarity: 'epic',
    isPremium: true,
    previewUrl: '/assets/banners/aurora.png',
  },
  {
    id: 'bs1_r09',
    level: 20,
    type: 'title',
    name: 'Cloud Walker',
    nameDE: 'Wolkenwanderer',
    description: 'Display title below your name',
    descriptionDE: 'Titel unter deinem Namen',
    rarity: 'rare',
    isPremium: false,
  },
  {
    id: 'bs1_r10',
    level: 20,
    type: 'name_effect',
    name: 'Shimmer Name',
    nameDE: 'Schimmer-Name',
    description: 'Your name sparkles with light',
    descriptionDE: 'Dein Name funkelt im Licht',
    rarity: 'epic',
    isPremium: true,
  },
  {
    id: 'bs1_r11',
    level: 25,
    type: 'coins',
    name: 'Big Coin Bag',
    nameDE: 'Großer Coin-Beutel',
    description: '250 Delulu Coins',
    descriptionDE: '250 Delulu Coins',
    rarity: 'rare',
    isPremium: false,
    value: 250,
  },
  {
    id: 'bs1_r12',
    level: 25,
    type: 'cloud_theme',
    name: 'Sunset Dreams',
    nameDE: 'Sonnenuntergang-Träume',
    description: 'Golden hour cloud theme',
    descriptionDE: 'Goldene Stunde Cloud-Theme',
    rarity: 'epic',
    isPremium: true,
    previewUrl: '/assets/themes/sunset-dreams.png',
  },
  // Level 26-50 (Mid Season)
  {
    id: 'bs1_r13',
    level: 30,
    type: 'sound_pack',
    name: 'Chill Vibes',
    nameDE: 'Chill Vibes',
    description: 'Relaxing notification sounds',
    descriptionDE: 'Entspannende Benachrichtigungstöne',
    rarity: 'rare',
    isPremium: false,
  },
  {
    id: 'bs1_r14',
    level: 30,
    type: 'avatar_frame',
    name: 'Holographic Frame',
    nameDE: 'Holografischer Rahmen',
    description: 'Color-shifting holographic border',
    descriptionDE: 'Farbwechselnder holografischer Rahmen',
    rarity: 'legendary',
    isPremium: true,
    previewUrl: '/assets/frames/holographic.png',
  },
  {
    id: 'bs1_r15',
    level: 40,
    type: 'exclusive_badge',
    name: 'Early Dreamer',
    nameDE: 'Früher Träumer',
    description: 'Badge for Beta Season participants',
    descriptionDE: 'Abzeichen für Beta-Staffel-Teilnehmer',
    rarity: 'epic',
    isPremium: false,
  },
  {
    id: 'bs1_r16',
    level: 40,
    type: 'glow_effect',
    name: 'Rainbow Aura',
    nameDE: 'Regenbogen-Aura',
    description: 'Multicolor shifting aura',
    descriptionDE: 'Mehrfarbig wechselnde Aura',
    rarity: 'legendary',
    isPremium: true,
    previewUrl: '/assets/effects/rainbow-aura.png',
  },
  {
    id: 'bs1_r17',
    level: 50,
    type: 'coins',
    name: 'Treasure Chest',
    nameDE: 'Schatzkiste',
    description: '500 Delulu Coins',
    descriptionDE: '500 Delulu Coins',
    rarity: 'epic',
    isPremium: false,
    value: 500,
  },
  {
    id: 'bs1_r18',
    level: 50,
    type: 'profile_banner',
    name: 'Galaxy Dreams',
    nameDE: 'Galaxie-Träume',
    description: 'Animated galaxy header',
    descriptionDE: 'Animierter Galaxie-Header',
    rarity: 'legendary',
    isPremium: true,
    previewUrl: '/assets/banners/galaxy.png',
  },
  // Level 51-75 (Advanced)
  {
    id: 'bs1_r19',
    level: 60,
    type: 'title',
    name: 'Dream Master',
    nameDE: 'Traum-Meister',
    description: 'Prestigious title',
    descriptionDE: 'Prestigeträchtiger Titel',
    rarity: 'epic',
    isPremium: false,
  },
  {
    id: 'bs1_r20',
    level: 60,
    type: 'chat_bubble',
    name: 'Neon Bubble',
    nameDE: 'Neon-Bubble',
    description: 'Glowing neon chat bubbles',
    descriptionDE: 'Leuchtende Neon-Chat-Bubbles',
    rarity: 'legendary',
    isPremium: true,
    previewUrl: '/assets/bubbles/neon.png',
  },
  {
    id: 'bs1_r21',
    level: 75,
    type: 'xp_boost',
    name: 'XP Boost x2',
    nameDE: 'XP Boost x2',
    description: '48h of 2x XP',
    descriptionDE: '48h lang 2x XP',
    rarity: 'epic',
    isPremium: false,
    value: 2,
  },
  {
    id: 'bs1_r22',
    level: 75,
    type: 'name_effect',
    name: 'Holographic Name',
    nameDE: 'Holografischer Name',
    description: 'Your name shimmers in holographic colors',
    descriptionDE: 'Dein Name schimmert holografisch',
    rarity: 'legendary',
    isPremium: true,
  },
  // Level 76-99 (Elite)
  {
    id: 'bs1_r23',
    level: 85,
    type: 'coins',
    name: 'Elite Vault',
    nameDE: 'Elite-Tresor',
    description: '1000 Delulu Coins',
    descriptionDE: '1000 Delulu Coins',
    rarity: 'legendary',
    isPremium: false,
    value: 1000,
  },
  {
    id: 'bs1_r24',
    level: 85,
    type: 'cloud_theme',
    name: 'Cosmic Dreams',
    nameDE: 'Kosmische Träume',
    description: 'Animated cosmic cloud theme',
    descriptionDE: 'Animiertes kosmisches Cloud-Theme',
    rarity: 'legendary',
    isPremium: true,
    previewUrl: '/assets/themes/cosmic.png',
  },
  // Level 100 (Ultimate Rewards)
  {
    id: 'bs1_r25',
    level: 100,
    type: 'exclusive_badge',
    name: 'Beta Legend',
    nameDE: 'Beta-Legende',
    description: 'Ultimate badge for completing Beta Season',
    descriptionDE: 'Ultimatives Abzeichen für Beta-Staffel-Abschluss',
    rarity: 'mythic',
    isPremium: false,
  },
  {
    id: 'bs1_r26',
    level: 100,
    type: 'avatar_frame',
    name: 'Mythic Dreamer Frame',
    nameDE: 'Mythischer Träumer-Rahmen',
    description: 'Animated legendary frame with particles',
    descriptionDE: 'Animierter legendärer Rahmen mit Partikeln',
    rarity: 'mythic',
    isPremium: true,
    previewUrl: '/assets/frames/mythic-dreamer.png',
  },
];

// ═══════════════════════════════════════
// XP SOURCES & MULTIPLIERS
// ═══════════════════════════════════════

export const XP_SOURCES = {
  dailyQuest: {
    easy: 50,
    medium: 100,
    hard: 200,
    bonus: 300, // All dailies completed
  },
  cloudStreak: {
    base: 25, // Per day of streak
    milestone7: 100,
    milestone14: 250,
    milestone30: 500,
    milestone100: 2000,
  },
  social: {
    invite: 150,
    inviteActive: 300, // Invited friend reaches level 5
    cloudInteraction: 10,
    friendMade: 50,
  },
  achievement: {
    small: 100,
    medium: 250,
    large: 500,
    legendary: 1000,
  },
};

// ═══════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════

/**
 * Get or initialize user's Dream Pass progress
 */
export const getDreamPassProgress = async (userId: string): Promise<UserDreamPassProgress | null> => {
  try {
    const progressRef = doc(db, 'dreamPassProgress', `${userId}_${DREAM_PASS_CONFIG.seasonId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return null;
    }

    const data = progressDoc.data();
    return {
      id: progressDoc.id,
      oderId: data.userId,
      ...data,
      lastXPGain: data.lastXPGain?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserDreamPassProgress;
  } catch (error) {
    console.error('Error getting Dream Pass progress:', error);
    return null;
  }
};

/**
 * Initialize Dream Pass for user
 */
export const initializeDreamPass = async (userId: string): Promise<UserDreamPassProgress> => {
  const progress: UserDreamPassProgress = {
    id: `${userId}_${DREAM_PASS_CONFIG.seasonId}`,
    oderId: userId,
    seasonId: DREAM_PASS_CONFIG.seasonId,
    currentLevel: 1,
    currentXP: 0,
    totalXPEarned: 0,
    isPremium: false,
    premiumUnlockedVia: null,
    unlockedRewards: [],
    claimedRewards: [],
    lastXPGain: new Date(),
    streakBonus: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const progressRef = doc(db, 'dreamPassProgress', progress.id);
  await setDoc(progressRef, {
    ...progress,
    lastXPGain: Timestamp.fromDate(progress.lastXPGain),
    createdAt: Timestamp.fromDate(progress.createdAt),
    updatedAt: Timestamp.fromDate(progress.updatedAt),
  });

  return progress;
};

/**
 * Add XP to Dream Pass and check for level ups
 */
export const addDreamPassXP = async (
  userId: string,
  source: XPSource
): Promise<{
  success: boolean;
  leveledUp: boolean;
  newLevel?: number;
  newRewards?: PassReward[];
  totalXP?: number;
}> => {
  try {
    let progress = await getDreamPassProgress(userId);
    if (!progress) {
      progress = await initializeDreamPass(userId);
    }

    // Check if season has started
    const now = new Date();
    if (now < DREAM_PASS_CONFIG.seasonStart) {
      // Pre-season: Still allow XP accumulation
      console.log('Pre-season XP accumulation');
    }

    // Calculate XP with multiplier
    const xpGained = Math.floor(source.amount * (source.multiplier || 1));
    const newTotalXP = progress.totalXPEarned + xpGained;
    let newCurrentXP = progress.currentXP + xpGained;
    let newLevel = progress.currentLevel;
    const newRewards: PassReward[] = [];

    // Check for level ups
    while (newCurrentXP >= DREAM_PASS_CONFIG.xpPerLevel && newLevel < DREAM_PASS_CONFIG.maxLevel) {
      newCurrentXP -= DREAM_PASS_CONFIG.xpPerLevel;
      newLevel++;

      // Find rewards for this level
      const levelRewards = BETA_SEASON_REWARDS.filter(r =>
        r.level === newLevel && (!r.isPremium || progress!.isPremium)
      );
      newRewards.push(...levelRewards);
    }

    // Cap XP at max level
    if (newLevel >= DREAM_PASS_CONFIG.maxLevel) {
      newCurrentXP = Math.min(newCurrentXP, DREAM_PASS_CONFIG.xpPerLevel);
    }

    // Update progress
    const progressRef = doc(db, 'dreamPassProgress', progress.id);
    const unlockedRewardIds = newRewards.map(r => r.id);

    await updateDoc(progressRef, {
      currentLevel: newLevel,
      currentXP: newCurrentXP,
      totalXPEarned: newTotalXP,
      unlockedRewards: [...progress.unlockedRewards, ...unlockedRewardIds],
      lastXPGain: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return {
      success: true,
      leveledUp: newLevel > progress.currentLevel,
      newLevel: newLevel > progress.currentLevel ? newLevel : undefined,
      newRewards: newRewards.length > 0 ? newRewards : undefined,
      totalXP: newTotalXP,
    };
  } catch (error) {
    console.error('Error adding Dream Pass XP:', error);
    return { success: false, leveledUp: false };
  }
};

/**
 * Check and unlock premium via referrals
 */
export const checkPremiumUnlock = async (userId: string): Promise<boolean> => {
  try {
    const progress = await getDreamPassProgress(userId);
    if (!progress || progress.isPremium) return progress?.isPremium || false;

    // Check referral count
    const referralStats = await getReferralStats(userId);

    if (referralStats.totalReferrals >= DREAM_PASS_CONFIG.premiumUnlockInvites) {
      // Unlock premium!
      const progressRef = doc(db, 'dreamPassProgress', progress.id);
      await updateDoc(progressRef, {
        isPremium: true,
        premiumUnlockedVia: 'referral',
        updatedAt: Timestamp.fromDate(new Date()),
      });

      // Retroactively unlock premium rewards
      const premiumRewards = BETA_SEASON_REWARDS.filter(
        r => r.isPremium && r.level <= progress.currentLevel
      );

      if (premiumRewards.length > 0) {
        await updateDoc(progressRef, {
          unlockedRewards: [
            ...progress.unlockedRewards,
            ...premiumRewards.map(r => r.id),
          ],
        });
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking premium unlock:', error);
    return false;
  }
};

/**
 * Claim a reward
 */
export const claimReward = async (
  userId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const progress = await getDreamPassProgress(userId);
    if (!progress) {
      return { success: false, error: 'Pass nicht gefunden' };
    }

    // Check if reward is unlocked
    if (!progress.unlockedRewards.includes(rewardId)) {
      return { success: false, error: 'Belohnung nicht freigeschaltet' };
    }

    // Check if already claimed
    if (progress.claimedRewards.includes(rewardId)) {
      return { success: false, error: 'Belohnung bereits abgeholt' };
    }

    // Find reward
    const reward = BETA_SEASON_REWARDS.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, error: 'Belohnung nicht gefunden' };
    }

    // Process reward (coins, etc.)
    if (reward.type === 'coins' && reward.value) {
      // Add coins to wallet
      const { addCoins } = await import('./lockSystem');
      await addCoins(userId, reward.value, `Dream Pass Belohnung: ${reward.nameDE}`, 'earn');
    }

    // Mark as claimed
    const progressRef = doc(db, 'dreamPassProgress', progress.id);
    await updateDoc(progressRef, {
      claimedRewards: [...progress.claimedRewards, rewardId],
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return { success: true };
  } catch (error) {
    console.error('Error claiming reward:', error);
    return { success: false, error: 'Fehler beim Abholen' };
  }
};

/**
 * Get rewards for a specific level
 */
export const getRewardsForLevel = (level: number): PassReward[] => {
  return BETA_SEASON_REWARDS.filter(r => r.level === level);
};

/**
 * Get all rewards up to current level
 */
export const getAvailableRewards = (
  currentLevel: number,
  isPremium: boolean
): PassReward[] => {
  return BETA_SEASON_REWARDS.filter(r =>
    r.level <= currentLevel && (!r.isPremium || isPremium)
  );
};

/**
 * Subscribe to Dream Pass progress changes
 */
export const subscribeToDreamPassProgress = (
  userId: string,
  callback: (progress: UserDreamPassProgress | null) => void
): (() => void) => {
  const progressRef = doc(db, 'dreamPassProgress', `${userId}_${DREAM_PASS_CONFIG.seasonId}`);

  return onSnapshot(progressRef, (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }

    const data = doc.data();
    callback({
      id: doc.id,
      oderId: data.userId,
      ...data,
      lastXPGain: data.lastXPGain?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserDreamPassProgress);
  });
};

/**
 * Calculate time until season start
 */
export const getSeasonCountdown = (): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasStarted: boolean;
} => {
  const now = new Date();
  const start = DREAM_PASS_CONFIG.seasonStart;

  if (now >= start) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasStarted: true };
  }

  const diff = start.getTime() - now.getTime();

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    hasStarted: false,
  };
};

/**
 * Get rarity color
 */
export const getRarityColor = (rarity: PassReward['rarity']): string => {
  const colors = {
    common: '#9CA3AF',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
    mythic: '#F472B6',
  };
  return colors[rarity];
};

/**
 * Get rarity glow
 */
export const getRarityGlow = (rarity: PassReward['rarity']): string => {
  const glows = {
    common: 'none',
    rare: '0 0 10px #60A5FA50',
    epic: '0 0 15px #A78BFA60',
    legendary: '0 0 20px #FBBF2470',
    mythic: '0 0 25px #F472B680, 0 0 50px #F472B640',
  };
  return glows[rarity];
};

export default {
  DREAM_PASS_CONFIG,
  BETA_SEASON_REWARDS,
  XP_SOURCES,
  getDreamPassProgress,
  initializeDreamPass,
  addDreamPassXP,
  checkPremiumUnlock,
  claimReward,
  getRewardsForLevel,
  getAvailableRewards,
  subscribeToDreamPassProgress,
  getSeasonCountdown,
  getRarityColor,
  getRarityGlow,
};
