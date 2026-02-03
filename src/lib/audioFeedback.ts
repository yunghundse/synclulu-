/**
 * audioFeedback.ts
 * Apple-style haptic audio feedback system for the Nebula Command Center
 * Subtle, high-quality click sounds that enhance the premium feel
 */

// Audio context singleton
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Sound presets - Apple-inspired parameters
const SOUNDS = {
  // Soft tap - for buttons and selections
  tap: {
    frequency: 1800,
    duration: 0.03,
    volume: 0.08,
    type: 'sine' as OscillatorType,
  },

  // Light click - for list items
  click: {
    frequency: 2200,
    duration: 0.02,
    volume: 0.06,
    type: 'sine' as OscillatorType,
  },

  // Pop - for expanding menus
  pop: {
    frequency: 800,
    duration: 0.05,
    volume: 0.1,
    type: 'sine' as OscillatorType,
  },

  // Success chime - for completed actions
  success: {
    frequencies: [880, 1320],
    duration: 0.1,
    volume: 0.08,
    type: 'sine' as OscillatorType,
  },

  // Error buzz - subtle warning
  error: {
    frequency: 200,
    duration: 0.15,
    volume: 0.05,
    type: 'triangle' as OscillatorType,
  },

  // Swoosh - for transitions
  swoosh: {
    startFreq: 400,
    endFreq: 800,
    duration: 0.08,
    volume: 0.04,
    type: 'sine' as OscillatorType,
  },

  // Notification ping
  notification: {
    frequencies: [1046, 1318, 1568],
    duration: 0.08,
    volume: 0.1,
    type: 'sine' as OscillatorType,
  },

  // Scroll tick - very subtle
  scrollTick: {
    frequency: 3000,
    duration: 0.008,
    volume: 0.02,
    type: 'sine' as OscillatorType,
  },
};

// Play a simple tone
const playTone = (
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Quick fade in/out for smoothness
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.01);
  } catch (error) {
    // Silently fail - audio is non-critical
    console.debug('Audio feedback unavailable');
  }
};

// Play a frequency sweep (swoosh effect)
const playSweep = (
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number
): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.01);
  } catch (error) {
    console.debug('Audio feedback unavailable');
  }
};

// Play a chord (multiple frequencies)
const playChord = (
  frequencies: number[],
  duration: number,
  volume: number,
  stagger: number = 0.03
): void => {
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, duration, volume / frequencies.length);
    }, index * stagger * 1000);
  });
};

// Settings
let isEnabled = true;
let masterVolume = 1.0;

// Public API
export const audioFeedback = {
  // Enable/disable all sounds
  setEnabled: (enabled: boolean): void => {
    isEnabled = enabled;
  },

  // Set master volume (0.0 - 1.0)
  setVolume: (volume: number): void => {
    masterVolume = Math.max(0, Math.min(1, volume));
  },

  // Initialize on user gesture (required by browsers)
  init: (): void => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (error) {
      console.debug('Audio context initialization failed');
    }
  },

  // Sound methods
  tap: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.tap;
    playTone(s.frequency, s.duration, s.volume * masterVolume, s.type);
  },

  click: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.click;
    playTone(s.frequency, s.duration, s.volume * masterVolume, s.type);
  },

  pop: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.pop;
    playTone(s.frequency, s.duration, s.volume * masterVolume, s.type);
  },

  success: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.success;
    playChord(s.frequencies, s.duration, s.volume * masterVolume);
  },

  error: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.error;
    playTone(s.frequency, s.duration, s.volume * masterVolume, s.type);
  },

  swoosh: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.swoosh;
    playSweep(s.startFreq, s.endFreq, s.duration, s.volume * masterVolume);
  },

  notification: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.notification;
    playChord(s.frequencies, s.duration, s.volume * masterVolume, 0.05);
  },

  scrollTick: (): void => {
    if (!isEnabled) return;
    const s = SOUNDS.scrollTick;
    playTone(s.frequency, s.duration, s.volume * masterVolume, s.type);
  },

  // Haptic feedback (for devices that support it)
  haptic: (style: 'light' | 'medium' | 'heavy' = 'light'): void => {
    if (!isEnabled) return;

    if ('vibrate' in navigator) {
      const durations = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      navigator.vibrate(durations[style]);
    }
  },

  // Combined audio + haptic
  feedback: (type: 'tap' | 'click' | 'success' | 'error' = 'tap'): void => {
    if (!isEnabled) return;

    // Play sound
    switch (type) {
      case 'tap':
        audioFeedback.tap();
        audioFeedback.haptic('light');
        break;
      case 'click':
        audioFeedback.click();
        audioFeedback.haptic('light');
        break;
      case 'success':
        audioFeedback.success();
        audioFeedback.haptic('medium');
        break;
      case 'error':
        audioFeedback.error();
        audioFeedback.haptic('heavy');
        break;
    }
  },
};

export default audioFeedback;
