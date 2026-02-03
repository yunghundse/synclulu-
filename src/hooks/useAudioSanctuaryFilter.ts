/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDIO SANCTUARY FILTER v3.5
 * "Speech-to-Text + Guardian Integration"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kombiniert Web Speech API mit dem Guardian Middleware für
 * automatische Filterung von Sprachnachrichten.
 *
 * Flow:
 * 1. Audio → Speech Recognition (Web Speech API)
 * 2. Transcript → Guardian Filter (Toxicity Check)
 * 3. Result → Allow/Warn/Block + Optional Encrypted Storage
 *
 * @version 3.5.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  analyzeAudioAggression,
  sanctuarySafetyCheck,
  filterContent,
  calculateToxicityScore,
  SafetyCheckResult,
  AudioAggressionResult,
} from '@/lib/guardianMiddleware';
import { addAuditLogEntry } from '@/lib/legalAudit';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  language: string;
}

export interface AudioSafetyResult {
  /** Whether the audio is safe to send */
  isAllowed: boolean;
  /** Action recommendation: allow, warn, block */
  action: 'allow' | 'warn' | 'block';
  /** Reason for action (if not allowed) */
  reason?: string;
  /** Toxicity score (0.0 - 1.0) */
  toxicityScore: number;
  /** Aggression analysis result */
  aggressionResult: AudioAggressionResult;
  /** Original transcript */
  transcript: string;
  /** Cleaned/filtered transcript */
  cleanedTranscript?: string;
  /** Flagged words found */
  flaggedWords?: string[];
  /** Should be encrypted and stored for safety */
  shouldRecordForSafety: boolean;
}

export interface UseAudioSanctuaryFilterOptions {
  /** Language for speech recognition (default: 'de-DE') */
  language?: string;
  /** Enable continuous recognition (default: false) */
  continuous?: boolean;
  /** Volume threshold for aggression detection (0.0 - 1.0) */
  volumeThreshold?: number;
  /** Auto-analyze on final transcript (default: true) */
  autoAnalyze?: boolean;
}

export interface UseAudioSanctuaryFilterReturn {
  /** Start transcription */
  startTranscription: () => void;
  /** Stop transcription */
  stopTranscription: () => void;
  /** Analyze audio transcript */
  analyzeTranscript: (transcript: string, volumeLevel?: number) => Promise<AudioSafetyResult>;
  /** Analyze audio blob (with transcription) */
  analyzeAudio: (audioBlob: Blob) => Promise<AudioSafetyResult | null>;
  /** Current transcription result */
  transcription: TranscriptionResult | null;
  /** Current safety result */
  safetyResult: AudioSafetyResult | null;
  /** Is transcription in progress */
  isTranscribing: boolean;
  /** Is analysis in progress */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;
  /** Is speech recognition supported */
  isSupported: boolean;
}

// ═══════════════════════════════════════
// SPEECH RECOGNITION SETUP
// ═══════════════════════════════════════

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * Get speech recognition instance
 */
function getSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) return null;

  return new SpeechRecognitionAPI();
}

// ═══════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════

