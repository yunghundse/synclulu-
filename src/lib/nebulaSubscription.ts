/**
 * NEBULA SUBSCRIPTION SYSTEM - The Tier Matrix
 *
 * Three-tier monetization with Eternal Founder Bypass
 * Standard (Free) → Premium (Nebula) → Sovereign (Founder/Admin)
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FOUNDER_ID, POWER_LEVELS, UserRole } from './founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// TIER CONFIGURATION - THE MATRIX
// ═══════════════════════════════════════════════════════════════════════════

export const TIER_CONFIG = {
  FREE: {
    name: 'Standard',
    level: 'FREE',
    starRadius: 5000,           // 5 km
    voiceCloudLimit: 1,         // 1 gleichzeitig
    dailyStars: 3,              // 3 Sterne pro Tag
    audioBitrate: 96,           // 96 kbps
    canGhostMode: false,
    canInvisible: false,
    badge: null,
    color: '#6B7280'
  },
  PREMIUM: {
    name: 'Nebula',
    level: 'PREMIUM',
    starRadius: 15000,          // 15 km (Elastic Max)
    voiceCloudLimit: 999,       // Unbegrenzt
    dailyStars: 10,             // 10 Sterne pro Tag
    audioBitrate: 256,          // 256 kbps (Crystal)
    canGhostMode: true,
    canInvisible: true,
    badge: 'nebula',
    color: '#A78BFA',
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)'
  },
  SOVEREIGN: {
    name: 'Sovereign',
    level: 'SOVEREIGN',
    starRadius: 100000,         // 100 km (Global Override)
    voiceCloudLimit: 999,       // Unbegrenzt
    dailyStars: 999999,         // ∞ Infinite
    audioBitrate: 256,          // 256 kbps (Crystal)
    canGhostMode: true,
    canInvisible: true,
    badge: 'founder',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #9333EA 100%)'
  }
} as const;

export type TierLevel = keyof typeof TIER_CONFIG;

// ═══════════════════════════════════════════════════════════════════════════
// ACCESS LEVEL TYPE
// ═══════════════════════════════════════════════════════════════════════════

export interface AccessLevel {
  level: TierLevel;
  name: string;
  stars: number;
  radius: number;
  audioBitrate: number;
  voiceCloudLimit: number;
  canGhostMode: boolean;
  canInvisible: boolean;
  badge: string | null;
  isFounder: boolean;
  isPremium: boolean;
  subscriptionEnd: Date | null;
}

export interface UserSubscriptionData {
  uid: string;
  role?: UserRole;
  subscription?: 'free' | 'nebula_active' | 'nebula_expired';
  subscriptionEnd?: Date | null;
  isPremium?: boolean;
  premiumUntil?: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE MIDDLEWARE: getAccessLevel
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The Ultimate Authorization Check
 * Returns the user's access level with all permissions
 */
