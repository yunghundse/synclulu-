/**
 * synclulu REGISTER v3.0 - Glassmorphism Edition
 *
 * "The Cloud is Exclusive - Only the Chosen Ones Enter"
 *
 * FEATURES:
 * - 10-User Hard Cap with Sold-Out Overlay
 * - Referral System with 5-Star Rewards
 * - Founder Auto-Detection (jan@synclulu.app)
 * - Apple-Standard Glassmorphism UI
 * - Animated Background Nebula
 *
 * @design Glassmorphism + Neon Glow
 * @version 3.0.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  ArrowLeft, Mail, Lock, User, Eye, EyeOff,
  Check, X, AlertCircle, Loader2, Gift, Sparkles,
  Users, Star, Crown
} from 'lucide-react';
import {
  checkCapacity,
  validateRegistration,
  validateReferralCode,
  completeRegistration,
  addToWaitlist,
  extractReferralCode,
  GATEKEEPER_CONFIG
} from '@/lib/gatekeeperSystem';
import { SyncluluError, SyncluluInlineError, LoadingCloud } from '@/components/SyncluluError';
import { SoldOutOverlay } from '@/components/SoldOutOverlay';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

const NebulaBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Base gradient */}
    <div className="absolute inset-0 bg-[#0b0b0b]" />

    {/* Nebula orbs */}
    <motion.div
      className="absolute top-1/4 -left-20 w-96 h-96 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)'
      }}
      animate={{
        x: [0, 30, 0],
        y: [0, -20, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        filter: 'blur(50px)'
      }}
      animate={{
        x: [0, -25, 0],
        y: [0, 25, 0],
        scale: [1, 1.15, 1]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)'
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    />

    {/* Floating particles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-purple-400/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2
        }}
      />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// CAPACITY BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface CapacityBadgeProps {
  current: number;
  max: number;
  isLoading?: boolean;
}

const CapacityBadge = ({ current, max, isLoading }: CapacityBadgeProps) => {
  const remaining = Math.max(0, max - current);
  const percentage = (current / max) * 100;

  return (
    <motion.div
      className="relative px-5 py-3 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent)'
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Users size={20} className="text-purple-400" />
        </motion.div>

        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-purple-400" />
        ) : (
          <div className="text-center">
            <div className="text-sm text-gray-400">
              {remaining > 0 ? (
                <>
                  <span className="text-purple-400 font-bold">{remaining}</span>
                  {' '}von {max} Plätzen frei
                </>
              ) : (
                <span className="text-red-400">Die Cloud ist voll</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: percentage >= 100
                    ? 'linear-gradient(90deg, #EF4444, #F87171)'
                    : 'linear-gradient(90deg, #8B5CF6, #A78BFA)'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface ReferralBadgeProps {
  referrerName: string;
}

const ReferralBadge = ({ referrerName }: ReferralBadgeProps) => (
  <motion.div
    className="flex items-center gap-2 px-4 py-2 rounded-xl"
    style={{
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)'
    }}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Gift size={16} className="text-green-400" />
    <span className="text-sm text-green-400">
      Eingeladen von <strong>{referrerName}</strong> • +5 Sterne Bonus!
    </span>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface GlassInputProps {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  success?: boolean;
  suffix?: React.ReactNode;
  maxLength?: number;
  autoFocus?: boolean;
}

const GlassInput = ({
  icon,
  type,
  value,
  onChange,
  placeholder,
  error,
  success,
  suffix,
  maxLength,
  autoFocus
}: GlassInputProps) => (
  <div className="relative">
    <div
      className={`relative flex items-center rounded-xl transition-all duration-300 ${
        error
          ? 'ring-2 ring-red-500/50'
          : success
          ? 'ring-2 ring-green-500/50'
          : 'focus-within:ring-2 focus-within:ring-purple-500/50'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${
          error
            ? 'rgba(239, 68, 68, 0.3)'
            : success
            ? 'rgba(34, 197, 94, 0.3)'
            : 'rgba(255, 255, 255, 0.1)'
        }`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="pl-4 text-gray-500">{icon}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="flex-1 px-3 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none"
      />
      {suffix && <div className="pr-4">{suffix}</div>}
    </div>
    {error && <SyncluluInlineError message={error} className="mt-1" />}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ═══════════════════════════════════════════════════════════════════════════

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const strength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    return {
      score,
      checks,
      label: score <= 1 ? 'Sehr schwach' : score === 2 ? 'Schwach' : score === 3 ? 'Mittel' : score === 4 ? 'Stark' : 'Sehr stark',
      color: score <= 1 ? '#EF4444' : score === 2 ? '#F59E0B' : score === 3 ? '#EAB308' : score === 4 ? '#22C55E' : '#10B981'
    };
  }, [password]);

  if (!password) return null;

  return (
    <motion.div
      className="space-y-2 mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: strength.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {[
          { key: 'length', label: 'Min. 8 Zeichen' },
          { key: 'uppercase', label: 'Großbuchstabe' },
          { key: 'lowercase', label: 'Kleinbuchstabe' },
          { key: 'number', label: 'Zahl' },
          { key: 'special', label: 'Sonderzeichen' }
        ].map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 ${
              strength.checks[item.key as keyof typeof strength.checks]
                ? 'text-green-400'
                : 'text-gray-500'
            }`}
          >
            {strength.checks[item.key as keyof typeof strength.checks] ? (
              <Check size={12} />
            ) : (
              <X size={12} />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const syncluluRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capacity State
  const [capacity, setCapacity] = useState({ current: 0, max: 10, isFull: false });
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(true);
  const [showSoldOut, setShowSoldOut] = useState(false);

  // Referral State
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Waitlist State
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Check capacity on mount
  useEffect(() => {
    const loadCapacity = async () => {
      try {
        const status = await checkCapacity();
        setCapacity({
          current: status.currentUsers,
          max: status.maxUsers,
          isFull: status.isFull
        });
        if (status.isFull) {
          setShowSoldOut(true);
        }
      } catch (error) {
        console.error('Error checking capacity:', error);
      } finally {
        setIsCheckingCapacity(false);
      }
    };
    loadCapacity();
  }, []);

  // Extract referral code from URL
  useEffect(() => {
    const code = extractReferralCode();
    if (code) {
      setReferralCode(code);
      validateReferral(code);
    }
  }, [searchParams]);

  // Validate referral code
  const validateReferral = useCallback(async (code: string) => {
    if (!code || code.length < 5) {
      setReferralValid(null);
      setReferrerName(null);
      return;
    }

    setIsCheckingReferral(true);
    try {
      const result = await validateReferralCode(code);
      setReferralValid(result.valid);
      setReferrerName(result.valid ? result.referrerUsername || 'Ein Freund' : null);
    } catch (error) {
      setReferralValid(false);
    } finally {
      setIsCheckingReferral(false);
    }
  }, []);

  // Debounced referral validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (referralCode.length >= 5) {
        validateReferral(referralCode);
      } else {
        setReferralValid(null);
        setReferrerName(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [referralCode, validateReferral]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username || username.length < 3) {
      newErrors.username = 'Mindestens 3 Zeichen';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Gültige E-Mail erforderlich';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Mindestens 6 Zeichen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // Check if sold out
    if (capacity.isFull) {
      setShowSoldOut(true);
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Re-check capacity
      const validation = await validateRegistration();
      if (!validation.canRegister) {
        setCapacity({
          current: validation.capacity.currentUsers,
          max: validation.capacity.maxUsers,
          isFull: true
        });
        setShowSoldOut(true);
        setIsLoading(false);
        return;
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document with Gatekeeper data
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: username,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        avatarUrl: null,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        level: 1,
        xp: 0,
        nebulaStars: referralValid ? GATEKEEPER_CONFIG.referralRewardNewUser : 0,
        isPremium: false,
        role: 'user',
        searchRadius: GATEKEEPER_CONFIG.standardRadius,
        // Referral tracking
        referredBy: referralValid ? referrerName : null,
        referredByCode: referralValid ? referralCode : null
      });

      // Complete registration (increment count, apply referral, create referral code)
      await completeRegistration(
        user.uid,
        email,
        username,
        referralValid ? referralCode : undefined
      );

      // Navigate to onboarding
      navigate('/onboarding');

    } catch (err: any) {
      console.error('[Register] Error:', err);

      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Diese E-Mail wird bereits verwendet' });
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'Passwort ist zu schwach' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Ungültige E-Mail Adresse' });
      } else {
        setGlobalError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-Up
  const handleGoogleSignUp = async () => {
    if (capacity.isFull) {
      setShowSoldOut(true);
      return;
    }

    setIsLoading(true);
    setGlobalError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonym',
        username: (user.displayName || 'user').toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: user.photoURL,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        level: 1,
        xp: 0,
        nebulaStars: referralValid ? GATEKEEPER_CONFIG.referralRewardNewUser : 0,
        isPremium: false,
        role: 'user',
        searchRadius: GATEKEEPER_CONFIG.standardRadius,
        referredBy: referralValid ? referrerName : null,
        referredByCode: referralValid ? referralCode : null
      }, { merge: true });

      await completeRegistration(
        user.uid,
        user.email || '',
        user.displayName || 'User',
        referralValid ? referralCode : undefined
      );

      navigate('/onboarding');
    } catch (err: any) {
      console.error('[Google Sign Up] Error:', err);
      setGlobalError('Google Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  // Join waitlist
  const handleJoinWaitlist = async () => {
    if (!waitlistEmail) return;

    setIsLoading(true);
    const result = await addToWaitlist(waitlistEmail, referralCode);

    if (result.success) {
      setWaitlistPosition(result.position);
    } else {
      setGlobalError('Fehler beim Eintragen in die Warteliste');
    }
    setIsLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Show loading while checking capacity
  if (isCheckingCapacity) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <LoadingCloud message="Prüfe Verfügbarkeit..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NebulaBackground />

      {/* Sold Out Overlay */}
      <AnimatePresence>
        {showSoldOut && (
          <SoldOutOverlay
            onClose={() => setShowSoldOut(false)}
            waitlistCount={capacity.current}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>

          <CapacityBadge
            current={capacity.current}
            max={capacity.max}
            isLoading={isCheckingCapacity}
          />
        </div>

        {/* Logo & Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
            animate={{
              boxShadow: [
                '0 0 60px rgba(139, 92, 246, 0.3)',
                '0 0 80px rgba(139, 92, 246, 0.4)',
                '0 0 60px rgba(139, 92, 246, 0.3)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-5xl">☁️</span>
          </motion.div>

          <h1
            className="text-4xl font-black mb-2"
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Willkommen
          </h1>
          <p className="text-gray-400">
            Tritt der exklusiven Cloud bei
          </p>
        </motion.div>

        {/* Referral Badge */}
        <AnimatePresence>
          {referralValid && referrerName && (
            <motion.div className="mb-6">
              <ReferralBadge referrerName={referrerName} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <motion.div
          className="rounded-3xl p-6 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <GlassInput
              icon={<User size={18} />}
              type="text"
              value={username}
              onChange={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Benutzername"
              error={errors.username}
              maxLength={20}
              autoFocus
            />

            {/* Email */}
            <GlassInput
              icon={<Mail size={18} />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="E-Mail Adresse"
              error={errors.email}
            />

            {/* Password */}
            <div>
              <GlassInput
                icon={<Lock size={18} />}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Passwort"
                error={errors.password}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>

            {/* Referral Code */}
            <GlassInput
              icon={<Gift size={18} />}
              type="text"
              value={referralCode}
              onChange={(val) => setReferralCode(val.toUpperCase())}
              placeholder="Einladungscode (optional)"
              error={referralValid === false && referralCode.length >= 5 ? 'Ungültiger Code' : undefined}
              success={referralValid === true}
              maxLength={15}
              suffix={
                isCheckingReferral ? (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                ) : referralValid === true ? (
                  <Check size={16} className="text-green-400" />
                ) : referralValid === false && referralCode.length >= 5 ? (
                  <X size={16} className="text-red-400" />
                ) : null
              }
            />

            {/* Global Error */}
            <AnimatePresence>
              {globalError && (
                <SyncluluError
                  message={globalError}
                  severity="error"
                  onDismiss={() => setGlobalError(null)}
                />
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || capacity.isFull}
              className="w-full py-4 rounded-xl font-semibold text-white relative overflow-hidden disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Account erstellen
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-sm">oder</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Sign Up */}
        <motion.button
          onClick={handleGoogleSignUp}
          disabled={isLoading || capacity.isFull}
          className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-white">Mit Google fortfahren</span>
        </motion.button>

        {/* Login Link */}
        <motion.p
          className="text-center text-gray-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Bereits registriert?{' '}
          <Link
            to="/login"
            className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            Anmelden
          </Link>
        </motion.p>

        {/* Terms */}
        <motion.p
          className="text-xs text-gray-500 text-center mt-6 px-4 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Mit der Registrierung akzeptierst du unsere{' '}
          <Link to="/agb" className="text-purple-400 hover:underline">AGB</Link>
          {' '}und{' '}
          <Link to="/datenschutz" className="text-purple-400 hover:underline">Datenschutzerklärung</Link>.
        </motion.p>
      </div>
    </div>
  );
};

export default syncluluRegister;
