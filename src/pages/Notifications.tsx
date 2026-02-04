/**
 * Notifications.tsx
 * 🔔 SOVEREIGN NOTIFICATION CENTER v29.0
 *
 * LUXUS FEATURES:
 * - OLED-Black Background with Glassmorphism
 * - Neon-Akzente (Hyper-Violet, Founder Amber)
 * - Framer Motion Animations & Glow Effects
 * - Friend Requests mit eleganten Accept/Decline Buttons
 * - Aura-Sterne Benachrichtigungen
 * - System-Pings für Level-Ups & Updates
 * - Z-Index Hierarchie für Nav-Bar Kompatibilität
 *
 * @version 29.0.0 - Sovereign Luxus Edition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import {
  ArrowLeft,
  Bell,
  UserPlus,
  Star,
  MessageCircle,
  Users,
  Loader2,
  Check,
  X,
  Crown,
  Sparkles,
  Zap,
  TrendingUp,
  Gift,
  Volume2,
  Shield,
  ChevronRight,
} from 'lucide-react';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

type NotificationType = 'all' | 'requests' | 'stars' | 'social' | 'system';

interface Notification {
  id: string;
  type: 'star' | 'follow' | 'mention' | 'lounge' | 'system' | 'level_up' | 'aura' | 'gift';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  fromUserId?: string;
  fromUsername?: string;
  fromDisplayName?: string;
  fromPhotoURL?: string;
  isFounder?: boolean;
  metadata?: {
    starCount?: number;
    newLevel?: number;
    auraType?: string;
    giftType?: string;
  };
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  fromLevel: number;
  message?: string;
  createdAt: Date;
  isFounder: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GLOW ANIMATION COMPONENT
// ═══════════════════════════════════════════════════════════════

const GlowPulse = ({ color = '#a855f7', size = 100 }: { color?: string; size?: number }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
      filter: 'blur(20px)',
    }}
    animate={{
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{ duration: 2, repeat: Infinity }}
  />
);

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ICON COMPONENT
// ═══════════════════════════════════════════════════════════════

const NotificationIcon = ({ type, isRead }: { type: Notification['type']; isRead: boolean }) => {
  const iconConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    star: {
      icon: <Star size={16} />,
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
    },
    aura: {
      icon: <Sparkles size={16} />,
      color: '#f472b6',
      bg: 'rgba(244, 114, 182, 0.15)',
    },
    follow: {
      icon: <UserPlus size={16} />,
      color: '#22d3ee',
      bg: 'rgba(34, 211, 238, 0.15)',
    },
    mention: {
      icon: <MessageCircle size={16} />,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.15)',
    },
    lounge: {
      icon: <Users size={16} />,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.15)',
    },
    level_up: {
      icon: <TrendingUp size={16} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    gift: {
      icon: <Gift size={16} />,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.15)',
    },
    system: {
      icon: <Bell size={16} />,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
    },
  };

  const config = iconConfig[type] || iconConfig.system;

  return (
    <motion.div
      className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{
        background: isRead ? 'rgba(255, 255, 255, 0.03)' : config.bg,
        border: `1px solid ${isRead ? 'rgba(255, 255, 255, 0.06)' : config.color}30`,
        color: isRead ? 'rgba(255, 255, 255, 0.4)' : config.color,
      }}
      whileHover={{ scale: 1.05 }}
    >
      {!isRead && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ background: `${config.color}10` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {config.icon}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FRIEND REQUEST CARD
// ═══════════════════════════════════════════════════════════════

const FriendRequestCard = ({
  request,
  onAccept,
  onDecline,
  processing,
}: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
  processing: boolean;
}) => {
  const accentColor = request.isFounder ? '#fbbf24' : '#a855f7';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      layout
      className="relative rounded-3xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
        border: `1px solid ${request.isFounder ? 'rgba(251, 191, 36, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
      }}
    >
      {/* Glow for new requests */}
      <motion.div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="flex items-start gap-4 relative z-10">
        {/* Avatar */}
        <motion.div
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.05 }}
        >
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden"
            style={{
              border: `2px solid ${accentColor}`,
              boxShadow: `0 0 20px ${accentColor}30`,
            }}
          >
            {request.fromPhotoURL ? (
              <img
                src={request.fromPhotoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
              >
                <span className="text-xl font-black text-white/80">
                  {request.fromDisplayName[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          {request.isFounder && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)',
              }}
            >
              <Crown size={12} className="text-black" />
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-white truncate flex items-center gap-2">
                {request.fromDisplayName}
                {request.isFounder && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    FOUNDER
                  </span>
                )}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                @{request.fromUsername} • Level {request.fromLevel}
              </p>
            </div>
            <span className="text-[10px] text-white/30 whitespace-nowrap">
              {formatTimeAgo(request.createdAt)}
            </span>
          </div>

          {request.message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-white/60 mt-2 p-3 rounded-xl italic"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            >
              "{request.message}"
            </motion.p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDecline}
              disabled={processing}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <X size={16} />
              Ablehnen
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAccept}
              disabled={processing}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${request.isFounder ? '#fde047' : '#c084fc'})`,
                boxShadow: `0 4px 20px ${accentColor}40`,
              }}
            >
              {processing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Annehmen
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════

const NotificationItem = ({
  notification,
  onClick,
  index,
}: {
  notification: Notification;
  onClick: () => void;
  index: number;
}) => {
  const isNew = !notification.isRead;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      layout
      onClick={onClick}
      className="relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all group"
      style={{
        background: isNew
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.02))'
          : 'rgba(255, 255, 255, 0.02)',
        border: isNew
          ? '1px solid rgba(139, 92, 246, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Glow effect for unread */}
      {isNew && (
        <motion.div
          className="absolute -top-5 -left-5 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 + 0.1 }}
        />
      )}

      {/* Icon */}
      <NotificationIcon type={notification.type} isRead={!isNew} />

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm truncate pr-4"
            style={{
              color: isNew ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontWeight: isNew ? 600 : 400,
            }}
          >
            {notification.title}
          </h3>
          <span className="text-[10px] text-white/30 whitespace-nowrap flex-shrink-0">
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1 line-clamp-2">
          {notification.message}
        </p>

        {/* Star count badge */}
        {notification.type === 'star' && notification.metadata?.starCount && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(251, 191, 36, 0.15)' }}
          >
            <Star size={12} className="text-amber-400" fill="#fbbf24" />
            <span className="text-[10px] font-bold text-amber-400">
              +{notification.metadata.starCount}
            </span>
          </motion.div>
        )}

        {/* Level up badge */}
        {notification.type === 'level_up' && notification.metadata?.newLevel && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
          >
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">
              Level {notification.metadata.newLevel}
            </span>
          </motion.div>
        )}
      </div>

      {/* Unread indicator */}
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #c084fc)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
          }}
        />
      )}

      {/* Hover arrow */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={16} className="text-white/20" />
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Jetzt';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

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

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const loadedNotifications: Notification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            isRead: data.isRead || false,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername,
            fromDisplayName: data.fromDisplayName,
            fromPhotoURL: data.fromPhotoURL,
            isFounder: data.fromUserId === FOUNDER_UID,
            metadata: data.metadata,
          };
        });

        setNotifications(loadedNotifications);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Fetch friend requests
  useEffect(() => {
    if (!user?.id) return;

    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const loadedRequests: FriendRequest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            fromUserId: data.fromUserId,
            fromUsername: data.fromUsername || 'unknown',
            fromDisplayName: data.fromDisplayName || 'Unbekannt',
            fromPhotoURL: data.fromPhotoURL,
            fromLevel: data.fromLevel || 1,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            isFounder: data.fromUserId === FOUNDER_UID,
          };
        });

        setRequests(loadedRequests);
      },
      (error) => {
        console.error('Error fetching friend requests:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
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
        title: 'Freundschaft akzeptiert! 🎉',
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
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), { isRead: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'stars') return ['star', 'aura'].includes(n.type);
    if (activeTab === 'social') return ['follow', 'lounge', 'mention'].includes(n.type);
    if (activeTab === 'system') return ['system', 'level_up', 'gift'].includes(n.type);
    return false;
  });

  // Tab config
  const tabs = [
    { id: 'all', label: 'Alle', count: notifications.length, icon: Bell },
    { id: 'requests', label: 'Anfragen', count: pendingRequestCount, icon: UserPlus },
    { id: 'stars', label: 'Sterne', count: notifications.filter((n) => n.type === 'star').length, icon: Star },
    { id: 'social', label: 'Sozial', count: notifications.filter((n) => ['follow', 'lounge'].includes(n.type)).length, icon: Users },
    { id: 'system', label: 'System', count: notifications.filter((n) => ['system', 'level_up'].includes(n.type)).length, icon: Zap },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={32} className="text-violet-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-white/40 text-sm">Lade Benachrichtigungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen safe-top safe-bottom pb-32"
      style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}
    >
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 pointer-events-none z-0">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell size={20} className="text-violet-400" />
              Benachrichtigungen
            </h1>
            <p className="text-xs text-white/40">
              {unreadCount > 0 ? (
                <span className="text-violet-400">{unreadCount} ungelesen</span>
              ) : (
                'Alles gelesen'
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a855f7',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              Alle lesen
            </motion.button>
          )}
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3">
          <motion.div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            initial={false}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as NotificationType)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive ? '0 4px 20px rgba(139, 92, 246, 0.4)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                      style={{
                        background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: isActive ? 'white' : '#a855f7',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Friend Requests Section */}
      <AnimatePresence mode="popLayout">
        {(activeTab === 'all' || activeTab === 'requests') && requests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-5 py-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-violet-400" />
              <h2 className="font-bold text-white">Freundschaftsanfragen</h2>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
              >
                {pendingRequestCount}
              </motion.span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {requests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    onAccept={() => handleAcceptRequest(request)}
                    onDecline={() => handleDeclineRequest(request.id)}
                    processing={processingRequest === request.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      {activeTab !== 'requests' && (
        <div className="px-5 py-4">
          {activeTab === 'all' && requests.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-violet-400" />
              <h2 className="font-bold text-white">Aktivitäten</h2>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell size={32} className="text-violet-400/50" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-2">
                Keine Benachrichtigungen
              </h3>
              <p className="text-sm text-white/50">
                Neue Aktivitäten erscheinen hier
              </p>
            </motion.div>
          ) : (
            <motion.div className="space-y-2" layout>
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification.id);
                      if (notification.fromUserId) {
                        navigate(`/user/${notification.fromUserId}`);
                      }
                    }}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* Empty State for Requests Tab */}
      {activeTab === 'requests' && requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-5"
        >
          <motion.div
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.05))',
              border: '1px solid rgba(34, 211, 238, 0.2)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <UserPlus size={32} className="text-cyan-400/50" />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-2">Keine Anfragen</h3>
          <p className="text-sm text-white/50">
            Neue Freundschaftsanfragen erscheinen hier
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;
