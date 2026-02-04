/**
 * VOICE MEMO PLAYER v3.5
 * "Die pulsierende Wolke"
 *
 * Sprachnachricht als animierte Wolke im Chat-Verlauf.
 * Pulsiert im Rhythmus der Audio-Frequenzen beim Abspielen.
 *
 * @version 3.5.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Cloud, Clock } from 'lucide-react';
import { VoiceMemo } from './VoiceMemoRecorder';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface VoiceMemoPlayerProps {
  memo: VoiceMemo;
  isOwn?: boolean;
  onPlay?: () => void;
  onExpire?: () => void;
}

// ═══════════════════════════════════════
// VOICE MEMO PLAYER COMPONENT
// ═══════════════════════════════════════

const VoiceMemoPlayer: React.FC<VoiceMemoPlayerProps> = ({
  memo,
  isOwn = false,
  onPlay,
  onExpire,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(memo.waveform || []);
  const [liveFrequency, setLiveFrequency] = useState<number[]>(Array(20).fill(0.1));
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Calculate time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(memo.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Abgelaufen');
        onExpire?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [memo.expiresAt, onExpire]);

  // Generate fallback waveform if not provided
  useEffect(() => {
    if (!memo.waveform || memo.waveform.length === 0) {
      setWaveformData(Array(30).fill(0).map(() => 0.3 + Math.random() * 0.7));
    }
  }, [memo.waveform]);

  // Setup audio analyser for live visualization
  const setupAnalyser = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  }, []);

  // Update frequency data during playback
  const updateFrequency = useCallback(() => {
    if (analyserRef.current && isPlaying) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray.slice(0, 20)).map(v => Math.max(0.1, v / 255));
      setLiveFrequency(normalized);
      animationRef.current = requestAnimationFrame(updateFrequency);
    }
  }, [isPlaying]);

  // Handle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      try {
        setupAnalyser();
        await audioRef.current.play();
        setIsPlaying(true);
        onPlay?.();
        updateFrequency();
      } catch (err) {
        console.error('Playback error:', err);
      }
    }
  }, [isPlaying, setupAnalyser, updateFrequency, onPlay]);

  // Track progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setLiveFrequency(Array(20).fill(0.1));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`
          relative max-w-[280px] rounded-2xl p-4
          ${isOwn
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
            : 'bg-[var(--synclulu-card)] text-[var(--synclulu-text)] border border-[var(--synclulu-border)]'
          }
        `}
      >
        {/* Hidden Audio Element */}
        <audio ref={audioRef} src={memo.audioUrl} preload="metadata" />

        {/* Cloud Background (animated) */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-20">
          <motion.div
            className={`absolute -top-4 -left-4 w-24 h-24 rounded-full ${isOwn ? 'bg-white' : 'bg-violet-500'}`}
            animate={isPlaying ? {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${isOwn ? 'bg-white' : 'bg-violet-500'}`}
            animate={isPlaying ? {
              scale: [1.1, 1.3, 1.1],
              opacity: [0.2, 0.4, 0.2],
            } : {}}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={16} className={isOwn ? 'text-white/80' : 'text-violet-500'} />
            <span className={`text-xs font-medium ${isOwn ? 'text-white/80' : 'text-[var(--synclulu-muted)]'}`}>
              Cloud-Memo
            </span>
            <span className={`text-xs ml-auto flex items-center gap-1 ${isOwn ? 'text-white/60' : 'text-[var(--synclulu-muted)]'}`}>
              <Clock size={10} />
              {timeRemaining}
            </span>
          </div>

          {/* Player */}
          <div className="flex items-center gap-3">
            {/* Play Button */}
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.95 }}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${isOwn
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-violet-500 hover:bg-violet-600 text-white'
                }
                transition-colors
              `}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </motion.button>

            {/* Waveform / Frequency Visualizer */}
            <div className="flex-1 flex items-center gap-0.5 h-10">
              {isPlaying
                ? liveFrequency.map((v, i) => (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${isOwn ? 'bg-white' : 'bg-violet-500'}`}
                      animate={{ height: `${Math.max(4, v * 40)}px` }}
                      transition={{ duration: 0.05 }}
                    />
                  ))
                : waveformData.slice(0, 20).map((v, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${isOwn ? 'bg-white/60' : 'bg-violet-500/40'}`}
                      style={{ height: `${Math.max(4, v * 32)}px` }}
                    />
                  ))
              }
            </div>

            {/* Duration */}
            <span className={`text-sm font-mono ${isOwn ? 'text-white/80' : 'text-[var(--synclulu-muted)]'}`}>
              {formatDuration(memo.duration)}
            </span>
          </div>

          {/* Progress Bar */}
          {isPlaying && (
            <div className={`mt-2 h-0.5 rounded-full ${isOwn ? 'bg-white/20' : 'bg-violet-500/20'}`}>
              <motion.div
                className={`h-full rounded-full ${isOwn ? 'bg-white' : 'bg-violet-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Pulsing Glow Effect when playing */}
        {isPlaying && (
          <motion.div
            className={`absolute inset-0 rounded-2xl ${isOwn ? 'bg-white' : 'bg-violet-500'}`}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default VoiceMemoPlayer;
