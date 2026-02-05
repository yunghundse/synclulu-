/**
 * SYNCLULU WELCOME PAGE
 * Modern dark landing page with unified design system
 * @version 3.0.0
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { ChevronDown, MapPin, Users, Shield } from 'lucide-react';

export default function Welcome() {
  const { language, setLanguage, languages } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('synclulu-language');
    if (saved && ['de', 'en', 'es', 'fr', 'pt'].includes(saved)) {
      setLanguage(saved as any);
    }
  }, [setLanguage]);

  const welcomeText = {
    de: {
      tagline: 'Connect in the Clouds',
      subtitle: 'Echte Begegnungen in deiner Nachbarschaft.',
      highlight: 'Hyperlokal. Anonym. Algorithmus-frei.',
      start: 'Jetzt starten',
      login: 'Ich habe schon einen Account',
      radius: 'Max 500m Radius',
      mode: 'Anonym oder Offen',
      privacy: 'Privacy First',
    },
    en: {
      tagline: 'Connect in the Clouds',
      subtitle: 'Real connections in your neighborhood.',
      highlight: 'Hyperlocal. Anonymous. Algorithm-free.',
      start: 'Get Started',
      login: 'I already have an account',
      radius: 'Max 500m Radius',
      mode: 'Anonymous or Public',
      privacy: 'Privacy First',
    },
    es: {
      tagline: 'Conecta en las Nubes',
      subtitle: 'Encuentros reales en tu vecindario.',
      highlight: 'Hiperlocal. Anónimo. Sin algoritmos.',
      start: 'Comenzar',
      login: 'Ya tengo una cuenta',
      radius: 'Radio máx. 500m',
      mode: 'Anónimo o Público',
      privacy: 'Privacidad Primero',
    },
    fr: {
      tagline: 'Connectez dans les Nuages',
      subtitle: 'De vraies rencontres dans votre quartier.',
      highlight: 'Hyperlocal. Anonyme. Sans algorithme.',
      start: 'Commencer',
      login: "J'ai déjà un compte",
      radius: 'Rayon max. 500m',
      mode: 'Anonyme ou Public',
      privacy: 'Confidentialité',
    },
    pt: {
      tagline: 'Conecte nas Nuvens',
      subtitle: 'Encontros reais no seu bairro.',
      highlight: 'Hiperlocal. Anônimo. Sem algoritmos.',
      start: 'Começar',
      login: 'Já tenho uma conta',
      radius: 'Raio máx. 500m',
      mode: 'Anônimo ou Público',
      privacy: 'Privacidade',
    },
  };

  const text = welcomeText[language] || welcomeText.de;

  return (
    <div className="sc-page sc-safe-top" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Glowing orbs */}
        <div
          className="sc-animate-pulse"
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="sc-animate-pulse"
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '5%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animationDelay: '1s',
          }}
        />
        <div
          className="sc-animate-pulse"
          style={{
            position: 'absolute',
            top: '40%',
            left: '20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            animationDelay: '2s',
          }}
        />

        {/* Floating clouds */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            fontSize: '32px',
            opacity: 0.15,
            animation: 'sc-float 4s ease-in-out infinite',
          }}
        >☁️</div>
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '12%',
            fontSize: '24px',
            opacity: 0.1,
            animation: 'sc-float 5s ease-in-out infinite',
            animationDelay: '1s',
          }}
        >☁️</div>
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '15%',
            fontSize: '20px',
            opacity: 0.08,
            animation: 'sc-float 4.5s ease-in-out infinite',
            animationDelay: '0.5s',
          }}
        >☁️</div>
      </div>

      {/* Language Selector */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="sc-btn sc-btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--sc-bg-card)',
            border: '1px solid var(--sc-border)',
          }}
        >
          <span style={{ fontSize: '18px' }}>{languages[language].flag}</span>
          <span style={{ fontSize: '14px', color: 'var(--sc-text-secondary)' }}>
            {languages[language].native}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--sc-text-muted)',
              transition: 'transform 0.2s',
              transform: showLanguageMenu ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        </button>

        {/* Language Dropdown */}
        {showLanguageMenu && (
          <div
            className="sc-animate-fade-in"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'var(--sc-bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--sc-border)',
              overflow: 'hidden',
              minWidth: '180px',
              boxShadow: 'var(--sc-shadow-lg)',
            }}
          >
            {Object.entries(languages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as any);
                  setShowLanguageMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: language === code ? 'var(--sc-violet-alpha)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (language !== code) e.currentTarget.style.background = 'var(--sc-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = language === code ? 'var(--sc-violet-alpha)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                <span style={{ fontWeight: 500, color: 'var(--sc-text-primary)' }}>{lang.native}</span>
                {language === code && (
                  <span style={{ marginLeft: 'auto', color: 'var(--sc-violet)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sc-container" style={{ textAlign: 'center', maxWidth: '380px', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '120px',
              height: '120px',
              margin: '0 auto',
              background: 'var(--sc-gradient-primary)',
              borderRadius: '32px',
              filter: 'blur(30px)',
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '32px',
              background: 'var(--sc-gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--sc-shadow-glow)',
            }}
          >
            <span style={{ fontSize: '60px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>☁️</span>
          </div>
        </div>

        {/* Brand Name */}
        <h1
          style={{
            fontSize: '52px',
            fontWeight: 700,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            background: 'var(--sc-gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          synclulu
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--sc-text-primary)',
            marginBottom: '8px',
          }}
        >
          {text.tagline}
        </p>

        <p
          style={{
            fontSize: '15px',
            color: 'var(--sc-text-secondary)',
            marginBottom: '8px',
            lineHeight: 1.5,
          }}
        >
          {text.subtitle}
        </p>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--sc-violet-light)',
            marginBottom: '40px',
          }}
        >
          {text.highlight}
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' }}>
          <Link
            to="/register"
            className="sc-btn sc-btn-primary sc-btn-full sc-btn-lg"
            style={{ fontSize: '16px' }}
          >
            {text.start}
          </Link>

          <Link
            to="/login"
            className="sc-btn sc-btn-secondary sc-btn-full sc-btn-lg"
            style={{ fontSize: '16px' }}
          >
            {text.login}
          </Link>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div
            style={{
              background: 'var(--sc-bg-card)',
              borderRadius: '16px',
              padding: '16px 12px',
              border: '1px solid var(--sc-border)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 8px',
                borderRadius: '10px',
                background: 'var(--sc-violet-alpha)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={18} style={{ color: 'var(--sc-violet)' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--sc-text-secondary)', fontWeight: 500 }}>
              {text.radius}
            </p>
          </div>

          <div
            style={{
              background: 'var(--sc-bg-card)',
              borderRadius: '16px',
              padding: '16px 12px',
              border: '1px solid var(--sc-border)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 8px',
                borderRadius: '10px',
                background: 'var(--sc-violet-alpha)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} style={{ color: 'var(--sc-violet)' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--sc-text-secondary)', fontWeight: 500 }}>
              {text.mode}
            </p>
          </div>

          <div
            style={{
              background: 'var(--sc-bg-card)',
              borderRadius: '16px',
              padding: '16px 12px',
              border: '1px solid var(--sc-border)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 8px',
                borderRadius: '10px',
                background: 'var(--sc-violet-alpha)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} style={{ color: 'var(--sc-violet)' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--sc-text-secondary)', fontWeight: 500 }}>
              {text.privacy}
            </p>
          </div>
        </div>
      </div>

      {/* Click outside to close language menu */}
      {showLanguageMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          onClick={() => setShowLanguageMenu(false)}
        />
      )}

      {/* Floating cloud animation keyframes */}
      <style>{`
        @keyframes sc-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
