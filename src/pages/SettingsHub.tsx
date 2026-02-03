/**
 * DELULU SETTINGS HUB v1.5
 * "The Glassmorphism Control Hub"
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────┐
 * │  Profile Header (Minimal)       │
 * ├─────────────────────────────────┤
 * │  🎨 Creator werden              │
 * │  ✉️  Einladungssystem           │
 * │  👁️  Sichtbarkeit               │
 * │  📍 Friend Radar                │
 * ├─────────────────────────────────┤
 * │  ⚙️  Account & Sicherheit       │
 * │  🔔 Benachrichtigungen          │
 * │  🎨 Erscheinungsbild            │
 * │  📱 App-Einstellungen           │
 * ├─────────────────────────────────┤
 * │  ℹ️  Über & Support             │
 * └─────────────────────────────────┘
 *
 * @design Glassmorphism + Apple HIG
 * @version 1.5.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { usePrecisionRadar } from '@/hooks/usePrecisionRadar';
import { RADAR_CONSTANTS } from '@/lib/precisionRadar';
import {
  ChevronLeft, ChevronRight, Crown, Users, Eye, EyeOff,
  Radar, Bell, BellOff, Palette, Shield, LogOut, HelpCircle,
  FileText, Mail, Sparkles, Gift, Share2, MapPin, Lock,
  Moon, Sun, Globe, Smartphone, Volume2, VolumeX, Zap,
  UserPlus, Copy, Check, ExternalLink, Star, Heart
} from 'lucide-react';

// ═══════════════════════════════════════
// GLASSMORPHISM CARD COMPONENT
// ═══════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  gradient?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  gradient
}) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-3xl
      bg-white/70 dark:bg-gray-900/70
      backdrop-blur-xl backdrop-saturate-150
      border border-white/20 dark:border-gray-700/30
      shadow-xl shadow-purple-500/5
      transition-all duration-300
      ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/10 active:scale-[0.99]' : ''}
      ${className}
    `}
  >
    {gradient && (
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${gradient}`} />
    )}
    <div className="relative">{children}</div>
  </div>
);

// ═══════════════════════════════════════
// SETTINGS ROW COMPONENT
// ═══════════════════════════════════════

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description?: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  toggle?: boolean;
  isOn?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
  badge?: string;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconBg,
  label,
  description,
  value,
  onClick,
  toggle,
  isOn,
  onToggle,
  danger,
  badge
}) => (
  <button
    onClick={() => {
      if (toggle && onToggle) {
        onToggle(!isOn);
      } else if (onClick) {
        onClick();
      }
      // Haptic
      if ('vibrate' in navigator) navigator.vibrate(10);
    }}
    className={`w-full p-4 flex items-center gap-4 transition-colors ${
      danger ? 'hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
    }`}
  >
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg}`}>
      {icon}
    </div>

    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
          {label}
        </span>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      )}
    </div>

    {toggle ? (
      <div className={`w-14 h-8 rounded-full p-1 transition-colors ${
        isOn ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
          isOn ? 'translate-x-6' : 'translate-x-0'
        }`} />
      </div>
    ) : value ? (
      <span className="text-sm text-gray-500">{value}</span>
    ) : (
      <ChevronRight size={20} className="text-gray-400" />
    )}
  </button>
);

// ═══════════════════════════════════════
// RADAR SLIDER COMPONENT
// ═══════════════════════════════════════

interface RadarSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RadarSlider: React.FC<RadarSliderProps> = ({ value, onChange, disabled }) => {
  const percentage = ((value - RADAR_CONSTANTS.MIN_RADIUS) / (RADAR_CONSTANTS.MAX_RADIUS - RADAR_CONSTANTS.MIN_RADIUS)) * 100;

  return (
    <div className={`px-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Suchradius</span>
        <span className="text-sm font-semibold text-purple-600">
          {value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={RADAR_CONSTANTS.MIN_RADIUS}
          max={RADAR_CONSTANTS.MAX_RADIUS}
          step={RADAR_CONSTANTS.STEP_SIZE}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">100m</span>
        <span className="text-[10px] text-gray-400">5km MAX</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN SETTINGS HUB
// ═══════════════════════════════════════

const SettingsHub = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const avatarUrl = user?.avatarUrl || null;
  const { isEnabled: radarEnabled, radius, setRadius, toggleRadar } = usePrecisionRadar();

  // Settings State
  const [visibility, setVisibility] = useState<'everyone' | 'friends' | 'nobody'>('everyone');
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setVisibility(data.visibility || 'everyone');
          setNotifications(data.notifications !== false);
          setSoundEnabled(data.soundEnabled !== false);
          setDarkMode(data.darkMode === true);
          setReferralCode(data.referralCode || `DELULU-${user.id.slice(0, 6).toUpperCase()}`);
          setIsCreator(data.isCreator === true);
        }
      } catch (error) {
        console.error('[SettingsHub] Load failed:', error);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Save setting helper
  const saveSetting = async (key: string, value: any) => {
    if (!user?.id) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { [key]: value });
    } catch (error) {
      console.error('[SettingsHub] Save failed:', error);
    }
  };

  // Copy referral code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(
        `Hey! Komm zu Delulu 💫 Nutze meinen Code: ${referralCode}\nhttps://delulu.app/join/${referralCode}`
      );
      setCopied(true);
      if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Logout
  const handleLogout = async () => {
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-black">
      {/* ═══════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════ */}
      <div className="sticky top-0 z-50 px-4 pt-6 pb-4 bg-gradient-to-b from-purple-50/95 via-white/95 to-transparent dark:from-gray-900/95 dark:via-gray-900/95 backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Einstellungen
          </h1>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* PROFILE MINI CARD */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard
          onClick={() => navigate('/profile')}
          gradient="from-purple-500 to-pink-500"
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-purple-500/30 shadow-lg">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                {user?.displayName || 'Anonym'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user?.username || 'username'}
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* CREATOR & INVITE SECTION */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard gradient="from-amber-400 to-orange-500">
          <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            {/* Creator werden */}
            <SettingsRow
              icon={<Crown size={20} className="text-amber-500" />}
              iconBg="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
              label="Creator werden"
              description={isCreator ? "Du bist bereits Creator ✨" : "Verdiene Geld mit deinem Content"}
              badge={isCreator ? "AKTIV" : "NEU"}
              onClick={() => navigate('/creator-application')}
            />

            {/* Einladungssystem */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Gift size={20} className="text-pink-500" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Einladungssystem
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lade Freunde ein & erhalte Rewards
                  </p>
                </div>
              </div>

              {/* Referral Code Card */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-700/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Dein Code</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-600 rounded-full font-semibold">
                    🎁 7 Tage Premium pro Einladung
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 font-mono text-lg font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                    {referralCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate('/invites')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
                >
                  <UserPlus size={16} />
                  Einladen
                </button>
                <button
                  onClick={() => navigate('/referral-status')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Users size={16} />
                  Status
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* PRIVACY & RADAR SECTION */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            {/* Sichtbarkeit */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  {visibility === 'nobody' ? (
                    <EyeOff size={20} className="text-violet-500" />
                  ) : (
                    <Eye size={20} className="text-violet-500" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Sichtbarkeit
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Wer kann dich im Radar sehen?
                  </p>
                </div>
              </div>

              {/* Visibility Options */}
              <div className="flex gap-2">
                {[
                  { key: 'everyone', label: 'Alle', icon: Globe },
                  { key: 'friends', label: 'Freunde', icon: Users },
                  { key: 'nobody', label: 'Niemand', icon: EyeOff },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = visibility === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => {
                        setVisibility(option.key as any);
                        saveSetting('visibility', option.key);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={16} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Friend Radar */}
            <div>
              <SettingsRow
                icon={<Radar size={20} className="text-cyan-500" />}
                iconBg="bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30"
                label="Friend Radar"
                description="Entdecke Delulu-User in deiner Nähe"
                toggle
                isOn={radarEnabled}
                onToggle={toggleRadar}
              />

              {/* Radar Slider */}
              <RadarSlider
                value={radius}
                onChange={setRadius}
                disabled={!radarEnabled}
              />
            </div>
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* APP SETTINGS SECTION */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            <SettingsRow
              icon={<Bell size={20} className="text-rose-500" />}
              iconBg="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30"
              label="Push-Benachrichtigungen"
              description="Erhalte Updates zu Matches & Messages"
              toggle
              isOn={notifications}
              onToggle={(val) => {
                setNotifications(val);
                saveSetting('notifications', val);
              }}
            />

            <SettingsRow
              icon={<Volume2 size={20} className="text-emerald-500" />}
              iconBg="bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30"
              label="Sound-Effekte"
              description="Töne bei Aktionen & Benachrichtigungen"
              toggle
              isOn={soundEnabled}
              onToggle={(val) => {
                setSoundEnabled(val);
                saveSetting('soundEnabled', val);
              }}
            />

            <SettingsRow
              icon={darkMode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
              iconBg={darkMode
                ? "bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30"
                : "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"
              }
              label="Dark Mode"
              description="Dunkles Erscheinungsbild aktivieren"
              toggle
              isOn={darkMode}
              onToggle={(val) => {
                setDarkMode(val);
                saveSetting('darkMode', val);
                document.documentElement.classList.toggle('dark', val);
              }}
            />
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* ACCOUNT & SECURITY */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            <SettingsRow
              icon={<Shield size={20} className="text-blue-500" />}
              iconBg="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
              label="Account & Sicherheit"
              description="Passwort, Email, Zwei-Faktor"
              onClick={() => navigate('/settings/security')}
            />

            <SettingsRow
              icon={<Lock size={20} className="text-gray-500" />}
              iconBg="bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50"
              label="Blockierte Nutzer"
              description="Verwalte blockierte Profile"
              onClick={() => navigate('/settings/blocked')}
            />

            <SettingsRow
              icon={<Smartphone size={20} className="text-purple-500" />}
              iconBg="bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30"
              label="Verknüpfte Geräte"
              description="Aktive Sessions verwalten"
              onClick={() => navigate('/settings/devices')}
            />
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* SUPPORT & LEGAL */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
            <SettingsRow
              icon={<HelpCircle size={20} className="text-teal-500" />}
              iconBg="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30"
              label="Hilfe & Support"
              description="FAQ, Kontakt, Bug melden"
              onClick={() => navigate('/help')}
            />

            <SettingsRow
              icon={<Star size={20} className="text-yellow-500" />}
              iconBg="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30"
              label="App bewerten"
              description="Hilf uns mit einer Bewertung"
              onClick={() => window.open('https://apps.apple.com/app/delulu', '_blank')}
            />

            <SettingsRow
              icon={<FileText size={20} className="text-gray-500" />}
              iconBg="bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50"
              label="Rechtliches"
              description="Impressum, Datenschutz, AGB"
              onClick={() => navigate('/legal')}
            />
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* LOGOUT */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <SettingsRow
            icon={<LogOut size={20} className="text-red-500" />}
            iconBg="bg-red-100 dark:bg-red-900/30"
            label="Abmelden"
            description="Von diesem Gerät abmelden"
            onClick={handleLogout}
            danger
          />
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* VERSION INFO */}
        {/* ═══════════════════════════════════════ */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">
            Delulu v1.5.0 • Made with 💜 in Germany
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            Build 2024.01.15
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsHub;
