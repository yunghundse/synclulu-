/**
 * auraSyncEngine.ts
 * 🔮 AURA-MATCH SYSTEM - Sync-Score Berechnung
 *
 * Berechnet die Kompatibilität zwischen zwei Usern basierend auf:
 * - Gemeinsamen Interessen (Tags)
 * - Aura-Level Differenz
 * - Verweildauer in ähnlichen Wölkchen
 * - Aktivitätsmuster
 *
 * @version 1.0.0
 */

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  level: number;
  auraScore: number;
  tags: string[];
  interests: string[];
  roomHistory?: string[];
  totalMinutesInRooms?: number;
  lastActive?: Date;
}

export interface SyncResult {
  score: number; // 0-100
  breakdown: {
    tagMatch: number;
    levelAffinity: number;
    roomOverlap: number;
    activityMatch: number;
  };
  matchQuality: 'low' | 'medium' | 'high' | 'perfect';
  highlights: string[];
  isGoldenMatch: boolean; // 90%+ = Golden Halo
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
  TAG_MATCH: 0.35, // 35% - Gemeinsame Tags
  LEVEL_AFFINITY: 0.20, // 20% - Ähnliches Level
  ROOM_OVERLAP: 0.25, // 25% - Gemeinsame Räume besucht
  ACTIVITY_MATCH: 0.20, // 20% - Ähnliche Aktivitätszeit
};

const GOLDEN_MATCH_THRESHOLD = 90;
const HIGH_MATCH_THRESHOLD = 75;
const MEDIUM_MATCH_THRESHOLD = 50;

// ═══════════════════════════════════════════════════════════════════════════
// SYNC SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Berechnet den Tag-Match Score
 * Mehr gemeinsame Tags = höherer Score
 */
const calculateTagMatch = (tagsA: string[], tagsB: string[]): number => {
  if (!tagsA.length && !tagsB.length) return 50; // Neutral
  if (!tagsA.length || !tagsB.length) return 25; // Einer hat keine Tags

  const setA = new Set(tagsA.map((t) => t.toLowerCase()));
  const setB = new Set(tagsB.map((t) => t.toLowerCase()));

  let matches = 0;
  setA.forEach((tag) => {
    if (setB.has(tag)) matches++;
  });

  const totalUnique = new Set([...setA, ...setB]).size;
  const overlapRatio = matches / totalUnique;

  // Bonus für viele Matches
  const bonusMultiplier = matches >= 5 ? 1.2 : matches >= 3 ? 1.1 : 1;

  return Math.min(100, Math.round(overlapRatio * 100 * bonusMultiplier));
};

/**
 * Berechnet die Level-Affinität
 * Ähnliche Level = höherer Score
 */
const calculateLevelAffinity = (levelA: number, levelB: number): number => {
  const diff = Math.abs(levelA - levelB);

  if (diff === 0) return 100; // Gleiches Level
  if (diff <= 2) return 90;
  if (diff <= 5) return 75;
  if (diff <= 10) return 60;
  if (diff <= 20) return 40;
  return 20; // Sehr unterschiedlich
};

/**
 * Berechnet Room-Overlap Score
 * Gemeinsam besuchte Räume = höherer Score
 */
const calculateRoomOverlap = (
  roomsA: string[] = [],
  roomsB: string[] = []
): number => {
  if (!roomsA.length && !roomsB.length) return 50;
  if (!roomsA.length || !roomsB.length) return 30;

  const setA = new Set(roomsA);
  const setB = new Set(roomsB);

  let overlap = 0;
  setA.forEach((room) => {
    if (setB.has(room)) overlap++;
  });

  const maxPossible = Math.min(setA.size, setB.size);
  if (maxPossible === 0) return 30;

  const overlapRatio = overlap / maxPossible;

  // Bonus wenn sie im selben Raum waren
  const bonusMultiplier = overlap >= 3 ? 1.25 : overlap >= 1 ? 1.1 : 1;

  return Math.min(100, Math.round(overlapRatio * 100 * bonusMultiplier));
};

/**
 * Berechnet Activity Match
 * Ähnliche Nutzungszeit = höherer Score
 */
const calculateActivityMatch = (
  minutesA: number = 0,
  minutesB: number = 0
): number => {
  if (minutesA === 0 && minutesB === 0) return 50;
  if (minutesA === 0 || minutesB === 0) return 30;

  const ratio = Math.min(minutesA, minutesB) / Math.max(minutesA, minutesB);
  return Math.round(ratio * 100);
};

/**
 * Generiert Highlight-Texte basierend auf dem Match
 */
