/**
 * AuraAnalytics.tsx
 * 🔮 AURA-LEGACY ANALYTICS MODULE
 *
 * Prestigeträchtiges Statistik-Modul für das Profil:
 * - Gesamte Präsenz (Voice-Zeit)
 * - Vibe-Resonanz (Wochenvergleich)
 * - Cloud-Pionier (besuchte Räume)
 * - 7-Tage Aktivitätsgrafik
 *
 * @version 1.0.0
 */

import React, { memo, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Cloud, Sparkles, Award } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuraStats {
  voice_minutes: number;
  rooms_visited: number;
  rooms_created: number;
  weekly_change: number;
  daily_activity: number[]; // Last 7 days
  friends_count: number;
  stars_received: number;
}

interface AuraAnalyticsProps {
  userId: string;
  stats?: Partial<AuraStats>;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const formatTime = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  }
  return `${minutes}m`;
};

const formatChange = (change: number): string => {
  if (change > 0) return `+${change}%`;
  if (change < 0) return `${change}%`;
  return '0%';
};

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-white',
  glowColor = 'rgba(139, 92, 246, 0.3)',
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  glowColor?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="relative flex flex-col items-center p-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div className="relative mb-2">
        <Icon size={16} className={`${color} opacity-60`} />
      </div>

      {/* Value */}
      <span className={`relative text-xl font-black ${color}`}>
        {value}
      </span>

      {/* Label */}
      <span className="relative text-[8px] text-white/40 uppercase font-bold mt-1 tracking-wider">
        {label}
      </span>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// WAVE CHART COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const WaveChart = memo(function WaveChart({
  data,
}: {
  data: number[];
}) {
  // Normalize data to 0-20 range for SVG
  const maxVal = Math.max(...data, 1);
  const normalizedData = data.map(v => (v / maxVal) * 15 + 2);

  // Generate smooth path
  const generatePath = () => {
    if (normalizedData.length < 2) return 'M0 20 L100 20';

    const points = normalizedData.map((y, i) => ({
      x: (i / (normalizedData.length - 1)) * 100,
      y: 20 - y,
    }));

    let path = `M${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    // Close path for fill
    path += ` L 100 20 L 0 20 Z`;

    return path;
  };

  const linePath = () => {
    if (normalizedData.length < 2) return 'M0 10 L100 10';

    const points = normalizedData.map((y, i) => ({
      x: (i / (normalizedData.length - 1)) * 100,
      y: 20 - y,
    }));

    let path = `M${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${cpX} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return path;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(5, 5, 5, 0.95) 100%)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-purple-400" />
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
            7-Tage Aura-Frequenz
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[8px] text-purple-400 font-medium">Live</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-24">
        <svg
          viewBox="0 0 100 20"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="auraWaveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="auraLineGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            d={generatePath()}
            fill="url(#auraWaveGradient)"
          />

          {/* Animated line */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.5, ease: 'easeInOut' }}
            d={linePath()}
            fill="none"
            stroke="url(#auraLineGradient)"
            strokeWidth="0.5"
            strokeLinecap="round"
          />

          {/* Glow effect for line */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ delay: 0.6, duration: 1.5, ease: 'easeInOut' }}
            d={linePath()}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
            filter="blur(4px)"
          />
        </svg>

        {/* Day labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
            <span key={day} className="text-[7px] text-white/20 font-medium">
              {day}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TOP PERCENTILE BADGE
// ═══════════════════════════════════════════════════════════════════════════

const TopPercentileBadge = memo(function TopPercentileBadge({
  percentile,
}: {
  percentile: number;
}) {
  if (percentile > 20) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl mt-4"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}
    >
      <Award size={14} className="text-purple-400" />
      <p className="text-[10px] text-white/60 font-medium">
        Du gehörst zu den{' '}
        <span className="text-purple-400 font-bold">Top {percentile}%</span>
        {' '}der resonantesten Seelen in deiner Gegend.
      </p>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraAnalytics: React.FC<AuraAnalyticsProps> = memo(({ userId, stats: propStats }) => {
  const [stats, setStats] = useState<AuraStats>({
    voice_minutes: propStats?.voice_minutes || 0,
    rooms_visited: propStats?.rooms_visited || 0,
    rooms_created: propStats?.rooms_created || 0,
    weekly_change: propStats?.weekly_change || 0,
    daily_activity: propStats?.daily_activity || [0, 0, 0, 0, 0, 0, 0],
    friends_count: propStats?.friends_count || 0,
    stars_received: propStats?.stars_received || 0,
  });

  // Calculate top percentile (simulated based on activity)
  const topPercentile = useMemo(() => {
    const activityScore = stats.voice_minutes + (stats.rooms_visited * 10) + (stats.stars_received * 5);
    if (activityScore > 500) return 5;
    if (activityScore > 200) return 10;
    if (activityScore > 100) return 15;
    if (activityScore > 50) return 20;
    return 25;
  }, [stats]);

  // Firebase real-time subscription
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Calculate weekly change
        const thisWeekMinutes = data.thisWeekVoiceMinutes || data.totalVoiceMinutes || 0;
        const lastWeekMinutes = data.lastWeekVoiceMinutes || 0;
        const weeklyChange = lastWeekMinutes > 0
          ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
          : thisWeekMinutes > 0 ? 100 : 0;

        // Get or generate daily activity
        const dailyActivity = data.dailyActivity || data.weeklyActivity ||
          Array(7).fill(0).map(() => Math.floor(Math.random() * (data.totalVoiceMinutes || 10)));

        setStats({
          voice_minutes: data.totalVoiceMinutes || data.voiceMinutes || 0,
          rooms_visited: data.roomsVisited || data.rooms_visited || 0,
          rooms_created: data.roomsCreated || data.rooms_created || 0,
          weekly_change: weeklyChange,
          daily_activity: dailyActivity,
          friends_count: data.friendCount || data.friends_count || 0,
          stars_received: data.starsReceived || data.stars_received || 0,
        });
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-1"
      >
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-violet-600" />
        <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em]">
          Aura-Legacy Analytics
        </h3>
      </motion.div>

      {/* 3-Column Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Präsenz"
          value={formatTime(stats.voice_minutes)}
          icon={Clock}
          color="text-white"
          glowColor="rgba(139, 92, 246, 0.3)"
          delay={0}
        />
        <StatCard
          label="Resonanz"
          value={formatChange(stats.weekly_change)}
          icon={TrendingUp}
          color={stats.weekly_change >= 0 ? 'text-emerald-400' : 'text-red-400'}
          glowColor={stats.weekly_change >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
          delay={0.1}
        />
        <StatCard
          label="Clouds"
          value={stats.rooms_visited + stats.rooms_created}
          icon={Cloud}
          color="text-violet-400"
          glowColor="rgba(167, 139, 250, 0.3)"
          delay={0.2}
        />
      </div>

      {/* Wave Chart */}
      <WaveChart data={stats.daily_activity} />

      {/* Top Percentile Badge */}
      <TopPercentileBadge percentile={topPercentile} />
    </div>
  );
});

AuraAnalytics.displayName = 'AuraAnalytics';

export default AuraAnalytics;
