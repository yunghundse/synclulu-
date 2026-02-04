import { useState } from 'react';
import { Sparkles, Users, Star, ArrowRight, Zap } from 'lucide-react';

interface Lounge {
  id: string;
  name: string;
  activeUsers: number;
  rating: number;
  distance: number;
  hasFlashEvent?: boolean;
  flashMultiplier?: number;
}

interface MagicJumpInProps {
  topLounge?: Lounge;
  onJump: (loungeId: string) => void;
  isLoading?: boolean;
}

const MagicJumpIn = ({ topLounge, onJump, isLoading = false }: MagicJumpInProps) => {
  const [isPressed, setIsPressed] = useState(false);

  if (!topLounge) {
    return (
      <div className="glass-card p-5 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <Users size={28} className="text-gray-400" />
        </div>
        <p className="font-semibold text-gray-500">Keine aktiven Lounges</p>
        <p className="text-xs text-gray-400 mt-1">
          Erstelle die erste Lounge in deiner Nähe!
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => onJump(topLounge.id)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      disabled={isLoading}
      className={`
        relative w-full overflow-hidden rounded-3xl p-1
        bg-gradient-to-r from-synclulu-violet via-purple-500 to-synclulu-violet-dark
        shadow-xl shadow-synclulu-violet/30
        transition-all duration-200
        ${isPressed ? 'scale-[0.98] shadow-lg' : 'hover:scale-[1.02] hover:shadow-2xl'}
        ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
        active:scale-[0.97]
      `}
    >
      {/* Inner content */}
      <div className="relative bg-white rounded-[20px] p-5">
        {/* Flash event badge */}
        {topLounge.hasFlashEvent && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-1">
              <Zap size={12} className="fill-white" />
              <span className="text-xs font-bold">{topLounge.flashMultiplier}x XP</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-synclulu-violet to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-synclulu-violet animate-ping opacity-30" />
          </div>

          {/* Info */}
          <div className="flex-1 text-left">
            <p className="text-xs text-synclulu-violet font-semibold uppercase tracking-wider mb-0.5">
              ⚡ Magic Jump-In
            </p>
            <h3 className="font-display text-lg font-bold text-synclulu-text truncate">
              {topLounge.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-synclulu-muted">
                <Users size={12} />
                {topLounge.activeUsers} aktiv
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Star size={12} className="fill-amber-400" />
                {topLounge.rating.toFixed(1)}
              </span>
              <span className="text-xs text-synclulu-muted">
                {topLounge.distance < 1000
                  ? `${Math.round(topLounge.distance)}m`
                  : `${(topLounge.distance / 1000).toFixed(1)}km`
                }
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className={`
            w-10 h-10 rounded-xl bg-synclulu-violet flex items-center justify-center
            transition-transform duration-200
            ${isPressed ? 'translate-x-1' : ''}
          `}>
            <ArrowRight size={20} className="text-white" />
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-3 pt-3 border-t border-synclulu-soft">
          <p className="text-[10px] text-synclulu-muted text-center">
            🎯 Bestbewertete Lounge in deinem Radius • Tippen zum Beitreten
          </p>
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
    </button>
  );
};

export default MagicJumpIn;
