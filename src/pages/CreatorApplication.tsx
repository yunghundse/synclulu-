/**
 * CreatorApplication.tsx
 * 🎨 CREATOR PROGRAM - Coming Soon
 *
 * @version 34.0.0 - Complete Rebuild
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Crown,
  Mic,
  BarChart3,
  Users,
  Bell,
  Star,
  Gift,
} from 'lucide-react';

export default function CreatorApplication() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Crown,
      color: '#fbbf24',
      title: 'Creator Badge',
      desc: 'Verifiziertes Abzeichen für deinen Account',
    },
    {
      icon: Mic,
      color: '#ec4899',
      title: 'Voice-Room Hosting',
      desc: 'Erweiterte Features für deine Räume',
    },
    {
      icon: BarChart3,
      color: '#3b82f6',
      title: 'Analytics',
      desc: 'Statistiken zu deinem Content',
    },
    {
      icon: Users,
      color: '#22c55e',
      title: 'Community Tools',
      desc: 'Moderations-Features',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
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
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-purple-400" />
          Creator Programm
        </h1>
      </div>

      {/* Content */}
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
          {/* Background Glow */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2))',
                border: '2px solid rgba(168, 85, 247, 0.4)',
              }}
            >
              <Crown size={48} className="text-amber-400" />
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-black text-white mb-2">COMING SOON</h2>
            <p className="text-lg text-purple-300 font-semibold mb-4">
              Wir suchen bald Creator
            </p>
            <p className="text-white/50 text-sm max-w-xs mx-auto">
              Das Creator-Programm startet bald. Sammle jetzt XP und baue deine
              Community auf!
            </p>
          </div>
        </motion.div>

        {/* Teaser */}
        <div className="text-center mb-8">
          <p className="text-xl font-bold text-white mb-1">Bleib gespannt! ✨</p>
          <p className="text-sm text-white/40">Details folgen in Kürze</p>
        </div>

        {/* Features Preview */}
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 text-center">
          Was dich erwartet
        </p>
        <div className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${feature.color}15`, color: feature.color }}
              >
                <feature.icon size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{feature.title}</p>
                <p className="text-xs text-white/40">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Notify Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/notifications')}
          className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-white"
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <Bell size={20} className="text-purple-400" />
          Benachrichtigung aktivieren
        </motion.button>
        <p className="text-[10px] text-white/30 text-center mt-3">
          Wir informieren dich, sobald es losgeht
        </p>
      </div>
    </div>
  );
}
