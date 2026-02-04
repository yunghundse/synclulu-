/**
 * PUSH NOTIFICATIONS SERVICE
 * Web Push Notifications für synclulu
 *
 * Features:
 * - Benachrichtigungen für neue Nachrichten
 * - Benachrichtigungen für Freundschaftsanfragen
 * - Benachrichtigungen für neue Wölkchen in der Nähe
 * - Service Worker Integration
 *
 * @version 1.0.0
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  messages: boolean;
  friendRequests: boolean;
  nearbyClouds: boolean;
  systemAlerts: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_NOTIFICATION_ICON = '/icons/icon-192x192.png';
const DEFAULT_BADGE = '/icons/badge-72x72.png';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  messages: true,
  friendRequests: true,
  nearbyClouds: true,
  systemAlerts: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if push notifications are supported
 */
export const isPushSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('[PushNotifications] Not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[PushNotifications] Permission granted');

      // Update user preferences in Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          notificationsEnabled: true,
          notificationPermission: 'granted',
        });
      }

      return true;
    }

    console.log('[PushNotifications] Permission denied');
    return false;
  } catch (error) {
    console.error('[PushNotifications] Permission request failed:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show a local notification
 */
export const showLocalNotification = async (
  payload: PushNotificationPayload
): Promise<boolean> => {
  if (!isPushSupported()) return false;

  if (Notification.permission !== 'granted') {
    console.warn('[PushNotifications] No permission to show notifications');
    return false;
  }

  try {
    // Try to use Service Worker notification (better for mobile)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || DEFAULT_NOTIFICATION_ICON,
        badge: payload.badge || DEFAULT_BADGE,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction,
        vibrate: [100, 50, 100],
      });
    } else {
      // Fallback to basic Notification API
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || DEFAULT_NOTIFICATION_ICON,
        tag: payload.tag,
        data: payload.data,
      });
    }

    return true;
  } catch (error) {
    console.error('[PushNotifications] Failed to show notification:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show notification for new message
 */
export const notifyNewMessage = async (
  senderName: string,
  messagePreview: string,
  chatId?: string
): Promise<void> => {
  await showLocalNotification({
    title: `💬 ${senderName}`,
    body: messagePreview.length > 100 ? `${messagePreview.slice(0, 97)}...` : messagePreview,
    tag: `message-${chatId || Date.now()}`,
    data: { type: 'message', chatId },
    actions: [
      { action: 'reply', title: 'Antworten' },
      { action: 'dismiss', title: 'Ignorieren' },
    ],
  });
};

/**
 * Show notification for friend request
 */
export const notifyFriendRequest = async (
  senderName: string,
  senderId: string
): Promise<void> => {
  await showLocalNotification({
    title: '👋 Neue Freundschaftsanfrage',
    body: `${senderName} möchte mit dir befreundet sein!`,
    tag: `friend-request-${senderId}`,
    data: { type: 'friendRequest', senderId },
    actions: [
      { action: 'accept', title: 'Annehmen' },
      { action: 'view', title: 'Ansehen' },
    ],
    requireInteraction: true,
  });
};

/**
 * Show notification for nearby cloud
 */
export const notifyNearbyCloud = async (
  cloudName: string,
  userCount: number,
  distance: string,
  cloudId: string
): Promise<void> => {
  await showLocalNotification({
    title: '☁️ Wölkchen in der Nähe',
    body: `${cloudName} • ${userCount} Personen • ${distance} entfernt`,
    tag: `cloud-${cloudId}`,
    data: { type: 'nearbyCloud', cloudId },
    actions: [
      { action: 'join', title: 'Beitreten' },
      { action: 'dismiss', title: 'Später' },
    ],
  });
};

/**
 * Show notification for sync completion
 */
export const notifySyncComplete = async (
  friendName: string,
  friendId: string
): Promise<void> => {
  await showLocalNotification({
    title: '✨ Sync erfolgreich!',
    body: `Du und ${friendName} seid jetzt verbunden!`,
    tag: `sync-${friendId}`,
    data: { type: 'sync', friendId },
  });
};

/**
 * Show system alert notification
 */
export const notifySystemAlert = async (
  title: string,
  message: string
): Promise<void> => {
  await showLocalNotification({
    title: `🔔 ${title}`,
    body: message,
    tag: `system-${Date.now()}`,
    data: { type: 'system' },
    requireInteraction: true,
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// USER PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return DEFAULT_NOTIFICATION_PREFERENCES;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const data = userDoc.data();

    return {
      enabled: data?.notificationsEnabled ?? true,
      messages: data?.notifyMessages ?? true,
      friendRequests: data?.notifyFriendRequests ?? true,
      nearbyClouds: data?.notifyNearbyClouds ?? true,
      systemAlerts: data?.notifySystemAlerts ?? true,
    };
  } catch (error) {
    console.error('[PushNotifications] Failed to get preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  try {
    const updates: Record<string, any> = {};

    if (preferences.enabled !== undefined) updates.notificationsEnabled = preferences.enabled;
    if (preferences.messages !== undefined) updates.notifyMessages = preferences.messages;
    if (preferences.friendRequests !== undefined) updates.notifyFriendRequests = preferences.friendRequests;
    if (preferences.nearbyClouds !== undefined) updates.notifyNearbyClouds = preferences.nearbyClouds;
    if (preferences.systemAlerts !== undefined) updates.notifySystemAlerts = preferences.systemAlerts;

    await updateDoc(doc(db, 'users', userId), updates);
    return true;
  } catch (error) {
    console.error('[PushNotifications] Failed to update preferences:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize push notifications
 * Call this after user consents to notifications
 */
export const initializePushNotifications = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('[PushNotifications] Not supported');
    return false;
  }

  // Request permission if not already granted
  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  console.log('[PushNotifications] Initialized successfully');
  return true;
};

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
  notifyNewMessage,
  notifyFriendRequest,
  notifyNearbyCloud,
  notifySyncComplete,
  notifySystemAlert,
  getNotificationPreferences,
  updateNotificationPreferences,
  initializePushNotifications,
};
