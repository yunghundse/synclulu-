/**
 * Premium Access System - Global Logic Layer
 *
 * Centralized premium check with hidden Founder Ghost-Premium
 * The Founder has all premium perks but stays "undercover"
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { FOUNDER_ID, POWER_LEVELS, UserRole } from './founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserPremiumData {
  uid: string;
  role?: UserRole;
  isPremium?: boolean;
  premiumUntil?: Date | null;
}

export interface PremiumCheckResult {
  hasPremium: boolean;
  isFounderGhost: boolean;
  tier: 'none' | 'premium' | 'founder_ghost';
  features: PremiumFeatures;
}

export interface PremiumFeatures {
  extendedRadar: boolean;        // 10km statt 5km
  hdAudioQuality: boolean;       // 320kbps statt 128kbps
  unlimitedStars: boolean;       // Keine Stern-Limits
  priorityMatching: boolean;     // Bevorzugte Anzeige
  customBadges: boolean;         // Eigene Badges
  invisibleMode: boolean;        // Unsichtbar im Radar
  analyticsAccess: boolean;      // Profilbesucher sehen
  voicePriority: boolean;        // VoIP Priorität
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL PREMIUM CHECK - THE CORE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Primary premium check function
 * Includes hidden Founder Ghost-Premium logic
 *
 * @param user - User data object or userId string
 * @returns boolean - true if user has premium access
 */
export function isPremiumUser(user: UserPremiumData | string | null): boolean {
  if (!user) return false;

  // If string, assume it's userId - check for founder
  if (typeof user === 'string') {
    return user === FOUNDER_ID;
  }

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ FOUNDER GHOST-PREMIUM - Hidden Godmode                               ║
  // ║ Founder always returns true, but stays undercover                    ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  if (user.uid === FOUNDER_ID || user.role === 'founder') {
    return true;
  }

  // Admin/Moderator get premium perks
  if (user.role && POWER_LEVELS[user.role] >= POWER_LEVELS.admin) {
    return true;
  }

  // Check explicit premium status
  if (user.isPremium === true) {
    return true;
  }

  // Check premium expiration
  if (user.premiumUntil) {
    const expDate = user.premiumUntil instanceof Date
      ? user.premiumUntil
      : new Date(user.premiumUntil);
    return expDate > new Date();
  }

  return false;
}

/**
 * Extended premium check with detailed result
 */
export function checkPremiumAccess(user: UserPremiumData | null): PremiumCheckResult {
  if (!user) {
    return {
      hasPremium: false,
      isFounderGhost: false,
      tier: 'none',
      features: getDefaultFeatures()
    };
  }

  // Founder Ghost-Premium
  const isFounder = user.uid === FOUNDER_ID || user.role === 'founder';
  if (isFounder) {
    return {
      hasPremium: true,
      isFounderGhost: true,
      tier: 'founder_ghost',
      features: getFounderFeatures()
    };
  }

  // Regular premium check
  const hasPremium = isPremiumUser(user);

  return {
    hasPremium,
    isFounderGhost: false,
    tier: hasPremium ? 'premium' : 'none',
    features: hasPremium ? getPremiumFeatures() : getDefaultFeatures()
  };
}

/**
 * Async premium check from database
 */
export async function checkPremiumFromDB(userId: string): Promise<PremiumCheckResult> {
  // Quick founder check
  if (userId === FOUNDER_ID) {
    return {
      hasPremium: true,
      isFounderGhost: true,
      tier: 'founder_ghost',
      features: getFounderFeatures()
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return {
        hasPremium: false,
        isFounderGhost: false,
        tier: 'none',
        features: getDefaultFeatures()
      };
    }

    const data = userDoc.data();
    return checkPremiumAccess({
      uid: userId,
      role: data.role,
      isPremium: data.isPremium,
      premiumUntil: data.premiumUntil?.toDate()
    });
  } catch (error) {
    console.error('Error checking premium from DB:', error);
    return {
      hasPremium: false,
      isFounderGhost: false,
      tier: 'none',
      features: getDefaultFeatures()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE SETS
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultFeatures(): PremiumFeatures {
  return {
    extendedRadar: false,
    hdAudioQuality: false,
    unlimitedStars: false,
    priorityMatching: false,
    customBadges: false,
    invisibleMode: false,
    analyticsAccess: false,
    voicePriority: false
  };
}

function getPremiumFeatures(): PremiumFeatures {
  return {
    extendedRadar: true,
    hdAudioQuality: true,
    unlimitedStars: true,
    priorityMatching: true,
    customBadges: true,
    invisibleMode: true,
    analyticsAccess: true,
    voicePriority: true
  };
}

function getFounderFeatures(): PremiumFeatures {
  // Founder gets ALL features (same as premium, but hidden)
  return {
    extendedRadar: true,
    hdAudioQuality: true,
    unlimitedStars: true,
    priorityMatching: true,
    customBadges: true,
    invisibleMode: true,
    analyticsAccess: true,
    voicePriority: true
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIFIC FEATURE CHECKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get radar range in meters
 */
export function getRadarRange(user: UserPremiumData | null): number {
  const DEFAULT_RANGE = 5000;   // 5km
  const PREMIUM_RANGE = 10000;  // 10km
  const FOUNDER_RANGE = 50000;  // 50km (God-range)

  if (!user) return DEFAULT_RANGE;

  if (user.uid === FOUNDER_ID || user.role === 'founder') {
    return FOUNDER_RANGE;
  }

  return isPremiumUser(user) ? PREMIUM_RANGE : DEFAULT_RANGE;
}

/**
 * Get audio bitrate
 */
export function getAudioBitrate(user: UserPremiumData | null): number {
  const DEFAULT_BITRATE = 128;  // 128kbps
  const PREMIUM_BITRATE = 320;  // 320kbps

  if (!user) return DEFAULT_BITRATE;

  return isPremiumUser(user) ? PREMIUM_BITRATE : DEFAULT_BITRATE;
}

/**
 * Check if user should show premium badge publicly
 * Founder stays undercover!
 */
export function shouldShowPremiumBadge(user: UserPremiumData | null): boolean {
  if (!user) return false;

  // Founder Ghost-Premium: NO badge shown publicly
  if (user.uid === FOUNDER_ID || user.role === 'founder') {
    return false;  // Undercover mode
  }

  return isPremiumUser(user);
}

/**
 * Get display tier for UI (respects Ghost mode)
 */
export function getDisplayTier(user: UserPremiumData | null): 'user' | 'premium' {
  if (!user) return 'user';

  // Founder appears as regular user publicly
  if (user.uid === FOUNDER_ID || user.role === 'founder') {
    return 'user';  // Undercover
  }

  return isPremiumUser(user) ? 'premium' : 'user';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { FOUNDER_ID };
