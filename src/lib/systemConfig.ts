/**
 * DELULU DIGITAL OPERATING SYSTEM
 * System Configuration & Global Settings
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// SYSTEM STATUS TYPES
// ═══════════════════════════════════════

export interface SystemConfig {
  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStartedAt: Date | null;
  maintenanceEstimatedEnd: Date | null;

  // Feature Flags
  features: {
    referralSystem: boolean;
    premiumPurchases: boolean;
    voiceChat: boolean;
    anonymousMode: boolean;
    starEvents: boolean;
  };

  // System Limits
  limits: {
    maxUsersPerRoom: number;
    maxRoomsPerUser: number;
    maxDailyXP: number;
    maxLevel: number;
    referralLinksPerUser: number;
  };

  // XP & Level Config
  levelConfig: {
    baseXP: number;
    exponent: number;
    maxLevel: number;
    prestigeUnlockLevel: number;
    communityPrestigeThreshold: number;
  };

  // Referral Config
  referralConfig: {
    linksPerUser: number;
    xpPerReferral: number;
    premiumDaysPerReferral: number;
    socialMultiplierEnabled: boolean;
  };

  // Last Updated
  updatedAt: Date;
  updatedBy: string;
}

// ═══════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'Wir machen eine kurze Pause, um das System für dich zu perfektionieren. Gleich geht\'s weiter! 🚀',
  maintenanceStartedAt: null,
  maintenanceEstimatedEnd: null,

  features: {
    referralSystem: true,
    premiumPurchases: false, // Maintenance mode for payments
    voiceChat: true,
    anonymousMode: true,
    starEvents: true,
  },

  limits: {
    maxUsersPerRoom: 8,
    maxRoomsPerUser: 3,
    maxDailyXP: 1000,
    maxLevel: 500,
    referralLinksPerUser: 5,
  },

  levelConfig: {
    baseXP: 100,
    exponent: 1.5,
    maxLevel: 500,
    prestigeUnlockLevel: 500,
    communityPrestigeThreshold: 400,
  },

  referralConfig: {
    linksPerUser: 5,
    xpPerReferral: 500,
    premiumDaysPerReferral: 7,
    socialMultiplierEnabled: true,
  },

  updatedAt: new Date(),
  updatedBy: 'system',
};

// ═══════════════════════════════════════
// LEVEL SYSTEM 2.0 CALCULATIONS
// ═══════════════════════════════════════

/**
 * Calculate XP required for a specific level
 * Formula: XP_n = 100 * n^1.5
 */
export const calculateXPForLevel = (level: number, config = DEFAULT_SYSTEM_CONFIG.levelConfig): number => {
  if (level <= 1) return 0;
  return Math.floor(config.baseXP * Math.pow(level, config.exponent));
};

/**
 * Calculate total XP required to reach a level (cumulative)
 */
export const calculateTotalXPForLevel = (level: number, config = DEFAULT_SYSTEM_CONFIG.levelConfig): number => {
  let totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += calculateXPForLevel(i, config);
  }
  return totalXP;
};

/**
 * Calculate current level from total XP
 */
export const calculateLevelFromXP = (totalXP: number, config = DEFAULT_SYSTEM_CONFIG.levelConfig): number => {
  let level = 1;
  let accumulatedXP = 0;

  while (level < config.maxLevel) {
    const xpForNextLevel = calculateXPForLevel(level + 1, config);
    if (accumulatedXP + xpForNextLevel > totalXP) {
      break;
    }
    accumulatedXP += xpForNextLevel;
    level++;
  }

  return Math.min(level, config.maxLevel);
};

/**
 * Calculate XP progress within current level
 */
export const calculateLevelProgress = (totalXP: number, config = DEFAULT_SYSTEM_CONFIG.levelConfig): {
  currentLevel: number;
  currentLevelXP: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
} => {
  const currentLevel = calculateLevelFromXP(totalXP, config);
  const currentLevelXP = calculateTotalXPForLevel(currentLevel, config);
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1, config);
  const isMaxLevel = currentLevel >= config.maxLevel;

  return {
    currentLevel,
    currentLevelXP,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent: isMaxLevel ? 100 : Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100),
    isMaxLevel,
  };
};

/**
 * Get level title based on level ranges
 */
