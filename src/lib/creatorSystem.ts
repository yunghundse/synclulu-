/**
 * DELULU CREATOR & STAR PROGRAM
 * Monetization & Virality Engine
 */

import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, increment, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// CREATOR TIER DEFINITIONS
// ═══════════════════════════════════════

export type CreatorTier = 'user' | 'rising' | 'creator' | 'star' | 'legend' | 'icon';

export interface CreatorTierConfig {
  tier: CreatorTier;
  name: string;
  nameDE: string;
  emoji: string;
  minFollowers: number;
  minInvites: number;
  minLevel: number;
  color: string;
  glowColor: string;
  features: string[];
  revenueShare: number; // Percentage of unlock revenue
}

export const CREATOR_TIERS: Record<CreatorTier, CreatorTierConfig> = {
  user: {
    tier: 'user',
    name: 'User',
    nameDE: 'Nutzer',
    emoji: '☁️',
    minFollowers: 0,
    minInvites: 0,
    minLevel: 1,
    color: '#9CA3AF',
    glowColor: 'transparent',
    features: ['basic_profile', 'private_clouds'],
    revenueShare: 0,
  },
  rising: {
    tier: 'rising',
    name: 'Rising',
    nameDE: 'Aufsteiger',
    emoji: '🌤️',
    minFollowers: 25,
    minInvites: 3,
    minLevel: 10,
    color: '#60A5FA',
    glowColor: '#60A5FA40',
    features: ['animated_avatar', 'custom_status', 'locked_content'],
    revenueShare: 10,
  },
  creator: {
    tier: 'creator',
    name: 'Creator',
    nameDE: 'Creator',
    emoji: '⛅',
    minFollowers: 100,
    minInvites: 10,
    minLevel: 25,
    color: '#A78BFA',
    glowColor: '#A78BFA50',
    features: ['public_cloud', 'analytics_basic', 'custom_header', 'priority_support'],
    revenueShare: 20,
  },
  star: {
    tier: 'star',
    name: 'Delulu Star',
    nameDE: 'Delulu Star',
    emoji: '⭐',
    minFollowers: 500,
    minInvites: 25,
    minLevel: 50,
    color: '#FBBF24',
    glowColor: '#FBBF2460',
    features: ['verified_badge', 'creator_quests', 'monetization', 'analytics_advanced'],
    revenueShare: 40,
  },
  legend: {
    tier: 'legend',
    name: 'Legend',
    nameDE: 'Legende',
    emoji: '🌟',
    minFollowers: 2000,
    minInvites: 100,
    minLevel: 100,
    color: '#F472B6',
    glowColor: '#F472B670',
    features: ['custom_effects', 'exclusive_events', 'direct_monetization'],
    revenueShare: 60,
  },
  icon: {
    tier: 'icon',
    name: 'Delulu Icon',
    nameDE: 'Delulu Icon',
    emoji: '👑',
    minFollowers: 10000,
    minInvites: 500,
    minLevel: 200,
    color: '#DC2626',
    glowColor: '#DC262680',
    features: ['legendary_effects', 'partnership', 'revenue_priority'],
    revenueShare: 80,
  },
};

// ═══════════════════════════════════════
// CREATOR PROFILE INTERFACE
// ═══════════════════════════════════════

