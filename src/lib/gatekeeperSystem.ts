/**
 * GATEKEEPER SYSTEM - Exklusivitäts-Engine
 *
 * 10-User Hard Cap, Referral Rewards, Founder Infinite Radius
 * The Cloud is exclusive - only the chosen ones enter.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FOUNDER_ID } from './founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const GATEKEEPER_CONFIG = {
  // User Cap
  maxUsers: 10,                          // Hard cap - Die Cloud ist exklusiv
  waitlistEnabled: true,                 // Waitlist when full

  // Referral Rewards
  referralRewardStars: 5,                // Stars für Werber
  referralRewardNewUser: 5,              // Stars für Geworbenen
  referralPremiumDays: 1,                // Gratis Premium-Tage

  // Founder Settings
  founderEmail: 'jan@synclulu.app',        // Auto-founder bei dieser Email
  founderRadius: 40000000,               // 40.000 km = Global

  // Premium Radius
  premiumRadius: 15000,                  // 15 km
  standardRadius: 5000,                  // 5 km
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CapacityStatus {
  currentUsers: number;
  maxUsers: number;
  isFull: boolean;
  spotsRemaining: number;
  waitlistCount: number;
}

export interface ReferralData {
  referrerId: string;
  referrerUsername: string;
  code: string;
  usedBy: string[];
  totalRewards: number;
  createdAt: Date;
}

export interface RegistrationResult {
  success: boolean;
  userId?: string;
  error?: string;
  errorCode?: 'CAPACITY_FULL' | 'EMAIL_EXISTS' | 'INVALID_REFERRAL' | 'UNKNOWN';
  referralApplied?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPACITY GUARD - 10-User Hard Cap
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check current capacity status
 * NOTE: This function handles permission-denied errors gracefully
 * to support pre-auth checks on register page
 */
export async function checkCapacity(): Promise<CapacityStatus> {
  try {
    // Get user count from system stats
    // Note: system/stats has allow read: if true; in firestore rules
    const statsDoc = await getDoc(doc(db, 'system', 'stats'));

    let currentUsers = 0;
    let waitlistCount = 0;

    if (statsDoc.exists()) {
      currentUsers = statsDoc.data().totalUsers || 0;
      waitlistCount = statsDoc.data().waitlistCount || 0;
    }
    // Don't try to count users or create stats doc without auth
    // Just use defaults if stats don't exist

    const maxUsers = await getMaxUserCap();

    return {
      currentUsers,
      maxUsers,
      isFull: currentUsers >= maxUsers,
      spotsRemaining: Math.max(0, maxUsers - currentUsers),
      waitlistCount
    };
  } catch (error: any) {
    // Handle permission-denied gracefully - common when not authenticated
    if (error?.code === 'permission-denied') {
      console.warn('[Gatekeeper] Permission denied - using defaults (user likely not authenticated)');
    } else {
      console.error('Error checking capacity:', error);
    }
    // Fail-safe: return not full to prevent lockout
    return {
      currentUsers: 0,
      maxUsers: GATEKEEPER_CONFIG.maxUsers,
      isFull: false,
      spotsRemaining: GATEKEEPER_CONFIG.maxUsers,
      waitlistCount: 0
    };
  }
}

/**
 * Get max user cap (can be adjusted by founder)
 * Handles permission-denied gracefully for pre-auth scenarios
 */
async function getMaxUserCap(): Promise<number> {
  try {
    const configDoc = await getDoc(doc(db, 'system', 'config'));
    if (configDoc.exists() && configDoc.data().maxUsers) {
      return configDoc.data().maxUsers;
    }
  } catch (error: any) {
    // Silently use default on permission denied
    if (error?.code !== 'permission-denied') {
      console.warn('[Gatekeeper] Error getting max user cap:', error);
    }
  }
  return GATEKEEPER_CONFIG.maxUsers;
}

/**
 * Increase max user cap (Founder only)
 */
export async function increaseUserCap(
  adminId: string,
  newCap: number
): Promise<boolean> {
  // Verify founder
  if (adminId !== FOUNDER_ID) {
    const userDoc = await getDoc(doc(db, 'users', adminId));
    if (userDoc.data()?.role !== 'founder') {
      return false;
    }
  }

  try {
    await updateDoc(doc(db, 'system', 'config'), {
      maxUsers: newCap,
      maxUsersUpdatedAt: serverTimestamp(),
      maxUsersUpdatedBy: adminId
    });
    return true;
  } catch (error) {
    console.error('Error updating user cap:', error);
    return false;
  }
}

