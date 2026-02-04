/**
 * levelSystem.ts
 * 👑 SOVEREIGN LEVEL SYSTEM - Logarithmic XP Curve
 *
 * XP-Formel: Level 1-10 geht schnell (Dopamin-Hook),
 * ab Level 20 wird es zur Prestige-Sache.
 *
 * XP-Quellen-Gewichtung:
 * - Sync-Zeit (50%)
 * - Neue Freunde (30%)
 * - App-Streaks (20%)
 *
 * @version 2.0.0 - Sovereign Empire Edition
 */

import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  progress: number; // 0-1 für Animationen
  totalXP: number;
  rankName: string;
  rankColor: string;
  isMaxLevel: boolean;
}

export interface RankInfo {
  name: string;
  minLevel: number;
  color: string;
  glow: string;
  badge?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MAX_LEVEL = 100;

// ═══════════════════════════════════════════════════════════════════════════
// LOGARITHMIC XP CURVE
// Level 1-10: Schnell (100 * 1.5^level) - Dopamin Hook
// Level 11-20: Moderat (1.3x multiplier)
// Level 20+: Prestige (1.15x multiplier - sehr langsam)
// ═══════════════════════════════════════════════════════════════════════════

// Cache für Performance
const xpThresholdCache = new Map<number, number>();

/**
 * Berechnet XP-Schwellenwert für ein bestimmtes Level
 * Logarithmische Kurve für bessere Progression
 */
export const getLevelThreshold = (level: number): number => {
  if (level <= 0) return 0;

  // Cache check
  if (xpThresholdCache.has(level)) {
    return xpThresholdCache.get(level)!;
  }

  let xp: number;

  if (level <= 10) {
    // Early game: Schnelle Progression für Dopamin-Hook
    // Level 1: 100, Level 5: ~759, Level 10: ~3844
    xp = Math.floor(100 * Math.pow(1.5, level - 1));
  } else if (level <= 20) {
    // Mid game: Moderate Steigerung
    const base10 = 100 * Math.pow(1.5, 9); // ~3844
    xp = Math.floor(base10 * Math.pow(1.3, level - 10));
  } else {
    // Late game: Prestige-Kurve (langsam aber stetig)
    const base10 = 100 * Math.pow(1.5, 9);
    const base20 = base10 * Math.pow(1.3, 10); // ~53000
    xp = Math.floor(base20 * Math.pow(1.15, level - 20));
  }

  xpThresholdCache.set(level, xp);
  return xp;
};

// Alias für alte Kompatibilität
export const getXPForLevel = getLevelThreshold;

/**
 * Berechnet Gesamt-XP, die für ein bestimmtes Level benötigt werden (kumulativ)
 */
export const getTotalXPForLevel = (level: number): number => {
  if (level <= 1) return 0;

  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getLevelThreshold(i);
  }
  return total;
};

/**
 * Berechnet das Level basierend auf Gesamt-XP
 */
export const getLevelFromXP = (totalXP: number): number => {
  if (totalXP <= 0) return 1;

  let level = 1;
  let xpRemaining = totalXP;

  while (level < MAX_LEVEL) {
    const threshold = getLevelThreshold(level);
    if (xpRemaining < threshold) break;
    xpRemaining -= threshold;
    level++;
  }

  return level;
};

// ═══════════════════════════════════════════════════════════════════════════
// RANK SYSTEM - 10 Prestige-Ränge
// ═══════════════════════════════════════════════════════════════════════════

