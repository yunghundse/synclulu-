/**
 * useHapticFeedback.ts
 * React hook for easy audio + haptic feedback integration
 * Provides Apple-style tactile responses throughout the app
 */

import { useCallback, useEffect, useRef } from 'react';
import { audioFeedback } from '../lib/audioFeedback';

export interface UseHapticFeedbackOptions {
  enabled?: boolean;
  volume?: number;
}

export function useHapticFeedback(options: UseHapticFeedbackOptions = {}) {
  const { enabled = true, volume = 1.0 } = options;
  const isInitialized = useRef(false);

  // Initialize on first user interaction
  useEffect(() => {
    if (!isInitialized.current) {
      const initOnInteraction = () => {
        audioFeedback.init();
        isInitialized.current = true;
        document.removeEventListener('touchstart', initOnInteraction);
        document.removeEventListener('click', initOnInteraction);
      };

      document.addEventListener('touchstart', initOnInteraction, { once: true });
      document.addEventListener('click', initOnInteraction, { once: true });

      return () => {
        document.removeEventListener('touchstart', initOnInteraction);
        document.removeEventListener('click', initOnInteraction);
      };
    }
  }, []);

  // Update settings
  useEffect(() => {
    audioFeedback.setEnabled(enabled);
    audioFeedback.setVolume(volume);
  }, [enabled, volume]);

  // Memoized feedback functions
  const tap = useCallback(() => {
    audioFeedback.tap();
    audioFeedback.haptic('light');
  }, []);

  const click = useCallback(() => {
    audioFeedback.click();
    audioFeedback.haptic('light');
  }, []);

  const pop = useCallback(() => {
    audioFeedback.pop();
    audioFeedback.haptic('medium');
  }, []);

  const success = useCallback(() => {
    audioFeedback.success();
    audioFeedback.haptic('medium');
  }, []);

  const error = useCallback(() => {
    audioFeedback.error();
    audioFeedback.haptic('heavy');
  }, []);

  const swoosh = useCallback(() => {
    audioFeedback.swoosh();
  }, []);

  const notification = useCallback(() => {
    audioFeedback.notification();
    audioFeedback.haptic('medium');
  }, []);

  const scrollTick = useCallback(() => {
    audioFeedback.scrollTick();
  }, []);

  // Scroll feedback with throttling
  const lastScrollTick = useRef(0);
  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const now = Date.now();
    if (now - lastScrollTick.current > 50) { // Max 20 ticks per second
      audioFeedback.scrollTick();
      lastScrollTick.current = now;
    }
  }, []);

  return {
    tap,
    click,
    pop,
    success,
    error,
    swoosh,
    notification,
    scrollTick,
    onScroll,
    // Direct access to feedback object
    audio: audioFeedback,
  };
}

// Simplified hook for common button feedback
export function useTapFeedback() {
  const { tap } = useHapticFeedback();
  return tap;
}

// Hook for scroll-based feedback
export function useScrollFeedback() {
  const { onScroll } = useHapticFeedback();
  return onScroll;
}

export default useHapticFeedback;
