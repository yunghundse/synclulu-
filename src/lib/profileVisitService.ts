/**
 * Profile Visit Service
 * 🔍 Tracks and records profile visits with timestamp
 *
 * @version 1.0.0
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface ProfileVisit {
  id: string;
  visitorId: string;
  visitedUserId: string;
  visitedAt: Date;
  visitorData?: {
    username: string;
    displayName?: string;
    photoURL?: string;
    isFounder?: boolean;
  };
}

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

/**
 * Record a profile visit
 * Call this when a user views another user's profile
 */
export async function recordProfileVisit(
  visitorId: string,
  visitedUserId: string
): Promise<void> {
  // Don't record self-visits
  if (visitorId === visitedUserId) return;

  try {
    // Check if this visitor already visited in the last hour (prevent spam)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentVisitQuery = query(
      collection(db, 'profileVisits'),
      where('visitorId', '==', visitorId),
      where('visitedUserId', '==', visitedUserId),
      where('visitedAt', '>=', Timestamp.fromDate(oneHourAgo)),
      limit(1)
    );

    const recentSnapshot = await getDocs(recentVisitQuery);
    if (!recentSnapshot.empty) {
      // Already visited within the hour, skip
      return;
    }

    // Record the new visit
    await addDoc(collection(db, 'profileVisits'), {
      visitorId,
      visitedUserId,
      visitedAt: Timestamp.now(),
    });

    console.log('[ProfileVisit] Recorded visit:', visitorId, '->', visitedUserId);
  } catch (error) {
    console.error('[ProfileVisit] Error recording visit:', error);
  }
}

/**
 * Get profile visitors for a user
 * Returns visitors from the last hour by default
 */
export async function getProfileVisitors(
  userId: string,
  options?: {
    lastHourOnly?: boolean;
    maxResults?: number;
  }
): Promise<ProfileVisit[]> {
  const { lastHourOnly = false, maxResults = 20 } = options || {};

  try {
    let visitsQuery;

    if (lastHourOnly) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      visitsQuery = query(
        collection(db, 'profileVisits'),
        where('visitedUserId', '==', userId),
        where('visitedAt', '>=', Timestamp.fromDate(oneHourAgo)),
        orderBy('visitedAt', 'desc'),
        limit(maxResults)
      );
    } else {
      visitsQuery = query(
        collection(db, 'profileVisits'),
        where('visitedUserId', '==', userId),
        orderBy('visitedAt', 'desc'),
        limit(maxResults)
      );
    }

    const snapshot = await getDocs(visitsQuery);
    const visits: ProfileVisit[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Fetch visitor user data
      let visitorData;
      try {
        const visitorDoc = await getDoc(doc(db, 'users', data.visitorId));
        if (visitorDoc.exists()) {
          const vData = visitorDoc.data();
          visitorData = {
            username: vData.username || 'User',
            displayName: vData.displayName,
            photoURL: vData.photoURL,
            isFounder: data.visitorId === FOUNDER_UID,
          };
        }
      } catch {}

      visits.push({
        id: docSnap.id,
        visitorId: data.visitorId,
        visitedUserId: data.visitedUserId,
        visitedAt: data.visitedAt?.toDate() || new Date(),
        visitorData,
      });
    }

    return visits;
  } catch (error) {
    console.error('[ProfileVisit] Error fetching visitors:', error);
    return [];
  }
}

/**
 * Get visitor count for a user (last 24 hours)
 */
export async function getVisitorCount(userId: string): Promise<number> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const countQuery = query(
      collection(db, 'profileVisits'),
      where('visitedUserId', '==', userId),
      where('visitedAt', '>=', Timestamp.fromDate(oneDayAgo))
    );

    const snapshot = await getDocs(countQuery);
    return snapshot.size;
  } catch (error) {
    console.error('[ProfileVisit] Error counting visitors:', error);
    return 0;
  }
}
