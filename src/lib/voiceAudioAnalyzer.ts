/**
 * voiceAudioAnalyzer.ts
 * 🎤 PSYCHO-ACOUSTICS ENGINE - Voice Detection & Aura Color System
 *
 * Features:
 * - Real-time voice level analysis via Web Audio API
 * - Emotional aura color mapping based on voice intensity
 * - Frequency analysis for voice characteristics
 * - Smooth transitions between aura states
 *
 * @version 1.0.0 - Voice Cloud Edition
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export type AuraState = 'silent' | 'whisper' | 'normal' | 'engaged' | 'excited' | 'loud';

export interface AuraColor {
  primary: string;
  secondary: string;
  glow: string;
  intensity: number;
}

export interface VoiceAnalysisResult {
  level: number;           // 0-100 normalized volume
  frequency: number;       // Dominant frequency
  auraState: AuraState;
  auraColor: AuraColor;
  isSpeaking: boolean;
  timestamp: number;
}

export interface VoiceAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  speakingThreshold?: number;
  onAnalysis?: (result: VoiceAnalysisResult) => void;
  onError?: (error: Error) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// AURA COLOR MAPPINGS (Psycho-Acoustic Design)
// ═══════════════════════════════════════════════════════════════════════════

const AURA_COLORS: Record<AuraState, AuraColor> = {
  silent: {
    primary: 'rgba(100, 100, 120, 0.3)',
    secondary: 'rgba(80, 80, 100, 0.2)',
    glow: 'rgba(100, 100, 120, 0)',
    intensity: 0,
  },
  whisper: {
    primary: 'rgba(99, 102, 241, 0.6)',    // Indigo - Nachdenklich
    secondary: 'rgba(139, 92, 246, 0.4)',   // Violet
    glow: 'rgba(99, 102, 241, 0.4)',
    intensity: 0.3,
  },
  normal: {
    primary: 'rgba(34, 197, 94, 0.7)',      // Green - Engagiert
    secondary: 'rgba(74, 222, 128, 0.5)',
    glow: 'rgba(34, 197, 94, 0.5)',
    intensity: 0.5,
  },
  engaged: {
    primary: 'rgba(234, 179, 8, 0.8)',      // Yellow - Aktiv
    secondary: 'rgba(250, 204, 21, 0.6)',
    glow: 'rgba(234, 179, 8, 0.6)',
    intensity: 0.7,
  },
  excited: {
    primary: 'rgba(249, 115, 22, 0.85)',    // Orange - Aufgeregt
    secondary: 'rgba(251, 146, 60, 0.7)',
    glow: 'rgba(249, 115, 22, 0.7)',
    intensity: 0.85,
  },
  loud: {
    primary: 'rgba(239, 68, 68, 0.9)',      // Red - Laut/Lachend
    secondary: 'rgba(248, 113, 113, 0.8)',
    glow: 'rgba(239, 68, 68, 0.8)',
    intensity: 1.0,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps voice level (0-100) to AuraState
 */
export function getAuraStateFromLevel(level: number): AuraState {
  if (level < 5) return 'silent';
  if (level < 20) return 'whisper';
  if (level < 40) return 'normal';
  if (level < 60) return 'engaged';
  if (level < 80) return 'excited';
  return 'loud';
}

/**
 * Gets interpolated aura color based on exact level
 */
export function getAuraColor(level: number): AuraColor {
  const state = getAuraStateFromLevel(level);
  return AURA_COLORS[state];
}

/**
 * Generates CSS gradient string for aura glow
 */
export function getAuraGradient(auraColor: AuraColor): string {
  return `radial-gradient(circle, ${auraColor.primary} 0%, ${auraColor.secondary} 50%, transparent 70%)`;
}

/**
 * Generates CSS box-shadow for pulsing effect
 */
