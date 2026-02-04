/**
 * synclulu AVATAR HOOK
 * Provides consistent avatar handling across the app
 * - Automatic caching
 * - Optimistic updates
 * - No flickering
 */

import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  getBestAvatarUrl,
  cacheAvatarUrl,
  setSessionAvatar,
  cacheAvatarWithBlob,
  setPermanentAvatar,
  getStickyAvatarUrl,
} from '@/lib/avatarCache';

interface UseAvatarReturn {
  avatarUrl: string | null;
  isLoading: boolean;
  error: string | null;
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  updateAvatarUrl: (url: string) => void;
}

/**
 * Hook for managing user avatars with caching
 */
export const useAvatar = (userId?: string): UseAvatarReturn => {
  const { user, setUser } = useStore();
  const targetUserId = userId || user?.id;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!targetUserId) return null;
    // Initialize from STICKY cache immediately (never flickers)
    const sticky = getStickyAvatarUrl(
      targetUserId,
      user?.avatarUrl || (user as any)?.photoURL,
      user?.avatar
    );
    return sticky.url;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with store when user changes
  useEffect(() => {
    if (!targetUserId) return;

    const storeUrl = user?.avatarUrl || (user as any)?.photoURL;
    const bestUrl = getBestAvatarUrl(targetUserId, storeUrl);

    if (bestUrl && bestUrl !== avatarUrl) {
      setAvatarUrl(bestUrl);
    }
  }, [targetUserId, user?.avatarUrl, (user as any)?.photoURL]);

  /**
   * Update avatar URL (for immediate UI updates)
   */
  const updateAvatarUrl = useCallback((url: string) => {
    if (!targetUserId) return;

    // Update local state immediately
    setAvatarUrl(url);

    // Cache it
    cacheAvatarUrl(targetUserId, url);

    // If it's the current user, also set session
    if (targetUserId === user?.id) {
      setSessionAvatar(url);

      // Update store
      if (user) {
        setUser({ ...user, avatarUrl: url });
      }
    }
  }, [targetUserId, user, setUser]);

  /**
   * Upload a new avatar
   */
  const uploadAvatar = useCallback(async (file: File): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> => {
    if (!targetUserId) {
      return { success: false, error: 'Nicht eingeloggt' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Nur Bilder erlaubt');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Bild darf maximal 5MB groß sein');
      }

      // Create optimistic preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);

      // Upload to Firebase Storage
      const filename = `avatars/${targetUserId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        avatarUrl: downloadUrl,
      });

      // Update ALL caches (multi-layer persistence)
      cacheAvatarUrl(targetUserId, downloadUrl);
      setSessionAvatar(downloadUrl);
      setAvatarUrl(downloadUrl);

      // PERMANENT STORAGE - never expires
      setPermanentAvatar(targetUserId, { url: downloadUrl, type: 'custom' });

      // Update store if it's the current user
      if (targetUserId === user?.id && user) {
        setUser({ ...user, avatarUrl: downloadUrl });
      }

      // Cache blob in background for offline access
      cacheAvatarWithBlob(targetUserId, downloadUrl).catch(() => {
        // Ignore blob caching errors
      });

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 5, 15]);
      }

      return { success: true, url: downloadUrl };
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      const errorMessage = err.message || 'Upload fehlgeschlagen';
      setError(errorMessage);

      // Revert to previous avatar
      const cachedUrl = getBestAvatarUrl(targetUserId, user?.avatarUrl);
      setAvatarUrl(cachedUrl);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, user, setUser]);

  return {
    avatarUrl,
    isLoading,
    error,
    uploadAvatar,
    updateAvatarUrl,
  };
};

/**
 * Simple hook for displaying any user's avatar
 */
export const useAvatarDisplay = (userId: string, fallbackUrl?: string): string | null => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return getBestAvatarUrl(userId, fallbackUrl);
  });

  useEffect(() => {
    const url = getBestAvatarUrl(userId, fallbackUrl);
    if (url !== avatarUrl) {
      setAvatarUrl(url);
    }

    // Cache new URL if provided
    if (fallbackUrl) {
      cacheAvatarUrl(userId, fallbackUrl);
    }
  }, [userId, fallbackUrl]);

  return avatarUrl;
};

export default useAvatar;
