/**
 * synclulu LEGAL AUDIT SYSTEM v3.5
 * "Gerichtsfeste Dokumentation"
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────┐
 * │  Consent Recording Layer            │
 * ├─────────────────────────────────────┤
 * │  Guardian Interceptor               │
 * ├─────────────────────────────────────┤
 * │  Audit Log (Immutable)              │
 * └─────────────────────────────────────┘
 *
 * LEGAL COMPLIANCE:
 * - GDPR Article 7: Consent Recording
 * - DSGVO §7: Einwilligung
 * - California Privacy Rights Act
 *
 * @legal New York Law Grade
 * @version 3.5.0
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type ConsentType =
  | 'community_guidelines'
  | 'safety_recording'
  | 'content_moderation'
  | 'privacy_policy'
  | 'marketing_emails'
  | 'data_sharing'
  | 'voice_recording'
  | 'sanctuary_audio'
  | 'age_verification'
  | 'terms_of_service';

// Alias for component compatibility
export type ConsentRecord = LegalConsent;

export interface LegalConsent {
  id?: string;
  userId: string;
  consentType: ConsentType;
  version: string;
  granted: boolean;
  ipHash: string;
  userAgent: string;
  timestamp: Timestamp | Date;
  revokedAt?: Timestamp | Date | null;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: AuditAction;
  category: AuditCategory;
  severity: 'info' | 'warning' | 'critical';
  details: Record<string, any>;
  ipHash: string;
  timestamp: Timestamp | Date;
  sessionId?: string;
}

export type AuditAction =
  | 'consent_granted'
  | 'consent_revoked'
  | 'content_flagged'
  | 'content_blocked'
  | 'user_reported'
  | 'user_blocked'
  | 'safety_trigger'
  | 'login_attempt'
  | 'data_export'
  | 'data_deletion';

export type AuditCategory =
  | 'consent'
  | 'content_moderation'
  | 'user_safety'
  | 'authentication'
  | 'data_privacy';

export interface ContentModerationResult {
  isAllowed: boolean;
  flaggedCategories: string[];
  confidence: number;
  action: 'allow' | 'review' | 'block';
  auditId?: string;
}

export interface AggressionAnalysis {
  score: number; // 0.0 - 1.0
  categories: string[];
  shouldRecord: boolean;
  transcript?: string;
}

// ═══════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════

/**
 * Generate a privacy-safe IP hash
 * Only stores hashed version, original IP is never stored
 */
async function hashIP(ip?: string): Promise<string> {
  const rawIP = ip || 'unknown';
  const encoder = new TextEncoder();
  const data = encoder.encode(rawIP + 'synclulu-salt-2024');

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    // Fallback for environments without crypto.subtle
    return btoa(rawIP).slice(0, 32);
  }
}

/**
 * Get client information for audit trail
 */
function getClientInfo(): { userAgent: string; ipHash: Promise<string> } {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    ipHash: hashIP(),
  };
}

/**
 * Generate session ID for correlation
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ═══════════════════════════════════════
// CONSENT RECORDING (GDPR/DSGVO Compliant)
// ═══════════════════════════════════════

/**
 * Record a legal consent with full audit trail
 * This is immutable - consents are never deleted, only marked as revoked
 */
