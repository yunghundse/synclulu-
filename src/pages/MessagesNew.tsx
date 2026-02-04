/**
 * MessagesNew.tsx
 * Chat-System 2.0 - Radikal Neuaufbau
 *
 * Features:
 * - Dunkles Obsidian-Glas Design
 * - Pulsierende Wölkchen-Avatare (Kaugummi-Style)
 * - Klick auf Avatar = Profil öffnen
 * - Klick auf Text = Chat öffnen
 * - Global Header mit Profil
 * - Real-time Updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Cloud, Crown, Edit } from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../contexts/UserProfileContext';
import { CloudChatList } from '../components/SovereignUI/CloudChatList';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime?: string;
  isOnline?: boolean;
  unreadCount?: number;
}

// ═══════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════
const MessagesHeader = ({
  profile,
  onProfileClick,
  onSearch,
}: {
  profile: any;
  onProfileClick: () => void;
  onSearch: () => void;
}) => {
  const accentColor = profile?.isFounder ? '#fbbf24' : '#a855f7';

  return (
    <div
      className="sticky top-0 z-[100] px-5 pt-12 pb-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(5, 5, 5, 0.98) 0%, rgba(5, 5, 5, 0.9) 70%, transparent 100%)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        {/* Profile Mini */}
        <motion.div
          onClick={onProfileClick}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="relative">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-10 h-10 rounded-xl object-cover"
                style={{
                  border: `2px solid ${accentColor}40`,
                }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                  border: `2px solid ${accentColor}40`,
                }}
              >
                <span className="text-sm font-bold text-white">
                  {(profile?.displayName || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {profile?.isFounder && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                }}
              >
                <Crown size={8} className="text-black" />
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-white">
              {profile?.displayName || 'Anonym'}
            </span>
            <span
              className="block text-[9px] uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              {profile?.isFounder ? '👑 Founder' : `Level ${profile?.level || 1}`}
            </span>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onSearch}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Search size={18} className="text-white/50" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(168, 85, 247, 0.15)' }}
          >
            <Edit size={18} className="text-violet-400" />
          </motion.button>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-black text-white">Nachrichten</h1>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SEARCH OVERLAY
// ═══════════════════════════════════════════════════════════════
const SearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-[140px] left-5 right-5 z-[110]"
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={18} className="text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Freunde suchen..."
            autoFocus
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
          />
          <button onClick={onClose} className="text-white/40 text-sm">
            Abbrechen
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MessagesNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();

  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ───────────────────────────────────────────────────────────
  // Fetch Conversations
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Query für Conversations des Users
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.id),
        orderBy('lastMessageAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        conversationsQuery,
        async (snapshot) => {
          const convos: ChatConversation[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Get the other participant's ID
            const otherUserId = data.participants?.find((p: string) => p !== user.id);

            if (otherUserId) {
              // Fetch other user's profile
              try {
                const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
                const otherUserData = otherUserDoc.data();

                convos.push({
                  id: docSnap.id,
                  name: otherUserData?.displayName || otherUserData?.username || 'Unbekannt',
                  avatar: otherUserData?.photoURL,
                  lastMessage: data.lastMessage || 'Keine Nachricht',
                  lastMessageTime: formatTime(data.lastMessageAt?.toDate()),
                  isOnline: otherUserData?.isActive || false,
                  unreadCount: data.unreadCount?.[user.id] || 0,
                });
              } catch {
                // Skip if user not found
              }
            }
          }

          setConversations(convos);
          setIsLoading(false);
        },
        (error) => {
          console.log('Conversations query:', error.code);
          setConversations([]);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────
  const handleProfileClick = useCallback((friendId: string) => {
    navigate(`/user/${friendId}`);
  }, [navigate]);

  const handleChatClick = useCallback((conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  }, [navigate]);

  // Filter conversations by search
  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: '#050505' }}
    >
      {/* Header mit Profil */}
      <MessagesHeader
        profile={profile}
        onProfileClick={() => navigate('/profile')}
        onSearch={() => setShowSearch(!showSearch)}
      />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Content */}
      <div className="px-5 pt-2">
        {isLoading || isLoadingProfile ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <CloudChatList
            friends={filteredConversations}
            onProfileClick={handleProfileClick}
            onChatClick={handleChatClick}
            emptyMessage="Noch keine Gespräche. Starte ein neues!"
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function formatTime(date?: Date): string {
  if (!date) return '';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Jetzt';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}
