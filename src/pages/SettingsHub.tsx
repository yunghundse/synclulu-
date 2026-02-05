/**
 * synclulu SETTINGS HUB v3.0 - SOVEREIGN GLASS EDITION
 * "The Sovereign Control Hub"
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────┐
 * │  🖼️ Banner + Avatar Header     │
 * │  (Sovereign Glass Design)      │
 * ├─────────────────────────────────┤
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
 * @design Sovereign Glass (bg-white/5 backdrop-blur-xl border-white/10)
 * @version 3.0.0 - Sovereign Glass Edition
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  UserPlus, Copy, Check, ExternalLink, Star, Heart, Edit2
} from 'lucide-react';

// ═══════════════════════════════════════
// SOVEREIGN GLASS CARD COMPONENT
// ═══════════════════════════════════════

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  glowColor
}) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl
      transition-all duration-300
      ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''}
      ${className}
    `}
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: glowColor ? `0 0 30px ${glowColor}20` : 'none',
    }}
  >
    {children}
  </div>
);

// ═══════════════════════════════════════
// SETTINGS ROW COMPONENT
// ═══════════════════════════════════════

interface SettingsRowProps {
  icon: React.ReactNode;
  iconColor: string;
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
  iconColor,
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
      if ('vibrate' in navigator) navigator.vibrate(10);
    }}
    className="w-full p-4 flex items-center gap-4 transition-colors hover:bg-white/5"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{
        background: `${iconColor}20`,
        border: `1px solid ${iconColor}40`,
      }}
    >
      <span style={{ color: iconColor }}>{icon}</span>
    </div>

    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>
          {label}
        </span>
        {badge && (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      )}
    </div>

    {toggle ? (
      <div
        className="w-12 h-7 rounded-full p-1 transition-colors"
        style={{
          background: isOn
            ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
            : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{
            transform: isOn ? 'translateX(20px)' : 'translateX(0)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    ) : value ? (
      <span className="text-xs text-white/50">{value}</span>
    ) : (
      <ChevronRight size={18} className="text-white/30" />
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
        <span className="text-xs text-white/50">Suchradius</span>
        <span className="text-xs font-bold text-violet-400">
          {value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
            }}
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
        <span className="text-[10px] text-white/30">100m</span>
        <span className="text-[10px] text-white/30">5km MAX</span>
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
  const avatarUrl = user?.avatarUrl || (user as any)?.photoURL || null;
  const bannerUrl = (user as any)?.bannerURL || null;
  const bio = (user as any)?.bio || '';
  const isFounder = (user as any)?.role === 'founder' || (user as any)?.isAdmin === true;
  const { isEnabled: radarEnabled, radius, setRadius, toggleRadar } = usePrecisionRadar();

  // Settings State
  const [visibility, setVisibility] = useState<'everyone' | 'friends' | 'nobody'>('everyone');
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Accent color based on founder status
  const accentColor = isFounder ? '#fbbf24' : '#a855f7';

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
          setReferralCode(data.referralCode || `synclulu-${user.id.slice(0, 6).toUpperCase()}`);
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
        `Hey! Komm zu synclulu 💫 Nutze meinen Code: ${referralCode}\nhttps://synclulu.app/join/${referralCode}`
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
    <div className="min-h-screen pb-32" style={{ background: '#050505' }}>
      {/* ═══════════════════════════════════════ */}
      {/* HEADER - Sovereign Glass Style */}
      {/* ═══════════════════════════════════════ */}
      <div
        className="sticky top-0 z-50 px-5 py-4"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ChevronLeft size={20} className="text-white/60" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Einstellungen</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* ═══════════════════════════════════════ */}
        {/* SOVEREIGN PROFILE HEADER */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard glowColor={accentColor}>
          {/* Banner */}
          <div className="relative h-24 w-full overflow-hidden">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #0d0518 100%)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: `radial-gradient(ellipse at 30% 50%, ${accentColor}20 0%, transparent 60%)` }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 h-12"
              style={{ background: 'linear-gradient(to top, rgba(5, 5, 5, 0.9), transparent)' }}
            />
          </div>

          {/* Avatar & Info */}
          <div className="relative px-4 pb-4">
            <div className="relative -mt-10 flex items-end justify-between">
              <motion.button
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <motion.div
                  className="absolute -inset-1 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${isFounder ? '#fde047' : '#c084fc'})`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div
                  className="relative w-16 h-16 rounded-full overflow-hidden"
                  style={{ border: '3px solid #050505' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
                    >
                      <span className="text-xl font-black text-white/80">
                        {(user?.displayName || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {isFounder && (
                  <div
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)' }}
                  >
                    <Crown size={12} className="text-black" />
                  </div>
                )}
              </motion.button>

              <motion.button
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                <Edit2 size={14} style={{ color: accentColor }} />
                <span className="text-xs font-bold" style={{ color: accentColor }}>Profil</span>
              </motion.button>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {user?.displayName || 'Anonym'}
                </h2>
                {isFounder && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}
                  >
                    FOUNDER
                  </span>
                )}
              </div>
              <p className="text-sm text-white/40">@{user?.username || 'username'}</p>
            </div>

            {bio && (
              <p className="mt-2 text-sm text-white/60 line-clamp-2">{bio}</p>
            )}
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* INVITE SECTION */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard glowColor="#ec4899">
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                }}
              >
                <Gift size={18} className="text-pink-400" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white">Einladungssystem</span>
                <p className="text-xs text-white/40">Lade Freunde ein & erhalte Rewards</p>
              </div>
            </div>

            {/* Referral Code Card */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Dein Code</span>
                <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full font-semibold">
                  🎁 +100 XP pro Einladung
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 rounded-xl px-4 py-3 font-mono text-lg font-bold text-violet-400 tracking-wider"
                  style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                >
                  {referralCode}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCode}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: copied
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    border: copied ? '1px solid rgba(34, 197, 94, 0.5)' : 'none',
                  }}
                >
                  {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} className="text-white" />}
                </motion.button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/invites')}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                }}
              >
                <UserPlus size={16} />
                Einladen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/referral-status')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/70 flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Users size={16} />
                Status
              </motion.button>
            </div>
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* PRIVACY & RADAR SECTION */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-white/5">
            {/* Sichtbarkeit */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                  }}
                >
                  {visibility === 'nobody' ? (
                    <EyeOff size={18} className="text-violet-400" />
                  ) : (
                    <Eye size={18} className="text-violet-400" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white">Sichtbarkeit</span>
                  <p className="text-xs text-white/40">Wer kann dich im Radar sehen?</p>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'everyone', label: 'Alle', icon: Globe },
                  { key: 'friends', label: 'Freunde', icon: Users },
                  { key: 'nobody', label: 'Niemand', icon: EyeOff },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = visibility === option.key;
                  return (
                    <motion.button
                      key={option.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setVisibility(option.key as any);
                        saveSetting('visibility', option.key);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                        boxShadow: isSelected ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                      }}
                    >
                      <Icon size={14} />
                      {option.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Friend Radar */}
            <div>
              <SettingsRow
                icon={<Radar size={18} />}
                iconColor="#22d3ee"
                label="Friend Radar"
                description="Entdecke synclulu-User in deiner Nähe"
                toggle
                isOn={radarEnabled}
                onToggle={toggleRadar}
              />
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
          <div className="divide-y divide-white/5">
            <SettingsRow
              icon={<Bell size={18} />}
              iconColor="#f43f5e"
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
              icon={<Volume2 size={18} />}
              iconColor="#22c55e"
              label="Sound-Effekte"
              description="Töne bei Aktionen & Benachrichtigungen"
              toggle
              isOn={soundEnabled}
              onToggle={(val) => {
                setSoundEnabled(val);
                saveSetting('soundEnabled', val);
              }}
            />
          </div>
        </GlassCard>

        {/* ═══════════════════════════════════════ */}
        {/* ACCOUNT & SECURITY */}
        {/* ═══════════════════════════════════════ */}
        <GlassCard>
          <div className="divide-y divide-white/5">
            <SettingsRow
              icon={<Shield size={18} />}
              iconColor="#3b82f6"
              label="Account & Sicherheit"
              description="Passwort, Email, Zwei-Faktor"
              onClick={() => navigate('/settings/security')}
            />

            <SettingsRow
              icon={<Lock size={18} />}
              iconColor="#6b7280"
              label="Blockierte Nutzer"
              description="Verwalte blockierte Profile"
              onClick={() => navigate('/settings/blocked')}
            />

            <SettingsRow
              icon={<Smartphone size={18} />}
              iconColor="#a855f7"
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
          <div className="divide-y divide-white/5">
            <SettingsRow
              icon={<HelpCircle size={18} />}
              iconColor="#14b8a6"
              label="Hilfe & Support"
              description="FAQ, Kontakt, Bug melden"
              onClick={() => navigate('/help')}
            />

            <SettingsRow
              icon={<Star size={18} />}
              iconColor="#fbbf24"
              label="App bewerten"
              description="Hilf uns mit einer Bewertung"
              onClick={() => window.open('https://apps.apple.com/app/synclulu', '_blank')}
            />

            <SettingsRow
              icon={<FileText size={18} />}
              iconColor="#6b7280"
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
            icon={<LogOut size={18} />}
            iconColor="#ef4444"
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
          <p className="text-xs text-white/30">
            synclulu v1.5.0 • Made with 💜 in Germany
          </p>
          <p className="text-[10px] text-white/20 mt-1">
            Build 2026.02.05
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsHub;
