/**
 * DELULU CREATOR ECONOMY - "THE GOLDMINE"
 * ========================================
 * Silicon Valley-grade monetization system
 *
 * Features:
 * - Delulu Gems (Internal Currency)
 * - Creator Tiers & Subscriptions
 * - Virtual Gifts & Tips
 * - Revenue Share (70/30 Creator/Platform)
 * - Brand Partnerships & Sponsored Events
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  arrayUnion,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type CreatorTier = 'rising' | 'established' | 'star' | 'legend';

export interface CreatorProfile {
  userId: string;
  tier: CreatorTier;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl?: string;

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  verificationBadge: 'none' | 'creator' | 'star' | 'partner';

  // Stats
  totalFollowers: number;
  totalSubscribers: number;
  totalGiftsReceived: number;
  totalGemsEarned: number;
  totalPayouts: number;
  monthlyEarnings: number;

  // Content
  exclusiveRoomCount: number;
  totalContentViews: number;

  // Settings
  subscriptionPrice: number; // in Gems per month
  tipEnabled: boolean;
  minTipAmount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DeluluGems {
  userId: string;
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  totalEarned: number;
  transactions: GemTransaction[];
  updatedAt: Date;
}

export interface GemTransaction {
  id: string;
  type: 'purchase' | 'tip' | 'gift' | 'subscription' | 'payout' | 'reward' | 'refund';
  amount: number;
  description: string;
  fromUserId?: string;
  toUserId?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  price: number; // in Gems
  animation?: string;
  tier: 'basic' | 'premium' | 'legendary';
  isLimited?: boolean;
  availableUntil?: Date;
}

export interface Subscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tier: 'basic' | 'premium' | 'vip';
  priceGems: number;
  startDate: Date;
  renewalDate: Date;
  isActive: boolean;
  autoRenew: boolean;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

export const CREATOR_TIERS: Record<CreatorTier, {
  name: string;
  emoji: string;
  minFollowers: number;
  revenueShare: number; // Creator's percentage
  perks: string[];
}> = {
  rising: {
    name: 'Rising Star',
    emoji: '⭐',
    minFollowers: 0,
    revenueShare: 0.60, // 60% to creator
    perks: ['Basis-Analytics', 'Tip-Empfang'],
  },
  established: {
    name: 'Established',
    emoji: '🌟',
    minFollowers: 100,
    revenueShare: 0.65, // 65%
    perks: ['Erweiterte Analytics', 'Exklusive Räume (3)', 'Abo-Modell'],
  },
  star: {
    name: 'Delulu Star',
    emoji: '💫',
    minFollowers: 1000,
    revenueShare: 0.70, // 70%
    perks: ['Premium Analytics', 'Exklusive Räume (10)', 'Verifizierungs-Badge', 'Priority Support'],
  },
  legend: {
    name: 'Legend',
    emoji: '👑',
    minFollowers: 10000,
    revenueShare: 0.75, // 75%
    perks: ['VIP Analytics', 'Unbegrenzte Räume', 'Custom Badge', 'Brand Deals', 'Dedicated Manager'],
  },
};

export const VIRTUAL_GIFTS: VirtualGift[] = [
  // Basic Tier
  { id: 'heart', name: 'Herz', emoji: '❤️', price: 10, tier: 'basic' },
  { id: 'star', name: 'Stern', emoji: '⭐', price: 25, tier: 'basic' },
  { id: 'cloud', name: 'Wölkchen', emoji: '☁️', price: 50, tier: 'basic' },
  { id: 'rainbow', name: 'Regenbogen', emoji: '🌈', price: 75, tier: 'basic' },

  // Premium Tier
  { id: 'crown', name: 'Krone', emoji: '👑', price: 150, tier: 'premium' },
  { id: 'diamond', name: 'Diamant', emoji: '💎', price: 300, tier: 'premium' },
  { id: 'rocket', name: 'Rakete', emoji: '🚀', price: 500, tier: 'premium', animation: 'rocket-launch' },
  { id: 'fireworks', name: 'Feuerwerk', emoji: '🎆', price: 750, tier: 'premium', animation: 'fireworks' },

  // Legendary Tier
  { id: 'unicorn', name: 'Einhorn', emoji: '🦄', price: 1500, tier: 'legendary', animation: 'unicorn-magic' },
  { id: 'galaxy', name: 'Galaxie', emoji: '🌌', price: 3000, tier: 'legendary', animation: 'galaxy-spin' },
  { id: 'delulu-special', name: 'Delulu Supreme', emoji: '💜', price: 5000, tier: 'legendary', animation: 'supreme-entrance' },
];

export const GEM_PACKAGES = [
  { gems: 100, price: 0.99, bonus: 0, popular: false },
  { gems: 500, price: 4.99, bonus: 50, popular: false },
  { gems: 1000, price: 9.99, bonus: 150, popular: true },
  { gems: 2500, price: 24.99, bonus: 500, popular: false },
  { gems: 5000, price: 49.99, bonus: 1250, popular: false },
  { gems: 10000, price: 99.99, bonus: 3000, popular: false },
];

// ═══════════════════════════════════════
// GEM OPERATIONS
// ═══════════════════════════════════════

/**
 * Get user's gem balance
 */
