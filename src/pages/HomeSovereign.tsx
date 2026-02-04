/**
 * HomeSovereign.tsx
 * 🏠 SOVEREIGN HOME v28.0 - Data Engineer Edition
 *
 * REAL-TIME DATABASE FEATURES:
 * - Precise Location-Sync: GPS/IP-based with DB update
 * - Top Speaker Logic: Real DB query with Zero-State
 * - Locations & Rooms: 50km Radius Proximity-Sync
 * - Zero-State-Handling: Honest status messages
 * - Visual Fix: High contrast text for all states
 *
 * @version 28.0.0 - Data Engineer Edition
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
  CloudOff,
  Radio,
  Gamepad2,
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
  GeoPoint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { RoomCard } from '../components/SovereignUI/RoomCard';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const MAX_DISTANCE_KM = 50; // 50km Radius für Proximity-Sync

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
  latitude?: number;
  longitude?: number;
}

interface Room {
  id: string;
  name: string;
  category: string;
  activeUsers: number;
  distance?: number;
  distanceKm?: number;
  hasBoost?: boolean;
  isHot?: boolean;
  emoji?: string;
  hostName?: string;
  isFounderRoom?: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
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
  roomName?: string;
}

interface NearbyLocation {
  id: string;
  name: string;
  activeCount: number;
  emoji: string;
  distance?: string;
  distanceKm?: number;
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
// LOCATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/**
 * Reverse geocode coordinates to city/district name
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'de' } }
    );
    const data = await response.json();

    // Try to get the most specific location name
    const address = data.address || {};
    return (
      address.suburb ||
      address.neighbourhood ||
      address.district ||
      address.city_district ||
      address.town ||
      address.city ||
      address.village ||
      'Unbekannter Standort'
    );
  } catch (error) {
    console.error('[Location] Reverse geocode error:', error);
    return 'Standort nicht verfügbar';
  }
}

/**
 * Get location from IP as fallback
 */
