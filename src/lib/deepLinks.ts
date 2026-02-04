/**
 * synclulu DEEP LINK SYSTEM
 * Viral sharing & app installation flow
 */

// ═══════════════════════════════════════
// DEEP LINK TYPES
// ═══════════════════════════════════════

export type DeepLinkType =
  | 'profile'        // User profile
  | 'referral'       // Referral invite
  | 'content'        // Locked content
  | 'cloud'          // Join a cloud/room
  | 'event'          // Star event
  | 'quest';         // Daily quest

export interface DeepLinkData {
  type: DeepLinkType;
  id: string;
  referrer?: string;
  meta?: Record<string, string>;
}

export interface DeepLinkConfig {
  baseUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  fallbackUrl: string;
}

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

const DEEP_LINK_CONFIG: DeepLinkConfig = {
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://synclulu.app',
  appStoreUrl: 'https://apps.apple.com/app/synclulu/id123456789',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.synclulu',
  fallbackUrl: 'https://synclulu.app/download',
};

// ═══════════════════════════════════════
// DEEP LINK GENERATION
// ═══════════════════════════════════════

/**
 * Generate a deep link URL
 */
export const generateDeepLink = (data: DeepLinkData): string => {
  const params = new URLSearchParams();

  params.set('type', data.type);
  params.set('id', data.id);

  if (data.referrer) {
    params.set('ref', data.referrer);
  }

  if (data.meta) {
    Object.entries(data.meta).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  return `${DEEP_LINK_CONFIG.baseUrl}/link?${params.toString()}`;
};

/**
 * Generate profile deep link
 */
export const generateProfileLink = (username: string, referrerId?: string): string => {
  return generateDeepLink({
    type: 'profile',
    id: username,
    referrer: referrerId,
  });
};

/**
 * Generate locked content deep link
 */
export const generateContentLink = (contentId: string, creatorId: string): string => {
  return generateDeepLink({
    type: 'content',
    id: contentId,
    referrer: creatorId,
    meta: { creator: creatorId },
  });
};

/**
 * Generate cloud/room invite link
 */
export const generateCloudLink = (cloudId: string, inviterId?: string): string => {
  return generateDeepLink({
    type: 'cloud',
    id: cloudId,
    referrer: inviterId,
  });
};

/**
 * Generate star event link
 */
export const generateEventLink = (eventId: string, starId: string): string => {
  return generateDeepLink({
    type: 'event',
    id: eventId,
    referrer: starId,
  });
};

// ═══════════════════════════════════════
// DEEP LINK PARSING
// ═══════════════════════════════════════

/**
 * Parse deep link from URL
 */
export const parseDeepLink = (url: string): DeepLinkData | null => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const type = params.get('type') as DeepLinkType;
    const id = params.get('id');

    if (!type || !id) return null;

    const meta: Record<string, string> = {};
    params.forEach((value, key) => {
      if (!['type', 'id', 'ref'].includes(key)) {
        meta[key] = value;
      }
    });

    return {
      type,
      id,
      referrer: params.get('ref') || undefined,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
  } catch {
    return null;
  }
};

/**
 * Check if current URL is a deep link
 */
export const isDeepLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/link';
};

/**
 * Get deep link data from current URL
 */
export const getDeepLinkFromUrl = (): DeepLinkData | null => {
  if (typeof window === 'undefined') return null;
  return parseDeepLink(window.location.href);
};

// ═══════════════════════════════════════
// DEEP LINK STORAGE
// ═══════════════════════════════════════

const DEEP_LINK_STORAGE_KEY = 'synclulu_pending_deeplink';

/**
 * Store deep link for processing after install/login
 */
export const storePendingDeepLink = (data: DeepLinkData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEEP_LINK_STORAGE_KEY, JSON.stringify(data));
};

/**
 * Get and clear pending deep link
 */
