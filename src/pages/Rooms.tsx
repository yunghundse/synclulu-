/**
 * Rooms.tsx
 * 🚀 ROOMS DASHBOARD v38.0
 *
 * Interactive Rooms Dashboard replacing the map/discover
 * Sovereign Glass Design
 *
 * Features:
 * - Live room list with real-time updates
 * - Create room modal
 * - Filter by type (public/private/anonymous)
 * - Activity indicators
 * - Join rooms directly
 *
 * @version 38.0.0 - Rooms Dashboard Edition
 */

import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Users,
  Mic,
  Lock,
  Eye,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
  Globe,
  Shield,
  Zap,
} from 'lucide-react';
import {
  subscribeToActiveRooms,
  createRoom,
  getActivityLevel,
  getActivityColor,
  getActivityGlow,
  getActivityLabel,
  type Room,
  type CreateRoomParams,
} from '../lib/roomServiceV2';
import { useAuth } from '../hooks/useAuth';
import { triggerHaptic } from '../lib/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// ROOM CARD - Full Version
// ═══════════════════════════════════════════════════════════════════════════

interface RoomCardProps {
  room: Room;
  onJoin: (id: string) => void;
}

const RoomCard = memo(function RoomCard({ room, onJoin }: RoomCardProps) {
  const activityLevel = getActivityLevel(room.participants.length);
  const activityColor = getActivityColor(activityLevel);
  const activityGlow = getActivityGlow(activityLevel);

  const getTypeIcon = () => {
    switch (room.type) {
      case 'anonymous':
        return <Eye size={14} className="text-violet-400" />;
      case 'private':
        return <Lock size={14} className="text-amber-400" />;
      default:
        return <Globe size={14} className="text-emerald-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (room.type) {
      case 'anonymous':
        return 'Anonym';
      case 'private':
        return 'Privat';
      default:
        return 'Öffentlich';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        triggerHaptic('light');
        onJoin(room.id);
      }}
      className="w-full p-5 rounded-2xl text-left transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: activityGlow,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Activity Indicator */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center relative flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${activityColor}30, ${activityColor}10)`,
            border: `1px solid ${activityColor}50`,
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
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 animate-pulse">
                🔥 HOT
              </span>
            )}
          </div>

          {room.description && (
            <p className="text-xs text-white/40 truncate mb-2">{room.description}</p>
          )}

          <div className="flex items-center gap-4">
            {/* Type */}
            <div className="flex items-center gap-1.5">
              {getTypeIcon()}
              <span className="text-[11px] text-white/50">{getTypeLabel()}</span>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-white/40" />
              <span className="text-[11px] text-white/60">
                <span className="text-white font-semibold">{room.participants.length}</span>
                /{room.maxParticipants}
              </span>
            </div>

            {/* Speaking indicator */}
            {room.participants.some((p) => p.isSpeaking) && (
              <div className="flex items-center gap-1.5">
                <Mic size={12} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Join Button */}
        <div
          className="px-4 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: `${activityColor}20`,
            border: `1px solid ${activityColor}40`,
          }}
        >
          <span className="text-xs font-bold" style={{ color: activityColor }}>
            Join
          </span>
          <ChevronRight size={14} style={{ color: activityColor }} />
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
  onCreated: (roomId: string) => void;
  userId: string;
}