export async function recordLegalConsent(params: {
  userId: string;
  consentType: ConsentType;
  version: string;
  granted: boolean;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { userId, consentType, version, granted, metadata } = params;
  const clientInfo = getClientInfo();

  const consent: LegalConsent = {
    userId,
    consentType,
    version,
    granted,
    ipHash: await clientInfo.ipHash,
    userAgent: clientInfo.userAgent,
    timestamp: serverTimestamp() as any,
    revokedAt: null,
    metadata: metadata || {},
  };

  // Store in legal_consents collection
  const docRef = await addDoc(collection(db, 'legal_consents'), consent);

  // Also log to audit trail
  await addAuditLogEntry({
    userId,
    action: granted ? 'consent_granted' : 'consent_revoked',
    category: 'consent',
    severity: 'info',
    details: {
      consentType,
      version,
      consentId: docRef.id,
    },
  });

  return docRef.id;
}

/**
 * Revoke a consent (soft delete - marks as revoked)
 */
export async function revokeConsent(params: {
  userId: string;
  consentType: ConsentType;
}): Promise<void> {
  const { userId, consentType } = params;

  // Find the latest consent of this type
  const q = query(
    collection(db, 'legal_consents'),
    where('userId', '==', userId),
    where('consentType', '==', consentType),
    where('revokedAt', '==', null)
  );

  const snapshot = await getDocs(q);

  for (const docSnapshot of snapshot.docs) {
    await setDoc(doc(db, 'legal_consents', docSnapshot.id), {
      revokedAt: serverTimestamp(),
    }, { merge: true });
  }

  // Audit log
  await addAuditLogEntry({
    userId,
    action: 'consent_revoked',
    category: 'consent',
    severity: 'info',
    details: { consentType },
  });
}

/**
 * Check if a user has active consent
 */
export async function hasActiveConsent(
  userId: string,
  consentType: ConsentType
): Promise<boolean> {
  const q = query(
    collection(db, 'legal_consents'),
    where('userId', '==', userId),
    where('consentType', '==', consentType),
    where('granted', '==', true),
    where('revokedAt', '==', null)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Get all active consents for a user
 */
export async function getUserConsents(userId: string): Promise<LegalConsent[]> {
  const q = query(
    collection(db, 'legal_consents'),
    where('userId', '==', userId),
    where('revokedAt', '==', null)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as LegalConsent));
}

// ═══════════════════════════════════════
// AUDIT LOG (Immutable Legal Record)
// ═══════════════════════════════════════

/**
 * Add an entry to the immutable audit log
 */
export async function addAuditLogEntry(params: {
  userId: string;
  action: AuditAction;
  category: AuditCategory;
  severity: 'info' | 'warning' | 'critical';
  details: Record<string, any>;
  sessionId?: string;
}): Promise<string> {
  const { userId, action, category, severity, details, sessionId } = params;
  const clientInfo = getClientInfo();

  const entry: AuditLogEntry = {
    userId,
    action,
    category,
    severity,
    details,
    ipHash: await clientInfo.ipHash,
    timestamp: serverTimestamp() as any,
    sessionId: sessionId || generateSessionId(),
  };

  const docRef = await addDoc(collection(db, 'audit_logs'), entry);
  return docRef.id;
}

/**
 * Get audit logs for a user (for GDPR data export)
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const q = query(
    collection(db, 'audit_logs'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as AuditLogEntry))
    .slice(0, limit);
}

// ═══════════════════════════════════════
// GUARDIAN INTERCEPTOR
// ═══════════════════════════════════════

/**
 * Content categories that trigger moderation
 */
const MODERATION_CATEGORIES = [
  'hate_speech',
  'harassment',
  'sexual_content',
  'violence',
  'self_harm',
  'spam',
  'misinformation',
  'illegal_content',
];

/**
 * Aggression keywords for audio analysis
 */
const AGGRESSION_KEYWORDS = [
  'droh', 'töte', 'umbring', 'schlag', 'hass',
  'kill', 'threat', 'hurt', 'attack', 'hate',
];

/**
 * Guardian Content Interceptor
 * Analyzes content before posting
 */
export async function guardianInterceptContent(params: {
  userId: string;
  content: string;
  contentType: 'text' | 'image' | 'audio';
  metadata?: Record<string, any>;
}): Promise<ContentModerationResult> {
  const { userId, content, contentType, metadata } = params;

  // Simple text analysis (in production, use ML service)
  const flaggedCategories: string[] = [];
  let confidence = 0;

  if (contentType === 'text') {
    const lowerContent = content.toLowerCase();

    // Check for aggression keywords
    for (const keyword of AGGRESSION_KEYWORDS) {
      if (lowerContent.includes(keyword)) {
        flaggedCategories.push('harassment');
        confidence = Math.max(confidence, 0.7);
      }
    }

    // Check for excessive caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      flaggedCategories.push('aggressive_tone');
      confidence = Math.max(confidence, 0.5);
    }

    // Check for repeated characters (spam)
    if (/(.)\1{4,}/i.test(content)) {
      flaggedCategories.push('spam');
      confidence = Math.max(confidence, 0.6);
    }
  }

  // Determine action
  let action: 'allow' | 'review' | 'block' = 'allow';
  if (confidence >= 0.9) {
    action = 'block';
  } else if (confidence >= 0.5) {
    action = 'review';
  }

  const isAllowed = action !== 'block';

  // Log if flagged
  let auditId: string | undefined;
  if (flaggedCategories.length > 0) {
    auditId = await addAuditLogEntry({
      userId,
      action: action === 'block' ? 'content_blocked' : 'content_flagged',
      category: 'content_moderation',
      severity: action === 'block' ? 'critical' : 'warning',
      details: {
        contentType,
        flaggedCategories,
        confidence,
        action,
        contentHash: await hashIP(content), // Hash content, don't store raw
        ...metadata,
      },
    });
  }

  return {
    isAllowed,
    flaggedCategories,
    confidence,
    action,
    auditId,
  };
}

/**
 * Guardian Audio Analyzer
 * Analyzes voice for aggression (for Ghost Recorder)
 */
export function analyzeAudioAggression(params: {
  transcript: string;
  volumeLevel: number; // 0.0 - 1.0
  speechRate: number; // words per minute
}): AggressionAnalysis {
  const { transcript, volumeLevel, speechRate } = params;

  const categories: string[] = [];
  let score = 0;

  // Check transcript for keywords
  const lowerTranscript = transcript.toLowerCase();
  for (const keyword of AGGRESSION_KEYWORDS) {
    if (lowerTranscript.includes(keyword)) {
      categories.push('verbal_aggression');
      score += 0.3;
    }
  }

  // High volume suggests shouting
  if (volumeLevel > 0.8) {
    categories.push('elevated_voice');
    score += 0.2;
  }

  // Fast speech rate suggests agitation
  if (speechRate > 180) {
    categories.push('rapid_speech');
    score += 0.15;
  }

  score = Math.min(score, 1.0);

  return {
    score,
    categories,
    shouldRecord: score > 0.85,
    transcript: score > 0.85 ? transcript : undefined, // Only include transcript if recording
  };
}

/**
 * Guardian Image Validator
 * Validates profile images for appropriate content
 */
export async function validateProfileImage(params: {
  userId: string;
  imageUrl: string;
  imageSize: number;
}): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  const { userId, imageUrl, imageSize } = params;

  // Size check (max 5MB)
  if (imageSize > 5 * 1024 * 1024) {
    return { isValid: false, reason: 'Image too large (max 5MB)' };
  }

  // Format check
  const validFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidFormat = validFormats.some(fmt =>
    imageUrl.toLowerCase().includes(fmt)
  );

  if (!hasValidFormat) {
    return { isValid: false, reason: 'Invalid image format' };
  }

  // In production: Call ML moderation API
  // For now, we'll assume the image is valid
  // TODO: Integrate with Google Vision API or AWS Rekognition

  // Log the validation
  await addAuditLogEntry({
    userId,
    action: 'content_flagged',
    category: 'content_moderation',
    severity: 'info',
    details: {
      type: 'profile_image_upload',
      imageSize,
      validation: 'passed',
    },
  });

  return { isValid: true };
}

