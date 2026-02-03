import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useTranslation, LANGUAGES, Language } from '@/lib/i18n';
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  MapPin, Users, Cloud, Sparkles,
  Eye, Lock, AlertTriangle, Globe, Check, X, Loader2, Gift, Ticket
} from 'lucide-react';
import { debounce } from 'lodash';
import { findReferralByCode, useReferralCode, initializeUserReferrals } from '@/lib/referralSystem';

type OnboardingStep = 'language' | 'invite' | 'age' | 'terms' | 'tutorial' | 'profile';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser, language, setLanguage } = useStore();
  const { t } = useTranslation();
  const [step, setStep] = useState<OnboardingStep>('language');
  const [isOver18, setIsOver18] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCommunity, setAcceptedCommunity] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Invite code
  const [inviteCode, setInviteCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid' | 'used'>('idle');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);

  // Profile data
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');

  // Full birthdate
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const [city, setCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Username validation
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' },
  ];

  // PRIORITIZED Deep-Link Validation: Auto-match token from URL before manual input
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('code') || searchParams.get('invite');

    if (refCode) {
      // Fuzzy matching for URL params: trim, normalize case, remove spaces
      const normalizedCode = refCode.trim().toUpperCase().replace(/\s+/g, '');
      setInviteCode(normalizedCode);

      // Immediately validate the deep-link code
      validateInviteCode(normalizedCode);

      // If we have a valid code from URL, we could auto-skip to age verification
      // after a short delay to show the user the code was accepted
    }
  }, [searchParams]);

  // Validate invite code with fuzzy matching & specific error messages
  const validateInviteCode = async (code: string) => {
    // Fuzzy matching: trim whitespace, normalize case
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    if (!normalizedCode || normalizedCode.length < 5) {
      setCodeStatus('idle');
      setCodeError(null);
      return;
    }

    setIsCheckingCode(true);
    setCodeError(null);

    try {
      const result = await findReferralByCode(normalizedCode);

      if (result) {
        // Result structure: { ownerId: string, link: ReferralLink }
        const { ownerId, link } = result;

        // Check if it's user's own code
        if (ownerId === user?.id) {
          setCodeStatus('invalid');
          setCodeError('❌ Du kannst deinen eigenen Code nicht verwenden');
        }
        // Check if code was already used
        else if (link.usedBy) {
          setCodeStatus('invalid');
          setCodeError('🚫 Dieser Code wurde bereits eingelöst');
        }
        // Check if code is deactivated
        else if (link.isActive === false) {
          setCodeStatus('invalid');
          setCodeError('⚠️ Dieser Code wurde deaktiviert');
        }
        else {
          setCodeStatus('valid');
          setReferrerId(ownerId);
          setCodeError(null);
        }
      } else {
        // Code not found - could be wrong code or already fully used
        setCodeStatus('invalid');
        setCodeError('🔍 Code nicht gefunden oder bereits vollständig eingelöst');
      }
    } catch (error: any) {
      console.error('Error checking invite code:', error);
      setCodeStatus('invalid');

      // Specific error messages based on error type
      if (error?.code === 'unavailable' || error?.message?.includes('network')) {
        setCodeError('📡 Server nicht erreichbar - bitte später erneut versuchen');
      } else if (error?.code === 'permission-denied') {
        setCodeError('🔒 Zugriff verweigert - Code konnte nicht geprüft werden');
      } else {
        setCodeError('⚠️ Verbindungsfehler - bitte erneut versuchen');
      }
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Handle invite code change with fuzzy matching
  const handleInviteCodeChange = (value: string) => {
    // Fuzzy matching: trim, uppercase, remove invalid chars but keep spaces temporarily
    const trimmed = value.trim();
    const normalized = trimmed.toUpperCase().replace(/[^A-Z0-9-\s]/g, '').replace(/\s+/g, '');
    setInviteCode(normalized);
    setCodeStatus('idle');
    setCodeError(null);

    if (normalized.length >= 5) {
      validateInviteCode(normalized);
    }
  };

  // Check username availability
  const checkUsernameAvailability = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 3) {
        setIsUsernameAvailable(null);
        setUsernameError(value.length > 0 ? 'Mindestens 3 Zeichen' : null);
        return;
      }

      if (value.length > 20) {
        setIsUsernameAvailable(false);
        setUsernameError('Maximal 20 Zeichen');
        return;
      }

      if (!/^[a-z0-9_]+$/.test(value)) {
        setIsUsernameAvailable(false);
        setUsernameError('Nur Kleinbuchstaben, Zahlen & Unterstriche');
        return;
      }

      const reserved = ['admin', 'delulu', 'support', 'help', 'system', 'mod', 'moderator'];
      if (reserved.includes(value)) {
        setIsUsernameAvailable(false);
        setUsernameError('Dieser Username ist reserviert');
        return;
      }

      setIsCheckingUsername(true);
      setUsernameError(null);

      try {
        const usernamesRef = collection(db, 'users');
        const q = query(usernamesRef, where('username', '==', value));
        const snapshot = await getDocs(q);

        // If we found a user and it's not the current user
        const isAvailable = snapshot.empty || snapshot.docs.every(doc => doc.id === user?.id);

        setIsUsernameAvailable(isAvailable);
        if (!isAvailable) {
          setUsernameError('Username bereits vergeben');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameError('Prüfung fehlgeschlagen');
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [user?.id]
  );

  // Handle username change
  const handleUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(normalized);
    setIsUsernameAvailable(null);
    setUsernameError(null);

    if (normalized) {
      checkUsernameAvailability(normalized);
    }
  };

  // Tutorial slides
  const tutorialSlides = [
    {
      icon: <Cloud size={64} className="text-delulu-violet" />,
      title: 'Willkommen in der Wolke',
      description: 'delulu verbindet dich mit Menschen in deiner Nähe über Voice-Chat. Tippe auf die Wolke um loszulegen.',
    },
    {
      icon: <MapPin size={64} className="text-green-500" />,
      title: 'Hyperlokal',
      description: 'Du siehst nur Menschen im Umkreis von max. 500m. Echte Nachbarn, echte Gespräche.',
    },
    {
      icon: <Eye size={64} className="text-purple-500" />,
      title: 'Anonym oder Offen',
      description: 'Du entscheidest bei jedem Chat ob du als du selbst oder als "Wanderer" anonym bleibst.',
    },
    {
      icon: <Lock size={64} className="text-blue-500" />,
      title: 'Privacy First',
      description: 'Deine Daten gehören dir. Kein Tracking, keine Algorithmen. Du hast die volle Kontrolle.',
    },
    {
      icon: <Users size={64} className="text-amber-500" />,
      title: 'Community Regeln',
      description: 'Respekt ist Pflicht. Belästigung, Hate Speech und unangemessenes Verhalten führen zum Ausschluss.',
    },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('delulu-language', lang);
  };

  const handleLanguageContinue = () => {
    setStep('invite');
  };

  const handleInviteContinue = () => {
    setStep('age');
  };

  const handleAgeVerification = () => {
    if (isOver18) {
      setStep('terms');
    }
  };

  const handleTermsAccept = () => {
    if (acceptedTerms && acceptedPrivacy && acceptedCommunity) {
      if (showTutorial) {
        setStep('tutorial');
      } else {
        setStep('profile');
      }
    }
  };

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSlides.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setStep('profile');
    }
  };

  const handleTutorialSkip = () => {
    setStep('profile');
  };

  // Validate birthdate
  const isBirthdateValid = () => {
    if (!birthDay || !birthMonth || !birthYear) return false;

    const day = parseInt(birthDay);
    const month = parseInt(birthMonth);
    const year = parseInt(birthYear);

    // Check if valid date
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return false;
    }

    // Check if at least 18 years old
    const today = new Date();
    const age = today.getFullYear() - year -
      (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);

    return age >= 18;
  };

  const handleProfileSave = async () => {
    if (!user || !username.trim() || !isUsernameAvailable || !isBirthdateValid()) return;

    setIsSaving(true);

    try {
      const birthDate = new Date(
        parseInt(birthYear),
        parseInt(birthMonth) - 1,
        parseInt(birthDay)
      );

      const profileData = {
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: displayName.trim() || username.trim(),
        bio: bio.trim(),
        birthDate,
        birthDay: parseInt(birthDay),
        birthMonth: parseInt(birthMonth),
        birthYear: parseInt(birthYear),
        showBirthdateOnProfile: true, // Default: show birthday
        city: city.trim(),
        language, // Save language preference from registration
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        isOver18Verified: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        communityGuidelinesAcceptedAt: new Date(),
        usernameLastChanged: new Date(),
        usernameChangeCount: 0,
      };

      await updateDoc(doc(db, 'users', user.id), profileData);

      // Process invite code if valid
      if (codeStatus === 'valid' && inviteCode && referrerId) {
        try {
          const result = await useReferralCode(inviteCode, user.id, username);
          if (result.success) {
            console.log('Referral code applied successfully');
          }
        } catch (err) {
          console.error('Error applying referral code:', err);
        }
      } else {
        // Initialize referrals for user without code
        try {
          await initializeUserReferrals(user.id);
        } catch (err) {
          console.error('Error initializing referrals:', err);
        }
      }

      setUser({
        ...user,
        ...profileData,
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSaveProfile = username.trim() &&
    isUsernameAvailable &&
    !isCheckingUsername &&
    isBirthdateValid();

  return (
    <div className="min-h-screen page-gradient theme-transition flex flex-col">
      {/* Progress indicator */}
      <div className="px-6 pt-6">
        <div className="flex gap-2">
          {['language', 'invite', 'age', 'terms', 'tutorial', 'profile'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ['language', 'invite', 'age', 'terms', 'tutorial', 'profile'].indexOf(step) >= i
                  ? 'bg-delulu-violet'
                  : 'bg-[var(--delulu-surface)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step: Language Selection */}
      {step === 'language' && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-delulu-violet/10 flex items-center justify-center">
                <Globe size={32} className="text-delulu-violet" />
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold text-delulu-text text-center mb-2">
              Wähle deine Sprache
            </h1>
            <p className="text-delulu-muted text-center mb-6">
              Choose your language
            </p>

            <div className="space-y-3">
              {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    language === lang
                      ? 'border-delulu-violet bg-delulu-violet/5'
                      : 'border-[var(--delulu-border)] hover:border-[var(--delulu-border)]'
                  }`}
                >
                  <span className="text-2xl">{LANGUAGES[lang].flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-delulu-text">{LANGUAGES[lang].native}</p>
                    <p className="text-xs text-delulu-muted">{LANGUAGES[lang].name}</p>
                  </div>
                  {language === lang && (
                    <Check size={20} className="text-delulu-violet" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLanguageContinue}
            className="w-full py-4 bg-delulu-violet text-white font-bold rounded-xl transition-opacity"
          >
            Weiter
          </button>
        </div>
      )}

      {/* Step: Invite Code */}
      {step === 'invite' && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('language')} className="p-2 -m-2">
                <ChevronLeft size={24} className="text-delulu-muted" />
              </button>
              <h1 className="font-display text-2xl font-bold text-delulu-text">
                Einladungscode
              </h1>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Gift size={40} className="text-white" />
              </div>
            </div>

            <p className="text-delulu-muted text-center mb-6">
              Hast du einen Einladungscode von einem Freund erhalten? Gib ihn hier ein um Bonus-XP zu erhalten!
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-delulu-text mb-2">
                Einladungscode (optional)
              </label>
              <div className="relative">
                <Ticket size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-delulu-muted" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => handleInviteCodeChange(e.target.value)}
                  placeholder="z.B. DELULU-ABC12"
                  maxLength={15}
                  className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none transition-colors font-mono text-lg tracking-wider ${
                    codeStatus === 'valid'
                      ? 'border-green-400 bg-green-50 focus:border-green-500'
                      : codeStatus === 'invalid'
                      ? 'border-red-300 bg-red-50 focus:border-red-500'
                      : 'border-[var(--delulu-border)] focus:border-delulu-violet'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCheckingCode ? (
                    <Loader2 size={20} className="text-[var(--delulu-muted)] animate-spin" />
                  ) : codeStatus === 'valid' ? (
                    <Check size={20} className="text-green-500" />
                  ) : codeStatus === 'invalid' ? (
                    <X size={20} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              {codeError && (
                <p className="text-red-500 text-sm mt-2">{codeError}</p>
              )}
              {codeStatus === 'valid' && (
                <div className="mt-3 p-3 bg-green-100 rounded-xl border border-green-200">
                  <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={16} />
                    Code gültig! Du erhältst 125 Bonus-XP bei der Registrierung.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl">
              <p className="text-sm text-purple-800">
                <strong>💡 Tipp:</strong> Ohne Einladungscode kannst du dich trotzdem registrieren. Nach der Registrierung erhältst du eigene Einladungscodes zum Teilen!
              </p>
            </div>
          </div>

          <button
            onClick={handleInviteContinue}
            className="w-full py-4 bg-delulu-violet text-white font-bold rounded-xl transition-opacity flex items-center justify-center gap-2"
          >
            {codeStatus === 'valid' ? (
              <>
                <Check size={20} />
                Weiter mit Code
              </>
            ) : (
              'Weiter ohne Code'
            )}
          </button>
        </div>
      )}

      {/* Step: Age Verification */}
      {step === 'age' && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <AlertTriangle size={40} className="text-amber-600" />
            </div>

            <h1 className="font-display text-2xl font-bold text-delulu-text mb-4">
              Altersverifikation
            </h1>

            <p className="text-delulu-muted mb-8 max-w-sm">
              delulu ist eine Plattform für Erwachsene. Du musst mindestens 18 Jahre alt sein um die App zu nutzen.
            </p>

            <label className="flex items-start gap-3 p-4 bg-[var(--delulu-card)] rounded-xl border-2 border-[var(--delulu-border)] cursor-pointer mb-6 text-left max-w-sm">
              <input
                type="checkbox"
                checked={isOver18}
                onChange={(e) => setIsOver18(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-[var(--delulu-border)] text-delulu-violet focus:ring-delulu-violet"
              />
              <div>
                <p className="font-semibold text-delulu-text">Ich bestätige, dass ich 18 Jahre oder älter bin</p>
                <p className="text-sm text-delulu-muted mt-1">
                  Falsche Angaben führen zur sofortigen Sperrung des Accounts.
                </p>
              </div>
            </label>

            <p className="text-xs text-delulu-muted max-w-sm">
              Bei Verdacht auf Minderjährigkeit kann eine ID-Verifikation angefordert werden.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('invite')}
              className="py-4 px-6 border-2 border-[var(--delulu-border)] text-delulu-muted font-semibold rounded-xl"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleAgeVerification}
              disabled={!isOver18}
              className="flex-1 py-4 bg-delulu-violet text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Step: Terms & Conditions */}
      {step === 'terms' && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('age')} className="p-2 -m-2">
                <ChevronLeft size={24} className="text-delulu-muted" />
              </button>
              <h1 className="font-display text-2xl font-bold text-delulu-text">
                Nutzungsbedingungen
              </h1>
            </div>

            <p className="text-delulu-muted mb-6">
              Bitte lies und akzeptiere unsere Richtlinien um fortzufahren.
            </p>

            <div className="space-y-4 mb-6">
              {/* Terms */}
              <label className="flex items-start gap-3 p-4 bg-[var(--delulu-card)] rounded-xl border-2 border-[var(--delulu-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--delulu-border)] text-delulu-violet focus:ring-delulu-violet"
                />
                <div className="flex-1">
                  <p className="font-semibold text-delulu-text">AGB akzeptieren</p>
                  <p className="text-sm text-delulu-muted">
                    Ich habe die{' '}
                    <a href="/impressum" className="text-delulu-violet underline">
                      Allgemeinen Geschäftsbedingungen
                    </a>{' '}
                    gelesen und akzeptiere diese.
                  </p>
                </div>
              </label>

              {/* Privacy */}
              <label className="flex items-start gap-3 p-4 bg-[var(--delulu-card)] rounded-xl border-2 border-[var(--delulu-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--delulu-border)] text-delulu-violet focus:ring-delulu-violet"
                />
                <div className="flex-1">
                  <p className="font-semibold text-delulu-text">Datenschutz akzeptieren</p>
                  <p className="text-sm text-delulu-muted">
                    Ich habe die{' '}
                    <a href="/datenschutz" className="text-delulu-violet underline">
                      Datenschutzerklärung
                    </a>{' '}
                    gelesen und akzeptiere diese.
                  </p>
                </div>
              </label>

              {/* Community Guidelines */}
              <label className="flex items-start gap-3 p-4 bg-[var(--delulu-card)] rounded-xl border-2 border-[var(--delulu-border)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedCommunity}
                  onChange={(e) => setAcceptedCommunity(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-[var(--delulu-border)] text-delulu-violet focus:ring-delulu-violet"
                />
                <div className="flex-1">
                  <p className="font-semibold text-delulu-text">Community-Regeln akzeptieren</p>
                  <p className="text-sm text-delulu-muted">
                    Ich verpflichte mich zu respektvollem Umgang. Belästigung, Hate Speech und unangemessenes Verhalten sind verboten.
                  </p>
                </div>
              </label>
            </div>

            {/* Tutorial toggle */}
            <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={showTutorial}
                onChange={(e) => setShowTutorial(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--delulu-border)] text-delulu-violet focus:ring-delulu-violet"
              />
              <div>
                <p className="font-semibold text-delulu-text">App-Einführung anzeigen</p>
                <p className="text-sm text-delulu-muted">Kurze Erklärung wie delulu funktioniert</p>
              </div>
            </label>
          </div>

          <button
            onClick={handleTermsAccept}
            disabled={!acceptedTerms || !acceptedPrivacy || !acceptedCommunity}
            className="w-full py-4 bg-delulu-violet text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Weiter
          </button>
        </div>
      )}

      {/* Step: Tutorial */}
      {step === 'tutorial' && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-8">
              {tutorialSlides[tutorialStep].icon}
            </div>

            <h2 className="font-display text-2xl font-bold text-delulu-text mb-4">
              {tutorialSlides[tutorialStep].title}
            </h2>

            <p className="text-delulu-muted max-w-sm mb-8">
              {tutorialSlides[tutorialStep].description}
            </p>

            {/* Dots */}
            <div className="flex gap-2">
              {tutorialSlides.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === tutorialStep ? 'bg-delulu-violet w-6' : 'bg-[var(--delulu-border)]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTutorialSkip}
              className="flex-1 py-4 border-2 border-[var(--delulu-border)] text-delulu-muted font-semibold rounded-xl"
            >
              Überspringen
            </button>
            <button
              onClick={handleTutorialNext}
              className="flex-1 py-4 bg-delulu-violet text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {tutorialStep < tutorialSlides.length - 1 ? (
                <>Weiter <ChevronRight size={20} /></>
              ) : (
                <>Los geht's <Sparkles size={20} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Profile Setup */}
      {step === 'profile' && (
        <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('tutorial')} className="p-2 -m-2">
                <ChevronLeft size={24} className="text-delulu-muted" />
              </button>
              <h1 className="font-display text-2xl font-bold text-delulu-text">
                Dein Profil
              </h1>
            </div>

            <p className="text-delulu-muted mb-6">
              Richte dein Profil ein. Du kannst diese Angaben später jederzeit ändern.
            </p>

            <div className="space-y-4">
              {/* Username with real-time availability check */}
              <div>
                <label className="block text-sm font-semibold text-delulu-text mb-2">
                  Benutzername *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-delulu-muted">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="dein_name"
                    maxLength={20}
                    className={`w-full pl-8 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      usernameError
                        ? 'border-red-300 focus:border-red-500'
                        : isUsernameAvailable
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-[var(--delulu-border)] focus:border-delulu-violet'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 size={20} className="text-[var(--delulu-muted)] animate-spin" />
                    ) : isUsernameAvailable === true ? (
                      <Check size={20} className="text-green-500" />
                    ) : isUsernameAvailable === false ? (
                      <X size={20} className="text-red-500" />
                    ) : null}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-red-500 text-xs mt-1">{usernameError}</p>
                )}
                {isUsernameAvailable && (
                  <p className="text-green-600 text-xs mt-1">✓ @{username} ist verfügbar</p>
                )}
                <p className="text-xs text-delulu-muted mt-1">
                  Einzigartig, nur Kleinbuchstaben, Zahlen & Unterstriche
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-delulu-text mb-2">
                  Anzeigename
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Wie sollen dich andere sehen?"
                  maxLength={30}
                  className="w-full px-4 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none"
                />
              </div>

              {/* Full Birthdate */}
              <div>
                <label className="block text-sm font-semibold text-delulu-text mb-2">
                  Geburtsdatum *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Day */}
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="px-3 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none bg-[var(--delulu-card)]"
                  >
                    <option value="">Tag</option>
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Month */}
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="px-3 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none bg-[var(--delulu-card)]"
                  >
                    <option value="">Monat</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>

                  {/* Year */}
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="px-3 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none bg-[var(--delulu-card)]"
                  >
                    <option value="">Jahr</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                {birthDay && birthMonth && birthYear && !isBirthdateValid() && (
                  <p className="text-red-500 text-xs mt-1">
                    Du musst mindestens 18 Jahre alt sein
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-delulu-text mb-2">
                  Stadt / Region
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="z.B. Berlin, München..."
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-delulu-text mb-2">
                  Über dich
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Erzähl etwas über dich... (optional)"
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[var(--delulu-border)] rounded-xl focus:border-delulu-violet focus:outline-none resize-none"
                />
                <p className="text-xs text-delulu-muted mt-1 text-right">{bio.length}/200</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={!canSaveProfile || isSaving}
            className="w-full py-4 bg-delulu-violet text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 mt-6"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Profil speichern & starten
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
