/**
 * synclulu LOCK SYSTEM
 * "Secret Bubbles" & Locked Content Monetization
 */

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  getDocs, increment, Timestamp, orderBy, limit, addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { CURRENCY_CONFIG, CREATOR_TIERS, CreatorTier } from './creatorSystem';

// Re-export for convenience
export { CURRENCY_CONFIG };
import { getReferralStats } from './referralSystem';

// ═══════════════════════════════════════
// LOCKED CONTENT TYPES
// ═══════════════════════════════════════

export type LockedContentType = 'text' | 'image' | 'audio' | 'status' | 'secret_bubble';

export type UnlockMethod = 'referral' | 'coins' | 'premium' | 'free';

export interface LockedContent {
  id: string;
  creatorId: string;
  creatorUsername: string;
  type: LockedContentType;
  title: string;
  previewText?: string; // Teaser text shown before unlock
  content: string; // Actual content (encrypted or full URL)
  thumbnailUrl?: string; // Blurred preview for images
  unlockCost: number; // In coins
  unlockMethods: UnlockMethod[];
  requiresInvites: number; // Number of invites needed for free unlock
  totalUnlocks: number;
  totalRevenue: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ContentUnlock {
  id: string;
  contentId: string;
  userId: string;
  method: UnlockMethod;
  coinsPaid: number;
  invitesUsed: number;
  creatorRevenue: number;
  unlockedAt: Date;
}

export interface UserWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: WalletTransaction[];
  lastUpdated: Date;
}

export interface WalletTransaction {
  id: string;
  type: 'purchase' | 'earn' | 'spend' | 'withdraw';
  amount: number;
  description: string;
  relatedContentId?: string;
  createdAt: Date;
}

// ═══════════════════════════════════════
// LOCK SYSTEM CONFIGURATION
// ═══════════════════════════════════════

export const LOCK_CONFIG = {
  defaultUnlockCost: 50, // 50 coins
  minUnlockCost: 10,
  maxUnlockCost: 500,
  invitesForFreeUnlock: 1, // 1 successful invite = 1 free unlock
  platformFee: 0.20, // 20% platform fee
  blurIntensity: 20, // CSS blur value in px
  previewTextLength: 50, // Characters shown before blur
};

// ═══════════════════════════════════════
// WALLET OPERATIONS
// ═══════════════════════════════════════

/**
 * Get user's wallet
 */
export const getUserWallet = async (userId: string): Promise<UserWallet | null> => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (!walletDoc.exists()) {
      return null;
    }

    const data = walletDoc.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated?.toDate() || new Date(),
      transactions: (data.transactions || []).map((t: any) => ({
        ...t,
        createdAt: t.createdAt?.toDate() || new Date(),
      })),
    } as UserWallet;
  } catch (error) {
    console.error('Error getting wallet:', error);
    return null;
  }
};

/**
 * Initialize wallet for user
 */
export const initializeWallet = async (userId: string): Promise<UserWallet> => {
  const wallet: UserWallet = {
    userId,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
    lastUpdated: new Date(),
  };

  const walletRef = doc(db, 'wallets', userId);
  await setDoc(walletRef, {
    ...wallet,
    lastUpdated: Timestamp.fromDate(wallet.lastUpdated),
  });

  return wallet;
};

/**
 * Add coins to wallet
 */
export const addCoins = async (
  userId: string,
  amount: number,
  description: string,
  type: 'purchase' | 'earn' = 'purchase'
): Promise<boolean> => {
  try {
    let wallet = await getUserWallet(userId);
    if (!wallet) {
      wallet = await initializeWallet(userId);
    }

    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      description,
      createdAt: new Date(),
    };

    const walletRef = doc(db, 'wallets', userId);
    await updateDoc(walletRef, {
      balance: increment(amount),
      totalEarned: increment(type === 'earn' ? amount : 0),
      transactions: [...wallet.transactions.slice(-49), {
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt),
      }],
      lastUpdated: Timestamp.fromDate(new Date()),
    });

    return true;
  } catch (error) {
    console.error('Error adding coins:', error);
    return false;
  }
};

/**
 * Spend coins from wallet
 */
