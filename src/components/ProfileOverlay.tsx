/**
 * ProfileOverlay.tsx
 * 👤 PROFILE OVERLAY - In-Room User Interaction
 *
 * Features:
 * - View user level & performance
 * - Send friend request
 * - Give star
 * - Sovereign Glass design
 *
 * @version 35.1.0 - Room Interaction Edition
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  UserPlus,
  Crown,
  Zap,
  Clock,
  Mic,
  MicOff,
  Shield,
  Check,
  Loader2,
} from 'lucide-react';
import { getAscensionTier, getLevelFromXP } from '@/lib/ascensionSystem';
import { sendFriendRequest, giveStarToUser } from '@/lib/roomManagement';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    oderId: string;
    displayName: string;
    photoURL?: string;
    level?: number;
    xp?: number;
    isSpeaking?: boolean;
    isMuted?: boolean;
    isHost?: boolean;
    joinedAt?: Date;
    stars?: number;
    voiceMinutes?: number;
    roomsVisited?: number;
  };
  currentUserId: string;
  isAnonymousRoom?: boolean;
}

export default function ProfileOverlay({
  isOpen,
  onClose,
  user,
  currentUserId,
  isAnonymousRoom = false,
}: ProfileOverlayProps) {
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [givingStar, setGivingStar] = useState(false);
  const [starGiven, setStarGiven] = useState(false);

  // Calculate level info
  const level = user.level || getLevelFromXP(user.xp || 0).level;
  const tier = getAscensionTier(level);

  // Calculate time in room
  const getTimeInRoom = () => {
    if (!user.joinedAt) return '0m';
    const mins = Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleSendFriendRequest = async () => {
    if (sendingRequest || requestSent || user.oderId === currentUserId) return;

    setSendingRequest(true);
    const success = await sendFriendRequest(currentUserId, user.oderId);
    setSendingRequest(false);

    if (success) {
      setRequestSent(true);
    }
  };

  const handleGiveStar = async () => {
    if (givingStar || starGiven || user.oderId === currentUserId) return;

    setGivingStar(true);
    const success = await giveStarToUser(currentUserId, user.oderId);
    setGivingStar(false);

    if (success) {
      setStarGiven(true);
    }
  };

  const isSelf = user.oderId === currentUserId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(5, 5, 5, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `0 0 40px ${tier.glowColor}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div
              className="relative h-24"
              style={{
                background: tier.gradient,
                opacity: 0.8,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/30"
              >
                <X size={16} className="text-white" />
              </button>

              {/* Host badge */}
              {user.isHost && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center gap-1">
                  <Crown size={12} className="text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">HOST</span>
                </div>
              )}
            </div>

            {/* Avatar - overlapping header */}
            <div className="relative px-6 -mt-12">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold"
                style={{
                  background: isAnonymousRoom
                    ? 'rgba(168, 85, 247, 0.3)'
                    : user.photoURL
                    ? `url(${user.photoURL}) center/cover`
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `3px solid ${tier.color}`,
                  boxShadow: `0 0 20px ${tier.glowColor}`,
                  color: 'white',
                }}
              >
                {!user.photoURL && !isAnonymousRoom && user.displayName?.[0]?.toUpperCase()}
                {isAnonymousRoom && '?'}
              </div>
            </div>

            {/* User Info */}
            <div className="px-6 pt-4 pb-6">
              {/* Name & Level */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">
                  {isAnonymousRoom ? 'Wanderer' : user.displayName}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${tier.color}20`,
                      color: tier.color,
                      border: `1px solid ${tier.color}40`,
                    }}
                  >
                    {tier.titleDE} Lvl {level}
                  </span>
                  {user.isSpeaking && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                      <Mic size={10} />
                      Spricht
                    </span>
                  )}
                  {user.isMuted && !user.isSpeaking && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                      <MicOff size={10} />
                      Stumm
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {/* Stars */}
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Star size={16} className="text-amber-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{user.stars || 0}</p>
                  <p className="text-white/40 text-[10px]">Sterne</p>
                </div>

                {/* Voice Minutes */}
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Mic size={16} className="text-purple-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{user.voiceMinutes || 0}m</p>
                  <p className="text-white/40 text-[10px]">Sprechzeit</p>
                </div>

                {/* Rooms Visited */}
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Zap size={16} className="text-cyan-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{user.roomsVisited || 0}</p>
                  <p className="text-white/40 text-[10px]">Räume</p>
                </div>
              </div>

              {/* Time in Room */}
              <div
                className="flex items-center justify-center gap-2 p-3 rounded-xl mb-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Clock size={14} className="text-white/40" />
                <span className="text-sm text-white/60">
                  Im Raum seit <span className="text-white font-semibold">{getTimeInRoom()}</span>
                </span>
              </div>

              {/* Action Buttons */}
              {!isSelf && !isAnonymousRoom && (
                <div className="flex gap-3">
                  {/* Friend Request */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendFriendRequest}
                    disabled={sendingRequest || requestSent}
                    className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white disabled:opacity-50"
                    style={{
                      background: requestSent
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(168, 85, 247, 0.2)',
                      border: requestSent
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    {sendingRequest ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : requestSent ? (
                      <>
                        <Check size={16} className="text-green-400" />
                        Gesendet
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} className="text-purple-400" />
                        Anfrage
                      </>
                    )}
                  </motion.button>

                  {/* Give Star */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGiveStar}
                    disabled={givingStar || starGiven}
                    className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white disabled:opacity-50"
                    style={{
                      background: starGiven
                        ? 'rgba(251, 191, 36, 0.2)'
                        : 'rgba(251, 191, 36, 0.15)',
                      border: starGiven
                        ? '1px solid rgba(251, 191, 36, 0.4)'
                        : '1px solid rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    {givingStar ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : starGiven ? (
                      <>
                        <Check size={16} className="text-amber-400" />
                        Vergeben
                      </>
                    ) : (
                      <>
                        <Star size={16} className="text-amber-400" />
                        Stern
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Self indicator */}
              {isSelf && (
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <p className="text-sm text-purple-400 font-medium">Das bist du!</p>
                </div>
              )}

              {/* Anonymous room notice */}
              {isAnonymousRoom && !isSelf && (
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Shield size={16} className="text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-white/50">
                    Anonymer Raum – Interaktionen sind deaktiviert
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
