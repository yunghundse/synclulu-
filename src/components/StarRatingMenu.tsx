/**
 * STAR RATING MENU
 * 1-5 Sterne Bewertung für Voice-Chats
 */

import { useState, useEffect } from 'react';
import { Star, Sparkles, X, Check, Crown } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  giveStarRating,
  checkDailyLimit,
  STAR_RATING_CONFIG,
} from '@/lib/starRatingSystem';

interface StarRatingMenuProps {
  targetUserId: string;
  targetUsername: string;
  context?: 'voice_chat' | 'profile' | 'content';
  sessionId?: string;
  onComplete?: (stars: number) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const StarRatingMenu = ({
  targetUserId,
  targetUsername,
  context = 'voice_chat',
  sessionId,
  onComplete,
  onClose,
  isOpen,
}: StarRatingMenuProps) => {
  const { user } = useStore();
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingStars, setRemainingStars] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);

  // Load daily limit
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const loadLimit = async () => {
      const limit = await checkDailyLimit(user.id);
      setRemainingStars(limit.remaining);
      setDailyLimit(limit.limit);
    };

    loadLimit();
  }, [user?.id, isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedStars(0);
      setIsComplete(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user?.id || selectedStars === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await giveStarRating(
      user.id,
      user.username || 'Anonym',
      targetUserId,
      targetUsername,
      selectedStars,
      context,
      sessionId
    );

    setIsSubmitting(false);

    if (result.success) {
      setIsComplete(true);
      setRemainingStars(result.remainingStars || 0);
      onComplete?.(selectedStars);

      // Auto-close after animation
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } else {
      setError(result.error || 'Fehler beim Bewerten');
    }
  };

  if (!isOpen) return null;

  const starLabels = ['', 'Okay', 'Gut', 'Super', 'Toll!', 'Fantastisch!'];
  const activeStars = hoveredStar || selectedStars;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <X size={16} className="text-gray-500" />
        </button>

        {isComplete ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check size={40} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-delulu-text mb-2">
              Danke! ⭐
            </h3>
            <p className="text-sm text-delulu-muted">
              Du hast {selectedStars} {selectedStars === 1 ? 'Stern' : 'Sterne'} vergeben
            </p>

            {/* Stars given animation */}
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={`transition-all duration-300 ${
                    star <= selectedStars
                      ? 'text-amber-400 fill-amber-400 scale-110'
                      : 'text-gray-200'
                  }`}
                  style={{
                    animationDelay: `${star * 100}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-delulu-text mb-1">
                Wie war's mit {targetUsername}?
              </h3>
              <p className="text-sm text-delulu-muted">
                Vergib 1-5 Sterne für diesen Voice-Chat
              </p>
            </div>

            {/* Star Selection */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStars(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`transition-all duration-200 ${
                      star <= activeStars
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Star Label */}
            <p className="text-center text-lg font-medium text-delulu-text mb-6 h-7">
              {activeStars > 0 && starLabels[activeStars]}
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={selectedStars === 0 || isSubmitting || remainingStars === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : remainingStars === 0 ? (
                <>Limit erreicht</>
              ) : (
                <>
                  <Sparkles size={20} />
                  Stern{selectedStars !== 1 ? 'e' : ''} vergeben
                </>
              )}
            </button>

            {/* Daily Limit Info */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-delulu-muted">
              <Star size={14} className="text-amber-400" />
              <span>
                {remainingStars} von {dailyLimit} Sternen übrig heute
              </span>
              {dailyLimit === STAR_RATING_CONFIG.dailyLimits.free && (
                <button className="flex items-center gap-1 text-purple-500 font-medium ml-2">
                  <Crown size={12} />
                  Mehr?
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

/**
 * Compact Star Display (for profiles)
 */
export const StarRatingDisplay = ({
  averageRating,
  totalRatings,
  size = 'md',
}: {
  averageRating: number;
  totalRatings: number;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: { star: 14, text: 'text-xs' },
    md: { star: 18, text: 'text-sm' },
    lg: { star: 24, text: 'text-base' },
  };

  const fullStars = Math.floor(averageRating);
  const hasHalf = averageRating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={sizes[size].star}
            className={
              star <= fullStars
                ? 'text-amber-400 fill-amber-400'
                : star === fullStars + 1 && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
      <span className={`${sizes[size].text} text-delulu-muted`}>
        {averageRating.toFixed(1)} ({totalRatings})
      </span>
    </div>
  );
};

export default StarRatingMenu;
