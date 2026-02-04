/**
 * ascensionSystem.ts
 * Das Ascension-System für synclulu
 *
 * Level 1-10:   SPARK    - Blau
 * Level 11-30:  FLAME    - Orange
 * Level 31-50:  NOVA     - Violett
 * Level 51-100: SOVEREIGN - Gold
 */

export type AscensionRank = 'SPARK' | 'FLAME' | 'NOVA' | 'SOVEREIGN';

export interface AscensionTier {
  rank: AscensionRank;
  minLevel: number;
  maxLevel: number;
  title: string;
  titleDE: string;
  color: string;
  gradient: string;
  glowColor: string;
  description: string;
  perks: string[];
  shaderEffect: 'basic-glow' | 'flame-aura' | 'nebula-pulse' | 'sovereign-rays';
}

export const ASCENSION_TIERS: AscensionTier[] = [
  {
    rank: 'SPARK',
    minLevel: 0, // Level 0 ist jetzt auch SPARK
    maxLevel: 10,
    title: 'Spark',
    titleDE: 'Funke',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    glowColor: 'rgba(96, 165, 250, 0.5)',
    description: 'Der Beginn deiner Reise',
    perks: [
      'Basic Aura-Glow',
      'Zugang zur Nebula Map',
      'Kann an Wölkchen teilnehmen',
    ],
    shaderEffect: 'basic-glow',
  },
  {
    rank: 'FLAME',
    minLevel: 11,
    maxLevel: 30,
    title: 'Flame',
    titleDE: 'Flamme',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    description: 'Deine Präsenz wird bemerkt',
    perks: [
      'Erweiterte Aura mit Partikel-Effekt',
      'Kann eigene Wölkchen erstellen',
      'Sichtbar auf größerer Distanz',
      'Flame-Badge im Profil',
    ],
    shaderEffect: 'flame-aura',
  },
  {
    rank: 'NOVA',
    minLevel: 31,
    maxLevel: 50,
    title: 'Nova',
    titleDE: 'Nova',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    description: 'Du strahlst wie ein Stern',
    perks: [
      'Nebula-Puls Aura-Effekt',
      'Priority Matching',
      'Exklusive Nova-Lounges',
      'Nova-Badge & Custom Farben',
      'Kann andere User einladen',
    ],
    shaderEffect: 'nebula-pulse',
  },
  {
    rank: 'SOVEREIGN',
    minLevel: 51,
    maxLevel: 100,
    title: 'Sovereign',
    titleDE: 'Souverän',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b, #eab308)',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    description: 'Die Krone der Präsenz',
    perks: [
      'Sovereign God-Ray Effekt',
      'VIP Zugang zu allen Lounges',
      'Kann Private Räume hosten',
      'Gold Crown Badge',
      'Early Access zu Features',
      'Founder-Interaktion',
    ],
    shaderEffect: 'sovereign-rays',
  },
];

// XP benötigt pro Level (exponentiell)
export function getXPForLevel(level: number): number {
  // Level 1: 100 XP, Level 100: ~50.000 XP
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// Gesamte XP für ein bestimmtes Level
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Level aus Gesamt-XP berechnen
// WICHTIG: xp:0 = Level 0 (Database-First Logic)
export function getLevelFromXP(totalXP: number): { level: number; currentXP: number; neededXP: number } {
  // Level 0 für User ohne XP
  if (!totalXP || totalXP <= 0) {
    return {
      level: 0,
      currentXP: 0,
      neededXP: getXPForLevel(1), // 100 XP für Level 1
    };
  }

  let level = 1;
  let remainingXP = totalXP;

  while (level < 100) {
    const needed = getXPForLevel(level);
    if (remainingXP < needed) {
      return {
        level,
        currentXP: remainingXP,
        neededXP: needed,
      };
    }
    remainingXP -= needed;
    level++;
  }

  return {
    level: 100,
    currentXP: remainingXP,
    neededXP: getXPForLevel(100),
  };
}

// Ascension-Tier für Level
export function getAscensionTier(level: number): AscensionTier {
  for (const tier of ASCENSION_TIERS) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier;
    }
  }
  return ASCENSION_TIERS[ASCENSION_TIERS.length - 1]; // Fallback: Sovereign
}

