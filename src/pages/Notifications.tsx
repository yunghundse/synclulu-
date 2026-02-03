import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  ArrowLeft, Bell, UserPlus, Star, MessageCircle, Users, Loader2, Check, X
} from 'lucide-react';

type NotificationType = 'all' | 'requests' | 'stars' | 'social';

interface Notification {
  id: string;
  type: 'star' | 'follow' | 'mention' | 'lounge' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  fromUserId?: string;
  fromUsername?: string;
  fromDisplayName?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromLevel: number;
  message?: string;
  createdAt: Date;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<NotificationType>('all');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Fetch notifications from Firebase
  useEffect(() => {
    if (!user?.id) return;

    const notificationsRef = collection(db, 'notifications');
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const loadedNotifications: Notification[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Only show notifications for this user
        if (data.toUserId === user.id) {
          loadedNotifications.push({
            id: docSnap.id,
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            isRead: data.isRead || false,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername,
            fromDisplayName: data.fromDisplayName,
          });
        }
      });

      // Sort by timestamp desc
      loadedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(loadedNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Fetch friend requests from Firebase
  useEffect(() => {
    if (!user?.id) return;

    const requestsRef = collection(db, 'friendRequests');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const loadedRequests: FriendRequest[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Only show requests sent TO this user
        if (data.toUserId === user.id && data.status === 'pending') {
          loadedRequests.push({
            id: docSnap.id,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername || 'unknown',
            fromDisplayName: data.fromDisplayName || 'Unbekannt',
            fromLevel: data.fromLevel || 1,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      // Sort by createdAt desc
      loadedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRequests(loadedRequests);
    }, (error) => {
      console.error('Error fetching friend requests:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingRequestCount = requests.length;

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user?.id) return;
    setProcessingRequest(request.id);

    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted',
        acceptedAt: Timestamp.now(),
      });

      // Create friendship document
      await addDoc(collection(db, 'friendships'), {
        users: [user.id, request.fromUserId],
        createdAt: Timestamp.now(),
      });

      // Create notification for the sender
      await addDoc(collection(db, 'notifications'), {
        toUserId: request.fromUserId,
        type: 'follow',
        title: 'Freundschaft akzeptiert!',
        message: `${user.displayName || user.username} hat deine Anfrage angenommen`,
        timestamp: Timestamp.now(),
        isRead: false,
        fromUserId: user.id,
        fromUsername: user.username,
        fromDisplayName: user.displayName,
      });

    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined',
        declinedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    try {
      await Promise.all(
        unreadNotifications.map(n =>
          updateDoc(doc(db, 'notifications', n.id), { isRead: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'star': return <Star size={16} className="text-amber-500" />;
      case 'follow': return <UserPlus size={16} className="text-blue-500" />;
      case 'mention': return <MessageCircle size={16} className="text-green-500" />;
      case 'lounge': return <Users size={16} className="text-purple-500" />;
      case 'system': return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'stars') return n.type === 'star';
    if (activeTab === 'social') return ['follow', 'lounge', 'mention'].includes(n.type);
    return false;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-delulu-violet mx-auto mb-4" />
          <p className="text-delulu-muted text-sm">Lade Benachrichtigungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white safe-top safe-bottom pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-delulu-muted hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-delulu-text">
              Benachrichtigungen
            </h1>
            <p className="text-xs text-delulu-muted">
              {unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alles gelesen'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-delulu-violet font-semibold"
            >
              Alle lesen
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'Alle', count: notifications.length },
            { id: 'requests', label: 'Anfragen', count: pendingRequestCount },
            { id: 'stars', label: 'Sterne', count: notifications.filter(n => n.type === 'star').length },
            { id: 'social', label: 'Sozial', count: notifications.filter(n => ['follow', 'lounge'].includes(n.type)).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NotificationType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-delulu-violet text-white shadow-lg'
                  : 'bg-gray-100 text-delulu-muted hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-delulu-violet/10 text-delulu-violet'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Friend Requests Section */}
      {(activeTab === 'all' || activeTab === 'requests') && requests.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-delulu-violet" />
            <h2 className="font-display font-bold text-delulu-text">
              Freundschaftsanfragen
            </h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              {pendingRequestCount}
            </span>
          </div>

          <div className="space-y-3">
            {requests.map(request => (
              <div
                key={request.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-delulu-violet/10 flex items-center justify-center text-lg">
                    {request.fromDisplayName[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-delulu-text truncate">
                      {request.fromDisplayName}
                    </p>
                    <p className="text-xs text-delulu-muted">
                      @{request.fromUsername} • Level {request.fromLevel}
                    </p>
                    {request.message && (
                      <p className="text-sm text-delulu-text/70 mt-1 italic">
                        "{request.message}"
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-delulu-muted">
                    {formatTime(request.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDeclineRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={16} />
                    Ablehnen
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(request)}
                    disabled={processingRequest === request.id}
                    className="flex-1 py-2 rounded-xl bg-delulu-violet text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingRequest === request.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Annehmen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications List */}
      {activeTab !== 'requests' && (
        <div className="px-6 py-4">
          {activeTab === 'all' && requests.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-delulu-violet" />
              <h2 className="font-display font-bold text-delulu-text">
                Aktivitäten
              </h2>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-delulu-text mb-2">Keine Benachrichtigungen</p>
              <p className="text-sm text-delulu-muted">
                Neue Aktivitäten erscheinen hier
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer ${
                    notification.isRead
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-delulu-violet/5 hover:bg-delulu-violet/10'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm ${
                        notification.isRead ? 'text-delulu-text' : 'font-semibold text-delulu-text'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] text-delulu-muted whitespace-nowrap">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-delulu-muted mt-0.5 truncate">
                      {notification.message}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-delulu-violet mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State for Requests */}
      {activeTab === 'requests' && requests.length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-gray-400" />
          </div>
          <h3 className="font-semibold text-delulu-text mb-2">Keine Anfragen</h3>
          <p className="text-sm text-delulu-muted">
            Neue Freundschaftsanfragen erscheinen hier
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
