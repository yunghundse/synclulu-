/**
 * levelSystem.ts
 * 👑 AURA EVOLUTION - Progressives Level-System
 *
 * Features:
 * - Progressive XP-Kurve (Level * 150 XP pro Level)
 * - Rang-Titel basierend auf Level
 * - Memoized Berechnungen für Performance
 * - Firebase Sync für persistenten Fortschritt
 *
 * @version 1.0.0
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
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MAX_LEVEL = 100;
const BASE_XP_MULTIPLIER = 150; // Jedes Level braucht level * 150 XP

// Rang-Definitionen
export const RANKS: RankInfo[] = [
  { name: 'Newcomer', minLevel: 1, color: '#6B7280', glow: 'rgba(107, 114, 128, 0.4)' },
  { name: 'Explorer', minLevel: 5, color: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Wanderer', minLevel: 10, color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.4)' },
  { name: 'Pioneer', minLevel: 15, color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Pathfinder', minLevel: 20, color: '#A855F7', glow: 'rgba(168, 85, 247, 0.4)' },
  { name: 'Architect', minLevel: 30, color: '#D946EF', glow: 'rgba(217, 70, 239, 0.4)' },
  { name: 'Luminary', minLevel: 40, color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Sovereign', minLevel: 50, color: '#EAB308', glow: 'rgba(234, 179, 8, 0.5)' },
  { name: 'Transcendent', minLevel: 75, color: '#F472B6', glow: 'rgba(244, 114, 182, 0.5)' },
  { name: 'Eternal', minLevel: 100, color: '#FBBF24', glow: 'rgba(251, 191, 36, 0.6)' },
];

// ═══════════════════════════════════════════════════════════════════════════
// XP CALCULATION (Memoized)
// ═══════════════════════════════════════════════════════════════════════════

// Cache für XP-Schwellenwerte
const xpThresholdCache = new Map<number, number>();

/**
 * Berechnet die XP, die für ein bestimmtes Level benötigt werden
 * Formel: level * 150 XP
 */
export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;

  if (xpThresholdCache.has(level)) {
    return xpThresholdCache.get(level)!;
  }

  const xp = level * BASE_XP_MULTIPLIER;
  xpThresholdCache.set(level, xp);
  return xp;
};

/**
 * Berechnet die Gesamt-XP, die für ein Level benötigt werden (kumulativ)
 */
export const getTotalXPForLevel = (level: number): number => {
  if (level <= 1) return 0;

  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

/**
 * Berechnet das Level basierend auf Gesamt-XP
 */
export const getLevelFromXP = (totalXP: number): number => {
  if (totalXP <= 0) return 1;

  let level = 1;
  let xpNeeded = 0;

  while (level < MAX_LEVEL) {
    const nextLevelXP = getXPForLevel(level + 1);
    if (xpNeeded + nextLevelXP > totalXP) break;
    xpNeeded += nextLevelXP;
    level++;
  }

  return level;
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
 * Hauptfunktion: Berechnet alle Level-Informationen
 * MEMOIZED für Performance
 */
const levelInfoCache = new Map<number, LevelInfo>();

export const calculateLevelInfo = (totalXP: number): LevelInfo => {
  // Cache-Check
  const cacheKey = Math.floor(totalXP);
  if (levelInfoCache.has(cacheKey)) {
    return levelInfoCache.get(cacheKey)!;
  }

  const level = getLevelFromXP(totalXP);
  const isMaxLevel = level >= MAX_LEVEL;

  // XP für aktuelles und nächstes Level
  const xpAtCurrentLevel = getTotalXPForLevel(level);
  const xpForNextLevel = isMaxLevel ? 0 : getXPForLevel(level + 1);
  const xpInCurrentLevel = totalXP - xpAtCurrentLevel;

  // Progress Prozent
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100);

  // Rang
  const rank = getRankForLevel(level);

  const info: LevelInfo = {
    level,
    currentXP: Math.floor(xpInCurrentLevel),
    xpForCurrentLevel: xpAtCurrentLevel,
    xpForNextLevel,
    progressPercent,
    totalXP: Math.floor(totalXP),
    rankName: rank.name,
    rankColor: rank.color,
    isMaxLevel,
  };

  // Cache speichern (max 1000 Einträge)
  if (levelInfoCache.size > 1000) {
    const firstKey = levelInfoCache.keys().next().value;
    levelInfoCache.delete(firstKey);
  }
  levelInfoCache.set(cacheKey, info);

  return info;
};

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

    console.log(`🌟 Aura-Sync: +${xpToAdd} XP gespeichert`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ XP-Sync Fehler:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Setzt XP auf einen bestimmten Wert (für Admin/Debug)
 */
export const setXPInFirebase = async (
  userId: string,
  totalXP: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      xp: totalXP,
      totalXP: totalXP,
      lastXPSync: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// XP REWARDS
// ═══════════════════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  // Room Aktivitäten
  JOIN_ROOM: 5,
  SPEAK_MINUTE: 2,
  LISTEN_MINUTE: 1,
  CREATE_ROOM: 10,
  HOST_ACTIVE_ROOM: 15, // Room mit 5+ Usern

  // Soziale Interaktionen
  SEND_SYNC_REQUEST: 2,
  ACCEPT_SYNC_REQUEST: 5,
  FIRST_SYNC_OF_DAY: 10,
  HIGH_SYNC_MATCH: 8, // 90%+ Match

  // Achievements
  DAILY_LOGIN: 5,
  WEEKLY_STREAK: 25,
  PROFILE_COMPLETE: 20,
  FIRST_ROOM_CREATED: 50,
  REACHED_10_SYNCS: 30,

  // Special
  LEVEL_UP_BONUS: 10, // Bonus XP bei Level-Up
  FOUNDER_DAILY_BONUS: 15, // Für Founder Badge Holder
} as const;

/**
 * Gibt XP für eine bestimmte Aktion
 */
export const awardXP = async (
  userId: string,
  action: keyof typeof XP_REWARDS,
  multiplier: number = 1
): Promise<{ xpAwarded: number; leveledUp: boolean }> => {
  const baseXP = XP_REWARDS[action];
  const xpAwarded = Math.floor(baseXP * multiplier);

  await syncXPToFirebase(userId, xpAwarded);

  // TODO: Level-Up Check könnte hier passieren

  return { xpAwarded, leveledUp: false };
};

export default {
  calculateLevelInfo,
  getLevelFromXP,
  getRankForLevel,
  getXPForLevel,
  syncXPToFirebase,
  awardXP,
  XP_REWARDS,
  RANKS,
};