export const RANKS: RankInfo[] = [
  { name: 'Newcomer', minLevel: 1, color: '#6B7280', glow: 'rgba(107, 114, 128, 0.4)' },
  { name: 'Explorer', minLevel: 5, color: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Connector', minLevel: 10, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.4)' },
  { name: 'Syncer', minLevel: 15, color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Resonant', minLevel: 25, color: '#EC4899', glow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Harmonic', minLevel: 35, color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Ascended', minLevel: 50, color: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' },
  { name: 'Celestial', minLevel: 70, color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.5)' },
  { name: 'Mythic', minLevel: 85, color: '#D946EF', glow: 'rgba(217, 70, 239, 0.5)' },
  { name: 'Eternal', minLevel: 100, color: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)', badge: '👑' },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL REWARDS - Was bekommt man bei bestimmten Levels?
// ═══════════════════════════════════════════════════════════════════════════

export interface LevelReward {
  level: number;
  reward: string;
  description: string;
  icon: string;
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 5, reward: 'custom_avatar_frame', description: 'Eigener Avatar-Rahmen', icon: '🖼️' },
  { level: 10, reward: 'extended_bio', description: 'Längere Bio (500 Zeichen)', icon: '📝' },
  { level: 15, reward: 'aura_color_1', description: 'Aura-Farbe: Emerald', icon: '💚' },
  { level: 25, reward: 'private_rooms', description: 'Private Räume erstellen', icon: '🔒' },
  { level: 35, reward: 'aura_color_2', description: 'Aura-Farbe: Cosmic Purple', icon: '💜' },
  { level: 50, reward: 'permanent_cloud', description: 'Permanent-Wölkchen auf Karte', icon: '☁️' },
  { level: 70, reward: 'aura_color_3', description: 'Aura-Farbe: Celestial Cyan', icon: '💎' },
  { level: 85, reward: 'custom_room_theme', description: 'Eigene Raum-Themes', icon: '🎨' },
  { level: 100, reward: 'eternal_status', description: 'Eternal Status + alle Farben', icon: '👑' },
];

/**
 * Holt alle freigeschalteten Rewards für ein Level
 */
export const getUnlockedRewards = (level: number): LevelReward[] => {
  return LEVEL_REWARDS.filter(r => r.level <= level);
};

/**
 * Prüft ob ein bestimmtes Feature freigeschaltet ist
 */
export const hasFeature = (level: number, feature: string): boolean => {
  const reward = LEVEL_REWARDS.find(r => r.reward === feature);
  return reward ? level >= reward.level : false;
};

/**
 * Kann Permanent-Wölkchen erstellen? (Level 50+)
 */
export const canCreatePermanentCloud = (level: number): boolean => {
  return hasFeature(level, 'permanent_cloud');
};

/**
 * Holt den Rang basierend auf Level
 */
export const getRankForLevel = (level: number): RankInfo => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) {
      rank = r;
    }
  }
  return rank;
};

/**
 * Holt den nächsten Rang
 */
