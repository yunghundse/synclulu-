/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIBE MATCHING ENGINE - Tinder Data Science × MIT Mathematics
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Advanced matching algorithm that calculates compatibility scores based on:
 * - Shared interests (Jaccard Similarity)
 * - Activity patterns (Temporal Alignment)
 * - Location proximity (Spatial Decay)
 * - Interaction history (Engagement Score)
 * - Personality vectors (Cosine Similarity)
 *
 * Formula: S_match = Σ(w_i × f_i) where f_i are normalized feature scores
 *
 * @author Lead Data Scientist (Tinder) × MIT Mathematician
 * @version 1.0.0
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { calculateHaversineDistance } from './liveRadarService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  interests: string[];
  vibeVector: number[];        // 8-dimensional personality vector
  activityScore: number;       // 0-100
  level: number;
  isPremium: boolean;
  location?: { lat: number; lng: number };
  lastActive: Date;
  conversationStyle: 'listener' | 'talker' | 'balanced';
  energyLevel: 'chill' | 'moderate' | 'energetic';
}

export interface CloudRoom {
  id: string;
  name: string;
  hostId: string;
  participants: string[];
  maxParticipants: number;
  vibeScore: number;           // Average vibe of room
  activityLevel: number;       // 0-1 (conversation density)
  topics: string[];
  location: { lat: number; lng: number };
  radius: number;              // meters
  createdAt: Date;
  lastActivity: Date;
  isPrivate: boolean;
  inviteOnly: boolean;
}

export interface MatchResult {
  roomId: string;
  score: number;               // 0-100 S_match score
  reasons: MatchReason[];
  participants: UserProfile[];
  isNewRoom: boolean;
  suggestedOpponent?: UserProfile;
}

