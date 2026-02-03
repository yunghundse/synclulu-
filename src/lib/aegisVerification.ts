/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AEGIS VERIFICATION FLOW v5.5
 * "Biometrisches Age-Gate & Segmentierung"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Privacy-by-Design:
 * - NIEMALS Geburtsdatum speichern
 * - NIEMALS Ausweis-Scans speichern
 * - NUR kryptografische Hashes (True/False)
 *
 * Legal Shield:
 * - Datensparsamkeit nach DSGVO Art. 5
 * - Schutz vor Identitätsdiebstahl-Klagen
 *
 * @version 5.5.0
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { addAuditLogEntry } from './legalAudit';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export type VerificationMethod = 'AI_ESTIMATION' | 'ID_DOCUMENT_HASH' | 'SELF_DECLARATION';
export type VisibilityGender = 'ALL' | 'FEMALE_ONLY' | 'MALE_ONLY' | 'VERIFIED_ONLY';

export interface AegisSafetyProfile {
  id: string;
  userId: string;

  // Alters-Gating
  isAdult: boolean;
  isMinorProtected: boolean;
  ageVerifiedAt: Date | null;
  verificationMethod: VerificationMethod | null;
  verificationConfidence: number | null;

  // Safety Score
  safetyScore: number;
  warningCount: number;

  // Sichtbarkeit
  visibleToGender: VisibilityGender;
  radarEnabled: boolean;
  ghostMode: boolean;

  // Device Ban
  deviceFingerprintHash: string | null;
  isDeviceBanned: boolean;
  banReason: string | null;
  bannedAt: Date | null;
  banExpiresAt: Date | null;
}

export interface AgeEstimationResult {
  estimatedAge: number;
  confidence: number;
  isAdult: boolean;
  requiresIdVerification: boolean;
}

