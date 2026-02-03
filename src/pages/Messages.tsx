/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MESSAGES v14.1 - "Proximity-Messenger" Edition with Swipe Navigation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Proximity-Radar Header (Mini-Live-Map with nearby friends)
 * - Distance-Badges on chat list items
 * - Proximity-Sorter (sorts chats by spatial proximity)
 * - Live voice room join buttons in chat list
 * - Horizontal swipe navigation between Inbox and Map views
 * - Full Vibe-Heatmap integration
 *
 * @author Lead System Architect (Snap Map × Telegram)
 * @version 14.1.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import {
  MessageCircle, Search, Users, UserCheck, Shield,
  ChevronRight, Compass, Loader2, MapPin, Headphones,
  Radio, Sparkles, ArrowUpDown, Map, Inbox
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { UI_COPY } from '@/lib/uiCopy';
import { ProximityRadar } from '@/components/ProximityRadar';
import { VibeMap } from '@/components/VibeMap';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatContact {
  id: string;
  oderId: string; // The other user's ID
  username: string;
  displayName: string;
  avatarUrl?: string;
  isFriend: boolean;
  metAt?: Date;
  lastMessage?: {
    content: string;
    createdAt: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
  isOnline: boolean;
  level: number;
  // v14.0 Proximity additions
  distance?: number; // Distance in meters
  location?: { latitude: number; longitude: number };
  inRoom?: boolean;
  roomId?: string;
  roomName?: string;
}

type SortMode = 'recent' | 'proximity' | 'unread';
type ViewMode = 'inbox' | 'map';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const SWIPE_THRESHOLD = 50; // Minimum swipe distance to trigger view change

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number | undefined): string {
  if (meters === undefined || meters === Infinity) return '';
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatMetTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return `vor ${Math.floor(days / 7)} Woche${days >= 14 ? 'n' : ''}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'met'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');

  // Swipe handling
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number>(0);
  const swipeCurrentX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const isFounder = user?.id === FOUNDER_UID;

  // ═══════════════════════════════════════════════════════════════════════════
  // Get user's current location
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Could not get location:', error);
          // Fallback to Berlin for testing
          if (isFounder) {
            setUserLocation({ latitude: 52.52, longitude: 13.405 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [isFounder]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch conversations with proximity data
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Query conversations where current user is a participant
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedContacts: ChatContact[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find((p: string) => p !== user.id);

        if (!otherUserId) continue;

        // Fetch the other user's data
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (!userDoc.exists()) continue;

          const userData = userDoc.data();

          // Check if they're friends
          const friendshipDoc = await getDoc(doc(db, 'friendships', `${user.id}_${otherUserId}`));
          const reverseFriendshipDoc = await getDoc(doc(db, 'friendships', `${otherUserId}_${user.id}`));
          const isFriend = friendshipDoc.exists() || reverseFriendshipDoc.exists();

          // Calculate unread count
          const unreadCount = data.unreadBy?.[user.id] || 0;

          // Calculate distance if location data is available
          let distance: number | undefined;
          const friendLocation = userData.lastLocation;
          if (userLocation && friendLocation?.latitude && friendLocation?.longitude) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              friendLocation.latitude,
              friendLocation.longitude
            );
          }

          const isOnline = userData.isActive &&
            userData.lastSeen?.toDate() > new Date(Date.now() - 5 * 60 * 1000);

          loadedContacts.push({
            id: docSnap.id,
            oderId: otherUserId,
            username: userData.username || 'unknown',
            displayName: userData.displayName || userData.username || 'Unbekannt',
            avatarUrl: userData.avatarUrl,
            isFriend,
            metAt: data.metAt?.toDate(),
            lastMessage: data.lastMessage ? {
              content: data.lastMessage.content,
              createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
              isFromMe: data.lastMessage.senderId === user.id,
            } : undefined,
            unreadCount,
            isOnline,
            level: userData.level || 1,
            // Proximity data
            distance,
            location: friendLocation ? {
              latitude: friendLocation.latitude,
              longitude: friendLocation.longitude,
            } : undefined,
            inRoom: !!userData.currentRoomId,
            roomId: userData.currentRoomId,
            roomName: userData.currentRoomName,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      setContacts(loadedContacts);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, userLocation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Filter & Sort Logic
  // ═══════════════════════════════════════════════════════════════════════════

  const filteredAndSortedContacts = useMemo(() => {
    let result = contacts.filter(contact => {
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!contact.username.toLowerCase().includes(query) &&
            !contact.displayName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Filter by tab
      if (activeTab === 'friends') return contact.isFriend;
      if (activeTab === 'met') return !contact.isFriend && contact.metAt;
      return true;
    });

    // Apply sort mode
    switch (sortMode) {
      case 'proximity':
        // Proximity sort: closest first, then by activity
        return [...result].sort((a, b) => {
          // Users in rooms get priority
          if (a.inRoom && !b.inRoom) return -1;
          if (!a.inRoom && b.inRoom) return 1;

          // Then by distance
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          if (distA !== distB) return distA - distB;

          // Fallback to recent message
          const timeA = a.lastMessage?.createdAt.getTime() || 0;
          const timeB = b.lastMessage?.createdAt.getTime() || 0;
          return timeB - timeA;
        });

      case 'unread':
        // Unread first, then by time
        return [...result].sort((a, b) => {
          if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
          const timeA = a.lastMessage?.createdAt.getTime() || 0;
          const timeB = b.lastMessage?.createdAt.getTime() || 0;
          return timeB - timeA;
        });

      case 'recent':
      default:
        // Recent first, unread prioritized
        return [...result].sort((a, b) => {
          if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
          const timeA = a.lastMessage?.createdAt.getTime() || 0;
          const timeB = b.lastMessage?.createdAt.getTime() || 0;
          return timeB - timeA;
        });
    }
  }, [contacts, searchQuery, activeTab, sortMode]);

  const friendCount = contacts.filter(c => c.isFriend).length;
  const metCount = contacts.filter(c => !c.isFriend && c.metAt).length;
  const totalUnread = contacts.reduce((acc, c) => acc + c.unreadCount, 0);
  const nearbyCount = contacts.filter(c => c.distance !== undefined && c.distance < 2000).length;

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Gestern';
    } else if (days < 7) {
      return date.toLocaleDateString('de-DE', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handle Actions
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFriendClick = (friendId: string) => {
    // Find the conversation with this friend
    const contact = contacts.find(c => c.oderId === friendId);
    if (contact) {
      navigate(`/chat/${contact.id}`);
    }
  };

  const handleRoomClick = (roomId: string) => {
    navigate('/discover', { state: { joinRoom: true, roomId } });
  };

  const handleJoinRoom = (contact: ChatContact) => {
    if (contact.roomId) {
      navigate('/discover', { state: { joinRoom: true, roomId: contact.roomId } });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Swipe Navigation Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    swipeCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const diff = swipeStartX.current - swipeCurrentX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && viewMode === 'inbox') {
        // Swipe left: show map
        setViewMode('map');
      } else if (diff < 0 && viewMode === 'map') {
        // Swipe right: show inbox
        setViewMode('inbox');
      }
    }

    isSwiping.current = false;
    swipeStartX.current = 0;
    swipeCurrentX.current = 0;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050505] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white/50 text-sm">Lade Nachrichten...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-[#050505] to-[#0a0a0a] safe-top pb-24 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          VIEW MODE TABS - Inbox / Map Toggle
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setViewMode('inbox')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'inbox'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Inbox size={16} />
            Inbox
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'map'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Map size={16} />
            Karte
            {nearbyCount > 0 && viewMode !== 'map' && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-400/50 text-white text-[10px] font-bold">
                {nearbyCount}
              </span>
            )}
          </button>
        </div>

        {/* Swipe hint indicator */}
        <div className="flex justify-center mt-2">
          <div className="flex gap-1.5">
            <div className={`w-6 h-1 rounded-full transition-all ${viewMode === 'inbox' ? 'bg-purple-500' : 'bg-white/20'}`} />
            <div className={`w-6 h-1 rounded-full transition-all ${viewMode === 'map' ? 'bg-purple-500' : 'bg-white/20'}`} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SWIPEABLE VIEW CONTAINER
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          /* ═══════════════════════════════════════════════════════════════════
             MAP VIEW - Full Vibe Heatmap
             ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="map-view"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-[calc(100vh-180px)]"
          >
            <VibeMap
              userLocation={userLocation}
              onFriendClick={handleFriendClick}
              onRoomClick={handleRoomClick}
              isFullscreen={false}
            />

            {/* Map Legend */}
            <div className="px-4 py-3 bg-[#0a0a0a] border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-white/50">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Online
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    Im Raum
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-500/30" />
                    Vibe Zone
                  </span>
                </div>
                {isFounder && (
                  <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                    <Sparkles size={10} />
                    Admin
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             INBOX VIEW - Chat List
             ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="inbox-view"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* ═══════════════════════════════════════════════════════════════════════
                PROXIMITY RADAR - Mini-Live-Map Header
                ═══════════════════════════════════════════════════════════════════════ */}
            <ProximityRadar
              userLocation={userLocation}
              onFriendClick={handleFriendClick}
              onRoomClick={handleRoomClick}
            />

            {/* Header */}
            <div className="px-6 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Nachrichten
            </h1>
            <p className="text-sm text-white/50">
              {totalUnread > 0 ? `${totalUnread} ungelesen` : nearbyCount > 0 ? `${nearbyCount} in der Nähe` : 'Keine neuen Nachrichten'}
            </p>
          </div>

          {/* Sort Mode Toggle */}
          <button
            onClick={() => {
              const modes: SortMode[] = ['recent', 'proximity', 'unread'];
              const currentIndex = modes.indexOf(sortMode);
              setSortMode(modes[(currentIndex + 1) % modes.length]);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs"
          >
            <ArrowUpDown size={14} />
            {sortMode === 'recent' && 'Neueste'}
            {sortMode === 'proximity' && 'Nähe'}
            {sortMode === 'unread' && 'Ungelesen'}
          </button>
        </div>

        {/* Search */}
        {contacts.length > 0 && (
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Kontakten..."
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
        )}

        {/* Tabs */}
        {contacts.length > 0 && (
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Alle', count: contacts.length },
              { id: 'friends', label: 'Freunde', count: friendCount, icon: UserCheck },
              { id: 'met', label: 'Getroffen', count: metCount, icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      {showInfoBanner && contacts.length > 0 && (
        <div className="px-6 mb-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white/80 font-medium">
                Privatsphäre geschützt
              </p>
              <p className="text-xs text-white/50 mt-1">
                Du kannst nur mit Freunden oder Usern chatten, die du bereits in der App getroffen hast.
              </p>
            </div>
            <button
              onClick={() => setShowInfoBanner(false)}
              className="text-white/30 hover:text-white/60"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Contact List */}
      <div className="px-6">
        {/* Empty State - No contacts */}
        {contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <MessageCircle size={40} className="text-white/30" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-3">
              {UI_COPY.empty.messages}
            </h3>
            <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto leading-relaxed">
              Triff Leute in Voice-Räumen oder füge Freunde hinzu, um Gespräche zu starten.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-display font-bold shadow-lg shadow-purple-500/25"
            >
              <Compass size={20} />
              Räume entdecken
            </button>
          </div>
        ) : filteredAndSortedContacts.length === 0 ? (
          /* Empty State - Search has no results */
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Search size={32} className="text-white/30" />
            </div>
            <h3 className="font-semibold text-white mb-2">
              Keine Ergebnisse
            </h3>
            <p className="text-sm text-white/50 mb-6 max-w-xs mx-auto">
              Versuche einen anderen Suchbegriff oder wechsle den Filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold"
            >
              Filter zurücksetzen
            </button>
          </div>
        ) : (
          /* Contact list */
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedContacts.map((contact, index) => (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(`/chat/${contact.id}`)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-white/10 transition-all group"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.displayName}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-display font-bold text-white text-lg">
                        {contact.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Online/In-Room indicator */}
                    {contact.inRoom ? (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50">
                        <Headphones size={10} className="text-white" />
                      </div>
                    ) : contact.isOnline ? (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                    ) : null}

                    {/* Unread badge */}
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {contact.displayName}
                      </p>
                      {contact.isFriend && (
                        <UserCheck size={14} className="text-green-400 flex-shrink-0" />
                      )}
                      <span className="text-[10px] text-white/30">
                        Lv.{contact.level}
                      </span>
                    </div>

                    {/* Last message or status */}
                    {contact.inRoom && contact.roomName ? (
                      <p className="text-sm text-purple-400 flex items-center gap-1">
                        <Radio size={12} className="animate-pulse" />
                        In: {contact.roomName}
                      </p>
                    ) : contact.lastMessage ? (
                      <p className={`text-sm truncate ${
                        contact.unreadCount > 0 ? 'text-white font-medium' : 'text-white/50'
                      }`}>
                        {contact.lastMessage.isFromMe && (
                          <span className="text-white/30">Du: </span>
                        )}
                        {contact.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-white/30 italic">
                        {contact.isFriend ? 'Noch keine Nachrichten' : `Getroffen ${formatMetTime(contact.metAt!)}`}
                      </p>
                    )}
                  </div>

                  {/* Right side: Time, Distance, Actions */}
                  <div className="flex flex-col items-end gap-1">
                    {/* Time */}
                    {contact.lastMessage && (
                      <span className="text-[10px] text-white/30">
                        {formatTime(contact.lastMessage.createdAt)}
                      </span>
                    )}

                    {/* Distance Badge */}
                    {contact.distance !== undefined && contact.distance < 50000 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                        <MapPin size={8} />
                        {formatDistance(contact.distance)}
                      </span>
                    )}

                    {/* Join Room Button */}
                    {contact.inRoom && contact.roomId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinRoom(contact);
                        }}
                        className="mt-1 text-[10px] px-2 py-1 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-400 transition-colors"
                      >
                        Anhören
                      </button>
                    ) : (
                      <ChevronRight size={18} className="text-white/20 group-hover:text-white/50 transition-colors" />
                    )}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

            {/* Founder Badge */}
            {isFounder && (
              <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm z-50">
                <span className="text-[10px] text-purple-400 flex items-center gap-2">
                  <Sparkles size={12} />
                  Founder View: Alle Distanzen sichtbar
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
