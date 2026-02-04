/**
 * neuroLevelSystem.ts
 * 🧠 NEURO-HOOK LEVEL SYSTEM v30.0
 *
 * PSYCHOLOGIE:
 * - Level 1-10: Quick Wins (Dopamin-Rush, niedriger XP-Bedarf)
 * - Level 11-25: Momentum Phase (steigender Anspruch)
 * - Level 26-50: Dedication Zone (exponentieller Anstieg)
 * - Level 51-100: Prestige Territory (für die Hardcore-Nutzer)
 *
 * FORMEL: Logarithmische Kurve mit Quick-Win-Boost
 * XP = baseXP * (1 + ln(level)) * growthFactor
 *
 * @version 30.0.0 - Neuro-Hook Edition
 */

export type PrestigeRank = 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'ELITE' | 'LEGENDARY' | 'MYTHIC';

export interface PrestigeTier {
  rank: PrestigeRank;
  minLevel: number;
  maxLevel: number;
  name: string;
  nameDE: string;
  color: string;
  gradient: string;
  glowColor: string;
  emoji: string;
  description: string;
  perks: string[];
}

export const PRESTIGE_TIERS: PrestigeTier[] = [
  {
    rank: 'NEWCOMER',
    minLevel: 1,
    maxLevel: 5,
    name: 'Newcomer',
    nameDE: 'Neuling',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    emoji: '🌱',
    description: 'Willkommen in der Community!',
    perks: ['Basis-Profil', 'Kann Räume betreten'],
  },
  {
    rank: 'RISING',
    minLevel: 6,
    maxLevel: 15,
    name: 'Rising Star',
    nameDE: 'Aufsteiger',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    glowColor: 'rgba(96, 165, 250, 0.5)',
    emoji: '⭐',
    description: 'Du wirst bemerkt!',
    perks: ['Aura-Glow', 'Custom Status', 'Kann Räume erstellen'],
  },
  {
    rank: 'ESTABLISHED',
    minLevel: 16,
    maxLevel: 30,
    name: 'Established',
    nameDE: 'Etabliert',
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
    glowColor: 'rgba(34, 211, 238, 0.5)',
    emoji: '💎',
    description: 'Ein fester Teil der Community',
    perks: ['Enhanced Aura', 'Priority Matching', 'Badge: Diamond'],
  },
  {
    rank: 'ELITE',
    minLevel: 31,
    maxLevel: 50,
    name: 'Elite',
    nameDE: 'Elite',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    emoji: '👑',
    description: 'Die Crème de la Crème',
    perks: ['Nebula-Pulse Aura', 'VIP Lounges', 'Exklusive Farben', 'Elite Badge'],
  },
  {
    rank: 'LEGENDARY',
    minLevel: 51,
    maxLevel: 75,
    name: 'Legendary',
    nameDE: 'Legendär',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    emoji: '🔥',
    description: 'Dein Name wird geflüstert',
    perks: ['Flame Aura', 'Private Rooms', 'Legendary Badge', 'Early Access'],
  },
  {
    rank: 'MYTHIC',
    minLevel: 76,
    maxLevel: 100,
    name: 'Mythic',
    nameDE: 'Mythisch',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b, #eab308)',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    emoji: '✨',
    description: 'Eine Legende unter uns',
    perks: ['God-Ray Aura', 'All VIP Access', 'Mythic Crown', 'Founder Privileges', 'Custom Effects'],
  },
];

/**
 * NEURO-HOOK XP FORMULA
 *
 * Quick Wins (Level 1-10): Low barrier, high dopamine
 * - Level 1: 50 XP
 * - Level 10: ~400 XP
 *
 * Momentum (Level 11-25): Building habit
 * - Level 15: ~800 XP
 * - Level 25: ~2,000 XP
 *
 * Dedication (Level 26-50): Commitment phase
 * - Level 35: ~4,500 XP
 * - Level 50: ~10,000 XP
 *
 * Prestige (Level 51-100): Hardcore territory
 * - Level 75: ~25,000 XP
 * - Level 100: ~50,000 XP
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 50;

  // Quick Win Zone (1-10): Logarithmic with low base
  if (level <= 10) {
    return Math.floor(50 * (1 + Math.log(level) * 0.8));
  }

  // Momentum Zone (11-25): Moderate growth
  if (level <= 25) {
    const base = getXPForLevel(10);
    const growth = Math.pow(level - 10, 1.3) * 50;
    return Math.floor(base + growth);
  }

  // Dedication Zone (26-50): Steeper curve
  if (level <= 50) {
    const base = getXPForLevel(25);
    const growth = Math.pow(level - 25, 1.5) * 80;
    return Math.floor(base + growth);
  }

  // Prestige Zone (51-100): Exponential for hardcore
  const base = getXPForLevel(50);
  const growth = Math.pow(level - 50, 1.8) * 120;
  return Math.floor(base + growth);
}

/**
 * Get total XP needed to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): {
  level: number;
  currentXP: number;
  neededXP: number;
  totalXP: number;
  progress: number;
} {
  if (totalXP <= 0) {
    return {
      level: 0,
      currentXP: 0,
      neededXP: getXPForLevel(1),
      totalXP: 0,
      progress: 0,
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
        totalXP,
        progress: Math.min(100, (remainingXP / needed) * 100),
      };
    }
    remainingXP -= needed;
    level++;
  }

  // Max level reached
  return {
    level: 100,
    currentXP: remainingXP,
    neededXP: getXPForLevel(100),
    totalXP,
    progress: 100,
  };
}

/**
 * Get prestige tier for a level
 */
