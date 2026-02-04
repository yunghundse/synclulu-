/**
 * synclulu AVATAR CACHE SYSTEM
 * "Zero-Loss" Profile Picture Persistence
 *
 * Ensures avatars:
 * - Are cached locally for instant display
 * - Persist across navigation
 * - Never flicker or disappear
 * - Load optimistically from cache
 */

// ═══════════════════════════════════════
// CACHE KEYS
// ═══════════════════════════════════════

const AVATAR_CACHE_KEY = 'synclulu_avatar_cache';
const AVATAR_URL_PREFIX = 'synclulu_avatar_';
const CACHE_EXPIRY_HOURS = 168; // 7 days - longer persistence
const PERSISTENT_AVATAR_KEY = 'synclulu_avatar_permanent'; // Never expires

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface CachedAvatar {
  url: string;
  blob?: string;  // Base64 encoded for local storage
  timestamp: number;
  userId: string;
}

interface AvatarCache {
  [userId: string]: CachedAvatar;
}

// ═══════════════════════════════════════
// LOCAL STORAGE OPERATIONS
// ═══════════════════════════════════════

/**
 * Get the entire avatar cache from local storage
 */
const getCache = (): AvatarCache => {
  try {
    const cached = localStorage.getItem(AVATAR_CACHE_KEY);
    if (!cached) return {};
    return JSON.parse(cached);
  } catch {
    return {};
  }
};

/**
 * Save the avatar cache to local storage
 */
const saveCache = (cache: AvatarCache): void => {
  try {
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Storage might be full, clear old entries
    console.warn('Avatar cache storage full, clearing old entries');
    clearExpiredCache();
  }
};

/**
 * Clear expired cache entries
 */
const clearExpiredCache = (): void => {
  const cache = getCache();
  const now = Date.now();
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

  const validCache: AvatarCache = {};
  for (const [userId, entry] of Object.entries(cache)) {
    if (now - entry.timestamp < expiryMs) {
      validCache[userId] = entry;
    }
  }

  saveCache(validCache);
};

// ═══════════════════════════════════════
// AVATAR CACHE API
// ═══════════════════════════════════════

/**
 * Get cached avatar URL for a user
 * Returns cached version if available and not expired
 */
export const getCachedAvatarUrl = (userId: string): string | null => {
  const cache = getCache();
  const entry = cache[userId];

  if (!entry) return null;

  const now = Date.now();
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

  if (now - entry.timestamp > expiryMs) {
    // Expired, but still return it for immediate display
    // It will be refreshed in background
    return entry.url;
  }

  return entry.url;
};

/**
 * Cache an avatar URL for a user
 */
export const cacheAvatarUrl = (userId: string, url: string): void => {
  if (!url || !userId) return;

  const cache = getCache();
  cache[userId] = {
    url,
    timestamp: Date.now(),
    userId,
  };
  saveCache(cache);
};

/**
 * Cache avatar with blob data (for offline support)
 */
export const cacheAvatarWithBlob = async (userId: string, url: string): Promise<void> => {
  if (!url || !userId) return;

  try {
    // Fetch and convert to base64
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const cache = getCache();
        cache[userId] = {
          url,
          blob: base64,
          timestamp: Date.now(),
          userId,
        };
        saveCache(cache);
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Fallback to URL-only caching
    cacheAvatarUrl(userId, url);
  }
};

/**
 * Get avatar (blob or URL) with fallback
 */
export const getAvatarWithFallback = (userId: string, fallbackUrl?: string): string | null => {
  const cache = getCache();
  const entry = cache[userId];

  if (entry) {
    // Prefer blob if available (works offline)
    if (entry.blob) return entry.blob;
    return entry.url;
  }

  // Cache the fallback if provided
  if (fallbackUrl) {
    cacheAvatarUrl(userId, fallbackUrl);
    return fallbackUrl;
  }

  return null;
};

/**
 * Remove cached avatar for a user
 */
export const removeCachedAvatar = (userId: string): void => {
  const cache = getCache();
  delete cache[userId];
  saveCache(cache);
};

/**
 * Clear all cached avatars
 */
export const clearAvatarCache = (): void => {
  localStorage.removeItem(AVATAR_CACHE_KEY);
};

/**
 * Preload avatars for a list of users
 */
export const preloadAvatars = async (users: { id: string; avatarUrl?: string }[]): Promise<void> => {
  const cache = getCache();

  for (const user of users) {
    if (user.avatarUrl && !cache[user.id]) {
      cacheAvatarUrl(user.id, user.avatarUrl);
    }
  }
};

// ═══════════════════════════════════════
// SESSION STORAGE (For immediate updates)
// ═══════════════════════════════════════

const SESSION_AVATAR_KEY = 'synclulu_session_avatar';

/**
 * Store current user's avatar in session (survives page refresh within session)
 */
