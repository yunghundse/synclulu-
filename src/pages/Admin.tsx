/**
 * Admin.tsx
 * 🔐 ADMIN DASHBOARD - Founder Only
 *
 * Features:
 * - Google Auth Login für Founder
 * - Room Management (Löschen, Status ändern)
 * - User Management (Premium, Sichtbarkeit, XP)
 * - System Settings (Wartungsmodus)
 *
 * @version 45.0.0 - Complete Admin Dashboard
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Settings,
  Users,
  Crown,
  Eye,
  EyeOff,
  Wrench,
  AlertTriangle,
  Check,
  Search,
  Star,
  Loader2,
  RefreshCw,
  Lock,
  LogIn,
  Trash2,
  Radio,
  X,
  Plus,
  Minus,
  Ban,
  CheckCircle,
} from 'lucide-react';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

// Founder UID
const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
const ADMIN_EMAILS = ['yunghundse@gmail.com', 'jan@butterbread.de', 'founder@synclulu.app'];

interface UserData {
  id: string;
  displayName: string;
  username: string;
  email?: string;
  xp: number;
  isPremium: boolean;
  isVisible: boolean;
  isBanned?: boolean;
  createdAt?: any;
}

interface RoomData {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  creatorName?: string;
  participantCount: number;
  isActive: boolean;
  createdAt?: any;
}

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user: storeUser } = useStore();
  const { user: authUser, signInWithGoogle, isLoading: authLoading } = useAuth();

  // Use either store user or auth user
  const user = storeUser || authUser;

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'rooms'>('users');
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'Wartungsarbeiten. Wir sind bald zurück!',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Rooms State
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Action feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is founder/admin
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return;

      if (!user?.id && !user?.email) {
        setLoading(false);
        return;
      }

      const isFounder = user.id === FOUNDER_UID;
      const isAdminEmail = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');

      if (isFounder || isAdminEmail) {
        setIsAuthorized(true);
        loadSettings();
        loadUsers();
        loadRooms();
      }
      setLoading(false);
    };

    checkAuth();
  }, [user?.id, user?.email, authLoading]);

  // Handle Google sign in
  const handleSignIn = async () => {
    setSigningIn(true);
    setLoginError(null);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setLoginError(result.error || 'Login fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('[Admin] Sign in error:', error);
      setLoginError(error.message || 'Login fehlgeschlagen');
    }
    setSigningIn(false);
  };

  // Show action feedback
  const showAction = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Load system settings
  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMessage: data.maintenanceMessage || 'Wartungsarbeiten. Wir sind bald zurück!',
        });
      }
    } catch (error) {
      console.error('[Admin] Error loading settings:', error);
    }
  };

  // Save system settings
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'system', 'settings'), {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        updatedAt: new Date(),
        updatedBy: user?.id || FOUNDER_UID,
      }, { merge: true });
      setSaveSuccess(true);
      showAction('success', 'Einstellungen gespeichert!');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('[Admin] Error saving settings:', error);
      showAction('error', 'Fehler beim Speichern');
    }
    setSavingSettings(false);
  };

  // Load users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'), limit(200));
      const snapshot = await getDocs(q);

      const loadedUsers: UserData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedUsers.push({
          id: docSnap.id,
          displayName: data.displayName || 'Unbekannt',
          username: data.username || 'unknown',
          email: data.email,
          xp: data.xp || 0,
          isPremium: data.isPremium || false,
          isVisible: data.isVisible !== false,
          isBanned: data.isBanned || false,
          createdAt: data.createdAt,
        });
      });

      setUsers(loadedUsers);
    } catch (error) {
      console.error('[Admin] Error loading users:', error);
    }
    setLoadingUsers(false);
  };

  // Load rooms
  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      const loadedRooms: RoomData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedRooms.push({
          id: docSnap.id,
          name: data.name || 'Unnamed Room',
          description: data.description,
          creatorId: data.creatorId || data.hostId,
          creatorName: data.creatorName || data.hostName,
          participantCount: data.participants?.length || 0,
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
        });
      });

      setRooms(loadedRooms);
    } catch (error) {
      console.error('[Admin] Error loading rooms:', error);
    }
    setLoadingRooms(false);
  };

  // Toggle user premium
  const togglePremium = async (userId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isPremium: !currentValue });
      setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentValue } : u));
      showAction('success', !currentValue ? 'Premium aktiviert!' : 'Premium deaktiviert');
    } catch (error) {
      console.error('[Admin] Error toggling premium:', error);
      showAction('error', 'Fehler');
    }
  };

  // Toggle user visibility
  const toggleVisibility = async (userId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVisible: !currentValue });
      setUsers(users.map(u => u.id === userId ? { ...u, isVisible: !currentValue } : u));
      showAction('success', !currentValue ? 'User sichtbar' : 'User versteckt');
    } catch (error) {
      console.error('[Admin] Error toggling visibility:', error);
      showAction('error', 'Fehler');
    }
  };

  // Toggle user ban
  const toggleBan = async (userId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !currentValue });
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentValue } : u));
      showAction('success', !currentValue ? 'User gebannt!' : 'User entbannt');
    } catch (error) {
      console.error('[Admin] Error toggling ban:', error);
      showAction('error', 'Fehler');
    }
  };

  // Add XP to user
  const addXP = async (userId: string, amount: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentXP = userDoc.data()?.xp || 0;
      await updateDoc(userRef, { xp: currentXP + amount });
      setUsers(users.map(u => u.id === userId ? { ...u, xp: u.xp + amount } : u));
      showAction('success', `+${amount} XP hinzugefügt`);
    } catch (error) {
      console.error('[Admin] Error adding XP:', error);
      showAction('error', 'Fehler');
    }
  };

  // Delete room
  const deleteRoom = async (roomId: string) => {
    if (!confirm('Room wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      setRooms(rooms.filter(r => r.id !== roomId));
      showAction('success', 'Room gelöscht!');
    } catch (error) {
      console.error('[Admin] Error deleting room:', error);
      showAction('error', 'Fehler beim Löschen');
    }
  };

  // Toggle room active
  const toggleRoomActive = async (roomId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { isActive: !currentValue });
      setRooms(rooms.map(r => r.id === roomId ? { ...r, isActive: !currentValue } : r));
      showAction('success', !currentValue ? 'Room aktiviert' : 'Room deaktiviert');
    } catch (error) {
      console.error('[Admin] Error toggling room:', error);
      showAction('error', 'Fehler');
    }
  };

  // Reset all users to level 0
  const resetAllLevels = async () => {
    if (!confirm('Wirklich ALLE User auf Level 0 zurücksetzen?')) return;
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      let count = 0;
      for (const userDoc of snapshot.docs) {
        await updateDoc(doc(db, 'users', userDoc.id), { xp: 0, level: 0, totalXP: 0 });
        count++;
      }
      showAction('success', `${count} User zurückgesetzt!`);
      loadUsers();
    } catch (error) {
      console.error('[Admin] Error resetting levels:', error);
      showAction('error', 'Fehler beim Zurücksetzen');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT LOGGED IN - LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#050505' }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.95 }}
          className="absolute top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.6)',
          }}
        >
          <ArrowLeft size={26} className="text-white" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.10))',
            border: '3px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)',
          }}
        >
          <div
            className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6)',
            }}
          >
            <Shield size={56} className="text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">Admin Panel</h1>
          <p className="text-white/70 text-base mb-8">
            Melde dich mit deinem Founder-Account an
          </p>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border-2 border-red-500/50">
              <p className="text-red-400 text-sm font-medium">{loginError}</p>
            </div>
          )}

          <motion.button
            onClick={handleSignIn}
            disabled={signingIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl flex items-center justify-center gap-4 font-black text-lg text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 10px 35px rgba(139, 92, 246, 0.6)',
            }}
          >
            {signingIn ? (
              <Loader2 size={26} className="animate-spin" />
            ) : (
              <LogIn size={26} />
            )}
            {signingIn ? 'Anmelden...' : 'Mit Google anmelden'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT AUTHORIZED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#050505' }}>
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.95 }}
          className="absolute top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.6)',
          }}
        >
          <ArrowLeft size={26} className="text-white" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.10))',
            border: '3px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 20px 60px rgba(239, 68, 68, 0.4)',
          }}
        >
          <div
            className="w-28 h-28 mx-auto mb-8 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 12px 40px rgba(239, 68, 68, 0.6)',
            }}
          >
            <Lock size={56} className="text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">Zugriff verweigert</h1>
          <p className="text-white/70 text-base mb-4">
            Dieser Bereich ist nur für Admins zugänglich.
          </p>
          <p className="text-white/50 text-sm mb-8">
            Angemeldet als: {user.email || user.displayName}
          </p>

          <motion.button
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 10px 35px rgba(139, 92, 246, 0.6)',
            }}
          >
            <ArrowLeft size={24} />
            Zurück zur App
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZED - ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold"
            style={{
              background: actionMessage.type === 'success'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2 text-white">
              {actionMessage.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
              {actionMessage.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 py-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(180deg, #050505, transparent)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 25px rgba(139, 92, 246, 0.5)',
          }}
        >
          <ArrowLeft size={26} className="text-white" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield size={26} className="text-purple-400" />
            Admin Dashboard
          </h1>
        </div>
        <div
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 6px 20px rgba(251, 191, 36, 0.5)',
          }}
        >
          <Crown size={18} className="text-black" />
          <span className="text-sm font-black text-black">FOUNDER</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-4">
        <div
          className="flex gap-2 p-2 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {[
            { id: 'users', label: 'User', icon: Users, count: users.length },
            { id: 'rooms', label: 'Rooms', icon: Radio, count: rooms.length },
            { id: 'settings', label: 'System', icon: Settings },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
              style={
                activeTab === tab.id
                  ? {
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
                    }
                  : { background: 'transparent' }
              }
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-white/50'} />
              <span className={activeTab === tab.id ? 'text-white' : 'text-white/50'}>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {/* ═══════════════════════════════════════════════════════════════════
            USERS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="User suchen (Name, Username, Email)..."
                className="w-full pl-14 pr-5 py-4 rounded-2xl text-white text-base font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Refresh */}
            <motion.button
              onClick={loadUsers}
              disabled={loadingUsers}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              <RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''} />
              Aktualisieren
            </motion.button>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl"
                  style={{
                    background: u.isBanned
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: `2px solid ${u.isBanned ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-white flex items-center gap-2">
                        {u.displayName}
                        {u.isPremium && <Star size={16} className="text-amber-400" />}
                        {u.id === FOUNDER_UID && <Crown size={16} className="text-amber-400" />}
                        {u.isBanned && <Ban size={16} className="text-red-400" />}
                      </p>
                      <p className="text-sm text-white/50">@{u.username}</p>
                      <p className="text-xs text-white/30">{u.email}</p>
                    </div>
                    <div
                      className="px-4 py-2 rounded-xl flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <span className="text-sm font-black text-white">{u.xp} XP</span>
                    </div>
                  </div>

                  {/* Action Buttons Row 1 */}
                  <div className="flex gap-2 mb-2">
                    <motion.button
                      onClick={() => togglePremium(u.id, u.isPremium)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{
                        background: u.isPremium
                          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: u.isPremium ? 'black' : 'white',
                        boxShadow: u.isPremium ? '0 4px 15px rgba(251, 191, 36, 0.4)' : undefined,
                      }}
                    >
                      <Star size={16} />
                      {u.isPremium ? 'Premium' : 'Free'}
                    </motion.button>

                    <motion.button
                      onClick={() => toggleVisibility(u.id, u.isVisible)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        background: u.isVisible
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #6b7280, #4b5563)',
                        boxShadow: u.isVisible ? '0 4px 15px rgba(16, 185, 129, 0.4)' : undefined,
                      }}
                    >
                      {u.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                      {u.isVisible ? 'Sichtbar' : 'Hidden'}
                    </motion.button>
                  </div>

                  {/* Action Buttons Row 2 */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => addXP(u.id, 100)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                      }}
                    >
                      <Plus size={16} />
                      +100 XP
                    </motion.button>

                    <motion.button
                      onClick={() => toggleBan(u.id, u.isBanned || false)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        background: u.isBanned
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <Ban size={16} />
                      {u.isBanned ? 'Entbannen' : 'Bannen'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredUsers.length === 0 && !loadingUsers && (
              <div className="text-center py-12">
                <Users size={56} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-base">Keine User gefunden</p>
              </div>
            )}

            {loadingUsers && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ROOMS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Refresh */}
            <motion.button
              onClick={loadRooms}
              disabled={loadingRooms}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              <RefreshCw size={18} className={loadingRooms ? 'animate-spin' : ''} />
              Rooms laden
            </motion.button>

            {/* Room List */}
            <div className="space-y-3">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl"
                  style={{
                    background: room.isActive
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: `2px solid ${room.isActive ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white flex items-center gap-2">
                        <Radio size={18} className={room.isActive ? 'text-purple-400' : 'text-white/30'} />
                        {room.name}
                      </p>
                      <p className="text-sm text-white/50">von {room.creatorName || 'Unknown'}</p>
                      <p className="text-xs text-white/30">{room.participantCount} Teilnehmer</p>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: room.isActive
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: room.isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {room.isActive ? 'AKTIV' : 'INAKTIV'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => toggleRoomActive(room.id, room.isActive)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        background: room.isActive
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                      }}
                    >
                      {room.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      {room.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </motion.button>

                    <motion.button
                      onClick={() => deleteRoom(room.id)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <Trash2 size={16} />
                      Löschen
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {rooms.length === 0 && !loadingRooms && (
              <div className="text-center py-12">
                <Radio size={56} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-base">Keine Rooms vorhanden</p>
              </div>
            )}

            {loadingRooms && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SETTINGS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Maintenance Mode */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: settings.maintenanceMode
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))'
                  : 'rgba(255, 255, 255, 0.06)',
                border: `2px solid ${settings.maintenanceMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: settings.maintenanceMode
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: settings.maintenanceMode ? '0 6px 20px rgba(239, 68, 68, 0.5)' : undefined,
                    }}
                  >
                    <Wrench size={26} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Wartungsmodus</p>
                    <p className="text-sm text-white/50">App für alle sperren</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className="w-20 h-10 rounded-full p-1"
                  style={{
                    background: settings.maintenanceMode
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: settings.maintenanceMode ? '0 4px 15px rgba(239, 68, 68, 0.5)' : undefined,
                  }}
                >
                  <motion.div
                    className="w-8 h-8 rounded-full bg-white"
                    animate={{ x: settings.maintenanceMode ? 38 : 0 }}
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                  />
                </motion.button>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-4">
                  <label className="text-sm text-white/60 mb-2 block font-medium">Wartungsnachricht</label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full p-4 rounded-xl text-white text-base font-medium"
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <motion.button
              onClick={saveSettings}
              disabled={savingSettings}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg text-white"
              style={{
                background: saveSuccess
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                boxShadow: saveSuccess
                  ? '0 8px 30px rgba(16, 185, 129, 0.5)'
                  : '0 8px 30px rgba(139, 92, 246, 0.5)',
              }}
            >
              {savingSettings ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Check size={24} />
              )}
              {saveSuccess ? 'Gespeichert!' : 'Einstellungen speichern'}
            </motion.button>

            {/* Danger Zone */}
            <div
              className="p-5 rounded-2xl mt-8"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                border: '2px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-400" />
                <p className="text-lg font-bold text-red-400">Danger Zone</p>
              </div>

              <motion.button
                onClick={resetAllLevels}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 6px 25px rgba(239, 68, 68, 0.5)',
                }}
              >
                Alle User auf Level 0 zurücksetzen
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
