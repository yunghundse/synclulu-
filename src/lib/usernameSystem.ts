/**
 * synclulu USERNAME SYSTEM
 * Username change limit: 30 days between changes
 * "Solid Identity" - Your username is your brand
 */

import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { USERNAME_RULES } from '@/types';

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

// ═══════════════════════════════════════
// USERNAME VALIDATION
// ═══════════════════════════════════════

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate username format
 */
export const validateUsernameFormat = (username: string): UsernameValidationResult => {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < USERNAME_RULES.minLength) {
    return { isValid: false, error: `Mindestens ${USERNAME_RULES.minLength} Zeichen erforderlich` };
  }

  if (normalized.length > USERNAME_RULES.maxLength) {
    return { isValid: false, error: `Maximal ${USERNAME_RULES.maxLength} Zeichen erlaubt` };
  }

  if (!USERNAME_RULES.pattern.test(normalized)) {
    return { isValid: false, error: 'Nur Kleinbuchstaben, Zahlen und Unterstriche erlaubt' };
  }

  if (USERNAME_RULES.reserved.includes(normalized)) {
    return { isValid: false, error: 'Dieser Username ist reserviert' };
  }

  return { isValid: true };
};

/**
 * Check if username is available in database
 */
export const checkUsernameAvailability = async (
  username: string,
  currentUserId?: string
): Promise<{ isAvailable: boolean; error?: string }> => {
  const normalized = username.toLowerCase().trim();

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', normalized));
    const snapshot = await getDocs(q);

    // If no results, username is available
    if (snapshot.empty) {
      return { isAvailable: true };
    }

    // Check if the found user is the current user (they can keep their username)
    if (currentUserId && snapshot.docs[0].id === currentUserId) {
      return { isAvailable: true };
    }

    return { isAvailable: false, error: 'Dieser Username ist bereits vergeben' };
  } catch (error) {
    console.error('Error checking username:', error);
    return { isAvailable: false, error: 'Fehler bei der Prüfung' };
  }
};

// ═══════════════════════════════════════
// USERNAME CHANGE COOLDOWN
// ═══════════════════════════════════════

export interface UsernameChangeStatus {
  canChange: boolean;
  daysRemaining: number;
  lastChanged: Date | null;
  nextChangeDate: Date | null;
  progressPercent: number;  // 0-100 for progress bar
}

/**
 * Check if user can change their username
 */
export const getUsernameChangeStatus = async (userId: string): Promise<UsernameChangeStatus> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        canChange: true,
        daysRemaining: 0,
        lastChanged: null,
        nextChangeDate: null,
        progressPercent: 100,
      };
    }

    const data = userDoc.data();
    const lastChanged = data.usernameLastChanged?.toDate() || null;

    if (!lastChanged) {
      // Never changed - can change now
      return {
        canChange: true,
        daysRemaining: 0,
        lastChanged: null,
        nextChangeDate: null,
        progressPercent: 100,
      };
    }

    const now = new Date();
    const daysSinceChange = Math.floor(
      (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(0, USERNAME_CHANGE_COOLDOWN_DAYS - daysSinceChange);
    const progressPercent = Math.min(100, (daysSinceChange / USERNAME_CHANGE_COOLDOWN_DAYS) * 100);

    const nextChangeDate = new Date(lastChanged);
    nextChangeDate.setDate(nextChangeDate.getDate() + USERNAME_CHANGE_COOLDOWN_DAYS);

    return {
      canChange: daysRemaining === 0,
      daysRemaining,
      lastChanged,
      nextChangeDate,
      progressPercent,
    };
  } catch (error) {
    console.error('Error getting username change status:', error);
    return {
      canChange: false,
      daysRemaining: USERNAME_CHANGE_COOLDOWN_DAYS,
      lastChanged: null,
      nextChangeDate: null,
      progressPercent: 0,
    };
  }
};

/**
 * Change username (with cooldown check)
 */
export const changeUsername = async (
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate format
    const formatValidation = validateUsernameFormat(newUsername);
    if (!formatValidation.isValid) {
      return { success: false, error: formatValidation.error };
    }

    // Check cooldown
    const status = await getUsernameChangeStatus(userId);
    if (!status.canChange) {
      return {
        success: false,
        error: `Du kannst deinen Username erst in ${status.daysRemaining} Tagen ändern`,
      };
    }

    // Check availability
    const normalized = newUsername.toLowerCase().trim();
    const availability = await checkUsernameAvailability(normalized, userId);
    if (!availability.isAvailable) {
      return { success: false, error: availability.error };
    }

    // Update username
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentCount = userDoc.data()?.usernameChangeCount || 0;

    await updateDoc(userRef, {
      username: normalized,
      usernameLastChanged: serverTimestamp(),
      usernameChangeCount: currentCount + 1,
    });

    return { success: true };
  } catch (error) {
    console.error('Error changing username:', error);
    return { success: false, error: 'Fehler beim Ändern des Usernamens' };
  }
};

// ═══════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════

/**
 * Format days remaining as human-readable text
 */
export const formatDaysRemaining = (days: number): string => {
  if (days === 0) return 'Jetzt änderbar';
  if (days === 1) return 'Noch 1 Tag';
  return `Noch ${days} Tage`;
};

/**
 * Format date as "DD.MM.YYYY"
 */
export const formatChangeDate = (date: Date | null): string => {
  if (!date) return 'Nie geändert';
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default {
  validateUsernameFormat,
  checkUsernameAvailability,
  getUsernameChangeStatus,
  changeUsername,
  formatDaysRemaining,
  formatChangeDate,
  USERNAME_CHANGE_COOLDOWN_DAYS,
};