export const getGemBalance = async (userId: string): Promise<DeluluGems | null> => {
  try {
    const gemsDoc = await getDoc(doc(db, 'gems', userId));
    if (!gemsDoc.exists()) return null;

    const data = gemsDoc.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
      transactions: (data.transactions || []).map((t: any) => ({
        ...t,
        createdAt: t.createdAt?.toDate() || new Date(),
      })),
    } as DeluluGems;
  } catch (error) {
    console.error('Error getting gem balance:', error);
    return null;
  }
};

/**
 * Initialize gems for new user
 */
export const initializeGems = async (userId: string): Promise<DeluluGems> => {
  const gems: DeluluGems = {
    userId,
    balance: 0,
    totalPurchased: 0,
    totalSpent: 0,
    totalEarned: 0,
    transactions: [],
    updatedAt: new Date(),
  };

  await setDoc(doc(db, 'gems', userId), {
    ...gems,
    updatedAt: Timestamp.fromDate(gems.updatedAt),
  });

  return gems;
};

/**
 * Add gems to user's balance (purchase, reward, etc.)
 */
export const addGems = async (
  userId: string,
  amount: number,
  type: GemTransaction['type'],
  description: string,
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    const transaction: GemTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      description,
      createdAt: new Date(),
      metadata,
    };

    await updateDoc(doc(db, 'gems', userId), {
      balance: increment(amount),
      totalPurchased: type === 'purchase' ? increment(amount) : increment(0),
      totalEarned: type !== 'purchase' ? increment(amount) : increment(0),
      transactions: arrayUnion({
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt),
      }),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return true;
  } catch (error) {
    console.error('Error adding gems:', error);
    return false;
  }
};

/**
 * Spend gems (tips, gifts, subscriptions)
 */
export const spendGems = async (
  userId: string,
  amount: number,
  type: GemTransaction['type'],
  description: string,
  toUserId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check balance
    const balance = await getGemBalance(userId);
    if (!balance || balance.balance < amount) {
      return { success: false, error: 'Nicht genügend Gems' };
    }

    const transaction: GemTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount: -amount,
      description,
      toUserId,
      createdAt: new Date(),
      metadata,
    };

    await updateDoc(doc(db, 'gems', userId), {
      balance: increment(-amount),
      totalSpent: increment(amount),
      transactions: arrayUnion({
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt),
      }),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return { success: true };
  } catch (error) {
    console.error('Error spending gems:', error);
    return { success: false, error: 'Transaktion fehlgeschlagen' };
  }
};

// ═══════════════════════════════════════
// CREATOR OPERATIONS
// ═══════════════════════════════════════

/**
 * Get creator profile
 */
export const getCreatorProfile = async (userId: string): Promise<CreatorProfile | null> => {
  try {
    const profileDoc = await getDoc(doc(db, 'creators', userId));
    if (!profileDoc.exists()) return null;

    const data = profileDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      verifiedAt: data.verifiedAt?.toDate(),
    } as CreatorProfile;
  } catch (error) {
    console.error('Error getting creator profile:', error);
    return null;
  }
};

/**
 * Apply to become a creator
 */
