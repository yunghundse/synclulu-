/**
 * DELULU AVATAR SERVICE - PERMANENT IDENTITY SYSTEM
 * =================================================
 * Enterprise-grade profile picture persistence with:
 * - Firebase Storage integration
 * - Local caching for instant display
 * - Graceful fallback chain
 * - Image optimization
 *
 * PRINCIPLE: Once set, avatar is "sticky" - stays identical
 * until user actively changes it.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from './firebase';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface AvatarState {
  type: 'preset' | 'custom';
  presetId?: string;       // For predefined avatars
  customUrl?: string;      // For uploaded photos
  thumbnailUrl?: string;   // Optimized thumbnail
  lastUpdated: Date;
}

export interface UploadProgress {
  state: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

// ═══════════════════════════════════════
// LOCAL CACHE (IndexedDB + localStorage)
// ═══════════════════════════════════════

const CACHE_KEY = 'delulu_avatar_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Save avatar to local cache for instant display
 */
export const cacheAvatar = (userId: string, avatarState: AvatarState): void => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[userId] = {
      ...avatarState,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    // Also cache the image blob for offline access
    if (avatarState.customUrl) {
      cacheImageBlob(avatarState.customUrl, `avatar_${userId}`);
    }
  } catch (error) {
    console.warn('Failed to cache avatar:', error);
  }
};

/**
 * Get avatar from local cache
 */
export const getCachedAvatar = (userId: string): AvatarState | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[userId];

    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.cachedAt > CACHE_EXPIRY) {
      // Cache expired, but still return it as fallback
      console.log('Avatar cache expired, using as fallback');
    }

    return {
      type: cached.type,
      presetId: cached.presetId,
      customUrl: cached.customUrl,
      thumbnailUrl: cached.thumbnailUrl,
      lastUpdated: new Date(cached.lastUpdated),
    };
  } catch (error) {
    console.warn('Failed to get cached avatar:', error);
    return null;
  }
};

/**
 * Cache image blob for offline access
 */
const cacheImageBlob = async (url: string, key: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        localStorage.setItem(`${CACHE_KEY}_blob_${key}`, reader.result as string);
      } catch (e) {
        // localStorage might be full, ignore
      }
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    // Ignore cache errors
  }
};

/**
 * Get cached image blob
 */
export const getCachedImageBlob = (userId: string): string | null => {
  try {
    return localStorage.getItem(`${CACHE_KEY}_blob_avatar_${userId}`);
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════
// IMAGE OPTIMIZATION
// ═══════════════════════════════════════

/**
 * Compress and resize image for upload
 */
export const optimizeImage = (
  file: File,
  maxSize: number = 800,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw with smooth scaling
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      ctx!.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Create thumbnail for fast loading
 */
export const createThumbnail = (
  file: File,
  size: number = 150
): Promise<Blob> => {
  return optimizeImage(file, size, 0.7);
};

// ═══════════════════════════════════════
// FIREBASE STORAGE OPERATIONS
// ═══════════════════════════════════════

/**
 * Upload profile picture to Firebase Storage
 * Returns permanent URL that never changes
 */
export const uploadProfilePicture = async (
  userId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{
  success: boolean;
  avatarUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}> => {
  try {
    onProgress?.({ state: 'uploading', progress: 0 });

    // Optimize main image
    const optimizedBlob = await optimizeImage(file, 800, 0.85);
    onProgress?.({ state: 'uploading', progress: 30 });

    // Create thumbnail
    const thumbnailBlob = await createThumbnail(file, 150);
    onProgress?.({ state: 'uploading', progress: 40 });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const mainPath = `avatars/${userId}/profile_${timestamp}.jpg`;
    const thumbPath = `avatars/${userId}/thumb_${timestamp}.jpg`;

    // Upload main image
    const mainRef = ref(storage, mainPath);
    await uploadBytes(mainRef, optimizedBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        type: 'profile',
      },
    });
    onProgress?.({ state: 'uploading', progress: 70 });

    // Upload thumbnail
    const thumbRef = ref(storage, thumbPath);
    await uploadBytes(thumbRef, thumbnailBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        type: 'thumbnail',
      },
    });
    onProgress?.({ state: 'processing', progress: 85 });

    // Get download URLs
    const avatarUrl = await getDownloadURL(mainRef);
    const thumbnailUrl = await getDownloadURL(thumbRef);

    // Update Firestore user document
    await updateDoc(doc(db, 'users', userId), {
      avatarUrl,
      avatarThumbnailUrl: thumbnailUrl,
      avatarType: 'custom',
      avatarUpdatedAt: new Date(),
    });

    // Cache locally
    const avatarState: AvatarState = {
      type: 'custom',
      customUrl: avatarUrl,
      thumbnailUrl,
      lastUpdated: new Date(),
    };
    cacheAvatar(userId, avatarState);

    onProgress?.({ state: 'complete', progress: 100 });

    return {
      success: true,
      avatarUrl,
      thumbnailUrl,
    };
  } catch (error: any) {
    console.error('Failed to upload profile picture:', error);
    onProgress?.({
      state: 'error',
      progress: 0,
      error: error.message || 'Upload fehlgeschlagen',
    });

    return {
      success: false,
      error: error.message || 'Upload fehlgeschlagen',
    };
  }
};

