/**
 * Founder Protection System - Immutable Security Layer
 *
 * Silicon Valley Executive Architecture
 * Hard-coded protection for founder account - system-level immunity
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// IMMUTABLE FOUNDER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Founder ID - Loaded from environment or hardcoded fallback
 * This ID is UNTOUCHABLE by the system
 */
export const FOUNDER_ID = import.meta.env.VITE_FOUNDER_ID || 'FOUNDER_ACCOUNT_ID';

/**
 * Role hierarchy - Higher number = More power
 */
export const POWER_LEVELS = {
  user: 1,
  premium: 2,
  moderator: 3,
  admin: 4,
  founder: 999  // Unmatched power level
} as const;

export type UserRole = keyof typeof POWER_LEVELS;

/**
 * Protected actions that require power level checks
 */
export type ProtectedAction =
  | 'DELETE_USER'
  | 'BAN_USER'
  | 'UPDATE_ROLE'
  | 'DEMOTE_ADMIN'
  | 'REVOKE_PREMIUM'
  | 'ACCESS_VAULT'
  | 'MODIFY_SAFETY_SCORE'
  | 'VIEW_SANCTUARY_DATA';

// ═══════════════════════════════════════════════════════════════════════════
// POWER LEVEL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

export interface PowerCheckResult {
  allowed: boolean;
  reason: string;
  actorPowerLevel: number;
  targetPowerLevel: number;
}

/**
 * Core security middleware - Checks if an action is permitted
 *
 * RULE: Founder is UNTOUCHABLE - No action can target the founder
 * RULE: Higher power levels can act on lower levels only
 */
