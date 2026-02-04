/**
 * haptics.ts
 * 📳 HAPTIC FEEDBACK UTILITY
 *
 * Provides consistent haptic feedback across the app
 * using the Vibration API when available.
 *
 * @version 1.0.0
 */

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

interface HapticPattern {
  pattern: number[];
  description: string;
}

const HAPTIC_PATTERNS: Record<HapticIntensity, HapticPattern> = {
  light: {
    pattern: [10],
    description: 'Subtle tap for minor interactions',
  },
  medium: {
    pattern: [20, 10, 20],
    description: 'Standard feedback for buttons and selections',
  },
  heavy: {
    pattern: [50, 20, 50],
    description: 'Strong feedback for important actions',
  },
  success: {
    pattern: [10, 30, 10, 30, 50],
    description: 'Positive confirmation pattern',
  },
  error: {
    pattern: [100, 50, 100],
    description: 'Error or rejection feedback',
  },
  warning: {
    pattern: [30, 20, 30, 20, 30],
    description: 'Alert or warning pattern',
  },
};

/**
 * Check if haptic feedback is available
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with specified intensity
 * @param intensity - The type of haptic feedback to trigger
 * @returns boolean - Whether the haptic was triggered successfully
 */
export function triggerHaptic(intensity: HapticIntensity = 'medium'): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    const pattern = HAPTIC_PATTERNS[intensity]?.pattern || HAPTIC_PATTERNS.medium.pattern;
    return navigator.vibrate(pattern);
  } catch (error) {
    console.warn('[Haptics] Failed to trigger haptic:', error);
    return false;
  }
}

/**
 * Trigger a custom haptic pattern
 * @param pattern - Array of vibration durations in ms [vibrate, pause, vibrate, ...]
 * @returns boolean - Whether the haptic was triggered successfully
 */
export function triggerCustomHaptic(pattern: number[]): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(pattern);
  } catch (error) {
    console.warn('[Haptics] Failed to trigger custom haptic:', error);
    return false;
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    return navigator.vibrate(0);
  } catch (error) {
    console.warn('[Haptics] Failed to stop haptic:', error);
    return false;
  }
}

/**
 * React hook-style function for haptic feedback
 * Returns a memoizable trigger function
 */
export function createHapticTrigger(intensity: HapticIntensity = 'medium') {
  return () => triggerHaptic(intensity);
}

export default {
  triggerHaptic,
  triggerCustomHaptic,
  stopHaptic,
  isHapticSupported,
  createHapticTrigger,
};
