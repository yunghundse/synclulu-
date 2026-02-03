/**
 * DREAM PASS LEVEL UP TOAST
 * Benachrichtigung bei Level-Up im Dream Pass
 */

import { useEffect, useState } from 'react';
import { Crown, Gift, Sparkles, X } from 'lucide-react';
import { PassReward, getRarityColor, getRarityGlow } from '@/lib/dreamPassSystem';

interface DreamPassLevelUpToastProps {
  isVisible: boolean;
  newLevel: number;
  rewards: PassReward[];
  onClose: () => void;
  onViewPass: () => void;
}

const DreamPassLevelUpToast = ({
  isVisible,
  newLevel,
  rewards,
  onClose,
  onViewPass,
}: DreamPassLevelUpToastProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop with particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%',
              background: `linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)`,
              animation: `rise ${2 + Math.random() * 2}s ease-out forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Toast Card */}
      <div
        className={`relative bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-sm pointer-events-auto transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        style={{
          boxShadow: '0 0 60px rgba(167, 139, 250, 0.4), 0 0 100px rgba(244, 114, 182, 0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
        >
          <X size={16} className="text-white/60" />
        </button>

        {/* Level Badge */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
              boxShadow: '0 0 40px rgba(167, 139, 250, 0.5)',
            }}
          >
            <span className="text-4xl font-black text-white">{newLevel}</span>

            {/* Rotating ring */}
            <div
              className="absolute inset-0 rounded-full border-4 border-white/20"
              style={{
                animation: 'spin 8s linear infinite',
                borderStyle: 'dashed',
              }}
            />

            {/* Sparkles */}
            <Sparkles
              size={20}
              className="absolute -top-2 -right-2 text-yellow-400"
              style={{ animation: 'pulse 1s ease-in-out infinite' }}
            />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Level Up! 🎉</h2>
          <p className="text-white/60">Dream Pass Level {newLevel} erreicht</p>
        </div>

        {/* Rewards */}
        {rewards.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Gift size={16} className="text-purple-400" />
              Neue Belohnungen
            </h3>
            <div className="space-y-2">
              {rewards.slice(0, 3).map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  style={{ boxShadow: getRarityGlow(reward.rarity) }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${getRarityColor(reward.rarity)}40 0%, ${getRarityColor(reward.rarity)}20 100%)`,
                    }}
                  >
                    {reward.isPremium ? (
                      <Crown size={20} style={{ color: getRarityColor(reward.rarity) }} />
                    ) : (
                      <Gift size={20} style={{ color: getRarityColor(reward.rarity) }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{reward.nameDE}</p>
                    <p
                      className="text-xs font-bold uppercase"
                      style={{ color: getRarityColor(reward.rarity) }}
                    >
                      {reward.rarity}
                    </p>
                  </div>
                  {reward.isPremium && (
                    <Crown size={14} className="text-amber-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 rounded-xl text-white font-medium"
          >
            Später
          </button>
          <button
            onClick={onViewPass}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            <Crown size={18} />
            Öffnen
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes rise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default DreamPassLevelUpToast;
