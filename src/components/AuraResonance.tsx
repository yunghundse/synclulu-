/**
 * AuraResonance.tsx
 * 🌊 AURA-RESONANZ SYSTEM - Anti-Snap Philosophy
 * 
 * Zeigt die TIEFE einer Verbindung, nicht oberflächliche Follower-Zahlen.
 * Die Resonanz basiert auf:
 * - Gemeinsame Sync-Zeit
 * - Interaktionshäufigkeit
 * - Streak-Länge
 * - Gegenseitige Bewertungen
 * 
 * @version 1.0.0
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

interface AuraResonanceProps {
  syncMinutes: number;
  streakDays: number;
  interactions: number;
  mutualRating?: number;
  compact?: boolean;
}

// Berechne Resonanz-Level (0-100)
const calculateResonance = (
  syncMinutes: number,
  streakDays: number,
  interactions: number,
  mutualRating: number = 5
): number => {
  // Gewichtung: Sync-Zeit 40%, Streaks 25%, Interaktionen 20%, Rating 15%
  const syncScore = Math.min(syncMinutes / 600, 1) * 40; // Max bei 10h
  const streakScore = Math.min(streakDays / 30, 1) * 25; // Max bei 30 Tagen
  const interactionScore = Math.min(interactions / 50, 1) * 20; // Max bei 50
  const ratingScore = (mutualRating / 5) * 15;
  
  return Math.round(syncScore + streakScore + interactionScore + ratingScore);
};

// Resonanz-Stufe Text
const getResonanceLevel = (score: number): { label: string; color: string; glow: string } => {
  if (score >= 90) return { 
    label: 'Seelenverwandt', 
    color: 'text-purple-400', 
    glow: 'rgba(168, 85, 247, 0.5)' 
  };
  if (score >= 75) return { 
    label: 'Tiefe Verbindung', 
    color: 'text-blue-400', 
    glow: 'rgba(96, 165, 250, 0.4)' 
  };
  if (score >= 50) return { 
    label: 'Gute Resonanz', 
    color: 'text-emerald-400', 
    glow: 'rgba(52, 211, 153, 0.3)' 
  };
  if (score >= 25) return { 
    label: 'Wachsend', 
    color: 'text-amber-400', 
    glow: 'rgba(251, 191, 36, 0.2)' 
  };
  return { 
    label: 'Neu', 
    color: 'text-white/50', 
    glow: 'transparent' 
  };
};

export const AuraResonance = memo(function AuraResonance({
  syncMinutes,
  streakDays,
  interactions,
  mutualRating = 5,
  compact = false,
}: AuraResonanceProps) {
  const score = calculateResonance(syncMinutes, streakDays, interactions, mutualRating);
  const { label, color, glow } = getResonanceLevel(score);

  if (compact) {
    return (
      <motion.div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${color}`}
        style={{ 
          background: 'rgba(255, 255, 255, 0.05)',
          boxShadow: `0 0 15px ${glow}`
        }}
        animate={{ 
          boxShadow: [
            `0 0 10px ${glow}`,
            `0 0 20px ${glow}`,
            `0 0 10px ${glow}`
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="text-[10px] font-bold">{score}%</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 rounded-2xl"
      style={{ 
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Aura-Resonanz
        </span>
        <span className={`text-lg font-bold ${color}`}>{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${glow}, ${color.replace('text-', '#')})`,
            boxShadow: `0 0 10px ${glow}`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          <span>{syncMinutes}min</span>
          <span>•</span>
          <span>{streakDays}d Streak</span>
        </div>
      </div>
    </motion.div>
  );
});

// Export für Profil-Seiten
export const AuraResonanceCompact = memo(function AuraResonanceCompact(props: AuraResonanceProps) {
  return <AuraResonance {...props} compact />;
});

export default AuraResonance;