export function getPrestigeTier(level: number): PrestigeTier {
  if (level <= 0) return PRESTIGE_TIERS[0];

  for (const tier of PRESTIGE_TIERS) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier;
    }
  }
  return PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1];
}

/**
 * Get next tier (or null if max)
 */
export function getNextTier(level: number): PrestigeTier | null {
  const currentTier = getPrestigeTier(level);
  const currentIndex = PRESTIGE_TIERS.findIndex(t => t.rank === currentTier.rank);

  if (currentIndex < PRESTIGE_TIERS.length - 1) {
    return PRESTIGE_TIERS[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate XP to next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const levelData = getLevelFromXP(totalXP);
  if (levelData.level >= 100) return 0;
  return levelData.neededXP - levelData.currentXP;
}

/**
 * Calculate levels until next tier
 */
export function getLevelsToNextTier(level: number): number {
  const currentTier = getPrestigeTier(level);
  const nextTier = getNextTier(level);

  if (!nextTier) return 0;
  return nextTier.minLevel - level;
}

/**
 * Format level for display
 */
export function formatLevel(level: number): string {
  if (level <= 0) return 'Kein Level';
  const tier = getPrestigeTier(level);
  return `${tier.nameDE} • Level ${level}`;
}

/**
 * Format XP for display (with K/M suffixes)
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * XP rewards for actions
 */
export const XP_REWARDS = {
  // Quick wins for newcomers
  FIRST_LOGIN: 25,
  COMPLETE_PROFILE: 50,
  FIRST_ROOM_JOIN: 30,

  // Daily engagement
  DAILY_LOGIN: 15,
  DAILY_STREAK_BONUS: 10, // Per day in streak

  // Sync time (core mechanic)
  SYNC_MINUTE: 2, // Per minute in voice
  QUALITY_SYNC: 25, // 10+ minutes
  LONG_SYNC: 50, // 30+ minutes

  // Social
  SEND_FRIEND_REQUEST: 5,
  ACCEPT_FRIEND_REQUEST: 15,
  RECEIVE_STAR: 10,
  GIVE_STAR: 5,

  // Rooms
  JOIN_ROOM: 10,
  CREATE_ROOM: 25,
  HOST_POPULAR_ROOM: 75, // 5+ participants

  // Achievements
  FIRST_CONVERSATION: 50,
  TEN_FRIENDS: 100,
  HUNDRED_MINUTES: 200,

  // Special
  REFERRAL_JOINED: 150,
  BATTLE_PASS_MILESTONE: 100,
};

/**
 * Level milestones with rewards
 */
export interface Milestone {
  level: number;
  name: string;
  reward: string;
  rewardType: 'aura' | 'badge' | 'effect' | 'feature';
  icon: string;
}

export const MILESTONES: Milestone[] = [
  { level: 5, name: 'First Steps', reward: 'Basic Aura Glow', rewardType: 'aura', icon: '🌟' },
  { level: 10, name: 'Quick Starter', reward: 'Custom Status', rewardType: 'feature', icon: '⚡' },
  { level: 15, name: 'Rising Star', reward: 'Star Badge', rewardType: 'badge', icon: '⭐' },
  { level: 20, name: 'Connected', reward: 'Enhanced Glow', rewardType: 'aura', icon: '🔗' },
  { level: 25, name: 'Established', reward: 'Diamond Badge', rewardType: 'badge', icon: '💎' },
  { level: 30, name: 'Community Pillar', reward: 'Pulse Effect', rewardType: 'effect', icon: '🏛️' },
  { level: 40, name: 'Elite Member', reward: 'Elite Crown', rewardType: 'badge', icon: '👑' },
  { level: 50, name: 'Half Century', reward: 'Nebula Aura', rewardType: 'aura', icon: '🌌' },
  { level: 60, name: 'Veteran', reward: 'Veteran Shield', rewardType: 'badge', icon: '🛡️' },
  { level: 75, name: 'Legendary', reward: 'Fire Aura', rewardType: 'aura', icon: '🔥' },
  { level: 90, name: 'Near Mythic', reward: 'Lightning Effect', rewardType: 'effect', icon: '⚡' },
  { level: 100, name: 'Mythic', reward: 'God-Ray Aura', rewardType: 'aura', icon: '✨' },
];

/**
 * Get achieved milestones for a level
 */
export function getAchievedMilestones(level: number): Milestone[] {
  return MILESTONES.filter(m => m.level <= level);
}

/**
 * Get next milestone for a level
 */
export function getNextMilestone(level: number): Milestone | null {
  return MILESTONES.find(m => m.level > level) || null;
}

export default {
  PRESTIGE_TIERS,
  MILESTONES,
  XP_REWARDS,
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getPrestigeTier,
  getNextTier,
  getXPToNextLevel,
  getLevelsToNextTier,
  formatLevel,
  formatXP,
  getAchievedMilestones,
  getNextMilestone,
};
