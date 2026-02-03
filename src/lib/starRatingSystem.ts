/**
 * DELULU STAR RATING SYSTEM
 * Voice-Chat Bewertungen & Karma-System
 */

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  orderBy, limit, getDocs, Timestamp, increment, addDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const STAR_RATING_CONFIG = {
  maxStars: 5,
  dailyLimits: {
    free: 3,
    premium: 7,
  },
  xpPerStarReceived: 10, // XP gained per star received
  xpPerStarGiven: 2, // XP gained for giving a star
  karmaMultiplier: 1.5, // Karma boost for high ratings
  cooldownMinutes: 5, // Cooldown between rating same user
};

// XP thresholds for profile glow effects (Level 1-500)
export const GLOW_THRESHOLDS = [
  { level: 1, glow: 'none', color: 'transparent' },
  { level: 10, glow: 'soft', color: '#A78BFA20' },
  { level: 25, glow: 'light', color: '#A78BFA40' },
  { level: 50, glow: 'medium', color: '#818CF860' },
  { level: 100, glow: 'strong', color: '#F472B680' },
  { level: 200, glow: 'intense', color: '#F472B6A0' },
  { level: 300, glow: 'radiant', color: '#FBBF24B0' },
  { level: 400, glow: 'legendary', color: '#FBBF24D0' },
  { level: 500, glow: 'mythic', color: '#F472B6FF' },
];

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface StarRating {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  stars: number;
  context: 'voice_chat' | 'profile' | 'content';
  sessionId?: string;
  message?: string;
  createdAt: Date;
}

export interface UserRatingStats {
  userId: string;
  totalStarsReceived: number;
  totalRatingsReceived: number;
  averageRating: number;
  totalStarsGiven: number;
  starsGivenToday: number;
  lastRatingGivenAt: Date | null;
  karmaScore: number;
  glowLevel: string;
  glowColor: string;
}

export interface DailyRatingLimit {
  userId: string;
  date: string;
  starsGiven: number;
  ratingsGiven: { [userId: string]: Date };
}

// ═══════════════════════════════════════
// RATING FUNCTIONS
// ═══════════════════════════════════════

/**
 * Give a star rating to another user
 */
export const giveStarRating = async (
  fromUserId: string,
  fromUsername: string,
  toUserId: string,
  toUsername: string,
  stars: number,
  context: 'voice_chat' | 'profile' | 'content' = 'voice_chat',
  sessionId?: string,
  message?: string
): Promise<{
  success: boolean;
  error?: string;
  remainingStars?: number;
}> => {
  try {
    // Validate stars
    if (stars < 1 || stars > STAR_RATING_CONFIG.maxStars) {
      return { success: false, error: 'Ungültige Sternanzahl' };
    }

    // Can't rate yourself
    if (fromUserId === toUserId) {
      return { success: false, error: 'Du kannst dich nicht selbst bewerten' };
    }

    // Check daily limit
    const limitCheck = await checkDailyLimit(fromUserId);
    if (!limitCheck.canRate) {
      return {
        success: false,
        error: `Du hast heute bereits ${limitCheck.limit} Sterne vergeben`,
        remainingStars: 0,
      };
    }

    // Check cooldown for same user
    const canRateUser = await checkUserCooldown(fromUserId, toUserId);
    if (!canRateUser) {
      return {
        success: false,
        error: `Warte ${STAR_RATING_CONFIG.cooldownMinutes} Minuten, um diese Person erneut zu bewerten`,
      };
    }

    // Create rating
    const ratingRef = await addDoc(collection(db, 'starRatings'), {
      fromUserId,
      fromUsername,
      toUserId,
      toUsername,
      stars,
      context,
      sessionId: sessionId || null,
      message: message || null,
      createdAt: Timestamp.fromDate(new Date()),
    });

    // Update recipient's stats
    await updateRecipientStats(toUserId, stars);

    // Update giver's daily limit
    await updateDailyLimit(fromUserId, toUserId);

    // Award XP to both users
    await awardRatingXP(fromUserId, toUserId, stars);

    // Get remaining stars
    const newLimit = await checkDailyLimit(fromUserId);

    return {
      success: true,
      remainingStars: newLimit.remaining,
    };
  } catch (error: any) {
    console.error('Error giving star rating:', error);
    return { success: false, error: error.message || 'Fehler beim Bewerten' };
  }
};

