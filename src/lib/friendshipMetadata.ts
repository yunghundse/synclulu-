/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FRIENDSHIP METADATA SERVICE - Memories & Trust Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - First Met Location (Geopoint)
 * - Met At Timestamp
 * - Common Interests Array
 * - Trust Level Score (synced with Aegis Safety Score)
 * - Friendship Duration Calculation
 *
 * @author Chief Product Officer @ Snapchat
 * @version 1.0.0
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  GeoPoint,
} from 'firebase/firestore';
import { getSafetyProfile } from './aegisVerification';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FriendshipMetadata {
  friendshipId: string;
  metAtLocation: GeoPoint | null;
  metAtVenueName: string;
  firstMetTimestamp: Date;
  commonInterests: string[];
  trustLevelScore: number;
  sharedRoomsCount: number;
  totalVoiceMinutes: number;
  lastInteraction: Date;
  memoriesUnlocked: string[];
}

export interface FriendshipMemory {
  type: 'first_cloud' | 'milestone' | 'streak_record' | 'anniversary';
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRIENDSHIP METADATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create friendship metadata when friendship is accepted
 */
export async function createFriendshipMetadata(params: {
  friendshipId: string;
  userId1: string;
  userId2: string;
  metInRoomId?: string;
  metAtLocation?: { lat: number; lng: number };
  venueName?: string;
}): Promise<void> {
  const { friendshipId, userId1, userId2, metInRoomId, metAtLocation, venueName } = params;

  try {
    // Fetch both users' interests
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, 'users', userId1)),
      getDoc(doc(db, 'users', userId2)),
    ]);

    const user1Interests: string[] = user1Doc.data()?.interests || [];
    const user2Interests: string[] = user2Doc.data()?.interests || [];

    // Calculate common interests
    const commonInterests = user1Interests.filter((interest) =>
      user2Interests.includes(interest)
    );

    // Create metadata document
    const metadataRef = doc(db, 'friendship_metadata', friendshipId);
    await setDoc(metadataRef, {
      friendshipId,
      users: [userId1, userId2],
      metAtLocation: metAtLocation
        ? new GeoPoint(metAtLocation.lat, metAtLocation.lng)
        : null,
      metAtVenueName: venueName || metInRoomId ? 'Im Wölkchen getroffen' : 'Über Profil',
      firstMetTimestamp: serverTimestamp(),
      commonInterests,
      trustLevelScore: 100, // Start with full trust
      sharedRoomsCount: metInRoomId ? 1 : 0,
      totalVoiceMinutes: 0,
      lastInteraction: serverTimestamp(),
      memoriesUnlocked: ['first_cloud'],
    });

    console.log('[FriendshipMetadata] ✅ Created metadata for:', friendshipId);
  } catch (error) {
    console.error('[FriendshipMetadata] ❌ Error creating metadata:', error);
    throw error;
  }
}

/**
 * Get friendship metadata
 */
export async function getFriendshipMetadata(
  friendshipId: string
): Promise<FriendshipMetadata | null> {
  try {
    const metadataRef = doc(db, 'friendship_metadata', friendshipId);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      return null;
    }

    const data = metadataSnap.data();
    return {
      friendshipId: data.friendshipId,
      metAtLocation: data.metAtLocation,
      metAtVenueName: data.metAtVenueName || 'Unbekannt',
      firstMetTimestamp: data.firstMetTimestamp?.toDate() || new Date(),
      commonInterests: data.commonInterests || [],
      trustLevelScore: data.trustLevelScore || 100,
      sharedRoomsCount: data.sharedRoomsCount || 0,
      totalVoiceMinutes: data.totalVoiceMinutes || 0,
      lastInteraction: data.lastInteraction?.toDate() || new Date(),
      memoriesUnlocked: data.memoriesUnlocked || [],
    };
  } catch (error) {
    console.error('[FriendshipMetadata] Error fetching metadata:', error);
    return null;
  }
}

/**
 * Update trust level score (called when Aegis Safety Score changes)
 */
export async function syncTrustLevelWithAegis(
  userId: string
): Promise<void> {
  try {
    // Get user's current Aegis safety score
    const safetyProfile = await getSafetyProfile(userId);
    if (!safetyProfile) return;

    const safetyScore = safetyProfile.safetyScore || 100;

    // Find all friendships involving this user
    const metadataRef = collection(db, 'friendship_metadata');
    const q = query(metadataRef, where('users', 'array-contains', userId));
    const snapshot = await getDocs(q);

    // Update trust level in all friendships
    const updates = snapshot.docs.map(async (docSnap) => {
      const currentTrust = docSnap.data().trustLevelScore || 100;

      // Trust level = average of current trust and safety score
      // This way, safety score changes gradually affect trust
      const newTrustLevel = Math.round((currentTrust + safetyScore) / 2);

      if (Math.abs(newTrustLevel - currentTrust) >= 5) {
        await updateDoc(doc(db, 'friendship_metadata', docSnap.id), {
          trustLevelScore: newTrustLevel,
        });
      }
    });

    await Promise.all(updates);
    console.log('[FriendshipMetadata] 🔄 Synced trust levels for user:', userId);
  } catch (error) {
    console.error('[FriendshipMetadata] Error syncing trust:', error);
  }
}

/**
 * Record shared room interaction
 */