export interface MatchReason {
  type: 'interests' | 'vibe' | 'activity' | 'proximity' | 'history';
  description: string;
  contribution: number;        // How much this factor contributed
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHING WEIGHTS (Tuned by Data Science)
// ═══════════════════════════════════════════════════════════════════════════════

const MATCH_WEIGHTS = {
  interests: 0.30,      // Shared interests (Jaccard)
  vibe: 0.25,           // Personality compatibility (Cosine)
  activity: 0.15,       // Activity level alignment
  proximity: 0.15,      // Physical distance
  history: 0.10,        // Previous positive interactions
  roomVibe: 0.05,       // Current room atmosphere
} as const;

const THRESHOLDS = {
  MIN_MATCH_SCORE: 45,         // Minimum score to suggest a room
  EXCELLENT_MATCH: 75,         // Excellent match threshold
  CREATE_NEW_ROOM: 35,         // Below this, create new room
  MAX_ROOM_SIZE: 6,            // Max participants per cloud
  ACTIVITY_DECAY_HOURS: 2,     // Activity freshness window
  PROXIMITY_MAX_KM: 10,        // Max distance for proximity bonus
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// MATHEMATICAL SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Jaccard Similarity for interests
 * J(A,B) = |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 0.5;

  const intersection = set1.filter(x => set2.includes(x)).length;
  const union = new Set([...set1, ...set2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Cosine Similarity for vibe vectors
 * cos(θ) = (A · B) / (||A|| × ||B||)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0.5;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] ** 2;
    norm2 += vec2[i] ** 2;
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude > 0 ? (dotProduct / magnitude + 1) / 2 : 0.5; // Normalize to 0-1
}

/**
 * Exponential decay for proximity scoring
 * S_proximity = e^(-λd) where d = distance in km
 */
export function proximityScore(distanceKm: number): number {
  const lambda = 0.3; // Decay rate
  const maxDistance = THRESHOLDS.PROXIMITY_MAX_KM;

  if (distanceKm > maxDistance) return 0;
  return Math.exp(-lambda * distanceKm);
}

/**
 * Activity alignment score
 * Measures how well activity levels match
 */
export function activityAlignment(score1: number, score2: number): number {
  const diff = Math.abs(score1 - score2);
  return 1 - (diff / 100);
}

/**
 * Temporal freshness score
 * More recent activity = higher score
 */
export function temporalFreshness(lastActive: Date): number {
  const hoursAgo = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
  const decayHours = THRESHOLDS.ACTIVITY_DECAY_HOURS;

  if (hoursAgo > 24) return 0.1;
  if (hoursAgo > decayHours) return 0.5 * Math.exp(-(hoursAgo - decayHours) / 10);
  return 1;
}

/**
 * Conversation style compatibility
 * Listeners match with Talkers, Balanced matches with all
 */
export function styleCompatibility(
  style1: UserProfile['conversationStyle'],
  style2: UserProfile['conversationStyle']
): number {
  if (style1 === 'balanced' || style2 === 'balanced') return 0.9;
  if (style1 === style2) return 0.6; // Same style = less dynamic
  return 1.0; // Listener + Talker = perfect dynamic
}

/**
 * Energy level compatibility
 * Similar energy levels match better
 */
export function energyCompatibility(
  energy1: UserProfile['energyLevel'],
  energy2: UserProfile['energyLevel']
): number {
  const levels = { chill: 0, moderate: 1, energetic: 2 };
  const diff = Math.abs(levels[energy1] - levels[energy2]);
  return 1 - (diff * 0.3);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MATCHING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class VibeMatchingEngine {

  /**
   * Calculate S_match score between two users
   * Returns normalized score 0-100
   */
  calculateMatchScore(user1: UserProfile, user2: UserProfile): {
    score: number;
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};

    // Interest similarity (Jaccard)
    const interestScore = jaccardSimilarity(user1.interests, user2.interests);
    breakdown.interests = interestScore * 100;

    // Vibe vector similarity (Cosine)
    const vibeScore = cosineSimilarity(
      user1.vibeVector || this.generateDefaultVibeVector(),
      user2.vibeVector || this.generateDefaultVibeVector()
    );
    breakdown.vibe = vibeScore * 100;

    // Activity alignment
    const activityScore = activityAlignment(user1.activityScore, user2.activityScore);
    breakdown.activity = activityScore * 100;

    // Proximity (if locations available)
    let proxScore = 0.5;
    if (user1.location && user2.location) {
      const distance = calculateHaversineDistance(
        user1.location.lat, user1.location.lng,
        user2.location.lat, user2.location.lng
      ) / 1000; // Convert to km
      proxScore = proximityScore(distance);
    }
    breakdown.proximity = proxScore * 100;

    // Style & Energy compatibility
    const styleScore = styleCompatibility(
      user1.conversationStyle || 'balanced',
      user2.conversationStyle || 'balanced'
    );
    const energyScore = energyCompatibility(
      user1.energyLevel || 'moderate',
      user2.energyLevel || 'moderate'
    );
    breakdown.style = ((styleScore + energyScore) / 2) * 100;

    // Calculate weighted sum
    const totalScore = (
      interestScore * MATCH_WEIGHTS.interests +
      vibeScore * MATCH_WEIGHTS.vibe +
      activityScore * MATCH_WEIGHTS.activity +
      proxScore * MATCH_WEIGHTS.proximity +
      ((styleScore + energyScore) / 2) * MATCH_WEIGHTS.history
    ) * 100;

    return {
      score: Math.round(Math.min(100, Math.max(0, totalScore))),
      breakdown
    };
  }

  /**
   * Generate default 8-dimensional vibe vector
   * Dimensions: [openness, energy, empathy, humor, depth, creativity, warmth, curiosity]
   */
  generateDefaultVibeVector(): number[] {
    return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  }

  /**
   * Find the best matching room for a user
   */
  async findBestRoom(
    userId: string,
    userLocation?: { lat: number; lng: number }
  ): Promise<MatchResult | null> {
    try {
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      const userProfile: UserProfile = {
        id: userId,
        displayName: userData.displayName || 'Anonym',
        username: userData.username || 'unknown',
        avatarUrl: userData.avatarUrl || null,
        interests: userData.interests || [],
        vibeVector: userData.vibeVector || this.generateDefaultVibeVector(),
        activityScore: userData.activityScore || 50,
        level: userData.level || 1,
        isPremium: userData.isPremium || false,
        location: userLocation || userData.location,
        lastActive: userData.lastSeen?.toDate?.() || new Date(),
        conversationStyle: userData.conversationStyle || 'balanced',
        energyLevel: userData.energyLevel || 'moderate',
      };

      // Find active rooms
      const roomsRef = collection(db, 'cloudRooms');
      const activeRoomsQuery = query(
        roomsRef,
        where('isActive', '==', true),
        where('participantCount', '<', THRESHOLDS.MAX_ROOM_SIZE),
        orderBy('participantCount', 'desc'),
        limit(20)
      );

      const roomsSnapshot = await getDocs(activeRoomsQuery);

      let bestRoom: MatchResult | null = null;
      let bestScore = 0;

      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = roomDoc.data();

        // Skip if user already in room
        if (roomData.participants?.includes(userId)) continue;

        // Get room participants
        const participants = await this.getRoomParticipants(roomData.participants || []);

        // Calculate average match score with room participants
        let totalScore = 0;
        const reasons: MatchReason[] = [];

        for (const participant of participants) {
          const { score, breakdown } = this.calculateMatchScore(userProfile, participant);
          totalScore += score;

          // Track top contributing factors
          const topFactor = Object.entries(breakdown)
            .sort(([,a], [,b]) => b - a)[0];

          if (topFactor && topFactor[1] > 60) {
            reasons.push({
              type: topFactor[0] as MatchReason['type'],
              description: this.getReasonDescription(topFactor[0], topFactor[1]),
              contribution: topFactor[1]
            });
          }
        }

        const avgScore = participants.length > 0
          ? totalScore / participants.length
          : THRESHOLDS.MIN_MATCH_SCORE;

        // Factor in room vibe
        const roomVibeBonus = (roomData.vibeScore || 50) / 100 * 10;
        const finalScore = avgScore + roomVibeBonus;

        if (finalScore > bestScore && finalScore >= THRESHOLDS.MIN_MATCH_SCORE) {
          bestScore = finalScore;
          bestRoom = {
            roomId: roomDoc.id,
            score: Math.round(finalScore),
            reasons: reasons.slice(0, 3), // Top 3 reasons
            participants,
            isNewRoom: false,
          };
        }
      }

      // If no good match, create new room and find interesting opponent
      if (!bestRoom || bestScore < THRESHOLDS.CREATE_NEW_ROOM) {
        const newRoom = await this.createPersonalizedRoom(userProfile);
        const opponent = await this.findInterestingOpponent(userProfile);

        return {
          roomId: newRoom.id,
          score: opponent ? this.calculateMatchScore(userProfile, opponent).score : 50,
          reasons: [{
            type: 'vibe',
            description: 'Ein neuer Raum wurde für dich kreiert',
            contribution: 100
          }],
          participants: [],
          isNewRoom: true,
          suggestedOpponent: opponent || undefined,
        };
      }

      return bestRoom;
    } catch (error) {
      console.error('[VibeMatcher] Error finding best room:', error);
      return null;
    }
  }

  /**
   * Get participant profiles for a room
   */
  private async getRoomParticipants(participantIds: string[]): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];

