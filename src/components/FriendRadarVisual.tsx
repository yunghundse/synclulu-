/**
 * FRIEND RADAR VISUAL v1.5
 * "synclulu Vibes Edition"
 *
 * DESIGN FEATURES:
 * - Animated radar sweep
 * - Pulse rings
 * - User avatars positioned by distance/bearing
 * - Interactive user selection
 * - Haptic feedback on discoveries
 *
 * @design Apple Maps meets synclulu aesthetic
 * @version 1.5.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Radar, MapPin, Users, Sparkles, Zap,
  ChevronRight, Crown, Star, Wifi, WifiOff
} from 'lucide-react';
import { usePrecisionRadar } from '@/hooks/usePrecisionRadar';
import { formatDistance, getDistanceTier, NearbyUser } from '@/lib/precisionRadar';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface FriendRadarVisualProps {
  onUserSelect?: (user: NearbyUser) => void;
  compact?: boolean;
}

// ═══════════════════════════════════════
// RADAR DOT COMPONENT (User Avatar)
// ═══════════════════════════════════════

interface RadarDotProps {
  user: NearbyUser;
  containerSize: number;
  maxRadius: number;
  onClick?: () => void;
  isSelected?: boolean;
}

const RadarDot: React.FC<RadarDotProps> = ({
  user,
  containerSize,
  maxRadius,
  onClick,
  isSelected,
}) => {
  // Calculate position based on distance and bearing
  const normalizedDistance = Math.min(user.distance / maxRadius, 1);
  const availableRadius = (containerSize / 2) - 30; // Leave margin for avatar
  const distanceFromCenter = normalizedDistance * availableRadius;

  // Convert bearing to radians (0° = top, clockwise)
  const angleRad = ((user.bearing - 90) * Math.PI) / 180;
  const x = Math.cos(angleRad) * distanceFromCenter;
  const y = Math.sin(angleRad) * distanceFromCenter;

  // Get tier for styling
  const tier = getDistanceTier(user.distance);
  const tierStyles = {
    immediate: 'ring-green-400 shadow-green-500/50',
    near: 'ring-emerald-400 shadow-emerald-500/40',
    mid: 'ring-purple-400 shadow-purple-500/30',
    far: 'ring-blue-400 shadow-blue-500/20',
    edge: 'ring-gray-400 shadow-gray-500/10',
  };

  // Avatar URL fallback
  const avatarSrc = user.avatarUrl || user.avatar
    ? `https://storage.googleapis.com/synclulu-avatars/${user.avatar || 'default'}.png`
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`;

  return (
    <button
      onClick={() => {
        if ('vibrate' in navigator) navigator.vibrate(15);
        onClick?.();
      }}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        transition-all duration-500 ease-out
        ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}
      `}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
    >
      <div className="relative">
        {/* Avatar */}
        <div
          className={`
            w-12 h-12 rounded-full overflow-hidden
            ring-2 ${tierStyles[tier]}
            shadow-lg ${tierStyles[tier]}
            ${isSelected ? 'ring-4 ring-purple-500' : ''}
            ${user.isActive ? 'animate-pulse' : ''}
          `}
        >
          <img
            src={avatarSrc}
            alt={user.displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`;
            }}
          />
        </div>

        {/* Activity indicator */}
        {user.isActive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}

        {/* Premium badge */}
        {user.isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown size={10} className="text-white" />
          </div>
        )}

        {/* Distance label */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] font-semibold text-gray-500 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm">
            {formatDistance(user.distance)}
          </span>
        </div>
      </div>
    </button>
  );
};

// ═══════════════════════════════════════
// RADAR RINGS COMPONENT
// ═══════════════════════════════════════

const RadarRings: React.FC<{ size: number; isScanning: boolean }> = ({ size, isScanning }) => {
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {rings.map((scale, index) => (
        <div
          key={index}
          className={`
            absolute rounded-full border
            ${index === rings.length - 1
              ? 'border-purple-300/50'
              : 'border-purple-200/30'
            }
          `}
          style={{
            width: size * scale,
            height: size * scale,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Scan line */}
      {isScanning && (
        <div
          className="absolute left-1/2 top-1/2 origin-bottom animate-radar-sweep"
          style={{
            width: 2,
            height: size / 2,
            background: 'linear-gradient(to top, rgba(147, 51, 234, 0.8), transparent)',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Center pulse */}
      {isScanning && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-purple-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// USER INFO CARD (Bottom Sheet Style)
// ═══════════════════════════════════════

interface UserInfoCardProps {
  user: NearbyUser | null;
  onClose: () => void;
  onViewProfile: () => void;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, onClose, onViewProfile }) => {
  if (!user) return null;

  const avatarSrc = user.avatarUrl || user.avatar
    ? `https://storage.googleapis.com/synclulu-avatars/${user.avatar || 'default'}.png`
    : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-4 animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-purple-200 shadow-lg">
          <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {user.displayName}
            </h3>
            {user.isPremium && (
              <Crown size={16} className="text-amber-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">@{user.username}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-purple-600 font-semibold">
              Level {user.level}
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Star size={12} />
              {user.trustScore}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={12} />
              {formatDistance(user.distance)}
            </span>
          </div>
        </div>

        <button
          onClick={onViewProfile}
          className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN FRIEND RADAR VISUAL
// ═══════════════════════════════════════

const FriendRadarVisual: React.FC<FriendRadarVisualProps> = ({
  onUserSelect,
  compact = false,
}) => {
  const {
    isEnabled,
    isLoading,
    error,
    permission,
    nearbyUsers,
    nearbyCount,
    radius,
    refreshNearby,
  } = usePrecisionRadar();

  const { user } = useStore();
  const myAvatarUrl = user?.avatarUrl || null;

  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Radar size
  const containerSize = compact ? 200 : 320;

  // Start scanning animation
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    if ('vibrate' in navigator) navigator.vibrate([20, 50, 20, 50, 20]);

    await refreshNearby();

    setTimeout(() => {
      setIsScanning(false);
      if (nearbyUsers.length > 0 && 'vibrate' in navigator) {
        navigator.vibrate([10, 30, 10, 30, 50]); // Discovery pattern
      }
    }, 2000);
  }, [refreshNearby, nearbyUsers.length]);

  // Auto-scan on mount
  useEffect(() => {
    if (isEnabled && permission === 'granted') {
      handleScan();
    }
  }, [isEnabled, permission]);

  // ═══════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className={`flex flex-col items-center justify-center ${compact ? 'p-4' : 'p-8'}`}>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <WifiOff size={28} className="text-red-500" />
        </div>
        <p className="text-gray-600 text-center mb-2">Standort-Zugriff verweigert</p>
        <p className="text-sm text-gray-400 text-center">
          Aktiviere den Standort in deinen Einstellungen
        </p>
      </div>
    );
  }

  // Disabled
  if (!isEnabled) {
    return (
      <div className={`flex flex-col items-center justify-center ${compact ? 'p-4' : 'p-8'}`}>
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Radar size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-600 text-center mb-2">Radar deaktiviert</p>
        <p className="text-sm text-gray-400 text-center">
          Aktiviere den Friend Radar in den Einstellungen
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ═══════════════════════════════════════ */}
      {/* RADAR CONTAINER */}
      {/* ═══════════════════════════════════════ */}
      <div
        className="relative mx-auto"
        style={{ width: containerSize, height: containerSize }}
        onClick={() => selectedUser && setSelectedUser(null)}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-100/50 via-white to-pink-100/50"
          style={{
            boxShadow: 'inset 0 0 40px rgba(147, 51, 234, 0.1)',
          }}
        />

        {/* Radar rings */}
        <RadarRings size={containerSize} isScanning={isScanning} />

        {/* Center (My position) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-purple-500 shadow-xl shadow-purple-500/30">
              <img
                src={myAvatarUrl}
                alt="Du"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              DU
            </div>
          </div>
        </div>

        {/* Nearby users */}
        {nearbyUsers.map((user) => (
          <RadarDot
            key={user.id}
            user={user}
            containerSize={containerSize}
            maxRadius={radius}
            onClick={() => {
              setSelectedUser(user);
              onUserSelect?.(user);
            }}
            isSelected={selectedUser?.id === user.id}
          />
        ))}

        {/* Direction labels */}
        {!compact && (
          <>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium">N</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium">S</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">W</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">O</span>
          </>
        )}

        {/* User info card */}
        <UserInfoCard
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onViewProfile={() => {
            // Navigate to user profile
            if (selectedUser) {
              window.location.href = `/profile/${selectedUser.id}`;
            }
          }}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CONTROLS */}
      {/* ═══════════════════════════════════════ */}
      {!compact && (
        <div className="mt-6 flex items-center justify-center gap-4">
          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`
              px-6 py-3 rounded-2xl font-semibold
              flex items-center gap-2
              transition-all
              ${isScanning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95'
              }
            `}
          >
            {isScanning ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Scanne...
              </>
            ) : (
              <>
                <Radar size={20} />
                Radar scannen
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* STATUS BAR */}
      {/* ═══════════════════════════════════════ */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <Users size={14} />
          <span className="font-semibold text-purple-600">{nearbyCount}</span>
          <span>in der Nähe</span>
        </span>
        <span className="text-gray-300">•</span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <MapPin size={14} />
          <span>{radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}</span>
        </span>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CSS ANIMATIONS */}
      {/* ═══════════════════════════════════════ */}
      <style>{`
        @keyframes radar-sweep {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
        .animate-radar-sweep {
          animation: radar-sweep 2s linear infinite;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FriendRadarVisual;