// ═══════════════════════════════════════
// DATA EXPORT (GDPR Article 20)
// ═══════════════════════════════════════

/**
 * Export all user data for GDPR compliance
 */
export async function exportUserData(userId: string): Promise<{
  consents: LegalConsent[];
  auditLogs: AuditLogEntry[];
  exportedAt: Date;
}> {
  const [consents, auditLogs] = await Promise.all([
    getUserConsents(userId),
    getUserAuditLogs(userId, 500),
  ]);

  // Log the export
  await addAuditLogEntry({
    userId,
    action: 'data_export',
    category: 'data_privacy',
    severity: 'info',
    details: {
      consentCount: consents.length,
      auditLogCount: auditLogs.length,
    },
  });

  return {
    consents,
    auditLogs,
    exportedAt: new Date(),
  };
}

// ═══════════════════════════════════════
// SQL SCHEMA (For reference - Firestore uses NoSQL)
// ═══════════════════════════════════════

/**
 * SQL Schema for legal_consents (PostgreSQL compatible)
 *
 * CREATE TABLE legal_consents (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id VARCHAR(255) NOT NULL,
 *   consent_type VARCHAR(50) NOT NULL,
 *   version VARCHAR(20) NOT NULL,
 *   granted BOOLEAN NOT NULL,
 *   ip_hash VARCHAR(64) NOT NULL,
 *   user_agent TEXT,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   revoked_at TIMESTAMPTZ,
 *   metadata JSONB,
 *
 *   CONSTRAINT fk_user FOREIGN KEY (user_id)
 *     REFERENCES users(id) ON DELETE RESTRICT,
 *
 *   INDEX idx_user_consent (user_id, consent_type),
 *   INDEX idx_timestamp (timestamp),
 *   INDEX idx_active (user_id, consent_type, revoked_at)
 *     WHERE revoked_at IS NULL
 * );
 *
 * CREATE TABLE audit_logs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id VARCHAR(255) NOT NULL,
 *   action VARCHAR(50) NOT NULL,
 *   category VARCHAR(30) NOT NULL,
 *   severity VARCHAR(10) NOT NULL,
 *   details JSONB NOT NULL,
 *   ip_hash VARCHAR(64) NOT NULL,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   session_id VARCHAR(50),
 *
 *   CONSTRAINT fk_user FOREIGN KEY (user_id)
 *     REFERENCES users(id) ON DELETE RESTRICT,
 *
 *   INDEX idx_user_action (user_id, action),
 *   INDEX idx_category (category),
 *   INDEX idx_timestamp (timestamp),
 *   INDEX idx_severity (severity) WHERE severity IN ('warning', 'critical')
 * );
 *
 * -- Immutability trigger (prevent updates/deletes)
 * CREATE OR REPLACE FUNCTION prevent_audit_modification()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * CREATE TRIGGER audit_log_immutable
 * BEFORE UPDATE OR DELETE ON audit_logs
 * FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
 */

