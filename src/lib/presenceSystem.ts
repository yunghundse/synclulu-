/**
 * DELULU PRESENCE SYSTEM
 * Online-Status, Besucher-Tracking & Echtzeit-Präsenz
 */

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where,
  orderBy, limit, getDocs, onSnapshot, Timestamp, increment,
  serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════

export type OnlineStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  status: OnlineStatus;
  lastSeen: Date;
  lastActive: Date;
  isIncognito: boolean;
  currentPage?: string;
}

export interface PresencePrivacy {
  showOnlineStatus: boolean;      // Show real-time online status
  showLastSeen: boolean;          // Show "Zuletzt gesehen" timestamp
  showActivityType: boolean;      // Show what user is doing
}

export type LastSeenDisplay =
  | 'online'
  | 'recently'           // Kürzlich gesehen
  | 'today'              // Heute
  | 'yesterday'          // Gestern
  | 'this_week'          // Diese Woche
  | 'long_ago'           // Vor längerer Zeit
  | 'hidden';            // Privacy enabled

export interface ProfileVisit {
  id: string;
  visitorId: string;
  visitorUsername: string;
  visitorAvatar: string;
  visitedUserId: string;
  visitedAt: Date;
  isAnonymous: boolean;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  recentVisitors: ProfileVisit[];
}

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const PRESENCE_CONFIG = {
  onlineThreshold: 5 * 60 * 1000, // 5 minutes
  awayThreshold: 15 * 60 * 1000, // 15 minutes
  updateInterval: 30 * 1000, // 30 seconds
  maxRecentVisitors: 50,
  visitorNotificationDelay: 3000, // 3 seconds
  colors: {
    online: '#22C55E', // Green
    away: '#C4B5FD', // Pastel Purple
    offline: '#9CA3AF', // Gray
  },
};

// ═══════════════════════════════════════
// PRESENCE FUNCTIONS
// ═══════════════════════════════════════

/**
 * Update user's online presence
 */
export const updatePresence = async (
  userId: string,
  status?: OnlineStatus,
  currentPage?: string
): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', userId);
    const now = new Date();

    await setDoc(presenceRef, {
      userId,
      status: status || 'online',
      lastSeen: Timestamp.fromDate(now),
      lastActive: Timestamp.fromDate(now),
      currentPage: currentPage || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating presence:', error);
  }
};

/**
 * Set user as offline
 */
export const setOffline = async (userId: string): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', userId);
    await updateDoc(presenceRef, {
      status: 'offline',
      lastSeen: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error setting offline:', error);
  }
};

/**
 * Get user's presence status
 */
export const getPresence = async (userId: string): Promise<UserPresence | null> => {
  try {
    const presenceRef = doc(db, 'presence', userId);
    const presenceDoc = await getDoc(presenceRef);

    if (!presenceDoc.exists()) return null;

    const data = presenceDoc.data();
    const lastActive = data.lastActive?.toDate() || new Date();
    const now = new Date();
    const timeDiff = now.getTime() - lastActive.getTime();

    // Calculate real status based on last activity
    let calculatedStatus: OnlineStatus = data.status;
    if (data.status !== 'offline') {
      if (timeDiff > PRESENCE_CONFIG.awayThreshold) {
        calculatedStatus = 'offline';
      } else if (timeDiff > PRESENCE_CONFIG.onlineThreshold) {
        calculatedStatus = 'away';
      }
    }

    return {
      userId: data.userId,
      status: calculatedStatus,
      lastSeen: data.lastSeen?.toDate() || new Date(),
      lastActive,
      isIncognito: data.isIncognito || false,
      currentPage: data.currentPage,
    };
  } catch (error) {
    console.error('Error getting presence:', error);
    return null;
  }
};

/**
 * Subscribe to user's presence changes
 */
export const subscribeToPresence = (
  userId: string,
  callback: (presence: UserPresence | null) => void
): (() => void) => {
  const presenceRef = doc(db, 'presence', userId);

  return onSnapshot(
    presenceRef,
    (doc) => {
      if (!doc.exists()) {
        callback(null);
        return;
      }

      const data = doc.data();
      const lastActive = data.lastActive?.toDate() || new Date();
      const now = new Date();
      const timeDiff = now.getTime() - lastActive.getTime();

      let calculatedStatus: OnlineStatus = data.status;
      if (data.status !== 'offline') {
        if (timeDiff > PRESENCE_CONFIG.awayThreshold) {
          calculatedStatus = 'offline';
        } else if (timeDiff > PRESENCE_CONFIG.onlineThreshold) {
          calculatedStatus = 'away';
        }
      }

      callback({
        userId: data.userId,
        status: calculatedStatus,
        lastSeen: data.lastSeen?.toDate() || new Date(),
        lastActive,
        isIncognito: data.isIncognito || false,
        currentPage: data.currentPage,
      });
    },
    (error) => {
      console.warn('Presence listener error:', error.message);
      callback(null);
    }
  );
};