export const getLevelTitle = (level: number): { name: string; emoji: string; color: string; tier: string } => {
  if (level >= 450) return { name: 'Legende', emoji: '🏆', color: '#FFD700', tier: 'legendary' };
  if (level >= 400) return { name: 'Mythisch', emoji: '🌟', color: '#FF00FF', tier: 'mythic' };
  if (level >= 350) return { name: 'Göttlich', emoji: '⚡', color: '#00FFFF', tier: 'divine' };
  if (level >= 300) return { name: 'Meister', emoji: '👑', color: '#FF4500', tier: 'master' };
  if (level >= 250) return { name: 'Champion', emoji: '🎖️', color: '#DC143C', tier: 'champion' };
  if (level >= 200) return { name: 'Elite', emoji: '💎', color: '#9400D3', tier: 'elite' };
  if (level >= 150) return { name: 'Veteran', emoji: '🛡️', color: '#4169E1', tier: 'veteran' };
  if (level >= 100) return { name: 'Experte', emoji: '⭐', color: '#32CD32', tier: 'expert' };
  if (level >= 75) return { name: 'Profi', emoji: '🔥', color: '#FF8C00', tier: 'pro' };
  if (level >= 50) return { name: 'Influencer', emoji: '✨', color: '#EF4444', tier: 'influencer' };
  if (level >= 30) return { name: 'Socialite', emoji: '💫', color: '#F59E0B', tier: 'socialite' };
  if (level >= 15) return { name: 'Connector', emoji: '🔗', color: '#3B82F6', tier: 'connector' };
  if (level >= 5) return { name: 'Dreamer', emoji: '💭', color: '#8B5CF6', tier: 'dreamer' };
  return { name: 'Newcomer', emoji: '🌱', color: '#9CA3AF', tier: 'newcomer' };
};

// ═══════════════════════════════════════
// FIREBASE CONFIG OPERATIONS
// ═══════════════════════════════════════

const SYSTEM_CONFIG_DOC = 'system/config';

/**
 * Get current system configuration from Firebase
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const configRef = doc(db, SYSTEM_CONFIG_DOC);
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const data = configSnap.data();
      return {
        ...DEFAULT_SYSTEM_CONFIG,
        ...data,
        maintenanceStartedAt: data.maintenanceStartedAt?.toDate() || null,
        maintenanceEstimatedEnd: data.maintenanceEstimatedEnd?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }

    // Initialize with defaults if doesn't exist
    await setDoc(configRef, DEFAULT_SYSTEM_CONFIG);
    return DEFAULT_SYSTEM_CONFIG;
  } catch (error) {
    return DEFAULT_SYSTEM_CONFIG;
  }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (
  updates: Partial<SystemConfig>,
  updatedBy: string
): Promise<void> => {
  try {
    const configRef = doc(db, SYSTEM_CONFIG_DOC);
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date(),
      updatedBy,
    }, { merge: true });
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle maintenance mode
 */
export const toggleMaintenanceMode = async (
  enabled: boolean,
  adminId: string,
  message?: string,
  estimatedEndMinutes?: number
): Promise<void> => {
  const updates: Partial<SystemConfig> = {
    maintenanceMode: enabled,
    maintenanceStartedAt: enabled ? new Date() : null,
    maintenanceEstimatedEnd: enabled && estimatedEndMinutes
      ? new Date(Date.now() + estimatedEndMinutes * 60 * 1000)
      : null,
  };

  if (message) {
    updates.maintenanceMessage = message;
  }

  await updateSystemConfig(updates, adminId);
};

/**
 * Subscribe to system config changes (real-time)
 */
export const subscribeToSystemConfig = (
  callback: (config: SystemConfig) => void
): (() => void) => {
  const configRef = doc(db, SYSTEM_CONFIG_DOC);

  return onSnapshot(
    configRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          ...DEFAULT_SYSTEM_CONFIG,
          ...data,
          maintenanceStartedAt: data.maintenanceStartedAt?.toDate() || null,
          maintenanceEstimatedEnd: data.maintenanceEstimatedEnd?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } else {
        callback(DEFAULT_SYSTEM_CONFIG);
      }
    },
    (error) => {
      // Permission denied or other error - use defaults so app doesn't hang
      console.warn('System config listener error, using defaults:', error.message);
      callback(DEFAULT_SYSTEM_CONFIG);
    }
  );
};

export default {
  calculateXPForLevel,
  calculateTotalXPForLevel,
  calculateLevelFromXP,
  calculateLevelProgress,
  getLevelTitle,
  getSystemConfig,
  updateSystemConfig,
  toggleMaintenanceMode,
  subscribeToSystemConfig,
};
