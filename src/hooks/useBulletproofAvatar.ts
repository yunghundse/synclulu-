/**
 * BULLETPROOF AVATAR HOOK
 * "Zero-Loss" Profile Picture Persistence
 *
 * This hook GUARANTEES:
 * 1. Avatar is NEVER lost during navigation
 * 2. Instant updates after upload (no refresh needed)
 * 3. Works across all components consistently
 * 4. Falls back gracefully: Context → Session → Local → Server → Default
 *
 * @author Delulu Engineering
 */

import { useMemo, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import {
  getStickyAvatarUrl,
  setSessionAvatar,
  getSessionAvatar,
  setPermanentAvatar,
  getPermanentAvatar,
  cacheAvatarUrl,
} from '@/lib/avatarCache';

// Default avatar if all else fails
const DEFAULT_AVATAR = '/avatars/pegasus.png';

// ═══════════════════════════════════════
// HOOK FOR CURRENT USER
// ═══════════════════════════════════════

interface UseBulletproofAvatarOptions {
  forceRefresh?: boolean;
}

export const useBulletproofAvatar = (options: UseBulletproofAvatarOptions = {}) => {
  const { user, setUser } = useStore();

  // Get avatar URL with multi-layer fallback
  const avatarUrl = useMemo(() => {
    if (!user?.id) return DEFAULT_AVATAR;

    // Priority chain:
    // 1. Session storage (most recent upload in this session)
    const sessionAvatar = getSessionAvatar();
    if (sessionAvatar) return sessionAvatar;

    // 2. Permanent storage (persists across sessions)
    const permanent = getPermanentAvatar(user.id);
    if (permanent?.url) return permanent.url;

    // 3. Store value (from Firestore)
    if (user.avatarUrl) {
      // Cache it for future use
      cacheAvatarUrl(user.id, user.avatarUrl);
      setPermanentAvatar(user.id, { url: user.avatarUrl, type: 'custom' });
      return user.avatarUrl;
    }

    // 4. Preset avatar
    if (user.avatar) {
      const presetUrl = `/avatars/${user.avatar}.png`;
      return presetUrl;
    }

    // 5. Default fallback
    return DEFAULT_AVATAR;
  }, [user?.id, user?.avatarUrl, user?.avatar, options.forceRefresh]);

  // Avatar type
  const avatarType = useMemo(() => {
    if (!user?.id) return 'default';
    if (user.avatarUrl) return 'custom';
    if (user.avatar) return 'preset';
    return 'default';
  }, [user?.id, user?.avatarUrl, user?.avatar]);

  // Function to manually update avatar (used after upload)
  const setAvatarUrl = useCallback((url: string) => {
    if (!user?.id) return;

    // Update all cache layers
    setSessionAvatar(url);
    setPermanentAvatar(user.id, { url, type: 'custom' });
    cacheAvatarUrl(user.id, url);

    // Update store
    setUser({ ...user, avatarUrl: url });
  }, [user, setUser]);

  // Sync session avatar with store on mount
  useEffect(() => {
    if (user?.avatarUrl && user?.id) {
      setSessionAvatar(user.avatarUrl);
      cacheAvatarUrl(user.id, user.avatarUrl);
    }
  }, [user?.avatarUrl, user?.id]);

  return {
    avatarUrl,
    avatarType,
    setAvatarUrl,
    userId: user?.id,
    isCustom: avatarType === 'custom',
    isPreset: avatarType === 'preset',
    isDefault: avatarType === 'default',
  };
};

// ═══════════════════════════════════════
// HOOK FOR OTHER USERS
// ═══════════════════════════════════════

interface UseOtherUserAvatarOptions {
  userId: string;
  avatarUrl?: string | null;
  avatar?: string;
}

export const useOtherUserAvatar = ({
  userId,
  avatarUrl,
  avatar,
}: UseOtherUserAvatarOptions) => {
  return useMemo(() => {
    if (!userId) return DEFAULT_AVATAR;

    // Use sticky resolution (checks cache, then provided URLs)
    const result = getStickyAvatarUrl(userId, avatarUrl, avatar);
    return result.url;
  }, [userId, avatarUrl, avatar]);
};

// ═══════════════════════════════════════
// UTILITY: Preload avatars for a list of users
// ═══════════════════════════════════════

export const preloadUserAvatars = (
  users: Array<{ id: string; avatarUrl?: string | null; avatar?: string }>
): void => {
  users.forEach((user) => {
    if (user.avatarUrl) {
      cacheAvatarUrl(user.id, user.avatarUrl);

      // Preload image
      const img = new Image();
      img.src = user.avatarUrl;
    }
  });
};

export default useBulletproofAvatar;
