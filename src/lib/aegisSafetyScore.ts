/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AEGIS SAFETY SCORE SYSTEM v5.5
 * "Der unsichtbare Wächter"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Verhaltensbasiertes Trust-System:
 * - Score 100: Volle Funktionen
 * - Score 80-99: Normale Nutzung
 * - Score 50-79: Eingeschränkte Sichtbarkeit
 * - Score 20-49: 24h Pause + Review
 * - Score 0-19: Permanenter Ban + Geräte-Sperre
 *
 * Legal Shield:
 * - Transparente Score-Historie (Audit-Trail)
 * - Automatisierte Moderation nach AGG-konformen Kriterien
 *
 * @version 5.5.0
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { addAuditLogEntry } from './legalAudit';
import { registerDeviceBan, getSafetyProfile, SAFETY_THRESHOLDS } from './aegisVerification';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type ScoreChangeSource =
  | 'SANCTUARY_AI'
  | 'USER_REPORT'
  | 'MANUAL_REVIEW'
  | 'AUTO_RECOVERY'
  | 'SYSTEM';

export interface ScoreChange {
  id: string;
  userId: string;
  previousScore: number;
  newScore: number;
  change: number;
  reason: string;
  source: ScoreChangeSource;
  incidentId?: string;
  createdAt: Date;
}

export interface ScoreAdjustmentResult {
  success: boolean;
  previousScore: number;
  newScore: number;
  actionTaken?: 'none' | 'warning' | 'suspended' | 'banned';
  message?: string;
}

// ═══════════════════════════════════════
// SCORE ADJUSTMENT RULES
// ═══════════════════════════════════════

const SCORE_ADJUSTMENTS = {
  // Negative adjustments
  SANCTUARY_AI_TRIGGER: -15,
  USER_REPORT_VALID: -10,
  HARASSMENT_CONFIRMED: -30,
  GROOMING_ATTEMPT: -50, // Instant severe penalty
  EXPLICIT_TO_MINOR: -100, // Instant ban
  IDENTITY_FRAUD: -40,
  SPAM: -5,

  // Positive adjustments
  DAILY_RECOVERY: 2, // Automatic daily recovery
  GOOD_BEHAVIOR_WEEK: 5,
  VERIFIED_IDENTITY: 10,
  REPORT_DISMISSED: 5, // False report against user
};

// ═══════════════════════════════════════
// SCORE MANAGEMENT
// ═══════════════════════════════════════

/**
 * Adjust user's safety score
 */
export async function adjustSafetyScore(params: {
  userId: string;
  adjustment: number;
  reason: string;
  source: ScoreChangeSource;
  incidentId?: string;
}): Promise<ScoreAdjustmentResult> {
  const { userId, adjustment, reason, source, incidentId } = params;

  try {
    const profileRef = doc(db, 'user_safety_profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return {
        success: false,
        previousScore: 0,
        newScore: 0,
        message: 'Profil nicht gefunden',
      };
    }

    const currentScore = profileSnap.data().safetyScore || 100;
    const warningCount = profileSnap.data().warningCount || 0;

    // Calculate new score (clamp to 0-100)
    const newScore = Math.max(0, Math.min(100, currentScore + adjustment));

    // Determine action based on new score
    let actionTaken: 'none' | 'warning' | 'suspended' | 'banned' = 'none';
    let banExpiry: Date | null = null;

    if (newScore < SAFETY_THRESHOLDS.BANNED) {
      actionTaken = 'banned';

      // Get device fingerprint for ban
      const fingerprint = profileSnap.data().deviceFingerprintHash;
      if (fingerprint) {
        await registerDeviceBan({
          fingerprintHash: fingerprint,
          userId,
          reason,
          isPermanent: true,
        });
      }
    } else if (newScore < SAFETY_THRESHOLDS.SUSPENDED) {
      actionTaken = 'suspended';
      banExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    } else if (adjustment < 0) {
      actionTaken = 'warning';
    }

    // Update profile
    await updateDoc(profileRef, {
      safetyScore: newScore,
      scoreLastUpdated: serverTimestamp(),
      warningCount: adjustment < 0 ? warningCount + 1 : warningCount,
      ...(actionTaken === 'suspended' && {
        suspendedUntil: Timestamp.fromDate(banExpiry!),
      }),
    });

    // Log score change
    await addDoc(collection(db, 'safety_score_history'), {
      userId,
      previousScore: currentScore,
      newScore,
      changeAmount: adjustment,
      reason,
      source,
      incidentId: incidentId || null,
      actionTaken,
      createdAt: serverTimestamp(),
    });

    // Audit log
    await addAuditLogEntry({
      userId,
      action: 'safety_score_adjusted',
      category: 'moderation',
      severity: actionTaken === 'banned' ? 'critical' : actionTaken === 'suspended' ? 'warning' : 'info',
      details: {
        previousScore: currentScore,
        newScore,
        adjustment,
        reason,
        source,
        actionTaken,
      },
    });

    return {
      success: true,
      previousScore: currentScore,
      newScore,
      actionTaken,
      message: getActionMessage(actionTaken, newScore),
    };
  } catch (error) {
    console.error('Error adjusting safety score:', error);
    return {
      success: false,
      previousScore: 0,
      newScore: 0,
      message: 'Fehler bei der Score-Anpassung',
    };
  }
}

/**
 * Get action message for user notification
 */
function getActionMessage(action: string, score: number): string {
  switch (action) {
    case 'banned':
      return 'Dein Account wurde aufgrund wiederholter Verstöße permanent gesperrt.';
    case 'suspended':
      return `Dein Account wurde für 24 Stunden pausiert. Safety Score: ${score}`;
    case 'warning':
      return `Warnung: Dein Verhalten wurde gemeldet. Neuer Safety Score: ${score}`;
    default:
      return `Safety Score aktualisiert: ${score}`;
  }
}