export async function recordSharedRoom(
  friendshipId: string,
  roomId: string,
  durationMinutes: number
): Promise<void> {
  try {
    const metadataRef = doc(db, 'friendship_metadata', friendshipId);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) return;

    const data = metadataSnap.data();
    const newRoomCount = (data.sharedRoomsCount || 0) + 1;
    const newVoiceMinutes = (data.totalVoiceMinutes || 0) + durationMinutes;

    // Check for milestone memories
    const newMemories = [...(data.memoriesUnlocked || [])];

    if (newRoomCount === 10 && !newMemories.includes('milestone_10_rooms')) {
      newMemories.push('milestone_10_rooms');
    }
    if (newVoiceMinutes >= 60 && !newMemories.includes('milestone_1h_voice')) {
      newMemories.push('milestone_1h_voice');
    }
    if (newVoiceMinutes >= 600 && !newMemories.includes('milestone_10h_voice')) {
      newMemories.push('milestone_10h_voice');
    }

    await updateDoc(metadataRef, {
      sharedRoomsCount: newRoomCount,
      totalVoiceMinutes: newVoiceMinutes,
      lastInteraction: serverTimestamp(),
      memoriesUnlocked: newMemories,
    });
  } catch (error) {
    console.error('[FriendshipMetadata] Error recording shared room:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRIENDSHIP DURATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FriendshipDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  label: string;
  labelShort: string;
}

/**
 * Calculate friendship duration
 */
export function calculateFriendshipDuration(firstMetDate: Date): FriendshipDuration {
  const now = new Date();
  const diffMs = now.getTime() - firstMetDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;

  // Build label
  let label = '';
  let labelShort = '';

  if (years > 0) {
    label = `${years} Jahr${years > 1 ? 'e' : ''}, ${months} Monat${months !== 1 ? 'e' : ''}`;
    labelShort = `${years}J ${months}M`;
  } else if (months > 0) {
    label = `${months} Monat${months !== 1 ? 'e' : ''}, ${days} Tag${days !== 1 ? 'e' : ''}`;
    labelShort = `${months}M ${days}T`;
  } else {
    label = `${days} Tag${days !== 1 ? 'e' : ''}`;
    labelShort = `${days}T`;
  }

  return {
    years,
    months,
    days,
    totalDays,
    label,
    labelShort,
  };
}

/**
 * Get friendship memory milestones
 */
export function getFriendshipMemories(
  metadata: FriendshipMetadata
): FriendshipMemory[] {
  const memories: FriendshipMemory[] = [];
  const duration = calculateFriendshipDuration(metadata.firstMetTimestamp);

  // First cloud memory
  if (metadata.memoriesUnlocked.includes('first_cloud')) {
    memories.push({
      type: 'first_cloud',
      title: 'Erstes Wölkchen',
      description: `Ihr habt euch ${metadata.metAtVenueName} getroffen`,
      icon: '☁️',
      unlockedAt: metadata.firstMetTimestamp,
    });
  }

  // Milestone memories
  if (metadata.memoriesUnlocked.includes('milestone_10_rooms')) {
    memories.push({
      type: 'milestone',
      title: '10 Wölkchen!',
      description: 'Ihr wart zusammen in 10 verschiedenen Wölkchen',
      icon: '🎉',
      unlockedAt: metadata.lastInteraction,
    });
  }

  if (metadata.memoriesUnlocked.includes('milestone_1h_voice')) {
    memories.push({
      type: 'milestone',
      title: '1 Stunde Voice',
      description: 'Ihr habt über eine Stunde zusammen gequatscht',
      icon: '🎙️',
      unlockedAt: metadata.lastInteraction,
    });
  }

  if (metadata.memoriesUnlocked.includes('milestone_10h_voice')) {
    memories.push({
      type: 'milestone',
      title: '10 Stunden Voice',
      description: 'Wow! Über 10 Stunden gemeinsame Zeit',
      icon: '🌟',
      unlockedAt: metadata.lastInteraction,
    });
  }

  // Anniversary memories
  if (duration.years >= 1 && metadata.memoriesUnlocked.includes('anniversary_1y')) {
    memories.push({
      type: 'anniversary',
      title: '1 Jahr Freundschaft',
      description: 'Ihr seid seit einem Jahr befreundet!',
      icon: '💜',
      unlockedAt: new Date(
        metadata.firstMetTimestamp.getTime() + 365 * 24 * 60 * 60 * 1000
      ),
    });
  }

  return memories;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

export function useFriendshipMetadata(friendshipId: string | null) {
  const [metadata, setMetadata] = useState<FriendshipMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<FriendshipDuration | null>(null);
  const [memories, setMemories] = useState<FriendshipMemory[]>([]);

  useEffect(() => {
    if (!friendshipId) {
      setMetadata(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Real-time subscription
    const metadataRef = doc(db, 'friendship_metadata', friendshipId);
    const unsubscribe = onSnapshot(
      metadataRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const meta: FriendshipMetadata = {
            friendshipId: data.friendshipId,
            metAtLocation: data.metAtLocation,
            metAtVenueName: data.metAtVenueName || 'Unbekannt',
            firstMetTimestamp: data.firstMetTimestamp?.toDate() || new Date(),
            commonInterests: data.commonInterests || [],
            trustLevelScore: data.trustLevelScore || 100,
            sharedRoomsCount: data.sharedRoomsCount || 0,
            totalVoiceMinutes: data.totalVoiceMinutes || 0,
            lastInteraction: data.lastInteraction?.toDate() || new Date(),
            memoriesUnlocked: data.memoriesUnlocked || [],
          };

          setMetadata(meta);
          setDuration(calculateFriendshipDuration(meta.firstMetTimestamp));
          setMemories(getFriendshipMemories(meta));
        } else {
          setMetadata(null);
          setDuration(null);
          setMemories([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('[useFriendshipMetadata] Error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [friendshipId]);

  return { metadata, duration, memories, isLoading };
}

export default {
  createFriendshipMetadata,
  getFriendshipMetadata,
  syncTrustLevelWithAegis,
  recordSharedRoom,
  calculateFriendshipDuration,
  getFriendshipMemories,
};