/**
 * Delete old profile picture from storage
 */
export const deleteProfilePicture = async (
  userId: string,
  url: string
): Promise<boolean> => {
  try {
    // Extract path from URL
    const path = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] || '');
    if (!path || !path.startsWith(`avatars/${userId}/`)) {
      return false;
    }

    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.warn('Failed to delete old avatar:', error);
    return false;
  }
};

/**
 * Set predefined avatar (no upload needed)
 */
export const setPresetAvatar = async (
  userId: string,
  presetId: string
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      avatar: presetId,
      avatarType: 'preset',
      avatarUrl: null, // Clear custom URL
      avatarThumbnailUrl: null,
      avatarUpdatedAt: new Date(),
    });

    // Cache locally
    const avatarState: AvatarState = {
      type: 'preset',
      presetId,
      lastUpdated: new Date(),
    };
    cacheAvatar(userId, avatarState);

    return true;
  } catch (error) {
    console.error('Failed to set preset avatar:', error);
    return false;
  }
};

// ═══════════════════════════════════════
// AVATAR RESOLUTION (FALLBACK CHAIN)
// ═══════════════════════════════════════

/**
 * Resolve avatar URL with graceful fallback chain:
 * 1. Custom uploaded photo (avatarUrl)
 * 2. Cached custom photo
 * 3. Preset avatar
 * 4. Default avatar
 */
export const resolveAvatarUrl = (user: {
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
  avatar?: string;
  id: string;
}, preferThumbnail: boolean = false): {
  url: string;
  type: 'custom' | 'preset' | 'default';
  isFromCache: boolean;
} => {
  // Try custom URL first
  if (user.avatarUrl) {
    return {
      url: preferThumbnail && user.avatarThumbnailUrl
        ? user.avatarThumbnailUrl
        : user.avatarUrl,
      type: 'custom',
      isFromCache: false,
    };
  }

  // Try local cache
  const cached = getCachedAvatar(user.id);
  if (cached?.type === 'custom' && cached.customUrl) {
    return {
      url: preferThumbnail && cached.thumbnailUrl
        ? cached.thumbnailUrl
        : cached.customUrl,
      type: 'custom',
      isFromCache: true,
    };
  }

  // Try cached blob
  const cachedBlob = getCachedImageBlob(user.id);
  if (cachedBlob) {
    return {
      url: cachedBlob,
      type: 'custom',
      isFromCache: true,
    };
  }

  // Return preset or default
  const presetId = user.avatar || cached?.presetId || 'pegasus';
  return {
    url: `/avatars/${presetId}.png`,
    type: presetId === 'pegasus' ? 'default' : 'preset',
    isFromCache: false,
  };
};

export default {
  uploadProfilePicture,
  deleteProfilePicture,
  setPresetAvatar,
  cacheAvatar,
  getCachedAvatar,
  resolveAvatarUrl,
  optimizeImage,
};
