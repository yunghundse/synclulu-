/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FLUID ROOM v19.0 - "Ultimate Fluidity" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Apple × Airbnb inspired "Emotional Engineering" room interface:
 * - Fluid Grid with Framer Motion layout animations
 * - Deep Glassmorphism (backdrop-blur-xl, border-white/10)
 * - Sovereign Styleguide (rounded-[32px], rounded-[40px])
 * - Haptic Feedback on all interactions
 * - Founder Glow Effect
 * - Swipe-to-minimize gesture
 * - User interaction menu (Profile, Star, Mute)
 *
 * Grid Layouts:
 * - 1 person:  Full screen immersive
 * - 2 people:  2 vertical cards
 * - 3+ people: Adaptive 2-column grid
 *
 * @author Lead UI-Engineer (Apple) × Senior Interaction Designer (Airbnb)
 * @version 19.0.0 - Ultimate Fluidity Edition
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Star,
  UserPlus,
  Crown,
  Shield,
  VolumeX,
  MoreVertical,
  Sparkles,
  X,
  User,
  Volume2,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { roomService } from '@/lib/roomService';
import { presenceVault } from '@/lib/presenceVault';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Sovereign Styleguide
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Colors
const DEEP_BLACK = '#050505';
const NEBULA_PURPLE = '#A855F7';
const WHITE_90 = 'rgba(255, 255, 255, 0.9)';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GridParticipant {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  isPremium: boolean;
  isFounder: boolean;
  isGhost?: boolean;
  level: number;
  audioLevel: number;
}

