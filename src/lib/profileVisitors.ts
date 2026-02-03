/**
 * PROFILE VISITORS SYSTEM
 *
 * "X Personen haben deine Aura besucht"
 *
 * FEATURES:
 * - Track profile views
 * - Get visitor count (all users)
 * - Get visitor list (Premium/Founder only)
 * - Real-time visitor notifications
 *
 * @version 1.0.0
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProfileView {
  id: string;
  viewerId: string;
  targetId: string;
  viewedAt: Date;
  source: 'profile' | 'radar' | 'search' | 'nearby';
}

export interface ProfileVisitor {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  lastViewedAt: Date;
  viewCount: number;
  isPremium: boolean;
  isVerified: boolean;
}

export interface VisitorStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  viewsThisWeek: number;
  lastViewAt: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_ID = import.meta.env.VITE_FOUNDER_ID || 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Minimum time between recording same view (1 hour)
const VIEW_COOLDOWN_MS = 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// RECORD PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record when a user views another user's profile
 */
export async function recordProfileView(
  viewerId: string,
  targetId: string,
  source: ProfileView['source'] = 'profile'
): Promise<void> {
  // Don't record self-views
  if (viewerId === targetId) return;

  try {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const viewId = `${viewerId}_${targetId}_${hourKey}`;

    // Check if view already recorded this hour
    const existingView = await getDoc(doc(db, 'profile_views', viewId));
    if (existingView.exists()) {
      return; // Already recorded
    }

    // Record the view
    await setDoc(doc(db, 'profile_views', viewId), {
      viewerId,
      targetId,
      viewedAt: serverTimestamp(),
      source,
      hourKey
    });

    // Update target's view count
    await setDoc(doc(db, 'users', targetId), {
      profileViews: increment(1),
      lastProfileViewAt: serverTimestamp()
    }, { merge: true });

    // Update daily stats
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await setDoc(doc(db, 'profile_view_stats', `${targetId}_${today}`), {
      targetId,
      date: today,
      viewCount: increment(1),
      uniqueViewers: { [viewerId]: true }
    }, { merge: true });

  } catch (error) {
    console.error('[ProfileVisitors] Error recording view:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET VISITOR COUNT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the number of unique visitors (available to all users)
 */
export async function getVisitorCount(
  userId: string,
  days: number = 7
): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const viewsRef = collection(db, 'profile_views');
    const q = query(
      viewsRef,
      where('targetId', '==', userId),
      where('viewedAt', '>=', Timestamp.fromDate(cutoff))
    );

    const snapshot = await getDocs(q);

    // Count unique viewers
    const uniqueViewers = new Set<string>();
    snapshot.docs.forEach(doc => {
      uniqueViewers.add(doc.data().viewerId);
    });

    return uniqueViewers.size;

  } catch (error) {
    console.error('[ProfileVisitors] Error getting count:', error);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET VISITOR STATS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get detailed visitor statistics
 */
export async function getVisitorStats(userId: string): Promise<VisitorStats> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const viewsRef = collection(db, 'profile_views');
    const allViewsQuery = query(
      viewsRef,
      where('targetId', '==', userId),
      orderBy('viewedAt', 'desc'),
      limit(1000)
    );

    const snapshot = await getDocs(allViewsQuery);

    const uniqueViewers = new Set<string>();
    let viewsToday = 0;
    let viewsThisWeek = 0;
    let lastViewAt: Date | null = null;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const viewedAt = data.viewedAt?.toDate?.() || new Date();

      uniqueViewers.add(data.viewerId);

      if (index === 0) {
        lastViewAt = viewedAt;
      }

      if (viewedAt >= todayStart) {
        viewsToday++;
      }
      if (viewedAt >= weekStart) {
        viewsThisWeek++;
      }
    });

    return {
      totalViews: snapshot.size,
      uniqueVisitors: uniqueViewers.size,
      viewsToday,
      viewsThisWeek,
      lastViewAt
    };

  } catch (error) {
    console.error('[ProfileVisitors] Error getting stats:', error);
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      lastViewAt: null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET VISITOR LIST (PREMIUM/FOUNDER ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user can see visitor list
 */
export function canSeeVisitors(
  userId: string,
  userRole: string,
  isPremium: boolean
): boolean {
  // Founder sees everything
  if (userId === FOUNDER_ID || userRole === 'founder') {
    return true;
  }

  // Premium users can see visitors
  if (isPremium || userRole === 'admin') {
    return true;
  }

  return false;
}

/**
 * Get list of profile visitors (Premium/Founder only)
 */
export async function getVisitorList(
  userId: string,
  requesterId: string,
  requesterRole: string,
  requesterIsPremium: boolean,
  maxResults: number = 20
): Promise<ProfileVisitor[]> {
  // Check permissions
  if (!canSeeVisitors(requesterId, requesterRole, requesterIsPremium)) {
    throw new Error('PREMIUM_REQUIRED');
  }

  try {
    const viewsRef = collection(db, 'profile_views');
    const q = query(
      viewsRef,
      where('targetId', '==', userId),
      orderBy('viewedAt', 'desc'),
      limit(100) // Get more to aggregate
    );

    const snapshot = await getDocs(q);

    // Aggregate by viewer
    const viewerMap = new Map<string, {
      lastViewedAt: Date;
      viewCount: number;
    }>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const viewerId = data.viewerId;
      const viewedAt = data.viewedAt?.toDate?.() || new Date();

      const existing = viewerMap.get(viewerId);
      if (existing) {
        existing.viewCount++;
        if (viewedAt > existing.lastViewedAt) {
          existing.lastViewedAt = viewedAt;
        }
      } else {
        viewerMap.set(viewerId, {
          lastViewedAt: viewedAt,
          viewCount: 1
        });
      }
    });

    // Sort by last viewed and limit
    const sortedViewers = Array.from(viewerMap.entries())
      .sort((a, b) => b[1].lastViewedAt.getTime() - a[1].lastViewedAt.getTime())
      .slice(0, maxResults);

    // Fetch user details for each viewer
    const visitors: ProfileVisitor[] = [];

    for (const [viewerId, viewData] of sortedViewers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', viewerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          visitors.push({
            userId: viewerId,
            displayName: userData.displayName || 'Anonym',
            username: userData.username || 'unknown',
            avatarUrl: userData.avatarUrl || null,
            lastViewedAt: viewData.lastViewedAt,
            viewCount: viewData.viewCount,
            isPremium: userData.isPremium || false,
            isVerified: userData.isVerified || false
          });
        }
      } catch {
        // Skip users we can't fetch
      }
    }

    return visitors;

  } catch (error) {
    console.error('[ProfileVisitors] Error getting visitor list:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIBE TO VISITOR COUNT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to real-time visitor count updates
 */
export function subscribeToVisitorCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  const userRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    const data = snapshot.data();
    callback(data?.profileViews || 0);
  });

  return unsubscribe;
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useStore } from './store';

