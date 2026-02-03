/**
 * Gatekeeper Hooks - React Integration
 *
 * Hooks for capacity checking, referral tracking, and registration flow
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  checkCapacity,
  validateRegistration,
  validateReferralCode,
  extractReferralCode,
  getSearchRadius,
  CapacityStatus,
  GATEKEEPER_CONFIG
} from '../lib/gatekeeperSystem';

// ═══════════════════════════════════════════════════════════════════════════
// CAPACITY HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useCapacity() {
  const [capacity, setCapacity] = useState<CapacityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCapacity();

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'stats'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const maxUsers = GATEKEEPER_CONFIG.maxUsers;
          const currentUsers = data.totalUsers || 0;

          setCapacity({
            currentUsers,
            maxUsers,
            isFull: currentUsers >= maxUsers,
            spotsRemaining: Math.max(0, maxUsers - currentUsers),
            waitlistCount: data.waitlistCount || 0
          });
        }
      },
      (err) => {
        console.warn('Capacity listener error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadCapacity = async () => {
    setIsLoading(true);
    try {
      const result = await checkCapacity();
      setCapacity(result);
    } catch (err) {
      setError('Fehler beim Laden der Kapazität');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    capacity,
    isLoading,
    error,
    isFull: capacity?.isFull || false,
    spotsRemaining: capacity?.spotsRemaining || 0,
    refresh: loadCapacity
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION VALIDATION HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useRegistrationValidation() {
  const [canRegister, setCanRegister] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validate();
  }, []);

  const validate = async () => {
    setIsValidating(true);
    try {
      const result = await validateRegistration();
      setCanRegister(result.canRegister);
      setReason(result.reason || null);
    } catch (err) {
      setCanRegister(false);
      setReason('Validierung fehlgeschlagen');
    } finally {
      setIsValidating(false);
    }
  };

  return {
    canRegister,
    reason,
    isValidating,
    revalidate: validate
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Extract referral code on mount
  useEffect(() => {
    const code = extractReferralCode();
    if (code) {
      setReferralCode(code);
      validateCode(code);
    }
  }, []);

  const validateCode = async (code: string) => {
    if (!code) {
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateReferralCode(code);
      setIsValid(result.valid);
      setReferrerName(result.referrerUsername || null);
    } catch {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const setCode = useCallback((code: string) => {
    setReferralCode(code.toUpperCase());
    validateCode(code);
  }, []);

  return {
    referralCode,
    isValid,
    referrerName,
    isValidating,
    setCode,
    validateCode
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH RADIUS HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useSearchRadius(user: {
  id?: string;
  role?: string;
  isPremium?: boolean;
} | null) {
  const [radius, setRadius] = useState(GATEKEEPER_CONFIG.standardRadius);

  useEffect(() => {
    if (user) {
      setRadius(getSearchRadius(user));
    } else {
      setRadius(GATEKEEPER_CONFIG.standardRadius);
    }
  }, [user?.id, user?.role, user?.isPremium]);

  const radiusKm = radius / 1000;
  const isInfinite = radius >= GATEKEEPER_CONFIG.founderRadius;
  const isPremiumRadius = radius >= GATEKEEPER_CONFIG.premiumRadius;

  return {
    radius,
    radiusKm,
    isInfinite,
    isPremiumRadius,
    displayText: isInfinite ? '∞ Global' : `${radiusKm} km`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// WAITLIST POSITION HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useWaitlistPosition(email: string | null) {
  const [position, setPosition] = useState<number | null>(null);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);

  useEffect(() => {
    if (!email) return;

    const waitlistId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const unsubscribe = onSnapshot(
      doc(db, 'waitlist', waitlistId),
      (snapshot) => {
        if (snapshot.exists() && !snapshot.data().converted) {
          setIsOnWaitlist(true);
          // Position would need to be calculated
          setPosition(snapshot.data().position || null);
        } else {
          setIsOnWaitlist(false);
          setPosition(null);
        }
      }
    );

    return () => unsubscribe();
  }, [email]);

  return { position, isOnWaitlist };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { GATEKEEPER_CONFIG };
