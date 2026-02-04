/**
 * VoiceRoom.tsx
 * 🎤 DYNAMIC VOICE-CLOUD - Adaptive Room Grid mit Psycho-Akustik
 *
 * Features:
 * - Adaptives Grid (1-2, 3-6, 7+ Personen)
 * - Voice-Activation-Glow mit emotionalen Aura-Farben
 * - Echtzeit Audio-Analyse via Web Audio API
 * - XP-Progression während des Sprechens
 * - Room Controls (Mic, Speaker, Leave)
 *
 * @version 1.0.0 - Voice Cloud Edition
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Crown,
  MapPin,
  Zap,
  Sparkles,
  Radio,
  Settings,
  Share2,
  MoreVertical,
  Lock,
  Globe,
} from 'lucide-react';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, Timestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceAnalyzer, AuraColor, AuraState, getAuraGlow } from '@/lib/voiceAudioAnalyzer';
import { triggerHaptic } from '@/lib/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface RoomParticipant {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
  level: number;
  city?: string;
  isHost: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  auraState: AuraState;
  auraColor: AuraColor;
  joinedAt: number;
  speakingTime: number; // Seconds of speaking
}

interface RoomData {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  isPrivate: boolean;
  maxParticipants: number;
  participants: string[];
  createdAt: number;
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const XP_PER_MINUTE_SPEAKING = 5;
const XP_PER_MINUTE_LISTENING = 1;

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPANT TILE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ParticipantTileProps {
  participant: RoomParticipant;
  size: 'large' | 'medium' | 'small';
  isCurrentUser: boolean;
  isActiveSpeaker: boolean;
}

const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  size,
  isCurrentUser,
  isActiveSpeaker,
}) => {
  const sizeClasses = {
    large: 'w-full aspect-square max-w-[280px]',
    medium: 'w-full aspect-square',
    small: 'w-full aspect-[4/3]',
  };

  const avatarSizes = {
    large: 'w-28 h-28',
    medium: 'w-20 h-20',
    small: 'w-14 h-14',
  };

  const nameSizes = {
    large: 'text-lg',
    medium: 'text-base',
    small: 'text-sm',
  };

  // Dynamic glow based on speaking state
  const glowStyle = participant.isSpeaking
    ? {
        boxShadow: getAuraGlow(participant.auraColor, true),
        transition: 'box-shadow 0.3s ease',
      }
    : {};

  // Pulsing animation for active speaker
  const pulseAnimation = participant.isSpeaking
    ? {
        scale: [1, 1.02, 1],
        transition: { duration: 0.5, repeat: Infinity },
      }
    : {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, ...pulseAnimation }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative ${sizeClasses[size]} rounded-3xl overflow-hidden flex flex-col items-center justify-center p-4`}
      style={{
        background: participant.isSpeaking
          ? `linear-gradient(135deg, ${participant.auraColor.primary}, ${participant.auraColor.secondary})`
          : 'rgba(255, 255, 255, 0.03)',
        border: participant.isSpeaking
          ? `2px solid ${participant.auraColor.primary}`
          : '1px solid rgba(255, 255, 255, 0.08)',
        ...glowStyle,
      }}
    >
      {/* Host Badge */}
      {participant.isHost && (
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded-full flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.1))',
            border: '1px solid rgba(251, 191, 36, 0.4)',
          }}
        >
          <Crown size={10} className="text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400">HOST</span>
        </div>
      )}

      {/* Muted Indicator */}
      {participant.isMuted && (
        <div
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239, 68, 68, 0.3)' }}
        >
          <MicOff size={14} className="text-red-400" />
        </div>
      )}

      {/* Avatar with Aura Ring */}
      <div className="relative mb-3">
        {/* Animated Aura Ring */}
        {participant.isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${participant.auraColor.glow} 0%, transparent 70%)`,
              transform: 'scale(1.5)',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1.4, 1.6, 1.4],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Avatar */}
        <motion.div
          className={`relative ${avatarSizes[size]} rounded-full overflow-hidden`}
          style={{
            border: participant.isSpeaking
              ? `3px solid ${participant.auraColor.primary}`
              : '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: participant.isSpeaking
              ? `0 0 20px ${participant.auraColor.glow}`
              : 'none',
          }}
          animate={participant.isSpeaking ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {participant.photoURL ? (
            <img
              src={participant.photoURL}
              alt={participant.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a0a2e, #16082a)' }}
            >
              <span className="text-2xl font-black text-white/60">
                {participant.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>

        {/* Level Badge */}
        <div
          className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)',
          }}
        >
          <span className="text-[10px] font-black text-white">LV.{participant.level}</span>
        </div>
      </div>

      {/* Name */}
      <p className={`${nameSizes[size]} font-bold text-white text-center truncate max-w-full`}>
        {participant.displayName}
        {isCurrentUser && <span className="text-white/40 ml-1">(Du)</span>}
      </p>

      {/* Username & City */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-white/40">@{participant.username}</span>
        {participant.city && (
          <>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-white/30" />
              <span className="text-xs text-white/30">{participant.city}</span>
            </div>
          </>
        )}
      </div>

      {/* Speaking Time (for larger tiles) */}
      {size !== 'small' && participant.speakingTime > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Radio size={12} className="text-purple-400" />
          <span className="text-[10px] text-purple-400">
            {Math.floor(participant.speakingTime / 60)}:{String(participant.speakingTime % 60).padStart(2, '0')} gesprochen
          </span>
        </div>
      )}

      {/* Active Speaker Indicator */}
      {isActiveSpeaker && (
        <motion.div
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <span className="text-[10px] font-bold text-green-400">SPRICHT</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTIVE ROOM GRID
// ═══════════════════════════════════════════════════════════════════════════

interface AdaptiveRoomGridProps {
  participants: RoomParticipant[];
  currentUserId: string;
  activeSpeakerId?: string;
}

const AdaptiveRoomGrid: React.FC<AdaptiveRoomGridProps> = ({
  participants,
  currentUserId,
  activeSpeakerId,
}) => {
  const count = participants.length;

  // Determine grid layout based on participant count
  const getGridClass = () => {
    if (count <= 2) return 'grid-cols-1 gap-6 max-w-md mx-auto';
    if (count <= 4) return 'grid-cols-2 gap-4';
    if (count <= 6) return 'grid-cols-2 gap-3';
    return 'grid-cols-3 gap-2';
  };

  const getTileSize = (): 'large' | 'medium' | 'small' => {
    if (count <= 2) return 'large';
    if (count <= 6) return 'medium';
    return 'small';
  };

  // Sort: Active speaker first, then host, then by join time
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.id === activeSpeakerId) return -1;
      if (b.id === activeSpeakerId) return 1;
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      return a.joinedAt - b.joinedAt;
    });
  }, [participants, activeSpeakerId]);

  return (
    <div className={`grid ${getGridClass()} w-full px-4`}>
      <AnimatePresence mode="popLayout">
        {sortedParticipants.map((participant) => (
          <ParticipantTile
            key={participant.id}
            participant={participant}
            size={getTileSize()}
            isCurrentUser={participant.id === currentUserId}
            isActiveSpeaker={participant.id === activeSpeakerId}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// XP PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════

interface XPProgressBarProps {
  currentXP: number;
  sessionXP: number;
  isSpeaking: boolean;
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({ currentXP, sessionXP, isSpeaking }) => {
  return (
    <motion.div
      className="absolute bottom-24 left-4 right-4 p-3 rounded-2xl"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-white/70">Session XP</span>
        </div>
        <motion.span
          className="text-sm font-black text-amber-400"
          animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          +{sessionXP} XP
        </motion.span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (sessionXP / 100) * 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-[10px] text-white/40 mt-1">
        {isSpeaking ? '🎤 Sprechen: +5 XP/Min' : '👂 Zuhören: +1 XP/Min'}
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOM CONTROLS DOCK
// ═══════════════════════════════════════════════════════════════════════════

interface RoomControlsProps {
  isMuted: boolean;
  isSpeakerOff: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onLeave: () => void;
  onSettings?: () => void;
}

const RoomControls: React.FC<RoomControlsProps> = ({
  isMuted,
  isSpeakerOff,
  onToggleMute,
  onToggleSpeaker,
  onLeave,
  onSettings,
}) => {
  return (
    <motion.div
      className="fixed bottom-6 left-4 right-4 flex items-center justify-center gap-4 p-4 rounded-3xl z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Mute Button */}
      <motion.button
        onClick={() => {
          triggerHaptic('medium');
          onToggleMute();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: isMuted
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1))'
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))',
          border: isMuted
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(34, 197, 94, 0.4)',
        }}
      >
        {isMuted ? (
          <MicOff size={24} className="text-red-400" />
        ) : (
          <Mic size={24} className="text-green-400" />
        )}
      </motion.button>

      {/* Speaker Button */}
      <motion.button
        onClick={() => {
          triggerHaptic('light');
          onToggleSpeaker();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: isSpeakerOff
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {isSpeakerOff ? (
          <VolumeX size={24} className="text-white/40" />
        ) : (
          <Volume2 size={24} className="text-white/70" />
        )}
      </motion.button>

      {/* Settings Button */}
      {onSettings && (
        <motion.button
          onClick={() => {
            triggerHaptic('light');
            onSettings();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Settings size={24} className="text-white/50" />
        </motion.button>
      )}

      {/* Leave Button */}
      <motion.button
        onClick={() => {
          triggerHaptic('heavy');
          onLeave();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.2))',
          border: '1px solid rgba(239, 68, 68, 0.5)',
        }}
      >
        <PhoneOff size={24} className="text-red-400" />
      </motion.button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INVITE MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface InviteModalProps {
  roomName: string;
  roomId: string;
  onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ roomName, roomId, onClose }) => {
  const [copied, setCopied] = useState(false);

  const inviteLink = `https://synclulu.vercel.app/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      triggerHaptic('medium');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} on synclulu`,
          text: `Hey! Komm in meinen Voice-Raum "${roomName}" auf synclulu!`,
          url: inviteLink,
        });
        triggerHaptic('success');
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f, #12121a)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1))',
              }}
            >
              <UserPlus size={28} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white">Freunde einladen</h3>
            <p className="text-sm text-white/50 mt-1">Teile den Link zu "{roomName}"</p>
          </div>

          {/* Link Preview */}
          <div
            className="p-4 rounded-2xl mb-4"
            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
          >
            <p className="text-xs text-white/40 font-mono break-all">{inviteLink}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl font-bold text-sm"
              style={{
                background: copied
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))'
                  : 'rgba(255, 255, 255, 0.05)',
                border: copied
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: copied ? '#22c55e' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {copied ? '✓ Kopiert!' : 'Link kopieren'}
            </motion.button>

            {navigator.share && (
              <motion.button
                onClick={handleShare}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1))',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#a855f7',
                }}
              >
                <Share2 size={16} />
                Teilen
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VOICE ROOM PAGE
// ═══════════════════════════════════════════════════════════════════════════

