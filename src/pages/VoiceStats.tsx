/**
 * VoiceStats.tsx
 * 🎤 VOICE STATISTIK SEITE - Sprach-Aktivität & Achievements
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Clock,
  Users,
  Radio,
  Trophy,
  TrendingUp,
  Calendar,
  Headphones,
  MessageCircle,
  Star,
  Zap,
  Target,
  Award,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier } from '../lib/ascensionSystem';

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: string;
}> = ({ children, className = '', glow }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: glow ? `0 0 30px ${glow}` : undefined,
    }}
  >
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════

const StatCard = ({
  icon,
  value,
  label,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  subtitle?: string;
}) => (
  <GlassCard className="p-4 text-center" glow={`${color}20`}>
    <div
      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 15px ${color}30`,
      }}
    >
      {icon}
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="text-xs text-white/60 font-medium mt-1">{label}</p>
    {subtitle && <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>}
  </GlassCard>
);

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT ITEM
// ═══════════════════════════════════════════════════════════════════════════

const VoiceAchievement = ({
  icon,
  title,
  description,
  unlocked,
  progress,
  target,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-2xl"
    style={{
      background: unlocked
        ? `linear-gradient(135deg, ${color}20, ${color}10)`
        : 'rgba(255, 255, 255, 0.03)',
      border: `1px solid ${unlocked ? `${color}40` : 'rgba(255, 255, 255, 0.08)'}`,
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: unlocked ? `${color}30` : 'rgba(255, 255, 255, 0.05)',
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white">{title}</p>
          {unlocked && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: `${color}30`, color }}
            >
              ✓ UNLOCKED
            </span>
          )}
        </div>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
        {!unlocked && (
          <div className="mt-2">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-1">
              {progress} / {target}
            </p>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function VoiceStats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTalkTime: 0,
    totalListenTime: 0,
    roomsJoined: 0,
    roomsCreated: 0,
    uniqueUsers: 0,
    longestSession: 0,
    xp: 0,
    daysActive: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStats({
            totalTalkTime: data.totalTalkTime || Math.floor((data.xp || 0) / 5),
            totalListenTime: data.totalListenTime || Math.floor((data.xp || 0) / 2),
            roomsJoined: data.roomsJoined || 0,
            roomsCreated: data.roomsCreated || 0,
            uniqueUsers: data.uniqueUsersConnected || Math.floor((data.friendsCount || 0) * 1.5),
            longestSession: data.longestSession || 0,
            xp: data.xp || data.totalXP || 0,
            daysActive: data.daysActive || 1,
          });
        }
      } catch (error) {
        console.error('Error fetching voice stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const levelData = useMemo(() => getLevelFromXP(stats.xp), [stats.xp]);
  const tier = useMemo(() => getAscensionTier(levelData.level), [levelData.level]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Achievements based on stats
  const achievements = [
    {
      icon: <Mic size={20} className="text-violet-400" />,
      title: 'Erste Worte',
      description: 'Sprich 10 Minuten in Voice Rooms',
      unlocked: stats.totalTalkTime >= 10,
      progress: stats.totalTalkTime,
      target: 10,
      color: '#a855f7',
    },
    {
      icon: <Clock size={20} className="text-blue-400" />,
      title: 'Marathon Talker',
      description: 'Sprich insgesamt 1 Stunde',
      unlocked: stats.totalTalkTime >= 60,
      progress: stats.totalTalkTime,
      target: 60,
      color: '#3b82f6',
    },
    {
      icon: <Radio size={20} className="text-emerald-400" />,
      title: 'Room Explorer',
      description: 'Tritt 10 verschiedenen Rooms bei',
      unlocked: stats.roomsJoined >= 10,
      progress: stats.roomsJoined,
      target: 10,
      color: '#10b981',
    },
    {
      icon: <Users size={20} className="text-amber-400" />,
      title: 'Social Butterfly',
      description: 'Verbinde dich mit 20 Usern',
      unlocked: stats.uniqueUsers >= 20,
      progress: stats.uniqueUsers,
      target: 20,
      color: '#f59e0b',
    },
    {
      icon: <Trophy size={20} className="text-rose-400" />,
      title: 'Host Master',
      description: 'Erstelle 5 eigene Rooms',
      unlocked: stats.roomsCreated >= 5,
      progress: stats.roomsCreated,
      target: 5,
      color: '#f43f5e',
    },
    {
      icon: <Headphones size={20} className="text-cyan-400" />,
      title: 'Guter Zuhörer',
      description: 'Höre 2 Stunden lang zu',
      unlocked: stats.totalListenTime >= 120,
      progress: stats.totalListenTime,
      target: 120,
      color: '#06b6d4',
    },
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
      <div className="sticky top-0 z-50 px-4 py-4" style={{ background: 'rgba(5, 5, 5, 0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <ArrowLeft size={20} className="text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-white">Voice Statistik</h1>
            <p className="text-xs text-white/50">Deine Sprach-Aktivität</p>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="px-5 py-4">
        <GlassCard className="p-6 text-center" glow="rgba(139, 92, 246, 0.2)">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.2))',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Mic size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-1">{formatTime(stats.totalTalkTime)}</h2>
          <p className="text-sm text-white/60">Gesamte Sprechzeit</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs text-violet-400 font-bold">{tier.badge} {tier.name}</span>
            <span className="text-white/30">•</span>
            <span className="text-xs text-white/50">Level {levelData.level}</span>
          </div>
        </GlassCard>
      </div>

      {/* Stats Grid */}
      <div className="px-5 py-2">
        <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">Übersicht</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Headphones size={22} className="text-blue-400" />}
            value={formatTime(stats.totalListenTime)}
            label="Zuhörzeit"
            color="#3b82f6"
          />
          <StatCard
            icon={<Radio size={22} className="text-emerald-400" />}
            value={stats.roomsJoined}
            label="Rooms besucht"
            color="#10b981"
          />
          <StatCard
            icon={<Users size={22} className="text-amber-400" />}
            value={stats.uniqueUsers}
            label="User getroffen"
            color="#f59e0b"
          />
          <StatCard
            icon={<Calendar size={22} className="text-rose-400" />}
            value={stats.daysActive}
            label="Aktive Tage"
            color="#f43f5e"
          />
        </div>
      </div>

      {/* XP from Voice */}
      <div className="px-5 py-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251, 191, 36, 0.2)' }}
            >
              <Zap size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">XP durch Voice</p>
              <p className="text-xs text-white/50">So verdienst du Punkte</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <span className="text-white/70">🎤 Sprechen (pro Minute)</span>
              <span className="text-emerald-400 font-bold">+5 XP</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <span className="text-white/70">👂 Zuhören (pro Minute)</span>
              <span className="text-emerald-400 font-bold">+1 XP</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <span className="text-white/70">🚀 Room erstellen</span>
              <span className="text-emerald-400 font-bold">+15 XP</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Achievements */}
      <div className="px-5 py-4">
        <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Trophy size={14} />
          Voice Achievements
        </h3>
        <div className="space-y-3">
          {achievements.map((achievement, index) => (
            <VoiceAchievement key={index} {...achievement} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-4">
        <motion.button
          onClick={() => navigate('/rooms')}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
          }}
        >
          <Radio size={20} />
          Jetzt einen Room joinen
        </motion.button>
      </div>
    </div>
  );
}
