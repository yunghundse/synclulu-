/**
 * VOICE MEMO RECORDER v3.5
 * "The Distance-Bond"
 *
 * Asynchrone Sprachnachrichten für Freunde auf Distanz.
 * Aktiviert wenn Elastic Proximity > 5km.
 *
 * FEATURES:
 * - Glow-Effekt beim Halten des Record-Buttons
 * - Maximale Dauer: 60 Sekunden
 * - Pulsierende Wolke als Visualisierung
 * - AAC/Opus Format für optimale Qualität
 * - 24h Auto-Löschung
 *
 * @version 3.5.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, X, Pause, Play,
  Cloud, Trash2, Clock, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { analyzeAudioAggression } from '@/lib/guardianMiddleware';
import { useAudioSanctuaryFilter, AudioSafetyResult } from '@/hooks/useAudioSanctuaryFilter';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface VoiceMemo {
  id: string;
  senderId: string;
  receiverId: string;
  audioUrl: string;
  duration: number;
  createdAt: Date;
  expiresAt: Date;
  isPlayed: boolean;
  waveform?: number[];
}

export interface VoiceMemoRecorderProps {
  receiverId: string;
  onSend: (memo: Omit<VoiceMemo, 'id' | 'isPlayed'>) => Promise<void>;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
  distanceKm?: number; // for UI display
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const MAX_DURATION_DEFAULT = 60; // 60 seconds
const SAMPLE_RATE = 44100;
const BIT_RATE = 128000;

// ═══════════════════════════════════════
// WAVEFORM GENERATOR
// ═══════════════════════════════════════

function generateWaveformData(audioBuffer: AudioBuffer, samples: number = 50): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize to 0-1
  const max = Math.max(...waveform);
  return waveform.map(v => v / max);
}

// ═══════════════════════════════════════
// VOICE MEMO RECORDER COMPONENT
// ═══════════════════════════════════════

const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  receiverId,
  onSend,
  onCancel,
  maxDuration = MAX_DURATION_DEFAULT,
  distanceKm,
}) => {
  const { user } = useStore();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Sanctuary Filter state
  const [safetyResult, setSafetyResult] = useState<AudioSafetyResult | null>(null);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  // Sanctuary Filter hook
  const {
    analyzeAudio,
    isSupported: isSpeechSupported,
  } = useAudioSanctuaryFilter(user?.id || '', {
    language: 'de-DE',
    autoAnalyze: false,
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Live waveform data
  const [liveWaveform, setLiveWaveform] = useState<number[]>(Array(20).fill(0.1));

  // ═══════════════════════════════════════
  // RECORDING FUNCTIONS
  // ═══════════════════════════════════════

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
      });

      // Set up audio analyser for live waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine best format (prefer AAC, fallback to webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: BIT_RATE,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));

        // Generate waveform
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          setWaveform(generateWaveformData(audioBuffer));
        } catch {
          // Fallback waveform
          setWaveform(Array(50).fill(0).map(() => Math.random() * 0.7 + 0.3));
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start live waveform animation
      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const normalized = Array.from(dataArray.slice(0, 20)).map(v => v / 255);
          setLiveWaveform(normalized);
        }
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Mikrofon-Zugriff verweigert');
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 5, 10]);
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setWaveform([]);
    setRecordingTime(0);
    setSafetyResult(null);
    setShowSafetyWarning(false);
    setError(null);
    onCancel?.();
  }, [stopRecording, onCancel]);

  // ═══════════════════════════════════════
  // UPLOAD & SEND
  // ═══════════════════════════════════════

  const sendVoiceMemo = useCallback(async (forceOverride = false) => {
    if (!audioBlob || !user?.id) return;

    // ═══════════════════════════════════════
    // SANCTUARY SAFETY CHECK
    // ═══════════════════════════════════════

    // Run safety check first (if speech recognition is supported and not overridden)
    if (isSpeechSupported && !forceOverride && !safetyResult) {
      setIsCheckingSafety(true);
      try {
        const result = await analyzeAudio(audioBlob);
        setSafetyResult(result);

        if (result) {
          // Block if dangerous content detected
          if (result.action === 'block') {
            setError('Diese Nachricht enthält Inhalte, die gegen unsere Richtlinien verstoßen.');
            setIsCheckingSafety(false);
            return;
          }

          // Show warning if potentially problematic
          if (result.action === 'warn' && !forceOverride) {
            setShowSafetyWarning(true);
            setIsCheckingSafety(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Safety check failed, continuing:', err);
        // Continue if safety check fails (fail-open for UX)
      }
      setIsCheckingSafety(false);
    }

    // ═══════════════════════════════════════
    // UPLOAD PROCESS
    // ═══════════════════════════════════════

    setIsUploading(true);
    setUploadProgress(0);
    setShowSafetyWarning(false);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = audioBlob.type.includes('mp4') ? 'aac' : 'opus';
      const filename = `voice-memos/${user.id}/${receiverId}/${timestamp}.${extension}`;
      const storageRef = ref(storage, filename);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, audioBlob, {
        contentType: audioBlob.type,
        customMetadata: {
          senderId: user.id,
          receiverId,
          duration: String(recordingTime),
          createdAt: new Date().toISOString(),
          // Include safety check result
          safetyChecked: String(!!safetyResult),
          toxicityScore: safetyResult?.toxicityScore?.toFixed(2) || '0.00',
        },
      });

      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      });

      await uploadTask;
      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

      // Create memo object
      const memo: Omit<VoiceMemo, 'id' | 'isPlayed'> = {
        senderId: user.id,
        receiverId,
        audioUrl: downloadUrl,
        duration: recordingTime,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        waveform,
      };

      await onSend(memo);

      // Reset state
      setAudioBlob(null);
      setAudioUrl(null);
      setWaveform([]);
      setRecordingTime(0);

      // Haptic success
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 10, 15, 10, 30]);
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Senden fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, user?.id, receiverId, recordingTime, waveform, onSend, isSpeechSupported, safetyResult, analyzeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // ═══════════════════════════════════════
  // FORMAT TIME
  // ═══════════════════════════════════════

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <div className="relative">
      {/* Distance Badge */}
      {distanceKm !== undefined && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium flex items-center gap-1">
          <Cloud size={12} />
          Cloud-Memo • {distanceKm.toFixed(1)}km entfernt
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[var(--synclulu-card)] rounded-2xl p-4 border border-[var(--synclulu-border)] theme-transition">

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Recording State */}
        {!audioBlob ? (
          <div className="flex items-center gap-4">
            {/* Record Button */}
            <motion.button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isRecording && recordingTime >= maxDuration}
              className={`
                relative w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isRecording
                  ? 'bg-red-500 scale-110'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }
              `}
              animate={isRecording ? { scale: [1.1, 1.15, 1.1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              {/* Glow Ring */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}

              <Mic size={24} className="text-white relative z-10" />
            </motion.button>

            {/* Timer / Instruction */}
            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center gap-3">
                  {/* Live Waveform */}
                  <div className="flex items-center gap-0.5 h-8">
                    {liveWaveform.map((v, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-500 rounded-full"
                        animate={{ height: `${Math.max(4, v * 32)}px` }}
                        transition={{ duration: 0.1 }}
                      />
                    ))}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono text-[var(--synclulu-text)]">
                      {formatTime(recordingTime)}
                    </span>
                    <span className="text-[var(--synclulu-muted)] text-sm">
                      / {formatTime(maxDuration)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[var(--synclulu-muted)] text-sm">
                  Halten zum Aufnehmen (max {maxDuration}s)
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Preview State */
          <div className="space-y-4">
            {/* Waveform Preview */}
            <div className="flex items-center gap-2 h-12 bg-[var(--synclulu-surface)] rounded-xl px-4">
              <button
                onClick={() => {
                  const audio = new Audio(audioUrl!);
                  audio.play();
                }}
                className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white"
              >
                <Play size={16} />
              </button>

              {/* Static Waveform */}
              <div className="flex-1 flex items-center gap-0.5 h-8">
                {waveform.map((v, i) => (
                  <div
                    key={i}
                    className="w-1 bg-violet-500/60 rounded-full"
                    style={{ height: `${Math.max(4, v * 32)}px` }}
                  />
                ))}
              </div>

              <span className="font-mono text-sm text-[var(--synclulu-muted)]">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Safety Warning */}
            <AnimatePresence>
              {showSafetyWarning && safetyResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Inhalt geprüft
                      </p>
                      <p className="text-xs text-[var(--synclulu-muted)] mt-1">
                        {safetyResult.reason || 'Einige Wörter könnten als unangemessen betrachtet werden.'}
                      </p>
                      {safetyResult.flaggedWords && safetyResult.flaggedWords.length > 0 && (
                        <p className="text-xs text-amber-500 mt-1">
                          Erkannt: {safetyResult.flaggedWords.slice(0, 3).join(', ')}
                          {safetyResult.flaggedWords.length > 3 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={cancelRecording}
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--synclulu-surface)] text-[var(--synclulu-text)] text-sm hover:bg-[var(--synclulu-card)] transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => sendVoiceMemo(true)}
                      className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                    >
                      Trotzdem senden
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            {!showSafetyWarning && (
              <div className="flex items-center justify-between">
                <button
                  onClick={cancelRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--synclulu-surface)] text-[var(--synclulu-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                  Löschen
                </button>

                <button
                  onClick={() => sendVoiceMemo(false)}
                  disabled={isUploading || isCheckingSafety}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-70"
                >
                  {isCheckingSafety ? (
                    <>
                      <ShieldCheck size={18} className="animate-pulse" />
                      Prüfe...
                    </>
                  ) : isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Senden
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Expiry Note */}
            <p className="text-center text-xs text-[var(--synclulu-muted)] flex items-center justify-center gap-1">
              <Clock size={12} />
              Verfällt in 24 Stunden
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMemoRecorder;
