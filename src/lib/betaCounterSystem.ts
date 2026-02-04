/**
 * synclulu BETA COUNTER SYSTEM
 * FOMO-Engine mit Live-Countdown der Beta-Plätze
 */

import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  Timestamp, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const BETA_CONFIG = {
  maxSlots: 200,
  reservedSlots: 10, // Reserved for team/special invites
  warningThreshold: 50, // Show urgency when < 50 slots
  criticalThreshold: 20, // Extra urgency when < 20 slots
  documentId: 'beta_counter_v1',
};

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface BetaCounter {
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  waitlistCount: number;
  lastRegistration: Date | null;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  username?: string;
  referralCode?: string;
  joinedAt: Date;
  position: number;
  notified: boolean;
}

// ═══════════════════════════════════════
// BETA COUNTER FUNCTIONS
// ═══════════════════════════════════════

/**
 * Initialize beta counter (run once)
 */
export const initializeBetaCounter = async (): Promise<BetaCounter> => {
  const counterRef = doc(db, 'system', BETA_CONFIG.documentId);
  const counterDoc = await getDoc(counterRef);

  if (counterDoc.exists()) {
    const data = counterDoc.data();
    return {
      ...data,
      lastRegistration: data.lastRegistration?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as BetaCounter;
  }

  const counter: BetaCounter = {
    totalSlots: BETA_CONFIG.maxSlots,
    usedSlots: 0,
    availableSlots: BETA_CONFIG.maxSlots,
    waitlistCount: 0,
    lastRegistration: null,
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(counterRef, {
    ...counter,
    createdAt: Timestamp.fromDate(counter.createdAt),
    updatedAt: Timestamp.fromDate(counter.updatedAt),
  });

  return counter;
};

/**
 * Get current beta counter state
 */
export const getBetaCounter = async (): Promise<BetaCounter> => {
  try {
    const counterRef = doc(db, 'system', BETA_CONFIG.documentId);
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      return initializeBetaCounter();
    }

    const data = counterDoc.data();
    return {
      totalSlots: data.totalSlots || BETA_CONFIG.maxSlots,
      usedSlots: data.usedSlots || 0,
      availableSlots: data.availableSlots || BETA_CONFIG.maxSlots,
      waitlistCount: data.waitlistCount || 0,
      lastRegistration: data.lastRegistration?.toDate() || null,
      isOpen: data.isOpen !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting beta counter:', error);
    return {
      totalSlots: BETA_CONFIG.maxSlots,
      usedSlots: 0,
      availableSlots: BETA_CONFIG.maxSlots,
      waitlistCount: 0,
      lastRegistration: null,
      isOpen: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * Claim a beta slot (atomic transaction)
 */
export const claimBetaSlot = async (): Promise<{
  success: boolean;
  slotsRemaining: number;
  position?: number;
  error?: string;
}> => {
  try {
    const counterRef = doc(db, 'system', BETA_CONFIG.documentId);

    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists()) {
        throw new Error('Beta counter not initialized');
      }

      const data = counterDoc.data();
      const availableSlots = data.availableSlots || 0;

      if (availableSlots <= 0) {
        return { success: false, slotsRemaining: 0, needsWaitlist: true };
      }

      const newUsedSlots = (data.usedSlots || 0) + 1;
      const newAvailableSlots = availableSlots - 1;

      transaction.update(counterRef, {
        usedSlots: newUsedSlots,
        availableSlots: newAvailableSlots,
        lastRegistration: Timestamp.fromDate(new Date()),
        isOpen: newAvailableSlots > 0,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return {
        success: true,
        slotsRemaining: newAvailableSlots,
        position: newUsedSlots,
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error claiming beta slot:', error);
    return {
      success: false,
      slotsRemaining: 0,
      error: error.message || 'Fehler beim Registrieren',
    };
  }
};

/**
 * Subscribe to beta counter updates (real-time)
 */
export const subscribeToBetaCounter = (
  callback: (counter: BetaCounter) => void
): (() => void) => {
  const counterRef = doc(db, 'system', BETA_CONFIG.documentId);

  const defaultCounter: BetaCounter = {
    totalSlots: BETA_CONFIG.maxSlots,
    usedSlots: 0,
    availableSlots: BETA_CONFIG.maxSlots,
    waitlistCount: 0,
    lastRegistration: null,
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return onSnapshot(
    counterRef,
    (doc) => {
      if (!doc.exists()) {
        callback(defaultCounter);
        return;
      }

      const data = doc.data();
      callback({
        totalSlots: data.totalSlots || BETA_CONFIG.maxSlots,
        usedSlots: data.usedSlots || 0,
        availableSlots: data.availableSlots || BETA_CONFIG.maxSlots,
        waitlistCount: data.waitlistCount || 0,
        lastRegistration: data.lastRegistration?.toDate() || null,
        isOpen: data.isOpen !== false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    },
    (error) => {
      // Permission denied or other error - use defaults so app doesn't hang
      console.warn('Beta counter listener error, using defaults:', error.message);
      callback(defaultCounter);
    }
  );
};

// ═══════════════════════════════════════
// WAITLIST FUNCTIONS
// ═══════════════════════════════════════

/**
 * Join the waitlist
 */
export const joinWaitlist = async (
  email: string,
  username?: string,
  referralCode?: string
): Promise<{ success: boolean; position: number; error?: string }> => {
  try {
    // Check if already on waitlist
    const existingDoc = await getDoc(doc(db, 'waitlist', email));
    if (existingDoc.exists()) {
      return {
        success: true,
        position: existingDoc.data().position,
      };
    }

    // Get current waitlist count
    const counter = await getBetaCounter();
    const position = counter.waitlistCount + 1;

    // Add to waitlist
    await setDoc(doc(db, 'waitlist', email), {
      email,
      username: username || null,
      referralCode: referralCode || null,
      joinedAt: Timestamp.fromDate(new Date()),
      position,
      notified: false,
    });

    // Update counter
    const counterRef = doc(db, 'system', BETA_CONFIG.documentId);
    await updateDoc(counterRef, {
      waitlistCount: position,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return { success: true, position };
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    return {
      success: false,
      position: 0,
      error: error.message || 'Fehler beim Eintragen',
    };
  }
};

/**
 * Check waitlist position
 */
export const getWaitlistPosition = async (email: string): Promise<number | null> => {
  try {
    const entryDoc = await getDoc(doc(db, 'waitlist', email));
    if (!entryDoc.exists()) return null;
    return entryDoc.data().position;
  } catch (error) {
    console.error('Error getting waitlist position:', error);
    return null;
  }
};

// ═══════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════

/**
 * Get urgency level based on remaining slots
 */
export const getUrgencyLevel = (availableSlots: number): 'none' | 'warning' | 'critical' | 'closed' => {
  if (availableSlots <= 0) return 'closed';
  if (availableSlots <= BETA_CONFIG.criticalThreshold) return 'critical';
  if (availableSlots <= BETA_CONFIG.warningThreshold) return 'warning';
  return 'none';
};

/**
 * Get urgency message
 */
export const getUrgencyMessage = (availableSlots: number): string => {
  const urgency = getUrgencyLevel(availableSlots);

  switch (urgency) {
    case 'closed':
      return 'Die Beta ist voll! Tritt der Warteliste bei.';
    case 'critical':
      return `🔥 Nur noch ${availableSlots} Plätze! Die Magie endet bald.`;
    case 'warning':
      return `⚡ Nur noch ${availableSlots} von ${BETA_CONFIG.maxSlots} Beta-Plätzen!`;
    default:
      return `Nur noch ${availableSlots} von ${BETA_CONFIG.maxSlots} Beta-Plätzen verfügbar.`;
  }
};

/**
 * Get urgency color
 */
export const getUrgencyColor = (availableSlots: number): string => {
  const urgency = getUrgencyLevel(availableSlots);

  switch (urgency) {
    case 'closed':
      return '#9CA3AF';
    case 'critical':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    default:
      return '#A78BFA';
  }
};

/**
 * Get animated counter text
 */
export const getCounterDisplayText = (availableSlots: number): {
  number: string;
  suffix: string;
  prefix: string;
} => {
  if (availableSlots <= 0) {
    return { prefix: '', number: '0', suffix: 'Plätze – Warteliste aktiv' };
  }

  return {
    prefix: 'Nur noch',
    number: availableSlots.toString(),
    suffix: `von ${BETA_CONFIG.maxSlots} Beta-Plätzen`,
  };
};

export default {
  BETA_CONFIG,
  initializeBetaCounter,
  getBetaCounter,
  claimBetaSlot,
  subscribeToBetaCounter,
  joinWaitlist,
  getWaitlistPosition,
  getUrgencyLevel,
  getUrgencyMessage,
  getUrgencyColor,
  getCounterDisplayText,
};
