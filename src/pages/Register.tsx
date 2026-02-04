import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import {
  ArrowLeft, Mail, Lock, User, Eye, EyeOff,
  Check, X, AlertCircle, ChevronDown, Loader2, Gift
} from 'lucide-react';
import { GirlMascot, FloatingMascot } from '@/components/Mascots';
import { findReferralByCode } from '@/lib/referralSystem';
import BetaCounter from '@/components/BetaCounter';
import {
  claimBetaSlot,
  joinWaitlist,
  subscribeToBetaCounter,
  BetaCounter as BetaCounterType,
  BETA_CONFIG,
} from '@/lib/betaCounterSystem';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  // Beta Counter State
  const [betaCounter, setBetaCounter] = useState<BetaCounterType | null>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  // Referral System
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage, languages } = useTranslation();

  // Subscribe to beta counter
  useEffect(() => {
    const unsubscribe = subscribeToBetaCounter((counter) => {
      setBetaCounter(counter);
      setIsCheckingLimit(false);
      if (!counter.isOpen) {
        setShowWaitlistForm(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 5) {
      setReferralValid(null);
      return;
    }

    setIsCheckingReferral(true);
    try {
      const result = await findReferralByCode(code);
      setReferralValid(result !== null);
    } catch (error) {
      setReferralValid(false);
    }
    setIsCheckingReferral(false);
  };

  // Debounced validation when user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (referralCode.length >= 5) {
        validateReferralCode(referralCode);
      } else {
        setReferralValid(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [referralCode]);

  // Join Waitlist Handler
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;

    setIsJoiningWaitlist(true);
    const result = await joinWaitlist(waitlistEmail, username, referralCode);

    if (result.success) {
      setWaitlistPosition(result.position);
    } else {
      setError(result.error || 'Fehler beim Eintragen');
    }
    setIsJoiningWaitlist(false);
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
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
      color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-500' : score === 3 ? 'bg-yellow-500' : score === 4 ? 'bg-green-500' : 'bg-emerald-500',
    };
  }, [password]);

  const texts = {
    de: {
      title: 'Account erstellen',
      subtitle: 'Werde Teil der Community',
      username: 'Benutzername',
      email: 'E-Mail Adresse',
      password: 'Passwort',
      createAccount: 'Account erstellen',
      creating: 'Wird erstellt...',
      or: 'oder',
      google: 'Mit Google fortfahren',
      apple: 'Mit Apple fortfahren',
      hasAccount: 'Schon registriert?',
      login: 'Anmelden',
      terms: 'Mit der Registrierung akzeptierst du unsere',
      termsLink: 'Nutzungsbedingungen',
      and: 'und',
      privacyLink: 'Datenschutzerklärung',
      pwStrength: 'Passwortstärke',
      pwLength: 'Min. 8 Zeichen',
      pwUpper: 'Großbuchstabe',
      pwLower: 'Kleinbuchstabe',
      pwNumber: 'Zahl',
      pwSpecial: 'Sonderzeichen',
      spotsLeft: 'Plätze verfügbar',
      waitlist: 'Warteliste',
      limitReached: 'Maximale Anzahl erreicht! Du kannst dich auf die Warteliste setzen.',
      referralCode: 'Einladungscode (optional)',
      referralValid: 'Gültiger Einladungscode! +250 XP Bonus',
      referralInvalid: 'Ungültiger Einladungscode',
    },
    en: {
      title: 'Create Account',
      subtitle: 'Join the community',
      username: 'Username',
      email: 'Email Address',
      password: 'Password',
      createAccount: 'Create Account',
      creating: 'Creating...',
      or: 'or',
      google: 'Continue with Google',
      apple: 'Continue with Apple',
      hasAccount: 'Already registered?',
      login: 'Sign In',
      terms: 'By signing up, you agree to our',
      termsLink: 'Terms of Service',
      and: 'and',
      privacyLink: 'Privacy Policy',
      pwStrength: 'Password strength',
      pwLength: 'Min. 8 characters',
      pwUpper: 'Uppercase letter',
      pwLower: 'Lowercase letter',
      pwNumber: 'Number',
      pwSpecial: 'Special character',
      spotsLeft: 'spots available',
      waitlist: 'Waitlist',
      limitReached: 'Maximum capacity reached! You can join the waitlist.',
      referralCode: 'Referral code (optional)',
      referralValid: 'Valid referral code! +250 XP bonus',
      referralInvalid: 'Invalid referral code',
    },
    es: {
      title: 'Crear cuenta',
      subtitle: 'Únete a la comunidad',
      username: 'Nombre de usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      createAccount: 'Crear cuenta',
      creating: 'Creando...',
      or: 'o',
      google: 'Continuar con Google',
      apple: 'Continuar con Apple',
      hasAccount: '¿Ya registrado?',
      login: 'Iniciar sesión',
      terms: 'Al registrarte, aceptas nuestros',
      termsLink: 'Términos de servicio',
      and: 'y',
      privacyLink: 'Política de privacidad',
      pwStrength: 'Fortaleza',
      pwLength: 'Mín. 8 caracteres',
      pwUpper: 'Mayúscula',
      pwLower: 'Minúscula',
      pwNumber: 'Número',
      pwSpecial: 'Carácter especial',
      spotsLeft: 'lugares disponibles',
      waitlist: 'Lista de espera',
      limitReached: '¡Capacidad máxima alcanzada! Puedes unirte a la lista de espera.',
      referralCode: 'Código de invitación (opcional)',
      referralValid: '¡Código válido! +250 XP bonus',
      referralInvalid: 'Código inválido',
    },
    fr: {
      title: 'Créer un compte',
      subtitle: 'Rejoignez la communauté',
      username: "Nom d'utilisateur",
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      createAccount: 'Créer un compte',
      creating: 'Création...',
      or: 'ou',
      google: 'Continuer avec Google',
      apple: 'Continuer avec Apple',
      hasAccount: 'Déjà inscrit?',
      login: 'Se connecter',
      terms: 'En vous inscrivant, vous acceptez nos',
      termsLink: "Conditions d'utilisation",
      and: 'et',
      privacyLink: 'Politique de confidentialité',
      pwStrength: 'Force du mot de passe',
      pwLength: 'Min. 8 caractères',
      pwUpper: 'Majuscule',
      pwLower: 'Minuscule',
      pwNumber: 'Chiffre',
      pwSpecial: 'Caractère spécial',
      spotsLeft: 'places disponibles',
      waitlist: "Liste d'attente",
      limitReached: 'Capacité maximale atteinte! Vous pouvez rejoindre la liste.',
      referralCode: "Code d'invitation (optionnel)",
      referralValid: 'Code valide! +250 XP bonus',
      referralInvalid: 'Code invalide',
    },
    pt: {
      title: 'Criar conta',
      subtitle: 'Junte-se à comunidade',
      username: 'Nome de usuário',
      email: 'Endereço de e-mail',
      password: 'Senha',
      createAccount: 'Criar conta',
      creating: 'Criando...',
      or: 'ou',
      google: 'Continuar com Google',
      apple: 'Continuar com Apple',
      hasAccount: 'Já registrado?',
      login: 'Entrar',
      terms: 'Ao se registrar, você concorda com nossos',
      termsLink: 'Termos de Serviço',
      and: 'e',
      privacyLink: 'Política de Privacidade',
      pwStrength: 'Força da senha',
      pwLength: 'Mín. 8 caracteres',
      pwUpper: 'Maiúscula',
      pwLower: 'Minúscula',
      pwNumber: 'Número',
      pwSpecial: 'Caractere especial',
      spotsLeft: 'vagas disponíveis',
      waitlist: 'Lista de espera',
      limitReached: 'Capacidade máxima atingida! Você pode entrar na lista de espera.',
      referralCode: 'Código de convite (opcional)',
      referralValid: 'Código válido! +250 XP bônus',
      referralInvalid: 'Código inválido',
    },
  };

  const txt = texts[language] || texts.de;
  const isLimitReached = betaCounter ? !betaCounter.isOpen : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLimitReached) {
      setShowWaitlistForm(true);
      return;
    }

    if (username.length < 3) {
      setError('Username muss mindestens 3 Zeichen haben');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort.');
      return;
    }

    setIsLoading(true);

    // First claim a beta slot
    const slotResult = await claimBetaSlot();

    if (!slotResult.success) {
      if (slotResult.slotsRemaining === 0) {
        setShowWaitlistForm(true);
        setIsLoading(false);
        return;
      }
      setError(slotResult.error || 'Keine Beta-Plätze mehr verfügbar');
      setIsLoading(false);
      return;
    }

    // Then register the user
    const result = await signUp(email, password, username, referralValid ? referralCode : undefined);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registrierung fehlgeschlagen');
    }

    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
    if (isLimitReached) {
      setError(txt.limitReached);
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await signInWithGoogle();

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Google Registrierung fehlgeschlagen');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-56 h-56 bg-gradient-to-tr from-pink-200/30 to-violet-200/30 rounded-full blur-3xl" />
        {/* Mascot decoration */}
        <div className="absolute bottom-8 right-4 opacity-30 hidden sm:block">
          <FloatingMascot delay={0.3}>
            <GirlMascot size={90} />
          </FloatingMascot>
        </div>
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100"
        >
          <span>{languages[language].flag}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
        </button>

        {showLanguageMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
            {Object.entries(languages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as any);
                  setShowLanguageMenu(false);
                }}
                className={`w-full px-4 py-2.5 flex items-center gap-2 hover:bg-violet-50 text-sm ${
                  language === code ? 'bg-violet-100' : ''
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 px-6 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
        </div>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-6">
            <span className="text-4xl">☁️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            {txt.title}
          </h1>
          <p className="text-gray-500">{txt.subtitle}</p>

          {/* Beta Slots Counter - FOMO Engine */}
          {!isCheckingLimit && (
            <div className="mt-6">
              <BetaCounter
                variant="hero"
                showProgress
                animated
                onSlotsChange={(slots: number) => {
                  if (slots === 0) setShowWaitlistForm(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Waitlist Form - Shows when Beta is Full */}
        {showWaitlistForm && isLimitReached && (
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-6 shadow-xl border border-purple-200 mb-6">
            {waitlistPosition ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Du bist auf der Warteliste!
                </h3>
                <p className="text-gray-600 mb-4">
                  Deine Position: <span className="font-bold text-purple-600">#{waitlistPosition}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Wir benachrichtigen dich, sobald ein Platz frei wird.
                </p>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Die Beta ist voll! 🔥
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sichere dir einen Platz auf der Warteliste
                  </p>
                </div>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Deine E-Mail Adresse"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoiningWaitlist}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  {isJoiningWaitlist ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Auf Warteliste setzen</span>
                      <span>✨</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Aktuell {betaCounter?.waitlistCount || 0} Personen auf der Warteliste
                </p>
              </form>
            )}
          </div>
        )}

        {/* Form Card - Hidden when Beta is Full */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-6 ${isLimitReached ? 'hidden' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {txt.username}
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  maxLength={20}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-violet-500 focus:bg-white focus:outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {txt.email}
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-violet-500 focus:bg-white focus:outline-none transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {txt.password}
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-violet-500 focus:bg-white focus:outline-none transition-all text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{passwordStrength.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'length', label: txt.pwLength },
                      { key: 'uppercase', label: txt.pwUpper },
                      { key: 'lowercase', label: txt.pwLower },
                      { key: 'number', label: txt.pwNumber },
                      { key: 'special', label: txt.pwSpecial },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center gap-1.5 ${
                          passwordStrength.checks[item.key as keyof typeof passwordStrength.checks]
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {passwordStrength.checks[item.key as keyof typeof passwordStrength.checks] ? (
                          <Check size={12} />
                        ) : (
                          <X size={12} />
                        )}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {txt.referralCode}
              </label>
              <div className="relative">
                <Gift
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="synclulu-XXXXX"
                  maxLength={12}
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:outline-none transition-all text-gray-900 font-mono ${
                    referralValid === true
                      ? 'border-green-500 bg-green-50'
                      : referralValid === false
                      ? 'border-red-300 bg-red-50'
                      : 'border-transparent focus:border-violet-500 focus:bg-white'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCheckingReferral ? (
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  ) : referralValid === true ? (
                    <Check size={18} className="text-green-500" />
                  ) : referralValid === false ? (
                    <X size={18} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              {referralValid === true && (
                <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
                  <Check size={14} />
                  {txt.referralValid}
                </p>
              )}
              {referralValid === false && referralCode.length >= 5 && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <X size={14} />
                  {txt.referralInvalid}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || isLimitReached}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-display font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {txt.creating}
                </>
              ) : (
                txt.createAccount
              )}
            </button>
          </form>
        </div>

        {/* Divider - Hidden when Beta is Full */}
        <div className={`flex items-center gap-4 mb-6 ${isLimitReached ? 'hidden' : ''}`}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">{txt.or}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Login - Hidden when Beta is Full */}
        <div className={`space-y-3 mb-8 ${isLimitReached ? 'hidden' : ''}`}>
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading || isLimitReached}
            className="w-full py-3.5 bg-white border-2 border-gray-200 rounded-xl font-medium flex items-center justify-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700">{txt.google}</span>
          </button>

          <button
            disabled
            className="w-full py-3.5 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>{txt.apple}</span>
            <span className="text-xs opacity-60">(Coming soon)</span>
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-500">
          {txt.hasAccount}{' '}
          <Link to="/login" className="text-violet-600 font-semibold hover:underline">
            {txt.login}
          </Link>
        </p>

        {/* Terms */}
        <p className="text-xs text-gray-400 text-center mt-6 px-4 leading-relaxed">
          {txt.terms}{' '}
          <Link to="/impressum" className="text-violet-500 hover:underline">{txt.termsLink}</Link>
          {' '}{txt.and}{' '}
          <Link to="/datenschutz" className="text-violet-500 hover:underline">{txt.privacyLink}</Link>.
        </p>
      </div>

      {/* Click outside to close language menu */}
      {showLanguageMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
      )}
    </div>
  );
};

export default Register;