/**
 * Toggle incognito mode
 */
export const setIncognitoMode = async (userId: string, isIncognito: boolean): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', userId);
    await updateDoc(presenceRef, { isIncognito });

    // Also update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isIncognito });
  } catch (error) {
    console.error('Error setting incognito mode:', error);
  }
};

// ═══════════════════════════════════════
// VISITOR TRACKING
// ═══════════════════════════════════════

/**
 * Record a profile visit
 */
export const recordProfileVisit = async (
  visitorId: string,
  visitorUsername: string,
  visitorAvatar: string,
  visitedUserId: string
): Promise<{ success: boolean; shouldNotify: boolean }> => {
  try {
    // Don't track self-visits
    if (visitorId === visitedUserId) {
      return { success: false, shouldNotify: false };
    }

    // Check if visitor is in incognito mode
    const visitorPresence = await getPresence(visitorId);
    const isAnonymous = visitorPresence?.isIncognito || false;

    // Check if visited user accepts visitors
    const visitedUserDoc = await getDoc(doc(db, 'users', visitedUserId));
    const visitedUserData = visitedUserDoc.data();
    const acceptsVisitors = visitedUserData?.showProfileVisitors !== false;

    if (!acceptsVisitors) {
      return { success: false, shouldNotify: false };
    }

    // Create visit record
    const visitId = `${visitorId}_${visitedUserId}_${Date.now()}`;
    const visitRef = doc(db, 'profileVisits', visitId);

    await setDoc(visitRef, {
      visitorId,
      visitorUsername: isAnonymous ? 'Jemand' : visitorUsername,
      visitorAvatar: isAnonymous ? 'ghost' : visitorAvatar,
      visitedUserId,
      visitedAt: Timestamp.fromDate(new Date()),
      isAnonymous,
    });

    // Update visitor stats for visited user
    const statsRef = doc(db, 'visitorStats', visitedUserId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        totalVisits: increment(1),
        lastVisitAt: Timestamp.fromDate(new Date()),
      });
    } else {
      await setDoc(statsRef, {
        userId: visitedUserId,
        totalVisits: 1,
        uniqueVisitors: 1,
        lastVisitAt: Timestamp.fromDate(new Date()),
      });
    }

    // Create notification for visited user (if not incognito visitor)
    if (!isAnonymous && !visitedUserData?.isIncognito) {
      const notificationRef = collection(db, 'notifications');
      await setDoc(doc(notificationRef), {
        userId: visitedUserId,
        type: 'profile_visit',
        title: 'Wolken-Besuch ✨',
        message: `Jemand hat einen Blick in deine Wolke geworfen...`,
        data: {
          visitorId,
          visitorUsername,
          visitorAvatar,
        },
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
      });

      return { success: true, shouldNotify: true };
    }

    return { success: true, shouldNotify: false };
  } catch (error) {
    console.error('Error recording profile visit:', error);
    return { success: false, shouldNotify: false };
  }
};

/**
 * Get recent profile visitors
 */
export const getProfileVisitors = async (
  userId: string,
  limitCount: number = 20
): Promise<ProfileVisit[]> => {
  try {
    // Check if user has incognito mode
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.data()?.isIncognito) {
      return [];
    }

    const visitsRef = collection(db, 'profileVisits');
    const q = query(
      visitsRef,
      where('visitedUserId', '==', userId),
      orderBy('visitedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      visitedAt: doc.data().visitedAt?.toDate() || new Date(),
    })) as ProfileVisit[];
  } catch (error) {
    console.error('Error getting profile visitors:', error);
    return [];
  }
};

/**
 * Get visitor statistics
 */
export const getVisitorStats = async (userId: string): Promise<VisitorStats> => {
  try {
    // Get recent visitors
    const recentVisitors = await getProfileVisitors(userId, PRESENCE_CONFIG.maxRecentVisitors);

    // Calculate unique visitors
    const uniqueVisitorIds = new Set(recentVisitors.map(v => v.visitorId));

    // Calculate today's visits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = recentVisitors.filter(v => v.visitedAt >= today).length;

    // Get total visits from stats
    const statsDoc = await getDoc(doc(db, 'visitorStats', userId));
    const totalVisits = statsDoc.data()?.totalVisits || 0;

    return {
      totalVisits,
      uniqueVisitors: uniqueVisitorIds.size,
      todayVisits,
      recentVisitors: recentVisitors.slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
      recentVisitors: [],
    };
  }
};

