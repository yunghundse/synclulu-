/**
 * aiModeration.ts
 * 🤖 AI MODERATION NEXUS - Autonomous Safety Engine
 *
 * KI-gesteuerte Moderation die:
 * - Reports automatisch analysiert
 * - Severity Score berechnet
 * - Autonome Maßnahmen ergreift
 * - Alle Entscheidungen protokolliert
 *
 * @version 1.0.0
 */

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ReportReason, ModerationAction, SafetyReport } from './safetySystem';
import { REPORT_REASONS, applyShadowBan, banUserPermanently } from './safetySystem';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIDecision {
  severityScore: number; // 0-10
  action: ModerationAction;
  reasoning: string;
  confidence: number; // 0-100
}

export interface ModerationHistory {
  id: string;
  reportId: string;
  targetUserId: string;
  decision: AIDecision;
  wasOverridden: boolean;
  overriddenBy?: string;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Berechnet den Severity Score basierend auf:
 * - Report Reason Severity
 * - Anzahl vorheriger Reports
 * - User History
 */
const calculateSeverityScore = async (
  reason: ReportReason,
  reportedUserId: string,
  description?: string
): Promise<{ score: number; factors: string[] }> => {
  const factors: string[] = [];

  // Base severity from reason
  let score = REPORT_REASONS[reason]?.severity || 5;
  factors.push(`Grundschwere: ${score}/10`);

  // Check previous reports
  try {
    const previousReports = await getDocs(
      query(
        collection(db, 'safety_reports'),
        where('reportedUserId', '==', reportedUserId)
      )
    );

    const reportCount = previousReports.size;
    if (reportCount > 0) {
      const multiplier = Math.min(1.5, 1 + reportCount * 0.1);
      score = Math.min(10, score * multiplier);
      factors.push(`Vorherige Meldungen: ${reportCount} (+${Math.round((multiplier - 1) * 100)}%)`);
    }

    // Check for repeat offenses with same reason
    const sameReasonReports = previousReports.docs.filter(
      (doc) => doc.data().reason === reason
    ).length;

    if (sameReasonReports > 0) {
      score = Math.min(10, score + sameReasonReports);
      factors.push(`Wiederholungstäter: +${sameReasonReports} Punkte`);
    }
  } catch (error) {
    console.error('Error checking previous reports:', error);
  }

  // Check for keywords in description
  if (description) {
    const severeKeywords = ['tod', 'umbringen', 'gewalt', 'vergewalt', 'nazi', 'terror'];
    const foundKeywords = severeKeywords.filter((kw) =>
      description.toLowerCase().includes(kw)
    );

    if (foundKeywords.length > 0) {
      score = Math.min(10, score + 2);
      factors.push(`Kritische Begriffe erkannt: +2 Punkte`);
    }
  }

  return { score: Math.round(score * 10) / 10, factors };
};

/**
 * Bestimmt die Aktion basierend auf Severity Score
 */
const determineAction = (severityScore: number): ModerationAction => {
  if (severityScore >= 9) return 'permanent_ban';
  if (severityScore >= 7) return 'temp_ban';
  if (severityScore >= 5) return 'shadow_ban';
  if (severityScore >= 3) return 'mute';
  return 'warning';
};

/**
 * Generiert Reasoning Text
 */
const generateReasoning = (
  action: ModerationAction,
  factors: string[]
): string => {
  const actionTexts: Record<ModerationAction, string> = {
    warning: 'Verwarnung ausgesprochen aufgrund geringer Schwere.',
    mute: 'Temporäre Stummschaltung aktiviert.',
    shadow_ban: 'Shadow-Ban für 12 Stunden aktiviert - Nutzer unsichtbar für andere.',
    temp_ban: 'Temporärer Ban für 24 Stunden verhängt.',
    permanent_ban: 'Permanenter Ausschluss aus dem Netzwerk aufgrund schwerer Verstöße.',
  };

  return `${actionTexts[action]} Faktoren: ${factors.join(', ')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hauptfunktion: Prozessiert einen Report autonom
 */
export const processReportAutonomously = async (
  reportId: string
): Promise<{ success: boolean; decision?: AIDecision; error?: string }> => {
  try {
    // 1. Report laden
    const reportDoc = await getDoc(doc(db, 'safety_reports', reportId));
    if (!reportDoc.exists()) {
      return { success: false, error: 'Report nicht gefunden' };
    }

    const report = reportDoc.data() as SafetyReport;

    // 2. Severity berechnen
    const { score: severityScore, factors } = await calculateSeverityScore(
      report.reason,
      report.reportedUserId,
      report.description
    );

    // 3. Aktion bestimmen
    const action = determineAction(severityScore);

    // 4. Reasoning generieren
    const reasoning = generateReasoning(action, factors);

    // 5. Decision erstellen
    const decision: AIDecision = {
      severityScore,
      action,
      reasoning,
      confidence: Math.min(95, 70 + severityScore * 2.5), // 70-95%
    };

    // 6. Aktion ausführen
    await executeModeration(report.reportedUserId, action, reasoning);

    // 7. Report aktualisieren
    await updateDoc(doc(db, 'safety_reports', reportId), {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
      aiDecision: decision,
    });

    // 8. In History speichern
    await addDoc(collection(db, 'ai_moderation_history'), {
      reportId,
      targetUserId: report.reportedUserId,
      decision,
      wasOverridden: false,
      createdAt: serverTimestamp(),
    });

    // 9. Reporter benachrichtigen
    await notifyReporter(report.reporterId, action);

    console.log(`🤖 AI Moderation: ${action} für User ${report.reportedUserId}`);
    return { success: true, decision };
  } catch (error: any) {
    console.error('AI Moderation Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Führt die Moderationsmaßnahme aus
 */
const executeModeration = async (
  userId: string,
  action: ModerationAction,
  reason: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  switch (action) {
    case 'warning':
      // Nur Warnung speichern
      await addDoc(collection(db, 'user_warnings'), {
        userId,
        reason,
        createdAt: serverTimestamp(),
      });
      break;

    case 'mute':
      // 1 Stunde Mute
      await updateDoc(userRef, {
        mutedUntil: new Date(Date.now() + 60 * 60 * 1000),
        muteReason: reason,
      });
      break;

    case 'shadow_ban':
      // 12 Stunden Shadow-Ban
      await applyShadowBan(userId, 12 * 60 * 60 * 1000, reason);
      break;

    case 'temp_ban':
      // 24 Stunden Ban
      await updateDoc(userRef, {
        tempBannedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        tempBanReason: reason,
      });
      break;

    case 'permanent_ban':
      await banUserPermanently(userId, reason);
      break;
  }

  // Moderation Log erstellen
  await addDoc(collection(db, 'moderation_logs'), {
    action,
    targetUserId: userId,
    reason,
    isAiDecision: true,
    createdAt: serverTimestamp(),
  });
};

/**
 * Benachrichtigt den Reporter über das Ergebnis
 */
const notifyReporter = async (
  reporterId: string,
  action: ModerationAction
): Promise<void> => {
  const messages: Record<ModerationAction, string> = {
    warning: 'Der gemeldete Nutzer wurde verwarnt.',
    mute: 'Der gemeldete Nutzer wurde temporär stummgeschaltet.',
    shadow_ban: 'Deine Aura-Sicherheit wurde gewahrt. Maßnahmen wurden ergriffen.',
    temp_ban: 'Der gemeldete Nutzer wurde temporär gesperrt.',
    permanent_ban: 'Der gemeldete Nutzer wurde dauerhaft aus dem Netzwerk entfernt.',
  };

  await addDoc(collection(db, 'notifications'), {
    userId: reporterId,
    type: 'safety_update',
    title: 'Sicherheitsupdate',
    message: messages[action],
    read: false,
    createdAt: serverTimestamp(),
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN OVERRIDE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Admin Override für AI Entscheidung
 */
export const overrideAIDecision = async (
  historyId: string,
  adminId: string,
  newAction: ModerationAction | 'dismiss'
): Promise<{ success: boolean }> => {
  try {
    const historyDoc = await getDoc(doc(db, 'ai_moderation_history', historyId));
    if (!historyDoc.exists()) {
      return { success: false };
    }

    const history = historyDoc.data() as ModerationHistory;

    // Mark as overridden
    await updateDoc(doc(db, 'ai_moderation_history', historyId), {
      wasOverridden: true,
      overriddenBy: adminId,
      overrideAction: newAction,
      overrideAt: serverTimestamp(),
    });

    // Revert previous action if dismissing
    if (newAction === 'dismiss') {
      const userRef = doc(db, 'users', history.targetUserId);
      await updateDoc(userRef, {
        isBanned: false,
        shadowBannedUntil: null,
        tempBannedUntil: null,
        mutedUntil: null,
      });
    } else {
      // Apply new action
      await executeModeration(history.targetUserId, newAction, `Admin Override by ${adminId}`);
    }

    // Log override
    await addDoc(collection(db, 'moderation_logs'), {
      action: 'admin_override',
      targetUserId: history.targetUserId,
      reason: `AI Decision overridden: ${history.decision.action} → ${newAction}`,
      isAiDecision: false,
      adminId,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Override Error:', error);
    return { success: false };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Holt AI Moderation Statistiken
 */
export const getAIModerationStats = async (): Promise<{
  totalDecisions: number;
  todayDecisions: number;
  overrideRate: number;
  actionBreakdown: Record<ModerationAction, number>;
}> => {
  try {
    const allHistory = await getDocs(collection(db, 'ai_moderation_history'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let overrideCount = 0;
    const actionBreakdown: Record<ModerationAction, number> = {
      warning: 0,
      mute: 0,
      shadow_ban: 0,
      temp_ban: 0,
      permanent_ban: 0,
    };

    allHistory.forEach((doc) => {
      const data = doc.data();

      // Count today
      if (data.createdAt?.toDate() >= today) {
        todayCount++;
      }

      // Count overrides
      if (data.wasOverridden) {
        overrideCount++;
      }

      // Count actions
      if (data.decision?.action) {
        actionBreakdown[data.decision.action as ModerationAction]++;
      }
    });

    return {
      totalDecisions: allHistory.size,
      todayDecisions: todayCount,
      overrideRate: allHistory.size > 0 ? (overrideCount / allHistory.size) * 100 : 0,
      actionBreakdown,
    };
  } catch (error) {
    console.error('Stats Error:', error);
    return {
      totalDecisions: 0,
      todayDecisions: 0,
      overrideRate: 0,
      actionBreakdown: {
        warning: 0,
        mute: 0,
        shadow_ban: 0,
        temp_ban: 0,
        permanent_ban: 0,
      },
    };
  }
};

export default {
  processReportAutonomously,
  overrideAIDecision,
  getAIModerationStats,
};
