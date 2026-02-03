/**
 * DeluluApp.tsx
 * ☁️ NEBULA-SOVEREIGN v21.0 - Unified App Controller
 *
 * The One Component to Rule Them All:
 * - Unified view state (no nested navigation issues)
 * - Lobby system instead of Quick-Join
 * - Persistent location tracking
 * - Hard-wired Profile <-> Friends navigation
 *
 * @version 21.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

type ViewState = 'home' | 'lobby' | 'profile' | 'friends' | 'room';

interface Coordinates {
  lat: number;
  lon: number;
}

interface RoomData {
  id: string;
  name: string;
  count: number;
  creatorId: string;
  createdAt: Date;
  isPrivate: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  trustScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENT LOCATION TRACKER HOOK
// ═══════════════════════════════════════════════════════════════════════════

function usePersistentLocation(initialLocation?: Coordinates) {
  const [coords, setCoords] = useState<Coordinates | null>(initialLocation || null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.error('[Location] Initial position error:', err);
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch for position changes
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        console.error('[Location] Watch error:', err);
        // Don't clear coords on error - keep last known position
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // Cache for 30 seconds
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, []);

  return { coords, error, isTracking };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME VIEW (Discovery Mode)
// ═══════════════════════════════════════════════════════════════════════════

const HomeView: React.FC<{
  onOpenLobby: () => void;
  onOpenProfile: () => void;
}> = memo(({ onOpenLobby, onOpenProfile }) => {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-screen p-6"
    >
      {/* Discovery Orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic('medium');
          onOpenLobby();
        }}
        className="discovery-orb animate-sovereign-pulse"
      >
        <span className="text-5xl relative z-10">☁️</span>
      </motion.button>

      {/* Discovery Mode Label */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 sovereign-subtitle"
      >
        Discovery Mode
      </motion.h1>

      {/* Hint Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-xs text-white/30 text-center max-w-xs"
      >
        Tippe auf die Wolke, um Wölkchen in deiner Nähe zu entdecken
      </motion.p>

      {/* Profile Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => {
          triggerHaptic('light');
          onOpenProfile();
        }}
        className="fixed bottom-12 glass-card px-8 py-4 text-[10px] font-bold tracking-widest uppercase"
      >
        Mein Profil
      </motion.button>
    </motion.div>
  );
});

HomeView.displayName = 'HomeView';

// ═══════════════════════════════════════════════════════════════════════════
// LOBBY VIEW (Room Selection)
// ═══════════════════════════════════════════════════════════════════════════

const LobbyView: React.FC<{
  rooms: RoomData[];
  loading: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
}> = memo(({ rooms, loading, onClose, onJoinRoom, onCreateRoom }) => {
  return (
    <motion.div
      key="lobby"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="p-6 pt-12 max-w-md mx-auto h-screen flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="sovereign-title">WÖLKCHEN</h2>
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="text-[10px] font-bold opacity-50 uppercase tracking-widest hover:opacity-100 transition-opacity"
        >
          Schließen
        </button>
      </div>

      {/* Room List */}
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-24">
        {loading ? (
          <div className="sovereign-empty">
            <div className="text-2xl mb-4">☁️</div>
            <div>Suche Wölkchen...</div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="sovereign-empty">
            <div className="text-2xl mb-4">🌙</div>
            <div>Keine Wölkchen in der Nähe</div>
            <div className="mt-2 text-white/30">Starte das erste!</div>
          </div>
        ) : (
          rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="lobby-card"
            >
              <div className="lobby-card-info">
                <h3>{room.name || 'Anonymes Wölkchen'}</h3>
                <p>{room.count} {room.count === 1 ? 'Person' : 'Personen'}</p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onJoinRoom(room.id);
                }}
                className="lobby-join-btn"
              >
                Beitreten
              </button>
            </motion.div>
          ))
        )}

        {/* Create Room Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            triggerHaptic('light');
            onCreateRoom();
          }}
          className="create-room-btn"
        >
          + Neues Wölkchen starten
        </motion.button>
      </div>
    </motion.div>
  );
});

LobbyView.displayName = 'LobbyView';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════════════════════════════

const ProfileView: React.FC<{
  user: UserProfile;
  onShowFriends: () => void;
  onBack: () => void;
}> = memo(({ user, onShowFriends, onBack }) => {
  const isFounder = user.id === FOUNDER_UID;

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 pt-20 flex flex-col items-center min-h-screen"
    >
      {/* Avatar */}
      <div className="sovereign-avatar">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-4xl font-black">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        {user.isVerified && (
          <div className="sovereign-avatar-badge">Verified Trust</div>
        )}
        {isFounder && (
          <div className="absolute -top-2 -right-2 text-2xl">👑</div>
        )}
      </div>

      {/* Username */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 text-2xl font-black text-white"
      >
        {user.displayName || user.username}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-white/40 text-sm"
      >
        @{user.username}
      </motion.p>

      {/* Trust Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30"
      >
        <span className="text-xs font-bold text-purple-300">
          Trust Score: {user.trustScore}
        </span>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="w-full mt-12 space-y-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => {
            triggerHaptic('light');
            onShowFriends();
          }}
          className="sovereign-nav-btn"
        >
          <span className="text-xl">👥</span>
          <span>Freunde verwalten</span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="w-full text-center text-[10px] font-bold text-gray-600 tracking-widest uppercase py-4 hover:text-gray-400 transition-colors"
        >
          Zurück zum Radar
        </motion.button>
      </div>
    </motion.div>
  );
});

ProfileView.displayName = 'ProfileView';

// ═══════════════════════════════════════════════════════════════════════════
// FRIENDS VIEW
// ═══════════════════════════════════════════════════════════════════════════

const FriendsView: React.FC<{
  friends: UserProfile[];
  loading: boolean;
  onBack: () => void;
  onSelectFriend: (friendId: string) => void;
}> = memo(({ friends, loading, onBack, onSelectFriend }) => {
  return (
    <motion.div
      key="friends"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="p-8 pt-20 min-h-screen"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="sovereign-back-btn"
        >
          ← PROFIL
        </button>
        <h2 className="sovereign-title">DEINE AURA</h2>
      </div>

      {/* Friends List */}
      {loading ? (
        <div className="sovereign-empty">
          <div className="text-2xl mb-4">✨</div>
          <div>Lade Freunde...</div>
        </div>
      ) : friends.length === 0 ? (
        <div className="sovereign-empty">
          <div className="text-2xl mb-4">🌙</div>
          <div>Keine weiteren Kontakte in deiner Nähe</div>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                triggerHaptic('light');
                onSelectFriend(friend.id);
              }}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={friend.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">
                  {friend.displayName || friend.username}
                </p>
                <p className="text-xs text-white/40">@{friend.username}</p>
              </div>
              {friend.isVerified && (
                <span className="text-xs text-green-400">✓</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

FriendsView.displayName = 'FriendsView';

// ═══════════════════════════════════════════════════════════════════════════
// ROOM VIEW (Placeholder - connects to existing room logic)
// ═══════════════════════════════════════════════════════════════════════════

const RoomView: React.FC<{
  roomId: string;
  onLeave: () => void;
}> = memo(({ roomId, onLeave }) => {
  return (
    <motion.div
      key="room"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col items-center justify-center p-6"
    >
      <div className="text-center">
        <div className="text-6xl mb-6">☁️</div>
        <h2 className="sovereign-title mb-2">Im Wölkchen</h2>
        <p className="text-white/40 text-sm mb-8">Room ID: {roomId}</p>
        <button
          onClick={() => {
            triggerHaptic('medium');
            onLeave();
          }}
          className="glass-card px-8 py-4 text-[10px] font-bold tracking-widest uppercase text-red-400"
        >
          Verlassen
        </button>
      </div>
    </motion.div>
  );
});

RoomView.displayName = 'RoomView';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DELULU APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DeluluAppProps {
  initialLocation?: Coordinates;
  onRoomJoin?: (roomId: string) => void;
  onRoomLeave?: () => void;
}

export const DeluluApp: React.FC<DeluluAppProps> = memo(({
  initialLocation,
  onRoomJoin,
  onRoomLeave,
}) => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  const [availableRooms, setAvailableRooms] = useState<RoomData[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Persistent location tracking
  const { coords, isTracking } = usePersistentLocation(initialLocation);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            id: currentUser.uid,
            username: data.username || 'User',
            displayName: data.displayName,
            avatarUrl: data.photoURL,
            isVerified: data.isVerified || false,
            trustScore: data.trustScore || 500,
          });
        }
      } catch (error) {
        console.error('[DeluluApp] Error fetching profile:', error);
      }
    }

    fetchProfile();
  }, [currentUser?.uid]);

  // Open Lobby - Fetch nearby rooms
  const openLobby = useCallback(async () => {
    setView('lobby');
    setLoadingRooms(true);

    try {
      // Fetch active rooms (in production, this would use geohash filtering)
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(roomsQuery);
      const rooms: RoomData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || null,
          count: data.participantCount || 0,
          creatorId: data.creatorId,
          createdAt: data.createdAt?.toDate() || new Date(),
          isPrivate: data.isPrivate || false,
        };
      });

      setAvailableRooms(rooms);
    } catch (error) {
      console.error('[DeluluApp] Error fetching rooms:', error);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [coords]);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!currentUser?.uid) return;

    setLoadingFriends(true);

    try {
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('userIds', 'array-contains', currentUser.uid),
        where('status', '==', 'accepted'),
        limit(50)
      );

      const snapshot = await getDocs(friendshipsQuery);
      const friendIds = snapshot.docs.flatMap((doc) => {
        const data = doc.data();
        return (data.userIds as string[]).filter((id) => id !== currentUser.uid);
      });

      // Fetch friend profiles
      const friendProfiles: UserProfile[] = [];
      for (const friendId of friendIds.slice(0, 20)) {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (friendDoc.exists()) {
          const data = friendDoc.data();
          friendProfiles.push({
            id: friendId,
            username: data.username || 'User',
            displayName: data.displayName,
            avatarUrl: data.photoURL,
            isVerified: data.isVerified || false,
            trustScore: data.trustScore || 500,
          });
        }
      }

      setFriends(friendProfiles);
    } catch (error) {
      console.error('[DeluluApp] Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [currentUser?.uid]);

  // Join room
  const handleJoinRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setView('room');
    onRoomJoin?.(roomId);
  }, [onRoomJoin]);

  // Leave room
  const handleLeaveRoom = useCallback(() => {
    setActiveRoomId(null);
    setView('lobby');
    onRoomLeave?.();
  }, [onRoomLeave]);

  // Create room
  const handleCreateRoom = useCallback(() => {
    // This would open a room creation modal or navigate to room creation
    console.log('[DeluluApp] Create room requested');
    // For now, just log - integrate with existing room creation logic
  }, []);

  // Navigate to friends
  const handleShowFriends = useCallback(() => {
    setView('friends');
    fetchFriends();
  }, [fetchFriends]);

  // If no user, show loading
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen text-white relative flex items-center justify-center">
        <div className="nebula-glow" />
        <div className="text-white/40 text-sm">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Nebula Glow Background */}
      <div className="nebula-glow" />

      {/* View Router */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <HomeView
            onOpenLobby={openLobby}
            onOpenProfile={() => setView('profile')}
          />
        )}

        {view === 'lobby' && (
          <LobbyView
            rooms={availableRooms}
            loading={loadingRooms}
            onClose={() => setView('home')}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
          />
        )}

        {view === 'profile' && (
          <ProfileView
            user={userProfile}
            onShowFriends={handleShowFriends}
            onBack={() => setView('home')}
          />
        )}

        {view === 'friends' && (
          <FriendsView
            friends={friends}
            loading={loadingFriends}
            onBack={() => setView('profile')}
            onSelectFriend={(friendId) => {
              console.log('[DeluluApp] Friend selected:', friendId);
            }}
          />
        )}

        {view === 'room' && activeRoomId && (
          <RoomView
            roomId={activeRoomId}
            onLeave={handleLeaveRoom}
          />
        )}
      </AnimatePresence>

      {/* Location Status Indicator (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 text-[8px] text-white/20 font-mono">
          {isTracking ? '📍' : '⏳'}{' '}
          {coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'No location'}
        </div>
      )}
    </div>
  );
});

DeluluApp.displayName = 'DeluluApp';

export default DeluluApp;
