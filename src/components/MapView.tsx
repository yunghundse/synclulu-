import { useState, useMemo } from 'react';
import { NearbyUser } from '@/types';
import { getLevelTitle } from '@/lib/uiCopy';

interface MapViewProps {
  users: NearbyUser[];
  radius: number;
  onUserClick?: (user: NearbyUser) => void;
  flashEvents?: FlashEvent[];
}

export interface FlashEvent {
  id: string;
  lat: number;
  lng: number;
  multiplier: number;
  expiresAt: Date;
  loungeId?: string;
  loungeName?: string;
}

const MapView = ({ users, radius, onUserClick, flashEvents = [] }: MapViewProps) => {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  // Calculate positions based on distance (normalized to map size)
  const mapSize = 280;
  const center = mapSize / 2;

  const userPositions = useMemo(() => {
    return users.map(u => {
      // Random angle for visual distribution
      const angle = Math.random() * Math.PI * 2;
      const normalizedDistance = Math.min(u.distance / radius, 0.9);
      const r = normalizedDistance * (center - 20);
      return {
        ...u,
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
      };
    });
  }, [users, radius, center]);

  const flashPositions = useMemo(() => {
    return flashEvents.map(e => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (center - 40);
      return {
        ...e,
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
      };
    });
  }, [flashEvents, center]);

  return (
    <div className="relative w-full aspect-square max-w-[320px] mx-auto">
      {/* Background with gradient rings */}
      <svg viewBox={`0 0 ${mapSize} ${mapSize}`} className="w-full h-full">
        <defs>
          <radialGradient id="mapGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="70%" stopColor="rgba(139, 92, 246, 0.05)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <circle cx={center} cy={center} r={center - 5} fill="url(#mapGradient)" />

        {/* Distance rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(center - 10) * scale}
            fill="none"
            stroke="rgba(139, 92, 246, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Flash Events (3x XP Hotspots) */}
        {flashPositions.map((event) => (
          <g key={event.id}>
            {/* Pulsing glow */}
            <circle
              cx={event.x}
              cy={event.y}
              r="25"
              fill="rgba(251, 191, 36, 0.2)"
              className="animate-ping"
            />
            <circle
              cx={event.x}
              cy={event.y}
              r="18"
              fill="rgba(251, 191, 36, 0.3)"
              filter="url(#glow)"
            />
            <text
              x={event.x}
              y={event.y + 5}
              textAnchor="middle"
              className="text-xs font-bold fill-amber-600"
            >
              {event.multiplier}x
            </text>
          </g>
        ))}

        {/* User pins with audio waves */}
        {userPositions.map((u) => {
          const isActive = u.isActive !== false;
          const levelInfo = getLevelTitle(u.level || 1);
          const isHovered = hoveredUser === u.id;

          return (
            <g
              key={u.id}
              onClick={() => onUserClick?.(u)}
              onMouseEnter={() => setHoveredUser(u.id)}
              onMouseLeave={() => setHoveredUser(null)}
              className="cursor-pointer"
            >
              {/* Audio waves for active users */}
              {isActive && (
                <>
                  <circle
                    cx={u.x}
                    cy={u.y}
                    r="20"
                    fill="none"
                    stroke="rgba(139, 92, 246, 0.3)"
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <circle
                    cx={u.x}
                    cy={u.y}
                    r="14"
                    fill="none"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="1"
                    className="animate-ping"
                    style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}
                  />
                </>
              )}

              {/* User dot */}
              <circle
                cx={u.x}
                cy={u.y}
                r={isHovered ? 10 : 8}
                fill={isActive ? '#8B5CF6' : '#9CA3AF'}
                filter="url(#glow)"
                className="transition-all duration-200"
              />

              {/* Level badge */}
              {u.level && u.level >= 10 && (
                <text
                  x={u.x + 12}
                  y={u.y - 8}
                  className="text-[8px] font-bold fill-delulu-text"
                >
                  {levelInfo.emoji}
                </text>
              )}

              {/* Trust indicator */}
              {u.trustScore && u.trustScore >= 4.5 && (
                <circle
                  cx={u.x + 10}
                  cy={u.y + 10}
                  r="4"
                  fill="#10B981"
                />
              )}
            </g>
          );
        })}

        {/* Center point (You) */}
        <circle
          cx={center}
          cy={center}
          r="12"
          fill="#8B5CF6"
          filter="url(#glow)"
        />
        <circle
          cx={center}
          cy={center}
          r="6"
          fill="white"
        />
      </svg>

      {/* Radius label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
        <span className="text-xs font-medium text-delulu-muted">
          {radius >= 1000 ? `${(radius/1000).toFixed(1)}km` : `${radius}m`} Radius
        </span>
      </div>

      {/* User count */}
      <div className="absolute top-2 right-2 bg-delulu-violet text-white px-2 py-1 rounded-lg shadow-lg">
        <span className="text-xs font-bold">{users.length} aktiv</span>
      </div>
    </div>
  );
};

export default MapView;
