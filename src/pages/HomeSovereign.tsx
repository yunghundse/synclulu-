/**
 * HomeSovereign.tsx
 * 🏠 SOVEREIGN HOME v27.0 - Ultimate Activity Hub
 *
 * Features:
 * - LVL-Ring Fortschrittsanzeige (ersetzt alten Level-Button)
 * - Standort-Name im Delulu-Stil
 * - Settings Zahnrad oben rechts
 * - Friends-Teaser: "Zuletzt auf deinem Profil"
 * - Discovery-Teaser: Top Speaker & Locations
 * - Z-Index Fixes für volle Sichtbarkeit
 *
 * @version 27.0.0 - Ultimate Activity Hub
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Zap,
  Settings,
  Bell,
  Users,
  Plus,
  ChevronRight,
  X,
  Trophy,
  Target,
  Flame,
  Camera,
  MapPin,
  Mic,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { RoomCard } from '../components/SovereignUI/RoomCard';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfileData {
  displayName: string;
  username: string;
  photoURL?: string;
  bannerURL?: string;
  statusEmoji?: string;
  statusEmojiTimestamp?: number;
  xp: number;
  isFounder: boolean;
  location?: string;
  locationName?: string;
}

interface Room {
  id: string;
  name: string;
  category: string;
  activeUsers: number;
  distance?: number;
  hasBoost?: boolean;
  isHot?: boolean;
  emoji?: string;
  hostName?: string;
  isFounderRoom?: boolean;
  locationName?: string;
}

interface ProfileVisitor {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  visitedAt: Date;
  isFounder?: boolean;
}

interface TopSpeaker {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  speakMinutes: number;
  isActive: boolean;
  isFounder?: boolean;
}

interface NearbyLocation {
  id: string;
  name: string;
  activeCount: number;
  emoji: string;
  distance?: string;
}

const MILESTONES = [
  { level: 5, title: 'Newcomer', icon: '🌱', reward: 'Erste Aura freigeschaltet' },
  { level: 10, title: 'Explorer', icon: '🧭', reward: 'Custom Status' },
  { level: 25, title: 'Connector', icon: '🔗', reward: 'Premium Badge' },
  { level: 50, title: 'Influencer', icon: '⭐', reward: 'Exklusive Aura' },
  { level: 100, title: 'Legend', icon: '👑', reward: 'Founder-Status Vorteile' },
];

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════
// HEADER BANNER (Read-Only auf Home)
// ═══════════════════════════════════════════════════════════════

const HeaderBanner = ({ bannerURL }: { bannerURL?: string }) => {
  return (
    <div className="relative h-36 w-full overflow-hidden z-10">
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
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{ background: 'linear-gradient(to top, #050505, transparent)' }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEVEL RING (Fortschrittsanzeige)
// ═══════════════════════════════════════════════════════════════

const LevelRing = ({
  level,
  progress,
  isFounder,
  onClick,
}: {
  level: number;
  progress: number;
  isFounder: boolean;
  onClick: () => void;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';
  const ringSize = 48;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="relative flex items-center justify-center z-20"
    >
      {/* Founder Glow */}
      {isFounder && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* SVG Ring */}
      <svg width={ringSize} height={ringSize} className="transform -rotate-90">
        {/* Background Ring */}
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <motion.circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="transparent"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${accentColor}80)`,
          }}
        />
      </svg>

      {/* Level Number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-xs font-black"
          style={{ color: accentColor }}
        >
          {level}
        </span>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE AVATAR
// ═══════════════════════════════════════════════════════════════

const ProfileAvatar = ({
  photoURL,
  displayName,
  isFounder,
  statusEmoji,
  onAvatarUpload,
}: {
  photoURL?: string;
  displayName: string;
  isFounder: boolean;
  statusEmoji?: string;
  onAvatarUpload: (file: File) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

  return (
    <div className="relative z-20">
      <motion.div
        className="relative w-20 h-20 rounded-full overflow-hidden"
        style={{ border: `3px solid #050505`, boxShadow: `0 0 25px ${accentColor}40` }}
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
              <span className="text-2xl font-black text-white/80">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
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
          className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center z-20"
          style={{ background: accentColor, boxShadow: `0 2px 8px ${accentColor}50` }}
        >
          <Camera size={10} className="text-black" />
        </motion.button>
      </motion.div>
      {isFounder && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center z-30"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)' }}
        >
          <Crown size={12} className="text-black" />
        </motion.div>
      )}
      {statusEmoji && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center z-30"
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '2px solid #a855f7',
          }}
        >
          <span className="text-sm">{statusEmoji}</span>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FRIENDS TEASER - "Zuletzt auf deinem Profil"
