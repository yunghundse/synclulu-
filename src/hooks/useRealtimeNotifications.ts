/**
 * useRealtimeNotifications.ts
 * Firebase Realtime Listener - The Neural Link
 * Listens for stars, friend requests, and room invites in real-time
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { audioFeedback } from '../lib/audioFeedback';

export type NotificationType =
  | 'star'
  | 'friend_request'
  | 'friend_accepted'
  | 'room_invite'
  | 'room_mention'
  | 'achievement'
  | 'system';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  userId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface UseRealtimeNotificationsOptions {
  onStar?: (notification: RealtimeNotification) => void;
  onFriendRequest?: (notification: RealtimeNotification) => void;
  onFriendAccepted?: (notification: RealtimeNotification) => void;
  onRoomInvite?: (notification: RealtimeNotification) => void;
  onAnyNotification?: (notification: RealtimeNotification) => void;
  enableSounds?: boolean;
  enableHaptics?: boolean;
}

export function useRealtimeNotifications(
  userId: string | undefined,
  options: UseRealtimeNotificationsOptions = {}
) {
  const {
    onStar,
    onFriendRequest,
    onFriendAccepted,
    onRoomInvite,
    onAnyNotification,
    enableSounds = true,
    enableHaptics = true,
  } = options;

  // Track seen notifications to avoid duplicate triggers
  const seenNotifications = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Handle new notification
  const handleNotification = useCallback(
    (notification: RealtimeNotification) => {
      // Skip if already seen
      if (seenNotifications.current.has(notification.id)) return;
      seenNotifications.current.add(notification.id);

      // Skip notifications on first load (they're old)
      if (isFirstLoad.current) return;

      // Play feedback
      if (enableSounds) {
        if (notification.type === 'star') {
          audioFeedback.notification();
        } else if (notification.type === 'friend_request') {
          audioFeedback.success();
        } else {
          audioFeedback.pop();
        }
      }

      if (enableHaptics) {
        audioFeedback.haptic('medium');
      }

      // Call type-specific handlers
      switch (notification.type) {
        case 'star':
          onStar?.(notification);
          break;
        case 'friend_request':
          onFriendRequest?.(notification);
          break;
        case 'friend_accepted':
          onFriendAccepted?.(notification);
          break;
        case 'room_invite':
          onRoomInvite?.(notification);
          break;
      }

      // Call generic handler
      onAnyNotification?.(notification);
    },
    [onStar, onFriendRequest, onFriendAccepted, onRoomInvite, onAnyNotification, enableSounds, enableHaptics]
  );

  // Subscribe to notifications
  useEffect(() => {
    if (!userId) return;

    // Reset on user change
    seenNotifications.current.clear();
    isFirstLoad.current = true;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const notification: RealtimeNotification = {
              id: change.doc.id,
              type: data.type,
              userId: data.userId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              title: data.title || '',
              message: data.message || '',
              data: data.data,
              read: data.read || false,
              createdAt: data.createdAt?.toDate() || new Date(),
            };

            handleNotification(notification);
          }
        });

        // After first load, enable real-time notifications
        isFirstLoad.current = false;
      },
      (error) => {
        console.error('Realtime notifications error:', error);
      }
    );

    return () => unsubscribe();
  }, [userId, handleNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((docSnapshot) => {
          updateDoc(doc(db, 'notifications', docSnapshot.id), {
            read: true,
            readAt: Timestamp.now(),
          });
        });
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [userId]);

  return {
    markAsRead,
    markAllAsRead,
  };
}

export default useRealtimeNotifications;
