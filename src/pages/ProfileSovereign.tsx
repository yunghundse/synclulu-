/**
 * ProfileSovereign.tsx
 * 👤 SOVEREIGN IDENTITY PROFILE - Instagram-Style mit synclulu Vibe
 *
 * Features:
 * - Header-Banner (uploadbar)
 * - Avatar links überlappend (Instagram-Style)
 * - Bio & Name mit 30-Tage Sperre
 * - Status-Emoji (60 Min Auto-Expire)
 * - Sterne-Rating (Aura-Rating)
 * - Level-Fortschritt & Top-Locations
 * - KEINE Firebase UID Anzeige!
 *
 * @version 2.0.0 - Sovereign Identity Edition
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
  Heart,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
      {/* Banner Image or Gradient */}
      {bannerURL ? (
        <img
          src={bannerURL}
          alt="Banner"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #0d0518 100%)',
          }}
        >
          {/* Animated subtle gradient overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      )}

      {/* Gradient Fade to Content */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{
          background: 'linear-gradient(to top, #050505, transparent)',
        }}
      />

      {/* Upload Button */}
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
      {/* Avatar Container */}
      <motion.div
        className="relative w-28 h-28 rounded-full overflow-hidden"
        style={{
          border: `4px solid #050505`,
          boxShadow: `0 0 30px ${accentColor}40`,
        }}
      >
        {/* Glowing Ring */}
        <motion.div
          className="absolute -inset-1 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner Avatar */}
        <div
          className="relative w-full h-full rounded-full overflow-hidden z-10"
          style={{ background: '#050505' }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
            >
              <span className="text-4xl font-black text-white/80">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Camera Upload Button */}
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
              style={{
                background: accentColor,
                boxShadow: `0 2px 10px ${accentColor}50`,
              }}
            >
              <Camera size={14} className="text-black" />
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Founder Crown */}
      {isFounder && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center z-30"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)',
          }}
        >
          <Crown size={18} className="text-black" />
        </motion.div>
      )}

      {/* Status Emoji Button */}
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

      {/* Emoji Timer */}
      {statusEmoji && !emojiExpired && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#a855f7',
          }}
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
            <button onClick={onClose}>
              <X size={20} className="text-white/40" />
            </button>
          </div>

          <p className="text-xs text-white/40 mb-4">
            Wähle einen Emoji. Er verschwindet automatisch nach 60 Minuten.
          </p>

          <div className="grid grid-cols-4 gap-3">
            {STATUS_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: emoji === currentEmoji
                    ? 'rgba(168, 85, 247, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: emoji === currentEmoji
                    ? '2px solid #a855f7'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {currentEmoji && (
            <motion.button
              onClick={() => {
                onSelect('');
                onClose();
              }}
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
// STAR RATING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AuraRating = ({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < fullStars ? 'text-amber-400' : 'text-white/20'}
            fill={i < fullStars ? '#fbbf24' : 'transparent'}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-amber-400">{rating.toFixed(1)}</span>
      <span className="text-xs text-white/30">({count} Bewertungen)</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TOP LOCATIONS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TopLocations = ({ locations }: { locations: string[] }) => {
  if (locations.length === 0) {
    return (
      <p className="text-xs text-white/30 text-center py-4">
        Noch keine Lieblings-Orte
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {locations.map((location, index) => (
        <motion.div
          key={location}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <MapPin size={12} className="text-purple-400" />
          <span className="text-xs font-medium text-white/70">{location}</span>
        </motion.div>
      ))}
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

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  // Fetch Profile
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
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
          });
          setBioText(data.bio || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Upload Banner
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

  // Upload Avatar
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

  // Set Status Emoji
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

  // Save Bio
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
      {/* Back Button - Floating */}
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
      <HeaderBanner
        bannerURL={profile?.bannerURL}
        isOwner={true}
        onUpload={handleBannerUpload}
      />

      {/* Avatar & Name Section */}
      <div className="relative px-5">
        <div className="flex items-end justify-between">
          {/* Avatar (overlapping banner) */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
              }}
            >
              <Edit2 size={14} style={{ color: accentColor }} />
              <span className="text-xs font-bold" style={{ color: accentColor }}>
                Bearbeiten
              </span>
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
            <h1 className="text-2xl font-black text-white">
              {profile?.displayName}
            </h1>
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

          {/* Username Lock Warning */}
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
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="p-2 rounded-lg"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <X size={14} className="text-white/50" />
                  </button>
                  <button
                    onClick={handleSaveBio}
                    className="p-2 rounded-lg"
                    style={{ background: 'rgba(168, 85, 247, 0.2)' }}
                  >
                    <Check size={14} className="text-purple-400" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingBio(true)}
              className="w-full text-left"
            >
              <p className="text-sm text-white/60 leading-relaxed">
                {profile?.bio || (
                  <span className="text-white/30 italic">+ Bio hinzufügen...</span>
                )}
              </p>
            </button>
          )}
        </div>

        {/* Aura Rating */}
        {(profile?.auraRatingCount || 0) > 0 && (
          <div className="mt-4">
            <AuraRating
              rating={profile?.auraRating || 0}
              count={profile?.auraRatingCount || 0}
            />
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="px-5 mt-6">
        <div className="flex gap-3">
          <StatCard
            icon={<Users size={18} className="text-blue-400" />}
            value={profile?.friendsCount || 0}
            label="Freunde"
            color="#3b82f6"
          />
          <StatCard
            icon={<MessageCircle size={18} className="text-green-400" />}
            value={profile?.roomsJoined || 0}
            label="Räume"
            color="#22c55e"
          />
          <StatCard
            icon={<Flame size={18} className="text-orange-400" />}
            value={profile?.daysActive || 1}
            label="Tage"
            color="#f97316"
          />
        </div>
      </div>

      {/* XP Progress */}
      <div className="px-5 mt-6">
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: accentColor }} />
              <span className="text-xs font-bold text-white/50">Level {levelData.level}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: accentColor }}>
              {levelData.currentXP} / {levelData.neededXP} XP
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, ${profile?.isFounder ? '#fde047' : '#c084fc'})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-2">{tier.name} • {tier.badge}</p>
        </div>
      </div>

      {/* Top Locations */}
      <div className="px-5 mt-6">
        <PanelGroup title="Top Locations">
          <div className="p-4">
            <TopLocations locations={profile?.topLocations || []} />
          </div>
        </PanelGroup>
      </div>

      {/* Achievements */}
      <div className="px-5 mt-6">
        <PanelGroup title="Erfolge">
          <div className="grid grid-cols-3 gap-2 p-2">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                icon={achievement.icon}
                title={achievement.title}
                unlocked={achievement.unlocked}
                color={accentColor}
              />
            ))}
          </div>
        </PanelGroup>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-6 mb-8">
        <div className="flex gap-3">
          <motion.button
            onClick={() => navigate('/invites')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 p-4 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <Users size={18} className="text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Einladen</span>
          </motion.button>
          <motion.button
            onClick={() => navigate('/friends')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 p-4 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Heart size={18} className="text-white/50" />
            <span className="text-sm font-bold text-white/50">Freunde</span>
          </motion.button>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
        currentEmoji={profile?.statusEmoji}
      />

      {/* Upload Indicator */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2"
            style={{
              background: 'rgba(168, 85, 247, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
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
