/**
 * synclulu INVITE-ONLY REGISTRATION v2.0
 * "The FOMO Experience"
 *
 * FLOW:
 * 1. User arrives with/without invite code
 * 2. Code validated → Registration unlocked
 * 3. No valid code → Waitlist + FOMO animation
 *
 * @design Clubhouse Exclusivity meets Apple Elegance
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  validateInviteCode,
  useInviteCode,
  joinWaitlist,
  storeInviteCode,
  InviteValidation,
} from '@/lib/inviteSystem';
import { colors } from '@/lib/theme';
import {
  Sparkles, Lock, Unlock, Mail, Eye, EyeOff,
  User, ArrowRight, Check, X, Clock, Crown,
  Gift, Shield, ChevronLeft
} from 'lucide-react';

// ═══════════════════════════════════════
// FOMO ANIMATION COMPONENT
// ═══════════════════════════════════════

const SoldOutAnimation = () => (
  <div className="relative">
    {/* Pulsing rings */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-32 h-32 rounded-full border-2 border-purple-500/20 animate-ping" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 animate-pulse" />
    </div>

    {/* Center icon */}
    <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
      <Lock size={32} className="text-purple-400" />
    </div>
  </div>
);

// ═══════════════════════════════════════
// UNLOCK ANIMATION COMPONENT
// ═══════════════════════════════════════

const UnlockAnimation = () => (
  <div className="relative">
    {/* Success burst */}
    <div className="absolute inset-0 flex items-center justify-center">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-green-400 rounded-full animate-burst"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-40px)`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>

    {/* Center icon */}
    <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center animate-bounce-once">
      <Unlock size={32} className="text-green-400" />
    </div>
  </div>
);

// ═══════════════════════════════════════
// WAITLIST CARD
// ═══════════════════════════════════════

interface WaitlistCardProps {
  onJoin: (email: string, name: string) => Promise<void>;
  isLoading: boolean;
  position?: number;
}

const WaitlistCard: React.FC<WaitlistCardProps> = ({ onJoin, isLoading, position }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onJoin(email, name);
    setJoined(true);
  };

  if (joined && position) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Check size={28} className="text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Du bist auf der Liste!</h3>
        <p className="text-gray-400 mb-4">
          Position <span className="text-purple-400 font-bold">#{position}</span>
        </p>
        <p className="text-sm text-gray-500">
          Wir benachrichtigen dich, sobald ein Platz frei wird.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">E-Mail *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Clock size={18} />
            Auf Warteliste setzen
          </>
        )}
      </button>
    </form>
  );
};

// ═══════════════════════════════════════
// MAIN REGISTRATION PAGE
// ═══════════════════════════════════════

