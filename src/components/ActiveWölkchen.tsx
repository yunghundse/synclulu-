/**
 * ActiveWölkchen.tsx
 * ☁️ ACTIVE WÖLKCHEN SECTION v37.0
 *
 * Displays active rooms on Home page below level button
 * Sovereign Glass Design
 *
 * @version 37.0.0 - Sovereign Glass Edition
 */

import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cloud, Users, Mic, Lock, Eye, ChevronRight, Sparkles } from 'lucide-react';
import {
  subscribeToActiveWölkchen,
  getActivityLevel,
  getActivityColor,
  getActivityGlow,
  type Wölkchen,
} from '../lib/wölkchenService';
import { triggerHaptic } from '../lib/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// WÖLKCHEN CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface WölkchenCardProps {
  wölkchen: Wölkchen;
  onJoin: (id: string) => void;
}

const WölkchenCard = memo(function WölkchenCard({ wölkchen, onJoin }: WölkchenCardProps) {
  const activityLevel = getActivityLevel(wölkchen.participants.length);
  const activityColor = getActivityColor(activityLevel);
  const activityGlow = getActivityGlow(activityLevel);

  const getTypeIcon = () => {
    switch (wölkchen.type) {
      case 'anonym':
        return <Eye size={12} className="text-violet-400" />;
      case 'privat':
        return <Lock size={12} className="text-amber-400" />;
      default:
        return <Cloud size={12} className="text-emerald-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (wölkchen.type) {
      case 'anonym':
        return 'Anonym';
      case 'privat':
        return 'Privat';
      default:
        return 'Öffentlich';
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onJoin(wölkchen.id);
      }}
      className="w-full p-4 rounded-2xl text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: activityGlow,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Activity Indicator */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center relative"
          style={{
            background: `linear-gradient(135deg, ${activityColor}30, ${activityColor}10)`,
            border: `1px solid ${activityColor}50`,
          }}
        >
          <Cloud size={20} style={{ color: activityColor }} />
          {/* Pulse for active rooms */}
          {wölkchen.participants.length > 0 && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ border: `2px solid ${activityColor}` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate">{wölkchen.name}</p>
            {activityLevel === 'hot' && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/20 text-red-400">
                HOT
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {/* Type */}
            <div className="flex items-center gap-1">
              {getTypeIcon()}
              <span className="text-[10px] text-white/40">{getTypeLabel()}</span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-1">
              <Users size={10} className="text-white/40" />
              <span className="text-[10px] text-white/60">
                <span className="text-white font-medium">{wölkchen.participants.length}</span>
                /{wölkchen.maxParticipants}
              </span>
            </div>

            {/* Speaking indicator */}
            {wölkchen.participants.some((p) => p.isSpeaking) && (
              <div className="flex items-center gap-1">
                <Mic size={10} className="text-emerald-400" />
                <span className="text-[10px] text-emerald-400">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Join Arrow */}
        <ChevronRight size={18} className="text-white/30" />
      </div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════

const EmptyState = memo(function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <Cloud size={28} className="text-violet-400" />
      </div>
      <p className="text-sm font-medium text-white mb-1">Keine aktiven Wölkchen</p>
      <p className="text-xs text-white/40 mb-4">Sei der Erste und erstelle ein neues Wölkchen!</p>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('light');
          onCreate();
        }}
        className="px-5 py-2.5 rounded-xl font-medium text-sm text-white inline-flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.2))',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
        }}
      >
        <Sparkles size={16} />
        Wölkchen erstellen
      </motion.button>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ActiveWölkchenProps {
  maxDisplay?: number;
  showHeader?: boolean;
  onCreateRoom?: () => void;
}

export default function ActiveWölkchen({
  maxDisplay = 5,
  showHeader = true,
  onCreateRoom,
}: ActiveWölkchenProps) {
  const navigate = useNavigate();
  const [wölkchen, setWölkchen] = useState<Wölkchen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to active rooms
  useEffect(() => {
    const unsubscribe = subscribeToActiveWölkchen((rooms) => {
      setWölkchen(rooms.slice(0, maxDisplay));
      setIsLoading(false);
    }, maxDisplay + 5);

    return () => unsubscribe();
  }, [maxDisplay]);

  const handleJoin = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreate = () => {
    if (onCreateRoom) {
      onCreateRoom();
    } else {
      navigate('/discover');
    }
  };

  const handleViewAll = () => {
    triggerHaptic('light');
    navigate('/discover');
  };

  if (isLoading) {
    return (
      <div className="px-5 py-4">
        <div
          className="h-24 rounded-2xl animate-pulse"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud size={18} className="text-violet-400" />
            <h2 className="text-base font-bold text-white">Aktive Wölkchen</h2>
            {wölkchen.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#22c55e',
                }}
              >
                {wölkchen.length} LIVE
              </span>
            )}
          </div>

          {wölkchen.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleViewAll}
              className="text-xs text-violet-400 font-medium flex items-center gap-1"
            >
              Alle anzeigen
              <ChevronRight size={14} />
            </motion.button>
          )}
        </div>
      )}

      {/* Content */}
      {wölkchen.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {wölkchen.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <WölkchenCard wölkchen={room} onJoin={handleJoin} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export { WölkchenCard, EmptyState };