/**
 * Hook to get visitor count for current user
 */
export function useVisitorCount() {
  const { user } = useStore();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToVisitorCount(user.id, (newCount) => {
      setCount(newCount);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user?.id]);

  return { count, isLoading };
}

/**
 * Hook to get visitor stats
 */
export function useVisitorStats() {
  const { user } = useStore();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);
    getVisitorStats(user.id)
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  return { stats, isLoading };
}

/**
 * Hook to get visitor list (Premium/Founder only)
 */
export function useVisitorList(maxResults: number = 20) {
  const { user } = useStore();
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = user
    ? canSeeVisitors(
        user.id,
        (user as any).role || 'user',
        (user as any).isPremium || false
      )
    : false;

  useEffect(() => {
    if (!user?.id) return;

    if (!canAccess) {
      setError('PREMIUM_REQUIRED');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getVisitorList(
      user.id,
      user.id,
      (user as any).role || 'user',
      (user as any).isPremium || false,
      maxResults
    )
      .then(setVisitors)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [user?.id, canAccess, maxResults]);

  return { visitors, isLoading, error, canAccess };
}

export default {
  recordProfileView,
  getVisitorCount,
  getVisitorStats,
  getVisitorList,
  canSeeVisitors,
  subscribeToVisitorCount,
  useVisitorCount,
  useVisitorStats,
  useVisitorList
};
