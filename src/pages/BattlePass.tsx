/**
 * BattlePass.tsx
 * 🎮 SOVEREIGN BATTLE PASS & GAME CENTER v30.0
 *
 * FEATURES:
 * - Vertikaler Belohnungspfad
 * - Premium Card Design (OLED-Black + Gold)
 * - Sync-Zeit basierte Progression
 * - Exklusive Aura-Farben, Badges, Effekte
 * - Framer Motion Animationen
 *
 * @version 30.0.0 - Battle Pass Edition
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  Zap,
  Lock,
  Check,
  Sparkles,
  Star,
  Gift,
  Trophy,
  Target,
  Clock,
  ChevronRight,
  Gem,
  Flame,
  Shield,
  UserPlus,
  Calendar,
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  getLevelFromXP,
  getPrestigeTier,
  getNextMilestone,
  getAchievedMilestones,
  formatXP,
  MILESTONES,
  Milestone,
} from '@/lib/neuroLevelSystem';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Battle Pass Rewards (zusätzlich zu Level-Milestones)
interface BattlePassReward {
  tier: number;
  syncMinutesRequired: number;
  name: string;
  description: string;
  rewardType: 'aura' | 'badge' | 'effect' | 'frame' | 'title';
  icon: string;
  color: string;
  isPremium: boolean;
}

const BATTLE_PASS_REWARDS: BattlePassReward[] = [
  {
    tier: 1,
    syncMinutesRequired: 30,
    name: 'First Sync',
    description: 'Basis-Aura Glow',
    rewardType: 'aura',
    icon: '✨',
    color: '#60a5fa',
    isPremium: false,
  },
  {
    tier: 2,
    syncMinutesRequired: 60,
    name: 'Rising Glow',
    description: 'Blauer Aura-Ring',
    rewardType: 'aura',
    icon: '💫',
    color: '#3b82f6',
    isPremium: false,
  },
  {
    tier: 3,
    syncMinutesRequired: 120,
    name: 'Connector Badge',
    description: 'Community Badge',
    rewardType: 'badge',
    icon: '🔗',
    color: '#22d3ee',
    isPremium: false,
  },
  {
    tier: 4,
    syncMinutesRequired: 180,
    name: 'Nebula Frame',
    description: 'Profilrahmen',
    rewardType: 'frame',
    icon: '🌌',
    color: '#a855f7',
    isPremium: true,
  },
  {
    tier: 5,
    syncMinutesRequired: 300,
    name: 'Pulse Effect',
    description: 'Pulsierender Glow',
    rewardType: 'effect',
    icon: '💜',
    color: '#9333ea',
    isPremium: false,
  },
  {
    tier: 6,
    syncMinutesRequired: 500,
    name: 'Elite Title',
    description: '"Elite Syncer" Titel',
    rewardType: 'title',
    icon: '👑',
    color: '#f97316',
    isPremium: true,
  },
  {
    tier: 7,
    syncMinutesRequired: 750,
    name: 'Flame Aura',
    description: 'Feuer-Aura Effekt',
    rewardType: 'aura',
    icon: '🔥',
    color: '#ea580c',
    isPremium: false,
  },
  {
    tier: 8,
    syncMinutesRequired: 1000,
    name: 'Diamond Badge',
    description: 'Diamant-Badge',
    rewardType: 'badge',
    icon: '💎',
    color: '#06b6d4',
    isPremium: true,
  },
  {
    tier: 9,
    syncMinutesRequired: 1500,
    name: 'God-Ray Effect',
    description: 'Strahlen-Effekt',
    rewardType: 'effect',
    icon: '⚡',
    color: '#fbbf24',
    isPremium: true,
  },
  {
    tier: 10,
    syncMinutesRequired: 2000,
    name: 'Sovereign Crown',
    description: 'Goldene Krone',
    rewardType: 'badge',
    icon: '✨',
    color: '#fbbf24',
    isPremium: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// REWARD CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const RewardCard = ({
  reward,
  isUnlocked,
  isNext,
  progress,
  index,
}: {
  reward: BattlePassReward;
  isUnlocked: boolean;
  isNext: boolean;
  progress: number;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Connection line to next */}
      {index < BATTLE_PASS_REWARDS.length - 1 && (
        <div
          className="absolute left-6 top-[72px] w-0.5 h-8"
          style={{
            background: isUnlocked
              ? 'linear-gradient(180deg, #fbbf24, #fbbf2440)'
              : 'rgba(255, 255, 255, 0.1)',
          }}
        />
      )}

      <div
        className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all ${
          isNext ? 'scale-[1.02]' : ''
        }`}
        style={{
          background: isUnlocked
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))'
            : isNext
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.03))'
            : 'rgba(255, 255, 255, 0.02)',
          border: isUnlocked
            ? '1px solid rgba(251, 191, 36, 0.3)'
            : isNext
            ? '1px solid rgba(139, 92, 246, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Tier indicator */}
        <div className="relative">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: isUnlocked
                ? `linear-gradient(135deg, ${reward.color}40, ${reward.color}20)`
                : 'rgba(255, 255, 255, 0.05)',
              border: isUnlocked ? `2px solid ${reward.color}` : '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isUnlocked ? `0 0 20px ${reward.color}30` : 'none',
            }}
          >
            {isUnlocked ? (
              reward.icon
            ) : (
              <Lock size={18} className="text-white/30" />
            )}
          </motion.div>

          {/* Check mark for unlocked */}
          {isUnlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <Check size={12} className="text-white" />
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isUnlocked ? `${reward.color}20` : 'rgba(255, 255, 255, 0.05)',
                color: isUnlocked ? reward.color : 'rgba(255, 255, 255, 0.4)',
              }}
            >
              TIER {reward.tier}
            </span>
            {reward.isPremium && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                <Gem size={8} />
                PREMIUM
              </span>
            )}
          </div>
          <h4
            className="font-bold mt-1"
            style={{ color: isUnlocked ? 'white' : 'rgba(255, 255, 255, 0.6)' }}
          >
            {reward.name}
          </h4>
          <p className="text-[11px] text-white/40">{reward.description}</p>
        </div>

        {/* Minutes required */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-white/40">
            <Clock size={12} />
            <span className="text-xs font-bold">
              {reward.syncMinutesRequired}m
            </span>
          </div>
          {isNext && progress > 0 && (
            <div className="mt-1 w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #a855f7, #c084fc)' }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STATS CARD
// ═══════════════════════════════════════════════════════════════

const StatsCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex-1 p-4 rounded-2xl text-center"
    style={{
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      border: `1px solid ${color}20`,
    }}
  >
    <Icon size={20} className="mx-auto mb-2" style={{ color }} />
    <p className="text-lg font-black text-white">{value}</p>
    <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function BattlePass() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [userData, setUserData] = useState<{
    xp: number;
    syncMinutes: number;
    unlockedRewards: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserData({
            xp: data.xp || data.totalXP || 0,
            syncMinutes: data.syncMinutes || data.minutesTalked || 0,
            unlockedRewards: data.unlockedRewards || [],
          });
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Calculate level data
  const levelData = useMemo(() => {
    if (!userData) return getLevelFromXP(0);
    return getLevelFromXP(userData.xp);
  }, [userData?.xp]);

  const tier = useMemo(() => getPrestigeTier(levelData.level), [levelData.level]);
  const nextMilestone = useMemo(() => getNextMilestone(levelData.level), [levelData.level]);
  const achievedMilestones = useMemo(() => getAchievedMilestones(levelData.level), [levelData.level]);

  // Battle pass progress
  const syncMinutes = userData?.syncMinutes || 0;
  const currentTier = BATTLE_PASS_REWARDS.filter(r => syncMinutes >= r.syncMinutesRequired).length;
  const nextReward = BATTLE_PASS_REWARDS.find(r => syncMinutes < r.syncMinutesRequired);
  const progressToNext = nextReward
    ? Math.min(100, (syncMinutes / nextReward.syncMinutesRequired) * 100)
    : 100;

  const isFounder = user?.id === FOUNDER_UID;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#050505' }}
      >
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0510 100%)' }}
    >
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none z-0">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          backdropFilter: 'blur(40px)',
          borderBottom: '1px solid rgba(251, 191, 36, 0.1)',
        }}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              Battle Pass
            </h1>
            <p className="text-xs text-amber-400/60">Season 1 • Sync & Rise</p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <span className="text-sm font-black text-amber-400">
              Tier {currentTier}/{BATTLE_PASS_REWARDS.length}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 relative z-10">
        {/* Coming Summer 2026 Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.15))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          {/* Animated glow */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-pink-400" />
              <span className="text-xs font-black text-pink-400 uppercase tracking-wider">
                COMING SUMMER 2026
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Battle Pass Evolution
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Bereite dich auf die nächste Stufe vor. Sammle jetzt XP-Boosts!
            </p>

            <motion.button
              onClick={() => navigate('/invites')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.3))',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: 'white',
              }}
            >
              <UserPlus size={18} />
              Freunde einladen = +100 XP
            </motion.button>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 mb-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.02))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          {/* Decorative glow */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: `radial-gradient(circle, ${tier.color}30 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="flex items-center gap-4 relative z-10">
            {/* Level Ring */}
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: tier.gradient,
                  boxShadow: `0 0 30px ${tier.glowColor}`,
                }}
              >
                <span className="text-3xl font-black text-white">
                  {levelData.level || '—'}
                </span>
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -right-1 text-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {tier.emoji}
              </motion.div>
            </div>

            {/* Level info */}
            <div className="flex-1">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                {tier.nameDE}
              </p>
              <h2 className="text-xl font-bold text-white">Level {levelData.level}</h2>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white/40">Fortschritt</span>
                  <span className="text-amber-400 font-bold">
                    {formatXP(levelData.currentXP)} / {formatXP(levelData.neededXP)} XP
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelData.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: tier.gradient,
                      boxShadow: `0 0 10px ${tier.glowColor}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Next milestone hint */}
          {nextMilestone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
            >
              <span className="text-xl">{nextMilestone.icon}</span>
              <div className="flex-1">
                <p className="text-[10px] text-white/40 uppercase">Nächster Meilenstein</p>
                <p className="text-sm font-semibold text-white">
                  Level {nextMilestone.level} • {nextMilestone.reward}
                </p>
              </div>
              <span className="text-xs text-amber-400 font-bold">
                {nextMilestone.level - levelData.level} LVL
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          <StatsCard
            icon={Zap}
            label="Gesamt XP"
            value={formatXP(userData?.xp || 0)}
            color="#fbbf24"
          />
          <StatsCard
            icon={Clock}
            label="Sync-Zeit"
            value={`${syncMinutes}m`}
            color="#a855f7"
          />
          <StatsCard
            icon={Trophy}
            label="Rewards"
            value={`${currentTier}/${BATTLE_PASS_REWARDS.length}`}
            color="#22d3ee"
          />
        </div>

        {/* Battle Pass Path */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Gift size={16} className="text-amber-400" />
              Belohnungspfad
            </h3>
            <span className="text-[10px] text-white/40">
              Schalte Rewards durch Sync-Zeit frei
            </span>
          </div>

          <div className="space-y-3">
            {BATTLE_PASS_REWARDS.map((reward, index) => {
              const isUnlocked = syncMinutes >= reward.syncMinutesRequired;
              const isNext = !isUnlocked && (index === 0 || syncMinutes >= BATTLE_PASS_REWARDS[index - 1].syncMinutesRequired);
              const progress = isNext
                ? Math.min(100, (syncMinutes / reward.syncMinutesRequired) * 100)
                : 0;

              return (
                <RewardCard
                  key={reward.tier}
                  reward={reward}
                  isUnlocked={isUnlocked}
                  isNext={isNext}
                  progress={progress}
                  index={index}
                />
              );
            })}
          </div>
        </div>

        {/* Achieved Milestones */}
        {achievedMilestones.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Star size={16} className="text-amber-400" />
              Erreichte Meilensteine
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {achievedMilestones.slice(-6).map((milestone, index) => (
                <motion.div
                  key={milestone.level}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.02))',
                    border: '1px solid rgba(251, 191, 36, 0.15)',
                  }}
                >
                  <span className="text-2xl">{milestone.icon}</span>
                  <p className="text-[10px] font-bold text-white mt-1">Lvl {milestone.level}</p>
                  <p className="text-[9px] text-white/40 truncate">{milestone.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