export function getAccessLevel(user: UserSubscriptionData | null): AccessLevel {
  // Null user = FREE tier
  if (!user) {
    return {
      level: 'FREE',
      name: TIER_CONFIG.FREE.name,
      stars: TIER_CONFIG.FREE.dailyStars,
      radius: TIER_CONFIG.FREE.starRadius,
      audioBitrate: TIER_CONFIG.FREE.audioBitrate,
      voiceCloudLimit: TIER_CONFIG.FREE.voiceCloudLimit,
      canGhostMode: TIER_CONFIG.FREE.canGhostMode,
      canInvisible: TIER_CONFIG.FREE.canInvisible,
      badge: TIER_CONFIG.FREE.badge,
      isFounder: false,
      isPremium: false,
      subscriptionEnd: null
    };
  }

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ 1. FOUNDER-CHECK: ABSOLUTE MACHT                                     ║
  // ║ Der Founder steht über dem System - Eternal Premium                  ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  if (user.role === 'founder' || user.uid === FOUNDER_ID) {
    return {
      level: 'SOVEREIGN',
      name: TIER_CONFIG.SOVEREIGN.name,
      stars: TIER_CONFIG.SOVEREIGN.dailyStars,      // 999999 (∞)
      radius: TIER_CONFIG.SOVEREIGN.starRadius,      // 100 km
      audioBitrate: TIER_CONFIG.SOVEREIGN.audioBitrate,
      voiceCloudLimit: TIER_CONFIG.SOVEREIGN.voiceCloudLimit,
      canGhostMode: true,
      canInvisible: true,
      badge: 'founder',  // Ghost Mode: Badge only visible to founder
      isFounder: true,
      isPremium: true,
      subscriptionEnd: new Date('2099-12-31T23:59:59Z')  // Eternal
    };
  }

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ 2. ADMIN-CHECK: SOVEREIGN ACCESS                                     ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  if (user.role === 'admin') {
    return {
      level: 'SOVEREIGN',
      name: 'Admin',
      stars: TIER_CONFIG.SOVEREIGN.dailyStars,
      radius: TIER_CONFIG.SOVEREIGN.starRadius,
      audioBitrate: TIER_CONFIG.SOVEREIGN.audioBitrate,
      voiceCloudLimit: TIER_CONFIG.SOVEREIGN.voiceCloudLimit,
      canGhostMode: true,
      canInvisible: true,
      badge: 'admin',
      isFounder: false,
      isPremium: true,
      subscriptionEnd: new Date('2099-12-31T23:59:59Z')
    };
  }

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ 3. PREMIUM-CHECK: NEBULA SUBSCRIPTION                                ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  const hasActivePremium = checkPremiumActive(user);

  if (hasActivePremium) {
    return {
      level: 'PREMIUM',
      name: TIER_CONFIG.PREMIUM.name,
      stars: TIER_CONFIG.PREMIUM.dailyStars,
      radius: TIER_CONFIG.PREMIUM.starRadius,
      audioBitrate: TIER_CONFIG.PREMIUM.audioBitrate,
      voiceCloudLimit: TIER_CONFIG.PREMIUM.voiceCloudLimit,
      canGhostMode: TIER_CONFIG.PREMIUM.canGhostMode,
      canInvisible: TIER_CONFIG.PREMIUM.canInvisible,
      badge: 'nebula',
      isFounder: false,
      isPremium: true,
      subscriptionEnd: user.premiumUntil || user.subscriptionEnd || null
    };
  }

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ 4. STANDARD: FREE TIER                                               ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  return {
    level: 'FREE',
    name: TIER_CONFIG.FREE.name,
    stars: TIER_CONFIG.FREE.dailyStars,
    radius: TIER_CONFIG.FREE.starRadius,
    audioBitrate: TIER_CONFIG.FREE.audioBitrate,
    voiceCloudLimit: TIER_CONFIG.FREE.voiceCloudLimit,
    canGhostMode: TIER_CONFIG.FREE.canGhostMode,
    canInvisible: TIER_CONFIG.FREE.canInvisible,
    badge: null,
    isFounder: false,
    isPremium: false,
    subscriptionEnd: null
  };
}

/**
 * Check if premium subscription is active
 */
