/**
 * ONLINE STATUS INDICATOR
 * Sanft leuchtender Punkt am Profilbild
 */

import { useState, useEffect } from 'react';
import {
  OnlineStatus,
  getPresence,
  subscribeToPresence,
  getStatusColor,
  formatLastSeen,
  PRESENCE_CONFIG,
} from '@/lib/presenceSystem';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const OnlineStatusIndicator = ({
  userId,
  size = 'md',
  showTooltip = false,
  className = '',
}: OnlineStatusIndicatorProps) => {
  const [status, setStatus] = useState<OnlineStatus>('offline');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [showTooltipState, setShowTooltipState] = useState(false);

  useEffect(() => {
    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence(userId, (presence) => {
      if (presence) {
        setStatus(presence.status);
        setLastSeen(presence.lastSeen);
      } else {
        setStatus('offline');
        setLastSeen(null);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const color = getStatusColor(status);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      {/* Main indicator */}
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-gray-900 relative`}
        style={{ backgroundColor: color }}
      >
        {/* Pulsing animation for online status */}
        {status === 'online' && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: color,
              opacity: 0.5,
            }}
          />
        )}

        {/* Soft glow for away status */}
        {status === 'away' && (
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
          {status === 'online' && 'Online'}
          {status === 'away' && 'Abwesend'}
          {status === 'offline' && lastSeen && `Zuletzt: ${formatLastSeen(lastSeen)}`}
          {status === 'offline' && !lastSeen && 'Offline'}

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

/**
 * Inline status badge for lists
 */
export const OnlineStatusBadge = ({
  userId,
  className = '',
}: {
  userId: string;
  className?: string;
}) => {
  const [status, setStatus] = useState<OnlineStatus>('offline');

  useEffect(() => {
    const unsubscribe = subscribeToPresence(userId, (presence) => {
      setStatus(presence?.status || 'offline');
    });
    return () => unsubscribe();
  }, [userId]);

  if (status === 'offline') return null;

  const color = getStatusColor(status);
  const label = status === 'online' ? 'Online' : 'Abwesend';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
};

export default OnlineStatusIndicator;
