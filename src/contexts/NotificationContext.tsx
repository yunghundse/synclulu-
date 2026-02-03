import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'star_received' | 'mention' | 'room_invite' | 'system';
  title: string;
  message: string;
  fromUserId?: string;
  fromUsername?: string;
  fromDisplayName?: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  showToast: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearToast: () => void;
  currentToast: AppNotification | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentToast, setCurrentToast] = useState<AppNotification | null>(null);
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);

  // Listen for friend requests in real-time
  useEffect(() => {
    if (!user?.id) return;

    const friendRequestsRef = collection(db, 'friendRequests');
    const q = query(
      friendRequestsRef,
      where('toId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();

          // Only show notification if it's recent (within last 30 seconds)
          const isRecent = (Date.now() - createdAt.getTime()) < 30000;

          if (isRecent) {
            const notification: AppNotification = {
              id: change.doc.id,
              type: 'friend_request',
              title: 'Neue Freundschaftsanfrage',
              message: `${data.fromDisplayName || data.fromUsername} möchte dein Freund sein!`,
              fromUserId: data.fromId,
              fromUsername: data.fromUsername,
              fromDisplayName: data.fromDisplayName,
              createdAt,
              read: false,
            };

            // Add to notifications list
            setNotifications(prev => [notification, ...prev]);

            // Show toast
            showToast(notification);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen for accepted friend requests
  useEffect(() => {
    if (!user?.id) return;

    const friendRequestsRef = collection(db, 'friendRequests');
    const q = query(
      friendRequestsRef,
      where('fromId', '==', user.id),
      where('status', '==', 'accepted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();

          const notification: AppNotification = {
            id: `accepted-${change.doc.id}`,
            type: 'friend_accepted',
            title: 'Freundschaft bestätigt!',
            message: `${data.toUsername || 'Jemand'} hat deine Anfrage angenommen!`,
            fromUserId: data.toId,
            fromUsername: data.toUsername,
            createdAt: new Date(),
            read: false,
          };

          setNotifications(prev => [notification, ...prev]);
          showToast(notification);
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen for stars received (if you have a stars collection)
  useEffect(() => {
    if (!user?.id) return;

    const starsRef = collection(db, 'stars');
    const q = query(
      starsRef,
      where('toUserId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();

          // Only show notification if it's recent
          const isRecent = (Date.now() - createdAt.getTime()) < 30000;

          if (isRecent) {
            const notification: AppNotification = {
              id: change.doc.id,
              type: 'star_received',
              title: '⭐ Stern erhalten!',
              message: `${data.fromDisplayName || 'Jemand'} hat dir einen Stern geschenkt!`,
              fromUserId: data.fromUserId,
              fromUsername: data.fromUsername,
              fromDisplayName: data.fromDisplayName,
              data: { amount: data.amount },
              createdAt,
              read: false,
            };

            setNotifications(prev => [notification, ...prev]);
            showToast(notification);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      setToastQueue(prev => prev.slice(1));
    }
  }, [currentToast, toastQueue]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (currentToast) {
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  const showToast = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> | AppNotification) => {
    const fullNotification: AppNotification = {
      id: 'id' in notification ? notification.id : `toast-${Date.now()}`,
      createdAt: 'createdAt' in notification ? notification.createdAt : new Date(),
      read: false,
      ...notification,
    };

    if (currentToast) {
      setToastQueue(prev => [...prev, fullNotification]);
    } else {
      setCurrentToast(fullNotification);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [currentToast]);

  const clearToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      showToast,
      markAsRead,
      markAllAsRead,
      clearToast,
      currentToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
