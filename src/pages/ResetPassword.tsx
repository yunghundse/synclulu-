import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, Eye, EyeOff, Check, X, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { SailorMascot, PegasusMascot, FloatingMascot } from '@/components/Mascots';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const oobCode = searchParams.get('oobCode');

  // Verify the reset code on mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Ungültiger oder abgelaufener Link');
        setIsVerifying(false);
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setIsVerifying(false);
      } catch (err: any) {
        setError('Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.');
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  // Password strength check
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordValid = passwordScore >= 4;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Bitte wähle ein stärkeres Passwort');
      return;
    }

    if (!passwordsMatch) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (!oobCode) {
      setError('Ungültiger Reset-Link');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/expired-action-code') {
        setError('Dieser Link ist abgelaufen. Bitte fordere einen neuen an.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('Dieser Link ist ungültig. Bitte fordere einen neuen an.');
      } else if (err.code === 'auth/weak-password') {
        setError('Das Passwort ist zu schwach.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading/Verifying state
  if (isVerifying) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 flex items-center justify-center px-6">
        <div className="text-center">
          <FloatingMascot>
            <PegasusMascot size={120} className="mx-auto mb-6" />
          </FloatingMascot>
          <div className="animate-pulse">
            <p className="text-gray-600 font-medium">Link wird überprüft...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired link)
  if (error && !email) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <FloatingMascot>
            <SailorMascot size={140} className="mx-auto mb-4" />
          </FloatingMascot>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Link ungültig
          </h1>
          <p className="text-gray-500 mb-8">
            {error}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-display font-bold rounded-2xl shadow-lg"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Passwort geändert! 🎉
          </h1>
          <p className="text-gray-500 mb-8">
            Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt mit deinem neuen Passwort anmelden.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-display font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-200/40 to-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-56 h-56 bg-gradient-to-tr from-pink-200/30 to-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-6 py-8 safe-top max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/login')}
            className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Neues Passwort
          </h1>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <FloatingMascot>
            <PegasusMascot size={100} />
          </FloatingMascot>
        </div>

        {/* Email info */}
        <div className="bg-violet-50 rounded-2xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-600">
            Neues Passwort für
          </p>
          <p className="font-semibold text-violet-700">{email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neues Passwort
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-violet-500 focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= passwordScore
                          ? passwordScore <= 2 ? 'bg-red-500'
                            : passwordScore === 3 ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordChecks.length ? <Check size={12} /> : <X size={12} />}
                    Min. 8 Zeichen
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordChecks.uppercase ? <Check size={12} /> : <X size={12} />}
                    Großbuchstabe
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordChecks.lowercase ? <Check size={12} /> : <X size={12} />}
                    Kleinbuchstabe
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                    {passwordChecks.number ? <Check size={12} /> : <X size={12} />}
                    Zahl
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort bestätigen
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-2xl focus:outline-none transition-colors ${
                  confirmPassword
                    ? passwordsMatch
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-violet-500'
                }`}
                required
              />
              {confirmPassword && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {passwordsMatch ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <X size={18} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-display font-bold rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
