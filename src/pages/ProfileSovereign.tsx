/**
 * ProfileSovereign.tsx
 * 👤 SOVEREIGN IDENTITY PROFILE - Instagram-Style mit synclulu Vibe
 *
 * Features:
 * - Header-Banner (uploadbar)
 * - Avatar links überlappend (Instagram-Style)
 * - Bio & Name mit 30-Tage Sperre
 * - Status-Emoji (60 Min Auto-Expire)
 * - Aura-Rating Panel (Glass-Design mit Glow-Sternen)
 * - Activity-Heatmap mit Top-Locations & Privatsphäre
 * - Level-Fortschritt mit flüssiger Animation
 * - KEINE Firebase UID Anzeige!
 *
 * @version 3.0.0 - Aura Presence Edition
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  Zap,
  Users,
  MessageCircle,
  Star,
  Trophy,
  Flame,
  Shield,
  Edit2,
  Share2,
  Camera,
  ImagePlus,
  MapPin,
  Clock,
  Sparkles,
  Check,
  X,
  Activity,
  Radio,
  Lock,
  Gift,
  UserPlus,
  ChevronRight,
  Target,
  Award,
  TrendingUp,
  Calendar,
  Mic,
} from 'lucide-react';
import { FriendsTrigger } from '../components/SovereignUI/FriendsTrigger';
import { useFriendsRealtime } from '../hooks/useFriendsRealtime';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { PanelGroup } from '../components/SovereignUI/UnifiedPanel';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════

const EMOJI_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const USERNAME_LOCK_DAYS = 30;

const STATUS_EMOJIS = [
  '😊', '🔥', '💜', '🎵', '✨', '💭', '🌙', '☀️',
  '🎮', '📚', '💪', '🧘', '🍿', '🎉', '😴', '🤔',
];

interface ProfileData {
  displayName: string;
  username: string;
  photoURL?: string;
  bannerURL?: string;
  bio?: string;
  statusEmoji?: string;
  statusEmojiTimestamp?: number;
  usernameLastChanged?: number;
  xp: number;
  isFounder: boolean;
  friendsCount: number;
  roomsJoined: number;
  messagesSent: number;
  daysActive: number;
  achievements: string[];
  topLocations: string[];
  auraRating: number;
  auraRatingCount: number;
  city?: string;
}

interface ActivityLocation {
  name: string;
  timeSpent: number; // in minutes
  syncRate: number; // percentage
  lastVisit: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const canChangeUsername = (lastChangedTimestamp?: number): boolean => {
  if (!lastChangedTimestamp) return true;
  const thirtyDaysInMs = USERNAME_LOCK_DAYS * 24 * 60 * 60 * 1000;
  const nextChangePossible = lastChangedTimestamp + thirtyDaysInMs;
  return Date.now() > nextChangePossible;
};

const getDaysUntilUsernameChange = (lastChangedTimestamp?: number): number => {
  if (!lastChangedTimestamp) return 0;
  const thirtyDaysInMs = USERNAME_LOCK_DAYS * 24 * 60 * 60 * 1000;
  const nextChangePossible = lastChangedTimestamp + thirtyDaysInMs;
  const remainingMs = nextChangePossible - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
};

const isEmojiExpired = (timestamp?: number): boolean => {
  if (!timestamp) return true;
  return Date.now() - timestamp > EMOJI_TIMEOUT_MS;
};

const getEmojiRemainingMinutes = (timestamp?: number): number => {
  if (!timestamp) return 0;
  const remaining = EMOJI_TIMEOUT_MS - (Date.now() - timestamp);
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
};

const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

// ═══════════════════════════════════════════════════════════════════════════
// HEADER BANNER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const HeaderBanner = ({
  bannerURL,
  isOwner,
  onUpload,
}: {
  bannerURL?: string;
  isOwner: boolean;
  onUpload: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative h-44 w-full overflow-hidden">
      {bannerURL ? (
        <img src={bannerURL} alt="Banner" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #0d0518 100%)' }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)' }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to top, #050505, transparent)' }}
      />
      {isOwner && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="hidden"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 right-4 p-2 rounded-xl flex items-center gap-2"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ImagePlus size={16} className="text-white/70" />
            <span className="text-xs text-white/70 font-medium">Banner</span>
          </motion.button>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR WITH STATUS EMOJI
// ═══════════════════════════════════════════════════════════════════════════

const ProfileAvatar = ({
  photoURL,
  displayName,
  isFounder,
  statusEmoji,
  emojiExpired,
  emojiMinutesLeft,
  isOwner,
  onAvatarUpload,
  onEmojiClick,
}: {
  photoURL?: string;
  displayName: string;
  isFounder: boolean;
  statusEmoji?: string;
  emojiExpired: boolean;
  emojiMinutesLeft: number;
  isOwner: boolean;
  onAvatarUpload: (file: File) => void;
  onEmojiClick: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

  return (
    <div className="relative -mt-16 ml-5">
      <motion.div
        className="relative w-28 h-28 rounded-full overflow-hidden"
        style={{ border: `4px solid #050505`, boxShadow: `0 0 30px ${accentColor}40` }}
      >
        <motion.div
          className="absolute -inset-1 rounded-full"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative w-full h-full rounded-full overflow-hidden z-10" style={{ background: '#050505' }}>
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
            >
              <span className="text-4xl font-black text-white/80">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        {isOwner && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && onAvatarUpload(e.target.files[0])}
              className="hidden"
            />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center z-20"
              style={{ background: accentColor, boxShadow: `0 2px 10px ${accentColor}50` }}
            >
              <Camera size={14} className="text-black" />
            </motion.button>
          </>
        )}
      </motion.div>
      {isFounder && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center z-30"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)' }}
        >
          <Crown size={18} className="text-black" />
        </motion.div>
      )}
      <motion.button
        onClick={onEmojiClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center z-30"
        style={{
          background: emojiExpired ? 'rgba(255, 255, 255, 0.1)' : `${accentColor}30`,
          border: `2px solid ${emojiExpired ? 'rgba(255, 255, 255, 0.2)' : accentColor}`,
          opacity: emojiExpired ? 0.5 : 1,
        }}
      >
        {statusEmoji && !emojiExpired ? (
          <span className="text-xl">{statusEmoji}</span>
        ) : (
          <Sparkles size={16} className="text-white/50" />
        )}
      </motion.button>
      {statusEmoji && !emojiExpired && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}
        >
          {emojiMinutesLeft}m
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EMOJI PICKER MODAL
// ═══════════════════════════════════════════════════════════════════════════

const EmojiPicker = ({
  isOpen,
  onClose,
  onSelect,
  currentEmoji,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm p-5 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.98), rgba(15, 10, 30, 0.98))',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Deine Stimmung</h3>
            <button onClick={onClose}><X size={20} className="text-white/40" /></button>
          </div>
          <p className="text-xs text-white/40 mb-4">Wähle einen Emoji. Er verschwindet automatisch nach 60 Minuten.</p>
          <div className="grid grid-cols-4 gap-3">
            {STATUS_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => { onSelect(emoji); onClose(); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: emoji === currentEmoji ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  border: emoji === currentEmoji ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
          {currentEmoji && (
            <motion.button
              onClick={() => { onSelect(''); onClose(); }}
              whileTap={{ scale: 0.95 }}
              className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-red-400"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              Status entfernen
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ═══════════════════════════════════════════════════════════════════════════
// AURA RATING PANEL (Glass-Design mit Glow-Sternen)
// ═══════════════════════════════════════════════════════════════════════════

const AuraRatingPanel = ({
  isOpen,
  onClose,
  rating,
  count,
  recentRatings,
}: {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  count: number;
  recentRatings?: { stars: number; from: string; date: string }[];
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

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
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 20, 50, 0.95), rgba(15, 10, 30, 0.98))',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              boxShadow: '0 0 80px rgba(251, 191, 36, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Glow */}
            <div
              className="p-6 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.1), transparent)' }}
            >
              {/* Animated Glow */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48"
                style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60 mb-3">
                  Aura-Rating
                </p>

                {/* Big Rating Number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl font-black text-white mb-2"
                  style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}
                >
                  {rating.toFixed(1)}
                </motion.div>

                {/* Animated Stars */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                    >
                      <Star
                        size={28}
                        className={i < fullStars ? 'text-amber-400' : 'text-white/20'}
                        fill={i < fullStars ? '#fbbf24' : 'transparent'}
                        style={i < fullStars ? { filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' } : {}}
                      />
                    </motion.div>
                  ))}
                </div>

                <p className="text-sm text-white/50">
                  Basierend auf <span className="text-amber-400 font-bold">{count}</span> Bewertungen
                </p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="px-6 pb-6">
              <div className="space-y-2 mb-4">
                {[5, 4, 3, 2, 1].map((stars) => {
                  // Simulate distribution based on rating
                  const percentage = stars === Math.round(rating) ? 60 : stars > rating ? 10 : 20;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5 w-16">
                        {[...Array(stars)].map((_, i) => (
                          <Star key={i} size={10} className="text-amber-400" fill="#fbbf24" />
                        ))}
                      </div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[10px] text-white/30 w-8 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>

              <div
                className="p-3 rounded-xl text-center"
                style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}
              >
                <p className="text-xs text-amber-400/80">
                  ⭐ Bewertungen werden nach Voice-Calls vergeben
                </p>
              </div>

              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white/60"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                Schließen
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL COMMAND OVERLAY (Full-Screen XP Status)
// ═══════════════════════════════════════════════════════════════════════════

interface LevelMilestone {
  level: number;
  title: string;
  reward: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

const LevelCommandOverlay = ({
  isOpen,
  onClose,
  level,
  currentXP,
  totalXP,
  neededXP,
  tier,
  accentColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  currentXP: number;
  totalXP: number;
  neededXP: number;
  tier: { name: string; badge: string };
  accentColor: string;
}) => {
  const milestones: LevelMilestone[] = [
    { level: 5, title: 'Newcomer', reward: 'Basic Aura', icon: <Sparkles size={16} />, unlocked: level >= 5 },
    { level: 10, title: 'Rising Star', reward: 'Custom Status', icon: <Star size={16} />, unlocked: level >= 10 },
    { level: 15, title: 'Connector', reward: 'Priority Match', icon: <Users size={16} />, unlocked: level >= 15 },
    { level: 25, title: 'Established', reward: 'Gold Badge', icon: <Award size={16} />, unlocked: level >= 25 },
    { level: 50, title: 'Elite', reward: 'Elite Frame', icon: <Crown size={16} />, unlocked: level >= 50 },
    { level: 100, title: 'Legendary', reward: 'Mythic Aura', icon: <Trophy size={16} />, unlocked: level >= 100 },
  ];

  const nextMilestone = milestones.find(m => !m.unlocked) || milestones[milestones.length - 1];
  const progress = Math.min(100, (currentXP / neededXP) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(5, 5, 5, 0.98)' }}
          onClick={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-safe">
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <X size={20} className="text-white/70" />
            </motion.button>
            <h1 className="text-lg font-black text-white">Level Command</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-20" onClick={(e) => e.stopPropagation()}>
            {/* Big Level Display */}
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="relative inline-block"
              >
                {/* Glow Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                    transform: 'scale(2)',
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Level Circle */}
                <div
                  className="relative w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                    border: `3px solid ${accentColor}`,
                    boxShadow: `0 0 40px ${accentColor}50`,
                  }}
                >
                  <div className="text-center">
                    <span className="text-4xl font-black text-white">{level}</span>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Level</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4"
              >
                <p className="text-xl font-bold text-white">{tier.badge} {tier.name}</p>
                <p className="text-sm text-white/40 mt-1">{totalXP.toLocaleString()} XP gesammelt</p>
              </motion.div>
            </div>

            {/* XP Progress to Next Level */}
            <div
              className="p-5 rounded-2xl mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white/70">Fortschritt zu Level {level + 1}</span>
                <span className="text-sm font-bold" style={{ color: accentColor }}>
                  {currentXP} / {neededXP} XP
                </span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                  />
                </motion.div>
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                Noch {neededXP - currentXP} XP bis zum nächsten Level
              </p>
            </div>

            {/* Milestones */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                <Target size={14} />
                Meilensteine
              </h3>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: milestone.unlocked
                        ? `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`
                        : 'rgba(255, 255, 255, 0.02)',
                      border: milestone.unlocked
                        ? `1px solid ${accentColor}30`
                        : '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: milestone.unlocked ? `${accentColor}20` : 'rgba(255, 255, 255, 0.05)',
                        color: milestone.unlocked ? accentColor : 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {milestone.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{milestone.title}</span>
                        <span className="text-[10px] text-white/30">LV.{milestone.level}</span>
                      </div>
                      <p className="text-xs text-white/40">{milestone.reward}</p>
                    </div>
                    {milestone.unlocked ? (
                      <Check size={16} className="text-green-400" />
                    ) : milestone === nextMilestone ? (
                      <ChevronRight size={16} className="text-white/30" />
                    ) : (
                      <Lock size={14} className="text-white/20" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* XP Sources */}
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                <TrendingUp size={14} />
                So verdienst du XP
              </h3>
              <div className="space-y-2 text-xs text-white/50">
                <div className="flex justify-between">
                  <span>🎤 Voice Chat (pro Minute)</span>
                  <span className="text-green-400">+5 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>👂 Zuhören (pro Minute)</span>
                  <span className="text-green-400">+1 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>👋 Neuen Freund hinzufügen</span>
                  <span className="text-green-400">+25 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>📨 Freund einladen</span>
                  <span className="text-green-400">+100 XP</span>
                </div>
                <div className="flex justify-between">
                  <span>⭐ Aura-Bewertung erhalten</span>
                  <span className="text-green-400">+10 XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AURA HISTORIE CARD
// ═══════════════════════════════════════════════════════════════════════════

interface AuraHistoryItem {
  type: 'sync' | 'star' | 'friend' | 'milestone';
  title: string;
  subtitle: string;
  timestamp: number;
  icon: React.ReactNode;
  color: string;
}

const AuraHistorieSection = ({ accentColor }: { accentColor: string }) => {
  // Mock data - in production this would come from Firestore
  const historyItems: AuraHistoryItem[] = [
    { type: 'sync', title: 'Late Night Talk', subtitle: '45 Min Sync', timestamp: Date.now() - 3600000, icon: <Mic size={14} />, color: '#22c55e' },
    { type: 'star', title: '5-Sterne erhalten', subtitle: 'von @luna_vibes', timestamp: Date.now() - 7200000, icon: <Star size={14} />, color: '#fbbf24' },
    { type: 'friend', title: 'Neuer Freund', subtitle: '@max_sync', timestamp: Date.now() - 86400000, icon: <UserPlus size={14} />, color: '#3b82f6' },
    { type: 'milestone', title: 'Level 15 erreicht!', subtitle: 'Priority Match freigeschaltet', timestamp: Date.now() - 172800000, icon: <Trophy size={14} />, color: '#a855f7' },
  ];

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Gerade eben';
    if (hours < 24) return `vor ${hours}h`;
    const days = Math.floor(hours / 24);
    return `vor ${days}d`;
  };

  return (
    <div className="space-y-3">
      {historyItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `${item.color}20`,
              border: `1px solid ${item.color}30`,
            }}
          >
            <span style={{ color: item.color }}>{item.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.title}</p>
            <p className="text-xs text-white/40">{item.subtitle}</p>
          </div>
          <span className="text-[10px] text-white/30">{formatTime(item.timestamp)}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BATTLE PASS TEASER CARD
// ═══════════════════════════════════════════════════════════════════════════

const BattlePassTeaser = ({ onInvite }: { onInvite: () => void }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1))',
        border: '1px solid rgba(168, 85, 247, 0.3)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={18} className="text-purple-400" />
          <span className="text-sm font-black text-white">BATTLE PASS</span>
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}
          >
            COMING SOON
          </div>
        </div>
        <p className="text-xs text-white/50">
          SUMMER 2026 - Bereite dich auf die Evolution vor.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* CTA Section */}
      <div className="p-4">
        <p className="text-xs text-white/60 mb-3">
          Sichere dir jetzt schon XP-Boosts für den Sommer!
        </p>

        <div className="flex gap-2">
          <motion.button
            onClick={onInvite}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: 'white',
            }}
          >
            <UserPlus size={16} />
            Freunde einladen
          </motion.button>

          <motion.button
            onClick={() => navigate('/battlepass')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-3 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ChevronRight size={18} className="text-white/50" />
          </motion.button>
        </div>

        <p className="text-[10px] text-white/30 mt-2 text-center">
          +100 XP pro eingeladenem Freund
        </p>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL COMMAND BUTTON
// ═══════════════════════════════════════════════════════════════════════════

const LevelCommandButton = ({
  level,
  progress,
  accentColor,
  onClick,
}: {
  level: number;
  progress: number;
  accentColor: string;
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full p-5 rounded-2xl flex items-center gap-4"
      style={{
        background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}30)`,
        border: `3px solid ${accentColor}`,
        boxShadow: `0 8px 40px ${accentColor}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
      }}
    >
      {/* Level Circle */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}70 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div
          className="relative w-18 h-18 rounded-full flex items-center justify-center"
          style={{
            width: '72px',
            height: '72px',
            background: `linear-gradient(135deg, ${accentColor}70, ${accentColor}50)`,
            border: `4px solid white`,
            boxShadow: `0 0 30px ${accentColor}70`,
          }}
        >
          <span className="text-3xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{level}</span>
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-black text-white">Dein Level</span>
          <ChevronRight size={20} className="text-white" />
        </div>
        <div className="h-4 bg-white/30 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, white, ${accentColor})`,
              boxShadow: `0 0 15px white`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, transparent 50%)' }}
            />
          </motion.div>
        </div>
        <p className="text-sm text-white/80 mt-2 font-medium">Tippe für Details & Meilensteine</p>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AURA RATING BUTTON (Clickable)
// ═══════════════════════════════════════════════════════════════════════════

const AuraRatingButton = ({
  rating,
  count,
  onClick,
}: {
  rating: number;
  count: number;
  onClick: () => void;
}) => {
  const fullStars = Math.floor(rating);

  if (count === 0) {
    return (
      <div className="flex items-center gap-2 text-white/30 text-sm">
        <Star size={14} className="text-white/20" />
        <span>Noch keine Bewertungen</span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))',
        border: '1px solid rgba(251, 191, 36, 0.2)',
      }}
    >
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < fullStars ? 'text-amber-400' : 'text-white/20'}
            fill={i < fullStars ? '#fbbf24' : 'transparent'}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-amber-400">{rating.toFixed(1)}</span>
      <span className="text-xs text-white/40">({count})</span>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY HEATMAP (Aura-Präsenz)
// ═══════════════════════════════════════════════════════════════════════════

const ActivityHeatmap = ({
  locations,
  isPrivate,
  city,
  isFriend,
}: {
  locations: ActivityLocation[];
  isPrivate: boolean;
  city?: string;
  isFriend: boolean;
}) => {
  // If not a friend and private, show blurred/city-only view
  const showDetailed = isFriend || !isPrivate;

  if (locations.length === 0) {
    return (
      <div className="text-center py-6">
        <Radio size={32} className="mx-auto text-white/20 mb-2" />
        <p className="text-xs text-white/30">Noch keine Aktivitätsdaten</p>
      </div>
    );
  }

  // Take top 3 locations
  const topLocations = [...locations].sort((a, b) => b.timeSpent - a.timeSpent).slice(0, 3);

  return (
    <div className="space-y-3">
      {showDetailed ? (
        // Detailed view for friends
        topLocations.map((location, index) => (
          <motion.div
            key={location.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative p-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(168, 85, 247, 0.1)',
            }}
          >
            {/* Pulsing indicator */}
            <motion.div
              className="absolute top-4 right-4 w-3 h-3 rounded-full"
              style={{ background: index === 0 ? '#a855f7' : 'rgba(168, 85, 247, 0.5)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
            />

            <div className="flex items-start gap-3">
              {/* Location Icon with rank */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                style={{
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1))'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <MapPin size={18} className={index === 0 ? 'text-purple-400' : 'text-white/40'} />
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                  style={{
                    background: index === 0 ? '#a855f7' : 'rgba(255, 255, 255, 0.1)',
                    color: index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{location.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-white/30" />
                    <span className="text-[10px] text-white/40">{formatTimeSpent(location.timeSpent)} verbracht</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={10} className="text-purple-400" />
                    <span className="text-[10px] text-purple-400">{location.syncRate}% Sync-Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #a855f7, #c084fc)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, location.syncRate)}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))
      ) : (
        // Privacy view - only show city
        <div
          className="p-6 rounded-2xl text-center relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Blurred overlay effect */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), transparent)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <div className="relative">
            <Lock size={24} className="mx-auto text-white/20 mb-3" />
            <p className="text-sm font-bold text-white/60 mb-1">
              {city || 'Unbekannt'}
            </p>
            <p className="text-[10px] text-white/30">
              Detaillierte Orte sind nur für Freunde sichtbar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StatCard = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) => (
  <div
    className="flex-1 p-4 rounded-2xl text-center"
    style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    }}
  >
    <div
      className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
      style={{ background: `${color}15` }}
    >
      {icon}
    </div>
    <p className="text-xl font-black text-white">{value}</p>
    <p className="text-[10px] text-white/40 font-medium">{label}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGE
// ═══════════════════════════════════════════════════════════════════════════

const AchievementBadge = ({
  icon,
  title,
  unlocked,
  color = '#a855f7',
}: {
  icon: string;
  title: string;
  unlocked: boolean;
  color?: string;
}) => (
  <motion.div
    whileHover={{ scale: unlocked ? 1.05 : 1 }}
    className="flex flex-col items-center gap-2 p-3 rounded-xl"
    style={{
      background: unlocked ? `${color}10` : 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${unlocked ? `${color}30` : 'rgba(255, 255, 255, 0.05)'}`,
      opacity: unlocked ? 1 : 0.4,
    }}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-[9px] font-bold text-white/60 text-center">{title}</span>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ProfileSovereign() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Friends Realtime Hook
  const { activeCount, totalCount } = useFriendsRealtime({ userId: user?.id });

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activityLocations, setActivityLocations] = useState<ActivityLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [showLevelOverlay, setShowLevelOverlay] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');

  // Level Calculation
  const levelData = useMemo(() => {
    if (!profile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const tier = useMemo(() => {
    return getAscensionTier(levelData.level);
  }, [levelData.level]);

  const progress = useMemo(() => {
    return Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
  }, [levelData]);

  // Emoji Status
  const emojiExpired = useMemo(() => {
    return isEmojiExpired(profile?.statusEmojiTimestamp);
  }, [profile?.statusEmojiTimestamp]);

  const emojiMinutesLeft = useMemo(() => {
    return getEmojiRemainingMinutes(profile?.statusEmojiTimestamp);
  }, [profile?.statusEmojiTimestamp]);

  // Username Lock
  const canChangeUsernameNow = useMemo(() => {
    return canChangeUsername(profile?.usernameLastChanged);
  }, [profile?.usernameLastChanged]);

  const daysUntilUsernameChange = useMemo(() => {
    return getDaysUntilUsernameChange(profile?.usernameLastChanged);
  }, [profile?.usernameLastChanged]);

  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  // Fetch Profile & Activity Data
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileDoc = await getDoc(doc(db, 'users', user.id));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            displayName: data.displayName || data.username || 'Anonym',
            username: data.username || 'anonym',
            photoURL: data.photoURL,
            bannerURL: data.bannerURL,
            bio: data.bio || '',
            statusEmoji: data.statusEmoji,
            statusEmojiTimestamp: data.statusEmojiTimestamp?.toMillis?.() || data.statusEmojiTimestamp,
            usernameLastChanged: data.usernameLastChanged?.toMillis?.() || data.usernameLastChanged,
            xp: data.xp || data.totalXP || 0,
            isFounder: data.role === 'founder' || data.isAdmin === true,
            friendsCount: data.friendsCount || 0,
            roomsJoined: data.roomsJoined || 0,
            messagesSent: data.messagesSent || 0,
            daysActive: data.daysActive || 1,
            achievements: data.achievements || [],
            topLocations: data.topLocations || [],
            auraRating: data.auraRating || 0,
            auraRatingCount: data.auraRatingCount || 0,
            city: data.city,
          });
          setBioText(data.bio || '');
        }

        // Fetch activity locations
        try {
          const activityRef = collection(db, 'users', user.id, 'activity_meta');
          const activityQuery = query(activityRef, orderBy('timeSpent', 'desc'), limit(5));
          const activitySnap = await getDocs(activityQuery);

          const locations: ActivityLocation[] = [];
          activitySnap.forEach((doc) => {
            const data = doc.data();
            locations.push({
              name: doc.id,
              timeSpent: data.timeSpent || 0,
              syncRate: data.syncRate || Math.floor(Math.random() * 40 + 60), // Fallback
              lastVisit: data.lastVisit?.toMillis?.() || Date.now(),
            });
          });
          setActivityLocations(locations);
        } catch (e) {
          // Activity collection might not exist yet
          console.log('No activity data yet');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Upload handlers
  const handleBannerUpload = useCallback(async (file: File) => {
    if (!user?.id || isUploading) return;
    setIsUploading(true);
    try {
      const bannerRef = ref(storage, `banners/${user.id}`);
      await uploadBytes(bannerRef, file);
      const bannerURL = await getDownloadURL(bannerRef);
      await updateDoc(doc(db, 'users', user.id), { bannerURL });
      setProfile((prev) => prev ? { ...prev, bannerURL } : null);
    } catch (error) {
      console.error('Banner upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, isUploading]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user?.id || isUploading) return;
    setIsUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.id}`);
      await uploadBytes(avatarRef, file);
      const photoURL = await getDownloadURL(avatarRef);
      await updateDoc(doc(db, 'users', user.id), { photoURL });
      setProfile((prev) => prev ? { ...prev, photoURL } : null);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, isUploading]);

  const handleEmojiSelect = useCallback(async (emoji: string) => {
    if (!user?.id) return;
    try {
      const timestamp = emoji ? Date.now() : null;
      await updateDoc(doc(db, 'users', user.id), {
        statusEmoji: emoji || null,
        statusEmojiTimestamp: timestamp,
      });
      setProfile((prev) => prev ? {
        ...prev,
        statusEmoji: emoji || undefined,
        statusEmojiTimestamp: timestamp || undefined,
      } : null);
    } catch (error) {
      console.error('Emoji update failed:', error);
    }
  }, [user?.id]);

  const handleSaveBio = useCallback(async () => {
    if (!user?.id) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { bio: bioText });
      setProfile((prev) => prev ? { ...prev, bio: bioText } : null);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Bio update failed:', error);
    }
  }, [user?.id, bioText]);

  // Achievements Data
  const achievements = [
    { icon: '🌟', title: 'Erster Chat', unlocked: true },
    { icon: '🔥', title: '7 Tage Streak', unlocked: (profile?.daysActive || 0) >= 7 },
    { icon: '👥', title: '10 Freunde', unlocked: (profile?.friendsCount || 0) >= 10 },
    { icon: '🎤', title: 'Voice Pioneer', unlocked: (profile?.roomsJoined || 0) >= 5 },
    { icon: '💬', title: '100 Messages', unlocked: (profile?.messagesSent || 0) >= 100 },
    { icon: '🏆', title: 'Top Contributor', unlocked: levelData.level >= 10 },
  ];

  // Voice Pionier Stats
  const voiceStats = {
    roomsVisited: profile?.roomsJoined || 0,
    talkTimeMinutes: Math.floor((profile?.xp || 0) / 5), // Estimate based on XP
  };

  // Top Contributor check
  const isTopContributor = levelData.level >= 10 || (profile?.xp || 0) >= 1000;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-4 left-4 z-[100] w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <ArrowLeft size={20} className="text-white/70" />
      </motion.button>

      {/* Header Banner */}
      <HeaderBanner bannerURL={profile?.bannerURL} isOwner={true} onUpload={handleBannerUpload} />

      {/* Avatar & Name Section */}
      <div className="relative px-5">
        <div className="flex items-end justify-between">
          <ProfileAvatar
            photoURL={profile?.photoURL}
            displayName={profile?.displayName || 'Anonym'}
            isFounder={profile?.isFounder || false}
            statusEmoji={profile?.statusEmoji}
            emojiExpired={emojiExpired}
            emojiMinutesLeft={emojiMinutesLeft}
            isOwner={true}
            onAvatarUpload={handleAvatarUpload}
            onEmojiClick={() => setShowEmojiPicker(true)}
          />
          <div className="flex items-center gap-2 pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
            >
              <Edit2 size={14} style={{ color: accentColor }} />
              <span className="text-xs font-bold" style={{ color: accentColor }}>Bearbeiten</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <Share2 size={18} className="text-white/70" />
            </motion.button>
          </div>
        </div>

        {/* Name & Username */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{profile?.displayName}</h1>
            {profile?.isFounder && (
              <div
                className="px-2 py-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <span className="text-[10px] font-bold text-amber-400">FOUNDER</span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/40">@{profile?.username}</p>
          {!canChangeUsernameNow && (
            <div className="flex items-center gap-1.5 mt-1">
              <Clock size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-400/70">
                Namensänderung in {daysUntilUsernameChange} Tagen möglich
              </span>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="mt-4">
          {isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value.slice(0, 160))}
                placeholder="Schreibe etwas über dich..."
                className="w-full p-3 rounded-xl text-sm text-white/80 resize-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  outline: 'none',
                }}
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">{bioText.length}/160</span>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingBio(false)} className="p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <X size={14} className="text-white/50" />
                  </button>
                  <button onClick={handleSaveBio} className="p-2 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                    <Check size={14} className="text-purple-400" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsEditingBio(true)} className="w-full text-left">
              <p className="text-sm text-white/60 leading-relaxed">
                {profile?.bio || <span className="text-white/30 italic">+ Bio hinzufügen...</span>}
              </p>
            </button>
          )}
        </div>

        {/* Aura Rating Button */}
        <div className="mt-4">
          <AuraRatingButton
            rating={profile?.auraRating || 0}
            count={profile?.auraRatingCount || 0}
            onClick={() => setShowRatingPanel(true)}
          />
        </div>

        {/* Friends Trigger Button - Prominenter Link zu /friends */}
        <div className="mt-4">
          <FriendsTrigger
            activeCount={activeCount}
            totalCount={totalCount}
            onClick={() => navigate('/friends')}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Level Command Button - Prominent above network */}
      <div className="px-5 mt-6">
        <LevelCommandButton
          level={levelData.level}
          progress={progress}
          accentColor={accentColor}
          onClick={() => setShowLevelOverlay(true)}
        />
      </div>

      {/* Stats Row */}
      <div className="px-5 mt-6">
        <div className="flex gap-3">
          <StatCard icon={<Users size={18} className="text-blue-400" />} value={profile?.friendsCount || 0} label="Freunde" color="#3b82f6" />
          <StatCard icon={<MessageCircle size={18} className="text-green-400" />} value={profile?.roomsJoined || 0} label="Räume" color="#22c55e" />
          <StatCard icon={<Flame size={18} className="text-orange-400" />} value={profile?.daysActive || 1} label="Tage" color="#f97316" />
        </div>
      </div>

      {/* Voice Pionier & Top Contributor & Streaks - Activity Stack */}
      <div className="px-5 mt-6 space-y-3">
        {/* Voice Pionier Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/voice-stats')}
          className="w-full p-4 rounded-2xl flex items-center gap-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Mic size={22} className="text-violet-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              Voice Pionier
              {(profile?.roomsJoined || 0) >= 5 && (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-violet-500/20 text-violet-400 font-bold">
                  UNLOCKED
                </span>
              )}
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>{voiceStats.roomsVisited} Räume besucht</span>
              <span>•</span>
              <span>{voiceStats.talkTimeMinutes}m Talk Time</span>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </motion.button>

        {/* Top Contributor Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowLevelOverlay(true)}
          className="w-full p-4 rounded-2xl flex items-center gap-4"
          style={{
            background: isTopContributor
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))'
              : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: isTopContributor
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isTopContributor
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.1))'
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isTopContributor ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            <Trophy size={22} className={isTopContributor ? 'text-amber-400' : 'text-white/40'} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              Top Contributor
              {isTopContributor && (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-400 font-bold">
                  EARNED
                </span>
              )}
            </p>
            <p className="text-xs text-white/40">
              {isTopContributor ? 'Du gehörst zu den Aktivsten!' : `Erreiche Level 10 (${levelData.level}/10)`}
            </p>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </motion.button>

        {/* Streaks Button - Links to /profile/streaks */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/streaks')}
          className="w-full p-4 rounded-2xl flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(249, 115, 22, 0.1))',
              border: '1px solid rgba(249, 115, 22, 0.4)',
            }}
          >
            <Flame size={22} className="text-orange-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              🔥 Tägliche Streaks
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-500/20 text-orange-400 font-bold">
                {profile?.daysActive || 0} TAGE
              </span>
            </p>
            <p className="text-xs text-white/40">
              Halte deine Serie aufrecht für Bonus-XP
            </p>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </motion.button>
      </div>

      {/* Clean ending - keine zusätzlichen Buttons mehr */}
      <div className="h-8" />

      {/* Modals */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
        currentEmoji={profile?.statusEmoji}
      />

      <AuraRatingPanel
        isOpen={showRatingPanel}
        onClose={() => setShowRatingPanel(false)}
        rating={profile?.auraRating || 0}
        count={profile?.auraRatingCount || 0}
      />

      {/* Level Command Overlay */}
      <LevelCommandOverlay
        isOpen={showLevelOverlay}
        onClose={() => setShowLevelOverlay(false)}
        level={levelData.level}
        currentXP={levelData.currentXP}
        totalXP={profile?.xp || 0}
        neededXP={levelData.neededXP}
        tier={tier}
        accentColor={accentColor}
      />

      {/* Upload Indicator */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2"
            style={{ background: 'rgba(168, 85, 247, 0.9)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            <span className="text-xs font-bold text-white">Uploading...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