export const setSessionAvatar = (url: string): void => {
  try {
    sessionStorage.setItem(SESSION_AVATAR_KEY, url);
  } catch {
    // Ignore storage errors
  }
};

/**
 * Get current user's avatar from session
 */
export const getSessionAvatar = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_AVATAR_KEY);
  } catch {
    return null;
  }
};

/**
 * Clear session avatar
 */
export const clearSessionAvatar = (): void => {
  try {
    sessionStorage.removeItem(SESSION_AVATAR_KEY);
  } catch {
    // Ignore
  }
};

// ═══════════════════════════════════════
// HOOKS HELPER
// ═══════════════════════════════════════

/**
 * Get best available avatar URL for a user
 * Priority: Session > LocalStorage Cache > Provided URL > null
 */
export const getBestAvatarUrl = (userId: string, providedUrl?: string | null): string | null => {
  // For current user, check session first
  const sessionAvatar = getSessionAvatar();
  if (sessionAvatar) return sessionAvatar;

  // Check local cache
  const cachedUrl = getCachedAvatarUrl(userId);
  if (cachedUrl) return cachedUrl;

  // Use provided URL and cache it
  if (providedUrl) {
    cacheAvatarUrl(userId, providedUrl);
    return providedUrl;
  }

  return null;
};

// ═══════════════════════════════════════
// PERMANENT AVATAR STORAGE (NEVER EXPIRES)
// ═══════════════════════════════════════

interface PermanentAvatar {
  url: string;
  type: 'custom' | 'preset';
  presetId?: string;
  userId: string;
  updatedAt: number;
}

/**
 * Store avatar permanently - this NEVER expires
 * Use this for the current user's avatar
 */
export const setPermanentAvatar = (userId: string, data: {
  url?: string;
  type: 'custom' | 'preset';
  presetId?: string;
}): void => {
  try {
    const storage: Record<string, PermanentAvatar> = JSON.parse(
      localStorage.getItem(PERSISTENT_AVATAR_KEY) || '{}'
    );

    storage[userId] = {
      url: data.url || (data.type === 'preset' ? `/avatars/${data.presetId}.png` : ''),
      type: data.type,
      presetId: data.presetId,
      userId,
      updatedAt: Date.now(),
    };

    localStorage.setItem(PERSISTENT_AVATAR_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn('Failed to store permanent avatar:', error);
  }
};

/**
 * Get permanent avatar - returns stored avatar that never expires
 */
export const getPermanentAvatar = (userId: string): PermanentAvatar | null => {
  try {
    const storage: Record<string, PermanentAvatar> = JSON.parse(
      localStorage.getItem(PERSISTENT_AVATAR_KEY) || '{}'
    );
    return storage[userId] || null;
  } catch {
    return null;
  }
};

/**
 * STICKY AVATAR RESOLUTION
 * Priority chain:
 * 1. Session storage (immediate updates)
 * 2. Permanent storage (never expires)
 * 3. Local cache (7 days)
 * 4. Provided URL from server
 * 5. Preset avatar fallback
 */
export const getStickyAvatarUrl = (
  userId: string,
  providedUrl?: string | null,
  presetId?: string
): { url: string; type: 'custom' | 'preset' | 'default' } => {
  // 1. Session storage (current session updates)
  const sessionAvatar = getSessionAvatar();
  if (sessionAvatar) {
    return { url: sessionAvatar, type: 'custom' };
  }

  // 2. Permanent storage (never expires)
  const permanent = getPermanentAvatar(userId);
  if (permanent) {
    return {
      url: permanent.url,
      type: permanent.type,
    };
  }

  // 3. Local cache (may be from previous session)
  const cachedUrl = getCachedAvatarUrl(userId);
  if (cachedUrl) {
    return { url: cachedUrl, type: 'custom' };
  }

  // 4. Provided URL from server
  if (providedUrl) {
    // Cache it permanently
    setPermanentAvatar(userId, { url: providedUrl, type: 'custom' });
    cacheAvatarUrl(userId, providedUrl);
    return { url: providedUrl, type: 'custom' };
  }

  // 5. Preset avatar
  if (presetId) {
    const presetUrl = `/avatars/${presetId}.png`;
    setPermanentAvatar(userId, { type: 'preset', presetId, url: presetUrl });
    return { url: presetUrl, type: 'preset' };
  }

  // 6. Default fallback
  return { url: '/avatars/pegasus.png', type: 'default' };
};

export default {
  getCachedAvatarUrl,
  cacheAvatarUrl,
  cacheAvatarWithBlob,
  getAvatarWithFallback,
  removeCachedAvatar,
  clearAvatarCache,
  preloadAvatars,
  setSessionAvatar,
  getSessionAvatar,
  clearSessionAvatar,
  getBestAvatarUrl,
  setPermanentAvatar,
  getPermanentAvatar,
  getStickyAvatarUrl,
};
