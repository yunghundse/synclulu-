import { useState, useEffect } from 'react';
import { Zap, Clock, MapPin, Users, ChevronRight } from 'lucide-react';

interface FlashEvent {
  id: string;
  name: string;
  multiplier: number;
  expiresAt: Date;
  distance: number;
  activeUsers: number;
  loungeId?: string;
}

interface FlashEventCardProps {
  event: FlashEvent;
  onJoin: (eventId: string) => void;
}

const FlashEventCard = ({ event, onJoin }: FlashEventCardProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = event.expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Abgelaufen');
        setUrgency('high');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes < 5) {
        setUrgency('high');
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else if (minutes < 15) {
        setUrgency('medium');
        setTimeLeft(`${minutes} min`);
      } else {
        setUrgency('low');
        setTimeLeft(`${minutes} min`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [event.expiresAt]);

  const urgencyStyles = {
    low: 'from-amber-400 to-orange-500 border-amber-300',
    medium: 'from-orange-500 to-red-500 border-orange-400 animate-pulse',
    high: 'from-red-500 to-red-600 border-red-400 animate-pulse',
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${Math.round(meters)}m`;
  };

  return (
    <button
      onClick={() => onJoin(event.id)}
      className={`
        relative w-full overflow-hidden rounded-2xl
        bg-gradient-to-r ${urgencyStyles[urgency]}
        p-[2px] shadow-lg
        hover:scale-[1.02] active:scale-[0.98]
        transition-transform duration-200
      `}
    >
      <div className="bg-white rounded-[14px] p-4">
        <div className="flex items-center gap-3">
          {/* Multiplier badge */}
          <div className="relative">
            <div className={`
              w-14 h-14 rounded-xl bg-gradient-to-br ${urgencyStyles[urgency]}
              flex items-center justify-center shadow-lg
            `}>
              <div className="text-center">
                <Zap size={16} className="text-white mx-auto" />
                <span className="text-white font-black text-lg">{event.multiplier}x</span>
              </div>
            </div>
            {urgency === 'high' && (
              <div className="absolute -inset-1 rounded-xl border-2 border-red-400 animate-ping opacity-50" />
            )}
          </div>

          {/* Event info */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-synclulu-text">
                {event.name}
              </span>
              {urgency === 'high' && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                  ENDET BALD
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-synclulu-muted">
                <Clock size={10} />
                {timeLeft}
              </span>
              <span className="flex items-center gap-1 text-xs text-synclulu-muted">
                <MapPin size={10} />
                {formatDistance(event.distance)}
              </span>
              <span className="flex items-center gap-1 text-xs text-synclulu-muted">
                <Users size={10} />
                {event.activeUsers}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className={`
            w-8 h-8 rounded-lg bg-gradient-to-r ${urgencyStyles[urgency]}
            flex items-center justify-center
          `}>
            <ChevronRight size={18} className="text-white" />
          </div>
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
    </button>
  );
};

export default FlashEventCard;