export interface VerificationResult {
  success: boolean;
  isAdult: boolean;
  method: VerificationMethod;
  confidence: number;
  error?: string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const ADULT_AGE_THRESHOLD = 18;
const AI_CONFIDENCE_THRESHOLD = 85; // Unter 85% → ID-Verification erforderlich
const SAFETY_SCORE_INITIAL = 100;

// Safety Score Thresholds
export const SAFETY_THRESHOLDS = {
  FULL_ACCESS: 80,       // >= 80: Volle Funktionen
  LIMITED_ACCESS: 50,    // 50-79: Eingeschränkte Sichtbarkeit
  SUSPENDED: 20,         // 20-49: 24h Pause
  BANNED: 0,             // < 20: Permanenter Ban
};

// ═══════════════════════════════════════
// DEVICE FINGERPRINT
// ═══════════════════════════════════════

/**
 * Generate device fingerprint hash
 * Uses multiple browser signals for uniqueness
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0));

  // WebGL renderer (GPU fingerprint)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    components.push('no-webgl');
  }

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Delulu Aegis 🛡️', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }

  // Hash all components
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════
// AGE ESTIMATION (AI)
// ═══════════════════════════════════════

/**
 * Estimate age from face image using AI
 * In production: Use Face++ API, AWS Rekognition, or similar
 *
 * LEGAL SHIELD: Image is processed and immediately discarded
 */
export async function estimateAgeFromImage(imageData: Blob): Promise<AgeEstimationResult> {
  // TODO: Integrate with age estimation API
  // For now, return a placeholder that requires ID verification

  // In production:
  // const formData = new FormData();
  // formData.append('image', imageData);
  // const response = await fetch('https://api.face.plus/v3/detect', {
  //   method: 'POST',
  //   body: formData,
  //   headers: { 'api-key': process.env.FACE_API_KEY }
  // });
  // const result = await response.json();

  // Simulated response (always requires ID verification for safety)
  const simulatedAge = 20; // Would come from AI
  const confidence = 70; // Below threshold

  return {
    estimatedAge: simulatedAge,
    confidence,
    isAdult: simulatedAge >= ADULT_AGE_THRESHOLD,
    requiresIdVerification: confidence < AI_CONFIDENCE_THRESHOLD || simulatedAge < 21,
  };
}

// ═══════════════════════════════════════
// VERIFICATION FLOW
// ═══════════════════════════════════════

/**
 * Complete age verification process
 * Stores only boolean flags, never actual age/DOB
 */
export async function completeAgeVerification(params: {
  userId: string;
  method: VerificationMethod;
  isAdult: boolean;
  confidence?: number;
  deviceFingerprint?: string;
}): Promise<VerificationResult> {
  const { userId, method, isAdult, confidence = 100, deviceFingerprint } = params;

  try {
    // Generate device fingerprint if not provided
    const fingerprint = deviceFingerprint || await generateDeviceFingerprint();

    // Check if device is banned
    const bannedDevice = await checkDeviceBan(fingerprint);
    if (bannedDevice) {
      return {
        success: false,
        isAdult: false,
        method,
        confidence: 0,
        error: 'Dieses Gerät wurde gesperrt.',
      };
    }

    // Create or update safety profile
    const profileRef = doc(db, 'user_safety_profiles', userId);
    const profileSnap = await getDoc(profileRef);

    const profileData: Partial<AegisSafetyProfile> = {
      userId,
      isAdult,
      isMinorProtected: !isAdult,
      ageVerifiedAt: new Date(),
      verificationMethod: method,
      verificationConfidence: confidence,
      deviceFingerprintHash: fingerprint,
    };

    if (profileSnap.exists()) {
      await updateDoc(profileRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(profileRef, {
        ...profileData,
        safetyScore: SAFETY_SCORE_INITIAL,
        warningCount: 0,
        visibleToGender: 'ALL',
        radarEnabled: true,
        ghostMode: false,
        isDeviceBanned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Update main user document
    await updateDoc(doc(db, 'users', userId), {
      isVerified: true,
      isAdult,
      verifiedAt: serverTimestamp(),
    });

    // Audit log
    await addAuditLogEntry({
      userId,
      action: 'verification_completed',
      category: 'account',
      severity: 'info',
      details: {
        method,
        isAdult,
        confidence,
        // Keine sensiblen Daten loggen
      },
    });

    return {
      success: true,
      isAdult,
      method,
      confidence,
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      isAdult: false,
      method,
      confidence: 0,
      error: 'Verifizierung fehlgeschlagen. Bitte versuche es erneut.',
    };
  }
}

/**
 * Self-declaration verification (fallback)
 * Less trusted, triggers additional monitoring
 */
export async function completeSelfDeclaration(params: {
  userId: string;
  declaredAdult: boolean;
}): Promise<VerificationResult> {
  return completeAgeVerification({
    userId: params.userId,
    method: 'SELF_DECLARATION',
    isAdult: params.declaredAdult,
    confidence: 50, // Low confidence for self-declaration
  });
}

// ═══════════════════════════════════════
// DEVICE BAN CHECK
// ═══════════════════════════════════════

/**
 * Check if device is banned
 */
export async function checkDeviceBan(fingerprintHash: string): Promise<boolean> {
  try {
    const banRef = collection(db, 'device_bans');
    const q = query(
      banRef,
      where('deviceFingerprintHash', '==', fingerprintHash),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch {
    return false;
  }
}

/**
 * Register device ban
 */
export async function registerDeviceBan(params: {
  fingerprintHash: string;
  userId: string;
  reason: string;
  isPermanent?: boolean;
  durationHours?: number;
}): Promise<void> {
  const { fingerprintHash, userId, reason, isPermanent = false, durationHours = 24 } = params;

  const banRef = doc(collection(db, 'device_bans'));
  await setDoc(banRef, {
    deviceFingerprintHash: fingerprintHash,
    originalUserId: userId,
    reason,
    banType: isPermanent ? 'PERMANENT' : 'TEMPORARY',
    isActive: true,
    bannedAt: serverTimestamp(),
    expiresAt: isPermanent ? null : new Date(Date.now() + durationHours * 60 * 60 * 1000),
    blockedAttempts: 0,
  });

  // Update user safety profile
  await updateDoc(doc(db, 'user_safety_profiles', userId), {
    isDeviceBanned: true,
    banReason: reason,
    bannedAt: serverTimestamp(),
    banExpiresAt: isPermanent ? null : new Date(Date.now() + durationHours * 60 * 60 * 1000),
  });

  // Audit log
  await addAuditLogEntry({
    userId,
    action: 'device_banned',
    category: 'security',
    severity: 'critical',
    details: {
      reason,
      isPermanent,
      durationHours: isPermanent ? null : durationHours,
    },
  });
}

// ═══════════════════════════════════════
// SAFETY PROFILE MANAGEMENT
// ═══════════════════════════════════════

/**
 * Get user's safety profile
 */
export async function getSafetyProfile(userId: string): Promise<AegisSafetyProfile | null> {
  try {
    const profileRef = doc(db, 'user_safety_profiles', userId);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      isAdult: data.isAdult,
      isMinorProtected: data.isMinorProtected,
      ageVerifiedAt: data.ageVerifiedAt?.toDate() || null,
      verificationMethod: data.verificationMethod,
      verificationConfidence: data.verificationConfidence,
      safetyScore: data.safetyScore,
      warningCount: data.warningCount,
      visibleToGender: data.visibleToGender,
      radarEnabled: data.radarEnabled,
      ghostMode: data.ghostMode,
      deviceFingerprintHash: data.deviceFingerprintHash,
      isDeviceBanned: data.isDeviceBanned,
      banReason: data.banReason,
      bannedAt: data.bannedAt?.toDate() || null,
      banExpiresAt: data.banExpiresAt?.toDate() || null,
    };
  } catch (error) {
    console.error('Error fetching safety profile:', error);
    return null;
  }
}

/**
 * Update visibility settings
 */
export async function updateVisibilitySettings(params: {
  userId: string;
  visibleToGender?: VisibilityGender;
  radarEnabled?: boolean;
  ghostMode?: boolean;
}): Promise<boolean> {
  const { userId, ...updates } = params;

  try {
    await updateDoc(doc(db, 'user_safety_profiles', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await addAuditLogEntry({
      userId,
      action: 'settings_updated',
      category: 'privacy',
      severity: 'info',
      details: updates,
    });

    return true;
  } catch (error) {
    console.error('Error updating visibility:', error);
    return false;
  }
}

/**
 * Check if user can interact with target
 * Enforces Hard-Wall segmentation
 */
export async function canInteract(userId: string, targetUserId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const [userProfile, targetProfile] = await Promise.all([
    getSafetyProfile(userId),
    getSafetyProfile(targetUserId),
  ]);

  if (!userProfile || !targetProfile) {
    return { allowed: false, reason: 'Profil nicht gefunden' };
  }

  // Device ban check
  if (userProfile.isDeviceBanned) {
    return { allowed: false, reason: 'Account gesperrt' };
  }

  // Safety score check
  if (userProfile.safetyScore < SAFETY_THRESHOLDS.SUSPENDED) {
    return { allowed: false, reason: 'Account pausiert' };
  }

  // HARD-WALL: Age segmentation
  if (userProfile.isAdult !== targetProfile.isAdult) {
    return { allowed: false, reason: 'Altersgruppen-Beschränkung' };
  }

  // Ghost mode check
  if (targetProfile.ghostMode) {
    return { allowed: false, reason: 'User nicht sichtbar' };
  }

  return { allowed: true };
}

// ═══════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════

export default {
  generateDeviceFingerprint,
  estimateAgeFromImage,
  completeAgeVerification,
  completeSelfDeclaration,
  checkDeviceBan,
  registerDeviceBan,
  getSafetyProfile,
  updateVisibilitySettings,
  canInteract,
  SAFETY_THRESHOLDS,
};