export const getPendingDeepLink = (): DeepLinkData | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(DEEP_LINK_STORAGE_KEY);
  if (!stored) return null;

  localStorage.removeItem(DEEP_LINK_STORAGE_KEY);

  try {
    return JSON.parse(stored) as DeepLinkData;
  } catch {
    return null;
  }
};

/**
 * Check if there's a pending deep link
 */
export const hasPendingDeepLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEEP_LINK_STORAGE_KEY) !== null;
};

// ═══════════════════════════════════════
// DEEP LINK ROUTING
// ═══════════════════════════════════════

/**
 * Get the destination route for a deep link
 */
export const getDeepLinkRoute = (data: DeepLinkData): string => {
  switch (data.type) {
    case 'profile':
      return `/profile/${data.id}`;
    case 'referral':
      return `/register?ref=${data.id}`;
    case 'content':
      return `/content/${data.id}`;
    case 'cloud':
      return `/cloud/${data.id}`;
    case 'event':
      return `/event/${data.id}`;
    case 'quest':
      return `/quests?highlight=${data.id}`;
    default:
      return '/';
  }
};

// ═══════════════════════════════════════
// SHARING FUNCTIONS
// ═══════════════════════════════════════

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

/**
 * Share a deep link using Web Share API or fallback
 */
export const shareDeepLink = async (options: ShareOptions): Promise<boolean> => {
  try {
    if (navigator.share && navigator.canShare(options)) {
      await navigator.share(options);
      return true;
    }

    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(options.url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Share profile
 */
export const shareProfile = async (
  username: string,
  displayName: string,
  referrerId?: string
): Promise<boolean> => {
  const url = generateProfileLink(username, referrerId);
  return shareDeepLink({
    title: `${displayName} auf synclulu`,
    text: `Schau dir das Profil von ${displayName} auf synclulu an! 🌟`,
    url,
  });
};

/**
 * Share locked content
 */
export const shareLockedContent = async (
  contentId: string,
  contentTitle: string,
  creatorId: string
): Promise<boolean> => {
  const url = generateContentLink(contentId, creatorId);
  return shareDeepLink({
    title: `Secret Bubble: ${contentTitle}`,
    text: `Entsperre diesen geheimen Inhalt auf synclulu! 🔒✨`,
    url,
  });
};

/**
 * Share cloud invite
 */
export const shareCloudInvite = async (
  cloudId: string,
  cloudName: string,
  inviterId?: string
): Promise<boolean> => {
  const url = generateCloudLink(cloudId, inviterId);
  return shareDeepLink({
    title: `${cloudName} - synclulu Cloud`,
    text: `Komm in mein Wölkchen "${cloudName}" auf synclulu! ☁️`,
    url,
  });
};

// ═══════════════════════════════════════
// PLATFORM DETECTION
// ═══════════════════════════════════════

export type Platform = 'ios' | 'android' | 'web';

/**
 * Detect current platform
 */
export const detectPlatform = (): Platform => {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (/android/.test(userAgent)) {
    return 'android';
  }

  return 'web';
};

/**
 * Get appropriate store URL for platform
 */
export const getStoreUrl = (): string => {
  const platform = detectPlatform();

  switch (platform) {
    case 'ios':
      return DEEP_LINK_CONFIG.appStoreUrl;
    case 'android':
      return DEEP_LINK_CONFIG.playStoreUrl;
    default:
      return DEEP_LINK_CONFIG.fallbackUrl;
  }
};

/**
 * Check if running as installed PWA
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

export default {
  generateDeepLink,
  generateProfileLink,
  generateContentLink,
  generateCloudLink,
  generateEventLink,
  parseDeepLink,
  isDeepLink,
  getDeepLinkFromUrl,
  storePendingDeepLink,
  getPendingDeepLink,
  hasPendingDeepLink,
  getDeepLinkRoute,
  shareDeepLink,
  shareProfile,
  shareLockedContent,
  shareCloudInvite,
  detectPlatform,
  getStoreUrl,
  isPWA,
};