export function useAudioSanctuaryFilter(
  userId: string,
  options: UseAudioSanctuaryFilterOptions = {}
): UseAudioSanctuaryFilterReturn {
  const {
    language = 'de-DE',
    continuous = false,
    volumeThreshold = 0.8,
    autoAnalyze = true,
  } = options;

  // State
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [safetyResult, setSafetyResult] = useState<AudioSafetyResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  /**
   * Analyze transcript through Guardian filter
   */
  const analyzeTranscript = useCallback(async (
    transcript: string,
    volumeLevel: number = 0.5
  ): Promise<AudioSafetyResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Run content filter
      const { cleanText, wasCensored, censoredWords } = filterContent(transcript);

      // 2. Calculate toxicity
      const toxicityScore = calculateToxicityScore(transcript);

      // 3. Analyze audio aggression patterns
      const aggressionResult = analyzeAudioAggression({
        transcript,
        volumeLevel,
        speechRate: estimateSpeechRate(transcript),
      });

      // 4. Determine action
      let action: 'allow' | 'warn' | 'block' = 'allow';
      let reason: string | undefined;

      if (aggressionResult.shouldRecord || toxicityScore >= 0.8) {
        action = 'block';
        reason = 'Bedrohlicher oder aggressiver Inhalt erkannt.';
      } else if (wasCensored || toxicityScore >= 0.4 || aggressionResult.score >= 0.5) {
        action = 'warn';
        reason = 'Potenziell unangemessener Inhalt erkannt.';
      }

      // 5. Log if flagged
      if (action !== 'allow') {
        await addAuditLogEntry({
          userId,
          action: action === 'block' ? 'content_blocked' : 'content_flagged',
          category: 'content_moderation',
          severity: action === 'block' ? 'critical' : 'warning',
          details: {
            contentType: 'audio_transcript',
            toxicityScore,
            aggressionScore: aggressionResult.score,
            aggressionCategories: aggressionResult.categories,
            flaggedWords: censoredWords,
            action,
            reason,
            // Encrypted transcript only if recording for safety
            transcript: aggressionResult.shouldRecord ? transcript : undefined,
          },
        });
      }

      const result: AudioSafetyResult = {
        isAllowed: action !== 'block',
        action,
        reason,
        toxicityScore,
        aggressionResult,
        transcript,
        cleanedTranscript: cleanText,
        flaggedWords: censoredWords,
        shouldRecordForSafety: aggressionResult.shouldRecord,
      };

      setSafetyResult(result);
      return result;

    } catch (err) {
      console.error('Audio analysis error:', err);
      setError('Analyse fehlgeschlagen');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [userId]);

  /**
   * Start real-time transcription
   */
  const startTranscription = useCallback(() => {
    if (!isSupported) {
      setError('Spracherkennung nicht unterstützt');
      return;
    }

    setError(null);
    setTranscription(null);
    setSafetyResult(null);

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setError('Spracherkennung konnte nicht gestartet werden');
      return;
    }

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsTranscribing(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const alternative = result[0];

      const transcriptionResult: TranscriptionResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        isFinal: result.isFinal,
        language,
      };

      setTranscription(transcriptionResult);

      // Auto-analyze when final
      if (result.isFinal && autoAnalyze) {
        analyzeTranscript(alternative.transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Spracherkennungsfehler: ${event.error}`);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, continuous, language, autoAnalyze, analyzeTranscript]);

  /**
   * Stop transcription
   */
  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }
  }, []);

  /**
   * Analyze audio blob (with transcription)
   * Uses MediaRecorder playback + speech recognition
   */
  const analyzeAudio = useCallback(async (
    audioBlob: Blob
  ): Promise<AudioSafetyResult | null> => {
    if (!isSupported) {
      setError('Spracherkennung nicht unterstützt');
      return null;
    }

    return new Promise((resolve) => {
      const recognition = getSpeechRecognition();
      if (!recognition) {
        setError('Spracherkennung konnte nicht gestartet werden');
        resolve(null);
        return;
      }

      // Create audio element for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Setup audio context for volume analysis
      let volumeLevel = 0.5;
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Analyze volume
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          volumeLevel = Math.max(volumeLevel, average / 255);
        };

        const volumeInterval = setInterval(checkVolume, 100);

        audio.onended = () => {
          clearInterval(volumeInterval);
          audioContext.close();
        };
      } catch {
        // Volume analysis not critical
        console.warn('Volume analysis not available');
      }

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language;

      let fullTranscript = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onend = async () => {
        URL.revokeObjectURL(audioUrl);

        if (fullTranscript.trim()) {
          try {
            const result = await analyzeTranscript(fullTranscript.trim(), volumeLevel);
            resolve(result);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      recognition.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(null);
      };

      // Start recognition and play audio
      recognition.start();
      audio.play().catch(() => {
        recognition.stop();
        resolve(null);
      });

      // Auto-stop after audio ends
      audio.onended = () => {
        setTimeout(() => recognition.stop(), 500);
      };
    });
  }, [isSupported, language, analyzeTranscript]);

  return {
    startTranscription,
    stopTranscription,
    analyzeTranscript,
    analyzeAudio,
    transcription,
    safetyResult,
    isTranscribing,
    isAnalyzing,
    error,
    isSupported,
  };
}

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════

/**
 * Estimate speech rate from transcript
 * Average German/English speech: 120-150 wpm
 */
function estimateSpeechRate(transcript: string): number {
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  // Assume average word takes ~0.5s to speak
  const estimatedDurationMinutes = (wordCount * 0.5) / 60;

  if (estimatedDurationMinutes === 0) return 120;

  return Math.round(wordCount / estimatedDurationMinutes);
}

// ═══════════════════════════════════════
// STANDALONE FUNCTIONS
// ═══════════════════════════════════════

/**
 * Quick check audio transcript (no hook)
 */
export async function checkAudioTranscript(params: {
  userId: string;
  transcript: string;
  volumeLevel?: number;
}): Promise<AudioSafetyResult> {
  const { userId, transcript, volumeLevel = 0.5 } = params;

  // Filter content
  const { cleanText, wasCensored, censoredWords } = filterContent(transcript);

  // Calculate toxicity
  const toxicityScore = calculateToxicityScore(transcript);

  // Analyze aggression
  const aggressionResult = analyzeAudioAggression({
    transcript,
    volumeLevel,
    speechRate: estimateSpeechRate(transcript),
  });

  // Determine action
  let action: 'allow' | 'warn' | 'block' = 'allow';
  let reason: string | undefined;

  if (aggressionResult.shouldRecord || toxicityScore >= 0.8) {
    action = 'block';
    reason = 'Bedrohlicher oder aggressiver Inhalt erkannt.';
  } else if (wasCensored || toxicityScore >= 0.4 || aggressionResult.score >= 0.5) {
    action = 'warn';
    reason = 'Potenziell unangemessener Inhalt erkannt.';
  }

  // Log if flagged
  if (action !== 'allow') {
    await addAuditLogEntry({
      userId,
      action: action === 'block' ? 'content_blocked' : 'content_flagged',
      category: 'content_moderation',
      severity: action === 'block' ? 'critical' : 'warning',
      details: {
        contentType: 'audio_transcript',
        toxicityScore,
        aggressionScore: aggressionResult.score,
        flaggedWords: censoredWords,
        action,
        reason,
      },
    });
  }

  return {
    isAllowed: action !== 'block',
    action,
    reason,
    toxicityScore,
    aggressionResult,
    transcript,
    cleanedTranscript: cleanText,
    flaggedWords: censoredWords,
    shouldRecordForSafety: aggressionResult.shouldRecord,
  };
}

export default useAudioSanctuaryFilter;