export function checkPowerLevel(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  targetRole: UserRole,
  action: ProtectedAction
): PowerCheckResult {
  const actorPower = POWER_LEVELS[actorRole] || POWER_LEVELS.user;
  const targetPower = POWER_LEVELS[targetRole] || POWER_LEVELS.user;

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║ FOUNDER IMMUNITY - ABSOLUTE PROTECTION                               ║
  // ║ If target is Founder, BLOCK ALL destructive actions immediately      ║
  // ╚═══════════════════════════════════════════════════════════════════════╝
  if (targetUserId === FOUNDER_ID) {
    return {
      allowed: false,
      reason: 'FOUNDER_IMMUNITY: This account is protected by system-level security. No actions permitted.',
      actorPowerLevel: actorPower,
      targetPowerLevel: POWER_LEVELS.founder
    };
  }

  // Self-protection: Users cannot demote/delete themselves
  if (actorId === targetUserId && ['DELETE_USER', 'BAN_USER', 'DEMOTE_ADMIN'].includes(action)) {
    return {
      allowed: false,
      reason: 'SELF_PROTECTION: Cannot perform destructive actions on your own account.',
      actorPowerLevel: actorPower,
      targetPowerLevel: targetPower
    };
  }

  // Power hierarchy check
  if (actorPower <= targetPower) {
    return {
      allowed: false,
      reason: `INSUFFICIENT_POWER: Your power level (${actorPower}) must exceed target (${targetPower}).`,
      actorPowerLevel: actorPower,
      targetPowerLevel: targetPower
    };
  }

  // Action-specific requirements
  const actionRequirements: Record<ProtectedAction, number> = {
    DELETE_USER: POWER_LEVELS.admin,
    BAN_USER: POWER_LEVELS.moderator,
    UPDATE_ROLE: POWER_LEVELS.admin,
    DEMOTE_ADMIN: POWER_LEVELS.founder,  // Only founder can demote admins
    REVOKE_PREMIUM: POWER_LEVELS.admin,
    ACCESS_VAULT: POWER_LEVELS.admin,
    MODIFY_SAFETY_SCORE: POWER_LEVELS.moderator,
    VIEW_SANCTUARY_DATA: POWER_LEVELS.moderator
  };

  const requiredPower = actionRequirements[action];
  if (actorPower < requiredPower) {
    return {
      allowed: false,
      reason: `ACTION_RESTRICTED: ${action} requires power level ${requiredPower}. You have ${actorPower}.`,
      actorPowerLevel: actorPower,
      targetPowerLevel: targetPower
    };
  }

  // All checks passed
  return {
    allowed: true,
    reason: 'ACTION_PERMITTED',
    actorPowerLevel: actorPower,
    targetPowerLevel: targetPower
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER STATUS CHECKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a user is the founder
 */
export function isFounder(userId: string): boolean {
  return userId === FOUNDER_ID;
}

/**
 * Check if a user has admin privileges (admin or founder)
 */
export function isAdmin(role: UserRole): boolean {
  return POWER_LEVELS[role] >= POWER_LEVELS.admin;
}

/**
 * Check if a user has moderator privileges (moderator, admin, or founder)
 */
export function isModerator(role: UserRole): boolean {
  return POWER_LEVELS[role] >= POWER_LEVELS.moderator;
}

/**
 * Get the power level for a role
 */
export function getPowerLevel(role: UserRole): number {
  return POWER_LEVELS[role] || POWER_LEVELS.user;
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM STATUS - FOUNDER GHOST PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

export interface PremiumStatus {
  isPremium: boolean;
  isFounderPremium: boolean;
  tier: 'none' | 'premium' | 'founder';
  expiresAt: Date | null;
}

/**
 * Check premium status with founder auto-grant
 * Founder ALWAYS has premium, but shows Founder badge instead
 */
export async function checkPremiumStatus(userId: string, role?: UserRole): Promise<PremiumStatus> {
  // Founder Ghost Premium - Always true, special tier
  if (userId === FOUNDER_ID || role === 'founder') {
    return {
      isPremium: true,
      isFounderPremium: true,
      tier: 'founder',
      expiresAt: null  // Never expires
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { isPremium: false, isFounderPremium: false, tier: 'none', expiresAt: null };
    }

    const data = userDoc.data();
    const premiumUntil = data.premiumUntil?.toDate?.() || null;
    const isPremium = data.isPremium === true ||
                      (premiumUntil && premiumUntil > new Date());

    return {
      isPremium,
      isFounderPremium: false,
      tier: isPremium ? 'premium' : 'none',
      expiresAt: premiumUntil
    };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, isFounderPremium: false, tier: 'none', expiresAt: null };
  }
}

/**
 * Synchronous premium check for UI (uses cached role)
 */
export function hasPremiumAccess(role: UserRole, isPremiumFlag?: boolean): boolean {
  // Founder always has premium access
  if (role === 'founder') return true;
  // Premium users
  if (role === 'premium') return true;
  // Admins get premium perks
  if (POWER_LEVELS[role] >= POWER_LEVELS.admin) return true;
  // Check explicit premium flag
  return isPremiumFlag === true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT - THE PURGE
// ═══════════════════════════════════════════════════════════════════════════

export interface DemoteResult {
  success: boolean;
  error?: string;
  previousRole?: UserRole;
  newRole?: UserRole;
}

/**
 * Demote an admin back to user
 * ONLY the Founder can execute this action
 */
export async function demoteAdmin(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  targetRole: UserRole
): Promise<DemoteResult> {
  // Power check
  const powerCheck = checkPowerLevel(actorId, actorRole, targetUserId, targetRole, 'DEMOTE_ADMIN');

  if (!powerCheck.allowed) {
    return {
      success: false,
      error: powerCheck.reason
    };
  }

  try {
    // Update user role to 'user'
    await updateDoc(doc(db, 'users', targetUserId), {
      role: 'user',
      demotedAt: serverTimestamp(),
      demotedBy: actorId,
      previousRole: targetRole
    });

    // Log the action
    await logAdminAction(actorId, 'DEMOTE_ADMIN', targetUserId, {
      previousRole: targetRole,
      newRole: 'user'
    });

    return {
      success: true,
      previousRole: targetRole,
      newRole: 'user'
    };
  } catch (error) {
    console.error('Error demoting admin:', error);
    return {
      success: false,
      error: 'Database error during demotion'
    };
  }
}

/**
 * Promote a user to admin
 * ONLY the Founder can execute this action
 */
export async function promoteToAdmin(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string
): Promise<DemoteResult> {
  // Only founder can promote to admin
  if (actorRole !== 'founder') {
    return {
      success: false,
      error: 'INSUFFICIENT_POWER: Only the Founder can promote users to Admin.'
    };
  }

  // Cannot promote founder (already highest)
  if (targetUserId === FOUNDER_ID) {
    return {
      success: false,
      error: 'FOUNDER_IMMUNITY: Cannot modify Founder account.'
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    const currentRole = userDoc.data()?.role || 'user';

    await updateDoc(doc(db, 'users', targetUserId), {
      role: 'admin',
      promotedAt: serverTimestamp(),
      promotedBy: actorId,
      previousRole: currentRole
    });

    await logAdminAction(actorId, 'PROMOTE_ADMIN', targetUserId, {
      previousRole: currentRole,
      newRole: 'admin'
    });

    return {
      success: true,
      previousRole: currentRole as UserRole,
      newRole: 'admin'
    };
  } catch (error) {
    console.error('Error promoting to admin:', error);
    return {
      success: false,
      error: 'Database error during promotion'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NEBULA GRANT - PREMIUM DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

export interface NebulaGrantResult {
  success: boolean;
  error?: string;
  userId?: string;
  grantedUntil?: Date;
}

/**
 * Grant premium status to a user (Nebula Grant)
 * Admin/Founder only
 */
export async function grantNebulaPremium(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  durationDays: number = 30
): Promise<NebulaGrantResult> {
  // Check permission (admin or higher)
  if (POWER_LEVELS[actorRole] < POWER_LEVELS.admin) {
    return {
      success: false,
      error: 'INSUFFICIENT_POWER: Admin privileges required for Nebula Grant.'
    };
  }

  // Cannot grant to founder (already has ghost premium)
  if (targetUserId === FOUNDER_ID) {
    return {
      success: false,
      error: 'FOUNDER_IMMUNITY: Founder already has perpetual premium status.'
    };
  }

  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);

    await updateDoc(doc(db, 'users', targetUserId), {
      isPremium: true,
      premiumUntil: expirationDate,
      nebulaGrantedBy: actorId,
      nebulaGrantedAt: serverTimestamp()
    });

    // Send silent notification
    await sendNebulaNotification(targetUserId);

    await logAdminAction(actorId, 'NEBULA_GRANT', targetUserId, {
      durationDays,
      expiresAt: expirationDate.toISOString()
    });

    return {
      success: true,
      userId: targetUserId,
      grantedUntil: expirationDate
    };
  } catch (error) {
    console.error('Error granting Nebula premium:', error);
    return {
      success: false,
      error: 'Database error during Nebula Grant'
    };
  }
}

/**
 * Revoke premium status from a user
 */
export async function revokeNebulaPremium(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string
): Promise<NebulaGrantResult> {
  const powerCheck = checkPowerLevel(actorId, actorRole, targetUserId, 'premium', 'REVOKE_PREMIUM');

  if (!powerCheck.allowed) {
    return {
      success: false,
      error: powerCheck.reason
    };
  }

  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      isPremium: false,
      premiumUntil: null,
      premiumRevokedBy: actorId,
      premiumRevokedAt: serverTimestamp()
    });

    await logAdminAction(actorId, 'REVOKE_PREMIUM', targetUserId, {});

    return {
      success: true,
      userId: targetUserId
    };
  } catch (error) {
    console.error('Error revoking premium:', error);
    return {
      success: false,
      error: 'Database error during revocation'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send the Nebula notification to user
 */
async function sendNebulaNotification(userId: string): Promise<void> {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'nebula_grant',
      title: '✨ Willkommen im Nebula-Status',
      message: 'Das Universum hat dich erwählt. Willkommen im Nebula-Status. ✨',
      read: false,
      createdAt: serverTimestamp(),
      silent: true  // No push notification, just in-app
    });
  } catch (error) {
    console.error('Error sending Nebula notification:', error);
  }
}

/**
 * Log admin actions for audit trail
 */
async function logAdminAction(
  actorId: string,
  action: string,
  targetUserId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'admin_audit_log'), {
      actorId,
      action,
      targetUserId,
      metadata,
      timestamp: serverTimestamp(),
      ip: 'REDACTED'  // Privacy by design
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  logAdminAction
};
