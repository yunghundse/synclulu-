/**
 * DELULU VOICE VISUALIZER v2.0
 * "The Living Sound System"
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────┐
 * │  AudioContext                       │
 * │      ↓                              │
 * │  AnalyserNode                       │
 * │      ↓                              │
 * │  FFT Data → Volume Level            │
 * │      ↓                              │
 * │  Waveform Animation                 │
 * └─────────────────────────────────────┘
 *
 * @design Apple FaceTime Audio Visualizer
 * @version 2.0.0
 */

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface VoiceActivity {
  isSpeaking: boolean;
  volume: number;         // 0-1 normalized
  frequency: number;      // dominant frequency
  waveformData: number[]; // FFT data for visualization
}

export interface VoiceVisualizerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  speakingThreshold?: number;
}

// ═══════════════════════════════════════
// VOICE ANALYZER CLASS
// ═══════════════════════════════════════

export class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private listeners: Set<(activity: VoiceActivity) => void> = new Set();

  private config: Required<VoiceVisualizerConfig> = {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    speakingThreshold: 0.15,
  };

  constructor(config?: VoiceVisualizerConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize with audio stream
   */
  async initialize(stream: MediaStream): Promise<boolean> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
      this.analyser.minDecibels = this.config.minDecibels;
      this.analyser.maxDecibels = this.config.maxDecibels;

      // Connect stream to analyser
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      // Initialize data array
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Start analysis loop
      this.startAnalysis();

      return true;
    } catch (error) {
      console.error('[VoiceAnalyzer] Init failed:', error);
      return false;
    }
  }

  /**
   * Start the analysis loop
   */
  private startAnalysis(): void {
    if (!this.analyser || !this.dataArray) return;

    const analyze = () => {
      if (!this.analyser || !this.dataArray) return;

      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i] * this.dataArray[i];
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      const volume = Math.min(1, rms / 128); // Normalize to 0-1

      // Find dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        if (this.dataArray[i] > maxValue) {
          maxValue = this.dataArray[i];
          maxIndex = i;
        }
      }
      const frequency = maxIndex * (this.audioContext!.sampleRate / this.config.fftSize);

      // Create waveform data (normalized)
      const waveformData = Array.from(this.dataArray).map(v => v / 255);

      // Determine speaking state
      const isSpeaking = volume > this.config.speakingThreshold;

      // Notify listeners
      const activity: VoiceActivity = {
        isSpeaking,
        volume,
        frequency,
        waveformData,
      };

      this.listeners.forEach(listener => listener(activity));

      // Continue loop
      this.animationId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Subscribe to voice activity updates
   */
  onActivity(callback: (activity: VoiceActivity) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Stop analysis and cleanup
   */
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.listeners.clear();
  }
}

// ═══════════════════════════════════════
// WAVEFORM GENERATOR
// ═══════════════════════════════════════

/**
 * Generate SVG path for waveform
 */
export const generateWaveformPath = (
  data: number[],
  width: number,
  height: number,
  bars: number = 32
): string => {
  if (!data.length) return '';

  const step = Math.floor(data.length / bars);
  const barWidth = width / bars;
  const halfHeight = height / 2;

  let path = '';

  for (let i = 0; i < bars; i++) {
    const dataIndex = i * step;
    const value = data[dataIndex] || 0;
    const barHeight = value * halfHeight;

    const x = i * barWidth + barWidth / 2;
    const y1 = halfHeight - barHeight;
    const y2 = halfHeight + barHeight;

    // Create rounded bar
    path += `M ${x} ${y1} L ${x} ${y2} `;
  }

  return path;
};

/**
 * Generate circular waveform points
 */
export const generateCircularWaveform = (
  data: number[],
  centerX: number,
  centerY: number,
  baseRadius: number,
  amplitude: number = 20,
  points: number = 64
): { x: number; y: number }[] => {
  const result: { x: number; y: number }[] = [];
  const step = Math.floor(data.length / points);

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const dataIndex = i * step;
    const value = data[dataIndex] || 0;
    const radius = baseRadius + value * amplitude;

    result.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return result;
};

/**
 * Generate CSS animation keyframes for speaking
 */
export const getSpeakingAnimation = (intensity: number): string => {
  const scale = 1 + intensity * 0.15;
  const glow = Math.floor(intensity * 30);

  return `
    @keyframes speaking-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
      }
      50% {
        transform: scale(${scale});
        box-shadow: 0 0 ${glow}px ${glow / 2}px rgba(168, 85, 247, 0.6);
      }
    }
  `;
};