export const getNextRank = (level: number): RankInfo | null => {
  const currentRank = getRankForLevel(level);
  const currentIndex = RANKS.findIndex((r) => r.name === currentRank.name);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
};

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL INFO CALCULATION (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

const levelInfoCache = new Map<number, LevelInfo>();

/**
 * Hauptfunktion: Berechnet alle Level-Informationen
 */
export const calculateLevelInfo = (totalXP: number): LevelInfo => {
  const cacheKey = Math.floor(totalXP);
  if (levelInfoCache.has(cacheKey)) {
    return levelInfoCache.get(cacheKey)!;
  }

  const level = getLevelFromXP(totalXP);
  const isMaxLevel = level >= MAX_LEVEL;

  // XP-Berechnungen
  const xpAtCurrentLevel = getTotalXPForLevel(level);
  const xpForNextLevel = isMaxLevel ? 0 : getLevelThreshold(level);
  const xpInCurrentLevel = totalXP - xpAtCurrentLevel;

  // Progress
  const progress = isMaxLevel ? 1 : Math.min(1, xpInCurrentLevel / xpForNextLevel);
  const progressPercent = progress * 100;

  // Rang
  const rank = getRankForLevel(level);

  const info: LevelInfo = {
    level,
    currentXP: Math.floor(xpInCurrentLevel),
    xpForCurrentLevel: xpAtCurrentLevel,
    xpForNextLevel,
    progressPercent,
    progress,
    totalXP: Math.floor(totalXP),
    rankName: rank.name,
    rankColor: rank.color,
    isMaxLevel,
  };

  // Cache (max 1000 Einträge)
  if (levelInfoCache.size > 1000) {
    const firstKey = levelInfoCache.keys().next().value;
    if (firstKey) levelInfoCache.delete(firstKey);
  }
  levelInfoCache.set(cacheKey, info);

  return info;
};

// ═══════════════════════════════════════════════════════════════════════════
// XP REWARDS - Gewichtet nach Importance
// Sync-Zeit: 50%, Neue Freunde: 30%, Streaks: 20%
// ═══════════════════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  // === SYNC-ZEIT (50% der XP) ===
  SYNC_MINUTE: 3,           // 3 XP pro Minute im Sync
  SPEAK_MINUTE: 4,          // 4 XP pro Minute sprechen
  LISTEN_MINUTE: 2,         // 2 XP pro Minute zuhören
  SYNC_HOUR_BONUS: 50,      // Bonus nach 1h Sync
  SYNC_MARATHON: 200,       // 3h+ Sync Session

  // === FREUNDE (30% der XP) ===
  NEW_FRIEND: 25,           // Neuen Freund gewonnen
  FRIEND_SYNC: 15,          // Mit Freund gesynct
  ACCEPT_SYNC_REQUEST: 10,  // Sync-Anfrage akzeptiert
  SEND_SYNC_REQUEST: 2,     // Sync-Anfrage gesendet
  HIGH_SYNC_MATCH: 20,      // 90%+ Match Score

  // === STREAKS (20% der XP) ===
  DAILY_LOGIN: 10,          // Täglich einloggen
  FIRST_SYNC_OF_DAY: 20,    // Erster Sync des Tages
  STREAK_3_DAYS: 30,        // 3-Tage-Streak
  STREAK_7_DAYS: 100,       // 7-Tage-Streak (Weekly)
  STREAK_30_DAYS: 500,      // 30-Tage-Streak

  // === ROOM AKTIVITÄTEN ===
  JOIN_ROOM: 5,             // Raum beitreten
  CREATE_ROOM: 10,          // Raum erstellen
  HOST_ACTIVE_ROOM: 25,     // Raum mit 5+ Usern hosten

  // === ACHIEVEMENTS ===
  PROFILE_COMPLETE: 50,     // Profil vervollständigt
  FIRST_ROOM_CREATED: 50,   // Erster Raum erstellt
  REACHED_10_SYNCS: 100,    // 10 erfolgreiche Syncs
  VERIFICATION: 200,        // Account verifiziert

  // === BONUS ===
  LEVEL_UP_BONUS: 10,       // Bonus XP bei Level-Up
  PREMIUM_MULTIPLIER: 1.5,  // Premium XP Multiplier
  FOUNDER_DAILY: 25,        // Founder Daily Bonus
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE SYNC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Speichert XP-Fortschritt in Firebase
 */
export const syncXPToFirebase = async (
  userId: string,
  xpToAdd: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      xp: increment(xpToAdd),
      totalXP: increment(xpToAdd),
      lastXPSync: serverTimestamp(),
    });
    console.log(`🌟 Aura-Sync: +${xpToAdd} XP`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ XP-Sync Fehler:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Setzt XP auf einen bestimmten Wert (Admin Only)
 */
export const setXPInFirebase = async (
  userId: string,
  totalXP: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      xp: totalXP,
      totalXP: totalXP,
      lastXPSync: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Gibt XP für eine bestimmte Aktion
 */
export const awardXP = async (
  userId: string,
  action: keyof typeof XP_REWARDS,
  multiplier: number = 1
): Promise<{ xpAwarded: number; leveledUp: boolean }> => {
  const baseXP = XP_REWARDS[action];
  if (typeof baseXP !== 'number') {
    return { xpAwarded: 0, leveledUp: false };
  }

  const xpAwarded = Math.floor(baseXP * multiplier);
  await syncXPToFirebase(userId, xpAwarded);

  return { xpAwarded, leveledUp: false };
};

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const FOUNDER_UIDS = [
  '3lonL4ruSPU53Vuwy1U9aLO4hLp2', // Jan - Founder
];

export const isFounder = (userId: string): boolean => {
  return FOUNDER_UIDS.includes(userId);
};

export const getFounderBadge = () => ({
  icon: '👑',
  label: 'Founder',
  color: '#FFD700',
  glow: '0 0 20px rgba(255, 215, 0, 0.6)',
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Berechnet XP mit Premium-Bonus
 */
export const calculateXPWithBonus = (baseXP: number, isPremium: boolean = false): number => {
  return isPremium ? Math.floor(baseXP * XP_REWARDS.PREMIUM_MULTIPLIER) : baseXP;
};

/**
 * Berechnet Streak-Bonus basierend auf Tagen
 */
export const calculateStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return XP_REWARDS.STREAK_30_DAYS;
  if (streakDays >= 7) return XP_REWARDS.STREAK_7_DAYS;
  if (streakDays >= 3) return XP_REWARDS.STREAK_3_DAYS;
  return 0;
};

/**
 * Level-Up Nachricht
 */
export const getLevelUpMessage = (level: number): string => {
  const rank = getRankForLevel(level);
  const prevRank = getRankForLevel(level - 1);

  if (rank.name !== prevRank.name) {
    return `🎊 Neuer Rang: ${rank.name}! (Level ${level})`;
  }

  const messages = [
    `Level ${level} erreicht! 🎉`,
    `Du bist jetzt Level ${level}! ✨`,
    `Aufgestiegen auf Level ${level}! 🚀`,
  ];
  return messages[level % messages.length];
};

/**
 * Debug: Zeigt Level-Kurve in Console
 */
export const debugLevelCurve = (): void => {
  console.log('📊 Sovereign Level Curve:');
  console.log('Level | XP Required | Total XP | Rank');
  console.log('------|-------------|----------|------');
  for (let level = 1; level <= 30; level++) {
    const threshold = getLevelThreshold(level);
    const totalXP = getTotalXPForLevel(level);
    const rank = getRankForLevel(level);
    console.log(
      `${level.toString().padStart(5)} | ${threshold.toLocaleString().padStart(11)} | ${totalXP.toLocaleString().padStart(8)} | ${rank.name}`
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  calculateLevelInfo,
  getLevelFromXP,
  getLevelThreshold,
  getXPForLevel,
  getTotalXPForLevel,
  getRankForLevel,
  getNextRank,
  syncXPToFirebase,
  setXPInFirebase,
  awardXP,
  isFounder,
  getFounderBadge,
  calculateXPWithBonus,
  calculateStreakBonus,
  getLevelUpMessage,
  debugLevelCurve,
  XP_REWARDS,
  RANKS,
  FOUNDER_UIDS,
};