/**
 * Subscribe to new profile visits
 */
export const subscribeToProfileVisits = (
  userId: string,
  callback: (visit: ProfileVisit) => void
): (() => void) => {
  const visitsRef = collection(db, 'profileVisits');
  const q = query(
    visitsRef,
    where('visitedUserId', '==', userId),
    orderBy('visitedAt', 'desc'),
    limit(1)
  );

  let lastVisitTime: Date | null = null;

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const visit = {
            id: change.doc.id,
            ...change.doc.data(),
            visitedAt: change.doc.data().visitedAt?.toDate() || new Date(),
          } as ProfileVisit;

          // Only notify for new visits
          if (!lastVisitTime || visit.visitedAt > lastVisitTime) {
            lastVisitTime = visit.visitedAt;
            callback(visit);
          }
        }
      });
    },
    (error) => {
      console.warn('Profile visits listener error:', error.message);
    }
  );
};

/**
 * Get status color
 */
export const getStatusColor = (status: OnlineStatus): string => {
  return PRESENCE_CONFIG.colors[status];
};

/**
 * Format last seen time
 */
export const formatLastSeen = (lastSeen: Date): string => {
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Gerade eben';
  if (minutes < 60) return `Vor ${minutes} Min.`;
  if (hours < 24) return `Vor ${hours} Std.`;
  if (days === 1) return 'Gestern';
  if (days < 7) return `Vor ${days} Tagen`;

  return lastSeen.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
};

// ═══════════════════════════════════════
// PRIVACY CONTROLS - "Zuletzt gesehen"
// ═══════════════════════════════════════

/**
 * Update presence privacy settings
 */
export const updatePresencePrivacy = async (
  userId: string,
  privacy: Partial<PresencePrivacy>
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'privacySettings.showOnlineStatus': privacy.showOnlineStatus,
      'privacySettings.showLastSeen': privacy.showLastSeen,
      'privacySettings.showActivityType': privacy.showActivityType,
      privacyUpdatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating presence privacy:', error);
    return false;
  }
};

/**
 * Get user's presence privacy settings
 */
export const getPresencePrivacy = async (userId: string): Promise<PresencePrivacy> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { showOnlineStatus: true, showLastSeen: true, showActivityType: false };
    }

    const data = userDoc.data();
    return {
      showOnlineStatus: data.privacySettings?.showOnlineStatus ?? true,
      showLastSeen: data.privacySettings?.showLastSeen ?? true,
      showActivityType: data.privacySettings?.showActivityType ?? false
    };
  } catch (error) {
    console.error('Error getting presence privacy:', error);
    return { showOnlineStatus: true, showLastSeen: true, showActivityType: false };
  }
};

/**
 * Get displayable last seen status (respects privacy)
 */
export const getLastSeenDisplay = async (
  targetUserId: string
): Promise<{ display: LastSeenDisplay; text: string }> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    if (!userDoc.exists()) {
      return { display: 'hidden', text: '' };
    }

    const data = userDoc.data();
    const showLastSeen = data.privacySettings?.showLastSeen ?? true;
    const showOnlineStatus = data.privacySettings?.showOnlineStatus ?? true;

    if (!showLastSeen && !showOnlineStatus) {
      return { display: 'hidden', text: '' };
    }

    const presence = await getPresence(targetUserId);
    if (!presence) {
      return { display: 'hidden', text: '' };
    }

    if (presence.status === 'online' && showOnlineStatus) {
      return { display: 'online', text: 'Online' };
    }

    if (!showLastSeen) {
      return { display: 'hidden', text: '' };
    }

    return { display: 'recently', text: formatLastSeen(presence.lastSeen) };
  } catch (error) {
    console.error('Error getting last seen display:', error);
    return { display: 'hidden', text: '' };
  }
};

export default {
  PRESENCE_CONFIG,
  updatePresence,
  setOffline,
  getPresence,
  subscribeToPresence,
  setIncognitoMode,
  recordProfileVisit,
  getProfileVisitors,
  getVisitorStats,
  subscribeToProfileVisits,
  getStatusColor,
  formatLastSeen,
  updatePresencePrivacy,
  getPresencePrivacy,
  getLastSeenDisplay,
};