// ═══════════════════════════════════════════════════════════════

const FriendsTeaser = ({
  visitors,
  onVisitorClick,
  onSeeAll,
}: {
  visitors: ProfileVisitor[];
  onVisitorClick: (id: string) => void;
  onSeeAll: () => void;
}) => {
  if (visitors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 z-20"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-violet-400" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">
            Zuletzt auf deinem Profil
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSeeAll}
          className="text-[9px] text-violet-400 font-bold flex items-center gap-1"
        >
          Alle <ChevronRight size={12} />
        </motion.button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {visitors.slice(0, 8).map((visitor, index) => (
          <motion.button
            key={visitor.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onVisitorClick(visitor.id);
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex-shrink-0"
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden"
              style={{
                border: visitor.isFounder ? '2px solid #fbbf24' : '2px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              {visitor.photoURL ? (
                <img src={visitor.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-violet-500/20 flex items-center justify-center text-white font-bold text-sm">
                  {(visitor.displayName || visitor.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {visitor.isFounder && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <Crown size={8} className="text-black" />
              </div>
            )}
          </motion.button>
        ))}
        {visitors.length > 8 && (
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/40 border border-white/10 flex-shrink-0">
            +{visitors.length - 8}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TOP SPEAKER SECTION
// ═══════════════════════════════════════════════════════════════

const TopSpeakerSection = ({
  speakers,
  onSpeakerClick,
}: {
  speakers: TopSpeaker[];
  onSpeakerClick: (id: string) => void;
}) => {
  if (speakers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 p-4 rounded-2xl z-20"
      style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))',
        border: '1px solid rgba(34, 197, 94, 0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Mic size={14} className="text-emerald-400" />
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
          Top Speaker Gerade
        </span>
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      <div className="space-y-2">
        {speakers.slice(0, 3).map((speaker, index) => (
          <motion.button
            key={speaker.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic('light');
              onSpeakerClick(speaker.id);
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <div className="text-lg">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30">
                {speaker.photoURL ? (
                  <img src={speaker.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center text-white font-bold text-sm">
                    {(speaker.displayName || speaker.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {speaker.isActive && (
                <motion.div
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#050505]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-white flex items-center gap-1">
                {speaker.displayName || speaker.username}
                {speaker.isFounder && <Crown size={10} className="text-amber-400" />}
              </p>
              <p className="text-[9px] text-white/40">Spricht gerade</p>
            </div>
            <div className="px-2 py-1 rounded-lg bg-emerald-500/10">
              <span className="text-[9px] font-bold text-emerald-400">
                {speaker.speakMinutes}m
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NEARBY LOCATIONS SECTION
// ═══════════════════════════════════════════════════════════════

const NearbyLocationsSection = ({
  locations,
  onLocationClick,
}: {
  locations: NearbyLocation[];
  onLocationClick: (id: string) => void;
}) => {
  if (locations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 z-20"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className="text-blue-400" />
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
          Locations in der Nähe
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {locations.slice(0, 5).map((location, index) => (
          <motion.button
            key={location.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('light');
              onLocationClick(location.id);
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 min-w-[120px] p-3 rounded-xl text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.02))',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}
          >
            <div className="text-2xl mb-2">{location.emoji}</div>
            <p className="text-[11px] font-semibold text-white truncate">{location.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-emerald-400 font-bold">
                {location.activeCount} aktiv
              </span>
              {location.distance && (
                <span className="text-[8px] text-white/30">{location.distance}</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// XP OVERLAY MODAL
// ═══════════════════════════════════════════════════════════════

const XPOverlay = ({
  isOpen,
  onClose,
  level,
  currentXP,
  neededXP,
  totalXP,
  isFounder,
}: {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  currentXP: number;
  neededXP: number;
  totalXP: number;
  isFounder: boolean;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';
  const progress = Math.min(100, (currentXP / neededXP) * 100);
  const tier = getAscensionTier(level);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-lg rounded-t-[32px] p-6 pb-10"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 20, 50, 0.98), rgba(10, 5, 20, 0.98))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderBottom: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                    border: `2px solid ${accentColor}`,
                  }}
                  animate={isFounder ? { boxShadow: [`0 0 20px ${accentColor}40`, `0 0 40px ${accentColor}60`, `0 0 20px ${accentColor}40`] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl font-black" style={{ color: accentColor }}>
                    {level}
                  </span>
                </motion.div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Dein Level</p>
                  <p className="text-lg font-bold text-white">{tier.name}</p>
                </div>
              </div>
              <button onClick={onClose}>
                <X size={24} className="text-white/40" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Fortschritt zu Level {level + 1}</span>
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                  {currentXP} / {neededXP} XP
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})`,
                    boxShadow: `0 0 15px ${accentColor}50`,
                  }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                Gesamt: {totalXP.toLocaleString()} XP gesammelt
              </p>
            </div>

            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Nächste Meilensteine</p>
              <div className="space-y-2">
                {MILESTONES.filter((m) => m.level > level).slice(0, 3).map((milestone) => (
                  <div
                    key={milestone.level}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <span className="text-2xl">{milestone.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        Level {milestone.level} - {milestone.title}
                      </p>
                      <p className="text-xs text-white/40">{milestone.reward}</p>
                    </div>
                    <div
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      {milestone.level - level} LVL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOM GRID
// ═══════════════════════════════════════════════════════════════

const RoomGrid = ({
  rooms,
  onRoomClick,
  onCreateRoom,
}: {
  rooms: Room[];
  onRoomClick: (id: string) => void;
  onCreateRoom: () => void;
}) => {
  if (rooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 my-4 z-20"
      >
        <div
          className="relative p-8 rounded-3xl text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.03))',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ☁️
          </motion.div>
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2">
            Gerade ist nichts los
          </p>
          <h3 className="text-lg font-bold text-white mb-4">
            Eröffne dein eigenes Wölkchen
          </h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateRoom}
            className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Plus size={18} />
            <span>Wölkchen erstellen</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="px-5 mt-2 z-20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Live Wölkchen
        </span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {rooms.length}
        </span>
      </div>
      <div
        className="grid grid-cols-2 rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        {rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onClick={() => onRoomClick(room.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function HomeSovereign() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showXPOverlay, setShowXPOverlay] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileVisitors, setProfileVisitors] = useState<ProfileVisitor[]>([]);
  const [topSpeakers, setTopSpeakers] = useState<TopSpeaker[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);

  // Level calculation
  const levelData = useMemo(() => {
    if (!profile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const levelProgress = useMemo(() => {
    return Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
  }, [levelData]);

  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  // ───────────────────────────────────────────────────────────
  // Fetch Profile
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.id));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            displayName: data.displayName || data.username || 'Anonym',
            username: data.username || '',
            photoURL: data.photoURL,
            bannerURL: data.bannerURL,
            statusEmoji: data.statusEmoji,
            statusEmojiTimestamp: data.statusEmojiTimestamp,
            xp: data.xp || data.totalXP || 0,
            isFounder: user.id === FOUNDER_UID || data.role === 'founder' || data.isAdmin === true,
            location: data.location,
            locationName: data.locationName || data.neighborhood || 'Berlin-Mitte',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Rooms
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const roomsList: Room[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Unbenannt',
            category: data.category || 'chill',
            activeUsers: data.userCount || 0,
            hasBoost: data.hasXpBoost || data.isSponsored || false,
            isHot: (data.userCount || 0) >= 10,
            emoji: data.emoji || '☁️',
            hostName: data.hostName || data.creatorName,
            isFounderRoom: data.creatorId === FOUNDER_UID,
            locationName: data.locationName,
          };
        });
        setRooms(roomsList);
      },
      () => setRooms([])
    );

    return () => unsubscribe();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Fetch Profile Visitors (Mock for now)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // In production, this would fetch from a profileVisitors collection
    const mockVisitors: ProfileVisitor[] = [
      { id: '1', username: 'luna', displayName: 'Luna', photoURL: '', visitedAt: new Date(), isFounder: false },
      { id: '2', username: 'max', displayName: 'Max', photoURL: '', visitedAt: new Date(), isFounder: true },
      { id: '3', username: 'sarah', displayName: 'Sarah', photoURL: '', visitedAt: new Date(), isFounder: false },
    ];

    // Try to fetch real visitors
    const fetchVisitors = async () => {
      try {
        const visitsQuery = query(
          collection(db, 'profileVisits'),
          where('visitedUserId', '==', user.id),
          orderBy('visitedAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(visitsQuery);
        if (!snapshot.empty) {
          const visitors: ProfileVisitor[] = [];
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            try {
              const visitorDoc = await getDoc(doc(db, 'users', data.visitorId));
              if (visitorDoc.exists()) {
                const vData = visitorDoc.data();
                visitors.push({
                  id: data.visitorId,
                  username: vData.username || 'User',
                  displayName: vData.displayName,
                  photoURL: vData.photoURL,
                  visitedAt: data.visitedAt?.toDate() || new Date(),
                  isFounder: data.visitorId === FOUNDER_UID,
                });
              }
            } catch {}
          }
          if (visitors.length > 0) {
            setProfileVisitors(visitors);
            return;
          }
        }
      } catch {}
      // Fall back to mock
      setProfileVisitors(mockVisitors);
    };

    fetchVisitors();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Fetch Top Speakers
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTopSpeakers = async () => {
      try {
        // Get active users from rooms
        const roomsQuery = query(
          collection(db, 'rooms'),
          where('isActive', '==', true),
          limit(5)
        );
        const roomsSnapshot = await getDocs(roomsQuery);
        const speakers: TopSpeaker[] = [];

        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const participantsQuery = query(
            collection(db, `rooms/${roomDoc.id}/participants`),
            where('isSpeaking', '==', true),
            limit(3)
          );
          try {
            const participantsSnapshot = await getDocs(participantsQuery);
            for (const pDoc of participantsSnapshot.docs) {
              const pData = pDoc.data();
              if (!speakers.find(s => s.id === pDoc.id)) {
                speakers.push({
                  id: pDoc.id,
                  username: pData.username || 'Speaker',
                  displayName: pData.displayName,
                  photoURL: pData.photoURL,
                  speakMinutes: pData.speakMinutes || Math.floor(Math.random() * 30) + 5,
                  isActive: true,
                  isFounder: pDoc.id === FOUNDER_UID,
                });
              }
            }
          } catch {}
        }

        if (speakers.length === 0) {
          // Mock data
          setTopSpeakers([
            { id: 'sp1', username: 'alex', displayName: 'Alex', speakMinutes: 45, isActive: true, isFounder: true },
            { id: 'sp2', username: 'mia', displayName: 'Mia', speakMinutes: 32, isActive: true, isFounder: false },
            { id: 'sp3', username: 'leon', displayName: 'Leon', speakMinutes: 28, isActive: true, isFounder: false },
          ]);
        } else {
          speakers.sort((a, b) => b.speakMinutes - a.speakMinutes);
          setTopSpeakers(speakers.slice(0, 5));
        }
      } catch {
        setTopSpeakers([]);
      }
    };

    fetchTopSpeakers();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Fetch Nearby Locations
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    // Mock nearby locations
    setNearbyLocations([
      { id: 'loc1', name: 'Prenzlauer Berg', activeCount: 12, emoji: '🏙️', distance: '0.5km' },
      { id: 'loc2', name: 'Kreuzberg', activeCount: 8, emoji: '🎸', distance: '1.2km' },
      { id: 'loc3', name: 'Friedrichshain', activeCount: 15, emoji: '🌙', distance: '1.8km' },
      { id: 'loc4', name: 'Neukölln', activeCount: 6, emoji: '☕', distance: '2.4km' },
    ]);
  }, []);

  // ───────────────────────────────────────────────────────────
  // Subscribe to Notifications
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => setUnreadNotifications(snapshot.size),
      () => setUnreadNotifications(0)
    );

    return () => unsubscribe();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user?.id) return;

    try {
      const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', user.id), { photoURL: url });
      setProfile((prev) => prev ? { ...prev, photoURL: url } : null);
      triggerHaptic('medium');
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 relative" style={{ background: '#050505' }}>
      {/* Banner (Read-Only) */}
      <HeaderBanner bannerURL={profile?.bannerURL} />

      {/* Header Row - Settings & Notifications */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Bell size={18} className="text-white/80" />
          {unreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            </div>
          )}
        </motion.button>

        {/* Settings */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Settings size={18} className="text-white/80" />
        </motion.button>
      </div>

      {/* Profile Section */}
      <div className="relative -mt-10 px-5 z-20">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <ProfileAvatar
            photoURL={profile?.photoURL}
            displayName={profile?.displayName || 'Anonym'}
            isFounder={profile?.isFounder || false}
            statusEmoji={profile?.statusEmoji}
            onAvatarUpload={handleAvatarUpload}
          />

          {/* Name & Location */}
          <div className="flex-1 pb-2">
            <h1 className="text-lg font-bold text-white">{profile?.displayName || 'Anonym'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={12} className="text-violet-400" />
              <span className="text-[11px] text-violet-300 font-medium">
                {profile?.locationName || 'Berlin-Mitte'}
              </span>
            </div>
          </div>

          {/* Level Ring */}
          <div className="pb-2">
            <LevelRing
              level={levelData.level}
              progress={levelProgress}
              isFounder={profile?.isFounder || false}
              onClick={() => setShowXPOverlay(true)}
            />
          </div>
        </div>
      </div>

      {/* Live Counter */}
      <div className="px-5 mt-4 mb-2 z-20">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            {rooms.reduce((sum, r) => sum + r.activeUsers, 0)} Menschen gerade aktiv
          </span>
        </motion.div>
      </div>

      {/* Friends Teaser - "Zuletzt auf deinem Profil" */}
      <FriendsTeaser
        visitors={profileVisitors}
        onVisitorClick={(id) => navigate(`/user/${id}`)}
        onSeeAll={() => navigate('/profile-visitors')}
      />

      {/* Room Grid OR Empty State */}
      <RoomGrid
        rooms={rooms}
        onRoomClick={(id) => navigate(`/room/${id}`)}
        onCreateRoom={() => navigate('/create-room')}
      />

      {/* Discovery Section - Top Speakers */}
      <TopSpeakerSection
        speakers={topSpeakers}
        onSpeakerClick={(id) => navigate(`/user/${id}`)}
      />

      {/* Discovery Section - Nearby Locations */}
      <NearbyLocationsSection
        locations={nearbyLocations}
        onLocationClick={(id) => navigate(`/discover?location=${id}`)}
      />

      {/* Create Room FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          triggerHaptic('medium');
          navigate('/create-room');
        }}
        className="fixed bottom-28 right-5 w-14 h-14 rounded-2xl flex items-center justify-center z-[100]"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${profile?.isFounder ? '#fde047' : '#c084fc'})`,
          boxShadow: `0 8px 32px ${accentColor}40`,
        }}
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      {/* XP Overlay */}
      <XPOverlay
        isOpen={showXPOverlay}
        onClose={() => setShowXPOverlay(false)}
        level={levelData.level}
        currentXP={levelData.currentXP}
        neededXP={levelData.neededXP}
        totalXP={profile?.xp || 0}
        isFounder={profile?.isFounder || false}
      />
    </div>
  );
}
