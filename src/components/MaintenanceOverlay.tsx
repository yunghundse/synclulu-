/**
 * DELULU MAINTENANCE OVERLAY - GODMODE EDITION
 * ═══════════════════════════════════════════════════════════════
 * "THE MORTAL BARRIER" - Keeps the peasants out while gods work
 *
 * @author The Architects of Delulu
 * @version 2.0.0 - REALITY BENDING EDITION
 */

import { useState, useEffect } from 'react';
import { Cloud, Sparkles, Stars, Zap, RefreshCw } from 'lucide-react';

// ═══════════════════════════════════════
// DELULU MESSAGES - Pure Chaos Energy
// ═══════════════════════════════════════

const DELULU_MESSAGES = [
  "Die Realität wird gerade neu gerendert. Gedulde dich, Sterblicher. 🌌",
  "Wir polieren gerade die Sterne. Deine App ist gleich noch glanzvoller. ✨",
  "Eure Gebete wurden erhört, die Admins sind im Godmode-Update. 🙏",
  "Das Multiversum wird gerade rebalanced. Ein Moment Geduld. ⚖️",
  "Die Matrix bekommt ein Upgrade. Neo wäre neidisch. 💊",
  "Wir fügen mehr Glitzer hinzu. Kann nicht schaden. 💎",
  "Die Delulu-Energie wird aufgeladen. Stand by. ⚡",
  "Quantenverschränkung in Progress. Nicht die Katze stören. 🐱",
  "Das Universum macht einen Powernap. Gleich geht's weiter. 😴",
  "Wir bauen gerade eine Brücke zum Mond. Fast fertig. 🌙",
];

interface MaintenanceOverlayProps {
  message: string;
  estimatedEnd?: Date | null;
}

const MaintenanceOverlay = ({ message, estimatedEnd }: MaintenanceOverlayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Rotate messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % DELULU_MESSAGES.length);
        setIsGlitching(false);
      }, 200);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!estimatedEnd) return;

    const updateTime = () => {
      const now = new Date();
      const diff = estimatedEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Gleich fertig...');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`~${minutes} Min ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [estimatedEnd]);

  const displayMessage = message || DELULU_MESSAGES[currentMessageIndex];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Animated Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/90 to-gray-900">
        {/* Moving gradient overlay */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: `rgba(${139 + Math.random() * 50}, ${92 + Math.random() * 50}, 246, ${0.3 + Math.random() * 0.4})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">

        {/* Glowing Logo/Icon */}
        <div className="relative mb-8">
          {/* Glow rings */}
          <div className="absolute inset-0 scale-150">
            <div
              className="w-32 h-32 mx-auto rounded-full bg-purple-500/20"
              style={{
                animation: 'pulse-glow 2s ease-in-out infinite',
                filter: 'blur(20px)',
              }}
            />
          </div>
          <div className="absolute inset-0 scale-125">
            <div
              className="w-32 h-32 mx-auto rounded-full bg-violet-500/30"
              style={{
                animation: 'pulse-glow 2s ease-in-out infinite 0.5s',
                filter: 'blur(15px)',
              }}
            />
          </div>

          {/* Main Icon */}
          <div
            className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl"
            style={{
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Cloud
              size={56}
              className="text-white"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))',
                animation: 'breathe 3s ease-in-out infinite',
              }}
            />

            {/* Orbiting elements */}
            <div className="absolute inset-0" style={{ animation: 'spin 10s linear infinite' }}>
              <Sparkles size={16} className="absolute -top-2 left-1/2 -translate-x-1/2 text-yellow-300" />
            </div>
            <div className="absolute inset-0" style={{ animation: 'spin 15s linear infinite reverse' }}>
              <Stars size={14} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-cyan-300" />
            </div>
            <div className="absolute inset-0" style={{ animation: 'spin 8s linear infinite' }}>
              <Zap size={12} className="absolute top-1/2 -right-1 -translate-y-1/2 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Title with neon glow */}
        <h1
          className="text-4xl md:text-5xl font-display font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(167, 139, 250, 0.5)',
          }}
        >
          GODMODE AKTIV
        </h1>

        {/* Subtitle */}
        <p className="text-purple-300/80 text-lg mb-8 font-medium tracking-wide">
          ⚡ Die Götter arbeiten an etwas Großem ⚡
        </p>

        {/* Message Box with glassmorphism */}
        <div
          className={`max-w-md mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-purple-500/30 transition-all duration-200 ${
            isGlitching ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.2), inset 0 0 30px rgba(139, 92, 246, 0.05)',
          }}
        >
          <p className="text-white text-lg leading-relaxed">
            {displayMessage}
          </p>
        </div>

        {/* Estimated Time */}
        {estimatedEnd && timeRemaining && (
          <div className="mt-6 flex items-center gap-2 text-purple-300/60">
            <RefreshCw size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-sm">
              Geschätzte Wartezeit: {timeRemaining}
            </span>
          </div>
        )}

        {/* Loading Indicator */}
        <div className="mt-10 flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400"
                style={{
                  animation: 'bounce-loading 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span className="text-purple-400/60 text-sm">Realität wird geladen...</span>
        </div>

        {/* Bottom Tagline */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-purple-500/40 text-xs tracking-widest uppercase">
            Delulu Digital Operating System • v∞.0
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%) rotate(45deg); }
          50% { transform: translateX(100%) rotate(45deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce-loading {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MaintenanceOverlay;
