/**
 * RoomsV2.tsx
 * 🎙️ SOVEREIGN ROOMS v39.0 - GODMODE FULL SYSTEM
 *
 * Features:
 * - Empty State: "Die Wolken sind leer. Eröffne die erste!"
 * - Persistence: User bleiben im Raum bis explizit verlassen
 * - Auto-Delete: participants === 0 -> Room wird gelöscht
 * - Discord-Grid: Klick auf User öffnet Overlay
 * - Room Creation: Nur Creator, keine Dummy-User
 *
 * @version 39.0.0 - GODMODE Architecture
 */

import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Radio,
  Users,
  Mic,
  MicOff,
  Lock,
  Eye,
  ChevronRight,
  Plus,
  Search,
  X,
  Sparkles,
  Globe,
  Zap,
  Star,
  UserPlus,
  Crown,
  MoreVertical,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { triggerHaptic } from '../lib/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface RoomParticipant {
  oderId: string;
  displayName: string;
  photoURL?: string;
  level: number;
  isHost: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Timestamp;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'anonymous';
  participants: RoomParticipant[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  hostId: string;
  userCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const getActivityLevel = (count: number): 'quiet' | 'active' | 'busy' | 'hot' => {
  if (count >= 6) return 'hot';
  if (count >= 4) return 'busy';
  if (count >= 2) return 'active';
  return 'quiet';
};

const getActivityColor = (level: ReturnType<typeof getActivityLevel>): string => {
  switch (level) {
    case 'hot': return '#ef4444';
    case 'busy': return '#f97316';
    case 'active': return '#22c55e';
    default: return '#6b7280';
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// USER OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface UserOverlayProps {
  user: RoomParticipant | null;
  isOpen: boolean;
  onClose: () => void;
  onGiveStar: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  currentUserId: string;
}

const UserOverlay = memo(function UserOverlay({
  user,
  isOpen,
  onClose,
  onGiveStar,
  onAddFriend,
  currentUserId,
}: UserOverlayProps) {
  if (!user) return null;

  const isSelf = user.oderId === currentUserId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-xs rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 15, 35, 0.98), rgba(10, 8, 20, 0.99))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info */}
            <div className="p-6 text-center">
              {/* Avatar */}
              <div
                className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                  border: `2px solid ${user.isHost ? '#fbbf24' : 'rgba(139, 92, 246, 0.4)'}`,
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white/70">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
                {user.isHost && <Crown size={16} className="text-amber-400" />}
              </div>
              <p className="text-xs text-white/40">Level {user.level}</p>

              {/* Status */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {user.isMuted ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20">
                    <MicOff size={12} className="text-red-400" />
                    <span className="text-[10px] text-red-400">Stumm</span>
                  </div>
                ) : user.isSpeaking ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20">
                    <Volume2 size={12} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Spricht</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
                    <Mic size={12} className="text-white/40" />
                    <span className="text-[10px] text-white/40">Zuhören</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isSelf && (
              <div className="p-4 pt-0 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('medium');
                    onGiveStar(user.oderId);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <Star size={18} className="text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Stern vergeben</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('light');
                    onAddFriend(user.oderId);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <UserPlus size={18} className="text-white/60" />
                  <span className="text-sm font-medium text-white/60">Freundschaftsanfrage</span>
                </motion.button>
              </div>
            )}

            {/* Close */}
            <div className="p-4 pt-0">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-2 text-xs text-white/30"
              >
                Schließen
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPANT GRID (Discord Style)
// ═══════════════════════════════════════════════════════════════════════════

interface ParticipantGridProps {
  participants: RoomParticipant[];
  onUserClick: (user: RoomParticipant) => void;
}

const ParticipantGrid = memo(function ParticipantGrid({ participants, onUserClick }: ParticipantGridProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        Noch keine Teilnehmer
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {participants.map((participant) => (
        <motion.button
          key={participant.oderId}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light');
            onUserClick(participant);
          }}
          className="flex flex-col items-center p-2 rounded-xl"
          style={{
            background: participant.isSpeaking ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: participant.isSpeaking ? '2px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-12 h-12 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: participant.isHost ? '2px solid #fbbf24' : 'none',
              }}
            >
              {participant.photoURL ? (
                <img src={participant.photoURL} alt={participant.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white/60">
                    {participant.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Host Badge */}
            {participant.isHost && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              >
                <Crown size={8} className="text-black" />
              </div>
            )}

            {/* Mute/Speaking indicator */}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: participant.isMuted ? '#ef4444' : participant.isSpeaking ? '#22c55e' : '#6b7280',
              }}
            >
              {participant.isMuted ? (
                <MicOff size={10} className="text-white" />
              ) : participant.isSpeaking ? (
                <Volume2 size={10} className="text-white" />
              ) : (
                <Mic size={10} className="text-white" />
              )}
            </div>
          </div>

          {/* Name */}
          <p className="text-[10px] text-white/60 mt-2 truncate w-full text-center">
            {participant.displayName}
          </p>
        </motion.button>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ROOM CARD
// ═══════════════════════════════════════════════════════════════════════════

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
}

const RoomCard = memo(function RoomCard({ room, onJoin }: RoomCardProps) {
  const activityLevel = getActivityLevel(room.participants.length);
  const activityColor = getActivityColor(activityLevel);

  const getTypeIcon = () => {
    switch (room.type) {
      case 'anonymous': return <Eye size={14} className="text-violet-400" />;
      case 'private': return <Lock size={14} className="text-amber-400" />;
      default: return <Globe size={14} className="text-emerald-400" />;
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onJoin();
      }}
      className="w-full p-5 rounded-2xl text-left"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Activity Indicator */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center relative flex-shrink-0"
          style={{
            background: `${activityColor}20`,
            border: `1px solid ${activityColor}40`,
          }}
        >
          <Radio size={24} style={{ color: activityColor }} />
          {room.participants.length > 0 && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ border: `2px solid ${activityColor}` }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-bold text-white truncate">{room.name}</p>
            {activityLevel === 'hot' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400">
                🔥 HOT
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {getTypeIcon()}
              <span className="text-[11px] text-white/50">
                {room.type === 'anonymous' ? 'Anonym' : room.type === 'private' ? 'Privat' : 'Öffentlich'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-white/40" />
              <span className="text-[11px] text-white/60">
                <span className="text-white font-semibold">{room.participants.length}</span>/{room.maxParticipants}
              </span>
            </div>
          </div>
        </div>

        {/* Join */}
        <div
          className="px-4 py-2 rounded-xl"
          style={{
            background: `${activityColor}20`,
            border: `1px solid ${activityColor}40`,
          }}
        >
          <span className="text-xs font-bold" style={{ color: activityColor }}>Join</span>
        </div>
      </div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// CREATE ROOM MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: 'public' | 'private' | 'anonymous') => Promise<void>;
}

const CreateRoomModal = memo(function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'anonymous'>('public');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    await onCreate(name.trim(), type);
    setName('');
    setType('public');
    setIsCreating(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 15, 35, 0.98), rgba(10, 8, 20, 0.99))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-4 pb-2 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-white/10" />
            </div>

            <div className="p-5">
              <h2 className="text-lg font-bold text-white mb-5">Room erstellen</h2>

              {/* Name */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white/50 uppercase mb-2 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Late Night Talks"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 outline-none"
                />
              </div>

              {/* Type */}
              <div className="mb-5">
                <label className="text-xs font-bold text-white/50 uppercase mb-3 block">Typ</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'public' as const, icon: <Globe size={18} />, label: 'Öffentlich', color: '#22c55e' },
                    { value: 'private' as const, icon: <Lock size={18} />, label: 'Privat', color: '#fbbf24' },
                    { value: 'anonymous' as const, icon: <Eye size={18} />, label: 'Anonym', color: '#a855f7' },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setType(option.value)}
                      className="p-3 rounded-xl flex flex-col items-center gap-2"
                      style={{
                        background: type === option.value ? `${option.color}15` : 'rgba(255, 255, 255, 0.02)',
                        border: type === option.value ? `1px solid ${option.color}40` : '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <span style={{ color: type === option.value ? option.color : 'rgba(255, 255, 255, 0.4)' }}>
                        {option.icon}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: type === option.value ? option.color : 'rgba(255, 255, 255, 0.4)' }}>
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Create Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                }}
              >
                {isCreating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Sparkles size={18} />
                    Room erstellen
                  </>
                )}
              </motion.button>
            </div>

            <div className="h-6 sm:h-0" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function RoomsV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RoomParticipant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Open create modal from URL param
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Subscribe to rooms
  useEffect(() => {
    // Timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const roomsQuery = query(
      collection(db, 'rooms'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        clearTimeout(loadingTimeout);
        const fetchedRooms: Room[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Unnamed Room',
            description: data.description,
            type: data.type || 'public',
            participants: data.participants || [],
            maxParticipants: data.maxParticipants || 8,
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            hostId: data.hostId || data.createdBy,
            userCount: data.userCount || (data.participants || []).length,
          };
        });

        // Sort: Most participants first
        fetchedRooms.sort((a, b) => b.participants.length - a.participants.length);
        setRooms(fetchedRooms);
        setIsLoading(false);
      },
      (error) => {
        console.error('[RoomsV2] Firebase error:', error);
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  // Create room - ONLY creator, empty participants
  const handleCreateRoom = useCallback(async (name: string, type: 'public' | 'private' | 'anonymous') => {
    if (!user?.id) return;

    try {
      const roomData = {
        name,
        type,
        participants: [], // EMPTY - only creator ID
        maxParticipants: 8,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user.id,
        hostId: user.id,
        userCount: 0,
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      navigate(`/room/${docRef.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }, [user?.id, navigate]);

  // Join room
  const handleJoinRoom = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  // Give star
  const handleGiveStar = useCallback(async (targetUserId: string) => {
    if (!user?.id) return;
    // Implement star giving logic
    console.log('Give star to:', targetUserId);
    triggerHaptic('success');
  }, [user?.id]);

  // Add friend
  const handleAddFriend = useCallback(async (targetUserId: string) => {
    if (!user?.id) return;
    // Implement friend request logic
    console.log('Send friend request to:', targetUserId);
    triggerHaptic('success');
  }, [user?.id]);

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="sticky top-0 z-[100] pt-safe">
        <div
          className="px-5 py-4"
          style={{
            background: 'rgba(5, 5, 5, 0.9)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Radio size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Rooms</h1>
                <p className="text-xs text-white/40">{rooms.length} aktive Rooms</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
              }}
            >
              <Plus size={16} className="text-violet-400" />
              <span className="text-xs font-bold text-violet-400">Erstellen</span>
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rooms durchsuchen..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Sparkles size={40} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Die Wolken sind leer.</h3>
            <p className="text-sm text-white/40 mb-8">Eröffne den ersten Room!</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 rounded-2xl inline-flex items-center gap-3 font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Radio size={20} />
              Room erstellen
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={() => handleJoinRoom(room.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRoom}
      />

      {/* User Overlay */}
      <UserOverlay
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onGiveStar={handleGiveStar}
        onAddFriend={handleAddFriend}
        currentUserId={user?.id || ''}
      />
    </div>
  );
}
