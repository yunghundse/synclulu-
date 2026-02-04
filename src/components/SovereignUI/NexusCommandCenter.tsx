/**
 * NexusCommandCenter.tsx
 * Exklusives Dashboard für den Founder
 * Transformiert sich wenn die UID des Gründers erkannt wird
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Users,
  Activity,
  MessageCircle,
  Zap,
  Globe,
  Shield,
  Settings,
  TrendingUp,
  Eye,
  Radio,
} from 'lucide-react';

// Founder UID - DEINE UID hier eintragen
const FOUNDER_UID = 'founder-uid-here'; // Wird später konfiguriert

interface NexusStats {
  totalUsers: number;
  activeNow: number;
  totalConversations: number;
  activeRooms: number;
  totalXPGenerated: number;
  newUsersToday: number;
}

interface NexusCommandCenterProps {
  userId: string;
  stats?: NexusStats;
  onNavigate?: (path: string) => void;
}

// God-Ray Hintergrund-Effekt
const GodRayBackground = React.memo(function GodRayBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Rotierende God-Rays */}
      <motion.div
        className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(251, 191, 36, 0.08) 20deg,
            transparent 40deg,
            rgba(251, 191, 36, 0.05) 80deg,
            transparent 100deg,
            rgba(251, 191, 36, 0.07) 140deg,
            transparent 160deg,
            rgba(251, 191, 36, 0.04) 200deg,
            transparent 220deg,
            rgba(251, 191, 36, 0.06) 280deg,
            transparent 300deg,
            rgba(251, 191, 36, 0.05) 340deg,
            transparent 360deg
          )`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* Golden Glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
});

// Stat Card mit Glow-Effekt
const StatCard = React.memo(function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative p-4 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          {trend && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </motion.div>
  );
});

// Live Activity Feed
const ActivityFeed = React.memo(function ActivityFeed() {
  const [activities] = useState([
    { type: 'join', user: 'User_4821', time: 'Gerade eben' },
    { type: 'room', user: 'Nova_Elite', time: 'Vor 2 Min' },
    { type: 'level', user: 'Spark_New', time: 'Vor 5 Min' },
    { type: 'sync', user: 'Flame_42', time: 'Vor 8 Min' },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
      className="p-4 rounded-2xl"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-medium text-white">Live Activity</span>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background:
                    activity.type === 'join'
                      ? 'rgba(34, 197, 94, 0.2)'
                      : activity.type === 'room'
                      ? 'rgba(168, 85, 247, 0.2)'
                      : activity.type === 'level'
                      ? 'rgba(251, 191, 36, 0.2)'
                      : 'rgba(96, 165, 250, 0.2)',
                }}
              >
                {activity.type === 'join' && <Users size={12} className="text-emerald-400" />}
                {activity.type === 'room' && <Radio size={12} className="text-violet-400" />}
                {activity.type === 'level' && <Zap size={12} className="text-amber-400" />}
                {activity.type === 'sync' && <Activity size={12} className="text-blue-400" />}
              </div>
              <span className="text-xs text-white/70">{activity.user}</span>
            </div>
            <span className="text-[10px] text-white/40">{activity.time}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

// Quick Action Button
const QuickAction = React.memo(function QuickAction({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-colors"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-xs text-white/60">{label}</span>
    </motion.button>
  );
});

export const NexusCommandCenter = React.memo(function NexusCommandCenter({
  userId,
  stats = {
    totalUsers: 0,
    activeNow: 0,
    totalConversations: 0,
    activeRooms: 0,
    totalXPGenerated: 0,
    newUsersToday: 0,
  },
  onNavigate,
}: NexusCommandCenterProps) {
  // Prüfe ob User Founder ist
  const isFounder = userId === FOUNDER_UID || userId === 'test-founder'; // Für Testing

  if (!isFounder) {
    return null; // Nicht für normale User anzeigen
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* God-Ray Background */}
      <GodRayBackground />

      {/* Content */}
      <div className="relative z-10 p-6 pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              boxShadow: '0 8px 32px rgba(251, 191, 36, 0.4)',
            }}
          >
            <Crown size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Nexus Command</h1>
            <p className="text-sm text-amber-400/80">Founder Control Center</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Gesamt User"
            value={stats.totalUsers.toLocaleString()}
            trend="+12%"
            color="#fbbf24"
            delay={0.2}
          />
          <StatCard
            icon={Eye}
            label="Jetzt Online"
            value={stats.activeNow}
            color="#22c55e"
            delay={0.3}
          />
          <StatCard
            icon={MessageCircle}
            label="Gespräche"
            value={stats.totalConversations.toLocaleString()}
            trend="+8%"
            color="#a855f7"
            delay={0.4}
          />
          <StatCard
            icon={Radio}
            label="Aktive Räume"
            value={stats.activeRooms}
            color="#60a5fa"
            delay={0.5}
          />
        </div>

        {/* Activity Feed */}
        <ActivityFeed />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <h3 className="text-sm font-medium text-white/60 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            <QuickAction
              icon={Globe}
              label="Broadcast"
              color="#fbbf24"
              onClick={() => onNavigate?.('/admin/broadcast')}
            />
            <QuickAction
              icon={Shield}
              label="Moderation"
              color="#ef4444"
              onClick={() => onNavigate?.('/admin/moderation')}
            />
            <QuickAction
              icon={Activity}
              label="Analytics"
              color="#a855f7"
              onClick={() => onNavigate?.('/admin/analytics')}
            />
            <QuickAction
              icon={Settings}
              label="Settings"
              color="#6b7280"
              onClick={() => onNavigate?.('/admin/settings')}
            />
          </div>
        </motion.div>

        {/* XP Generated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 p-4 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          <p className="text-amber-400/60 text-xs mb-1">Total XP Generated</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
            {stats.totalXPGenerated.toLocaleString()}
          </p>
        </motion.div>
      </div>
    </div>
  );
});

export default NexusCommandCenter;

// Export Founder UID für Konfiguration
export { FOUNDER_UID };