export const applyForCreator = async (
  userId: string,
  userData: { username: string; displayName: string; bio: string; avatarUrl?: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const existing = await getCreatorProfile(userId);
    if (existing) {
      return { success: false, error: 'Du bist bereits Creator' };
    }

    const profile: Omit<CreatorProfile, 'createdAt' | 'updatedAt'> = {
      userId,
      tier: 'rising',
      displayName: userData.displayName,
      username: userData.username,
      bio: userData.bio,
      avatarUrl: userData.avatarUrl,
      isVerified: false,
      verificationBadge: 'none',
      totalFollowers: 0,
      totalSubscribers: 0,
      totalGiftsReceived: 0,
      totalGemsEarned: 0,
      totalPayouts: 0,
      monthlyEarnings: 0,
      exclusiveRoomCount: 0,
      totalContentViews: 0,
      subscriptionPrice: 500, // Default: 500 Gems/month
      tipEnabled: true,
      minTipAmount: 10,
    };

    await setDoc(doc(db, 'creators', userId), {
      ...profile,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Initialize gems if not exists
    const gems = await getGemBalance(userId);
    if (!gems) {
      await initializeGems(userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error applying for creator:', error);
    return { success: false, error: 'Anmeldung fehlgeschlagen' };
  }
};

/**
 * Send a gift to a creator
 */
export const sendGift = async (
  senderId: string,
  creatorId: string,
  giftId: string
): Promise<{ success: boolean; error?: string }> => {
  const gift = VIRTUAL_GIFTS.find((g) => g.id === giftId);
  if (!gift) {
    return { success: false, error: 'Geschenk nicht gefunden' };
  }

  // Spend gems from sender
  const spendResult = await spendGems(
    senderId,
    gift.price,
    'gift',
    `Geschenk: ${gift.name}`,
    creatorId,
    { giftId, giftName: gift.name }
  );

  if (!spendResult.success) {
    return spendResult;
  }

  // Get creator's revenue share
  const creator = await getCreatorProfile(creatorId);
  const tierConfig = CREATOR_TIERS[creator?.tier || 'rising'];
  const creatorShare = Math.floor(gift.price * tierConfig.revenueShare);

  // Add gems to creator
  await addGems(
    creatorId,
    creatorShare,
    'gift',
    `Geschenk erhalten: ${gift.name}`,
    { senderId, giftId }
  );

  // Update creator stats
  await updateDoc(doc(db, 'creators', creatorId), {
    totalGiftsReceived: increment(1),
    totalGemsEarned: increment(creatorShare),
    monthlyEarnings: increment(creatorShare),
    updatedAt: Timestamp.fromDate(new Date()),
  });

  // Record gift in history
  await addDoc(collection(db, 'giftHistory'), {
    senderId,
    creatorId,
    giftId,
    giftName: gift.name,
    giftPrice: gift.price,
    creatorShare,
    platformShare: gift.price - creatorShare,
    createdAt: Timestamp.fromDate(new Date()),
  });

  return { success: true };
};

/**
 * Send a tip to a creator
 */
export const sendTip = async (
  senderId: string,
  creatorId: string,
  amount: number,
  message?: string
): Promise<{ success: boolean; error?: string }> => {
  const creator = await getCreatorProfile(creatorId);
  if (!creator) {
    return { success: false, error: 'Creator nicht gefunden' };
  }

  if (!creator.tipEnabled) {
    return { success: false, error: 'Creator akzeptiert keine Tips' };
  }

  if (amount < creator.minTipAmount) {
    return { success: false, error: `Mindestbetrag: ${creator.minTipAmount} Gems` };
  }

  // Spend gems from sender
  const spendResult = await spendGems(
    senderId,
    amount,
    'tip',
    `Tip an @${creator.username}`,
    creatorId,
    { message }
  );

  if (!spendResult.success) {
    return spendResult;
  }

  // Calculate creator's share
  const tierConfig = CREATOR_TIERS[creator.tier];
  const creatorShare = Math.floor(amount * tierConfig.revenueShare);

  // Add gems to creator
  await addGems(
    creatorId,
    creatorShare,
    'tip',
    `Tip erhalten`,
    { senderId, message }
  );

  // Update creator stats
  await updateDoc(doc(db, 'creators', creatorId), {
    totalGemsEarned: increment(creatorShare),
    monthlyEarnings: increment(creatorShare),
    updatedAt: Timestamp.fromDate(new Date()),
  });

  return { success: true };
};

/**
 * Subscribe to a creator
 */
export const subscribeToCreator = async (
  subscriberId: string,
  creatorId: string,
  tier: Subscription['tier'] = 'basic'
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> => {
  const creator = await getCreatorProfile(creatorId);
  if (!creator) {
    return { success: false, error: 'Creator nicht gefunden' };
  }

  const price = creator.subscriptionPrice;

  // Spend gems
  const spendResult = await spendGems(
    subscriberId,
    price,
    'subscription',
    `Abo: @${creator.username}`,
    creatorId
  );

  if (!spendResult.success) {
    return spendResult;
  }

  // Calculate creator's share
  const tierConfig = CREATOR_TIERS[creator.tier];
  const creatorShare = Math.floor(price * tierConfig.revenueShare);

  // Add gems to creator
  await addGems(
    creatorId,
    creatorShare,
    'subscription',
    `Neues Abo`,
    { subscriberId }
  );

  // Create subscription
  const subscription: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subscriberId,
    creatorId,
    tier,
    priceGems: price,
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    autoRenew: true,
  };

  await setDoc(doc(db, 'subscriptions', subscription.id), {
    ...subscription,
    startDate: Timestamp.fromDate(subscription.startDate),
    renewalDate: Timestamp.fromDate(subscription.renewalDate),
  });

  // Update creator stats
  await updateDoc(doc(db, 'creators', creatorId), {
    totalSubscribers: increment(1),
    totalGemsEarned: increment(creatorShare),
    monthlyEarnings: increment(creatorShare),
    updatedAt: Timestamp.fromDate(new Date()),
  });

  return { success: true, subscription };
};

// ═══════════════════════════════════════
// PAYOUT SYSTEM
// ═══════════════════════════════════════

export const GEM_TO_EUR_RATE = 0.008; // 1 Gem = 0.008€ (1000 Gems ≈ 8€)
export const MIN_PAYOUT_GEMS = 5000; // Minimum 5000 Gems (≈40€) for payout

/**
 * Request payout (converts gems to real money)
 */
export const requestPayout = async (
  creatorId: string,
  gemAmount: number
): Promise<{ success: boolean; payoutId?: string; euroAmount?: number; error?: string }> => {
  if (gemAmount < MIN_PAYOUT_GEMS) {
    return { success: false, error: `Mindestbetrag: ${MIN_PAYOUT_GEMS} Gems` };
  }

  const balance = await getGemBalance(creatorId);
  if (!balance || balance.balance < gemAmount) {
    return { success: false, error: 'Nicht genügend Gems' };
  }

  const euroAmount = gemAmount * GEM_TO_EUR_RATE;

  // Deduct gems
  const spendResult = await spendGems(
    creatorId,
    gemAmount,
    'payout',
    `Auszahlung: ${euroAmount.toFixed(2)}€`
  );

  if (!spendResult.success) {
    return spendResult;
  }

  // Create payout record
  const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await addDoc(collection(db, 'payouts'), {
    id: payoutId,
    creatorId,
    gemAmount,
    euroAmount,
    status: 'pending', // pending -> processing -> completed
    requestedAt: Timestamp.fromDate(new Date()),
  });

  // Update creator stats
  await updateDoc(doc(db, 'creators', creatorId), {
    totalPayouts: increment(euroAmount),
    updatedAt: Timestamp.fromDate(new Date()),
  });

  return { success: true, payoutId, euroAmount };
};

export default {
  // Gems
  getGemBalance,
  initializeGems,
  addGems,
  spendGems,

  // Creators
  getCreatorProfile,
  applyForCreator,
  sendGift,
  sendTip,
  subscribeToCreator,

  // Payouts
  requestPayout,

  // Constants
  CREATOR_TIERS,
  VIRTUAL_GIFTS,
  GEM_PACKAGES,
  GEM_TO_EUR_RATE,
  MIN_PAYOUT_GEMS,
};