/**
 * Get score history for user
 */
export async function getScoreHistory(
  userId: string,
  limitCount: number = 20
): Promise<ScoreChange[]> {
  try {
    const historyRef = collection(db, 'safety_score_history');
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        previousScore: data.previousScore,
        newScore: data.newScore,
        change: data.changeAmount,
        reason: data.reason,
        source: data.source,
        incidentId: data.incidentId,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching score history:', error);
    return [];
  }
}

/**
 * Automatic daily score recovery
 * Should be called by a scheduled function
 */
export async function processDailyScoreRecovery(): Promise<number> {
  try {
    const profilesRef = collection(db, 'user_safety_profiles');
    const q = query(
      profilesRef,
      where('safetyScore', '<', 100),
      where('safetyScore', '>=', SAFETY_THRESHOLDS.BANNED)
    );

    const snapshot = await getDocs(q);
    let recoveredCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const lastUpdated = data.scoreLastUpdated?.toDate() || new Date(0);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

      // Only recover if 24h have passed since last change
      if (hoursSinceUpdate >= 24) {
        await adjustSafetyScore({
          userId: data.userId,
          adjustment: SCORE_ADJUSTMENTS.DAILY_RECOVERY,
          reason: 'Automatische tägliche Erholung',
          source: 'AUTO_RECOVERY',
        });
        recoveredCount++;
      }
    }

    return recoveredCount;
  } catch (error) {
    console.error('Error in daily recovery:', error);
    return 0;
  }
}

// ═══════════════════════════════════════
// SANCTUARY AI INTEGRATION
// ═══════════════════════════════════════

/**
 * Handle Sanctuary AI trigger
 * Called when AI detects problematic behavior
 */
export async function handleSanctuaryTrigger(params: {
  userId: string;
  targetUserId: string;
  triggerType: 'GROOMING_SIGNAL' | 'HARASSMENT' | 'THREAT' | 'EXPLICIT_CONTENT';
  confidence: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { userId, targetUserId, triggerType, confidence, details } = params;

  // Only act on high-confidence detections
  if (confidence < 0.7) return;

  let adjustment = SCORE_ADJUSTMENTS.SANCTUARY_AI_TRIGGER;

  // Severe penalties for critical violations
  if (triggerType === 'GROOMING_SIGNAL') {
    adjustment = SCORE_ADJUSTMENTS.GROOMING_ATTEMPT;
  } else if (triggerType === 'THREAT') {
    adjustment = SCORE_ADJUSTMENTS.HARASSMENT_CONFIRMED;
  }

  // Check if target is a minor
  const targetProfile = await getSafetyProfile(targetUserId);
  if (targetProfile?.isMinorProtected && triggerType === 'EXPLICIT_CONTENT') {
    adjustment = SCORE_ADJUSTMENTS.EXPLICIT_TO_MINOR; // Instant ban
  }

  await adjustSafetyScore({
    userId,
    adjustment,
    reason: `Sanctuary AI: ${triggerType} (${Math.round(confidence * 100)}% confidence)`,
    source: 'SANCTUARY_AI',
  });

  // Log critical incident
  await addAuditLogEntry({
    userId,
    action: 'sanctuary_ai_trigger',
    category: 'safety',
    severity: 'critical',
    details: {
      targetUserId,
      triggerType,
      confidence,
      adjustmentApplied: adjustment,
      ...details,
    },
  });
}

// ═══════════════════════════════════════
// PRESET ADJUSTMENTS
// ═══════════════════════════════════════

export const applyScoreAdjustment = {
  sanctuaryTrigger: (userId: string, incidentId?: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.SANCTUARY_AI_TRIGGER,
      reason: 'Sanctuary KI-Trigger',
      source: 'SANCTUARY_AI',
      incidentId,
    }),

  validReport: (userId: string, incidentId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.USER_REPORT_VALID,
      reason: 'Bestätigte Meldung',
      source: 'USER_REPORT',
      incidentId,
    }),

  harassmentConfirmed: (userId: string, incidentId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.HARASSMENT_CONFIRMED,
      reason: 'Belästigung bestätigt',
      source: 'MANUAL_REVIEW',
      incidentId,
    }),

  groomingAttempt: (userId: string, incidentId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.GROOMING_ATTEMPT,
      reason: 'Grooming-Versuch',
      source: 'MANUAL_REVIEW',
      incidentId,
    }),

  identityFraud: (userId: string, incidentId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.IDENTITY_FRAUD,
      reason: 'Identitätsbetrug',
      source: 'MANUAL_REVIEW',
      incidentId,
    }),

  spamDetected: (userId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.SPAM,
      reason: 'Spam erkannt',
      source: 'SYSTEM',
    }),

  falseFlagDismissed: (userId: string, incidentId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.REPORT_DISMISSED,
      reason: 'Falsche Meldung abgewiesen',
      source: 'MANUAL_REVIEW',
      incidentId,
    }),

  verifiedIdentity: (userId: string) =>
    adjustSafetyScore({
      userId,
      adjustment: SCORE_ADJUSTMENTS.VERIFIED_IDENTITY,
      reason: 'Identität verifiziert',
      source: 'SYSTEM',
    }),
};

export default {
  adjustSafetyScore,
  getScoreHistory,
  processDailyScoreRecovery,
  handleSanctuaryTrigger,
  applyScoreAdjustment,
  SCORE_ADJUSTMENTS,
};
