/**
 * Streaks.tsx
 * 🔥 TÄGLICHE STREAKS SEITE - Streak Tracking & Rewards
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Calendar,
  Trophy,
  Gift,
  Zap,
  Star,
  Target,
  ChevronRight,
  Check,
  Lock,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

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
// STREAK MILESTONE
// ═══════════════════════════════════════════════════════════════════════════

interface StreakMilestone {
  days: number;
  title: string;
  reward: string;
  xpBonus: number;
  icon: React.ReactNode;
  unlocked: boolean;
}

const MilestoneCard = ({
  milestone,
  currentStreak,
}: {
  milestone: StreakMilestone;
  currentStreak: number;
}) => {
  const progress = Math.min(100, (currentStreak / milestone.days) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{
        background: milestone.unlocked
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.1))'
          : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${milestone.unlocked ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center relative"
          style={{
            background: milestone.unlocked
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(249, 115, 22, 0.2))'
              : 'rgba(255, 255, 255, 0.05)',
            boxShadow: milestone.unlocked ? '0 0 20px rgba(249, 115, 22, 0.3)' : undefined,
          }}
        >
          {milestone.icon}
          {milestone.unlocked && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#10b981' }}
            >
              <Check size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">{milestone.title}</p>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: milestone.unlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: milestone.unlocked ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {milestone.days} TAGE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">{milestone.reward}</p>

          {!milestone.unlocked && (
            <div className="mt-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Noch {milestone.days - currentStreak} Tage
              </p>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-amber-400">+{milestone.xpBonus}</span>
          <p className="text-[10px] text-white/40">XP Bonus</p>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR WEEK VIEW
// ═══════════════════════════════════════════════════════════════════════════

const WeekCalendar = ({ activeDays }: { activeDays: number[] }) => {
  const today = new Date();
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const currentDayIndex = (today.getDay() + 6) % 7; // Monday = 0

  return (
    <div className="flex justify-between gap-2">
      {days.map((day, index) => {
        const isToday = index === currentDayIndex;
        const isPast = index < currentDayIndex;
        const isActive = activeDays.includes(index);

        return (
          <div key={day} className="flex-1 text-center">
            <p className="text-[10px] text-white/40 mb-2">{day}</p>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.5), rgba(249, 115, 22, 0.3))'
                  : isToday
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: isToday
                  ? '2px solid #a855f7'
                  : isActive
                  ? '1px solid rgba(249, 115, 22, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isActive ? '0 0 15px rgba(249, 115, 22, 0.3)' : undefined,
              }}
            >
              {isActive ? (
                <Flame size={18} className="text-orange-400" />
              ) : isPast ? (
                <div className="w-2 h-2 rounded-full bg-white/20" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/10" />
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Streaks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: null as Date | null,
    thisWeekDays: [] as number[],
  });

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const today = new Date();
          const currentDayIndex = (today.getDay() + 6) % 7;

          // Simulate active days this week based on streak
          const streak = data.streakDays || data.daysActive || 0;
          const activeDays: number[] = [];
          for (let i = 0; i <= currentDayIndex && i < streak; i++) {
            activeDays.push(currentDayIndex - i);
          }

          setStreakData({
            currentStreak: streak,
            longestStreak: data.longestStreak || streak,
            totalActiveDays: data.daysActive || streak,
            lastActiveDate: data.lastActiveAt?.toDate() || new Date(),
            thisWeekDays: activeDays,
          });
        }
      } catch (error) {
        console.error('Error fetching streak data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreakData();
  }, [user?.id]);

  const milestones: StreakMilestone[] = [
    {
      days: 3,
      title: 'Starter',
      reward: 'Erstes Flame Badge',
      xpBonus: 50,
      icon: <Flame size={24} className={streakData.currentStreak >= 3 ? 'text-orange-400' : 'text-white/30'} />,
      unlocked: streakData.currentStreak >= 3,
    },
    {
      days: 7,
      title: 'Wochenkrieger',
      reward: '7-Tage Badge + XP Boost',
      xpBonus: 100,
      icon: <Star size={24} className={streakData.currentStreak >= 7 ? 'text-amber-400' : 'text-white/30'} />,
      unlocked: streakData.currentStreak >= 7,
    },
    {
      days: 14,
      title: 'Dedicated',
      reward: '2-Wochen Badge',
      xpBonus: 200,
      icon: <Trophy size={24} className={streakData.currentStreak >= 14 ? 'text-yellow-400' : 'text-white/30'} />,
      unlocked: streakData.currentStreak >= 14,
    },
    {
      days: 30,
      title: 'Monats-Meister',
      reward: 'Gold Flame + 2x XP Tag',
      xpBonus: 500,
      icon: <Gift size={24} className={streakData.currentStreak >= 30 ? 'text-rose-400' : 'text-white/30'} />,
      unlocked: streakData.currentStreak >= 30,
    },
    {
      days: 100,
      title: 'Legendary',
      reward: 'Legendary Badge + Exklusiver Frame',
      xpBonus: 2000,
      icon: <Target size={24} className={streakData.currentStreak >= 100 ? 'text-violet-400' : 'text-white/30'} />,
      unlocked: streakData.currentStreak >= 100,
    },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full"
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
            <h1 className="text-xl font-black text-white">Tägliche Streaks</h1>
            <p className="text-xs text-white/50">Halte deine Serie aufrecht</p>
          </div>
        </div>
      </div>

      {/* Hero Streak Counter */}
      <div className="px-5 py-4">
        <GlassCard className="p-6 text-center relative overflow-hidden" glow="rgba(249, 115, 22, 0.3)">
          {/* Animated Fire Background */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center bottom, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative">
            <motion.div
              className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.5), rgba(251, 146, 60, 0.3))',
                border: '3px solid rgba(249, 115, 22, 0.6)',
                boxShadow: '0 0 40px rgba(249, 115, 22, 0.5)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame size={48} className="text-orange-400" />
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-white mb-1">{streakData.currentStreak}</h2>
              <p className="text-lg text-orange-400 font-bold">Tage Streak 🔥</p>
            </motion.div>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{streakData.longestStreak}</p>
                <p className="text-[10px] text-white/50">Längster Streak</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-xl font-bold text-white">{streakData.totalActiveDays}</p>
                <p className="text-[10px] text-white/50">Tage gesamt</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* This Week */}
      <div className="px-5 py-4">
        <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} />
          Diese Woche
        </h3>
        <GlassCard className="p-4">
          <WeekCalendar activeDays={streakData.thisWeekDays} />
        </GlassCard>
      </div>

      {/* How to Keep Streak */}
      <div className="px-5 py-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16, 185, 129, 0.2)' }}
            >
              <Zap size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">So hältst du deinen Streak</p>
              <p className="text-xs text-white/50">Täglich aktiv sein</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <Check size={14} className="text-emerald-400" />
              <span className="text-white/70">Öffne die App täglich</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <Check size={14} className="text-emerald-400" />
              <span className="text-white/70">Tritt einem Voice Room bei</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <Check size={14} className="text-emerald-400" />
              <span className="text-white/70">Interagiere mit Freunden</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Milestones */}
      <div className="px-5 py-4">
        <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Trophy size={14} />
          Streak Meilensteine
        </h3>
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <MilestoneCard
              key={index}
              milestone={milestone}
              currentStreak={streakData.currentStreak}
            />
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
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            boxShadow: '0 8px 32px rgba(249, 115, 22, 0.4)',
          }}
        >
          <Flame size={20} />
          Streak heute sichern
        </motion.button>
      </div>
    </div>
  );
}
