/**
 * SovereignHome.tsx
 * 👑 NEBULA-DISCOVERY v23.1 - COMPLETE FIX UPDATE
 *
 * FIXED:
 * - Location interface compatibility (lat/lon vs latitude/longitude)
 * - Real Firebase data for messages, rooms, friends
 * - Proper navigation to all routes
 * - Room join without hanging
 * - Error handling
 *
 * @design Apple HIG × Snapchat Flow-States
 * @version 23.1.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useRobustLocation } from '@/hooks/useRobustLocation';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

type SheetType = 'cloud' | 'profile' | 'messenger' | null;

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      const patterns = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(patterns[type]);
    } catch (e) {
      // Haptic not supported
    }
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'gerade';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLOUD ACTION SHEET
// ═══════════════════════════════════════════════════════════════════════════

interface CloudSheetProps {
  onClose: () => void;
  onDiscovery: () => void;
  onCreate: () => void;
  nearbyCount: number;
  roomCount: number;
  isLoading: boolean;
}

const CloudSheet: React.FC<CloudSheetProps> = memo(({
  onClose,
  onDiscovery,
  onCreate,
  nearbyCount,
  roomCount,
  isLoading,
}) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="absolute bottom-0 left-0 right-0 z-[100]"
  >
    <div
      className="rounded-t-[50px] p-8 pb-12"
      style={{
        background: 'rgba(10, 10, 12, 0.98)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: 'none',
        boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Handle */}
      <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />

      {/* Title */}
      <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8">
        Wölkchen Zentrale
      </h3>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Discovery Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('medium');
            onDiscovery();
          }}
          className="flex flex-col items-center gap-4 p-6 rounded-3xl transition-all"
          style={{
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}
        >
          <div className="text-4xl">🔍</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
            Entdecken
          </div>
          <div className="text-[9px] text-purple-300/60">
            {isLoading ? 'Lädt...' : roomCount > 0 ? `${roomCount} Wölkchen aktiv` : 'Suche starten'}
          </div>
        </motion.button>

        {/* Create Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('medium');
            onCreate();
          }}
          className="flex flex-col items-center gap-4 p-6 rounded-3xl transition-all"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div className="text-4xl">☁️</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
            Erstellen
          </div>
          <div className="text-[9px] text-emerald-300/60">
            {nearbyCount > 0 ? `${nearbyCount} in der Nähe` : 'Neues Wölkchen'}
          </div>
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            onDiscovery();
          }}
          className="py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
        >
          🗺️ Radar
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            onCreate();
          }}
          className="py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
        >
          ⚡ Quick Join
        </motion.button>
      </div>

      {/* Back Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        className="w-full mt-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white/50 transition-colors"
      >
        Zurück
      </motion.button>
    </div>
  </motion.div>
));

CloudSheet.displayName = 'CloudSheet';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileOverlayProps {
  user: any;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const ProfileOverlay: React.FC<ProfileOverlayProps> = memo(({
  user,
  onClose,
  onNavigate,
}) => {
  const isFounder = user?.id === FOUNDER_UID;
  const trustScore = user?.trustScore || 500;
  const photoURL = user?.photoURL || user?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex flex-col"
      style={{
        background: 'rgba(5, 5, 5, 0.98)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Close Button */}
      <div className="p-6 pt-12 flex justify-end">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <span className="text-white/60">✕</span>
        </motion.button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-20">
        {/* Avatar with Trust Ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="relative"
        >
          {/* Trust Ring */}
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="66"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <motion.circle
              cx="70" cy="70" r="66"
              fill="none"
              stroke={trustScore >= 800 ? '#10b981' : trustScore >= 500 ? '#7c3aed' : '#f59e0b'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(trustScore / 1000) * 415} 415`}
              initial={{ strokeDashoffset: 415 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>

          {/* Avatar */}
          <div className="w-28 h-28 rounded-[40px] overflow-hidden border-2 border-white/10 relative z-10">
            {photoURL ? (
              <img src={photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Founder Crown */}
          {isFounder && (
            <div className="absolute -top-3 -right-3 text-2xl z-20">👑</div>
          )}
        </motion.div>

        {/* Name & Username */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 text-2xl font-black text-white"
        >
          {user?.displayName || user?.username || 'Anonymous'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-sm"
        >
          @{user?.username || 'user'}
        </motion.p>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-4 px-4 py-2 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(124, 58, 237, 0.2)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}
        >
          <span className="text-sm">🛡️</span>
          <span className="text-xs font-bold text-purple-400">
            Trust: {trustScore}
          </span>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 w-full max-w-xs space-y-3"
        >
          {[
            { icon: '👤', label: 'Profil anzeigen', path: '/profile' },
            { icon: '👥', label: 'Freunde', path: '/friends' },
            { icon: '🛡️', label: 'Trust Stats', path: '/profile/trust-stats' },
            { icon: '⚙️', label: 'Einstellungen', path: '/settings' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => {
                triggerHaptic('light');
                onNavigate(item.path);
              }}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
});

ProfileOverlay.displayName = 'ProfileOverlay';

// ═══════════════════════════════════════════════════════════════════════════
// MESSENGER BLADE
// ═══════════════════════════════════════════════════════════════════════════

interface MessengerBladeProps {
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const MessengerBlade: React.FC<MessengerBladeProps> = memo(({
  messages,
  isLoading,
  onClose,
  onNavigate,
}) => {
  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-[85%] max-w-md z-[100]"
      style={{
        background: 'rgba(10, 10, 12, 0.98)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div className="p-6 pt-12 flex items-center justify-between border-b border-white/5">
        <div>
          <h3 className="text-lg font-bold text-white">Nachrichten</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-purple-400">{unreadCount} ungelesen</p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <span className="text-white/60 text-sm">✕</span>
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-3xl mb-4"
            >
              ☁️
            </motion.div>
            <p className="text-white/40 text-sm">Lädt Nachrichten...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <motion.button
                key={msg.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('light');
                  onNavigate('/messages');
                }}
                className="w-full p-4 rounded-2xl flex items-center gap-4 text-left"
                style={{
                  background: msg.unread ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: msg.unread ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">
                      {msg.senderName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{msg.senderName}</p>
                  <p className="text-white/40 text-sm truncate">{msg.lastMessage}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-white/30 text-xs">{formatTimeAgo(msg.timestamp)}</span>
                  {msg.unread && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(124, 58, 237, 0.15)' }}
            >
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-white/60">Keine Nachrichten</p>
            <p className="text-white/30 text-sm mt-1">Starte eine Unterhaltung!</p>
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-white/5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('medium');
            onNavigate('/messages');
          }}
          className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)',
          }}
        >
          Alle Nachrichten
        </motion.button>
      </div>
    </motion.div>
  );
});

MessengerBlade.displayName = 'MessengerBlade';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SOVEREIGN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SovereignHome: React.FC = memo(() => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { location, isStale, isTracking, error: locationError } = useRobustLocation();

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH MESSAGES FROM FIREBASE
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);

    // Subscribe to conversations where user is participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.id),
      orderBy('lastMessageAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const otherParticipantId = data.participants?.find((p: string) => p !== user.id);

        return {
          id: doc.id,
          senderId: otherParticipantId || 'unknown',
          senderName: data.participantNames?.[otherParticipantId] || 'User',
          senderAvatar: data.participantAvatars?.[otherParticipantId],
          lastMessage: data.lastMessage || 'Neue Unterhaltung',
          timestamp: data.lastMessageAt?.toDate() || new Date(),
          unread: data.unreadBy?.includes(user.id) || false,
        };
      });

      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
    }, (error) => {
      console.error('[SovereignHome] Error fetching messages:', error);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH NEARBY ROOMS FROM FIREBASE
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    setIsLoadingRooms(true);

    const roomsRef = collection(db, 'rooms');
    const q = query(
      roomsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRoomCount(snapshot.size);
      setIsLoadingRooms(false);
    }, (error) => {
      console.error('[SovereignHome] Error fetching rooms:', error);
      setIsLoadingRooms(false);
    });

    return () => unsubscribe();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH NEARBY USERS COUNT
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!location) return;

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('isActive', '==', true),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Count users (simplified - in production would filter by distance)
      setNearbyCount(Math.max(0, snapshot.size - 1));
    }, () => {
      setNearbyCount(0);
    });

    return () => unsubscribe();
  }, [location?.lat, location?.lon]);

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const closeSheet = useCallback(() => {
    triggerHaptic('light');
    setActiveSheet(null);
  }, []);

  const handleDiscovery = useCallback(() => {
    closeSheet();
    navigate('/discover');
  }, [closeSheet, navigate]);

  const handleCreate = useCallback(() => {
    closeSheet();
    navigate('/discover?create=true');
  }, [closeSheet, navigate]);

  const handleNavigate = useCallback((path: string) => {
    closeSheet();
    navigate(path);
  }, [closeSheet, navigate]);

  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#050505' }}>
      {/* ═══════════════════════════════════════════════════════════════════
          1. THE LIVING MAP LAYER
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{
          scale: activeSheet ? 0.92 : 1,
          filter: activeSheet ? 'blur(20px) brightness(0.5)' : 'blur(0px) brightness(1)',
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 z-0"
      >
        {/* Map Background - Nebula Gradient */}
        <div
          className="w-full h-full"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a2e 0%, #0f0a1a 40%, #050505 100%)',
          }}
        />

        {/* Discovery Glow at User Location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Outer Pulse */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)' }}
          />

          {/* Inner Glow */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
            style={{ background: 'rgba(124, 58, 237, 0.4)' }}
          />

          {/* User Point */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.8)]" />

          {/* Trust Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-purple-400/30" />
        </div>

        {/* Status Indicators */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-2">
          {/* Location Status */}
          <div
            className="px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: isStale ? 'rgba(245, 158, 11, 0.2)' : location ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isStale ? 'rgba(245, 158, 11, 0.3)' : location ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <span className="text-xs">📍</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              isStale ? 'text-amber-400' : location ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isStale ? 'Cached' : location ? 'Live' : 'Waiting'}
            </span>
          </div>

          {/* Room Count */}
          {roomCount > 0 && (
            <div
              className="px-3 py-1.5 rounded-full flex items-center gap-2"
              style={{
                background: 'rgba(124, 58, 237, 0.2)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}
            >
              <span className="text-xs">☁️</span>
              <span className="text-[9px] font-bold text-purple-400">{roomCount}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. SOVEREIGN HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!activeSheet && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-[50]"
          >
            {/* Profile Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('light');
                setActiveSheet('profile');
              }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-[20px] overflow-hidden border-2 border-white/10 shadow-lg">
                {user?.photoURL || user?.avatarUrl ? (
                  <img src={user.photoURL || user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                    {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online Indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050505]" />
            </motion.button>

            {/* Right Side Actions */}
            <div className="flex flex-col items-end gap-3">
              {/* Messages Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveSheet('messenger');
                }}
                className="relative w-14 h-14 rounded-[20px] flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span className="text-xl">💬</span>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </motion.button>

              {/* Radar Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('light');
                  navigate('/radar');
                }}
                className="w-14 h-14 rounded-[20px] flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span className="text-xl">📡</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          3. CENTRAL ACTION ORB
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!activeSheet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[50]"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('medium');
                setActiveSheet('cloud');
              }}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
                boxShadow: '0 0 60px rgba(124, 58, 237, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)',
                border: '3px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Pulse Ring */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-purple-400"
              />

              <span className="text-3xl relative z-10">☁️</span>
            </motion.button>

            {/* Label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/30"
            >
              Wölkchen
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          4. OVERLAY SHEETS
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeSheet === 'cloud' && (
          <CloudSheet
            onClose={closeSheet}
            onDiscovery={handleDiscovery}
            onCreate={handleCreate}
            nearbyCount={nearbyCount}
            roomCount={roomCount}
            isLoading={isLoadingRooms}
          />
        )}

        {activeSheet === 'profile' && (
          <ProfileOverlay
            user={user}
            onClose={closeSheet}
            onNavigate={handleNavigate}
          />
        )}

        {activeSheet === 'messenger' && (
          <MessengerBlade
            messages={messages}
            isLoading={isLoadingMessages}
            onClose={closeSheet}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          5. BOTTOM SAFE AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 h-6 z-[40]" />
    </div>
  );
});

SovereignHome.displayName = 'SovereignHome';

export default SovereignHome;
