/**
 * SYNCLULU LOGIN PAGE
 * Clean, modern login flow with unified design system
 * @version 3.0.0
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function Login() {
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
      <div className="sc-page sc-safe-top" style={{ paddingBottom: '40px' }}>
        <div className="sc-container">
          {/* Header */}
          <div className="sc-flex sc-items-center sc-gap-md sc-mb-lg">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
                setError('');
              }}
              className="sc-btn sc-btn-ghost"
              style={{ padding: '12px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="sc-title" style={{ fontSize: '24px' }}>Passwort vergessen</h1>
          </div>

          {resetEmailSent ? (
            <div className="sc-card sc-text-center sc-animate-slide-up">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--sc-success)' }} />
              </div>
              <h2 className="sc-title sc-mb-sm" style={{ fontSize: '20px' }}>
                E-Mail gesendet!
              </h2>
              <p className="sc-text sc-mb-lg">
                Wir haben dir eine E-Mail an <strong>{email}</strong> gesendet.
                Folge dem Link in der E-Mail, um dein Passwort zurückzusetzen.
              </p>
              <p className="sc-text-sm sc-mb-lg" style={{ color: 'var(--sc-text-muted)' }}>
                Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner oder versuche es erneut.
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                }}
                className="sc-btn sc-btn-primary sc-btn-full sc-btn-lg"
              >
                Zurück zum Login
              </button>
            </div>
          ) : (
            <div className="sc-card sc-animate-slide-up">
              <p className="sc-text sc-mb-lg">
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
              </p>

              <form onSubmit={handleForgotPassword}>
                {/* Email */}
                <div className="sc-input-group">
                  <label className="sc-label">E-Mail Adresse</label>
                  <div className="sc-input-icon">
                    <Mail size={18} className="icon" />
                    <input
                      type="email"
                      className="sc-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      required
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="sc-alert sc-alert-error sc-mb-md">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="sc-btn sc-btn-primary sc-btn-full sc-btn-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="sc-animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'Link senden'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal Login View
  return (
    <div className="sc-page sc-safe-top" style={{ paddingBottom: '40px' }}>
      <div className="sc-container">
        {/* Header */}
        <div className="sc-flex sc-items-center sc-gap-md sc-mb-lg">
          <Link
            to="/"
            className="sc-btn sc-btn-ghost"
            style={{ padding: '12px' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="sc-title" style={{ fontSize: '24px' }}>Anmelden</h1>
        </div>

        {/* Logo */}
        <div className="sc-text-center sc-mb-xl">
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              borderRadius: '20px',
              background: 'var(--sc-gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--sc-shadow-glow)',
            }}
          >
            <span style={{ fontSize: '40px' }}>☁️</span>
          </div>
          <p className="sc-text">Willkommen zurück!</p>
        </div>

        {/* Form Card */}
        <div className="sc-card sc-mb-lg sc-animate-slide-up">
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="sc-input-group">
              <label className="sc-label">E-Mail Adresse</label>
              <div className="sc-input-icon">
                <Mail size={18} className="icon" />
                <input
                  type="email"
                  className="sc-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="sc-input-group">
              <div className="sc-flex sc-items-center" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="sc-label" style={{ marginBottom: 0 }}>Passwort</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="sc-link"
                  style={{ fontSize: '14px' }}
                >
                  Passwort vergessen?
                </button>
              </div>
              <div className="sc-input-icon" style={{ position: 'relative' }}>
                <Lock size={18} className="icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="sc-input"
                  style={{ paddingRight: '48px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--sc-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="sc-alert sc-alert-error sc-mb-md">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="sc-btn sc-btn-primary sc-btn-full sc-btn-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="sc-animate-spin" />
                  Wird eingeloggt...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="sc-divider">
          <div className="sc-divider-line" />
          <span className="sc-divider-text">oder</span>
          <div className="sc-divider-line" />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="sc-btn sc-btn-secondary sc-btn-full sc-btn-lg sc-mb-xl"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Mit Google anmelden
        </button>

        {/* Register Link */}
        <p className="sc-text-center sc-text">
          Noch kein Account?{' '}
          <Link to="/register" className="sc-link">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