/**
 * Check daily rating limit
 */
export const checkDailyLimit = async (userId: string): Promise<{
  canRate: boolean;
  remaining: number;
  limit: number;
  starsGiven: number;
}> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const limitRef = doc(db, 'dailyRatingLimits', `${userId}_${today}`);
    const limitDoc = await getDoc(limitRef);

    // Check if user is premium
    const userDoc = await getDoc(doc(db, 'users', userId));
    const isPremium = userDoc.data()?.isPremium || false;
    const dailyLimit = isPremium
      ? STAR_RATING_CONFIG.dailyLimits.premium
      : STAR_RATING_CONFIG.dailyLimits.free;

    if (!limitDoc.exists()) {
      return {
        canRate: true,
        remaining: dailyLimit,
        limit: dailyLimit,
        starsGiven: 0,
      };
    }

    const starsGiven = limitDoc.data().starsGiven || 0;
    const remaining = Math.max(0, dailyLimit - starsGiven);

    return {
      canRate: remaining > 0,
      remaining,
      limit: dailyLimit,
      starsGiven,
    };
  } catch (error) {
    console.error('Error checking daily limit:', error);
    return { canRate: false, remaining: 0, limit: 0, starsGiven: 0 };
  }
};

/**
 * Check cooldown for rating same user
 */
const checkUserCooldown = async (fromUserId: string, toUserId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const limitRef = doc(db, 'dailyRatingLimits', `${fromUserId}_${today}`);
    const limitDoc = await getDoc(limitRef);

    if (!limitDoc.exists()) return true;

    const ratingsGiven = limitDoc.data().ratingsGiven || {};
    const lastRating = ratingsGiven[toUserId];

    if (!lastRating) return true;

    const lastRatingTime = lastRating.toDate();
    const cooldownMs = STAR_RATING_CONFIG.cooldownMinutes * 60 * 1000;
    const now = new Date();

    return now.getTime() - lastRatingTime.getTime() >= cooldownMs;
  } catch (error) {
    console.error('Error checking cooldown:', error);
    return true;
  }
};

/**
 * Update daily rating limit
 */
const updateDailyLimit = async (userId: string, ratedUserId: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const limitRef = doc(db, 'dailyRatingLimits', `${userId}_${today}`);
  const limitDoc = await getDoc(limitRef);

  const now = Timestamp.fromDate(new Date());

  if (!limitDoc.exists()) {
    await setDoc(limitRef, {
      userId,
      date: today,
      starsGiven: 1,
      ratingsGiven: { [ratedUserId]: now },
    });
  } else {
    const currentData = limitDoc.data();
    await updateDoc(limitRef, {
      starsGiven: (currentData.starsGiven || 0) + 1,
      [`ratingsGiven.${ratedUserId}`]: now,
    });
  }
};

/**
 * Update recipient's rating stats
 */
