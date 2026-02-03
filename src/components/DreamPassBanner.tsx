/**
 * DREAM PASS BANNER
 * Eleganter Info-Banner für das Profil
 */

import { useState } from 'react';
import { Crown, Cloud, Sparkles, ChevronRight, X } from 'lucide-react';
import { getSeasonCountdown, DREAM_PASS_CONFIG } from '@/lib/dreamPassSystem';

interface DreamPassBannerProps {
  variant?: 'full' | 'compact' | 'minimal';
  onClose?: () => void;
  onClick?: () => void;
}

const DreamPassBanner = ({
  variant = 'compact',
  onClose,
  onClick,
}: DreamPassBannerProps) => {
  const [isDismissed, setDismissed] = useState(false);
  const countdown = getSeasonCountdown();

  if (isDismissed) return null;

  // Minimal variant (one-liner)
  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 rounded-xl flex items-center justify-center gap-2 text-sm text-purple-600 font-medium hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
      >
        <Crown size={14} />
        <span>Der Beta Dream Pass erwacht im März 2026. Sammle jetzt schon XP! ☁️</span>
      </button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-100">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(5)].map((_, i) => (
            <Cloud
              key={i}
              size={40 + i * 10}
              className="absolute text-purple-200"
              style={{
                left: `${10 + i * 20}%`,
                top: `${20 + (i % 2) * 40}%`,
                opacity: 0.3 + i * 0.1,
              }}
            />
          ))}
        </div>

        <button
          onClick={onClick}
          className="relative w-full p-4 flex items-center gap-4"
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Crown size={24} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <h4 className="font-bold text-gray-800 mb-0.5">
              Dream Pass Beta
            </h4>
            <p className="text-xs text-gray-600">
              Sammle jetzt schon XP für März 2026! ☁️
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight size={20} className="text-purple-400" />
        </button>

        {/* Dismiss button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
              onClose();
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center"
          >
            <X size={12} className="text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  // Full variant (with countdown)
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Crown size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Dream Pass</h3>
            <p className="text-sm text-purple-300">Beta Season 1</p>
          </div>
        </div>

        {/* Countdown */}
        {!countdown.hasStarted && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { value: countdown.days, label: 'Tage' },
              { value: countdown.hours, label: 'Std' },
              { value: countdown.minutes, label: 'Min' },
              { value: countdown.seconds, label: 'Sek' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="bg-white/10 rounded-xl p-3 text-center"
              >
                <span className="text-2xl font-bold text-white block">{value}</span>
                <span className="text-xs text-purple-300">{label}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-purple-200 mb-4">
          Sammle jetzt schon XP durch tägliche Aktivität und sichere dir exklusive Belohnungen, wenn der Pass startet!
        </p>

        <button
          onClick={onClick}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          Dream Pass öffnen
        </button>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default DreamPassBanner;