interface StableGridRoomProps {
  roomId: string;
  roomName: string;
  participants: GridParticipant[];
  currentUserId: string;
  onLeave: () => void | Promise<void>;
  onMuteToggle: () => void;
  onKickUser?: (userId: string) => void;
  onMuteUser?: (userId: string) => void;
  onSendFriendRequest?: (userId: string) => void;
  isMuted: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 20, heavy: 40 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const cardVariants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

const speakingPulse = {
  scale: [1, 1.05, 1],
  transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
};

const menuVariants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 10 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER INTERACTION MENU
// ═══════════════════════════════════════════════════════════════════════════════

interface UserMenuProps {
  participant: GridParticipant;
  isVisible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onGiveStar: () => void;
  onMute?: () => void;
  canMute: boolean;
}

const UserMenu = memo(({
  participant,
  isVisible,
  onClose,
  onViewProfile,
  onGiveStar,
  onMute,
  canMute,
}: UserMenuProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      variants={menuVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="glass-card p-2 min-w-[160px] rounded-[24px] border border-white/10 backdrop-blur-xl bg-black/60">
        {/* View Profile */}
        <button
          onClick={() => { triggerHaptic('light'); onViewProfile(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-white/10 transition-colors text-white/90"
        >
          <User size={18} className="text-purple-400" />
          <span className="text-sm font-medium">Profil ansehen</span>
        </button>

        {/* Give Star */}
        <button
          onClick={() => { triggerHaptic('medium'); onGiveStar(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-white/10 transition-colors text-white/90"
        >
          <Star size={18} className="text-yellow-400" />
          <span className="text-sm font-medium">Stern schenken</span>
        </button>

        {/* Mute (if allowed) */}
        {canMute && onMute && (
          <button
            onClick={() => { triggerHaptic('light'); onMute(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] hover:bg-white/10 transition-colors text-white/90"
          >
            <VolumeX size={18} className="text-red-400" />
            <span className="text-sm font-medium">Stummschalten</span>
          </button>
        )}
      </div>
    </motion.div>
  );
});

UserMenu.displayName = 'UserMenu';

// ═══════════════════════════════════════════════════════════════════════════════
// FLUID USER CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface FluidUserCardProps {
  participant: GridParticipant;
  isCurrentUser: boolean;
  isFounderViewer: boolean;
  onViewProfile: () => void;
  onGiveStar: () => void;
  onMute?: () => void;
}

const FluidUserCard = memo(({
  participant,
  isCurrentUser,
  isFounderViewer,
  onViewProfile,
  onGiveStar,
  onMute,
}: FluidUserCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const isFounder = participant.isFounder || participant.id === FOUNDER_UID;

  const handleTap = () => {
    if (!isCurrentUser) {
      triggerHaptic('light');
      setShowMenu(!showMenu);
    }
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileTap={{ scale: 0.98 }}
      onClick={handleTap}
      className={`
        relative rounded-[40px] border flex flex-col items-center justify-center p-6
        transition-all duration-300 shadow-2xl cursor-pointer
        ${isCurrentUser
          ? 'border-purple-500/50 bg-white/5'
          : 'border-white/5 bg-[#111]'
        }
        ${isFounder ? 'ring-2 ring-purple-500/30' : ''}
      `}
      style={{
        boxShadow: isFounder
          ? '0 0 40px rgba(168, 85, 247, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Founder Glow Background */}
      {isFounder && (
        <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-fuchsia-600/10 animate-nebula-gradient" />
        </div>
      )}

      {/* Avatar with Speaking Animation */}
      <div className="relative group">
        <motion.div
          animate={participant.isSpeaking ? speakingPulse : {}}
          className="relative"
        >
          {participant.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={participant.displayName}
              className={`
                w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-2xl
                ${participant.isSpeaking
                  ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-[#111]'
                  : 'ring-2 ring-white/10'
                }
              `}
            />
          ) : (
            <div
              className={`
                w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600
                flex items-center justify-center shadow-2xl
                ${participant.isSpeaking
                  ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-[#111]'
                  : 'ring-2 ring-white/10'
                }
              `}
            >
              <span className="text-3xl font-bold text-white">
                {participant.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Muted Indicator */}
          {participant.isMuted && (
            <div className="absolute -bottom-1 -right-1 bg-red-500/90 rounded-full p-1.5 backdrop-blur-sm">
              <MicOff size={12} className="text-white" />
            </div>
          )}

          {/* Speaking Indicator */}
          {participant.isSpeaking && !participant.isMuted && (
            <div className="absolute -bottom-1 -right-1 bg-green-500/90 rounded-full p-1.5 backdrop-blur-sm">
              <Volume2 size={12} className="text-white" />
            </div>
          )}
        </motion.div>

        {/* Founder Badge */}
        {isFounder && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-2.5 py-1 rounded-full shadow-lg"
          >
            <div className="flex items-center gap-1">
              <Crown size={10} className="text-white" />
              <span className="text-[8px] font-black uppercase text-white">Founder</span>
            </div>
          </motion.div>
        )}

        {/* Host Badge */}
        {participant.isHost && !isFounder && (
          <div className="absolute -top-2 -right-2 bg-amber-500/90 px-2 py-0.5 rounded-full">
            <span className="text-[8px] font-black uppercase text-white">Host</span>
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className={`
        mt-4 font-bold text-sm uppercase tracking-widest
        ${isFounder ? 'text-purple-300' : 'text-white/80'}
      `}>
        {participant.displayName}
      </h3>

      {/* Level Badge */}
      <div className="mt-2 flex items-center gap-1.5 opacity-60">
        <Sparkles size={10} className="text-purple-400" />
        <span className="text-[10px] text-white/70">Level {participant.level}</span>
      </div>

      {/* User Interaction Menu */}
      <AnimatePresence>
        {showMenu && (
          <UserMenu
            participant={participant}
            isVisible={showMenu}
            onClose={() => setShowMenu(false)}
            onViewProfile={onViewProfile}
            onGiveStar={onGiveStar}
            onMute={onMute}
            canMute={isFounderViewer && !isCurrentUser}
          />
        )}
      </AnimatePresence>

      {/* Click Outside Handler */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
        />
      )}
    </motion.div>
  );
});

FluidUserCard.displayName = 'FluidUserCard';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM HEADER
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomHeaderProps {
  roomName: string;
  participants: GridParticipant[];
}

const RoomHeader = memo(({ roomName, participants }: RoomHeaderProps) => (
  <div className="h-20 flex items-center justify-between px-6 md:px-8 z-10 relative">
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
        Active Cloud
      </span>
      <h2 className="text-white font-bold text-lg">{roomName}</h2>
    </div>

    {/* Participant Avatars Preview */}
    <div className="flex -space-x-3">
      {participants.slice(0, 4).map((p) => (
        <div
          key={p.id}
          className={`
            w-8 h-8 rounded-full border-2 border-[${DEEP_BLACK}] overflow-hidden
            ${p.isFounder ? 'ring-1 ring-purple-500' : ''}
          `}
        >
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {p.displayName.charAt(0)}
              </span>
            </div>
          )}
        </div>
      ))}
      {participants.length > 4 && (
        <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-white/10 flex items-center justify-center">
          <span className="text-[10px] text-white/70">+{participants.length - 4}</span>
        </div>
      )}
    </div>
  </div>
));

RoomHeader.displayName = 'RoomHeader';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROL CENTER
// ═══════════════════════════════════════════════════════════════════════════════

interface ControlCenterProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  onLeave: () => void;
  isExiting: boolean;
}

const ControlCenter = memo(({
  isMuted,
  onMuteToggle,
  onLeave,
  isExiting,
}: ControlCenterProps) => {
  const handleMuteToggle = () => {
    triggerHaptic('light');
    onMuteToggle();
  };

  const handleLeave = () => {
    triggerHaptic('heavy');
    onLeave();
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-28 md:h-32 px-6 md:px-10 flex items-center justify-around
                 glass-nav border-t border-white/5 bg-black/40 backdrop-blur-3xl
                 mx-4 mb-4 rounded-[32px]"
    >
      {/* Mute Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleMuteToggle}
        className={`
          p-4 md:p-5 rounded-[24px] transition-all duration-300
          ${isMuted
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }
        `}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </motion.button>

      {/* Star Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => triggerHaptic('light')}
        className="p-4 md:p-5 rounded-[24px] bg-white/5 text-white hover:bg-white/10
                   border border-white/10 transition-all duration-300"
      >
        <Star size={24} className="text-yellow-400" />
      </motion.button>

      {/* Leave Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleLeave}
        disabled={isExiting}
        className={`
          px-8 md:px-10 py-4 md:py-5 rounded-[24px] font-black tracking-tight
          transition-all duration-300 shadow-xl
          ${isExiting
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-red-600 text-white shadow-red-900/40 hover:bg-red-500 active:scale-95'
          }
        `}
      >
        {isExiting ? 'WIRD BEENDET...' : 'VERLASSEN'}
      </motion.button>
    </motion.div>
  );
});

ControlCenter.displayName = 'ControlCenter';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FLUID ROOM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const StableGridRoom = ({
  roomId,
  roomName,
  participants,
  currentUserId,
  onLeave,
  onMuteToggle,
  onKickUser,
  onMuteUser,
  onSendFriendRequest,
  isMuted,
}: StableGridRoomProps) => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const isFounderViewer = currentUserId === FOUNDER_UID;

  // Handle safe exit
  const handleLeave = useCallback(async () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      await onLeave();
    } catch (error) {
      console.error('[FluidRoom] Exit error:', error);
    }

    navigate('/discover');
  }, [onLeave, navigate, isExiting]);

  // Swipe down to minimize (gesture)
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 0) {
      triggerHaptic('medium');
      handleLeave();
    }
  }, [handleLeave]);

  // Get grid classes based on participant count
  const getGridClasses = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ backgroundColor: DEEP_BLACK }}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-fuchsia-600/5 blur-[100px] pointer-events-none" />

      {/* Swipe Indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />

      {/* Header */}
      <RoomHeader roomName={roomName} participants={participants} />

      {/* Fluid Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <motion.div
          layout
          className={`grid gap-4 h-full ${getGridClasses(participants.length)}`}
        >
          <AnimatePresence mode="popLayout">
            {participants.map((participant) => (
              <FluidUserCard
                key={participant.id}
                participant={participant}
                isCurrentUser={participant.id === currentUserId}
                isFounderViewer={isFounderViewer}
                onViewProfile={() => {
                  navigate(`/user/${participant.id}`);
                }}
                onGiveStar={() => {
                  console.log('[FluidRoom] Give star to:', participant.id);
                  // TODO: Integrate with SanctuaryStarTransfer
                }}
                onMute={onMuteUser ? () => onMuteUser(participant.id) : undefined}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Control Center */}
      <ControlCenter
        isMuted={isMuted}
        onMuteToggle={onMuteToggle}
        onLeave={handleLeave}
        isExiting={isExiting}
      />
    </motion.div>
  );
};

export default StableGridRoom;
