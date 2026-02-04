/**
 * soundEngine.ts
 * Creator Sound Engine - Organische Klick-Sounds & Atmosphäre
 *
 * Features:
 * - Weiche Kaugummi-Button Sounds
 * - Atmosphärische Creator-Mode Sounds
 * - Haptisches Feedback Integration
 * - Web Audio API für Low-Latency
 * - Preload für Instant Response
 */

// ═══════════════════════════════════════════════════════════════
// AUDIO CONTEXT (Singleton)
// ═══════════════════════════════════════════════════════════════
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// ═══════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════
export const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10, 50, 30]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// SOUND GENERATORS (Web Audio API)
// ═══════════════════════════════════════════════════════════════

/**
 * Weicher Kaugummi-Button Sound
 * Organischer, squishy Klang
 */
export const playGumClick = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Oscillator 1: Tiefe Base
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Oscillator 2: Weiche Obertöne
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);

    haptic.light();
  } catch (e) {
    // Fallback: nur Haptic
    haptic.light();
  }
};

/**
 * Kaugummi Release Sound
 * Wenn man loslässt
 */
export const playGumRelease = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // Silently fail
  }
};

/**
 * Creator Mode Aktivierung
 * Atmosphärischer, aufsteigender Sound
 */
export const playCreatorActivate = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Aufsteigender Sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.setValueAtTime(0.15, now + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Harmonische Obertöne
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.35);

    // Shimmer
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1000, now + 0.1);
    osc3.frequency.exponentialRampToValueAtTime(1500, now + 0.35);
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.08, now + 0.1);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.4);

    haptic.medium();
  } catch (e) {
    haptic.medium();
  }
};

/**
 * Creator Mode Deaktivierung
 * Sanfter, absteigender Sound
 */
export const playCreatorDeactivate = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    haptic.light();
  } catch (e) {
    haptic.light();
  }
};

/**
 * Radar Scan Ping
 * Kurzer Sonar-artiger Sound
 */
export const playRadarPing = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    haptic.light();
  } catch (e) {
    haptic.light();
  }
};

/**
 * Radar Fund Sound
 * Wenn jemand gefunden wird
 */
export const playRadarFound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Aufsteigende Glocke
    [0, 0.08, 0.16].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 500 + (i * 200);
      osc.frequency.setValueAtTime(baseFreq, now + delay);
      gain.gain.setValueAtTime(0.12 - (i * 0.02), now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });

    haptic.success();
  } catch (e) {
    haptic.success();
  }
};

/**
 * Erfolgs-Sound
 * Positives Feedback
 */
export const playSuccess = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Zwei aufsteigende Töne
    [0, 0.1].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 523 : 659, now + delay); // C5, E5
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });

    haptic.success();
  } catch (e) {
    haptic.success();
  }
};

/**
 * Fehler-Sound
 * Dezentes negatives Feedback
 */
export const playError = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    haptic.error();
  } catch (e) {
    haptic.error();
  }
};

/**
 * Navigation Click
 * Subtiler Tab-Wechsel Sound
 */
export const playNavClick = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    haptic.light();
  } catch (e) {
    haptic.light();
  }
};

/**
 * Toggle Switch Sound
 */
export const playToggle = (isOn: boolean) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (isOn) {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    } else {
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    haptic.light();
  } catch (e) {
    haptic.light();
  }
};

// ═══════════════════════════════════════════════════════════════
// SOUND SETTINGS (User Preferences)
// ═══════════════════════════════════════════════════════════════
let soundEnabled = true;
let hapticEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  localStorage.setItem('synclulu_sound_enabled', String(enabled));
};

export const setHapticEnabled = (enabled: boolean) => {
  hapticEnabled = enabled;
  localStorage.setItem('synclulu_haptic_enabled', String(enabled));
};

export const isSoundEnabled = () => {
  const stored = localStorage.getItem('synclulu_sound_enabled');
  return stored !== null ? stored === 'true' : true;
};

export const isHapticEnabled = () => {
  const stored = localStorage.getItem('synclulu_haptic_enabled');
  return stored !== null ? stored === 'true' : true;
};

// Initialize from localStorage
soundEnabled = isSoundEnabled();
hapticEnabled = isHapticEnabled();

// ═══════════════════════════════════════════════════════════════
// UNIFIED SOUND API
// ═══════════════════════════════════════════════════════════════
export const SoundEngine = {
  gumClick: () => soundEnabled && playGumClick(),
  gumRelease: () => soundEnabled && playGumRelease(),
  creatorActivate: () => soundEnabled && playCreatorActivate(),
  creatorDeactivate: () => soundEnabled && playCreatorDeactivate(),
  radarPing: () => soundEnabled && playRadarPing(),
  radarFound: () => soundEnabled && playRadarFound(),
  success: () => soundEnabled && playSuccess(),
  error: () => soundEnabled && playError(),
  navClick: () => soundEnabled && playNavClick(),
  toggle: (isOn: boolean) => soundEnabled && playToggle(isOn),
  haptic,
  setSoundEnabled,
  setHapticEnabled,
  isSoundEnabled,
  isHapticEnabled,
};

export default SoundEngine;
