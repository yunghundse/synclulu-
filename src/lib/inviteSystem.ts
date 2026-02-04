/**
 * synclulu INVITE SYSTEM v2.0
 * "The FOMO Logic"
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────┐
 * │  User visits /join/:code            │
 * │          ↓                          │
 * │  validateInviteCode(code)           │
 * │          ↓                          │
 * │  ┌─────────┴─────────┐              │
 * │  │ VALID             │ INVALID      │
 * │  ↓                   ↓              │
 * │  Unlock Register     Waitlist       │
 * │          ↓                          │
 * │  On Success: Link referrer          │
 * └─────────────────────────────────────┘
 *
 * @design Clubhouse Exclusivity
 * @version 2.0.0
 */

import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, query, where, getDocs, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface InviteCode {
  code: string;
  creatorId: string;
  creatorName: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  type: 'personal' | 'promo' | 'unlimited';
}

export interface InviteValidation {
  isValid: boolean;
  code?: InviteCode;
  error?: 'INVALID' | 'EXPIRED' | 'USED_UP' | 'DEACTIVATED';
  message?: string;
}

export interface WaitlistEntry {
  email: string;
  name?: string;
  joinedAt: Timestamp;
  status: 'waiting' | 'invited' | 'registered';
  position: number;
  referralSource?: string;
}

// ═══════════════════════════════════════
// CORE VALIDATION
// ═══════════════════════════════════════

/**
 * Validates an invite code
 * Returns validation result with detailed error info
 */
export const validateInviteCode = async (code: string): Promise<InviteValidation> => {
  if (!code || code.trim().length === 0) {
    return {
      isValid: false,
      error: 'INVALID',
      message: 'Kein Einladungscode angegeben',
    };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    // Check invite_codes collection
    const codeDoc = await getDoc(doc(db, 'invite_codes', normalizedCode));

    if (!codeDoc.exists()) {
      // Try searching by code field (for legacy codes)
      const codesQuery = query(
        collection(db, 'invite_codes'),
        where('code', '==', normalizedCode)
      );
      const querySnap = await getDocs(codesQuery);

      if (querySnap.empty) {
        return {
          isValid: false,
          error: 'INVALID',
          message: 'Dieser Code existiert nicht',
        };
      }

      // Use first match
      const docData = querySnap.docs[0].data() as InviteCode;
      return validateCodeData(docData);
    }

    const codeData = codeDoc.data() as InviteCode;
    return validateCodeData(codeData);

  } catch (error) {
    console.error('[InviteSystem] Validation error:', error);
    return {
      isValid: false,
      error: 'INVALID',
      message: 'Fehler bei der Validierung',
    };
  }
};

/**
 * Internal: Validate code data object
 */
const validateCodeData = (code: InviteCode): InviteValidation => {
  // Check if active
  if (!code.isActive) {
    return {
      isValid: false,
      code,
      error: 'DEACTIVATED',
      message: 'Dieser Code wurde deaktiviert',
    };
  }

  // Check expiration
  if (code.expiresAt && code.expiresAt.toDate() < new Date()) {
    return {
      isValid: false,
      code,
      error: 'EXPIRED',
      message: 'Dieser Code ist abgelaufen',
    };
  }

  // Check usage limit (skip for unlimited type)
  if (code.type !== 'unlimited' && code.usedCount >= code.maxUses) {
    return {
      isValid: false,
      code,
      error: 'USED_UP',
      message: 'Dieser Code wurde bereits vollständig eingelöst',
    };
  }

  return {
    isValid: true,
    code,
  };
};

// ═══════════════════════════════════════
// REGISTRATION FLOW
// ═══════════════════════════════════════

/**
 * Use an invite code after successful registration
 * Links the new user to their referrer
 */
