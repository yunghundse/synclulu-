/**
 * Streaks.tsx
 * 🔥 SOVEREIGN STREAKS PAGE - Daily Activity Tracking
 *
 * Features:
 * - Current streak display
 * - Streak history calendar
 * - Friend streaks comparison
 * - Rewards for milestones
 *
 * @version 35.1.0 - Streaks Edition
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
  Crown,
  Zap,
  Star,
  Users,
  Lock,
  Check,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface StreakMilestone {
  days: number;
  title: string;
  reward: string;
  icon: React.ReactNode;
  xpBonus: number;
  unlocked: boolean;
}

export default function Streaks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDaysActive, setTotalDaysActive] = useState(0);
  const [streakHistory, setStreakHistory] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);

  // Load streak data
  useEffect(() => {
    if (!user?.id) return;

    const fetchStreakData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentStreak(data.currentStreak || 0);
          setLongestStreak(data.longestStreak || data.currentStreak || 0);
          setTotalDaysActive(data.daysActive || 0);

          // Generate streak history (last 30 days)
          const history: boolean[] = [];
          const streakDates = data.streakDates || [];
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            history.push(streakDates.includes(dateStr));
          }
          setStreakHistory(history);
        }
      } catch (error) {
        console.error('[Streaks] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, [user?.id]);

  const milestones: StreakMilestone[] = [
    { days: 3, title: 'Anfänger', reward: 'Bronze Badge', icon: <Flame size={16} className="text-orange-400" />, xpBonus: 50, unlocked: currentStreak >= 3 },
    { days: 7, title: 'Woche geschafft', reward: 'Silber Badge', icon: <Star size={16} className="text-gray-400" />, xpBonus: 100, unlocked: currentStreak >= 7 },
    { days: 14, title: 'Zwei Wochen', reward: 'Gold Badge', icon: <Trophy size={16} className="text-amber-400" />, xpBonus: 200, unlocked: currentStreak >= 14 },
    { days: 30, title: 'Monats-Master', reward: 'Platin Badge', icon: <Crown size={16} className="text-purple-400" />, xpBonus: 500, unlocked: currentStreak >= 30 },
    { days: 100, title: 'Legendary', reward: 'Diamant Badge + Aura', icon: <Zap size={16} className="text-cyan-400" />, xpBonus: 2000, unlocked: currentStreak >= 100 },
  ];

  const nextMilestone = milestones.find((m) => !m.unlocked);
  const daysToNextMilestone = nextMilestone ? nextMilestone.days - currentStreak : 0;

  // Get day names for calendar
  const getDayName = (index: number) => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return days[date.getDay()];
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame size={20} className="text-orange-400" />
              Dein Streak
            </h1>
            <p className="text-xs text-white/40">Bleib jeden Tag aktiv!</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* Main Streak Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl text-center mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 0 40px rgba(249, 115, 22, 0.2)',
          }}
        >
          {/* Animated Flame */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(249, 115, 22, 0.1))',
              border: '2px solid rgba(249, 115, 22, 0.4)',
              boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
            }}
          >
            <Flame size={48} className="text-orange-400" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <span className="text-6xl font-black text-white">{currentStreak}</span>
            <p className="text-lg text-orange-400 font-bold mt-1">
              {currentStreak === 1 ? 'Tag' : 'Tage'} in Folge
            </p>
          </motion.div>

          {/* Next milestone hint */}
          {nextMilestone && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/50">
                Noch <span className="text-orange-400 font-bold">{daysToNextMilestone} Tage</span> bis zum{' '}
                <span className="text-white font-medium">{nextMilestone.title}</span> Badge!
              </p>
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="p-4 rounded-2xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Trophy size={24} className="mx-auto text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-white">{longestStreak}</p>
            <p className="text-xs text-white/40">Längster Streak</p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Calendar size={24} className="mx-auto text-purple-400 mb-2" />
            <p className="text-2xl font-bold text-white">{totalDaysActive}</p>
            <p className="text-xs text-white/40">Tage aktiv</p>
          </div>
        </div>

        {/* Calendar View - Last 30 Days */}
        <div
          className="p-4 rounded-2xl mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              Letzte 30 Tage
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {streakHistory.map((active, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="aspect-square rounded-lg flex flex-col items-center justify-center"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(249, 115, 22, 0.2))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: active
                    ? '1px solid rgba(249, 115, 22, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {active && <Flame size={12} className="text-orange-400" />}
                <span className="text-[8px] text-white/30 mt-0.5">{getDayName(index)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Gift size={16} className="text-purple-400" />
            Meilensteine & Rewards
          </h3>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: milestone.unlocked
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: milestone.unlocked
                    ? '1px solid rgba(168, 85, 247, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  opacity: milestone.unlocked ? 1 : 0.6,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: milestone.unlocked
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {milestone.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{milestone.title}</span>
                    <span className="text-[10px] text-white/30">{milestone.days} Tage</span>
                  </div>
                  <p className="text-xs text-white/40">{milestone.reward}</p>
                </div>
                <div className="text-right">
                  {milestone.unlocked ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Lock size={14} className="text-white/20" />
                  )}
                  <p className="text-[10px] text-green-400 mt-1">+{milestone.xpBonus} XP</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div
          className="mt-6 p-4 rounded-2xl text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <p className="text-xs text-white/50">
            💡 Tipp: Öffne synclulu täglich und führe mindestens ein Gespräch,
            um deinen Streak zu verlängern!
          </p>
        </div>
      </div>
    </div>
  );
}