function checkPremiumActive(user: UserSubscriptionData): boolean {
  // Check subscription status
  if (user.subscription === 'nebula_active') {
    return true;
  }

  // Check isPremium flag
  if (user.isPremium === true) {
    // Verify expiration if exists
    if (user.premiumUntil) {
      const expDate = user.premiumUntil instanceof Date
        ? user.premiumUntil
        : new Date(user.premiumUntil);
      return expDate > new Date();
    }
    return true;
  }

  // Check subscriptionEnd
  if (user.subscriptionEnd) {
    const expDate = user.subscriptionEnd instanceof Date
      ? user.subscriptionEnd
      : new Date(user.subscriptionEnd);
    return expDate > new Date();
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

export interface SubscriptionStatus {
  isActive: boolean;
  tier: TierLevel;
  expiresAt: Date | null;
  daysRemaining: number | null;
  features: AccessLevel;
}

/**
 * Check subscription status from database
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // Quick founder check
  if (userId === FOUNDER_ID) {
    const features = getAccessLevel({ uid: userId, role: 'founder' });
    return {
      isActive: true,
      tier: 'SOVEREIGN',
      expiresAt: new Date('2099-12-31T23:59:59Z'),
      daysRemaining: null,  // Infinite
      features
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      const features = getAccessLevel(null);
      return {
        isActive: false,
        tier: 'FREE',
        expiresAt: null,
        daysRemaining: null,
        features
      };
    }

    const data = userDoc.data();
    const userData: UserSubscriptionData = {
      uid: userId,
      role: data.role,
      subscription: data.subscription,
      subscriptionEnd: data.subscriptionEnd?.toDate(),
      isPremium: data.isPremium,
      premiumUntil: data.premiumUntil?.toDate()
    };

    const features = getAccessLevel(userData);
    const expiresAt = features.subscriptionEnd;
    const daysRemaining = expiresAt
      ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      isActive: features.isPremium,
      tier: features.level,
      expiresAt,
      daysRemaining: daysRemaining && daysRemaining > 36500 ? null : daysRemaining,
      features
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    const features = getAccessLevel(null);
    return {
      isActive: false,
      tier: 'FREE',
      expiresAt: null,
      daysRemaining: null,
      features
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHORIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Global authorization check - THE ULTIMATE MIDDLEWARE
 */
export function isAuthorized(user: UserSubscriptionData | null, feature?: string): boolean {
  // Founder = Always authorized
  if (user?.role === 'founder' || user?.uid === FOUNDER_ID) {
    return true;
  }

  const access = getAccessLevel(user);

  // Feature-specific checks
  if (feature) {
    switch (feature) {
      case 'ghost_mode':
        return access.canGhostMode;
      case 'invisible_mode':
        return access.canInvisible;
      case 'extended_radius':
        return access.isPremium;
      case 'hd_audio':
        return access.isPremium;
      case 'admin_panel':
        return access.isFounder || user?.role === 'admin';
      default:
        return access.isPremium;
    }
  }

  return access.isPremium;
}

/**
 * Check if user should see upgrade prompts
 * Founder NEVER sees upgrade ads
 */
export function shouldShowUpgradePrompt(user: UserSubscriptionData | null): boolean {
  if (!user) return true;

  // Founder never sees upgrade prompts
  if (user.role === 'founder' || user.uid === FOUNDER_ID) {
    return false;
  }

  // Admins never see upgrade prompts
  if (user.role === 'admin') {
    return false;
  }

  // Premium users don't see prompts
  const access = getAccessLevel(user);
  return !access.isPremium;
}

/**
 * Get daily stars limit for user
 */
export function getDailyStarsLimit(user: UserSubscriptionData | null): number {
  const access = getAccessLevel(user);
  return access.stars;
}

/**
 * Get search radius in meters
 */
export function getSearchRadius(user: UserSubscriptionData | null): number {
  const access = getAccessLevel(user);
  return access.radius;
}

/**
 * Get audio bitrate in kbps
 */
export function getAudioBitrate(user: UserSubscriptionData | null): number {
  const access = getAccessLevel(user);
  return access.audioBitrate;
}

/**
 * Get voice cloud limit
 */
export function getVoiceCloudLimit(user: UserSubscriptionData | null): number {
  const access = getAccessLevel(user);
  return access.voiceCloudLimit;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS - GRANT/REVOKE PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Grant Nebula Premium to a user (Admin only)
 */
export async function grantNebulaPremium(
  adminId: string,
  adminRole: UserRole,
  targetUserId: string,
  durationDays: number = 30
): Promise<{ success: boolean; error?: string; expiresAt?: Date }> {
  // Check admin permission
  if (POWER_LEVELS[adminRole] < POWER_LEVELS.admin) {
    return { success: false, error: 'Keine Admin-Berechtigung' };
  }

  // Cannot modify founder
  if (targetUserId === FOUNDER_ID) {
    return { success: false, error: 'Founder hat Eternal Premium' };
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await updateDoc(doc(db, 'users', targetUserId), {
      isPremium: true,
      premiumUntil: expiresAt,
      subscription: 'nebula_active',
      subscriptionEnd: expiresAt,
      premiumGrantedBy: adminId,
      premiumGrantedAt: serverTimestamp()
    });

    return { success: true, expiresAt };
  } catch (error) {
    console.error('Error granting premium:', error);
    return { success: false, error: 'Datenbankfehler' };
  }
}

/**
 * Set user as Eternal Founder (One-time setup)
 */
export async function setEternalFounder(userId: string): Promise<boolean> {
  try {
    const eternalDate = new Date('2099-12-31T23:59:59Z');

    await updateDoc(doc(db, 'users', userId), {
      role: 'founder',
      isPremium: true,
      premiumUntil: eternalDate,
      subscription: 'nebula_active',
      subscriptionEnd: eternalDate,
      isFounder: true,
      founderSince: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error setting eternal founder:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  FOUNDER_ID,
  POWER_LEVELS
};

export default {
  TIER_CONFIG,
  getAccessLevel,
  checkSubscriptionStatus,
  isAuthorized,
  shouldShowUpgradePrompt,
  getDailyStarsLimit,
  getSearchRadius,
  getAudioBitrate,
  getVoiceCloudLimit,
  grantNebulaPremium,
  setEternalFounder
};
