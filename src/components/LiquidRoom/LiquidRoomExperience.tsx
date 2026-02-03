/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIQUID ROOM EXPERIENCE - Fluid Nebula v14.0 Glow-Engine Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Immersive cloud room with:
 * - Deep Nebula animated mesh gradient background
 * - Liquid blob avatars with SVG morphing
 * - Force-directed layout (gravity + repulsion)
 * - Web Audio API visualizer rings
 * - Glassmorphism control bar
 * - 🌟 GLOW-ENGINE: Enhanced box-shadow system
 * - ⚡ AURA-LINES: Connections between interacting users
 * - 👻 GHOST MODE: Silent founder entry
 *
 * @author Lead UI/UX (Apple Vision Pro) × Creative Director (Spotify)
 * @version 14.0.0 - Fluid Nebula Glow-Engine
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Mic, MicOff, PhoneOff, UserPlus, Settings, Sparkles, Crown, Volume2 } from 'lucide-react';
import { LiquidAvatar } from './LiquidAvatar';
import { useForceLayout } from './useForceLayout';
import { useAudioVisualizer } from './useAudioVisualizer';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RoomParticipant {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  isPremium: boolean;
  isFounder: boolean;
  isGhost?: boolean; // 👻 Ghost mode for silent entry
  level: number;
  audioLevel: number; // 0-1
}