export function getAuraGlow(auraColor: AuraColor, pulse: boolean = false): string {
  const baseGlow = `0 0 ${20 + auraColor.intensity * 30}px ${auraColor.glow}`;
  const innerGlow = `0 0 ${10 + auraColor.intensity * 15}px ${auraColor.primary}`;
  return `${baseGlow}, ${innerGlow}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE AUDIO ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class VoiceAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private config: Required<VoiceAnalyzerConfig>;

  // Smoothing for stable readings
  private smoothedLevel: number = 0;
  private readonly smoothingFactor = 0.3;

  constructor(config: VoiceAnalyzerConfig = {}) {
    this.config = {
      fftSize: config.fftSize ?? 1024,
      smoothingTimeConstant: config.smoothingTimeConstant ?? 0.8,
      minDecibels: config.minDecibels ?? -90,
      maxDecibels: config.maxDecibels ?? -10,
      speakingThreshold: config.speakingThreshold ?? 10,
      onAnalysis: config.onAnalysis ?? (() => {}),
      onError: config.onError ?? console.error,
    };
  }

  /**
   * Starts the audio analyzer
   */
  async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
      this.analyser.minDecibels = this.config.minDecibels;
      this.analyser.maxDecibels = this.config.maxDecibels;

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Start analysis loop
      this.isRunning = true;
      this.analyze();

      return true;
    } catch (error) {
      this.config.onError(error as Error);
      return false;
    }
  }

  /**
   * Stops the audio analyzer and releases resources
   */
  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.smoothedLevel = 0;
  }

  /**
   * Main analysis loop
   */
  private analyze = (): void => {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Get frequency data
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average level
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / bufferLength;

    // Normalize to 0-100 range
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    // Apply smoothing
    this.smoothedLevel = this.smoothedLevel * (1 - this.smoothingFactor) +
                         normalizedLevel * this.smoothingFactor;

    // Find dominant frequency
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    const dominantFrequency = (maxIndex * (this.audioContext?.sampleRate || 44100)) /
                              (this.config.fftSize * 2);

    // Determine aura state and color
    const auraState = getAuraStateFromLevel(this.smoothedLevel);
    const auraColor = AURA_COLORS[auraState];

    // Build result
    const result: VoiceAnalysisResult = {
      level: Math.round(this.smoothedLevel),
      frequency: Math.round(dominantFrequency),
      auraState,
      auraColor,
      isSpeaking: this.smoothedLevel > this.config.speakingThreshold,
      timestamp: Date.now(),
    };

    // Callback with result
    this.config.onAnalysis(result);

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.analyze);
  };

  /**
   * Gets current speaking status
   */
  isSpeaking(): boolean {
    return this.smoothedLevel > this.config.speakingThreshold;
  }

  /**
   * Gets current voice level (0-100)
   */
  getLevel(): number {
    return Math.round(this.smoothedLevel);
  }

  /**
   * Gets current aura state
   */
  getAuraState(): AuraState {
    return getAuraStateFromLevel(this.smoothedLevel);
  }

  /**
   * Gets current aura color
   */
  getAuraColor(): AuraColor {
    return getAuraColor(this.smoothedLevel);
  }

  /**
   * Checks if analyzer is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK FOR VOICE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVoiceAnalyzerOptions {
  autoStart?: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export interface UseVoiceAnalyzerReturn {
  isActive: boolean;
  isSpeaking: boolean;
  level: number;
  auraState: AuraState;
  auraColor: AuraColor;
  start: () => Promise<boolean>;
  stop: () => void;
  error: Error | null;
}

export function useVoiceAnalyzer(options: UseVoiceAnalyzerOptions = {}): UseVoiceAnalyzerReturn {
  const { autoStart = false, onSpeakingChange } = options;

  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [auraState, setAuraState] = useState<AuraState>('silent');
  const [auraColor, setAuraColor] = useState<AuraColor>(AURA_COLORS.silent);
  const [error, setError] = useState<Error | null>(null);

  const analyzerRef = useRef<VoiceAudioAnalyzer | null>(null);
  const wasSpeakingRef = useRef(false);

  const handleAnalysis = useCallback((result: VoiceAnalysisResult) => {
    setLevel(result.level);
    setAuraState(result.auraState);
    setAuraColor(result.auraColor);
    setIsSpeaking(result.isSpeaking);

    // Trigger callback on speaking change
    if (result.isSpeaking !== wasSpeakingRef.current) {
      wasSpeakingRef.current = result.isSpeaking;
      onSpeakingChange?.(result.isSpeaking);
    }
  }, [onSpeakingChange]);

  const start = useCallback(async (): Promise<boolean> => {
    if (analyzerRef.current?.isActive()) return true;

    analyzerRef.current = new VoiceAudioAnalyzer({
      onAnalysis: handleAnalysis,
      onError: (err) => setError(err),
    });

    const success = await analyzerRef.current.start();
    setIsActive(success);
    if (!success) {
      setError(new Error('Mikrofon-Zugriff verweigert'));
    }
    return success;
  }, [handleAnalysis]);

  const stop = useCallback(() => {
    analyzerRef.current?.stop();
    analyzerRef.current = null;
    setIsActive(false);
    setIsSpeaking(false);
    setLevel(0);
    setAuraState('silent');
    setAuraColor(AURA_COLORS.silent);
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      analyzerRef.current?.stop();
    };
  }, [autoStart, start]);

  return {
    isActive,
    isSpeaking,
    level,
    auraState,
    auraColor,
    start,
    stop,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

export default VoiceAudioAnalyzer;