const RegisterInvite = () => {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const [searchParams] = useSearchParams();

  // State
  const [inviteCode, setInviteCode] = useState('');
  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Registration form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  // Waitlist
  const [waitlistPosition, setWaitlistPosition] = useState<number>();
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  // Check URL for invite code on mount
  useEffect(() => {
    const codeFromURL = urlCode || searchParams.get('code') || searchParams.get('invite');
    if (codeFromURL) {
      setInviteCode(codeFromURL.toUpperCase());
      handleValidate(codeFromURL);
    }
  }, [urlCode, searchParams]);

  // Validate invite code
  const handleValidate = async (codeToValidate?: string) => {
    const code = codeToValidate || inviteCode;
    if (!code.trim()) return;

    setIsValidating(true);
    setError('');

    try {
      const result = await validateInviteCode(code);
      setValidation(result);

      if (result.isValid) {
        storeInviteCode(code);
        // Delay unlock animation
        setTimeout(() => setIsUnlocked(true), 500);
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50, 30, 100]);
      } else {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      setValidation({ isValid: false, error: 'INVALID', message: 'Validierung fehlgeschlagen' });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation?.isValid || !email || !password || !displayName) return;

    setIsRegistering(true);
    setError('');

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName,
        username: displayName.toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: null,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        level: 1,
        xp: 0,
        isPremium: false,
        isCreator: false,
        invitedBy: validation.code?.creatorId || null,
        inviteCode: inviteCode,
      });

      // Use the invite code (link to referrer)
      await useInviteCode(inviteCode, user.uid, displayName);

      // Navigate to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      console.error('[Register] Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail wird bereits verwendet');
      } else if (err.code === 'auth/weak-password') {
        setError('Passwort muss mindestens 6 Zeichen haben');
      } else {
        setError('Registrierung fehlgeschlagen');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (!validation?.isValid) return;

    setIsRegistering(true);
    setError('');

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
        isPremium: false,
        isCreator: false,
        invitedBy: validation.code?.creatorId || null,
        inviteCode: inviteCode,
      }, { merge: true });

      await useInviteCode(inviteCode, user.uid, user.displayName || 'Anonym');
      navigate('/onboarding');
    } catch (err: any) {
      console.error('[Google Sign In] Error:', err);
      setError('Google Anmeldung fehlgeschlagen');
    } finally {
      setIsRegistering(false);
    }
  };

  // Join waitlist
  const handleJoinWaitlist = async (email: string, name: string) => {
    setIsJoiningWaitlist(true);
    const result = await joinWaitlist(email, name, 'registration_page');
    if (result.success && result.position) {
      setWaitlistPosition(result.position);
    }
    setIsJoiningWaitlist(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: colors.dark.bg.primary }}
    >
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            synclulu
          </h1>
          <p className="text-center text-gray-500 text-sm mt-1">Invite-Only Beta</p>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* STATE: NO CODE ENTERED YET */}
        {/* ═══════════════════════════════════════ */}
        {!validation && (
          <div className="w-full max-w-sm">
            <div
              className="rounded-3xl p-6 border"
              style={{
                background: colors.dark.bg.secondary,
                borderColor: colors.dark.border.default,
              }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Gift size={28} className="text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Hast du einen Einladungscode?
                </h2>
                <p className="text-gray-400 text-sm">
                  synclulu ist nur mit Einladung zugänglich
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="synclulu-XXXXXX"
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center font-mono text-lg tracking-widest placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all uppercase"
                  />
                </div>
                <button
                  onClick={() => handleValidate()}
                  disabled={isValidating || !inviteCode.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isValidating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield size={18} />
                      Code prüfen
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* No code link */}
            <button
              onClick={() => setValidation({ isValid: false, error: 'INVALID', message: 'Kein Code' })}
              className="w-full mt-4 py-3 text-gray-400 text-sm hover:text-white transition-colors"
            >
              Ich habe keinen Code
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STATE: CODE INVALID - SHOW WAITLIST */}
        {/* ═══════════════════════════════════════ */}
        {validation && !validation.isValid && (
          <div className="w-full max-w-sm">
            <div
              className="rounded-3xl p-6 border"
              style={{
                background: colors.dark.bg.secondary,
                borderColor: colors.dark.border.default,
              }}
            >
              <SoldOutAnimation />

              <div className="text-center mt-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {validation.error === 'USED_UP'
                    ? 'Code vollständig eingelöst'
                    : validation.error === 'EXPIRED'
                    ? 'Code abgelaufen'
                    : 'Zugang limitiert'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {validation.message || 'Tritt der Warteliste bei, um benachrichtigt zu werden'}
                </p>
              </div>

              <WaitlistCard
                onJoin={handleJoinWaitlist}
                isLoading={isJoiningWaitlist}
                position={waitlistPosition}
              />

              {/* Try another code */}
              <button
                onClick={() => {
                  setValidation(null);
                  setInviteCode('');
                }}
                className="w-full mt-4 py-3 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Anderen Code eingeben
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* STATE: CODE VALID - SHOW REGISTRATION */}
        {/* ═══════════════════════════════════════ */}
        {validation?.isValid && (
          <div className="w-full max-w-sm">
            <div
              className="rounded-3xl p-6 border"
              style={{
                background: colors.dark.bg.secondary,
                borderColor: colors.dark.border.default,
              }}
            >
              {!isUnlocked ? (
                <div className="py-8">
                  <div className="w-12 h-12 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <UnlockAnimation />

                  <div className="text-center mt-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">
                      Willkommen im Club! 🎉
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Eingeladen von{' '}
                      <span className="text-purple-400 font-semibold">
                        {validation.code?.creatorName || 'einem Freund'}
                      </span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Dein Name"
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">E-Mail</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="deine@email.de"
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isRegistering ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Account erstellen
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-500 text-sm">oder</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isRegistering}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/10 disabled:opacity-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Mit Google fortfahren
                  </button>
                </>
              )}
            </div>

            {/* Login link */}
            <p className="text-center mt-6 text-gray-400 text-sm">
              Bereits registriert?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Anmelden
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes burst {
          0% {
            transform: rotate(var(--rotation)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-60px) scale(0);
            opacity: 0;
          }
        }
        .animate-burst {
          animation: burst 0.6s ease-out forwards;
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterInvite;