interface LiquidRoomProps {
  roomId: string;
  roomName: string;
  participants: RoomParticipant[];
  currentUserId: string;
  onLeave: () => void;
  onMuteToggle: () => void;
  onSendFriendRequest: (userId: string) => void;
  isMuted: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AURA-LINES COMPONENT - Connections between active speakers
// ═══════════════════════════════════════════════════════════════════════════════

interface AuraLinesProps {
  participants: RoomParticipant[];
  positions: { x: number; y: number }[];
  containerSize: { width: number; height: number };
}

const AuraLines = ({ participants, positions, containerSize }: AuraLinesProps) => {
  // Find pairs of speaking users to connect
  const speakingPairs: [number, number][] = [];
  const speakingIndices = participants
    .map((p, i) => (p.isSpeaking ? i : -1))
    .filter(i => i !== -1);

  // Create connections between speaking users
  for (let i = 0; i < speakingIndices.length; i++) {
    for (let j = i + 1; j < speakingIndices.length; j++) {
      speakingPairs.push([speakingIndices[i], speakingIndices[j]]);
    }
  }

  if (speakingPairs.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-5"
      width={containerSize.width}
      height={containerSize.height}
    >
      <defs>
        <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.6)" />
          <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
        </linearGradient>
        <filter id="auraGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {speakingPairs.map(([i, j], idx) => {
        const pos1 = positions[i];
        const pos2 = positions[j];
        if (!pos1 || !pos2) return null;

        // Average audio level for line intensity
        const avgLevel = (participants[i].audioLevel + participants[j].audioLevel) / 2;
        const opacity = 0.3 + avgLevel * 0.5;

        return (
          <motion.line
            key={`aura-${idx}`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke="url(#auraGradient)"
            strokeWidth={2 + avgLevel * 3}
            strokeLinecap="round"
            filter="url(#auraGlow)"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{
              opacity,
              pathLength: 1,
              strokeDashoffset: [0, -20],
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.3 },
              strokeDashoffset: { duration: 2, repeat: Infinity, ease: 'linear' },
            }}
            strokeDasharray="10 5"
          />
        );
      })}

      {/* Energy particles along the lines */}
      {speakingPairs.map(([i, j], idx) => {
        const pos1 = positions[i];
        const pos2 = positions[j];
        if (!pos1 || !pos2) return null;

        return (
          <motion.circle
            key={`particle-${idx}`}
            r={3}
            fill="rgba(168, 85, 247, 0.8)"
            filter="url(#auraGlow)"
            initial={{ opacity: 0 }}
            animate={{
              cx: [pos1.x, pos2.x],
              cy: [pos1.y, pos2.y],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEBULA BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const NebulaBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #1a1b3b 0%, #0d0d12 50%, #050507 100%)',
        }}
      />

      {/* Animated nebula orbs */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
          top: '-20%',
          left: '-15%',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.2, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 60%)',
          bottom: '-10%',
          right: '-10%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -80, -40, 0],
          y: [0, -60, -30, 0],
          scale: [1.1, 1, 1.15, 1.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particle dust */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM CONTROL BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface ControlBarProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onLeave: () => void;
  onSettings?: () => void;
  participantCount: number;
}

const GlassControlBar = ({
  isMuted,
  onMuteToggle,
  onLeave,
  onSettings,
  participantCount
}: ControlBarProps) => {
  return (
    <motion.div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', damping: 20 }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* Participant count */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/70 font-medium">
            {participantCount}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Mute button */}
        <ControlButton
          onClick={onMuteToggle}
          isActive={!isMuted}
          activeColor="rgba(139, 92, 246, 0.3)"
          icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          label={isMuted ? 'Unmute' : 'Mute'}
        />

        {/* Settings button */}
        <ControlButton
          onClick={onSettings}
          icon={<Settings size={20} />}
          label="Settings"
        />

        {/* Leave button */}
        <ControlButton
          onClick={onLeave}
          isDestructive
          icon={<PhoneOff size={20} />}
          label="Leave"
        />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROL BUTTON WITH RIPPLE
// ═══════════════════════════════════════════════════════════════════════════════

interface ControlButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDestructive?: boolean;
  activeColor?: string;
}

const ControlButton = ({
  onClick,
  icon,
  label,
  isActive,
  isDestructive,
  activeColor = 'rgba(255, 255, 255, 0.1)'
}: ControlButtonProps) => {
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setTimeout(() => setRipple(null), 600);
    onClick?.();
  };

  return (
    <motion.button
      className="relative p-3 rounded-2xl overflow-hidden"
      style={{
        background: isActive
          ? activeColor
          : isDestructive
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${
          isDestructive
            ? 'rgba(239, 68, 68, 0.3)'
            : 'rgba(255, 255, 255, 0.08)'
        }`,
      }}
      whileHover={{ scale: 1.05, background: isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)' }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      title={label}
    >
      <span style={{ color: isDestructive ? '#EF4444' : isActive ? '#A78BFA' : '#fff' }}>
        {icon}
      </span>

      {/* Ripple effect */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ width: 100, height: 100, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM HEADER
// ═══════════════════════════════════════════════════════════════════════════════

const RoomHeader = ({ roomName, participantCount }: { roomName: string; participantCount: number }) => {
  return (
    <motion.div
      className="absolute top-6 left-1/2 -translate-x-1/2 z-40"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Sparkles size={18} className="text-purple-400" />
        <span className="text-white font-medium">{roomName}</span>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-white/50 text-sm">{participantCount} im Raum</span>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LIQUID ROOM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const LiquidRoomExperience = ({
  roomId,
  roomName,
  participants,
  currentUserId,
  onLeave,
  onMuteToggle,
  onSendFriendRequest,
  isMuted,
}: LiquidRoomProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Force-directed layout positions
  const positions = useForceLayout(participants, containerSize);

  // Calculate blob size based on participant count
  const getBlobSize = (participantCount: number): number => {
    if (participantCount <= 2) return 140;
    if (participantCount <= 4) return 120;
    if (participantCount <= 6) return 100;
    return 80;
  };

  const blobSize = getBlobSize(participants.length);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen overflow-hidden"
    >
      {/* Nebula Background */}
      <NebulaBackground />

      {/* Room Header */}
      <RoomHeader roomName={roomName} participantCount={participants.length} />

      {/* ⚡ Aura-Lines between interacting users */}
      <AuraLines
        participants={participants}
        positions={positions}
        containerSize={containerSize}
      />

      {/* Floating Avatars - Glow-Engine Enhanced */}
      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="popLayout">
          {participants.map((participant, index) => {
            const position = positions[index] || { x: containerSize.width / 2, y: containerSize.height / 2 };

            return (
              <motion.div
                key={participant.id}
                className="absolute"
                style={{
                  left: position.x - blobSize / 2,
                  top: position.y - blobSize / 2,
                  zIndex: participant.isSpeaking ? 30 : participant.isGhost ? 15 : 20,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: participant.isGhost ? 0.95 : 1,
                  opacity: participant.isGhost ? 0.7 : 1,
                  x: 0,
                  y: 0,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  transition: { duration: participant.isGhost ? 0.8 : 0.3 }
                }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 200,
                  delay: participant.isGhost ? 0 : index * 0.1,
                }}
                layout
              >
                <LiquidAvatar
                  participant={participant}
                  size={blobSize}
                  isSelected={selectedUser === participant.id}
                  isCurrentUser={participant.id === currentUserId}
                  isGhost={participant.isGhost}
                  onClick={() => setSelectedUser(
                    selectedUser === participant.id ? null : participant.id
                  )}
                  onSendFriendRequest={() => onSendFriendRequest(participant.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {participants.length === 0 && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '2px dashed rgba(139, 92, 246, 0.3)',
            }}
          >
            <Volume2 size={32} className="text-purple-400/50" />
          </div>
          <p className="text-white/40 text-center">
            Warte auf andere Träumer...
          </p>
        </motion.div>
      )}

      {/* Glass Control Bar */}
      <GlassControlBar
        isMuted={isMuted}
        onMuteToggle={onMuteToggle}
        onLeave={onLeave}
        participantCount={participants.length}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

export default LiquidRoomExperience;
