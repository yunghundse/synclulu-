/**
 * BattlePass.tsx
 * 🏆 BATTLE PASS - COMING SUMMER 2026
 *
 * Clean Summer-Tease page - no rewards, no items
 * Only invite CTA for early XP boosts
 *
 * @version 33.0.0 - Database-First Edition
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  UserPlus,
  Calendar,
  Sparkles,
  Gift,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

export default function BattlePass() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [userData, setUserData] = useState<{ xp: number; inviteCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real user data from DB
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            xp: data.xp || data.totalXP || 0,
            inviteCount: data.inviteCount || data.successfulInvites || 0,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('[BattlePass] Error fetching user:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const isFounder = user?.id === FOUNDER_UID;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ArrowLeft size={20} className="text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-purple-400" />
            Battle Pass
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-8 mb-8 overflow-hidden text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          {/* Animated Background Glow */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Floating Icons */}
          <motion.div
            className="absolute top-8 left-8"
            animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Star size={24} className="text-amber-400/50" />
          </motion.div>
          <motion.div
            className="absolute top-12 right-12"
            animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          >
            <Crown size={28} className="text-purple-400/50" />
          </motion.div>
          <motion.div
            className="absolute bottom-8 left-12"
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles size={20} className="text-pink-400/50" />
          </motion.div>

          {/* Main Content */}
          <div className="relative z-10">
            {/* Big Trophy Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2))',
                border: '2px solid rgba(168, 85, 247, 0.4)',
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Trophy size={48} className="text-purple-400" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-black text-white mb-2">BATTLE PASS</h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calendar size={16} className="text-pink-400" />
                <span className="text-lg font-bold text-pink-400">COMING SUMMER 2026</span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed mb-6"
            >
              Lade Freunde ein, um dir frühzeitig XP-Boosts zu sichern und als Erster
              exklusive Belohnungen freizuschalten!
            </motion.p>

            {/* Current XP Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl mb-6"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}
            >
              <Zap size={20} className="text-amber-400" />
              <div className="text-left">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Deine XP</p>
                <p className="text-xl font-black text-amber-400">
                  {(userData?.xp || 0).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Invite CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <UserPlus size={22} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Freunde einladen</h3>
              <p className="text-xs text-white/40">Sichere dir Vorab-XP für den Summer Pass</p>
            </div>
          </div>

          {/* Invite Stats */}
          <div
            className="p-4 rounded-xl mb-4"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Eingeladene Freunde</span>
              <span className="text-lg font-bold text-green-400">{userData?.inviteCount || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-white/50">Bonus-XP gesichert</span>
              <span className="text-lg font-bold text-amber-400">
                +{(userData?.inviteCount || 0) * 100} XP
              </span>
            </div>
          </div>

          {/* Invite Button */}
          <motion.button
            onClick={() => navigate('/invites')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.15))',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: 'white',
            }}
          >
            <UserPlus size={20} />
            Jetzt Freunde einladen
          </motion.button>

          <p className="text-[10px] text-white/30 text-center mt-3">
            +100 XP für jeden Freund, der beitritt
          </p>
        </motion.div>

      </div>
    </div>
  );
}
