import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { ChevronDown } from 'lucide-react';
import { GirlMascot, FloatingMascot } from '@/components/Mascots';

const Welcome = () => {
  const { t, language, setLanguage, languages } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('synclulu-language');
    if (saved && ['de', 'en', 'es', 'fr', 'pt'].includes(saved)) {
      setLanguage(saved as any);
    }
  }, []);

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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-purple-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-violet-300/30 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-5 w-64 h-64 bg-gradient-to-tr from-pink-300/25 to-violet-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating clouds */}
        <div className="absolute top-20 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>☁️</div>
        <div className="absolute top-40 right-20 text-3xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>☁️</div>
        <div className="absolute bottom-40 left-20 text-2xl opacity-10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>☁️</div>

        {/* Mascot decoration - bottom left */}
        <div className="absolute bottom-10 left-4 opacity-40 hidden sm:block">
          <FloatingMascot delay={0.5}>
            <GirlMascot size={100} />
          </FloatingMascot>
        </div>
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <span className="text-lg">{languages[language].flag}</span>
          <span className="text-sm font-medium text-gray-700">{languages[language].native}</span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Language Dropdown */}
        {showLanguageMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[180px] animate-fade-in">
            {Object.entries(languages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as any);
                  setShowLanguageMenu(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-violet-50 transition-colors ${
                  language === code ? 'bg-violet-100' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium text-gray-800">{lang.native}</span>
                {language === code && (
                  <span className="ml-auto text-violet-600">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-sm">
        {/* Logo with glow effect */}
        <div className="relative mb-10">
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-violet-400/40 rounded-3xl blur-2xl" />
          <div className="relative w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <span className="text-6xl drop-shadow-lg">☁️</span>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="font-display text-6xl font-bold mb-3 tracking-tight">
          <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 bg-clip-text text-transparent">
            synclulu
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-gray-800 text-xl font-display font-semibold mb-3">
          {text.tagline}
        </p>

        <p className="text-gray-500 mb-10 leading-relaxed">
          {text.subtitle}<br />
          <span className="font-semibold text-gray-700">{text.highlight}</span>
        </p>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Link
            to="/register"
            className="block w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-display font-bold text-center rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all transform hover:scale-[1.02]"
          >
            {text.start}
          </Link>

          <Link
            to="/login"
            className="block w-full py-4 text-violet-600 font-display font-semibold text-center border-2 border-violet-200 rounded-2xl hover:border-violet-400 hover:bg-violet-50 transition-all"
          >
            {text.login}
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-[11px] text-gray-600 font-medium leading-tight">{text.radius}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🎭</div>
            <p className="text-[11px] text-gray-600 font-medium leading-tight">{text.mode}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-[11px] text-gray-600 font-medium leading-tight">{text.privacy}</p>
          </div>
        </div>
      </div>

      {/* Click outside to close language menu */}
      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </div>
  );
};

export default Welcome;
