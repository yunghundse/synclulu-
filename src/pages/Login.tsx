/**
 * DELULU LOGIN PAGE
 * @version 2.0.0 - Clean Production Build
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { PegasusMascot, FloatingMascot } from '@/components/Mascots';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signIn(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login fehlgeschlagen');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    const result = await signInWithGoogle();

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Google Login fehlgeschlagen');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setResetEmailSent(true);
    } else {
      setError(result.error || 'Fehler beim Zurücksetzen');
    }

    setIsLoading(false);
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[var(--delulu-bg)] px-6 py-8 safe-top">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmailSent(false);
              setError('');
            }}
            className="w-10 h-10 rounded-xl bg-[var(--delulu-card)] flex items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} className="text-[var(--delulu-text)]" />
          </button>
          <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">
            Passwort vergessen
          </h1>
        </div>

        {resetEmailSent ? (
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--delulu-text)] mb-2">
              E-Mail gesendet!
            </h2>
            <p className="text-[var(--delulu-muted)] mb-6">
              Wir haben dir eine E-Mail an <strong>{email}</strong> gesendet.
              Folge dem Link in der E-Mail, um dein Passwort zurückzusetzen.
            </p>
            <p className="text-sm text-[var(--delulu-muted)] mb-6">
              Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner oder versuche es erneut.
            </p>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
              }}
              className="btn-primary w-full py-4 text-white font-display font-bold"
            >
              Zurück zum Login
            </button>
          </div>
        ) : (
          <div className="glass-card p-6">
            <p className="text-[var(--delulu-muted)] mb-6">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--delulu-muted)] mb-2">
                  E-Mail
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="deine@email.de"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-[var(--delulu-card)] border-2 border-[var(--delulu-border)] rounded-xl focus:border-[var(--delulu-violet)] focus:outline-none transition-colors text-[var(--delulu-text)]"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-4 text-white font-display font-bold disabled:opacity-70"
              >
                {isLoading ? 'Wird gesendet...' : 'Link senden'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Normal Login View
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--delulu-bg)] px-6 py-8 safe-top">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to="/"
          className="w-10 h-10 rounded-xl bg-[var(--delulu-card)] flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={20} className="text-[var(--delulu-text)]" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">Login</h1>
      </div>

      {/* Mascot */}
      <div className="flex justify-center mb-4">
        <FloatingMascot delay={0}>
          <PegasusMascot size={100} />
        </FloatingMascot>
      </div>

      {/* Form */}
      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[var(--delulu-muted)] mb-2">
              E-Mail
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                className="w-full pl-12 pr-4 py-3 bg-[var(--delulu-card)] border-2 border-[var(--delulu-border)] rounded-xl focus:border-[var(--delulu-violet)] focus:outline-none transition-colors text-[var(--delulu-text)]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--delulu-muted)]">
                Passwort
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[var(--delulu-violet)] font-medium hover:underline"
              >
                Passwort vergessen?
              </button>
            </div>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-12 py-3 bg-[var(--delulu-card)] border-2 border-[var(--delulu-border)] rounded-xl focus:border-[var(--delulu-violet)] focus:outline-none transition-colors text-[var(--delulu-text)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--delulu-muted)]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-4 text-white font-display font-bold disabled:opacity-70"
          >
            {isLoading ? 'Wird eingeloggt...' : 'Login'}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-[var(--delulu-border)]" />
        <span className="text-sm text-[var(--delulu-muted)]">oder</span>
        <div className="flex-1 h-px bg-[var(--delulu-border)]" />
      </div>

      {/* Social Logins - Only Google */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-4 bg-[var(--delulu-card)] border-2 border-[var(--delulu-border)] rounded-xl font-medium flex items-center justify-center gap-3 hover:border-[var(--delulu-violet)] transition-colors disabled:opacity-70 text-[var(--delulu-text)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Mit Google anmelden
        </button>
      </div>

      {/* Register Link */}
      <p className="text-center text-[var(--delulu-muted)] mt-8">
        Noch kein Account?{' '}
        <Link to="/register" className="text-[var(--delulu-violet)] font-semibold">
          Registrieren
        </Link>
      </p>
    </div>
  );
};

export default Login;