const VoiceRoom: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();

  // Room State
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Control State
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // XP Tracking
  const [sessionXP, setSessionXP] = useState(0);
  const sessionStartRef = useRef(Date.now());
  const speakingTimeRef = useRef(0);

  // Voice Analysis
  const {
    isActive: voiceActive,
    isSpeaking,
    level: voiceLevel,
    auraState,
    auraColor,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceAnalyzer({
    onSpeakingChange: (speaking) => {
      // Update speaking state in Firestore
      if (roomId && user?.id) {
        // Would update participant speaking state here
      }
    },
  });

  // Active Speaker Detection
  const activeSpeakerId = useMemo(() => {
    const speaking = participants.filter((p) => p.isSpeaking);
    if (speaking.length === 0) return undefined;
    // Return the one with highest voice level (in real implementation)
    return speaking[0]?.id;
  }, [participants]);

  // Toggle Mute
  const handleToggleMute = useCallback(async () => {
    if (isMuted) {
      // Unmute - start voice analysis
      const success = await startVoice();
      if (success) {
        setIsMuted(false);
      }
    } else {
      // Mute - stop voice analysis
      stopVoice();
      setIsMuted(true);
    }
  }, [isMuted, startVoice, stopVoice]);

  // Leave Room
  const handleLeave = useCallback(() => {
    stopVoice();
    triggerHaptic('heavy');
    navigate('/discover');
  }, [stopVoice, navigate]);

  // XP Accumulation Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMuted && isSpeaking) {
        // Speaking: +5 XP per minute
        speakingTimeRef.current += 1;
        if (speakingTimeRef.current % 12 === 0) {
          // Every 12 seconds = 1 XP (5 per minute)
          setSessionXP((prev) => prev + 1);
        }
      } else if (!isMuted) {
        // Listening: +1 XP per minute
        if (Math.random() < 0.017) {
          // ~1 per minute
          setSessionXP((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMuted, isSpeaking]);

  // Mock Room Data (in real implementation, fetch from Firestore)
  useEffect(() => {
    // Simulate loading room data
    const timer = setTimeout(() => {
      setRoom({
        id: roomId || 'demo',
        name: 'Late Night Talk',
        description: 'Chill vibes only 🌙',
        hostId: 'host123',
        isPrivate: false,
        maxParticipants: 10,
        participants: [],
        createdAt: Date.now(),
        tags: ['chill', 'night', 'talk'],
      });

      // Mock participants
      setParticipants([
        {
          id: user?.id || 'user1',
          displayName: user?.displayName || 'Du',
          username: user?.username || 'user',
          photoURL: user?.photoURL,
          level: 15,
          city: 'Berlin',
          isHost: false,
          isMuted: isMuted,
          isSpeaking: isSpeaking,
          auraState: auraState,
          auraColor: auraColor,
          joinedAt: Date.now(),
          speakingTime: speakingTimeRef.current,
        },
        {
          id: 'host123',
          displayName: 'Luna',
          username: 'luna_vibes',
          photoURL: undefined,
          level: 42,
          city: 'München',
          isHost: true,
          isMuted: false,
          isSpeaking: true,
          auraState: 'engaged',
          auraColor: {
            primary: 'rgba(234, 179, 8, 0.8)',
            secondary: 'rgba(250, 204, 21, 0.6)',
            glow: 'rgba(234, 179, 8, 0.6)',
            intensity: 0.7,
          },
          joinedAt: Date.now() - 300000,
          speakingTime: 180,
        },
        {
          id: 'user2',
          displayName: 'Max',
          username: 'max_sync',
          photoURL: undefined,
          level: 8,
          city: 'Hamburg',
          isHost: false,
          isMuted: true,
          isSpeaking: false,
          auraState: 'silent',
          auraColor: {
            primary: 'rgba(100, 100, 120, 0.3)',
            secondary: 'rgba(80, 80, 100, 0.2)',
            glow: 'rgba(100, 100, 120, 0)',
            intensity: 0,
          },
          joinedAt: Date.now() - 120000,
          speakingTime: 45,
        },
      ]);

      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [roomId, user, isMuted, isSpeaking, auraState, auraColor]);

  // Update current user's state in participants
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === user?.id
          ? {
              ...p,
              isMuted,
              isSpeaking: !isMuted && isSpeaking,
              auraState: !isMuted ? auraState : 'silent',
              auraColor: !isMuted ? auraColor : prev.find((x) => x.id === user?.id)?.auraColor || auraColor,
              speakingTime: speakingTimeRef.current,
            }
          : p
      )
    );
  }, [user?.id, isMuted, isSpeaking, auraState, auraColor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Radio size={40} className="text-purple-500" />
        </motion.div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Raum nicht gefunden'}</p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-2 rounded-xl bg-white/10 text-white/70"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-safe pb-32">
      {/* Room Header */}
      <div
        className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(to bottom, rgba(5, 5, 5, 1), rgba(5, 5, 5, 0.95))',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ArrowLeft size={20} className="text-white/70" />
        </motion.button>

        {/* Room Info */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-lg font-black text-white">{room.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            {room.isPrivate ? (
              <Lock size={12} className="text-amber-400" />
            ) : (
              <Globe size={12} className="text-green-400" />
            )}
            <span className="text-xs text-white/40">
              {participants.length} / {room.maxParticipants} Teilnehmer
            </span>
          </div>
        </div>

        {/* Invite Button */}
        <motion.button
          onClick={() => {
            triggerHaptic('light');
            setShowInviteModal(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <UserPlus size={18} className="text-purple-400" />
        </motion.button>
      </div>

      {/* Participant Grid */}
      <div className="py-6">
        <AdaptiveRoomGrid
          participants={participants}
          currentUserId={user?.id || ''}
          activeSpeakerId={activeSpeakerId}
        />
      </div>

      {/* Voice Level Indicator (when unmuted) */}
      {!isMuted && (
        <motion.div
          className="fixed bottom-44 left-4 right-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    height: `${8 + i * 2}px`,
                    background: i < voiceLevel / 10 ? auraColor.primary : 'rgba(255, 255, 255, 0.1)',
                  }}
                  animate={i < voiceLevel / 10 ? { scaleY: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                />
              ))}
            </div>
            <span className="text-xs text-white/50">
              {auraState === 'silent' && '🔇 Stille'}
              {auraState === 'whisper' && '🤫 Flüstern'}
              {auraState === 'normal' && '💬 Normal'}
              {auraState === 'engaged' && '🗣️ Engagiert'}
              {auraState === 'excited' && '🎉 Aufgeregt'}
              {auraState === 'loud' && '🔊 Laut!'}
            </span>
          </div>
        </motion.div>
      )}

      {/* XP Progress Bar */}
      <XPProgressBar currentXP={0} sessionXP={sessionXP} isSpeaking={!isMuted && isSpeaking} />

      {/* Room Controls Dock */}
      <RoomControls
        isMuted={isMuted}
        isSpeakerOff={isSpeakerOff}
        onToggleMute={handleToggleMute}
        onToggleSpeaker={() => setIsSpeakerOff(!isSpeakerOff)}
        onLeave={handleLeave}
      />

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            roomName={room.name}
            roomId={room.id}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRoom;
