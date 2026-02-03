/**
 * Subscription Hooks - React Integration
 *
 * Hooks for subscription status, premium features, and upgrade prompts
 * Includes Founder bypass for no-ads experience
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getAccessLevel,
  checkSubscriptionStatus,
  shouldShowUpgradePrompt,
  getDailyStarsLimit,
  getSearchRadius,
  getAudioBitrate,
  getVoiceCloudLimit,
  TIER_CONFIG,
  AccessLevel,
  SubscriptionStatus,
  UserSubscriptionData,
  TierLevel
} from '../lib/nebulaSubscription';
import { FOUNDER_ID } from '../lib/founderProtection';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SUBSCRIPTION HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface UseSubscriptionResult {
  // Status
  isLoading: boolean;
  isActive: boolean;
  isPremium: boolean;
  isFounder: boolean;
  tier: TierLevel;

  // Features
  features: AccessLevel;
  starsLimit: number;
  searchRadius: number;
  audioBitrate: number;
  voiceCloudLimit: number;

  // Subscription Details
  expiresAt: Date | null;
  daysRemaining: number | null;

  // UI Helpers
  shouldShowUpgrade: boolean;
  tierName: string;
  tierColor: string;

  // Actions
  refresh: () => Promise<void>;
}

export function useSubscription(userId: string | null): UseSubscriptionResult {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserSubscriptionData | null>(null);

  // Subscribe to user document for real-time updates
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setUserData(null);
      setStatus(null);
      return;
    }

    // Quick check for founder
    if (userId === FOUNDER_ID) {
      const founderAccess = getAccessLevel({ uid: userId, role: 'founder' });
      setStatus({
        isActive: true,
        tier: 'SOVEREIGN',
        expiresAt: new Date('2099-12-31T23:59:59Z'),
        daysRemaining: null,
        features: founderAccess
      });
      setUserData({ uid: userId, role: 'founder' });
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const user: UserSubscriptionData = {
            uid: userId,
            role: data.role,
            subscription: data.subscription,
            subscriptionEnd: data.subscriptionEnd?.toDate(),
            isPremium: data.isPremium,
            premiumUntil: data.premiumUntil?.toDate()
          };

          setUserData(user);

          const features = getAccessLevel(user);
          const expiresAt = features.subscriptionEnd;
          const daysRemaining = expiresAt
            ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          setStatus({
            isActive: features.isPremium,
            tier: features.level,
            expiresAt,
            daysRemaining: daysRemaining && daysRemaining > 36500 ? null : daysRemaining,
            features
          });
        } else {
          setUserData({ uid: userId });
          const features = getAccessLevel({ uid: userId });
          setStatus({
            isActive: false,
            tier: 'FREE',
            expiresAt: null,
            daysRemaining: null,
            features
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Subscription listener error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const newStatus = await checkSubscriptionStatus(userId);
    setStatus(newStatus);
    setIsLoading(false);
  }, [userId]);

  // Computed values
  const features = status?.features || getAccessLevel(null);
  const tier = status?.tier || 'FREE';

  return {
    isLoading,
    isActive: status?.isActive || false,
    isPremium: features.isPremium,
    isFounder: features.isFounder,
    tier,
    features,
    starsLimit: features.stars,
    searchRadius: features.radius,
    audioBitrate: features.audioBitrate,
    voiceCloudLimit: features.voiceCloudLimit,
    expiresAt: status?.expiresAt || null,
    daysRemaining: status?.daysRemaining || null,
    shouldShowUpgrade: shouldShowUpgradePrompt(userData),
    tierName: TIER_CONFIG[tier].name,
    tierColor: TIER_CONFIG[tier].color,
    refresh
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE-SPECIFIC HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for checking if a specific feature is available
 */
export function useFeatureAccess(
  userId: string | null,
  feature: 'ghost_mode' | 'invisible_mode' | 'extended_radius' | 'hd_audio' | 'admin_panel'
): { hasAccess: boolean; isLoading: boolean } {
  const { features, isLoading } = useSubscription(userId);

  const hasAccess = useMemo(() => {
    switch (feature) {
      case 'ghost_mode':
        return features.canGhostMode;
      case 'invisible_mode':
        return features.canInvisible;
      case 'extended_radius':
      case 'hd_audio':
        return features.isPremium;
      case 'admin_panel':
        return features.isFounder || features.level === 'SOVEREIGN';
      default:
        return false;
    }
  }, [features, feature]);

  return { hasAccess, isLoading };
}

