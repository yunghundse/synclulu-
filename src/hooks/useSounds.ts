import { useCallback, useRef } from 'react';

// Sound URLs - using simple tones generated via Web Audio API
// No external dependencies needed!

export const useSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Get or create audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a simple tone
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    try {
      const ctx = getAudioContext();

      // Resume context if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade in and out for smoother sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      // Silent fail - sounds are optional
    }
  }, [getAudioContext]);

  // User joined sound - friendly ascending chime
  const playJoinSound = useCallback(() => {
    playTone(523.25, 0.1, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 80); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.25), 160); // G5
  }, [playTone]);

  // User left sound - descending tone
  const playLeaveSound = useCallback(() => {
    playTone(523.25, 0.1, 'sine', 0.15); // C5
    setTimeout(() => playTone(392.00, 0.15, 'sine', 0.1), 100); // G4
  }, [playTone]);

  // AFK Warning sound - attention grabbing
  const playWarningSound = useCallback(() => {
    playTone(440, 0.15, 'square', 0.15); // A4
    setTimeout(() => playTone(440, 0.15, 'square', 0.15), 200);
    setTimeout(() => playTone(440, 0.15, 'square', 0.15), 400);
  }, [playTone]);

  // XP gain sound - happy ding
  const playXPSound = useCallback(() => {
    playTone(880, 0.08, 'sine', 0.2); // A5
    setTimeout(() => playTone(1108.73, 0.12, 'sine', 0.25), 60); // C#6
  }, [playTone]);

  // Error sound - low buzz
  const playErrorSound = useCallback(() => {
    playTone(220, 0.2, 'sawtooth', 0.1); // A3
  }, [playTone]);

  // Mute/Unmute toggle sound
  const playMuteSound = useCallback((muted: boolean) => {
    if (muted) {
      playTone(440, 0.08, 'sine', 0.15);
      setTimeout(() => playTone(330, 0.1, 'sine', 0.1), 50);
    } else {
      playTone(330, 0.08, 'sine', 0.15);
      setTimeout(() => playTone(440, 0.1, 'sine', 0.15), 50);
    }
  }, [playTone]);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    playTone(587.33, 0.1, 'sine', 0.2); // D5
    setTimeout(() => playTone(880, 0.15, 'sine', 0.25), 100); // A5
  }, [playTone]);

  return {
    playJoinSound,
    playLeaveSound,
    playWarningSound,
    playXPSound,
    playErrorSound,
    playMuteSound,
    playNotificationSound,
  };
};

export default useSounds;
