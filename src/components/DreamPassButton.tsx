/**
 * DREAM PASS BUTTON
 * Pulsierender Gradient Button für die Profil-Seite
 */

import { useState } from 'react';
import { Crown, Cloud, Sparkles } from 'lucide-react';
import DreamPassModal from './DreamPassModal';

interface DreamPassButtonProps {
  currentLevel?: number;
  hasUnclaimedRewards?: boolean;
}

const DreamPassButton = ({
  currentLevel = 1,
  hasUnclaimedRewards = false,
}: DreamPassButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        id="dream-pass-btn"
        onClick={() => setIsModalOpen(true)}
        className="relative group w-full overflow-hidden rounded-2xl p-[2px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 25%, #818CF8 50%, #6366F1 75%, #A78BFA 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite, pulse-glow 2s ease-in-out infinite',
        }}
      >
        {/* Inner content */}
        <div className="relative flex items-center justify-between gap-4 bg-gray-900/95 rounded-[14px] px-4 py-4 backdrop-blur-sm">
          {/* Left: Icon */}
          <div className="relative">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #C4B5FD 0%, #818CF8 100%)',
              }}
            >
              {/* Cloud background */}
              <Cloud
                size={40}
                className="absolute text-white/30"
                style={{ transform: 'translateY(5px)' }}
              />
              {/* Crown foreground */}
              <Crown size={24} className="text-white relative z-10" />

              {/* Sparkle effects */}
              <Sparkles
                size={12}
                className="absolute top-1 right-1 text-yellow-300 animate-pulse"
              />
            </div>

            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
              Lv.{currentLevel}
            </div>
          </div>

          {/* Center: Text */}
          <div className="flex-1 text-left">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              Dream Pass
              {hasUnclaimedRewards && (
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
                </span>
              )}
            </h3>
            <p className="text-sm text-white/60">
              Beta Season 1 • Exklusive Belohnungen
            </p>
          </div>

          {/* Right: Arrow/CTA */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-300"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Animated border glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: '0 0 30px rgba(167, 139, 250, 0.4), 0 0 60px rgba(129, 140, 248, 0.2)',
          }}
        />
      </button>

      {/* Modal */}
      <DreamPassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(167, 139, 250, 0.3); }
          50% { box-shadow: 0 0 35px rgba(167, 139, 250, 0.5), 0 0 50px rgba(129, 140, 248, 0.3); }
        }
      `}</style>
    </>
  );
};

export default DreamPassButton;