const generateHighlights = (
  userA: UserProfile,
  userB: UserProfile,
  breakdown: SyncResult['breakdown']
): string[] => {
  const highlights: string[] = [];

  // Tag Highlights
  const commonTags = userA.tags.filter((t) =>
    userB.tags.map((b) => b.toLowerCase()).includes(t.toLowerCase())
  );
  if (commonTags.length >= 3) {
    highlights.push(`${commonTags.length} gemeinsame Interessen`);
  } else if (commonTags.length > 0) {
    highlights.push(`Beide mögen: ${commonTags.slice(0, 2).join(', ')}`);
  }

  // Level Highlight
  if (breakdown.levelAffinity >= 90) {
    highlights.push('Ähnliches Aura-Level');
  }

  // Room Highlight
  if (breakdown.roomOverlap >= 70) {
    highlights.push('Oft in denselben Wölkchen');
  }

  // Activity Highlight
  if (breakdown.activityMatch >= 80) {
    highlights.push('Ähnliche Aktivitätszeiten');
  }

  return highlights.slice(0, 3); // Max 3 Highlights
};

/**
 * HAUPTFUNKTION: Berechnet den Sync-Score zwischen zwei Usern
 */
export const calculateSyncScore = (
  userA: UserProfile,
  userB: UserProfile
): SyncResult => {
  // Einzelne Scores berechnen
  const tagMatch = calculateTagMatch(
    [...(userA.tags || []), ...(userA.interests || [])],
    [...(userB.tags || []), ...(userB.interests || [])]
  );
  const levelAffinity = calculateLevelAffinity(userA.level, userB.level);
  const roomOverlap = calculateRoomOverlap(userA.roomHistory, userB.roomHistory);
  const activityMatch = calculateActivityMatch(
    userA.totalMinutesInRooms,
    userB.totalMinutesInRooms
  );

  // Gewichteter Gesamtscore
  const score = Math.round(
    tagMatch * WEIGHTS.TAG_MATCH +
      levelAffinity * WEIGHTS.LEVEL_AFFINITY +
      roomOverlap * WEIGHTS.ROOM_OVERLAP +
      activityMatch * WEIGHTS.ACTIVITY_MATCH
  );

  const breakdown = {
    tagMatch,
    levelAffinity,
    roomOverlap,
    activityMatch,
  };

  // Match Quality
  let matchQuality: SyncResult['matchQuality'] = 'low';
  if (score >= GOLDEN_MATCH_THRESHOLD) matchQuality = 'perfect';
  else if (score >= HIGH_MATCH_THRESHOLD) matchQuality = 'high';
  else if (score >= MEDIUM_MATCH_THRESHOLD) matchQuality = 'medium';

  const highlights = generateHighlights(userA, userB, breakdown);
  const isGoldenMatch = score >= GOLDEN_MATCH_THRESHOLD;

  return {
    score,
    breakdown,
    matchQuality,
    highlights,
    isGoldenMatch,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lädt ein User-Profil für Sync-Berechnung
 */
export const loadUserForSync = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      uid: userId,
      displayName: data.displayName || data.username || 'Anonym',
      photoURL: data.photoURL,
      level: Math.floor((data.xp || 0) / 100) + 1,
      auraScore: data.auraScore || 0,
      tags: data.tags || [],
      interests: data.interests || [],
      roomHistory: data.roomHistory || [],
      totalMinutesInRooms: data.totalMinutesInRooms || 0,
      lastActive: data.lastActive?.toDate(),
    };
  } catch (error) {
    console.error('Error loading user for sync:', error);
    return null;
  }
};

/**
 * Berechnet Sync-Score zwischen zwei User-IDs
 */
export const calculateSyncBetweenUsers = async (
  userIdA: string,
  userIdB: string
): Promise<SyncResult | null> => {
  const [userA, userB] = await Promise.all([
    loadUserForSync(userIdA),
    loadUserForSync(userIdB),
  ]);

  if (!userA || !userB) return null;

  return calculateSyncScore(userA, userB);
};

/**
 * Findet die besten Matches für einen User
 */
export const findBestMatches = async (
  userId: string,
  maxResults: number = 10
): Promise<Array<{ userId: string; syncResult: SyncResult }>> => {
  try {
    const currentUser = await loadUserForSync(userId);
    if (!currentUser) return [];

    // Alle aktiven User laden (vereinfacht)
    const usersQuery = query(
      collection(db, 'users'),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(usersQuery);
    const matches: Array<{ userId: string; syncResult: SyncResult }> = [];

    for (const doc of snapshot.docs) {
      if (doc.id === userId) continue; // Sich selbst überspringen

      const otherUser = await loadUserForSync(doc.id);
      if (!otherUser) continue;

      const syncResult = calculateSyncScore(currentUser, otherUser);
      matches.push({ userId: doc.id, syncResult });
    }

    // Nach Score sortieren und limitieren
    return matches
      .sort((a, b) => b.syncResult.score - a.syncResult.score)
      .slice(0, maxResults);
  } catch (error) {
    console.error('Error finding best matches:', error);
    return [];
  }
};

export default {
  calculateSyncScore,
  calculateSyncBetweenUsers,
  loadUserForSync,
  findBestMatches,
};
