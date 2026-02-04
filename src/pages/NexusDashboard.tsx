/**
 * NexusDashboard.tsx
 * 👑 SYNCLULU NEXUS - Admin Control Center
 *
 * Founder-Only Dashboard mit:
 * - Live Moderation Feed
 * - User Management (Premium vergeben)
 * - Room Management (Räume löschen)
 * - Wartungsmodus Toggle
 * - Global Stats
 *
 * Route: /nexus-admin (versteckt, nur für Founder)
 *
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Terminal,
  Cpu,
  Wifi,
  ChevronLeft,
  Crown,
  Cloud,
  Power,
  Settings,
  Search,
  Star,
  Ban,
  UserPlus,
  Sparkles,
} from 'lucide-react';

import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN UIDs (Founder Only)
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UIDS = [
  '3lonL4ruSPU53Vuwy1U9aLO4hLp2', // Jan - Founder
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface RoomData {
  id: string;
  name: string;
  creatorId: string;
  creatorName?: string;
  participantCount: number;
  createdAt: Date;
  isActive: boolean;
}

interface UserData {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  isPremium: boolean;
  role?: string;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════

const MetricCard = memo(function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'emerald',
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'emerald' | 'purple' | 'amber' | 'red' | 'blue';
  onClick?: () => void;
}) {
  const colors = {
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`p-5 rounded-2xl text-left transition-all ${onClick ? 'hover:scale-[1.02] cursor-pointer' : ''}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className={colors[color]} />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ROOM CARD
// ═══════════════════════════════════════════════════════════════════════════

const RoomCard = memo(function RoomCard({
  room,
  onDelete,
}: {
  room: RoomData;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Raum "${room.name}" wirklich löschen?`)) return;
    setIsDeleting(true);
    await onDelete(room.id);
  };

  return (
    <div
      className="p-4 rounded-xl flex items-center justify-between"
      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            room.isActive ? 'bg-emerald-500/20' : 'bg-white/5'
          }`}
        >
          <Cloud size={18} className={room.isActive ? 'text-emerald-400' : 'text-white/30'} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{room.name}</p>
          <p className="text-[10px] text-white/40">
            {room.participantCount} User • {room.creatorName || 'Unbekannt'}
          </p>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors group"
      >
        {isDeleting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
          />
        ) : (
          <Trash2 size={16} className="text-white/30 group-hover:text-red-400" />
        )}
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// USER CARD
// ═══════════════════════════════════════════════════════════════════════════

const UserCard = memo(function UserCard({
  user,
  onTogglePremium,
  onToggleBan,
}: {
  user: UserData;
  onTogglePremium: (id: string, isPremium: boolean) => void;
  onToggleBan: (id: string) => void;
}) {
  return (
    <div
      className="p-4 rounded-xl flex items-center justify-between"
      style={{ background: 'rgba(255, 255, 255, 0.02)' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users size={18} className="text-purple-400" />
            </div>
          )}
          {user.isPremium && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
              <Crown size={10} className="text-white" />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user.displayName}</p>
          <p className="text-[10px] text-white/40">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTogglePremium(user.id, !user.isPremium)}
          className={`p-2 rounded-lg transition-colors ${
            user.isPremium
              ? 'bg-amber-500/20 text-amber-400'
              : 'hover:bg-amber-500/10 text-white/30 hover:text-amber-400'
          }`}
          title={user.isPremium ? 'Premium entfernen' : 'Premium geben'}
        >
          <Crown size={16} />
        </button>
        <button
          onClick={() => onToggleBan(user.id)}
          className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
          title="User bannen"
        >
          <Ban size={16} />
        </button>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NexusDashboard() {
  const navigate = useNavigate();
  const { user } = useStore();

  // Get user ID from multiple sources
  const userId = user?.id || auth.currentUser?.uid || null;

  // Founder Check
  const isFounder = userId && FOUNDER_UIDS.includes(userId);

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'users' | 'settings'>('overview');
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Wait for auth
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Load Data
  useEffect(() => {
    if (!isFounder || isLoading) return;

    // Active Users
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('isOnline', '==', true)),
      (snapshot) => setActiveUsers(snapshot.size)
    );

    // All Rooms
    const unsubRooms = onSnapshot(
      query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(50)),
      (snapshot) => {
        const roomsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Room',
          creatorId: doc.data().creatorId,
          creatorName: doc.data().creatorName,
          participantCount: doc.data().participants?.length || 0,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          isActive: doc.data().isActive !== false,
        }));
        setRooms(roomsData);
        setTotalRooms(snapshot.size);
      }
    );

    // Premium User Count
    getDocs(query(collection(db, 'users'), where('isPremium', '==', true))).then(
      (snapshot) => setPremiumUsers(snapshot.size)
    );

    // Maintenance Mode
    getDoc(doc(db, 'system', 'config')).then((docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenanceMode(docSnap.data().maintenanceMode === true);
      }
    });

    // Connection Check
    const interval = setInterval(() => setIsConnected(navigator.onLine), 5000);

    return () => {
      unsubUsers();
      unsubRooms();
      clearInterval(interval);
    };
  }, [isFounder, isLoading]);

  // Search Users
  useEffect(() => {
    if (!isFounder || !searchQuery || searchQuery.length < 2) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      const snapshot = await getDocs(
        query(collection(db, 'users'), limit(20))
      );
      const filtered = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          displayName: doc.data().displayName || 'Unknown',
          email: doc.data().email || '',
          avatarUrl: doc.data().avatarUrl,
          isPremium: doc.data().isPremium === true,
          role: doc.data().role,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .filter(
          (u) =>
            u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      setUsers(filtered);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [isFounder, searchQuery]);

  // === ACTIONS ===

  // Delete Room
  const handleDeleteRoom = useCallback(async (roomId: string) => {
    setActionLoading(roomId);
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      // Also delete subcollections if needed
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      await Promise.all(messagesSnap.docs.map((d) => deleteDoc(d.ref)));
    } catch (error) {
      console.error('Delete room error:', error);
      alert('Fehler beim Löschen');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Toggle Premium
  const handleTogglePremium = useCallback(async (targetUserId: string, isPremium: boolean) => {
    setActionLoading(targetUserId);
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        isPremium,
        premiumUpdatedAt: serverTimestamp(),
        premiumUpdatedBy: userId,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, isPremium } : u))
      );
    } catch (error) {
      console.error('Toggle premium error:', error);
      alert('Fehler beim Aktualisieren');
    } finally {
      setActionLoading(null);
    }
  }, [userId]);

  // Ban User
  const handleBanUser = useCallback(async (targetUserId: string) => {
    if (!window.confirm('User wirklich bannen?')) return;
    setActionLoading(targetUserId);
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        isBanned: true,
        bannedAt: serverTimestamp(),
        bannedBy: userId,
      });
      alert('User gebannt');
    } catch (error) {
      console.error('Ban user error:', error);
      alert('Fehler beim Bannen');
    } finally {
      setActionLoading(null);
    }
  }, [userId]);

  // Toggle Maintenance
  const handleToggleMaintenance = useCallback(async () => {
    const newValue = !isMaintenanceMode;
    setActionLoading('maintenance');
    try {
      await updateDoc(doc(db, 'system', 'config'), {
        maintenanceMode: newValue,
        maintenanceMessage: newValue ? 'Wartungsarbeiten - Wir sind gleich zurück!' : '',
        maintenanceUpdatedAt: serverTimestamp(),
        maintenanceUpdatedBy: userId,
      });
      setIsMaintenanceMode(newValue);
    } catch (error) {
      console.error('Toggle maintenance error:', error);
      alert('Fehler beim Aktualisieren');
    } finally {
      setActionLoading(null);
    }
  }, [isMaintenanceMode, userId]);

  // === RENDER ===

  // Loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Cpu size={32} className="text-emerald-400/50" />
        </motion.div>
        <p className="text-[10px] text-white/30 mt-4 font-mono absolute bottom-1/2 translate-y-8">
          AUTHENTICATING...
        </p>
      </div>
    );
  }

  // Access Denied
  if (!isFounder) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-500/50 mx-auto mb-4" />
          <p className="text-sm font-bold text-red-400">ACCESS DENIED</p>
          <p className="text-[10px] text-white/30 mt-2">Founder-Only Area</p>
          <p className="text-[8px] text-white/20 mt-4 font-mono">UID: {userId || 'NOT_AUTH'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 rounded-full text-xs font-bold text-white/50 border border-white/10"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 font-mono pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5">
            <ChevronLeft size={20} className="text-white/40" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(251, 146, 60, 0.2))' }}>
            <Crown size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-amber-400">Nexus Control</h1>
            <p className="text-[9px] text-white/30">FOUNDER_MODE // v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[9px] text-white/30">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'overview', icon: Activity, label: 'Overview' },
          { key: 'rooms', icon: Cloud, label: 'Räume' },
          { key: 'users', icon: Users, label: 'User' },
          { key: 'settings', icon: Settings, label: 'System' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === tab.key
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Active_Users" value={activeUsers} icon={Users} color="emerald" />
            <MetricCard label="Total_Rooms" value={totalRooms} icon={Cloud} color="purple" />
            <MetricCard label="Premium_Users" value={premiumUsers} icon={Crown} color="amber" />
            <MetricCard
              label="Maintenance"
              value={isMaintenanceMode ? 'ON' : 'OFF'}
              icon={Power}
              color={isMaintenanceMode ? 'red' : 'emerald'}
              onClick={handleToggleMaintenance}
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleToggleMaintenance}
                disabled={actionLoading === 'maintenance'}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  isMaintenanceMode ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Power size={20} className={isMaintenanceMode ? 'text-red-400' : 'text-emerald-400'} />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Wartungsmodus</p>
                  <p className="text-[10px] text-white/40">{isMaintenanceMode ? 'Aktiv - Klicken zum Deaktivieren' : 'Inaktiv - Klicken zum Aktivieren'}</p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-all"
              >
                <UserPlus size={20} className="text-purple-400" />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Premium vergeben</p>
                  <p className="text-[10px] text-white/40">User suchen & upgraden</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* === ROOMS TAB === */}
      {activeTab === 'rooms' && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Alle Räume ({rooms.length})</h2>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {rooms.length > 0 ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} onDelete={handleDeleteRoom} />)
            ) : (
              <p className="text-center text-white/20 py-10">Keine Räume vorhanden</p>
            )}
          </div>
        </div>
      )}

      {/* === USERS TAB === */}
      {activeTab === 'users' && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="User suchen (Name oder Email)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {users.length > 0 ? (
              users.map((u) => (
                <UserCard key={u.id} user={u} onTogglePremium={handleTogglePremium} onToggleBan={handleBanUser} />
              ))
            ) : (
              <p className="text-center text-white/20 py-10">
                {searchQuery ? 'Keine User gefunden' : 'Suche eingeben...'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* === SETTINGS TAB === */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Maintenance Toggle */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMaintenanceMode ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                  <Power size={20} className={isMaintenanceMode ? 'text-red-400' : 'text-emerald-400'} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Wartungsmodus</p>
                  <p className="text-[10px] text-white/40">App für alle User sperren</p>
                </div>
              </div>
              <button
                onClick={handleToggleMaintenance}
                disabled={actionLoading === 'maintenance'}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  isMaintenanceMode
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {actionLoading === 'maintenance' ? '...' : isMaintenanceMode ? 'Deaktivieren' : 'Aktivieren'}
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">System Info</h3>
            <div className="space-y-2 text-[11px] font-mono">
              <p className="text-white/40">Founder: <span className="text-emerald-400">Authenticated</span></p>
              {/* UID removed for security - never display Firebase UIDs */}
              <p className="text-white/40">Version: <span className="text-white/60">2.0.0</span></p>
              <p className="text-white/40">Build: <span className="text-white/60">{new Date().toISOString().split('T')[0]}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
        <p className="text-[9px] text-amber-400/40 font-mono">👑 FOUNDER_ACCESS</p>
        <p className="text-[9px] text-white/20">{new Date().toLocaleTimeString('de-DE')}</p>
      </div>
    </div>
  );
}
