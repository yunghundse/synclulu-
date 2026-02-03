/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WEB AUDIO API VISUALIZER HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Real-time audio analysis for voice activity detection:
 * - Captures microphone input
 * - Analyzes frequency data
 * - Returns normalized audio level (0-1)
 * - Detects speaking state
 *
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AudioVisualizerState {
  audioLevel: number;        // 0-1 normalized
  isSpeaking: boolean;
  isActive: boolean;
  error: string | null;
}

interface AudioVisualizerConfig {
  fftSize: number;           // FFT window size (power of 2)
  smoothingTimeConstant: number; // 0-1, higher = smoother
  speakingThreshold: number; // Minimum level to count as speaking
  silenceDelay: number;      // ms to wait before marking as not speaking
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: AudioVisualizerConfig = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  speakingThreshold: 0.15,
  silenceDelay: 200,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useAudioVisualizer(
  stream: MediaStream | null,
  config: Partial<AudioVisualizerConfig> = {}
) {
  const [state, setState] = useState<AudioVisualizerState>({
    audioLevel: 0,
    isSpeaking: false,
    isActive: false,
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<AudioVisualizerConfig>({ ...DEFAULT_CONFIG, ...config });

  // Update config
  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...config };
  }, [config]);

  // Initialize audio analysis
  useEffect(() => {
    if (!stream) {
      setState(prev => ({ ...prev, isActive: false, audioLevel: 0 }));
      return;
    }

    const initAudio = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = configRef.current.fftSize;
        analyser.smoothingTimeConstant = configRef.current.smoothingTimeConstant;
        analyserRef.current = analyser;

        // Connect stream to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        // Start analysis loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const analyze = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average level
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const average = sum / dataArray.length;
          const normalized = average / 255; // Normalize to 0-1

          // Detect speaking
          const isSpeakingNow = normalized > configRef.current.speakingThreshold;

          setState(prev => {
            // Handle silence delay
            if (!isSpeakingNow && prev.isSpeaking) {
              // Start silence timer if not already running
              if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                  setState(p => ({ ...p, isSpeaking: false }));
                  silenceTimerRef.current = null;
                }, configRef.current.silenceDelay);
              }
              return { ...prev, audioLevel: normalized };
            }

            // Clear silence timer if speaking again
            if (isSpeakingNow && silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }

            return {
              ...prev,
              audioLevel: normalized,
              isSpeaking: isSpeakingNow || prev.isSpeaking,
            };
          });

          animationRef.current = requestAnimationFrame(analyze);
        };

        setState(prev => ({ ...prev, isActive: true, error: null }));
        animationRef.current = requestAnimationFrame(analyze);

      } catch (err: any) {
        console.error('[AudioVisualizer] Init error:', err);
        setState(prev => ({
          ...prev,
          isActive: false,
          error: err.message || 'Audio initialization failed',
        }));
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return state;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MICROPHONE HOOK (Convenience wrapper)
// ═══════════════════════════════════════════════════════════════════════════════

export function useMicrophoneVisualizer(enabled: boolean = true) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Get microphone access
  useEffect(() => {
    if (!enabled) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    const getMicrophone = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        setStream(mediaStream);
        setPermissionState('granted');
      } catch (err: any) {
        console.error('[Microphone] Access denied:', err);
        setPermissionState('denied');
      }
    };

    getMicrophone();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled]);

  const visualizer = useAudioVisualizer(stream);

  // Mute/unmute
  const setMuted = useCallback((muted: boolean) => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [stream]);

  return {
    ...visualizer,
    permissionState,
    stream,
    setMuted,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FREQUENCY BANDS HOOK (For detailed visualization)
// ═══════════════════════════════════════════════════════════════════════════════

export function useFrequencyBands(
  stream: MediaStream | null,
  bandCount: number = 8
) {
  const [bands, setBands] = useState<number[]>(new Array(bandCount).fill(0));

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setBands(new Array(bandCount).fill(0));
      return;
    }

    const init = async () => {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const bandSize = Math.floor(analyser.frequencyBinCount / bandCount);

      const analyze = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Split into bands
        const newBands = [...Array(bandCount)].map((_, i) => {
          const start = i * bandSize;
          const end = start + bandSize;
          const bandData = dataArray.slice(start, end);
          const sum = bandData.reduce((acc, val) => acc + val, 0);
          return (sum / bandData.length) / 255;
        });

        setBands(newBands);
        animationRef.current = requestAnimationFrame(analyze);
      };

      animationRef.current = requestAnimationFrame(analyze);
    };

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, bandCount]);

  return bands;
}

export default useAudioVisualizer;