const updateRecipientStats = async (userId: string, stars: number): Promise<void> => {
  const statsRef = doc(db, 'ratingStats', userId);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    await setDoc(statsRef, {
      userId,
      totalStarsReceived: stars,
      totalRatingsReceived: 1,
      averageRating: stars,
      karmaScore: stars * STAR_RATING_CONFIG.karmaMultiplier,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } else {
    const current = statsDoc.data();
    const newTotal = (current.totalStarsReceived || 0) + stars;
    const newCount = (current.totalRatingsReceived || 0) + 1;
    const newAverage = newTotal / newCount;
    const karmaBoost = stars >= 4 ? stars * STAR_RATING_CONFIG.karmaMultiplier : stars;

    await updateDoc(statsRef, {
      totalStarsReceived: newTotal,
      totalRatingsReceived: newCount,
      averageRating: newAverage,
      karmaScore: (current.karmaScore || 0) + karmaBoost,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
};

/**
 * Award XP for rating
 */
const awardRatingXP = async (giverId: string, receiverId: string, stars: number): Promise<void> => {
  // Award XP to giver
  const giverRef = doc(db, 'users', giverId);
  await updateDoc(giverRef, {
    xp: increment(STAR_RATING_CONFIG.xpPerStarGiven),
  });

  // Award XP to receiver (more for higher ratings)
  const receiverXP = STAR_RATING_CONFIG.xpPerStarReceived * stars;
  const receiverRef = doc(db, 'users', receiverId);
  await updateDoc(receiverRef, {
    xp: increment(receiverXP),
    totalStarsReceived: increment(stars),
  });
};

// ═══════════════════════════════════════
// STATS FUNCTIONS
// ═══════════════════════════════════════

/**
 * Get user's rating stats
 */
export const getUserRatingStats = async (userId: string): Promise<UserRatingStats> => {
  try {
    const statsRef = doc(db, 'ratingStats', userId);
    const statsDoc = await getDoc(statsRef);

    const userDoc = await getDoc(doc(db, 'users', userId));
    const level = userDoc.data()?.level || 1;

    // Get glow based on level
    const glowConfig = GLOW_THRESHOLDS.slice().reverse().find(g => level >= g.level) || GLOW_THRESHOLDS[0];

    // Get today's stars given
    const today = new Date().toISOString().split('T')[0];
    const limitRef = doc(db, 'dailyRatingLimits', `${userId}_${today}`);
    const limitDoc = await getDoc(limitRef);
    const starsGivenToday = limitDoc.exists() ? limitDoc.data().starsGiven : 0;

    if (!statsDoc.exists()) {
      return {
        userId,
        totalStarsReceived: 0,
        totalRatingsReceived: 0,
        averageRating: 0,
        totalStarsGiven: 0,
        starsGivenToday,
        lastRatingGivenAt: null,
        karmaScore: 0,
        glowLevel: glowConfig.glow,
        glowColor: glowConfig.color,
      };
    }

    const data = statsDoc.data();
    return {
      userId,
      totalStarsReceived: data.totalStarsReceived || 0,
      totalRatingsReceived: data.totalRatingsReceived || 0,
      averageRating: data.averageRating || 0,
      totalStarsGiven: data.totalStarsGiven || 0,
      starsGivenToday,
      lastRatingGivenAt: data.lastRatingGivenAt?.toDate() || null,
      karmaScore: data.karmaScore || 0,
      glowLevel: glowConfig.glow,
      glowColor: glowConfig.color,
    };
  } catch (error) {
    console.error('Error getting rating stats:', error);
    return {
      userId,
      totalStarsReceived: 0,
      totalRatingsReceived: 0,
      averageRating: 0,
      totalStarsGiven: 0,
      starsGivenToday: 0,
      lastRatingGivenAt: null,
      karmaScore: 0,
      glowLevel: 'none',
      glowColor: 'transparent',
    };
  }
};

/**
 * Get recent ratings received
 */
export const getRecentRatings = async (
  userId: string,
  limitCount: number = 10
): Promise<StarRating[]> => {
  try {
    const ratingsRef = collection(db, 'starRatings');
    const q = query(
      ratingsRef,
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as StarRating[];
  } catch (error) {
    console.error('Error getting recent ratings:', error);
    return [];
  }
};

/**
 * Get glow effect for level
 */
export const getGlowForLevel = (level: number): { glow: string; color: string } => {
  const config = GLOW_THRESHOLDS.slice().reverse().find(g => level >= g.level) || GLOW_THRESHOLDS[0];
  return { glow: config.glow, color: config.color };
};

/**
 * Get CSS for glow effect
 */
export const getGlowCSS = (level: number): React.CSSProperties => {
  const { glow, color } = getGlowForLevel(level);

  if (glow === 'none') return {};

  const intensities: { [key: string]: string } = {
    soft: `0 0 10px ${color}`,
    light: `0 0 15px ${color}`,
    medium: `0 0 20px ${color}, 0 0 40px ${color}`,
    strong: `0 0 25px ${color}, 0 0 50px ${color}`,
    intense: `0 0 30px ${color}, 0 0 60px ${color}, 0 0 90px ${color}`,
    radiant: `0 0 35px ${color}, 0 0 70px ${color}, 0 0 105px ${color}`,
    legendary: `0 0 40px ${color}, 0 0 80px ${color}, 0 0 120px ${color}, 0 0 160px ${color}`,
    mythic: `0 0 50px ${color}, 0 0 100px ${color}, 0 0 150px ${color}, 0 0 200px ${color}`,
  };

  return {
    boxShadow: intensities[glow] || 'none',
  };
};

export default {
  STAR_RATING_CONFIG,
  GLOW_THRESHOLDS,
  giveStarRating,
  checkDailyLimit,
  getUserRatingStats,
  getRecentRatings,
  getGlowForLevel,
  getGlowCSS,
};
