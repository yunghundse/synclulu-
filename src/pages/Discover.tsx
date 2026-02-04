/**
 * Discover.tsx
 * 🔍 DISCOVER - Voice Rooms & Hotspots
 *
 * Features:
 * - Echte DB Räume anzeigen
 * - Räume erstellen
 * - Aktive Räume sehen
 * - Keine Demo-Daten
 *
 * @version 34.0.0 - Complete Rebuild
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Clock,
  MapPin,
  Mic,
  Lock,
  Globe,
  EyeOff,
  RefreshCw,
  Loader2,
  X,
  Cloud,
  Compass,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { collection, onSnapshot, addDoc, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

interface VoiceRoom {
  id: string;
  name: string;
  type: 'public' | 'private';
  isAnonymous: boolean;
  participants: {
    oderId: string;
    displayName: string;
    isSpeaking: boolean;
  }[];
  maxParticipants: number;
  createdAt: Date;
  createdBy: string;
}

export default function Discover() {
  const navigate = useNavigate();
  const { user } = useStore();

  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomAnonymous, setNewRoomAnonymous] = useState(false);

  // Load rooms from DB
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');

    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const loadedRooms: VoiceRoom[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          loadedRooms.push({
            id: doc.id,
            name: data.name || 'Unbenannt',
            type: data.type || 'public',
            isAnonymous: data.isAnonymous || false,
            participants: (data.participants || []).map((p: any) => ({
              oderId: p.oderId || p.id,
              displayName: p.displayName || 'Anonym',
              isSpeaking: p.isSpeaking || false,
            })),
            maxParticipants: data.maxParticipants || 8,
            createdAt: data.createdAt?.toDate() || new Date(),
            createdBy: data.createdBy || '',
          });
        }
      });

      // Sort by creation date
      loadedRooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRooms(loadedRooms);
      setLoading(false);
    }, (error) => {
      console.error('[Discover] Error loading rooms:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  // Create Room
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user?.id) return;

    setCreating(true);
    try {
      const roomData = {
        name: newRoomName.trim(),
        type: newRoomType,
        isAnonymous: newRoomAnonymous,
        participants: [{
          oderId: user.id,
          displayName: newRoomAnonymous ? 'Wanderer' : (user.displayName || 'Anonym'),
          isSpeaking: false,
          isMuted: true,
          joinedAt: Timestamp.now(),
        }],
        maxParticipants: 8,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user.id,
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);

      // Navigate to room
      navigate(`/room/${docRef.id}`);

      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomType('public');
      setNewRoomAnonymous(false);
    } catch (error) {
      console.error('[Discover] Error creating room:', error);
    }
    setCreating(false);
  };

  // Join Room
  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  // Format time
  const formatDuration = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Stats
  const totalUsersInRooms = rooms.reduce((acc, r) => acc + r.participants.length, 0);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/50 text-sm">Lade Wölkchen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Compass size={24} className="text-purple-400" />
              Entdecken
            </h1>
            <p className="text-sm text-white/40">
              {totalUsersInRooms > 0
                ? `${totalUsersInRooms} User in ${rooms.length} Wölkchen`
                : 'Keine aktiven Wölkchen'}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
            >
              <Plus size={20} className="text-purple-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <RefreshCw size={18} className={`text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {rooms.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <Cloud size={48} className="text-purple-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">
              Noch keine Wölkchen
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-xs mx-auto">
              Erstelle das erste Wölkchen und warte auf andere Nutzer in deiner Nähe!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <Plus size={18} />
              Wölkchen erstellen
            </motion.button>
          </div>
        ) : (
          /* Room List */
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                      {room.isAnonymous && <EyeOff size={12} className="text-purple-400" />}
                      {room.type === 'private' && <Lock size={12} className="text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {room.participants.length}/{room.maxParticipants}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(room.createdAt)}
                      </span>
                    </div>
                  </div>

                  {room.participants.some(p => p.isSpeaking) && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-green-400 font-medium">Aktiv</span>
                    </div>
                  )}
                </div>

                {/* Participants */}
                {room.participants.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {room.participants.slice(0, 4).map((p, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            p.isSpeaking ? 'ring-2 ring-green-400' : ''
                          }`}
                          style={{
                            background: room.isAnonymous ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid #050505',
                            color: 'white',
                          }}
                        >
                          {room.isAnonymous ? '?' : p.displayName[0]}
                        </div>
                      ))}
                      {room.participants.length > 4 && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '2px solid #050505', color: 'white' }}
                        >
                          +{room.participants.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Join Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.participants.length >= room.maxParticipants}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium text-white disabled:opacity-50"
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <Mic size={16} />
                  {room.isAnonymous ? 'Anonym beitreten' : 'Beitreten'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-3xl"
              style={{ background: '#0a0a0a', border: '1px solid rgba(168, 85, 247, 0.2)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Wölkchen erstellen</h2>
                <button onClick={() => setShowCreateModal(false)}>
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Name</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="z.B. Chill Lounge"
                    maxLength={30}
                    className="w-full p-3 rounded-xl text-white text-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', outline: 'none' }}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Typ</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewRoomType('public')}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${
                        newRoomType === 'public'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      <Globe size={16} />
                      Öffentlich
                    </button>
                    <button
                      onClick={() => setNewRoomType('private')}
                      className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium ${
                        newRoomType === 'private'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      <Lock size={16} />
                      Privat
                    </button>
                  </div>
                </div>

                {/* Anonymous */}
                <button
                  onClick={() => setNewRoomAnonymous(!newRoomAnonymous)}
                  className="w-full p-4 rounded-xl flex items-center gap-3"
                  style={{
                    background: newRoomAnonymous ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: newRoomAnonymous ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      newRoomAnonymous ? 'bg-purple-500' : 'bg-white/10'
                    }`}
                  >
                    {newRoomAnonymous && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <EyeOff size={14} className="text-purple-400" />
                      Anonymes Wölkchen
                    </p>
                    <p className="text-xs text-white/40">Alle werden als "Wanderer" angezeigt</p>
                  </div>
                </button>
              </div>

              {/* Create Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || creating}
                className="w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white disabled:opacity-50"
                style={{ background: 'rgba(168, 85, 247, 0.3)', border: '1px solid rgba(168, 85, 247, 0.4)' }}
              >
                {creating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Erstellen
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