/**
 * Pre-registration validation
 */
export async function validateRegistration(): Promise<{
  canRegister: boolean;
  reason?: string;
  capacity: CapacityStatus;
}> {
  const capacity = await checkCapacity();

  if (capacity.isFull) {
    return {
      canRegister: false,
      reason: 'Die Cloud ist derzeit voll besetzt. ✨',
      capacity
    };
  }

  return {
    canRegister: true,
    capacity
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WAITLIST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add user to waitlist
 */
export async function addToWaitlist(
  email: string,
  referralCode?: string
): Promise<{ success: boolean; position: number }> {
  try {
    const waitlistId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');

    await setDoc(doc(db, 'waitlist', waitlistId), {
      email: email.toLowerCase(),
      referralCode: referralCode || null,
      joinedAt: serverTimestamp(),
      notified: false,
      converted: false
    });

    // Update waitlist count
    await updateDoc(doc(db, 'system', 'stats'), {
      waitlistCount: increment(1)
    });

    // Get position
    const waitlistSnapshot = await getDocs(
      query(collection(db, 'waitlist'), where('converted', '==', false))
    );

    return {
      success: true,
      position: waitlistSnapshot.size
    };
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return { success: false, position: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate unique referral code for user
 */
export function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code}-${userId.slice(-4).toUpperCase()}`;
}

/**
 * Create referral entry for user
 */
export async function createReferralCode(
  userId: string,
  username: string
): Promise<string> {
  const code = generateReferralCode(userId);

  await setDoc(doc(db, 'referrals', code), {
    referrerId: userId,
    referrerUsername: username,
    code,
    usedBy: [],
    totalRewards: 0,
    createdAt: serverTimestamp()
  });

  // Update user with their referral code
  await updateDoc(doc(db, 'users', userId), {
    referralCode: code,
    referralLink: `https://synclulu.app/join/${code}`
  });

  return code;
}

/**
 * Validate referral code
 * Handles permission-denied gracefully for pre-auth scenarios
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: string;
  referrerUsername?: string;
}> {
  if (!code) return { valid: false };

  try {
    const referralDoc = await getDoc(doc(db, 'referrals', code.toUpperCase()));

    if (referralDoc.exists()) {
      const data = referralDoc.data();
      return {
        valid: true,
        referrerId: data.referrerId,
        referrerUsername: data.referrerUsername
      };
    }

    return { valid: false };
  } catch (error: any) {
    // Handle permission-denied gracefully
    if (error?.code === 'permission-denied') {
      console.warn('[Gatekeeper] Permission denied validating referral - user not authenticated');
    } else {
      console.error('Error validating referral:', error);
    }
    return { valid: false };
  }
}

/**
 * Apply referral rewards after successful registration
 */
export async function applyReferralReward(
  referralCode: string,
  newUserId: string,
  newUsername: string
): Promise<boolean> {
  try {
    const referralDoc = await getDoc(doc(db, 'referrals', referralCode.toUpperCase()));

    if (!referralDoc.exists()) return false;

    const referralData = referralDoc.data();
    const referrerId = referralData.referrerId;

    // Update referral doc
    await updateDoc(doc(db, 'referrals', referralCode.toUpperCase()), {
      usedBy: [...(referralData.usedBy || []), newUserId],
      totalRewards: increment(GATEKEEPER_CONFIG.referralRewardStars)
    });

    // Reward the referrer
    await updateDoc(doc(db, 'users', referrerId), {
      nebulaStars: increment(GATEKEEPER_CONFIG.referralRewardStars),
      referralCount: increment(1),
      lastReferralAt: serverTimestamp()
    });

    // Reward the new user
    await updateDoc(doc(db, 'users', newUserId), {
      nebulaStars: increment(GATEKEEPER_CONFIG.referralRewardNewUser),
      referredBy: referrerId,
      referredByCode: referralCode
    });

    // Create notification for referrer
    await setDoc(doc(collection(db, 'notifications')), {
      userId: referrerId,
      type: 'referral_reward',
      title: '🌟 Neue Empfehlung!',
      message: `${newUsername} ist durch deinen Link beigetreten. Du erhältst ${GATEKEEPER_CONFIG.referralRewardStars} Nebula-Sterne! ✨`,
      read: false,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error applying referral reward:', error);
    return false;
  }
}

/**
 * Get referral code from URL or localStorage
 */
export function extractReferralCode(): string | null {
  // Check URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get('ref') || urlParams.get('invite');

  if (urlCode) {
    // Store in localStorage for persistence
    localStorage.setItem('synclulu_referral_code', urlCode.toUpperCase());
    return urlCode.toUpperCase();
  }

  // Check path (e.g., /join/ABC123)
  const pathMatch = window.location.pathname.match(/\/(?:join|invite)\/([A-Z0-9-]+)/i);
  if (pathMatch) {
    const code = pathMatch[1].toUpperCase();
    localStorage.setItem('synclulu_referral_code', code);
    return code;
  }

  // Check localStorage
  return localStorage.getItem('synclulu_referral_code');
}

/**
 * Clear stored referral code
 */
export function clearStoredReferralCode(): void {
  localStorage.removeItem('synclulu_referral_code');
}

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER RADIUS OVERRIDE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get search radius for user
 * Founder gets INFINITE (global) radius
 */
export function getSearchRadius(user: {
  id?: string;
  role?: string;
  isPremium?: boolean;
}): number {
  // Founder Override - Sees EVERYTHING
  if (user.id === FOUNDER_ID || user.role === 'founder') {
    return GATEKEEPER_CONFIG.founderRadius; // 40.000 km = Global
  }

  // Admin gets extended range
  if (user.role === 'admin') {
    return GATEKEEPER_CONFIG.founderRadius;
  }

  // Premium users
  if (user.isPremium || user.role === 'premium') {
    return GATEKEEPER_CONFIG.premiumRadius; // 15 km
  }

  // Standard users
  return GATEKEEPER_CONFIG.standardRadius; // 5 km
}

/**
 * Post-signup middleware for founder detection
 */
export async function postSignupFounderCheck(
  userId: string,
  email: string
): Promise<void> {
  // Check if this is the founder email
  if (email.toLowerCase() === GATEKEEPER_CONFIG.founderEmail.toLowerCase()) {
    await updateDoc(doc(db, 'users', userId), {
      role: 'founder',
      isAdmin: true,
      isPremium: true,
      premiumUntil: new Date('2099-12-31T23:59:59Z'),
      subscription: 'nebula_active',
      subscriptionEnd: new Date('2099-12-31T23:59:59Z'),
      searchRadius: GATEKEEPER_CONFIG.founderRadius,
      founderSince: serverTimestamp()
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Increment user count after successful registration
 */
export async function incrementUserCount(): Promise<void> {
  try {
    await updateDoc(doc(db, 'system', 'stats'), {
      totalUsers: increment(1),
      lastRegistrationAt: serverTimestamp()
    });
  } catch (error) {
    // Create stats doc if it doesn't exist
    await setDoc(doc(db, 'system', 'stats'), {
      totalUsers: 1,
      waitlistCount: 0,
      lastRegistrationAt: serverTimestamp()
    }, { merge: true });
  }
}

/**
 * Complete registration flow
 */
export async function completeRegistration(
  userId: string,
  email: string,
  username: string,
  referralCode?: string
): Promise<RegistrationResult> {
  try {
    // 1. Check capacity
    const validation = await validateRegistration();
    if (!validation.canRegister) {
      return {
        success: false,
        error: validation.reason,
        errorCode: 'CAPACITY_FULL'
      };
    }

    // 2. Increment user count
    await incrementUserCount();

    // 3. Check for founder
    await postSignupFounderCheck(userId, email);

    // 4. Create referral code for new user
    await createReferralCode(userId, username);

    // 5. Apply referral reward if code provided
    let referralApplied = false;
    if (referralCode) {
      const codeValid = await validateReferralCode(referralCode);
      if (codeValid.valid) {
        await applyReferralReward(referralCode, userId, username);
        referralApplied = true;
      }
    }

    // 6. Clear stored referral code
    clearStoredReferralCode();

    return {
      success: true,
      userId,
      referralApplied
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Ein unerwarteter Fehler ist aufgetreten.',
      errorCode: 'UNKNOWN'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  GATEKEEPER_CONFIG,
  checkCapacity,
  validateRegistration,
  increaseUserCap,
  addToWaitlist,
  generateReferralCode,
  createReferralCode,
  validateReferralCode,
  applyReferralReward,
  extractReferralCode,
  clearStoredReferralCode,
  getSearchRadius,
  postSignupFounderCheck,
  incrementUserCount,
  completeRegistration
};