// Fortschritt innerhalb des aktuellen Tiers (0-100%)
export function getTierProgress(level: number): number {
  const tier = getAscensionTier(level);
  const tierLevels = tier.maxLevel - tier.minLevel + 1;
  const levelsInTier = level - tier.minLevel;
  return Math.min(100, (levelsInTier / tierLevels) * 100);
}

// Nächster Tier (oder null wenn Sovereign)
export function getNextTier(level: number): AscensionTier | null {
  const currentIndex = ASCENSION_TIERS.findIndex(
    (t) => level >= t.minLevel && level <= t.maxLevel
  );
  if (currentIndex < ASCENSION_TIERS.length - 1) {
    return ASCENSION_TIERS[currentIndex + 1];
  }
  return null;
}

// XP-Belohnungen für verschiedene Aktionen
export const XP_REWARDS = {
  // Gespräche
  START_CONVERSATION: 10,
  CONVERSATION_MINUTE: 5, // Pro Minute aktives Gespräch
  CONVERSATION_COMPLETE: 25, // Gespräch vollständig beendet
  QUALITY_CONVERSATION: 50, // Besonders langes/gutes Gespräch (>10min)

  // Soziale Interaktionen
  RECEIVE_FRIEND_REQUEST: 5,
  ACCEPT_FRIEND_REQUEST: 15,
  FIRST_INTERACTION_DAY: 20, // Erste Interaktion des Tages

  // Wölkchen
  JOIN_ROOM: 10,
  CREATE_ROOM: 30,
  HOST_SUCCESSFUL_ROOM: 50, // Raum mit 5+ Teilnehmern

  // Achievements
  DAILY_STREAK: 25, // Pro Tag in Folge aktiv
  WEEKLY_ACTIVE: 100, // 7 Tage in Folge
  FIRST_ROOM_CREATED: 75,
  TEN_CONVERSATIONS: 150,
  HUNDRED_CONVERSATIONS: 500,

  // Spezial
  FOUNDER_BONUS: 1000, // Einmaliger Founder-Bonus
  REFERRAL_JOINED: 200, // Eingeladener User ist beigetreten
};

// Level-Up Animation Daten
export interface LevelUpData {
  oldLevel: number;
  newLevel: number;
  oldTier: AscensionTier;
  newTier: AscensionTier;
  isNewTier: boolean; // Tier-Aufstieg?
  unlockedPerks: string[];
}

export function calculateLevelUp(
  oldTotalXP: number,
  newTotalXP: number
): LevelUpData | null {
  const oldLevelData = getLevelFromXP(oldTotalXP);
  const newLevelData = getLevelFromXP(newTotalXP);

  if (newLevelData.level <= oldLevelData.level) {
    return null; // Kein Level-Up
  }

  const oldTier = getAscensionTier(oldLevelData.level);
  const newTier = getAscensionTier(newLevelData.level);
  const isNewTier = oldTier.rank !== newTier.rank;

  // Sammle alle freigeschalteten Perks
  const unlockedPerks: string[] = [];
  if (isNewTier) {
    unlockedPerks.push(...newTier.perks);
  }

  return {
    oldLevel: oldLevelData.level,
    newLevel: newLevelData.level,
    oldTier,
    newTier,
    isNewTier,
    unlockedPerks,
  };
}

// Format Level für Anzeige
export function formatLevel(level: number): string {
  const tier = getAscensionTier(level);
  return `${tier.titleDE} Lvl ${level}`;
}

// Kurzes Format
export function formatLevelShort(level: number): string {
  const tier = getAscensionTier(level);
  const prefix = tier.rank.charAt(0);
  return `${prefix}${level}`;
}

export default {
  ASCENSION_TIERS,
  XP_REWARDS,
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getAscensionTier,
  getTierProgress,
  getNextTier,
  calculateLevelUp,
  formatLevel,
  formatLevelShort,
};