const CreateRoomModal = memo(function CreateRoomModal({
  isOpen,
  onClose,
  onCreated,
  userId,
}: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'anonymous'>('public');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    triggerHaptic('medium');

    const roomId = await createRoom({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      creatorId: userId,
      maxParticipants: 8,
    });

    if (roomId) {
      onCreated(roomId);
      onClose();
      setName('');
      setDescription('');
      setType('public');
    }

    setIsCreating(false);
  };

  const typeOptions = [
    {
      value: 'public' as const,
      icon: <Globe size={18} />,
      label: 'Öffentlich',
      desc: 'Jeder kann beitreten',
      color: '#22c55e',
    },
    {
      value: 'private' as const,
      icon: <Lock size={18} />,
      label: 'Privat',
      desc: 'Nur mit Einladung',
      color: '#fbbf24',
    },
    {
      value: 'anonymous' as const,
      icon: <Eye size={18} />,
      label: 'Anonym',
      desc: 'Keine Namen sichtbar',
      color: '#a855f7',
    },
  ];

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
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 15, 35, 0.98), rgba(10, 8, 20, 0.99))',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 -20px 60px rgba(139, 92, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Plus size={20} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Room erstellen</h2>
                  <p className="text-xs text-white/40">Starte einen neuen Voice Room</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <X size={18} className="text-white/40" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Name Input */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
                  Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Late Night Talks"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Worum geht es in diesem Room?"
                  maxLength={200}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 resize-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">
                  Room Typ
                </label>
                <div className="space-y-2">
                  {typeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setType(option.value)}
                      className="w-full p-4 rounded-xl flex items-center gap-3 transition-all"
                      style={{
                        background:
                          type === option.value
                            ? `${option.color}15`
                            : 'rgba(255, 255, 255, 0.02)',
                        border:
                          type === option.value
                            ? `1px solid ${option.color}40`
                            : '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${option.color}20`,
                          color: option.color,
                        }}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-white">{option.label}</p>
                        <p className="text-xs text-white/40">{option.desc}</p>
                      </div>
                      {type === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: option.color }}
                        >
                          <Zap size={12} className="text-black" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="p-5 pt-0">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-opacity disabled:opacity-50"
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

            {/* Safe Area */}
            <div className="h-6 sm:h-0" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// FILTER CHIPS
// ═══════════════════════════════════════════════════════════════════════════

type FilterType = 'all' | 'public' | 'private' | 'anonymous';

const FilterChips = ({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (filter: FilterType) => void;
}) => {
  const filters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Alle', icon: <Radio size={14} /> },
    { value: 'public', label: 'Öffentlich', icon: <Globe size={14} /> },
    { value: 'private', label: 'Privat', icon: <Lock size={14} /> },
    { value: 'anonymous', label: 'Anonym', icon: <Eye size={14} /> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(filter.value)}
          className="flex-shrink-0 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          style={{
            background:
              active === filter.value
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
            border:
              active === filter.value
                ? '1px solid rgba(139, 92, 246, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span className={active === filter.value ? 'text-violet-400' : 'text-white/40'}>
            {filter.icon}
          </span>
          <span
            className={`text-xs font-bold ${
              active === filter.value ? 'text-violet-400' : 'text-white/60'
            }`}
          >
            {filter.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Rooms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Subscribe to active rooms
  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
      setIsLoading(false);
    }, 50);

    return () => unsubscribe();
  }, []);

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    // Type filter
    if (filter !== 'all' && room.type !== filter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleJoin = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

  const handleRoomCreated = useCallback((roomId: string) => {
    navigate(`/room/${roomId}`);
  }, [navigate]);

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
                <p className="text-xs text-white/40">
                  {rooms.length} aktive Rooms
                </p>
              </div>
            </div>

            {/* Create Button */}
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
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rooms durchsuchen..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Chips */}
          <FilterChips active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Radio size={36} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {searchQuery || filter !== 'all'
                ? 'Keine Rooms gefunden'
                : 'Noch keine aktiven Rooms'}
            </h3>
            <p className="text-sm text-white/40 mb-6">
              {searchQuery || filter !== 'all'
                ? 'Versuche andere Suchbegriffe oder Filter'
                : 'Sei der Erste und erstelle einen neuen Room!'}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Sparkles size={18} />
              Room erstellen
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <RoomCard room={room} onJoin={handleJoin} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {user?.id && (
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleRoomCreated}
          userId={user.id}
        />
      )}
    </div>
  );
}