async function getLocationFromIP(): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city || data.region || 'Unbekannt',
      };
    }
  } catch (error) {
    console.error('[Location] IP geolocation error:', error);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// HEADER BANNER
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
// LEVEL RING
// ═══════════════════════════════════════════════════════════════

const LevelRing = ({
  level,
  progress,
  totalXP,
  isFounder,
  onClick,
}: {
  level: number;
  progress: number;
  totalXP: number;
  isFounder: boolean;
  onClick: () => void;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';
  const ringSize = 48;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // DYNAMIC LEVEL SYSTEM: If XP is 0, show no level or "0"
  const displayLevel = totalXP === 0 ? 0 : level;
  const showRing = totalXP > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="relative flex items-center justify-center z-20"
    >
      {/* Founder glow effect */}
      {isFounder && showRing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)` }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <svg width={ringSize} height={ringSize} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="transparent"
          stroke={showRing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring - only show if XP > 0 */}
        {showRing && (
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
            style={{ filter: `drop-shadow(0 0 6px ${accentColor}80)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {displayLevel === 0 ? (
          // Zero-State: Show dash or subtle "0"
          <span className="text-xs font-bold text-white/30">—</span>
        ) : (
          <span className="text-xs font-black" style={{ color: accentColor }}>
            {displayLevel}
          </span>
        )}
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
          style={{ background: 'rgba(168, 85, 247, 0.2)', border: '2px solid #a855f7' }}
        >
          <span className="text-sm">{statusEmoji}</span>
        </motion.div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FRIENDS TEASER
// ═══════════════════════════════════════════════════════════════

const FriendsTeaser = ({
  visitors,
  loading,
  onVisitorClick,
  onSeeAll,
}: {
  visitors: ProfileVisitor[];
  loading: boolean;
  onVisitorClick: (id: string) => void;
  onSeeAll: () => void;
}) => {
  // Zero-State: No visitors from DB
  if (!loading && visitors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-4 p-4 rounded-2xl z-30"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(168, 85, 247, 0.02))',
          border: '1px solid rgba(168, 85, 247, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye size={14} className="text-violet-400/60" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">
            Profilbesucher
          </span>
        </div>
        <p className="text-[11px] text-white/50 text-center py-2">
          Noch keine Profilbesucher. Teile dein Profil, um mehr Besucher zu bekommen!
        </p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="mx-5 mb-4 h-20 rounded-2xl animate-pulse z-30" style={{ background: 'rgba(168, 85, 247, 0.05)' }} />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 z-30"
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
            onClick={() => { triggerHaptic('light'); onVisitorClick(visitor.id); }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex-shrink-0"
          >
            <div
              className="w-12 h-12 rounded-full overflow-hidden"
              style={{ border: visitor.isFounder ? '2px solid #fbbf24' : '2px solid rgba(168, 85, 247, 0.3)' }}
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
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TOP SPEAKER SECTION WITH ZERO-STATE
// ═══════════════════════════════════════════════════════════════

const TopSpeakerSection = ({
  speakers,
  loading,
  onSpeakerClick,
}: {
  speakers: TopSpeaker[];
  loading: boolean;
  onSpeakerClick: (id: string) => void;
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="mx-5 mb-4 p-4 rounded-2xl animate-pulse z-30" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
        <div className="h-4 w-32 bg-white/10 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-14 bg-white/5 rounded-xl" />
          <div className="h-14 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  // ZERO-STATE: No active speakers from DB
  if (speakers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-4 p-4 rounded-2xl z-30"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.02))',
          border: '1px solid rgba(34, 197, 94, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Mic size={14} className="text-emerald-400/60" />
          <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-wider">
            Top Speaker
          </span>
        </div>
        <div className="text-center py-4">
          <Radio size={24} className="text-white/20 mx-auto mb-2" />
          <p className="text-[11px] text-white/50">
            Gerade gibt es keine Top Speaker in deiner Nähe
          </p>
          <p className="text-[9px] text-white/30 mt-1">
            Starte ein Wölkchen und werde der Erste!
          </p>
        </div>
      </motion.div>
    );
  }

  // Data exists - show speakers
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 p-4 rounded-2xl z-30"
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
            onClick={() => { triggerHaptic('light'); onSpeakerClick(speaker.id); }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <div className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
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
              <p className="text-[9px] text-white/40">
                {speaker.roomName ? `In: ${speaker.roomName}` : 'Spricht gerade'}
              </p>
            </div>
            <div className="px-2 py-1 rounded-lg bg-emerald-500/10">
              <span className="text-[9px] font-bold text-emerald-400">{speaker.speakMinutes}m</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NEARBY LOCATIONS SECTION WITH ZERO-STATE
// ═══════════════════════════════════════════════════════════════

const NearbyLocationsSection = ({
  locations,
  loading,
  onLocationClick,
  onCreateRoom,
}: {
  locations: NearbyLocation[];
  loading: boolean;
  onLocationClick: (id: string) => void;
  onCreateRoom: () => void;
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="mx-5 mb-4 z-30">
        <div className="h-4 w-40 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="flex gap-2">
          <div className="w-[120px] h-24 bg-white/5 rounded-xl animate-pulse" />
          <div className="w-[120px] h-24 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ZERO-STATE: No nearby locations
  if (locations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-4 p-4 rounded-2xl z-30"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-blue-400/60" />
          <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-wider">
            Locations in der Nähe
          </span>
        </div>
        <div className="text-center py-4">
          <CloudOff size={24} className="text-white/20 mx-auto mb-2" />
          <p className="text-[11px] text-white/50">
            Keine aktiven Locations gefunden
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateRoom}
            className="mt-3 px-4 py-2 rounded-xl text-[11px] font-bold text-blue-400 flex items-center gap-2 mx-auto"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Plus size={14} />
            <span>Eröffne den ersten Raum!</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Data exists - show locations
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 z-30"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className="text-blue-400" />
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
          Locations in der Nähe
        </span>
        <span className="text-[8px] text-white/30">({MAX_DISTANCE_KM}km Radius)</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {locations.slice(0, 5).map((location, index) => (
          <motion.button
            key={location.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('light'); onLocationClick(location.id); }}
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
              <span className="text-[9px] text-emerald-400 font-bold">{location.activeCount} aktiv</span>
              {location.distance && (
                <span className="text-[8px] text-white/40">{location.distance}</span>
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
                  style={{ background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`, border: `2px solid ${accentColor}` }}
                >
                  <span className="text-2xl font-black" style={{ color: accentColor }}>{level}</span>
                </motion.div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Dein Level</p>
                  <p className="text-lg font-bold text-white">{tier.name}</p>
                </div>
              </div>
              <button onClick={onClose}><X size={24} className="text-white/40" /></button>
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Fortschritt zu Level {level + 1}</span>
                <span className="text-xs font-bold" style={{ color: accentColor }}>{currentXP} / {neededXP} XP</span>
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
              <p className="text-[10px] text-white/30 mt-1">Gesamt: {totalXP.toLocaleString()} XP gesammelt</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Nächste Meilensteine</p>
              <div className="space-y-2">
                {MILESTONES.filter((m) => m.level > level).slice(0, 3).map((milestone) => (
                  <div key={milestone.level} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <span className="text-2xl">{milestone.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">Level {milestone.level} - {milestone.title}</p>
                      <p className="text-xs text-white/40">{milestone.reward}</p>
                    </div>
                    <div className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: `${accentColor}20`, color: accentColor }}>
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
        className="mx-5 my-4 z-30"
      >
        <div
          className="relative p-8 rounded-3xl text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.03))',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
        >
          <motion.div className="text-5xl mb-4" animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
            ☁️
          </motion.div>
          <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Gerade ist nichts los</p>
          <h3 className="text-lg font-bold text-white mb-4">Eröffne dein eigenes Wölkchen</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateRoom}
            className="px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2 mx-auto"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)' }}
          >
            <Plus size={18} /><span>Wölkchen erstellen</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="px-5 mt-2 z-30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Live Wölkchen</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{rooms.length}</span>
      </div>
      <div className="grid grid-cols-2 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.04)' }}>
        {rooms.map((room, index) => (
          <RoomCard key={room.id} room={room} index={index} onClick={() => onRoomClick(room.id)} />
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Loading states for each section
  const [visitorsLoading, setVisitorsLoading] = useState(true);
  const [speakersLoading, setSpeakersLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Level calculation
  const levelData = useMemo(() => {
    if (!profile) return { level: 1, currentXP: 0, neededXP: 100 };
    return getLevelFromXP(profile.xp);
  }, [profile?.xp]);

  const levelProgress = useMemo(() => Math.min(100, (levelData.currentXP / levelData.neededXP) * 100), [levelData]);

  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  // ───────────────────────────────────────────────────────────
  // PRECISE LOCATION SYNC
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const syncLocation = async () => {
      try {
        // Try GPS first
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setUserCoords({ lat: latitude, lon: longitude });

              // Get location name via reverse geocoding
              const locationName = await reverseGeocode(latitude, longitude);

              // Update user profile in DB
              await updateDoc(doc(db, 'users', user.id), {
                current_location: locationName,
                locationName: locationName,
                latitude: latitude,
                longitude: longitude,
                lastLocationUpdate: new Date(),
              });

              setProfile((prev) => prev ? { ...prev, locationName, latitude, longitude } : null);
              console.log('[Location] GPS sync successful:', locationName);
            },
            async (error) => {
              console.warn('[Location] GPS error, falling back to IP:', error.message);

              // Fallback to IP-based location
              const ipLocation = await getLocationFromIP();
              if (ipLocation) {
                setUserCoords({ lat: ipLocation.lat, lon: ipLocation.lon });

                await updateDoc(doc(db, 'users', user.id), {
                  current_location: ipLocation.city,
                  locationName: ipLocation.city,
                  latitude: ipLocation.lat,
                  longitude: ipLocation.lon,
                  lastLocationUpdate: new Date(),
                  locationSource: 'ip',
                });

                setProfile((prev) => prev ? { ...prev, locationName: ipLocation.city, latitude: ipLocation.lat, longitude: ipLocation.lon } : null);
                console.log('[Location] IP fallback sync:', ipLocation.city);
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          // No geolocation support - use IP
          const ipLocation = await getLocationFromIP();
          if (ipLocation) {
            setUserCoords({ lat: ipLocation.lat, lon: ipLocation.lon });
            setProfile((prev) => prev ? { ...prev, locationName: ipLocation.city } : null);
          }
        }
      } catch (error) {
        console.error('[Location] Sync error:', error);
      }
    };

    syncLocation();
  }, [user?.id]);

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
            locationName: data.locationName || data.current_location || 'Standort wird geladen...',
            latitude: data.latitude,
            longitude: data.longitude,
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
  // Subscribe to Rooms with Proximity Filter
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('userCount', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        let roomsList: Room[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const roomLat = data.latitude || data.location?.latitude;
          const roomLon = data.longitude || data.location?.longitude;

          let distanceKm: number | undefined;
          if (userCoords && roomLat && roomLon) {
            distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lon, roomLat, roomLon);
          }

          return {
            id: docSnap.id,
            name: data.name || 'Unbenannt',
            category: data.category || 'chill',
            activeUsers: data.userCount || 0,
            distanceKm,
            distance: distanceKm ? formatDistance(distanceKm) : undefined,
            hasBoost: data.hasXpBoost || data.isSponsored || false,
            isHot: (data.userCount || 0) >= 10,
            emoji: data.emoji || '☁️',
            hostName: data.hostName || data.creatorName,
            isFounderRoom: data.creatorId === FOUNDER_UID,
            locationName: data.locationName,
            latitude: roomLat,
            longitude: roomLon,
          };
        });

        // Filter by 50km radius if user coords available
        if (userCoords) {
          roomsList = roomsList.filter((room) => {
            if (!room.distanceKm) return true; // Keep rooms without location
            return room.distanceKm <= MAX_DISTANCE_KM;
          });
        }

        // Sort by distance if available
        roomsList.sort((a, b) => {
          if (a.distanceKm && b.distanceKm) return a.distanceKm - b.distanceKm;
          return b.activeUsers - a.activeUsers;
        });

        setRooms(roomsList.slice(0, 20));
      },
      () => setRooms([])
    );

    return () => unsubscribe();
  }, [userCoords]);

  // ───────────────────────────────────────────────────────────
  // Fetch Profile Visitors (Real DB Query)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setVisitorsLoading(true);

    const fetchVisitors = async () => {
      try {
        const visitsQuery = query(
          collection(db, 'profileVisits'),
          where('visitedUserId', '==', user.id),
          orderBy('visitedAt', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(visitsQuery);
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

        // Return only real DB data - no mock fallback
        setProfileVisitors(visitors);
      } catch (error) {
        console.error('[Visitors] Fetch error:', error);
        setProfileVisitors([]); // Empty array = zero state
      } finally {
        setVisitorsLoading(false);
      }
    };

    fetchVisitors();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // TOP SPEAKER LOGIC (Real DB Query - No Mocks)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    setSpeakersLoading(true);

    const fetchTopSpeakers = async () => {
      try {
        // Query active rooms
        const roomsQuery = query(
          collection(db, 'rooms'),
          where('isActive', '==', true),
          limit(10)
        );

        const roomsSnapshot = await getDocs(roomsQuery);
        const speakers: TopSpeaker[] = [];

        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();

          // Query participants who are speaking
          const participantsQuery = query(
            collection(db, `rooms/${roomDoc.id}/participants`),
            where('isSpeaking', '==', true),
            limit(5)
          );

          try {
            const participantsSnapshot = await getDocs(participantsQuery);

            for (const pDoc of participantsSnapshot.docs) {
              const pData = pDoc.data();

              // Check if already in list
              if (!speakers.find((s) => s.id === pDoc.id)) {
                speakers.push({
                  id: pDoc.id,
                  username: pData.username || pData.displayName || 'Speaker',
                  displayName: pData.displayName,
                  photoURL: pData.photoURL,
                  speakMinutes: pData.speakMinutes || pData.speakingDuration || 0,
                  isActive: true,
                  isFounder: pDoc.id === FOUNDER_UID,
                  roomName: roomData.name,
                });
              }
            }
          } catch {}
        }

        // Sort by speak time and return
        speakers.sort((a, b) => b.speakMinutes - a.speakMinutes);

        // NO MOCK DATA - only real DB results
        setTopSpeakers(speakers.slice(0, 5));
      } catch (error) {
        console.error('[TopSpeakers] Fetch error:', error);
        setTopSpeakers([]); // Empty = zero state
      } finally {
        setSpeakersLoading(false);
      }
    };

    fetchTopSpeakers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTopSpeakers, 30000);
    return () => clearInterval(interval);
  }, []);

  // ───────────────────────────────────────────────────────────
  // LOCATIONS FROM ROOMS (50km Proximity Sync)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLocationsLoading(true);

    const fetchNearbyLocations = async () => {
      try {
        // Query active rooms
        const roomsQuery = query(
          collection(db, 'rooms'),
          where('isActive', '==', true),
          orderBy('userCount', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(roomsQuery);
        const locationMap = new Map<string, NearbyLocation>();

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const locName = data.locationName || data.city || data.neighborhood;

          if (!locName) continue;

          const roomLat = data.latitude || data.location?.latitude;
          const roomLon = data.longitude || data.location?.longitude;

          let distanceKm: number | undefined;
          if (userCoords && roomLat && roomLon) {
            distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lon, roomLat, roomLon);

            // Skip if outside 50km radius
            if (distanceKm > MAX_DISTANCE_KM) continue;
          }

          // Aggregate by location name
          if (locationMap.has(locName)) {
            const existing = locationMap.get(locName)!;
            existing.activeCount += data.userCount || 1;
          } else {
            locationMap.set(locName, {
              id: docSnap.id,
              name: locName,
              activeCount: data.userCount || 1,
              emoji: data.emoji || '📍',
              distance: distanceKm ? formatDistance(distanceKm) : undefined,
              distanceKm,
            });
          }
        }

        // Convert to array and sort by distance/activity
        let locations = Array.from(locationMap.values());
        locations.sort((a, b) => {
          if (a.distanceKm && b.distanceKm) return a.distanceKm - b.distanceKm;
          return b.activeCount - a.activeCount;
        });

        // NO MOCK DATA - only real DB results
        setNearbyLocations(locations.slice(0, 6));
      } catch (error) {
        console.error('[Locations] Fetch error:', error);
        setNearbyLocations([]); // Empty = zero state
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchNearbyLocations();
  }, [userCoords]);

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
      {/* Banner */}
      <HeaderBanner bannerURL={profile?.bannerURL} />

      {/* Header Row - Game Center, Notifications & Settings */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        {/* Battle Pass / Game Center Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { triggerHaptic('medium'); navigate('/battlepass'); }}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <Trophy size={18} className="text-amber-400" />
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Bell size={18} className="text-white/80" />
          {unreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
            </div>
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <Settings size={18} className="text-white/80" />
        </motion.button>
      </div>

      {/* Profile Section */}
      <div className="relative -mt-10 px-5 z-40">
        <div className="flex items-end gap-4">
          <ProfileAvatar
            photoURL={profile?.photoURL}
            displayName={profile?.displayName || 'Anonym'}
            isFounder={profile?.isFounder || false}
            statusEmoji={profile?.statusEmoji}
            onAvatarUpload={handleAvatarUpload}
          />
          <div className="flex-1 pb-2">
            <h1 className="text-lg font-bold text-white">{profile?.displayName || 'Anonym'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={12} className="text-violet-400" />
              <span className="text-[11px] text-violet-300 font-medium">
                {profile?.locationName || 'Standort wird geladen...'}
              </span>
            </div>
          </div>
          <div className="pb-2">
            <LevelRing
              level={levelData.level}
              progress={levelProgress}
              totalXP={profile?.xp || 0}
              isFounder={profile?.isFounder || false}
              onClick={() => setShowXPOverlay(true)}
            />
          </div>
        </div>
      </div>

      {/* Live Counter */}
      <div className="px-5 mt-4 mb-2 z-30">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
          <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            {rooms.reduce((sum, r) => sum + r.activeUsers, 0)} Menschen gerade aktiv
          </span>
        </motion.div>
      </div>

      {/* Friends Teaser */}
      <FriendsTeaser
        visitors={profileVisitors}
        loading={visitorsLoading}
        onVisitorClick={(id) => navigate(`/user/${id}`)}
        onSeeAll={() => navigate('/profile-visitors')}
      />

      {/* Room Grid */}
      <RoomGrid
        rooms={rooms}
        onRoomClick={(id) => navigate(`/room/${id}`)}
        onCreateRoom={() => navigate('/create-room')}
      />

      {/* Top Speakers (Real DB - No Mocks) */}
      <TopSpeakerSection
        speakers={topSpeakers}
        loading={speakersLoading}
        onSpeakerClick={(id) => navigate(`/user/${id}`)}
      />

      {/* Nearby Locations (50km Proximity) */}
      <NearbyLocationsSection
        locations={nearbyLocations}
        loading={locationsLoading}
        onLocationClick={(id) => navigate(`/room/${id}`)}
        onCreateRoom={() => navigate('/create-room')}
      />

      {/* FAB removed - Create Room now in Navigation */}

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
