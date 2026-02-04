import { useState } from 'react';
import { Check, X, Clock, UserPlus, Shield, Loader2 } from 'lucide-react';
import { FriendRequest } from '@/types';
import { getLevelTitle } from '@/lib/uiCopy';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

const FriendRequestCard = ({
  request,
  onAccept,
  onDecline,
}: FriendRequestCardProps) => {
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | null>(null);
  const [isDone, setIsDone] = useState(false);

  const levelInfo = getLevelTitle(request.fromLevel);

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(request.expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Abgelaufen';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} Tage übrig`;
    return `${hours} Stunden übrig`;
  };

  // Trust tier color
  const getTrustColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3.5) return 'text-blue-600 bg-blue-100';
    if (score >= 2.5) return 'text-gray-600 bg-gray-100';
    return 'text-red-600 bg-red-100';
  };

  const handleAccept = async () => {
    setIsLoading('accept');
    try {
      await onAccept(request.id);
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 20, 50]);
      }
      setIsDone(true);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDecline = async () => {
    setIsLoading('decline');
    try {
      await onDecline(request.id);
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      setIsDone(true);
    } finally {
      setIsLoading(null);
    }
  };

  if (isDone) {
    return (
      <div className="glass-card p-4 opacity-50">
        <div className="flex items-center justify-center gap-2 text-synclulu-muted">
          <Check size={16} />
          <span className="text-sm">Bearbeitet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-synclulu-soft">
            {request.fromAvatar ? (
              <img
                src={request.fromAvatar}
                alt={request.fromDisplayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {levelInfo.emoji}
              </div>
            )}
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-white rounded-md shadow-sm border border-gray-100">
            <span className="text-[10px] font-bold text-synclulu-violet">
              Lv.{request.fromLevel}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-synclulu-text truncate">
              {request.fromDisplayName}
            </span>
            <span className="text-xs text-synclulu-muted">
              @{request.fromUsername}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1">
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getTrustColor(request.fromTrustScore)}`}>
              <Shield size={10} />
              {request.fromTrustScore.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-xs text-synclulu-muted">
              <Clock size={10} />
              {getTimeRemaining()}
            </span>
          </div>

          {/* Message */}
          {request.message && (
            <p className="mt-2 text-sm text-synclulu-muted italic bg-gray-50 p-2 rounded-lg">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleDecline}
          disabled={isLoading !== null}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            font-semibold text-sm transition-all duration-200
            ${isLoading === 'decline'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
            }
          `}
        >
          {isLoading === 'decline' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <X size={16} />
          )}
          Ablehnen
        </button>

        <button
          onClick={handleAccept}
          disabled={isLoading !== null}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            font-semibold text-sm transition-all duration-200
            ${isLoading === 'accept'
              ? 'bg-green-200 text-green-700'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }
          `}
        >
          {isLoading === 'accept' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          Annehmen
        </button>
      </div>

      {/* Handshake hint */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-synclulu-muted">
        <span>🤝</span>
        <span>Handshake-Freundschaft: Beide müssen bestätigen</span>
      </div>
    </div>
  );
};

export default FriendRequestCard;
