import { useState } from 'react';
import { Star, Sparkles, Gift, Lock, Loader2 } from 'lucide-react';
import { STAR_CONFIG } from '@/types';

interface StarButtonProps {
  userId: string;
  username: string;
  starsGivenToday: number;
  starsAvailableToday: number;
  isPremium: boolean;
  onGiveStar: (userId: string, amount: number, message?: string) => Promise<void>;
}

const StarButton = ({
  userId,
  username,
  starsGivenToday,
  starsAvailableToday,
  isPremium,
  onGiveStar,
}: StarButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const maxStars = Math.min(STAR_CONFIG.maxStarsPerUser - starsGivenToday, starsAvailableToday);
  const canGiveStars = maxStars > 0 || isPremium;

  const handleGiveStar = async () => {
    if (!canGiveStars && !isPremium) return;

    setIsLoading(true);
    try {
      await onGiveStar(userId, selectedAmount, message || undefined);

      // Success feedback
      setShowSuccess(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 30, 20, 50]);
      }

      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setSelectedAmount(1);
        setMessage('');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  // Compact star button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={!canGiveStars && !isPremium}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
          transition-all duration-200
          ${canGiveStars || isPremium
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <Star size={16} className={canGiveStars || isPremium ? 'fill-white' : ''} />
        <span>Stern geben</span>
        {!isPremium && (
          <span className="text-xs opacity-75">({starsAvailableToday})</span>
        )}
      </button>
    );
  }

  // Expanded star modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Sparkles size={64} className="mb-4 animate-bounce" />
            <h3 className="font-display text-2xl font-bold">
              {selectedAmount} ⭐ geschenkt!
            </h3>
            <p className="text-white/80 mt-2">
              +{selectedAmount * STAR_CONFIG.xpPerStar} XP für @{username}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Stern schenken</h2>
                <p className="text-white/80 text-sm">an @{username}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Star amount selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-synclulu-text mb-3">
              Wie viele Sterne?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((amount) => {
                const isDisabled = !isPremium && amount > maxStars;
                return (
                  <button
                    key={amount}
                    onClick={() => !isDisabled && setSelectedAmount(amount)}
                    disabled={isDisabled}
                    className={`
                      relative w-12 h-12 rounded-xl flex items-center justify-center
                      transition-all duration-200
                      ${selectedAmount >= amount
                        ? 'bg-amber-400 text-white scale-110 shadow-lg'
                        : isDisabled
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-amber-50 text-amber-400 hover:bg-amber-100'
                      }
                    `}
                  >
                    <Star
                      size={24}
                      className={selectedAmount >= amount ? 'fill-white' : ''}
                    />
                    {isDisabled && !isPremium && (
                      <Lock size={10} className="absolute -top-1 -right-1 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* XP preview */}
            <div className="text-center mt-4">
              <span className="text-2xl font-display font-bold text-amber-500">
                +{selectedAmount * STAR_CONFIG.xpPerStar} XP
              </span>
              <p className="text-xs text-synclulu-muted">für @{username}</p>
            </div>
          </div>

          {/* Optional message */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-synclulu-text mb-2 block">
              Nachricht (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Toll gemacht! 🎉"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
            />
            <p className="text-xs text-synclulu-muted mt-1 text-right">
              {message.length}/50
            </p>
          </div>

          {/* Remaining stars info */}
          {!isPremium && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl mb-6">
              <span className="text-sm text-amber-700">
                Noch {starsAvailableToday} Sterne heute
              </span>
              <button className="text-xs font-semibold text-amber-600 hover:underline">
                Premium = Unbegrenzt ⭐
              </button>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleGiveStar}
            disabled={isLoading || (!canGiveStars && !isPremium)}
            className={`
              w-full py-4 px-6 rounded-2xl font-bold text-lg
              flex items-center justify-center gap-2
              transition-all duration-200
              ${canGiveStars || isPremium
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Star size={20} className="fill-white" />
                {selectedAmount} Stern{selectedAmount > 1 ? 'e' : ''} schenken
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarButton;