export const spendCoins = async (
  userId: string,
  amount: number,
  description: string,
  contentId?: string
): Promise<boolean> => {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return false; // Insufficient balance
    }

    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'spend',
      amount: -amount,
      description,
      relatedContentId: contentId,
      createdAt: new Date(),
    };

    const walletRef = doc(db, 'wallets', userId);
    await updateDoc(walletRef, {
      balance: increment(-amount),
      totalSpent: increment(amount),
      transactions: [...wallet.transactions.slice(-49), {
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt),
      }],
      lastUpdated: Timestamp.fromDate(new Date()),
    });

    return true;
  } catch (error) {
    console.error('Error spending coins:', error);
    return false;
  }
};

// ═══════════════════════════════════════
// LOCKED CONTENT OPERATIONS
// ═══════════════════════════════════════

/**
 * Create locked content
 */
export const createLockedContent = async (
  creatorId: string,
  creatorUsername: string,
  content: Omit<LockedContent, 'id' | 'creatorId' | 'creatorUsername' | 'totalUnlocks' | 'totalRevenue' | 'createdAt'>
): Promise<string | null> => {
  try {
    const contentRef = collection(db, 'lockedContent');
    const docRef = await addDoc(contentRef, {
      ...content,
      creatorId,
      creatorUsername,
      totalUnlocks: 0,
      totalRevenue: 0,
      createdAt: Timestamp.fromDate(new Date()),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating locked content:', error);
    return null;
  }
};

/**
 * Get locked content by ID
 */
export const getLockedContent = async (contentId: string): Promise<LockedContent | null> => {
  try {
    const contentRef = doc(db, 'lockedContent', contentId);
    const contentDoc = await getDoc(contentRef);

    if (!contentDoc.exists()) return null;

    const data = contentDoc.data();
    return {
      id: contentDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate(),
    } as LockedContent;
  } catch (error) {
    console.error('Error getting locked content:', error);
    return null;
  }
};

/**
 * Get all locked content from a creator
 */
export const getCreatorLockedContent = async (
  creatorId: string,
  limitCount: number = 20
): Promise<LockedContent[]> => {
  try {
    const contentRef = collection(db, 'lockedContent');
    const q = query(
      contentRef,
      where('creatorId', '==', creatorId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate(),
    })) as LockedContent[];
  } catch (error) {
    console.error('Error getting creator content:', error);
    return [];
  }
};

/**
 * Check if user has unlocked content
 */
export const hasUnlockedContent = async (
  userId: string,
  contentId: string
): Promise<boolean> => {
  try {
    const unlockRef = doc(db, 'contentUnlocks', `${userId}_${contentId}`);
    const unlockDoc = await getDoc(unlockRef);
    return unlockDoc.exists();
  } catch (error) {
    return false;
  }
};

/**
 * Get user's available free unlocks from invites
 */
export const getAvailableFreeUnlocks = async (userId: string): Promise<number> => {
  try {
    // Get total successful invites
    const referralStats = await getReferralStats(userId);
    const totalInvites = referralStats.totalReferrals;

    // Get used invites for unlocks
    const unlocksRef = collection(db, 'contentUnlocks');
    const q = query(
      unlocksRef,
      where('userId', '==', userId),
      where('method', '==', 'referral')
    );
    const snapshot = await getDocs(q);
    const usedInvites = snapshot.docs.reduce((sum, doc) => sum + (doc.data().invitesUsed || 0), 0);

    return Math.max(0, totalInvites - usedInvites);
  } catch (error) {
    console.error('Error calculating free unlocks:', error);
    return 0;
  }
};

/**
 * Unlock content
 */
export const unlockContent = async (
  userId: string,
  contentId: string,
  method: UnlockMethod
): Promise<{
  success: boolean;
  error?: string;
  content?: string;
}> => {
  try {
    // Check if already unlocked
    const alreadyUnlocked = await hasUnlockedContent(userId, contentId);
    if (alreadyUnlocked) {
      const content = await getLockedContent(contentId);
      return { success: true, content: content?.content };
    }

    // Get content details
    const lockedContent = await getLockedContent(contentId);
    if (!lockedContent) {
      return { success: false, error: 'Inhalt nicht gefunden' };
    }

    if (!lockedContent.unlockMethods.includes(method)) {
      return { success: false, error: 'Diese Unlock-Methode ist nicht verfügbar' };
    }

    let coinsPaid = 0;
    let invitesUsed = 0;
    let creatorRevenue = 0;

    // Process based on method
    if (method === 'coins') {
      // Check and spend coins
      const wallet = await getUserWallet(userId);
      if (!wallet || wallet.balance < lockedContent.unlockCost) {
        return { success: false, error: 'Nicht genügend Coins' };
      }

      const spent = await spendCoins(
        userId,
        lockedContent.unlockCost,
        `Unlock: ${lockedContent.title}`,
        contentId
      );

      if (!spent) {
        return { success: false, error: 'Zahlung fehlgeschlagen' };
      }

      coinsPaid = lockedContent.unlockCost;

      // Calculate creator revenue
      const creatorProfile = await getDoc(doc(db, 'creatorProfiles', lockedContent.creatorId));
      const creatorTier = (creatorProfile.data()?.tier || 'user') as CreatorTier;
      const revenueShare = CREATOR_TIERS[creatorTier].revenueShare / 100;
      creatorRevenue = Math.floor(coinsPaid * revenueShare);

      // Pay creator
      if (creatorRevenue > 0) {
        await addCoins(
          lockedContent.creatorId,
          creatorRevenue,
          `Unlock-Einnahmen: ${lockedContent.title}`,
          'earn'
        );
      }

    } else if (method === 'referral') {
      // Check available free unlocks
      const freeUnlocks = await getAvailableFreeUnlocks(userId);
      if (freeUnlocks < lockedContent.requiresInvites) {
        return {
          success: false,
          error: `Du brauchst ${lockedContent.requiresInvites} erfolgreiche Einladung(en). Du hast ${freeUnlocks} verfügbar.`,
        };
      }

      invitesUsed = lockedContent.requiresInvites;

    } else if (method === 'premium') {
      // Check premium status
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.data()?.isPremium) {
        return { success: false, error: 'Premium-Mitgliedschaft erforderlich' };
      }
    }

    // Create unlock record
    const unlockRef = doc(db, 'contentUnlocks', `${userId}_${contentId}`);
    await setDoc(unlockRef, {
      contentId,
      userId,
      method,
      coinsPaid,
      invitesUsed,
      creatorRevenue,
      unlockedAt: Timestamp.fromDate(new Date()),
    });

    // Update content stats
    const contentRef = doc(db, 'lockedContent', contentId);
    await updateDoc(contentRef, {
      totalUnlocks: increment(1),
      totalRevenue: increment(coinsPaid),
    });

    // Update creator profile stats
    const creatorProfileRef = doc(db, 'creatorProfiles', lockedContent.creatorId);
    await updateDoc(creatorProfileRef, {
      totalUnlocks: increment(1),
      totalRevenue: increment(creatorRevenue),
    });

    return { success: true, content: lockedContent.content };
  } catch (error) {
    console.error('Error unlocking content:', error);
    return { success: false, error: 'Fehler beim Entsperren' };
  }
};

// ═══════════════════════════════════════
// BLUR & PREVIEW UTILITIES
// ═══════════════════════════════════════

/**
 * Generate preview text from content
 */
export const generatePreviewText = (content: string): string => {
  if (content.length <= LOCK_CONFIG.previewTextLength) {
    return content;
  }
  return content.substring(0, LOCK_CONFIG.previewTextLength) + '...';
};

/**
 * Get blur CSS style for locked content
 */
export const getBlurStyle = (isLocked: boolean): React.CSSProperties => {
  if (!isLocked) return {};

  return {
    filter: `blur(${LOCK_CONFIG.blurIntensity}px)`,
    WebkitFilter: `blur(${LOCK_CONFIG.blurIntensity}px)`,
    userSelect: 'none',
    pointerEvents: 'none',
  };
};

export default {
  LOCK_CONFIG,
  CURRENCY_CONFIG,
  getUserWallet,
  initializeWallet,
  addCoins,
  spendCoins,
  createLockedContent,
  getLockedContent,
  getCreatorLockedContent,
  hasUnlockedContent,
  getAvailableFreeUnlocks,
  unlockContent,
  generatePreviewText,
  getBlurStyle,
};
