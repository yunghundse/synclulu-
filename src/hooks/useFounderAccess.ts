/**
 * Founder Access Hooks - Frontend Security Layer
 *
 * React hooks for founder/admin status and permission checks
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  FOUNDER_ID,
  POWER_LEVELS,
  UserRole,
  ProtectedAction,
  checkPowerLevel,
  isFounder,
  isAdmin,
  isModerator,
  hasPremiumAccess,
  PremiumStatus,
  checkPremiumStatus
} from '../lib/founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// CORE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface FounderAccessState {
  isFounder: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  role: UserRole;
  powerLevel: number;
  loading: boolean;
}

/**
 * Primary hook for checking founder/admin status
 */
export function useIsFounder(userId: string | null): FounderAccessState {
  const [state, setState] = useState<FounderAccessState>({
    isFounder: false,
    isAdmin: false,
    isModerator: false,
    role: 'user',
    powerLevel: POWER_LEVELS.user,
    loading: true
  });

  useEffect(() => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Quick sync check for founder
    const founderId = userId === FOUNDER_ID;

    if (founderId) {
      setState({
        isFounder: true,
        isAdmin: true,
        isModerator: true,
        role: 'founder',
        powerLevel: POWER_LEVELS.founder,
        loading: false
      });
      return;
    }

    // Subscribe to user document for role updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const role = (data.role as UserRole) || 'user';
          const powerLevel = POWER_LEVELS[role] || POWER_LEVELS.user;

          setState({
            isFounder: false,
            isAdmin: isAdmin(role),
            isModerator: isModerator(role),
            role,
            powerLevel,
            loading: false
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      },
      (error) => {
        console.error('Error fetching user role:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return state;
}

/**
 * Hook for checking if current user can perform an action on target user
 */
export function useCanPerformAction(
  actorId: string | null,
  actorRole: UserRole,
  targetUserId: string,
  targetRole: UserRole,
  action: ProtectedAction
) {
  return useMemo(() => {
    if (!actorId) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        actorPowerLevel: 0,
        targetPowerLevel: POWER_LEVELS[targetRole]
      };
    }

    return checkPowerLevel(actorId, actorRole, targetUserId, targetRole, action);
  }, [actorId, actorRole, targetUserId, targetRole, action]);
}

// ═══════════════════════════════════════════════════════════════════════════
// PREMIUM HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for checking premium status with founder ghost-premium
 */
export function usePremiumStatus(userId: string | null, role?: UserRole) {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    isFounderPremium: false,
    tier: 'none',
    expiresAt: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Founder always has premium
    if (userId === FOUNDER_ID || role === 'founder') {
      setStatus({
        isPremium: true,
        isFounderPremium: true,
        tier: 'founder',
        expiresAt: null
      });
      setLoading(false);
      return;
    }

    // Check premium status
    checkPremiumStatus(userId, role).then((result) => {
      setStatus(result);
      setLoading(false);
    });
  }, [userId, role]);

  return { ...status, loading };
}

/**
 * Simple hook for premium access check
 */
export function useHasPremium(role: UserRole, isPremiumFlag?: boolean): boolean {
  return useMemo(() => hasPremiumAccess(role, isPremiumFlag), [role, isPremiumFlag]);
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface PermissionSet {
  canDemoteAdmin: boolean;
  canPromoteToAdmin: boolean;
  canGrantPremium: boolean;
  canRevokePremium: boolean;
  canBanUser: boolean;
  canDeleteUser: boolean;
  canViewSanctuary: boolean;
  canModifySafetyScore: boolean;
  canAccessVault: boolean;
}

/**
 * Hook returning all permissions for a user
 */
export function usePermissions(role: UserRole, userId: string | null): PermissionSet {
  return useMemo(() => {
    const powerLevel = POWER_LEVELS[role] || POWER_LEVELS.user;
    const founderStatus = userId === FOUNDER_ID;

    return {
      // Founder-only actions
      canDemoteAdmin: founderStatus,
      canPromoteToAdmin: founderStatus,

      // Admin actions
      canGrantPremium: powerLevel >= POWER_LEVELS.admin,
      canRevokePremium: powerLevel >= POWER_LEVELS.admin,
      canBanUser: powerLevel >= POWER_LEVELS.moderator,
      canDeleteUser: powerLevel >= POWER_LEVELS.admin,

      // Moderator actions
      canViewSanctuary: powerLevel >= POWER_LEVELS.moderator,
      canModifySafetyScore: powerLevel >= POWER_LEVELS.moderator,

      // Admin vault access
      canAccessVault: powerLevel >= POWER_LEVELS.admin
    };
  }, [role, userId]);
}

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface UserBadgeInfo {
  badge: 'founder' | 'admin' | 'moderator' | 'premium' | 'user';
  label: string;
  color: string;
  gradient?: string;
  icon: string;
}

/**
 * Hook for getting badge info to display
 */
export function useUserBadge(role: UserRole, isPremium?: boolean): UserBadgeInfo {
  return useMemo(() => {
    switch (role) {
      case 'founder':
        return {
          badge: 'founder',
          label: 'Founder',
          color: '#FFD700',
          gradient: 'linear-gradient(135deg, #FFD700 0%, #9333EA 50%, #FFD700 100%)',
          icon: '👑'
        };
      case 'admin':
        return {
          badge: 'admin',
          label: 'Admin',
          color: '#9333EA',
          gradient: 'linear-gradient(135deg, #9333EA 0%, #6B21A8 100%)',
          icon: '⚡'
        };
      case 'moderator':
        return {
          badge: 'moderator',
          label: 'Moderator',
          color: '#3B82F6',
          gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          icon: '🛡️'
        };
      case 'premium':
        return {
          badge: 'premium',
          label: 'Premium',
          color: '#F59E0B',
          gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          icon: '✨'
        };
      default:
        if (isPremium) {
          return {
            badge: 'premium',
            label: 'Premium',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            icon: '✨'
          };
        }
        return {
          badge: 'user',
          label: 'User',
          color: '#6B7280',
          icon: '👤'
        };
    }
  }, [role, isPremium]);
}

/**
 * Hook for founder mode UI styling
 */
export function useFounderModeStyles(isFounderUser: boolean) {
  return useMemo(() => {
    if (!isFounderUser) return null;

    return {
      // Founder-specific CSS variables
      '--founder-gold': '#FFD700',
      '--founder-purple': '#9333EA',
      '--founder-gradient': 'linear-gradient(135deg, #FFD700 0%, #9333EA 50%, #6B21A8 100%)',
      '--founder-glow': '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)',
      '--founder-border': '2px solid transparent',
      '--founder-border-image': 'linear-gradient(135deg, #FFD700, #9333EA) 1',

      // Animation styles
      founderShimmer: {
        background: 'linear-gradient(135deg, #FFD700 0%, #9333EA 50%, #FFD700 100%)',
        backgroundSize: '200% 200%',
        animation: 'founderShimmer 3s ease infinite'
      }
    };
  }, [isFounderUser]);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export {
  FOUNDER_ID,
  POWER_LEVELS,
  isFounder,
  isAdmin,
  isModerator,
  checkPowerLevel
};

export type { UserRole, ProtectedAction };
