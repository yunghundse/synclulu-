/**
 * safetySystem.ts
 * 🛡️ SOVEREIGN SAFETY SYSTEM - Reports, Blocks & Moderation
 *
 * App Store Compliant Safety Features:
 * - User Reporting (Hate Speech, Harassment, Inappropriate)
 * - Instant Blocking (Mutual Invisibility)
 * - Shadow-Ban Mechanism
 * - AI Moderation Integration Ready
 *
 * @version 1.0.0
 */

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ReportReason =
  | 'hate_speech'
  | 'harassment'
  | 'inappropriate_content'
  | 'spam'
  | 'impersonation'
  | 'threats'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export type ModerationAction = 'warning' | 'mute' | 'shadow_ban' | 'temp_ban' | 'permanent_ban';

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reason: ReportReason;
  description?: string;
  roomId?: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  aiDecision?: {
    severityScore: number;
    action: ModerationAction;
    reasoning: string;
  };
}

export interface UserBlock {
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface ModerationLog {
  id: string;
  action: ModerationAction;
  targetUserId: string;
  targetUserName?: string;
  reason: string;
  isAiDecision: boolean;
  adminId?: string;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const REPORT_REASONS: Record<ReportReason, { label: string; severity: number }> = {
  hate_speech: { label: 'Hassrede', severity: 8 },
  harassment: { label: 'Belästigung', severity: 7 },
  threats: { label: 'Drohungen', severity: 9 },
  inappropriate_content: { label: 'Unangemessene Inhalte', severity: 6 },
  spam: { label: 'Spam', severity: 3 },
  impersonation: { label: 'Identitätsbetrug', severity: 5 },
  other: { label: 'Sonstiges', severity: 4 },
};

const SHADOW_BAN_THRESHOLD = 3; // Reports in 24h für auto Shadow-Ban
const SHADOW_BAN_DURATION = 12 * 60 * 60 * 1000; // 12 Stunden

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Erstellt einen neuen Safety Report
 */
export const createReport = async (
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string,
  roomId?: string
): Promise<{ success: boolean; reportId?: string; error?: string }> => {
  try {
    // Verhindere Self-Reports
    if (reporterId === reportedUserId) {
      return { success: false, error: 'Du kannst dich nicht selbst melden.' };
    }

    // Prüfe auf Duplikate (gleicher Report in letzten 24h)
    const recentReports = await getDocs(
      query(
        collection(db, 'safety_reports'),
        where('reporterId', '==', reporterId),
        where('reportedUserId', '==', reportedUserId),
        where('createdAt', '>', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
      )
    );

    if (!recentReports.empty) {
      return { success: false, error: 'Du hast diesen Nutzer bereits gemeldet.' };
    }

    // Report erstellen
    const reportRef = await addDoc(collection(db, 'safety_reports'), {
      reporterId,
      reportedUserId,
      reason,
      description: description || '',
      roomId: roomId || null,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Auto-Moderation triggern
    await checkAutoModeration(reportedUserId);

    console.log('🛡️ Safety Report erstellt:', reportRef.id);
    return { success: true, reportId: reportRef.id };
  } catch (error: any) {
    console.error('❌ Report Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prüft ob Auto-Moderation (Shadow-Ban) nötig ist
 */
const checkAutoModeration = async (userId: string): Promise<void> => {
  try {
    // Zähle Reports in den letzten 24h
    const recentReports = await getDocs(
      query(
        collection(db, 'safety_reports'),
        where('reportedUserId', '==', userId),
        where('status', '==', 'pending'),
        where('createdAt', '>', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
      )
    );

    if (recentReports.size >= SHADOW_BAN_THRESHOLD) {
      // Auto Shadow-Ban
      await applyShadowBan(userId, SHADOW_BAN_DURATION, 'auto_moderation');
      console.log('🚫 Auto Shadow-Ban für User:', userId);
    }
  } catch (error) {
    console.error('Auto-moderation check failed:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Blockiert einen User (bidirektional unsichtbar)
 */
export const blockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (blockerId === blockedId) {
      return { success: false, error: 'Du kannst dich nicht selbst blockieren.' };
    }

    // Prüfe ob bereits blockiert
    const existingBlock = await getDocs(
      query(
        collection(db, 'user_blocks'),
        where('blockerId', '==', blockerId),
        where('blockedId', '==', blockedId)
      )
    );

    if (!existingBlock.empty) {
      return { success: false, error: 'Nutzer ist bereits blockiert.' };
    }

    // Block erstellen
    await addDoc(collection(db, 'user_blocks'), {
      blockerId,
      blockedId,
      createdAt: serverTimestamp(),
    });

    // Update User Blocked Lists
    const blockerRef = doc(db, 'users', blockerId);
    const blockerDoc = await getDoc(blockerRef);
    if (blockerDoc.exists()) {
      const currentBlocked = blockerDoc.data().blockedUsers || [];
      await updateDoc(blockerRef, {
        blockedUsers: [...currentBlocked, blockedId],
      });
    }

    console.log('🚫 User blockiert:', blockedId);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Block Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Entblockiert einen User
 */
export const unblockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const blockQuery = query(
      collection(db, 'user_blocks'),
      where('blockerId', '==', blockerId),
      where('blockedId', '==', blockedId)
    );

    const blocks = await getDocs(blockQuery);
    blocks.forEach(async (blockDoc) => {
      await deleteDoc(blockDoc.ref);
    });

    // Update User Blocked Lists
    const blockerRef = doc(db, 'users', blockerId);
    const blockerDoc = await getDoc(blockerRef);
    if (blockerDoc.exists()) {
      const currentBlocked = blockerDoc.data().blockedUsers || [];
      await updateDoc(blockerRef, {
        blockedUsers: currentBlocked.filter((id: string) => id !== blockedId),
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Prüft ob ein User blockiert ist
 */
export const isUserBlocked = async (
  userId: string,
  targetId: string
): Promise<boolean> => {
  try {
    const blockQuery = query(
      collection(db, 'user_blocks'),
      where('blockerId', '==', userId),
      where('blockedId', '==', targetId)
    );

    const blocks = await getDocs(blockQuery);
    return !blocks.empty;
  } catch {
    return false;
  }
};

/**
 * Holt Liste aller blockierten User
 */
export const getBlockedUsers = async (userId: string): Promise<string[]> => {
  try {
    const blocksQuery = query(
      collection(db, 'user_blocks'),
      where('blockerId', '==', userId)
    );

    const blocks = await getDocs(blocksQuery);
    return blocks.docs.map((doc) => doc.data().blockedId);
  } catch {
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MODERATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wendet Shadow-Ban auf User an
 */
export const applyShadowBan = async (
  userId: string,
  durationMs: number,
  reason: string
): Promise<{ success: boolean }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      shadowBannedUntil: Timestamp.fromDate(new Date(Date.now() + durationMs)),
      shadowBanReason: reason,
    });

    // Log erstellen
    await addDoc(collection(db, 'moderation_logs'), {
      action: 'shadow_ban',
      targetUserId: userId,
      reason,
      isAiDecision: reason === 'auto_moderation',
      durationMs,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Shadow ban failed:', error);
    return { success: false };
  }
};

/**
 * Prüft ob User shadow-banned ist
 */
export const isShadowBanned = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;

    const data = userDoc.data();
    if (!data.shadowBannedUntil) return false;

    const banEndTime = data.shadowBannedUntil.toDate();
    return banEndTime > new Date();
  } catch {
    return false;
  }
};

/**
 * Bannt einen User permanent
 */
export const banUserPermanently = async (
  userId: string,
  reason: string,
  adminId?: string
): Promise<{ success: boolean }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: true,
      bannedAt: serverTimestamp(),
      banReason: reason,
      bannedBy: adminId || 'ai_moderation',
    });

    // Log erstellen
    await addDoc(collection(db, 'moderation_logs'), {
      action: 'permanent_ban',
      targetUserId: userId,
      reason,
      isAiDecision: !adminId,
      adminId: adminId || null,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Permanent ban failed:', error);
    return { success: false };
  }
};

/**
 * Hebt Ban auf (Admin-Override)
 */
export const unbanUser = async (
  userId: string,
  adminId: string
): Promise<{ success: boolean }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: false,
      shadowBannedUntil: null,
      unbannedAt: serverTimestamp(),
      unbannedBy: adminId,
    });

    await addDoc(collection(db, 'moderation_logs'), {
      action: 'unban',
      targetUserId: userId,
      reason: 'Admin override',
      isAiDecision: false,
      adminId,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Holt alle pending Reports
 */
export const getPendingReports = async (
  limitCount: number = 50
): Promise<SafetyReport[]> => {
  try {
    const reportsQuery = query(
      collection(db, 'safety_reports'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as SafetyReport[];
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    return [];
  }
};

/**
 * Holt Moderation Logs
 */
export const getModerationLogs = async (
  limitCount: number = 100
): Promise<ModerationLog[]> => {
  try {
    const logsQuery = query(
      collection(db, 'moderation_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as ModerationLog[];
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    return [];
  }
};

/**
 * Realtime Listener für Moderation Logs
 */
export const subscribeToModerationLogs = (
  callback: (logs: ModerationLog[]) => void,
  limitCount: number = 50
) => {
  const logsQuery = query(
    collection(db, 'moderation_logs'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(logsQuery, (snapshot) => {
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as ModerationLog[];
    callback(logs);
  });
};

/**
 * Update Report Status
 */
export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  adminId?: string
): Promise<{ success: boolean }> => {
  try {
    const reportRef = doc(db, 'safety_reports', reportId);
    await updateDoc(reportRef, {
      status,
      resolvedAt: status === 'resolved' || status === 'dismissed' ? serverTimestamp() : null,
      resolvedBy: adminId || null,
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export default {
  createReport,
  blockUser,
  unblockUser,
  isUserBlocked,
  getBlockedUsers,
  applyShadowBan,
  isShadowBanned,
  banUserPermanently,
  unbanUser,
  getPendingReports,
  getModerationLogs,
  subscribeToModerationLogs,
  updateReportStatus,
  REPORT_REASONS,
};
