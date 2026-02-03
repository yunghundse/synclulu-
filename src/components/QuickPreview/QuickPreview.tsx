/**
 * QuickPreview.tsx
 * 🎧 NEBULA DESIGN SYSTEM v20.0 - Room Listener Preview
 *
 * Allows users to "listen in" to a room without joining fully.
 * Features audio visualization, haptic feedback, and smooth animations.
 *
 * @version 20.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X, UserPlus, Volume2, VolumeX } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface RoomPreview {
  id: string;
  name?: string;
  userCount?: number;
  creatorName?: string;
  creatorAvatar?: string;
  isActive?: boolean;
}

interface QuickPreviewProps {
  room: RoomPreview;
  onJoin: () => void;
  onClose: () => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO WAVE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AudioWaveVisualizer: React.FC<{ isActive: boolean }> = memo(({ isActive }) => {
  const bars = 7;

  return (
    <div className="audio-wave-container h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="audio-wave-bar"
          style={{ width: '4px' }}
          animate={isActive ? {
            height: [8, Math.random() * 24 + 12, 8],
          } : {
            height: 8,
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

AudioWaveVisualizer.displayName = 'AudioWaveVisualizer';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const QuickPreview: React.FC<QuickPreviewProps> = memo(({
  room,
  onJoin,
  onClose,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [listenDuration, setListenDuration] = useState(0);

  // Timer for listen duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isListening) {
      interval = setInterval(() => {
        setListenDuration(prev => prev + 1);
      }, 1000);
    } else {
      setListenDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  // Handle start listening
  const handleStartListening = useCallback(() => {
    triggerHaptic('medium');
    setIsListening(true);

    // Here you would connect to the room's audio stream
    console.log(`Started listening to room: ${room.id}`);
  }, [room.id]);

  // Handle stop listening
  const handleStopListening = useCallback(() => {
    triggerHaptic('light');
    setIsListening(false);

    // Here you would disconnect from the audio stream
    console.log(`Stopped listening to room: ${room.id}`);
  }, [room.id]);

  // Handle join room
  const handleJoin = useCallback(() => {
    triggerHaptic('heavy');
    setIsListening(false);
    onJoin();
  }, [onJoin]);

  // Handle close
  const handleClose = useCallback(() => {
    triggerHaptic('light');
    setIsListening(false);
    onClose();
  }, [onClose]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`listener-card relative ${className}`}
    >
      {/* Close button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                   rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <X size={16} className="text-gray-400" />
      </motion.button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Listener indicator */}
        <div className={`listener-indicator ${isListening ? 'active' : ''}`}>
          {isListening ? (
            <Volume2 size={24} className="text-purple-400" />
          ) : (
            <Headphones size={24} className="text-purple-400" />
          )}
        </div>

        {/* Room info */}
        <div className="flex-1">
          <h4 className="text-white font-bold text-base">
            {room.name || 'Nebula Raum'}
          </h4>
          <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">
            {isListening
              ? `Hörst zu • ${formatDuration(listenDuration)}`
              : `${room.userCount || 0} Personen aktiv`
            }
          </p>
        </div>

        {/* Listen/Stop button */}
        {!isListening ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleStartListening}
            className="btn-aura px-5 py-3 text-[12px] font-bold"
          >
            <span className="flex items-center gap-2">
              <Headphones size={16} />
              REINHÖREN
            </span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleStopListening}
            className="px-5 py-3 bg-red-500/10 text-red-400 rounded-2xl
                       text-[12px] font-bold border border-red-500/30
                       hover:bg-red-500/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <VolumeX size={16} />
              STOPP
            </span>
          </motion.button>
        )}
      </div>

      {/* Audio visualization (expanded when listening) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Audio wave visualization */}
            <div className="flex items-center justify-center py-4 mb-4">
              <div className="audio-shimmer relative px-8 py-4 rounded-2xl bg-white/5">
                <AudioWaveVisualizer isActive={isListening} />
              </div>
            </div>

            {/* Creator info */}
            {room.creatorAvatar && (
              <div className="flex items-center gap-3 mb-4 px-2">
                <img
                  src={room.creatorAvatar}
                  alt="Creator"
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
                <span className="text-sm text-gray-400">
                  Erstellt von <span className="text-white font-medium">{room.creatorName}</span>
                </span>
              </div>
            )}

            {/* Join button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              className="btn-aura-primary w-full flex items-center justify-center gap-3"
            >
              <UserPlus size={20} />
              <span className="font-black tracking-wide">RAUM BETRETEN</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick join hint when not listening */}
      {!isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="text-xs text-gray-500">
            Tippe auf "Reinhören" um den Vibe zu spüren
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});

QuickPreview.displayName = 'QuickPreview';

export default QuickPreview;