/**
 * Hook for premium gate - shows upgrade or content
 */
export function usePremiumGate(userId: string | null): {
  isPremium: boolean;
  isLoading: boolean;
  showGate: boolean;
} {
  const { isPremium, isLoading, shouldShowUpgrade } = useSubscription(userId);

  return {
    isPremium,
    isLoading,
    showGate: !isPremium && shouldShowUpgrade
  };
}

/**
 * Hook for founder-only features
 */
export function useFounderAccess(userId: string | null): {
  isFounder: boolean;
  isLoading: boolean;
} {
  const { isFounder, isLoading } = useSubscription(userId);
  return { isFounder, isLoading };
}

// ═══════════════════════════════════════════════════════════════════════════
// STARS & LIMITS HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export interface StarsUsage {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  isUnlimited: boolean;
}

/**
 * Hook for tracking daily stars usage
 */
export function useStarsUsage(userId: string | null): {
  usage: StarsUsage;
  isLoading: boolean;
  canSendStar: boolean;
} {
  const { starsLimit, isFounder, isLoading } = useSubscription(userId);
  const [usedToday, setUsedToday] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Load today's usage from Firestore
    const loadUsage = async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const today = new Date().toISOString().split('T')[0];
        const usageDoc = await getDoc(doc(db, 'starUsage', `${userId}_${today}`));

        if (usageDoc.exists()) {
          setUsedToday(usageDoc.data().count || 0);
        } else {
          setUsedToday(0);
        }
      } catch (error) {
        console.error('Error loading stars usage:', error);
      }
    };

    loadUsage();
  }, [userId]);

  const isUnlimited = isFounder || starsLimit >= 999999;
  const remaining = isUnlimited ? Infinity : Math.max(0, starsLimit - usedToday);
  const percentUsed = isUnlimited ? 0 : (usedToday / starsLimit) * 100;

  return {
    usage: {
      used: usedToday,
      limit: starsLimit,
      remaining: isUnlimited ? Infinity : remaining,
      percentUsed,
      isUnlimited
    },
    isLoading,
    canSendStar: isUnlimited || remaining > 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UPGRADE PROMPT HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook for managing upgrade prompt visibility
 * Founder NEVER sees prompts
 */
export function useUpgradePrompt(userId: string | null): {
  shouldShow: boolean;
  dismiss: () => void;
  show: () => void;
  isVisible: boolean;
} {
  const { shouldShowUpgrade, isFounder } = useSubscription(userId);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Founder never sees prompts
  const shouldShow = !isFounder && shouldShowUpgrade && !isDismissed;

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    setIsVisible(false);
  }, []);

  const show = useCallback(() => {
    if (!isFounder && shouldShowUpgrade) {
      setIsVisible(true);
    }
  }, [isFounder, shouldShowUpgrade]);

  return {
    shouldShow,
    dismiss,
    show,
    isVisible
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER BADGE HOOK
// ═══════════════════════════════════════════════════════════════════════════

export interface TierBadgeInfo {
  tier: TierLevel;
  name: string;
  color: string;
  gradient?: string;
  icon: string;
  showBadge: boolean;
}

export function useTierBadge(userId: string | null): TierBadgeInfo {
  const { tier, isFounder, isPremium } = useSubscription(userId);

  return useMemo(() => {
    // Founder in Ghost Mode - show nothing publicly
    if (isFounder) {
      return {
        tier: 'SOVEREIGN',
        name: 'Sovereign',
        color: '#FFD700',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #9333EA 100%)',
        icon: '👑',
        showBadge: false  // Ghost mode - no public badge
      };
    }

    if (tier === 'PREMIUM' || isPremium) {
      return {
        tier: 'PREMIUM',
        name: 'Nebula',
        color: '#A78BFA',
        gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        icon: '✨',
        showBadge: true
      };
    }

    return {
      tier: 'FREE',
      name: 'Standard',
      color: '#6B7280',
      icon: '👤',
      showBadge: false
    };
  }, [tier, isFounder, isPremium]);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { TIER_CONFIG };
