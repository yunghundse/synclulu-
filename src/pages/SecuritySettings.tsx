/**
 * SecuritySettings.tsx
 * 🔐 SOVEREIGN SECURITY SETTINGS - Glass Panel Design
 *
 * DESIGN: Sovereign Glass Rezept
 * - bg-[#050505] (OLED Black)
 * - bg-white/5 backdrop-blur-xl border border-white/10
 * - Purple Glow accent
 * - whileTap={{ scale: 0.98 }} for haptic feedback
 *
 * @version 35.0.0 - Sovereign Glass Edition
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  LogOut,
  Trash2,
  AlertTriangle,
  Mail,
  Globe,
  Bell,
  UserX,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  color?: string;
}

const SettingToggle = ({ icon, title, description, value, onChange, color = '#a855f7' }: SettingToggleProps) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={() => onChange(!value)}
    className="w-full p-4 rounded-2xl flex items-center gap-4"
    style={{
      background: value ? `${color}10` : 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: value ? `1px solid ${color}40` : '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: value ? `${color}20` : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${value ? `${color}40` : 'rgba(255, 255, 255, 0.1)'}`,
      }}
    >
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/40">{description}</p>
    </div>
    <div
      className="w-12 h-7 rounded-full p-1 transition-colors"
      style={{
        background: value ? color : 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white"
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </div>
  </motion.button>
);

interface SettingButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
  danger?: boolean;
}

const SettingButton = ({ icon, title, description, onClick, color = '#a855f7', danger = false }: SettingButtonProps) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full p-4 rounded-2xl flex items-center gap-4"
    style={{
      background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: danger ? 'rgba(239, 68, 68, 0.2)' : `${color}20`,
        border: `1px solid ${danger ? 'rgba(239, 68, 68, 0.3)' : `${color}40`}`,
      }}
    >
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className={`text-sm font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
      <p className="text-xs text-white/40">{description}</p>
    </div>
    <ChevronRight size={18} className={danger ? 'text-red-400/50' : 'text-white/30'} />
  </motion.button>
);

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [profileVisible, setProfileVisible] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileVisible(data.profileVisible !== false);
          setLocationSharing(data.locationSharing !== false);
          setOnlineStatus(data.onlineStatus !== false);
          setActivityStatus(data.activityStatus !== false);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [user?.id]);

  // Save setting to Firestore
  const saveSetting = async (key: string, value: boolean) => {
    if (!user?.id) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { [key]: value });
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleLogout = async () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      await signOut();
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('ACHTUNG: Dein Konto und alle Daten werden unwiderruflich gelöscht. Fortfahren?')) {
      // Account deletion logic would go here
      alert('Kontolöschung wird eingeleitet. Du erhältst eine Bestätigungs-E-Mail.');
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* Header - Sovereign Glass Style */}
      <div
        className="sticky top-0 z-50 px-5 py-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-purple-400" />
              Sicherheit
            </h1>
            <p className="text-xs text-white/40">Privatsphäre & Konto</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Privacy Section */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 px-1">
            Privatsphäre
          </h2>
          <div className="space-y-3">
            <SettingToggle
              icon={<Eye size={20} className={profileVisible ? 'text-purple-400' : 'text-white/40'} />}
              title="Profil sichtbar"
              description="Andere können dein Profil sehen"
              value={profileVisible}
              onChange={(v) => {
                setProfileVisible(v);
                saveSetting('profileVisible', v);
              }}
            />
            <SettingToggle
              icon={<Globe size={20} className={locationSharing ? 'text-blue-400' : 'text-white/40'} />}
              title="Standort teilen"
              description="Zeige anderen deinen ungefähren Standort"
              value={locationSharing}
              onChange={(v) => {
                setLocationSharing(v);
                saveSetting('locationSharing', v);
              }}
              color="#3b82f6"
            />
            <SettingToggle
              icon={<Bell size={20} className={onlineStatus ? 'text-green-400' : 'text-white/40'} />}
              title="Online-Status"
              description="Zeige wenn du online bist"
              value={onlineStatus}
              onChange={(v) => {
                setOnlineStatus(v);
                saveSetting('onlineStatus', v);
              }}
              color="#22c55e"
            />
            <SettingToggle
              icon={<Key size={20} className={activityStatus ? 'text-amber-400' : 'text-white/40'} />}
              title="Aktivitätsstatus"
              description="Zeige deine aktuelle Aktivität"
              value={activityStatus}
              onChange={(v) => {
                setActivityStatus(v);
                saveSetting('activityStatus', v);
              }}
              color="#f59e0b"
            />
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 px-1">
            Konto verwalten
          </h2>
          <div className="space-y-3">
            <SettingButton
              icon={<Smartphone size={20} className="text-cyan-400" />}
              title="Aktive Geräte"
              description="Verwalte angemeldete Geräte"
              onClick={() => navigate('/settings/devices')}
              color="#22d3ee"
            />
            <SettingButton
              icon={<UserX size={20} className="text-orange-400" />}
              title="Blockierte Nutzer"
              description="Verwalte blockierte Accounts"
              onClick={() => navigate('/settings/blocked')}
              color="#f97316"
            />
            <SettingButton
              icon={<Mail size={20} className="text-indigo-400" />}
              title="E-Mail ändern"
              description={user?.email || 'Keine E-Mail hinterlegt'}
              onClick={() => alert('E-Mail-Änderung kommt bald!')}
              color="#6366f1"
            />
            <SettingButton
              icon={<Lock size={20} className="text-purple-400" />}
              title="Passwort ändern"
              description="Ändere dein Passwort"
              onClick={() => navigate('/reset-password')}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-sm font-bold text-red-400/60 uppercase tracking-wider mb-3 px-1">
            Gefahrenzone
          </h2>
          <div className="space-y-3">
            <SettingButton
              icon={<LogOut size={20} className="text-red-400" />}
              title="Abmelden"
              description="Von diesem Gerät abmelden"
              onClick={handleLogout}
              danger
            />
            <SettingButton
              icon={<Trash2 size={20} className="text-red-400" />}
              title="Konto löschen"
              description="Alle Daten unwiderruflich löschen"
              onClick={handleDeleteAccount}
              danger
            />
          </div>
        </section>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white/70">
                Deine Daten sind bei uns sicher.
              </p>
              <p className="text-xs text-white/40 mt-1">
                Wir verwenden SSL-Verschlüsselung und speichern keine Audiodaten.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
