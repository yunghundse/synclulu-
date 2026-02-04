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
 * @version 34.0.0 - Complete Rebuild
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
} from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

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

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useStore();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maintenanceMessage: 'Wartungsarbeiten. Wir sind bald zurück!',
  });
  const [savingSettings, setSavingSettings] = useState(false);

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
        <Loader2 size={32} className="animate-spin text-purple-400" />
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050505' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <Lock size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Zugriff verweigert</h1>
          <p className="text-white/50 text-sm mb-6">
            Dieser Bereich ist nur für den Founder zugänglich.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl text-white font-medium"
            style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
          >
            Zurück zur App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 py-4 flex items-center gap-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ArrowLeft size={20} className="text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-purple-400" />
            Admin Panel
          </h1>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20">
          <Crown size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-amber-400">Founder</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-4">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          {[
            { id: 'settings', label: 'Einstellungen', icon: Settings },
            { id: 'users', label: 'User', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Maintenance Mode */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: settings.maintenanceMode
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: settings.maintenanceMode
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    <Wrench size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Wartungsmodus</p>
                    <p className="text-xs text-white/40">App für alle sperren</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    settings.maintenanceMode ? 'bg-red-500' : 'bg-white/10'
                  }`}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full bg-white"
                    animate={{ x: settings.maintenanceMode ? 22 : 0 }}
                  />
                </button>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-4">
                  <label className="text-xs text-white/50 mb-2 block">Wartungsnachricht</label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full p-3 rounded-xl text-white text-sm"
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: 'none', outline: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium text-white"
              style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
            >
              {savingSettings ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
              Einstellungen speichern
            </button>

            {/* Danger Zone */}
            <div
              className="p-5 rounded-2xl mt-8"
              style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-400" />
                <p className="text-sm font-semibold text-red-400">Danger Zone</p>
              </div>

              <button
                onClick={resetAllLevels}
                className="w-full py-3 rounded-xl text-red-400 font-medium"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                Alle User auf Level 0 zurücksetzen
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="User suchen..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-white text-sm"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', outline: 'none' }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70"
            >
              <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
              Aktualisieren
            </button>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        {u.displayName}
                        {u.isPremium && <Star size={12} className="text-amber-400" />}
                        {u.id === FOUNDER_UID && <Crown size={12} className="text-amber-400" />}
                      </p>
                      <p className="text-xs text-white/40">@{u.username}</p>
                    </div>
                    <p className="text-xs text-purple-400 font-mono">{u.xp} XP</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => togglePremium(u.id, u.isPremium)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                        u.isPremium
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}
                    >
                      <Star size={12} />
                      {u.isPremium ? 'Premium' : 'Free'}
                    </button>
                    <button
                      onClick={() => toggleVisibility(u.id, u.isVisible)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                        u.isVisible
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {u.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {u.isVisible ? 'Sichtbar' : 'Versteckt'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && !loadingUsers && (
              <p className="text-center text-white/40 text-sm py-8">Keine User gefunden</p>
            )}

            {loadingUsers && (
              <div className="text-center py-8">
                <Loader2 size={24} className="animate-spin text-purple-400 mx-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
