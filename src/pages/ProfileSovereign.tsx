/**
 * ProfileSovereign.tsx
 * Neue Profilseite - Komplett getrennt von Settings
 *
 * Features:
 * - Großer pulsierender Kaugummi-Avatar
 * - SovereignRows mit User-Stats
 * - Erfolge & Achievements
 * - Keine Settings hier!
 * - KEINE Firebase UID Anzeige!
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';
import { UnifiedPanel, PanelGroup } from '../components/SovereignUI/UnifiedPanel';

// ═══════════════════════════════════════════════════════════════
// KAUGUMMI AVATAR (Pulsierend & Organisch)
// ═══════════════════════════════════════════════════════════════
const KaugummiAvatar = ({
  photoURL,
  displayName,
  isFounder,
  level,
  tier,
}: {
  photoURL?: string;
  displayName: string;
  isFounder: boolean;
  level: number;
  tier: string;
}) => {
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

  // Kaugummi-Morphing Animation
  const morphAnimation = {
    borderRadius: [
      '60% 40% 30% 70% / 60% 30% 70% 40%',
      '30% 60% 70% 40% / 50% 60% 30% 60%',
      '60% 40% 30% 70% / 60% 30% 70% 40%',
    ],
  };

  return (
    <div className="relative flex flex-col items-center pt-8 pb-6">
      {/* Ambient Glow */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64"
        style={{
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Main Avatar Container */}
      <motion.div
        className="relative w-32 h-32"
        animate={morphAnimation}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: photoURL
            ? 'transparent'
            : `linear-gradient(135deg, ${accentColor}60, ${accentColor}30)`,
          boxShadow: `0 0 60px ${accentColor}40, inset 0 0 30px ${accentColor}20`,
          border: `3px solid ${accentColor}50`,
          overflow: 'hidden',
        }}
      >
        {photoURL ? (
          <motion.img
            src={photoURL}
            alt={displayName}
            className="w-full h-full object-cover"
            style={{ borderRadius: 'inherit' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-black text-white/80">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Pulsing Ring */}
        <motion.div
          className="absolute inset-0"
          style={{
            borderRadius: 'inherit',
            border: `2px solid ${accentColor}`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Founder Crown Badge */}
      {isFounder && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-1/2 translate-x-16 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5)',
          }}
        >
          <Crown size={20} className="text-black" />
        </motion.div>
      )}

      {/* Name & Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center"
      >
        <h1 className="text-2xl font-black text-white mb-1">{displayName}</h1>
        <div className="flex items-center justify-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {isFounder ? '👑 Founder' : `Level ${level}`}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)' }}
          >
            {tier}
          </span>
        </div>
      </motion.div>

      {/* Edit Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-20 right-1/2 translate-x-20 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Camera size={14} className="text-white/70" />
      </motion.button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT ROW COMPONENT
// ═══════════════════════════════════════════════════════════════
const StatRow = ({
  icon,
  label,
  value,
  color = '#a855f7',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div
    className="flex items-center justify-between p-4 rounded-2xl"
    style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        {icon}
      </div>
      <span className="text-sm text-white/60">{label}</span>
    </div>
    <span className="text-lg font-bold text-white">{value}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGE
// ═══════════════════════════════════════════════════════════════
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
    whileHover={{ scale: 1.05 }}
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

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ProfileSovereign() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<{
    displayName: string;
    photoURL?: string;
    xp: number;
    isFounder: boolean;
    friendsCount: number;
    roomsJoined: number;
    messagesSent: number;
    daysActive: number;
    achievements: string[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

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
            photoURL: data.photoURL,
            xp: data.xp || data.totalXP || 0,
            isFounder: data.role === 'founder' || data.isAdmin === true,
            friendsCount: data.friendsCount || 0,
            roomsJoined: data.roomsJoined || 0,
            messagesSent: data.messagesSent || 0,
            daysActive: data.daysActive || 1,
            achievements: data.achievements || [],
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

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
      {/* Header */}
      <div className="sticky top-0 z-[100] px-5 pt-12 pb-4 flex items-center justify-between">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ArrowLeft size={20} className="text-white/70" />
        </motion.button>

        <span className="text-lg font-black text-white">Mein Profil</span>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Share2 size={18} className="text-white/70" />
          </motion.button>
          <motion.button
            onClick={() => navigate('/settings/profile')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168, 85, 247, 0.15)' }}
          >
            <Edit2 size={18} className="text-violet-400" />
          </motion.button>
        </div>
      </div>

      {/* Kaugummi Avatar */}
      <KaugummiAvatar
        photoURL={profile?.photoURL}
        displayName={profile?.displayName || 'Anonym'}
        isFounder={profile?.isFounder || false}
        level={levelData.level}
        tier={tier.name}
      />

      {/* XP Progress Section */}
      <div className="px-5 mb-6">
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white/50">XP Progress</span>
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
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-5 mb-6">
        <PanelGroup title="Statistiken">
          <div className="space-y-2">
            <StatRow
              icon={<Zap size={18} style={{ color: accentColor }} />}
              label="Gesamt XP"
              value={profile?.xp?.toLocaleString() || '0'}
              color={accentColor}
            />
            <StatRow
              icon={<Users size={18} className="text-blue-400" />}
              label="Freunde"
              value={profile?.friendsCount || 0}
              color="#3b82f6"
            />
            <StatRow
              icon={<MessageCircle size={18} className="text-green-400" />}
              label="Nachrichten"
              value={profile?.messagesSent || 0}
              color="#22c55e"
            />
            <StatRow
              icon={<Flame size={18} className="text-orange-400" />}
              label="Tage aktiv"
              value={profile?.daysActive || 1}
              color="#f97316"
            />
          </div>
        </PanelGroup>
      </div>

      {/* Achievements Section */}
      <div className="px-5 mb-6">
        <PanelGroup title="Erfolge">
          <div className="grid grid-cols-3 gap-2">
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
      <div className="px-5">
        <PanelGroup title="Aktionen">
          <UnifiedPanel
            icon={<Users size={20} />}
            iconColor="#3b82f6"
            title="Freunde einladen"
            description="Teile deinen Invite-Code"
            onClick={() => navigate('/invites')}
          />
          <UnifiedPanel
            icon={<Shield size={20} />}
            iconColor="#22c55e"
            title="Privatsphäre"
            description="Deine Daten verwalten"
            onClick={() => navigate('/settings/privacy')}
          />
        </PanelGroup>
      </div>
    </div>
  );
}
