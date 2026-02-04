/**
 * synclulu STICKY AVATAR
 * "Permanent Identity" - Zero-flicker avatar component
 *
 * GUARANTEES:
 * 1. Never shows loading state (instant display)
 * 2. Falls back gracefully: Custom → Preset → Default
 * 3. Consistent across all components
 * 4. Optimized for performance
 * 5. BULLETPROOF: Uses context for current user, cache for others
 *
 * USAGE:
 * <StickyAvatar size="lg" />  // Current user
 * <StickyAvatar userId="123" fallbackUrl="..." size="md" />  // Other user
 */

import React, { useMemo, memo } from 'react';
import { User } from 'lucide-react';
import { getStickyAvatarUrl } from '@/lib/avatarCache';
import { useStore } from '@/lib/store';
import { useBulletproofAvatar, useOtherUserAvatar } from '@/hooks/useBulletproofAvatar';

// ═══════════════════════════════════════
// SIZE CONFIGURATIONS
// ═══════════════════════════════════════

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

const SIZE_MAP: Record<AvatarSize, { container: string; icon: number }> = {
  xs: { container: 'w-6 h-6', icon: 12 },
  sm: { container: 'w-8 h-8', icon: 16 },
  md: { container: 'w-10 h-10', icon: 20 },
  lg: { container: 'w-12 h-12', icon: 24 },
  xl: { container: 'w-16 h-16', icon: 32 },
  '2xl': { container: 'w-20 h-20', icon: 40 },
  hero: { container: 'w-24 h-24', icon: 48 },
};

// ═══════════════════════════════════════
// PROPS
// ═══════════════════════════════════════

interface StickyAvatarProps {
  // For other users (optional - defaults to current user)
  userId?: string;
  fallbackUrl?: string | null;
  presetId?: string;

  // Display options
  size?: AvatarSize;
  className?: string;
  bordered?: boolean;
  borderColor?: string;
  shadow?: boolean;
  blur?: boolean; // For anonymous mode
  online?: boolean; // Show online indicator

  // Click handler
  onClick?: () => void;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

const StickyAvatar: React.FC<StickyAvatarProps> = memo(({
  userId,
  fallbackUrl,
  presetId,
  size = 'md',
  className = '',
  bordered = false,
  borderColor = 'border-white',
  shadow = false,
  blur = false,
  online,
  onClick,
}) => {
  const { user } = useStore();

  // BULLETPROOF: Use different strategies for current user vs other users
  const isCurrentUser = !userId || userId === user?.id;

  // For current user: Use bulletproof hook (session + permanent + cache)
  const { avatarUrl: currentUserAvatar } = useBulletproofAvatar();

  // For other users: Use cached resolution
  const otherUserAvatar = useOtherUserAvatar({
    userId: userId || '',
    avatarUrl: fallbackUrl,
    avatar: presetId,
  });

  // Select the correct avatar URL
  const avatarUrl = isCurrentUser ? currentUserAvatar : otherUserAvatar;

  const sizeConfig = SIZE_MAP[size];

  // Build class names
  const containerClasses = [
    sizeConfig.container,
    'rounded-full overflow-hidden flex-shrink-0',
    'bg-gradient-to-br from-purple-100 to-violet-100',
    bordered && `ring-2 ${borderColor}`,
    shadow && 'shadow-lg shadow-purple-500/20',
    blur && 'filter blur-sm',
    onClick && 'cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="relative inline-block">
      <div className={containerClasses} onClick={onClick}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            loading="lazy"
            // Bulletproof fallback on error
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== '/avatars/pegasus.png') {
                target.src = '/avatars/pegasus.png';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={sizeConfig.icon} className="text-purple-400" />
          </div>
        )}
      </div>

      {/* Online Indicator */}
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
            online ? 'bg-green-500' : 'bg-gray-400'
          } ${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
        />
      )}
    </div>
  );
});

StickyAvatar.displayName = 'StickyAvatar';

// ═══════════════════════════════════════
// AVATAR GROUP (for multiple users)
// ═══════════════════════════════════════

interface AvatarGroupProps {
  users: Array<{
    id: string;
    avatarUrl?: string | null;
    avatar?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = memo(({
  users,
  max = 4,
  size = 'sm',
  className = '',
}) => {
  const visibleUsers = users.slice(0, max);
  const hiddenCount = users.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleUsers.map((user) => (
        <StickyAvatar
          key={user.id}
          userId={user.id}
          fallbackUrl={user.avatarUrl}
          presetId={user.avatar}
          size={size}
          bordered
          borderColor="border-white"
        />
      ))}
      {hiddenCount > 0 && (
        <div
          className={`${SIZE_MAP[size].container} rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
});

AvatarGroup.displayName = 'AvatarGroup';

export default StickyAvatar;
