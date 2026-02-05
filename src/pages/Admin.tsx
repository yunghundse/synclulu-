/**
 * Admin.tsx
 * 🔐 ADMIN PANEL - Founder Only (Google Auth)
 *
 * Features:
 * - Nur Founder kann zugreifen (Google Account)
 * - Wartungsmodus Toggle
 * - Premium User Verwaltung
 * - User Sichtbarkeit Toggle
 *
 * @version 44.0.0 - Visibility Fix + Unified Design
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

interface UserData {
  id: string;
  displayName: string;
  username: string;
  email?: string;
  xp: number;
  isPremium: boolean;
  isVisible: boolean;
  createdAt?: any;
}

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  color?: string;
}> = ({ children, className = '', color }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: color ? `linear-gradient(135deg, ${color}30, ${color}15)` : 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: `2px solid ${color ? `${color}50` : 'rgba(255, 255, 255, 0.15)'}`,
      boxShadow: color ? `0 4px 20px ${color}30` : undefined,
    }}
  >
    {children}
  </div>
);

export default function Admin() {
  const navigate = useNavigate();
  const { user: storeUser } = useStore();
  const { user: authUser, signIn } = useAuth();

  // Use either store user or auth user
  const user = storeUser || authUser;

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');
  const [signingIn, setSigningIn] = useState(false);

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

  // Check if user is founder
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (user.id === FOUNDER_UID) {
      setIsAuthorized(true);
      loadSettings();
      loadUsers();
    }
    setLoading(false);
  }, [user?.id]);

  // Handle sign in
  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('[Admin] Sign in error:', error);
    }
    setSigningIn(false);
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
        updatedBy: FOUNDER_UID,
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('[Admin] Error saving settings:', error);
    }
    setSavingSettings(false);
  };

  // Load users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(100));
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
          createdAt: data.createdAt,
        });
      });

      setUsers(loadedUsers);
    } catch (error) {
      console.error('[Admin] Error loading users:', error);
    }
    setLoadingUsers(false);
  };

  // Toggle user premium
  const togglePremium = async (userId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isPremium: !currentValue,
      });
      setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentValue } : u));
    } catch (error) {
      console.error('[Admin] Error toggling premium:', error);
    }
  };

  // Toggle user visibility
  const toggleVisibility = async (userId: string, currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVisible: !currentValue,
      });
      setUsers(users.map(u => u.id === userId ? { ...u, isVisible: !currentValue } : u));
    } catch (error) {
      console.error('[Admin] Error toggling visibility:', error);
    }
  };

  // Reset all users to level 0
  const resetAllLevels = async () => {
    if (!confirm('Wirklich alle User auf Level 0 zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      let count = 0;
      for (const userDoc of snapshot.docs) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          xp: 0,
          level: 0,
          totalXP: 0,
        });
        count++;
      }

      alert(`${count} User wurden auf Level 0 zurückgesetzt!`);
      loadUsers();
    } catch (error) {
      console.error('[Admin] Error resetting levels:', error);
      alert('Fehler beim Zurücksetzen!');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Not logged in - Show login button
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#050505' }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
          }}
        >
          <ArrowLeft size={22} className="text-white" />
        </motion.button>

        <GlassCard className="w-full max-w-sm p-8 text-center" color="#8b5cf6">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.5)',
            }}
          >
            <Shield size={48} className="text-white" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">Admin Panel</h1>
          <p className="text-white/60 text-sm mb-8">
            Melde dich mit deinem Founder-Account an
          </p>

          <motion.button
            onClick={handleSignIn}
            disabled={signingIn}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 6px 25px rgba(139, 92, 246, 0.5)',
            }}
          >
            {signingIn ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <LogIn size={22} />
            )}
            {signingIn ? 'Anmelden...' : 'Mit Google anmelden'}
          </motion.button>
        </GlassCard>
      </div>
    );
  }

  // Not authorized (logged in but not founder)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#050505' }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
          }}
        >
          <ArrowLeft size={22} className="text-white" />
        </motion.button>

        <GlassCard className="w-full max-w-sm p-8 text-center" color="#ef4444">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.5)',
            }}
          >
            <Lock size={48} className="text-white" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">Zugriff verweigert</h1>
          <p className="text-white/60 text-sm mb-4">
            Dieser Bereich ist nur für den Founder zugänglich.
          </p>
          <p className="text-xs text-white/40 mb-8">
            Angemeldet als: {user.email || user.displayName}
          </p>

          <motion.button
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              boxShadow: '0 6px 25px rgba(139, 92, 246, 0.5)',
            }}
          >
            <ArrowLeft size={20} />
            Zurück zur App
          </motion.button>
        </GlassCard>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZED ADMIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
          }}
        >
          <ArrowLeft size={22} className="text-white" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Shield size={22} className="text-purple-400" />
            Admin Panel
          </h1>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)',
          }}
        >
          <Crown size={16} className="text-black" />
          <span className="text-sm font-black text-black">FOUNDER</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-4">
        <div
          className="flex gap-2 p-1.5 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {[
            { id: 'settings', label: 'Einstellungen', icon: Settings },
            { id: 'users', label: 'User', icon: Users },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
              style={
                activeTab === tab.id
                  ? {
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                    }
                  : {
                      background: 'transparent',
                    }
              }
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-white/50'} />
              <span className={activeTab === tab.id ? 'text-white' : 'text-white/50'}>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Maintenance Mode */}
            <GlassCard
              className="p-5"
              color={settings.maintenanceMode ? '#ef4444' : undefined}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: settings.maintenanceMode
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: settings.maintenanceMode
                        ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                        : undefined,
                    }}
                  >
                    <Wrench size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Wartungsmodus</p>
                    <p className="text-xs text-white/50">App für alle sperren</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className="w-16 h-9 rounded-full p-1 transition-colors"
                  style={{
                    background: settings.maintenanceMode
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: settings.maintenanceMode
                      ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                      : undefined,
                  }}
                >
                  <motion.div
                    className="w-7 h-7 rounded-full bg-white"
                    animate={{ x: settings.maintenanceMode ? 26 : 0 }}
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                  />
                </motion.button>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-4">
                  <label className="text-xs text-white/60 mb-2 block font-medium">Wartungsnachricht</label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full p-4 rounded-xl text-white text-sm font-medium"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </GlassCard>

            {/* Save Button */}
            <motion.button
              onClick={saveSettings}
              disabled={savingSettings}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white"
              style={{
                background: saveSuccess
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                boxShadow: saveSuccess
                  ? '0 6px 25px rgba(16, 185, 129, 0.5)'
                  : '0 6px 25px rgba(139, 92, 246, 0.5)',
              }}
            >
              {savingSettings ? (
                <Loader2 size={22} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={22} />
              ) : (
                <Check size={22} />
              )}
              {saveSuccess ? 'Gespeichert!' : 'Einstellungen speichern'}
            </motion.button>

            {/* Danger Zone */}
            <GlassCard className="p-5 mt-8" color="#ef4444">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={22} className="text-red-400" />
                <p className="text-base font-bold text-red-400">Danger Zone</p>
              </div>

              <motion.button
                onClick={resetAllLevels}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 6px 25px rgba(239, 68, 68, 0.5)',
                  color: 'white',
                }}
              >
                Alle User auf Level 0 zurücksetzen
              </motion.button>
            </GlassCard>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="User suchen..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-white text-sm font-medium"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Refresh Button */}
            <motion.button
              onClick={loadUsers}
              disabled={loadingUsers}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                color: 'white',
              }}
            >
              <RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} />
              Aktualisieren
            </motion.button>

            {/* User Count */}
            <p className="text-sm text-white/60">
              {filteredUsers.length} User gefunden
            </p>

            {/* User List */}
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <GlassCard key={u.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-base font-bold text-white flex items-center gap-2">
                        {u.displayName}
                        {u.isPremium && <Star size={14} className="text-amber-400" />}
                        {u.id === FOUNDER_UID && <Crown size={14} className="text-amber-400" />}
                      </p>
                      <p className="text-xs text-white/50">@{u.username}</p>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      }}
                    >
                      <span className="text-xs font-bold text-white">{u.xp} XP</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => togglePremium(u.id, u.isPremium)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{
                        background: u.isPremium
                          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                          : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: u.isPremium
                          ? '0 4px 15px rgba(251, 191, 36, 0.4)'
                          : undefined,
                        color: u.isPremium ? 'black' : 'white',
                      }}
                    >
                      <Star size={14} />
                      {u.isPremium ? 'Premium' : 'Free'}
                    </motion.button>
                    <motion.button
                      onClick={() => toggleVisibility(u.id, u.isVisible)}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{
                        background: u.isVisible
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: u.isVisible
                          ? '0 4px 15px rgba(16, 185, 129, 0.4)'
                          : '0 4px 15px rgba(239, 68, 68, 0.4)',
                        color: 'white',
                      }}
                    >
                      {u.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {u.isVisible ? 'Sichtbar' : 'Versteckt'}
                    </motion.button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {filteredUsers.length === 0 && !loadingUsers && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-sm">Keine User gefunden</p>
              </div>
            )}

            {loadingUsers && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 mx-auto border-3 border-purple-500 border-t-transparent rounded-full"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