export interface CreatorProfile {
  userId: string;
  tier: CreatorTier;
  isVerified: boolean;
  followerCount: number;
  successfulInvites: number;
  totalUnlocks: number;
  totalRevenue: number;
  cloudReach: number; // Total views on public content
  publicCloudEnabled: boolean;
  monetizationEnabled: boolean;
  customEffects: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════
// IN-APP CURRENCY
// ═══════════════════════════════════════

export const CURRENCY_CONFIG = {
  name: 'Delulu Coins',
  symbol: '💎',
  exchangeRate: 100, // 100 coins = 1 EUR
  unlockCost: 50, // Cost to unlock content
  packages: [
    { coins: 100, priceEUR: 0.99, bonus: 0 },
    { coins: 500, priceEUR: 4.49, bonus: 50 },
    { coins: 1200, priceEUR: 9.99, bonus: 200 },
    { coins: 3000, priceEUR: 19.99, bonus: 750 },
    { coins: 8000, priceEUR: 49.99, bonus: 2500 },
  ],
};

// ═══════════════════════════════════════
// TIER CALCULATION
// ═══════════════════════════════════════

/**
 * Calculate the creator tier based on stats
 */
export const calculateCreatorTier = (
  followerCount: number,
  successfulInvites: number,
  level: number
): CreatorTier => {
  const tiers: CreatorTier[] = ['icon', 'legend', 'star', 'creator', 'rising', 'user'];

  for (const tierKey of tiers) {
    const tier = CREATOR_TIERS[tierKey];
    if (
      followerCount >= tier.minFollowers &&
      successfulInvites >= tier.minInvites &&
      level >= tier.minLevel
    ) {
      return tierKey;
    }
  }

  return 'user';
};

/**
 * Get tier progress percentage
 */
export const getTierProgress = (
  currentTier: CreatorTier,
  followerCount: number,
  successfulInvites: number,
  level: number
): {
  nextTier: CreatorTier | null;
  followersProgress: number;
  invitesProgress: number;
  levelProgress: number;
  overallProgress: number;
} => {
  const tierOrder: CreatorTier[] = ['user', 'rising', 'creator', 'star', 'legend', 'icon'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) {
    return {
      nextTier: null,
      followersProgress: 100,
      invitesProgress: 100,
      levelProgress: 100,
      overallProgress: 100,
    };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const nextConfig = CREATOR_TIERS[nextTier];
  const currentConfig = CREATOR_TIERS[currentTier];

  const followersDiff = nextConfig.minFollowers - currentConfig.minFollowers;
  const invitesDiff = nextConfig.minInvites - currentConfig.minInvites;
  const levelDiff = nextConfig.minLevel - currentConfig.minLevel;

  const followersProgress = Math.min(100, ((followerCount - currentConfig.minFollowers) / followersDiff) * 100);
  const invitesProgress = Math.min(100, ((successfulInvites - currentConfig.minInvites) / invitesDiff) * 100);
  const levelProgress = Math.min(100, ((level - currentConfig.minLevel) / levelDiff) * 100);

  return {
    nextTier,
    followersProgress,
    invitesProgress,
    levelProgress,
    overallProgress: (followersProgress + invitesProgress + levelProgress) / 3,
  };
};

// ═══════════════════════════════════════
// CREATOR PROFILE OPERATIONS
// ═══════════════════════════════════════

/**
 * Initialize or get creator profile
 */
export const getCreatorProfile = async (userId: string): Promise<CreatorProfile | null> => {
  try {
    const profileRef = doc(db, 'creatorProfiles', userId);
    const profileDoc = await getDoc(profileRef);

    if (!profileDoc.exists()) {
      return null;
    }

    const data = profileDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CreatorProfile;
  } catch (error) {
    console.error('Error getting creator profile:', error);
    return null;
  }
};

/**
 * Initialize creator profile for user
 */
export const initializeCreatorProfile = async (userId: string): Promise<CreatorProfile> => {
  const profile: CreatorProfile = {
    userId,
    tier: 'user',
    isVerified: false,
    followerCount: 0,
    successfulInvites: 0,
    totalUnlocks: 0,
    totalRevenue: 0,
    cloudReach: 0,
    publicCloudEnabled: false,
    monetizationEnabled: false,
    customEffects: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const profileRef = doc(db, 'creatorProfiles', userId);
  await setDoc(profileRef, {
    ...profile,
    createdAt: Timestamp.fromDate(profile.createdAt),
    updatedAt: Timestamp.fromDate(profile.updatedAt),
  });

  return profile;
};

/**
 * Update creator tier based on current stats
 */
export const updateCreatorTier = async (userId: string): Promise<CreatorTier> => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 'user';

    const userData = userDoc.data();
    const level = userData.level || 1;

    // Get or create creator profile
    let profile = await getCreatorProfile(userId);
    if (!profile) {
      profile = await initializeCreatorProfile(userId);
    }

    // Calculate new tier
    const newTier = calculateCreatorTier(
      profile.followerCount,
      profile.successfulInvites,
      level
    );

    // Update if tier changed
    if (newTier !== profile.tier) {
      const profileRef = doc(db, 'creatorProfiles', userId);
      await updateDoc(profileRef, {
        tier: newTier,
        isVerified: CREATOR_TIERS[newTier].features.includes('verified_badge'),
        publicCloudEnabled: CREATOR_TIERS[newTier].features.includes('public_cloud'),
        monetizationEnabled: CREATOR_TIERS[newTier].features.includes('monetization'),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    }

    return newTier;
  } catch (error) {
    console.error('Error updating creator tier:', error);
    return 'user';
  }
};

/**
 * Add follower to creator
 */
export const addFollower = async (creatorId: string, followerId: string): Promise<boolean> => {
  try {
    // Create follow relationship
    const followRef = doc(db, 'follows', `${followerId}_${creatorId}`);
    await setDoc(followRef, {
      followerId,
      creatorId,
      createdAt: Timestamp.fromDate(new Date()),
    });

    // Update creator's follower count
    const profileRef = doc(db, 'creatorProfiles', creatorId);
    await updateDoc(profileRef, {
      followerCount: increment(1),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Re-evaluate tier
    await updateCreatorTier(creatorId);

    return true;
  } catch (error) {
    console.error('Error adding follower:', error);
    return false;
  }
};

/**
 * Remove follower from creator
 */
export const removeFollower = async (creatorId: string, followerId: string): Promise<boolean> => {
  try {
    // Remove follow relationship
    const followRef = doc(db, 'follows', `${followerId}_${creatorId}`);
    await updateDoc(followRef, { deleted: true });

    // Update creator's follower count
    const profileRef = doc(db, 'creatorProfiles', creatorId);
    await updateDoc(profileRef, {
      followerCount: increment(-1),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return true;
  } catch (error) {
    console.error('Error removing follower:', error);
    return false;
  }
};

/**
 * Check if user follows a creator
 */
export const isFollowing = async (followerId: string, creatorId: string): Promise<boolean> => {
  try {
    const followRef = doc(db, 'follows', `${followerId}_${creatorId}`);
    const followDoc = await getDoc(followRef);
    return followDoc.exists() && !followDoc.data()?.deleted;
  } catch (error) {
    return false;
  }
};

export default {
  CREATOR_TIERS,
  CURRENCY_CONFIG,
  calculateCreatorTier,
  getTierProgress,
  getCreatorProfile,
  initializeCreatorProfile,
  updateCreatorTier,
  addFollower,
  removeFollower,
  isFollowing,
};