    for (const id of participantIds.slice(0, 10)) { // Limit for performance
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          profiles.push({
            id,
            displayName: data.displayName || 'Anonym',
            username: data.username || 'unknown',
            avatarUrl: data.avatarUrl || null,
            interests: data.interests || [],
            vibeVector: data.vibeVector || this.generateDefaultVibeVector(),
            activityScore: data.activityScore || 50,
            level: data.level || 1,
            isPremium: data.isPremium || false,
            location: data.location,
            lastActive: data.lastSeen?.toDate?.() || new Date(),
            conversationStyle: data.conversationStyle || 'balanced',
            energyLevel: data.energyLevel || 'moderate',
          });
        }
      } catch (e) {
        console.warn(`[VibeMatcher] Could not fetch user ${id}`);
      }
    }

    return profiles;
  }

  /**
   * Create a new personalized room
   */
  private async createPersonalizedRoom(user: UserProfile): Promise<CloudRoom> {
    const roomId = `cloud_${user.id}_${Date.now()}`;

    const roomData: Partial<CloudRoom> = {
      id: roomId,
      name: this.generateRoomName(user.interests),
      hostId: user.id,
      participants: [user.id],
      maxParticipants: THRESHOLDS.MAX_ROOM_SIZE,
      vibeScore: 50,
      activityLevel: 0,
      topics: user.interests.slice(0, 3),
      location: user.location || { lat: 0, lng: 0 },
      radius: 5000,
      createdAt: new Date(),
      lastActivity: new Date(),
      isPrivate: false,
      inviteOnly: false,
    };

    await setDoc(doc(db, 'cloudRooms', roomId), {
      ...roomData,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isActive: true,
      participantCount: 1,
    });

    return roomData as CloudRoom;
  }

  /**
   * Find an interesting opponent for a new room
   */
  private async findInterestingOpponent(user: UserProfile): Promise<UserProfile | null> {
    try {
      // Find active users with complementary profiles
      const usersRef = collection(db, 'users');
      const activeQuery = query(
        usersRef,
        where('isActive', '==', true),
        limit(50)
      );

      const snapshot = await getDocs(activeQuery);

      let bestMatch: UserProfile | null = null;
      let bestScore = 0;

      for (const userDoc of snapshot.docs) {
        if (userDoc.id === user.id) continue;

        const data = userDoc.data();
        const candidate: UserProfile = {
          id: userDoc.id,
          displayName: data.displayName || 'Anonym',
          username: data.username || 'unknown',
          avatarUrl: data.avatarUrl || null,
          interests: data.interests || [],
          vibeVector: data.vibeVector || this.generateDefaultVibeVector(),
          activityScore: data.activityScore || 50,
          level: data.level || 1,
          isPremium: data.isPremium || false,
          location: data.location,
          lastActive: data.lastSeen?.toDate?.() || new Date(),
          conversationStyle: data.conversationStyle || 'balanced',
          energyLevel: data.energyLevel || 'moderate',
        };

        // Check freshness
        const freshness = temporalFreshness(candidate.lastActive);
        if (freshness < 0.3) continue;

        const { score } = this.calculateMatchScore(user, candidate);
        const adjustedScore = score * freshness;

        if (adjustedScore > bestScore && adjustedScore >= THRESHOLDS.MIN_MATCH_SCORE) {
          bestScore = adjustedScore;
          bestMatch = candidate;
        }
      }

      // Send push notification to best match
      if (bestMatch) {
        await this.sendVibeNotification(bestMatch.id, user);
      }

      return bestMatch;
    } catch (error) {
      console.error('[VibeMatcher] Error finding opponent:', error);
      return null;
    }
  }

  /**
   * Send push notification for vibe match
   */
  private async sendVibeNotification(targetUserId: string, sourceUser: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'notifications', `vibe_${Date.now()}_${targetUserId}`), {
        userId: targetUserId,
        type: 'vibe_match',
        title: 'Ein besonderer Vibe ist in deiner Nähe...',
        body: `${sourceUser.displayName} wartet auf dich in einem neuen Raum ✨`,
        data: {
          sourceUserId: sourceUser.id,
          sourceUsername: sourceUser.username,
          sourceAvatar: sourceUser.avatarUrl,
        },
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[VibeMatcher] Failed to send notification:', error);
    }
  }

  /**
   * Generate creative room name based on interests
   */
  private generateRoomName(interests: string[]): string {
    const vibes = [
      'Nebula', 'Aurora', 'Cosmos', 'Stellar', 'Lunar',
      'Eclipse', 'Nova', 'Orbit', 'Galaxy', 'Starlight'
    ];

    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const interest = interests[0] || 'Vibes';

    return `${randomVibe} ${interest}`;
  }

  /**
   * Get human-readable reason description
   */
  private getReasonDescription(factor: string, score: number): string {
    const descriptions: Record<string, string[]> = {
      interests: [
        'Ihr teilt ähnliche Interessen',
        'Gemeinsame Leidenschaften verbinden euch',
        'Eure Interessen überschneiden sich perfekt'
      ],
      vibe: [
        'Eure Vibes harmonieren',
        'Ähnliche Energie verbindet euch',
        'Perfekte Wellenlänge'
      ],
      activity: [
        'Ähnliches Aktivitätslevel',
        'Ihr seid beide gerade aktiv',
        'Gleicher Rhythmus'
      ],
      proximity: [
        'Ihr seid ganz nah beieinander',
        'Nur wenige Meter trennen euch',
        'Praktisch um die Ecke'
      ],
      style: [
        'Eure Gesprächsstile ergänzen sich',
        'Perfekte Dynamik',
        'Ideale Kombination'
      ]
    };

    const options = descriptions[factor] || ['Gute Übereinstimmung'];
    const index = score > 80 ? 2 : score > 60 ? 1 : 0;
    return options[Math.min(index, options.length - 1)];
  }

  /**
   * Update room activity level based on conversation density
   */
  async updateRoomActivity(roomId: string, messageCount: number, duration: number): Promise<void> {
    const messagesPerMinute = duration > 0 ? messageCount / (duration / 60000) : 0;
    const activityLevel = Math.min(1, messagesPerMinute / 5); // 5 msg/min = max activity

    await updateDoc(doc(db, 'cloudRooms', roomId), {
      activityLevel,
      lastActivity: serverTimestamp(),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const vibeMatcher = new VibeMatchingEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

export function useVibeMatcher() {
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findMatch = useCallback(async (
    userId: string,
    location?: { lat: number; lng: number }
  ) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await vibeMatcher.findBestRoom(userId, location);
      setMatchResult(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Matching failed');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { isSearching, matchResult, error, findMatch };
}

export default vibeMatcher;
