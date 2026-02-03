/**
 * DELULU DIGITAL OPERATING SYSTEM
 * Referral System - 5 Exclusive Invite Links per User
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_SYSTEM_CONFIG } from './systemConfig';

// ═══════════════════════════════════════
// REFERRAL TYPES
// ═══════════════════════════════════════

export interface ReferralLink {
  id: string;
  code: string;
  createdAt: Date;
  usedBy: string | null;
  usedAt: Date | null;
  isActive: boolean;
}

export interface UserReferralData {
  userId: string;
  links: ReferralLink[];
  referredBy: string | null;
  referredByCode: string | null;
  totalReferrals: number;
  xpEarned: number;
  premiumDaysEarned: number;
  createdAt: Date;
}

// ═══════════════════════════════════════
// REFERRAL CODE GENERATION
// ═══════════════════════════════════════

/**
 * Generate a unique referral code
 * Format: DELULU-XXXXX (5 alphanumeric characters)
 */
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DELULU-${code}`;
};

/**
 * Generate unique ID for referral link
 */
const generateLinkId = (): string => {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ═══════════════════════════════════════
// REFERRAL OPERATIONS
// ═══════════════════════════════════════

/**
 * Initialize referral data for a new user
 * Creates 5 exclusive invite links
 */
export const initializeUserReferrals = async (userId: string): Promise<UserReferralData> => {
  const referralRef = doc(db, 'referrals', userId);
  const existingDoc = await getDoc(referralRef);

  if (existingDoc.exists()) {
    const data = existingDoc.data();
    return {
      ...data,
      links: data.links.map((l: any) => ({
        ...l,
        createdAt: l.createdAt?.toDate() || new Date(),
        usedAt: l.usedAt?.toDate() || null,
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as UserReferralData;
  }

  // Create 5 unique referral links
  const links: ReferralLink[] = [];
  const usedCodes = new Set<string>();

  for (let i = 0; i < DEFAULT_SYSTEM_CONFIG.referralConfig.linksPerUser; i++) {
    let code = generateReferralCode();
    // Ensure unique codes
    while (usedCodes.has(code)) {
      code = generateReferralCode();
    }
    usedCodes.add(code);

    links.push({
      id: generateLinkId(),
      code,
      createdAt: new Date(),
      usedBy: null,
      usedAt: null,
      isActive: true,
    });
  }

  const referralData: UserReferralData = {
    userId,
    links,
    referredBy: null,
    referredByCode: null,
    totalReferrals: 0,
    xpEarned: 0,
    premiumDaysEarned: 0,
    createdAt: new Date(),
  };

  await setDoc(referralRef, {
    ...referralData,
    links: links.map(l => ({
      ...l,
      createdAt: Timestamp.fromDate(l.createdAt),
    })),
    createdAt: Timestamp.fromDate(referralData.createdAt),
  });

  return referralData;
};

/**
 * Get user's referral data
 */
export const getUserReferrals = async (userId: string): Promise<UserReferralData | null> => {
  const referralRef = doc(db, 'referrals', userId);
  const docSnap = await getDoc(referralRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    links: data.links.map((l: any) => ({
      ...l,
      createdAt: l.createdAt?.toDate() || new Date(),
      usedAt: l.usedAt?.toDate() || null,
    })),
    createdAt: data.createdAt?.toDate() || new Date(),
  } as UserReferralData;
};

/**
 * Find referral link by code
 */
export const findReferralByCode = async (code: string): Promise<{
  ownerId: string;
  link: ReferralLink;
} | null> => {
  const normalizedCode = code.toUpperCase().trim();

  // Query all referrals to find the code
  const referralsRef = collection(db, 'referrals');
  const querySnapshot = await getDocs(referralsRef);

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const links = data.links || [];

    const matchingLink = links.find((l: any) =>
      l.code === normalizedCode && l.isActive && !l.usedBy
    );

    if (matchingLink) {
      return {
        ownerId: docSnap.id,
        link: {
          ...matchingLink,
          createdAt: matchingLink.createdAt?.toDate() || new Date(),
          usedAt: matchingLink.usedAt?.toDate() || null,
        },
      };
    }
  }

  return null;
};

/**
 * Use a referral code (called when new user registers with code)
 */
export const useReferralCode = async (
  code: string,
  newUserId: string,
  newUsername: string
): Promise<{
  success: boolean;
  referrerId?: string;
  xpAwarded?: number;
  premiumDaysAwarded?: number;
  error?: string;
}> => {
  try {
    const referral = await findReferralByCode(code);

    if (!referral) {
      return { success: false, error: 'Ungültiger oder bereits verwendeter Code' };
    }

    if (referral.ownerId === newUserId) {
      return { success: false, error: 'Du kannst deinen eigenen Code nicht verwenden' };
    }

    const referrerRef = doc(db, 'referrals', referral.ownerId);
    const referrerDoc = await getDoc(referrerRef);

    if (!referrerDoc.exists()) {
      return { success: false, error: 'Referrer nicht gefunden' };
    }

    const referrerData = referrerDoc.data();
    const config = DEFAULT_SYSTEM_CONFIG.referralConfig;

    // Update the link as used
    const updatedLinks = referrerData.links.map((l: any) => {
      if (l.code === code.toUpperCase().trim()) {
        return {
          ...l,
          usedBy: newUserId,
          usedAt: Timestamp.fromDate(new Date()),
          isActive: false,
        };
      }
      return l;
    });

    // Update referrer's data
    await updateDoc(referrerRef, {
      links: updatedLinks,
      totalReferrals: increment(1),
      xpEarned: increment(config.xpPerReferral),
      premiumDaysEarned: increment(config.premiumDaysPerReferral),
    });

    // Update referrer's user document with XP
    const referrerUserRef = doc(db, 'users', referral.ownerId);
    await updateDoc(referrerUserRef, {
      xp: increment(config.xpPerReferral),
      referralCount: increment(1),
    });

    // Set up the new user's referral data
    const newUserRef = doc(db, 'referrals', newUserId);
    await initializeUserReferrals(newUserId);
    await updateDoc(newUserRef, {
      referredBy: referral.ownerId,
      referredByCode: code.toUpperCase().trim(),
    });

    // Give new user bonus XP for using a referral
    const newUserDocRef = doc(db, 'users', newUserId);
    await updateDoc(newUserDocRef, {
      xp: increment(config.xpPerReferral / 2), // Half XP for the new user
    });

    return {
      success: true,
      referrerId: referral.ownerId,
      xpAwarded: config.xpPerReferral,
      premiumDaysAwarded: config.premiumDaysPerReferral,
    };
  } catch (error) {
    return { success: false, error: 'Fehler beim Einlösen des Codes' };
  }
};

/**
 * Get referral statistics for a user
 */
export const getReferralStats = async (userId: string): Promise<{
  totalLinks: number;
  usedLinks: number;
  availableLinks: number;
  totalReferrals: number;
  xpEarned: number;
  premiumDaysEarned: number;
}> => {
  const referralData = await getUserReferrals(userId);

  if (!referralData) {
    return {
      totalLinks: 0,
      usedLinks: 0,
      availableLinks: 0,
      totalReferrals: 0,
      xpEarned: 0,
      premiumDaysEarned: 0,
    };
  }

  const usedLinks = referralData.links.filter(l => l.usedBy !== null).length;
  const availableLinks = referralData.links.filter(l => l.isActive && !l.usedBy).length;

  return {
    totalLinks: referralData.links.length,
    usedLinks,
    availableLinks,
    totalReferrals: referralData.totalReferrals,
    xpEarned: referralData.xpEarned,
    premiumDaysEarned: referralData.premiumDaysEarned,
  };
};

/**
 * Generate shareable referral URL
 */
export const getReferralUrl = (code: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/register?ref=${encodeURIComponent(code)}`;
};

/**
 * Copy referral link to clipboard
 */
export const copyReferralLink = async (code: string): Promise<boolean> => {
  try {
    const url = getReferralUrl(code);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Share referral link via Web Share API
 */
export const shareReferralLink = async (code: string, username: string): Promise<boolean> => {
  const url = getReferralUrl(code);
  const shareData = {
    title: 'Komm zu delulu! 🌟',
    text: `${username} lädt dich zu delulu ein - dem hyperlocal Community Network! Nutze meinen exklusiven Einladungslink:`,
    url,
  };

  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
    // Fallback to clipboard
    return await copyReferralLink(code);
  } catch (error) {
    return false;
  }
};

export default {
  initializeUserReferrals,
  getUserReferrals,
  findReferralByCode,
  useReferralCode,
  getReferralStats,
  getReferralUrl,
  copyReferralLink,
  shareReferralLink,
};
