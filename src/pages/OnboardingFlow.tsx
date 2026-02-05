/**
 * SYNCLULU REGISTER PAGE
 * Clean, modern registration flow
 * @version 2.0.0
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X
} from 'lucide-react';

export default function OnboardingFlow() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Password strength
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrong = passwordScore >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username muss mindestens 3 Zeichen haben');
      return;
    }

    if (!passwordStrong) {
      setError('Passwort ist zu schwach');
      return;
    }

    setIsLoading(true);

    const result = await signUp(email, password, username);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registrierung fehlgeschlagen');
    }

    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
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
          <h1 className="sc-title" style={{ fontSize: '24px' }}>Account erstellen</h1>
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
          <p className="sc-text">Werde Teil der Community</p>
        </div>

        {/* Form Card */}
        <div className="sc-card sc-mb-lg sc-animate-slide-up">
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="sc-input-group">
              <label className="sc-label">Benutzername</label>
              <div className="sc-input-icon">
                <User size={18} className="icon" />
                <input
                  type="text"
                  className="sc-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="dein_username"
                  maxLength={20}
                  required
                />
              </div>
            </div>

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
              <label className="sc-label">Passwort</label>
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

              {/* Password Strength */}
              {password && (
                <div className="sc-mt-md">
                  <div
                    style={{
                      height: '4px',
                      background: 'var(--sc-bg-tertiary)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(passwordScore / 4) * 100}%`,
                        background: passwordScore <= 1 ? '#EF4444' : passwordScore === 2 ? '#F59E0B' : passwordScore === 3 ? '#10B981' : '#22D3EE',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    {[
                      { key: 'length', label: 'Min. 8 Zeichen', check: passwordChecks.length },
                      { key: 'uppercase', label: 'Großbuchstabe', check: passwordChecks.uppercase },
                      { key: 'lowercase', label: 'Kleinbuchstabe', check: passwordChecks.lowercase },
                      { key: 'number', label: 'Zahl', check: passwordChecks.number },
                    ].map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: item.check ? 'var(--sc-success)' : 'var(--sc-text-muted)',
                        }}
                      >
                        {item.check ? <Check size={12} /> : <X size={12} />}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  Wird erstellt...
                </>
              ) : (
                'Account erstellen'
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

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="sc-btn sc-btn-secondary sc-btn-full sc-btn-lg sc-mb-xl"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Mit Google registrieren
        </button>

        {/* Login Link */}
        <p className="sc-text-center sc-text">
          Schon registriert?{' '}
          <Link to="/login" className="sc-link">
            Anmelden
          </Link>
        </p>

        {/* Terms */}
        <p className="sc-text-center sc-text-sm sc-mt-lg" style={{ padding: '0 16px' }}>
          Mit der Registrierung akzeptierst du unsere{' '}
          <Link to="/impressum" className="sc-link">AGB</Link>
          {' '}und{' '}
          <Link to="/datenschutz" className="sc-link">Datenschutzerklärung</Link>.
        </p>
      </div>
    </div>
  );
}