export const useInviteCode = async (
  code: string,
  newUserId: string,
  newUserName: string
): Promise<boolean> => {
  const normalizedCode = code.trim().toUpperCase();

  try {
    // Get the code
    const codeDoc = await getDoc(doc(db, 'invite_codes', normalizedCode));
    if (!codeDoc.exists()) return false;

    const codeData = codeDoc.data() as InviteCode;

    // Increment usage count
    await updateDoc(doc(db, 'invite_codes', normalizedCode), {
      usedCount: increment(1),
    });

    // Create referral record
    await setDoc(doc(db, 'referrals', `${codeData.creatorId}_${newUserId}`), {
      referrerId: codeData.creatorId,
      referrerName: codeData.creatorName,
      referredId: newUserId,
      referredName: newUserName,
      inviteCode: normalizedCode,
      status: 'registered',
      createdAt: serverTimestamp(),
      registeredAt: serverTimestamp(),
    });

    // Update referrer stats
    await updateDoc(doc(db, 'users', codeData.creatorId), {
      referralCount: increment(1),
      'stats.totalReferrals': increment(1),
    });

    // Award premium days to referrer (7 days per referral)
    const referrerDoc = await getDoc(doc(db, 'users', codeData.creatorId));
    if (referrerDoc.exists()) {
      const currentPremiumEnd = referrerDoc.data().premiumEndsAt?.toDate() || new Date();
      const newPremiumEnd = new Date(Math.max(currentPremiumEnd.getTime(), Date.now()));
      newPremiumEnd.setDate(newPremiumEnd.getDate() + 7);

      await updateDoc(doc(db, 'users', codeData.creatorId), {
        isPremium: true,
        premiumEndsAt: Timestamp.fromDate(newPremiumEnd),
      });
    }

    console.log('[InviteSystem] Code used successfully:', {
      code: normalizedCode,
      newUser: newUserId,
      referrer: codeData.creatorId,
    });

    return true;
  } catch (error) {
    console.error('[InviteSystem] Use code error:', error);
    return false;
  }
};

// ═══════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════

/**
 * Generate a new invite code for a user
 */
export const generateInviteCode = async (
  userId: string,
  userName: string,
  options?: {
    maxUses?: number;
    expiresInDays?: number;
    type?: 'personal' | 'promo';
  }
): Promise<string | null> => {
  try {
    // Generate unique code
    const codePrefix = 'synclulu';
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${codePrefix}-${randomPart}`;

    const codeData: InviteCode = {
      code,
      creatorId: userId,
      creatorName: userName,
      maxUses: options?.maxUses ?? 5,
      usedCount: 0,
      isActive: true,
      type: options?.type ?? 'personal',
      createdAt: Timestamp.now(),
    };

    if (options?.expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
      codeData.expiresAt = Timestamp.fromDate(expiresAt);
    }

    await setDoc(doc(db, 'invite_codes', code), codeData);

    // Update user's referral code
    await updateDoc(doc(db, 'users', userId), {
      referralCode: code,
    });

    return code;
  } catch (error) {
    console.error('[InviteSystem] Generate code error:', error);
    return null;
  }
};

// ═══════════════════════════════════════
// WAITLIST SYSTEM
// ═══════════════════════════════════════

/**
 * Add user to waitlist
 */
export const joinWaitlist = async (
  email: string,
  name?: string,
  referralSource?: string
): Promise<{ success: boolean; position?: number; error?: string }> => {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Ungültige E-Mail-Adresse' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if already on waitlist
    const existingQuery = query(
      collection(db, 'waitlist'),
      where('email', '==', normalizedEmail)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0].data();
      return {
        success: true,
        position: existing.position,
      };
    }

    // Get current waitlist count for position
    const countQuery = query(collection(db, 'waitlist'));
    const countSnap = await getDocs(countQuery);
    const position = countSnap.size + 1;

    // Add to waitlist
    await setDoc(doc(db, 'waitlist', normalizedEmail), {
      email: normalizedEmail,
      name: name || null,
      joinedAt: serverTimestamp(),
      status: 'waiting',
      position,
      referralSource: referralSource || null,
    });

    return { success: true, position };
  } catch (error) {
    console.error('[InviteSystem] Waitlist error:', error);
    return { success: false, error: 'Fehler beim Beitreten zur Warteliste' };
  }
};

/**
 * Get waitlist position for email
 */
export const getWaitlistPosition = async (email: string): Promise<number | null> => {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const docRef = await getDoc(doc(db, 'waitlist', normalizedEmail));
    if (docRef.exists()) {
      return docRef.data().position;
    }
    return null;
  } catch (error) {
    console.error('[InviteSystem] Get position error:', error);
    return null;
  }
};

// ═══════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════

/**
 * Extract invite code from URL
 */
export const extractCodeFromURL = (): string | null => {
  const path = window.location.pathname;
  const joinMatch = path.match(/\/join\/([A-Za-z0-9-]+)/);
  if (joinMatch) return joinMatch[1];

  const params = new URLSearchParams(window.location.search);
  return params.get('code') || params.get('invite') || params.get('ref');
};

/**
 * Store invite code in session for registration flow
 */
export const storeInviteCode = (code: string) => {
  sessionStorage.setItem('synclulu_invite_code', code.toUpperCase());
};

/**
 * Get stored invite code
 */
export const getStoredInviteCode = (): string | null => {
  return sessionStorage.getItem('synclulu_invite_code');
};

/**
 * Clear stored invite code
 */
export const clearStoredInviteCode = () => {
  sessionStorage.removeItem('synclulu_invite_code');
};