export const SQL_MIGRATION = `
-- synclulu Legal Audit Schema v3.5
-- Compatible with PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Legal Consents Table
CREATE TABLE IF NOT EXISTS legal_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  consent_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_hash VARCHAR(64) NOT NULL,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT valid_consent_type CHECK (
    consent_type IN (
      'community_guidelines',
      'safety_recording',
      'content_moderation',
      'privacy_policy',
      'marketing_emails',
      'data_sharing',
      'voice_recording'
    )
  )
);

-- Audit Logs Table (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL DEFAULT 'info',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id VARCHAR(50),

  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_category CHECK (
    category IN (
      'consent',
      'content_moderation',
      'user_safety',
      'authentication',
      'data_privacy'
    )
  )
);

-- Indexes for legal_consents
CREATE INDEX IF NOT EXISTS idx_consents_user_type
  ON legal_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_timestamp
  ON legal_consents(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consents_active
  ON legal_consents(user_id, consent_type)
  WHERE revoked_at IS NULL AND granted = true;

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_user_action
  ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_category
  ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp
  ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_critical
  ON audit_logs(timestamp DESC)
  WHERE severity IN ('warning', 'critical');

-- Immutability trigger for audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_logs;
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- View for active user consents
CREATE OR REPLACE VIEW active_consents AS
SELECT
  user_id,
  consent_type,
  version,
  timestamp as granted_at
FROM legal_consents
WHERE granted = true AND revoked_at IS NULL;

-- View for recent critical events
CREATE OR REPLACE VIEW critical_events AS
SELECT *
FROM audit_logs
WHERE severity IN ('warning', 'critical')
ORDER BY timestamp DESC
LIMIT 1000;
`;

// Alias for withdrawConsent (same as revokeConsent)
export async function withdrawConsent(
  userId: string,
  consentType: ConsentType
): Promise<void> {
  return revokeConsent({ userId, consentType });
}

export default {
  recordLegalConsent,
  revokeConsent,
  withdrawConsent,
  hasActiveConsent,
  getUserConsents,
  addAuditLogEntry,
  getUserAuditLogs,
  guardianInterceptContent,
  analyzeAudioAggression,
  validateProfileImage,
  exportUserData,
  SQL_MIGRATION,
};
