/**
 * DELULU ONBOARDING FLOW v5.0
 * "From Stranger to Dreamer in 3 Steps"
 *
 * FEATURES:
 * - Exit Button (zurück zur Welcome)
 * - Light/Dark Theme Support
 * - Nur Location ist Pflicht
 * - Mikrofon optional
 *
 * @version 5.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import {
  Mail, Lock, User, Camera, MapPin, Mic, Bell, X,
  ChevronRight, ChevronLeft, Check, Loader2, Eye, EyeOff,
  Sparkles, Shield, AlertCircle, ArrowLeft
} from 'lucide-react';
import {
  checkCapacity,
  validateReferralCode,
  completeRegistration,
  extractReferralCode,
  GATEKEEPER_CONFIG
} from '@/lib/gatekeeperSystem';
import { SoldOutOverlay } from '@/components/SoldOutOverlay';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type OnboardingStep = 'credentials' | 'profile' | 'permissions';
type ThemeMode = 'light' | 'dark';

interface FormData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFile: File | null;
}

interface PermissionState {
  location: PermissionStatus | null;
  microphone: PermissionStatus | null;
  notifications: PermissionStatus | null;
}

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

// ═══════════════════════════════════════════════════════════════════════════
// THEME CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const themes = {
  dark: {
    bg: '#0a0a0c',
    bgSecondary: 'rgba(255, 255, 255, 0.03)',
    bgHover: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(167, 139, 250, 0.5)',
    text: '#f5f5f7',
    textSecondary: '#b8b8bd',
    textMuted: '#71717a',
    inputBg: 'rgba(20, 20, 22, 0.8)',
    cardBg: 'rgba(20, 20, 22, 0.95)',
    accent: '#A78BFA',
    accentLight: '#C4B5FD',
    success: '#4ADE80',
    error: '#F87171',
    orbOpacity: 0.1
  },
  light: {
    bg: '#ffffff',
    bgSecondary: 'rgba(139, 92, 246, 0.04)',
    bgHover: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderHover: 'rgba(139, 92, 246, 0.5)',
    text: '#1a1a1a',
    textSecondary: '#6b6b6b',
    textMuted: '#8e8e93',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    accent: '#7C3AED',
    accentLight: '#8B5CF6',
    success: '#22C55E',
    error: '#EF4444',
    orbOpacity: 0.12
  }
};

// Detect system theme
const getSystemTheme = (): ThemeMode => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

const AuraBackground = ({ theme }: { theme: ThemeMode }) => {
  const t = themes[theme];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: t.bg }} />

      {/* Aura orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(139, 92, 246, ${t.orbOpacity}) 0%, transparent 60%)`,
          top: '-20%',
          left: '-10%',
          filter: 'blur(80px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(168, 85, 247, ${t.orbOpacity * 0.8}) 0%, transparent 60%)`,
          bottom: '-15%',
          right: '-10%',
          filter: 'blur(60px)'
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: theme === 'dark'
            ? `linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
               linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)`
            : `linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
               linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HEADER WITH EXIT BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface HeaderProps {
  theme: ThemeMode;
  onExit: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

const Header = ({ theme, onExit, showBack, onBack }: HeaderProps) => {
  const t = themes[theme];

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Back/Exit Button */}
      {showBack && onBack ? (
        <motion.button
          onClick={onBack}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: t.bgSecondary,
            border: `1px solid ${t.border}`
          }}
          whileHover={{ background: t.bgHover }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={20} style={{ color: t.textSecondary }} />
        </motion.button>
      ) : (
        <motion.button
          onClick={onExit}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: t.bgSecondary,
            border: `1px solid ${t.border}`
          }}
          whileHover={{ background: t.bgHover }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={20} style={{ color: t.textSecondary }} />
        </motion.button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">☁️</span>
        <span
          className="text-xl font-bold"
          style={{
            background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentLight} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Delulu
        </span>
      </div>

      {/* Spacer */}
      <div className="w-12" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  theme: ThemeMode;
}

const ProgressBar = ({ currentStep, totalSteps, theme }: ProgressBarProps) => {
  const t = themes[theme];

  const stepLabels = ['Account', 'Profil', 'Aura'];

  return (
    <div className="w-full max-w-sm mx-auto mb-8">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500"
              style={{
                background: i < currentStep
                  ? t.accent
                  : i === currentStep
                  ? `${t.accent}30`
                  : t.bgSecondary,
                border: i === currentStep ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                color: i <= currentStep ? (i < currentStep ? '#FFF' : t.accent) : t.textMuted
              }}
              animate={i === currentStep ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {i < currentStep ? <Check size={16} /> : i + 1}
            </motion.div>
            {i < totalSteps - 1 && (
              <div className="w-16 h-1 mx-2 rounded-full overflow-hidden" style={{ background: t.border }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: t.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: i < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-2">
        {stepLabels.map((label, i) => (
          <span
            key={i}
            className="text-xs font-medium"
            style={{ color: i <= currentStep ? t.accent : t.textMuted }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GLASS INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface GlassInputProps {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  suffix?: React.ReactNode;
  maxLength?: number;
  autoFocus?: boolean;
  theme: ThemeMode;
}

const GlassInput = ({
  icon, type, value, onChange, placeholder,
  error, suffix, maxLength, autoFocus, theme
}: GlassInputProps) => {
  const t = themes[theme];
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <motion.div
        className="relative flex items-center rounded-2xl transition-all duration-300"
        style={{
          background: error
            ? `${t.error}10`
            : isFocused
            ? `${t.accent}08`
            : t.inputBg,
          border: `1px solid ${
            error
              ? `${t.error}60`
              : isFocused
              ? t.borderHover
              : t.border
          }`,
          boxShadow: error
            ? `0 0 20px ${t.error}15`
            : isFocused
            ? `0 0 25px ${t.accent}15`
            : 'none'
        }}
        animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div
          className="pl-4 transition-colors"
          style={{ color: error ? t.error : isFocused ? t.accent : t.textMuted }}
        >
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 px-3 py-4 bg-transparent focus:outline-none text-base"
          style={{
            color: t.text,
            caretColor: t.accent
          }}
        />
        {suffix && <div className="pr-4">{suffix}</div>}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs mt-2 pl-4 flex items-center gap-1"
            style={{ color: t.error }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <AlertCircle size={12} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════════

interface CredentialsStepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
  onNext: () => void;
  isLoading: boolean;
  referralValid: boolean | null;
  referrerName: string | null;
  theme: ThemeMode;
}

const CredentialsStep = ({
  formData, setFormData, errors, onNext, isLoading, referralValid, referrerName, theme
}: CredentialsStepProps) => {
  const t = themes[theme];
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = () => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthColors = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#10B981'];
  const strengthLabels = ['Sehr schwach', 'Schwach', 'Okay', 'Gut', 'Sehr stark'];

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
          Erstelle deinen Account
        </h2>
        <p style={{ color: t.textSecondary }}>
          Tritt der exklusiven Cloud bei
        </p>
      </div>

      {/* General Error Display */}
      {errors.general && (
        <motion.div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{
            background: `${t.error}15`,
            border: `1px solid ${t.error}40`
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={20} style={{ color: t.error }} />
          <span className="text-sm" style={{ color: t.error }}>
            {errors.general}
          </span>
        </motion.div>
      )}

      {/* Referral Badge */}
      {referralValid && referrerName && (
        <motion.div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            background: `${t.success}15`,
            border: `1px solid ${t.success}40`
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles size={16} style={{ color: t.success }} />
          <span className="text-sm" style={{ color: t.success }}>
            Eingeladen von <strong>{referrerName}</strong> • +5 Sterne Bonus!
          </span>
        </motion.div>
      )}

      {/* Email */}
      <GlassInput
        icon={<Mail size={18} />}
        type="email"
        value={formData.email}
        onChange={(v) => setFormData(prev => ({ ...prev, email: v }))}
        placeholder="E-Mail Adresse"
        error={errors.email}
        autoFocus
        theme={theme}
      />

      {/* Password */}
      <div>
        <GlassInput
          icon={<Lock size={18} />}
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(v) => setFormData(prev => ({ ...prev, password: v }))}
          placeholder="Passwort (min. 6 Zeichen)"
          error={errors.password}
          theme={theme}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ color: t.textMuted }}
              className="hover:opacity-70 transition-opacity"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {formData.password && (
          <motion.div
            className="mt-3 px-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex gap-1 mb-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    background: i < strength ? strengthColors[strength - 1] : t.border
                  }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: strengthColors[Math.max(0, strength - 1)] }}>
              {strengthLabels[Math.max(0, strength - 1)]}
            </p>
          </motion.div>
        )}
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={onNext}
        disabled={isLoading || !formData.email || !formData.password}
        className="w-full py-4 rounded-2xl font-semibold text-white relative overflow-hidden disabled:opacity-40 mt-4"
        style={{
          background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentLight} 100%)`,
          boxShadow: `0 4px 25px ${t.accent}40`
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Weiter <ChevronRight size={18} /></>}
        </span>
      </motion.button>

      {/* Login Link */}
      <p className="text-center text-sm" style={{ color: t.textSecondary }}>
        Bereits registriert?{' '}
        <Link to="/login" style={{ color: t.accent }} className="font-semibold hover:underline">
          Anmelden
        </Link>
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: PROFILE
// ═══════════════════════════════════════════════════════════════════════════

interface ProfileStepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
  onNext: () => void;
  isLoading: boolean;
  theme: ThemeMode;
}

const ProfileStep = ({ formData, setFormData, errors, onNext, isLoading, theme }: ProfileStepProps) => {
  const t = themes[theme];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(formData.avatarUrl);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setFormData(prev => ({ ...prev, avatarFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
          Erstelle dein Profil
        </h2>
        <p style={{ color: t.textSecondary }}>
          So sehen dich andere Träumer
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="flex justify-center mb-6">
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: avatarPreview
                ? `url(${avatarPreview}) center/cover`
                : `linear-gradient(135deg, ${t.accent}30 0%, ${t.accentLight}20 100%)`,
              border: `2px solid ${t.accent}50`,
              boxShadow: `0 0 30px ${t.accent}20`
            }}
          >
            {!avatarPreview && <Camera size={32} style={{ color: t.accent }} />}
          </div>
          <motion.div
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera size={24} className="text-white" />
          </motion.div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </motion.button>
      </div>

      <p className="text-center text-sm mb-4" style={{ color: t.textMuted }}>
        Tippe für ein Profilbild (optional)
      </p>

      {/* Display Name */}
      <GlassInput
        icon={<User size={18} />}
        type="text"
        value={formData.displayName}
        onChange={(v) => setFormData(prev => ({ ...prev, displayName: v }))}
        placeholder="Anzeigename"
        error={errors.displayName}
        maxLength={30}
        autoFocus
        theme={theme}
      />

      {/* Username */}
      <GlassInput
        icon={<span style={{ color: t.textMuted }}>@</span>}
        type="text"
        value={formData.username}
        onChange={(v) => setFormData(prev => ({
          ...prev,
          username: v.toLowerCase().replace(/[^a-z0-9_]/g, '')
        }))}
        placeholder="benutzername"
        error={errors.username}
        maxLength={20}
        theme={theme}
      />

      {/* General Error Display */}
      {(errors.general || errors.email) && (
        <motion.div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{
            background: `${t.error}15`,
            border: `1px solid ${t.error}40`
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={20} style={{ color: t.error }} />
          <span className="text-sm" style={{ color: t.error }}>
            {errors.general || errors.email}
          </span>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.button
        onClick={() => {
          console.log('🔘 [REG] Button clicked!');
          console.log('📋 [REG] Form data:', formData);
          onNext();
        }}
        disabled={isLoading || !formData.displayName || !formData.username}
        className="w-full py-4 rounded-2xl font-semibold text-white relative overflow-hidden disabled:opacity-40"
        style={{
          background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentLight} 100%)`,
          boxShadow: `0 4px 25px ${t.accent}40`
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Account erstellen <Sparkles size={16} /></>}
        </span>
      </motion.button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

interface PermissionsStepProps {
  permissions: PermissionState;
  onRequestPermission: (type: 'location' | 'microphone' | 'notifications') => void;
  onComplete: () => void;
  onSkip: () => void;
  isLoading: boolean;
  theme: ThemeMode;
}

const PermissionsStep = ({
  permissions, onRequestPermission, onComplete, onSkip, isLoading, theme
}: PermissionsStepProps) => {
  const t = themes[theme];

  // NUR Location ist Pflicht!
  const locationGranted = permissions.location === 'granted';

  const permissionItems = [
    {
      key: 'location' as const,
      icon: MapPin,
      title: 'Standort aktivieren',
      description: 'Zeige dich auf dem Radar für andere.',
      required: true,
      status: permissions.location
    },
    {
      key: 'microphone' as const,
      icon: Mic,
      title: 'Mikrofon (optional)',
      description: 'Für Sprachnachrichten in der Cloud.',
      required: false,
      status: permissions.microphone
    },
    {
      key: 'notifications' as const,
      icon: Bell,
      title: 'Benachrichtigungen',
      description: 'Verpasse keine Matches.',
      required: false,
      status: permissions.notifications
    }
  ];

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${t.accent}25 0%, ${t.accentLight}15 100%)`,
            border: `1px solid ${t.accent}40`
          }}
          animate={{
            boxShadow: [
              `0 0 20px ${t.accent}20`,
              `0 0 40px ${t.accent}35`,
              `0 0 20px ${t.accent}20`
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Shield size={32} style={{ color: t.accent }} />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
          Aktiviere deine Aura
        </h2>
        <p style={{ color: t.textSecondary }}>
          Nur der Standort ist erforderlich
        </p>
      </div>

      {/* Permission Items */}
      <div className="space-y-3">
        {permissionItems.map((item, index) => {
          const Icon = item.icon;
          const isGranted = item.status === 'granted';
          const isDenied = item.status === 'denied';

          return (
            <motion.button
              key={item.key}
              onClick={() => !isGranted && onRequestPermission(item.key)}
              disabled={isGranted}
              className="w-full p-4 rounded-2xl text-left relative overflow-hidden"
              style={{
                background: isGranted ? `${t.success}12` : isDenied ? `${t.error}12` : t.cardBg,
                border: `1px solid ${isGranted ? `${t.success}40` : isDenied ? `${t.error}40` : t.border}`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!isGranted ? { background: `${t.accent}10` } : {}}
              whileTap={!isGranted ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: isGranted ? `${t.success}20` : isDenied ? `${t.error}20` : `${t.accent}20`,
                    color: isGranted ? t.success : isDenied ? t.error : t.accent
                  }}
                >
                  {isGranted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: t.text }}>{item.title}</span>
                    {item.required && !isGranted && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${t.accent}25`, color: t.accent }}
                      >
                        Pflicht
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: t.textSecondary }}>{item.description}</p>
                </div>
                {!isGranted && <ChevronRight size={18} style={{ color: t.textMuted }} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue Button */}
      <motion.button
        onClick={onComplete}
        disabled={!locationGranted || isLoading}
        className="w-full py-4 rounded-2xl font-semibold text-white relative overflow-hidden disabled:opacity-40"
        style={{
          background: locationGranted
            ? `linear-gradient(135deg, ${t.success} 0%, #16A34A 100%)`
            : `linear-gradient(135deg, ${t.accent} 0%, ${t.accentLight} 100%)`,
          boxShadow: locationGranted ? `0 4px 25px ${t.success}40` : `0 4px 25px ${t.accent}40`
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative flex items-center justify-center gap-2">
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : locationGranted ? (
            <>
              <Sparkles size={18} />
              In die Cloud eintreten
            </>
          ) : (
            'Standort erforderlich'
          )}
        </span>
      </motion.button>

      <p className="text-xs text-center" style={{ color: t.textMuted }}>
        Du kannst Berechtigungen später in den Einstellungen ändern
      </p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(getSystemTheme());
  const t = themes[theme];

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Current step
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('credentials');
  const stepIndex = currentStep === 'credentials' ? 0 : currentStep === 'profile' ? 1 : 2;

  // Capacity
  const [capacity, setCapacity] = useState({ current: 0, max: 10, isFull: false });
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(true);
  const [showSoldOut, setShowSoldOut] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
    avatarUrl: null,
    avatarFile: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Firebase user
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Permissions
  const [permissions, setPermissions] = useState<PermissionState>({
    location: null,
    microphone: null,
    notifications: null
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const loadCapacity = async () => {
      try {
        const status = await checkCapacity();
        setCapacity({ current: status.currentUsers, max: status.maxUsers, isFull: status.isFull });
        if (status.isFull) setShowSoldOut(true);
      } catch (error) {
        console.error('Capacity check failed:', error);
      } finally {
        setIsCheckingCapacity(false);
      }
    };
    loadCapacity();
  }, []);

  useEffect(() => {
    const code = extractReferralCode();
    if (code) {
      setReferralCode(code);
      validateReferralCode(code).then(result => {
        setReferralValid(result.valid);
        setReferrerName(result.valid ? result.referrerUsername || 'Ein Freund' : null);
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const checkPermissions = async () => {
      if ('permissions' in navigator) {
        try {
          const loc = await navigator.permissions.query({ name: 'geolocation' });
          setPermissions(prev => ({ ...prev, location: loc.state as PermissionStatus }));
        } catch { setPermissions(prev => ({ ...prev, location: 'prompt' })); }

        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissions(prev => ({ ...prev, microphone: mic.state as PermissionStatus }));
        } catch { setPermissions(prev => ({ ...prev, microphone: 'prompt' })); }
      }

      if ('Notification' in window) {
        setPermissions(prev => ({ ...prev, notifications: Notification.permission as PermissionStatus }));
      }
    };
    checkPermissions();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleExit = () => navigate('/');

  const handleBack = () => {
    if (currentStep === 'profile') setCurrentStep('credentials');
    else if (currentStep === 'permissions') setCurrentStep('profile');
  };

  const validateCredentials = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Gültige E-Mail erforderlich';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Mindestens 6 Zeichen';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.displayName || formData.displayName.length < 2) {
      newErrors.displayName = 'Mindestens 2 Zeichen';
    }
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Mindestens 3 Zeichen';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialsNext = () => {
    if (!validateCredentials()) return;
    setCurrentStep('profile');
  };

  const handleProfileNext = async () => {
    if (!validateProfile()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Step 1: Check Capacity
      console.log('🔍 [REG] Step 1: Checking capacity...');
      const status = await checkCapacity();
      console.log('📊 [REG] Capacity:', status);

      if (status.isFull) {
        console.log('🚫 [REG] Cloud is full!');
        setShowSoldOut(true);
        setIsLoading(false);
        return;
      }

      // Step 2: Create Firebase Auth User
      console.log('🔐 [REG] Step 2: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      console.log('✅ [REG] Auth user created:', user.uid);
      setFirebaseUser(user);

      // Step 3: Upload Avatar (optional - don't fail registration if this fails)
      let avatarUrl = null;
      if (formData.avatarFile) {
        try {
          console.log('📸 [REG] Step 3: Uploading avatar...');
          const avatarRef = ref(storage, `avatars/${user.uid}`);
          await uploadBytes(avatarRef, formData.avatarFile);
          avatarUrl = await getDownloadURL(avatarRef);
          console.log('✅ [REG] Avatar uploaded:', avatarUrl);
        } catch (storageErr: any) {
          console.warn('⚠️ [REG] Avatar upload failed, continuing without avatar:', storageErr.code, storageErr.message);
          // Don't throw - just continue without avatar
          // User can add avatar later in profile settings
        }
      }

      // Step 4: Create Firestore User Document
      console.log('📝 [REG] Step 4: Creating Firestore user doc...');
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: formData.displayName,
        username: formData.username,
        avatarUrl,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        level: 1,
        xp: 0,
        nebulaStars: referralValid ? GATEKEEPER_CONFIG.referralRewardNewUser : 0,
        isPremium: false,
        role: 'user',
        searchRadius: GATEKEEPER_CONFIG.standardRadius,
        referredBy: referralValid ? referrerName : null,
        referredByCode: referralValid ? referralCode : null,
        permissions: { location: false, microphone: false, notifications: false }
      });
      console.log('✅ [REG] Firestore user doc created!');

      // Step 5: Proceed to Permissions
      console.log('🎉 [REG] Step 5: Moving to permissions step...');
      setCurrentStep('permissions');
    } catch (err: any) {
      console.error('❌ [REG] Registration error:', err);
      console.error('❌ [REG] Error code:', err.code);
      console.error('❌ [REG] Error message:', err.message);

      // Use 'general' key so error is displayed on profile step
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ general: 'Diese E-Mail wird bereits verwendet. Gehe zurück und ändere sie.' });
        // Go back to credentials step
        setCurrentStep('credentials');
      } else if (err.code === 'auth/weak-password') {
        setErrors({ general: 'Passwort zu schwach. Gehe zurück und wähle ein stärkeres.' });
        setCurrentStep('credentials');
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ general: 'Ungültige E-Mail-Adresse. Gehe zurück und korrigiere sie.' });
        setCurrentStep('credentials');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrors({ general: 'E-Mail/Passwort Anmeldung ist nicht aktiviert. Kontaktiere Support.' });
      } else if (err.code === 'auth/network-request-failed') {
        setErrors({ general: 'Netzwerkfehler. Prüfe deine Internetverbindung.' });
      } else if (err.code?.includes('permission-denied')) {
        setErrors({ general: 'Firestore Berechtigung fehlt. Kontaktiere Support.' });
      } else if (err.code === 'storage/unauthorized' || err.code === 'storage/permission-denied') {
        // Storage error - continue without avatar
        console.warn('⚠️ [REG] Storage permission denied, continuing without avatar...');
        setErrors({ general: 'Profilbild konnte nicht hochgeladen werden. Du kannst es später hinzufügen.' });
      } else if (err.code?.startsWith('storage/')) {
        // Other storage errors
        console.warn('⚠️ [REG] Storage error:', err.code);
        setErrors({ general: `Profilbild-Upload fehlgeschlagen: ${err.message}` });
      } else {
        setErrors({ general: `Fehler: ${err.code || err.message || 'Unbekannter Fehler'}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async (type: 'location' | 'microphone' | 'notifications') => {
    try {
      if (type === 'location') {
        const result = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
        });
        setPermissions(prev => ({ ...prev, location: 'granted' }));

        if (firebaseUser) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            location: { lat: result.coords.latitude, lng: result.coords.longitude, updatedAt: serverTimestamp() },
            'permissions.location': true
          }, { merge: true });
        }
      }

      if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissions(prev => ({ ...prev, microphone: 'granted' }));
        if (firebaseUser) {
          await setDoc(doc(db, 'users', firebaseUser.uid), { 'permissions.microphone': true }, { merge: true });
        }
      }

      if (type === 'notifications') {
        const result = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: result as PermissionStatus }));
        if (firebaseUser) {
          await setDoc(doc(db, 'users', firebaseUser.uid), { 'permissions.notifications': result === 'granted' }, { merge: true });
        }
      }
    } catch (error) {
      console.error(`Permission ${type} denied:`, error);
      setPermissions(prev => ({ ...prev, [type]: 'denied' }));
    }
  };

  const handleComplete = async () => {
    if (permissions.location !== 'granted') return;

    setIsLoading(true);
    try {
      if (firebaseUser) {
        await setDoc(doc(db, 'users', firebaseUser.uid), { onboardingCompleted: true }, { merge: true });
        await completeRegistration(
          firebaseUser.uid,
          formData.email,
          formData.username,
          referralValid ? referralCode || undefined : undefined
        );
      }
      navigate('/');
    } catch (error) {
      console.error('Completion error:', error);
      // Navigate anyway - user is registered
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  if (isCheckingCapacity) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="animate-spin mx-auto mb-4" size={32} style={{ color: t.accent }} />
          <p style={{ color: t.textSecondary }}>Prüfe Verfügbarkeit...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuraBackground theme={theme} />

      <AnimatePresence>
        {showSoldOut && (
          <SoldOutOverlay onClose={() => setShowSoldOut(false)} waitlistCount={capacity.current} />
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-6 safe-top safe-bottom">
        {/* Header with Exit */}
        <Header
          theme={theme}
          onExit={handleExit}
          showBack={currentStep !== 'credentials'}
          onBack={handleBack}
        />

        {/* Progress */}
        <ProgressBar currentStep={stepIndex} totalSteps={3} theme={theme} />

        {/* Steps */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            {currentStep === 'credentials' && (
              <CredentialsStep
                key="credentials"
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                onNext={handleCredentialsNext}
                isLoading={isLoading}
                referralValid={referralValid}
                referrerName={referrerName}
                theme={theme}
              />
            )}

            {currentStep === 'profile' && (
              <ProfileStep
                key="profile"
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                onNext={handleProfileNext}
                isLoading={isLoading}
                theme={theme}
              />
            )}

            {currentStep === 'permissions' && (
              <PermissionsStep
                key="permissions"
                permissions={permissions}
                onRequestPermission={handleRequestPermission}
                onComplete={handleComplete}
                onSkip={handleComplete}
                isLoading={isLoading}
                theme={theme}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.p
          className="text-xs text-center mt-6"
          style={{ color: t.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Mit der Registrierung akzeptierst du unsere{' '}
          <Link to="/agb" style={{ color: t.accent }}>AGB</Link>
          {' '}und{' '}
          <Link to="/datenschutz" style={{ color: t.accent }}>Datenschutzerklärung</Link>
        </motion.p>
      </div>
    </div>
  );
};

export default OnboardingFlow;
