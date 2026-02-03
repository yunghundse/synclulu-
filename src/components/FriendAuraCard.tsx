/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FRIEND AURA CARD - Social Pulse v14.5
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Glowing friend card that shows real-time presence:
 * - Inaktiv: Gray, subtle (offline)
 * - Online: White name with blue dot
 * - Im Wölkchen: Neon-glow purple/pink, "Im Café Central Wölkchen"
 * - Quick-Join: Tap to join friend's cloud
 *
 * @version 14.5.0 - Aura-Visualizer Edition
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sparkles, MapPin, Clock, Eye, EyeOff, Crown } from 'lucide-react';
import type { UserPresence } from '../lib/presenceVault';
import { useSafeJoin } from '../hooks/useSafeJoin';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface FriendAuraCardProps {
  friend: UserPresence;
  currentUserId: string;
  currentUserLevel: number;
  isNearby?: boolean; // Same café radius = golden aura
  onJoinCloud?: (roomId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function formatLastSeen(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'Gerade eben';
  if (diff < 3600000) return `Vor ${Math.floor(diff / 60000)} Min`;
  if (diff < 86400000) return `Vor ${Math.floor(diff / 3600000)} Std`;
  return `Vor ${Math.floor(diff / 86400000)} Tagen`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AURA GLOW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AuraGlow = memo(({
  isInCloud,
  isNearby,
  isFounder,
}: {
  isInCloud: boolean;
  isNearby: boolean;
  isFounder: boolean;
}) => {
  if (!isInCloud) return null;

  const glowColor = isFounder
    ? 'rgba(255, 215, 0, 0.5)' // Gold for founder
    : isNearby
    ? 'rgba(255, 215, 0, 0.4)' // Golden for destiny match
    : 'rgba(168, 85, 247, 0.5)'; // Purple default

  return (
    <>
      {/* Outer pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `0 0 20px ${glowColor}`,
        }}
        animate={{
          boxShadow: [
            `0 0 20px ${glowColor}`,
            `0 0 35px ${glowColor}`,
            `0 0 20px ${glowColor}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Destiny match sparkle */}
      {isNearby && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={16} className="text-yellow-400" />
        </motion.div>
      )}
    </>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR WITH PRESENCE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

const PresenceAvatar = memo(({
  avatarUrl,
  displayName,
  isOnline,
  isInCloud,
  isFounder,
  isGhostMode,
}: {
  avatarUrl?: string;
  displayName: string;
  isOnline: boolean;
  isInCloud: boolean;
  isFounder: boolean;
  isGhostMode: boolean;
}) => {
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Border color based on state
  const borderColor = isInCloud
    ? isFounder
      ? 'border-yellow-500'
      : 'border-purple-500'
    : isOnline
    ? 'border-blue-400'
    : 'border-gray-600';

  return (
    <div className="relative">
      {/* Avatar */}
      <motion.div
        className={`w-12 h-12 rounded-full overflow-hidden border-2 ${borderColor}`}
        animate={isInCloud ? { scale: [1, 1.05, 1] } : {}}
        transition={isInCloud ? { duration: 2, repeat: Infinity } : {}}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            {initials}
          </div>
        )}
      </motion.div>

      {/* Presence indicator dot */}
      <motion.div
        className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0b0b0b] ${
          isInCloud
            ? isFounder
              ? 'bg-yellow-500'
              : 'bg-purple-500'
            : isOnline
            ? 'bg-green-500'
            : 'bg-gray-500'
        }`}
        animate={isInCloud ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Founder crown */}
      {isFounder && (
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown size={14} className="text-yellow-400" fill="currentColor" />
        </motion.div>
      )}

      {/* Ghost mode indicator */}
      {isGhostMode && (
        <div className="absolute -top-1 -left-1 text-xs">👻</div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FRIEND AURA CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const FriendAuraCard = memo(({
  friend,
  currentUserId,
  currentUserLevel,
  isNearby = false,
  onJoinCloud,
}: FriendAuraCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { safeJoin, isProcessing } = useSafeJoin();

  const handleJoinCloud = useCallback(async () => {
    if (!friend.currentRoomId || isJoining || isProcessing) return;

    setIsJoining(true);

    try {
      // Use the safeJoin hook for the atomic handshake
      const result = await safeJoin({
        userId: currentUserId,
        username: '', // Will be filled from user context
        displayName: '',
        level: currentUserLevel,
        isAnonymous: false,
        // We pass the specific room to join
      });

      if (result.success && onJoinCloud) {
        onJoinCloud(friend.currentRoomId);
      }
    } catch (error) {
      console.error('[FriendAuraCard] Join error:', error);
    } finally {
      setIsJoining(false);
    }
  }, [friend.currentRoomId, currentUserId, currentUserLevel, safeJoin, isProcessing, onJoinCloud]);

  const { isInCloud, isOnline, isFounder, isGhostMode } = friend;

  return (
    <motion.div
      className={`relative flex items-center p-4 rounded-2xl transition-all duration-700 ${
        isInCloud
          ? 'bg-purple-500/10 border border-purple-500/30'
          : 'bg-transparent border border-transparent'
      }`}
      style={{
        backdropFilter: isInCloud ? 'blur(8px)' : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Aura glow effect */}
      <AuraGlow
        isInCloud={isInCloud}
        isNearby={isNearby}
        isFounder={isFounder}
      />

      {/* Avatar */}
      <PresenceAvatar
        avatarUrl={friend.avatarUrl}
        displayName={friend.displayName}
        isOnline={isOnline}
        isInCloud={isInCloud}
        isFounder={isFounder}
        isGhostMode={isGhostMode}
      />

      {/* Info */}
      <div className="ml-4 flex-1 min-w-0">
        <h4
          className={`font-bold truncate ${
            isInCloud
              ? 'text-white'
              : isOnline
              ? 'text-gray-200'
              : 'text-gray-400'
          }`}
        >
          {friend.displayName}
          {friend.statusEmoji && (
            <span className="ml-1">{friend.statusEmoji}</span>
          )}
        </h4>

        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
          {isInCloud ? (
            <>
              <Cloud size={10} className="text-purple-400" />
              <span className="text-purple-300">
                Schwebt im {friend.currentRoomName || 'Wölkchen'} ✨
              </span>
            </>
          ) : isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span>Online</span>
            </>
          ) : (
            <>
              <Clock size={10} />
              <span>{formatLastSeen(friend.lastSeen)}</span>
            </>
          )}
        </p>

        {/* Destiny match indicator */}
        {isNearby && isInCloud && (
          <motion.p
            className="text-xs text-yellow-400 flex items-center gap-1 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MapPin size={10} />
            <span>In deiner Nähe!</span>
          </motion.p>
        )}
      </div>

      {/* Join button */}
      <AnimatePresence>
        {isInCloud && friend.currentRoomId && (
          <motion.button
            className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={{
              background: isJoining
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: '#C4B5FD',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinCloud}
            disabled={isJoining || isProcessing}
          >
            {isJoining ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Verbinde...
              </motion.span>
            ) : (
              'Mitfliegen'
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// FRIEND LIST WITH AURA
// ═══════════════════════════════════════════════════════════════════════════════

interface FriendAuraListProps {
  friends: UserPresence[];
  currentUserId: string;
  currentUserLevel: number;
  onJoinCloud?: (roomId: string) => void;
}

export const FriendAuraList = memo(({
  friends,
  currentUserId,
  currentUserLevel,
  onJoinCloud,
}: FriendAuraListProps) => {
  // Sort: In-cloud first, then online, then by last seen
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.isInCloud && !b.isInCloud) return -1;
    if (!a.isInCloud && b.isInCloud) return 1;
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return b.lastSeen.getTime() - a.lastSeen.getTime();
  });

  const inCloudCount = friends.filter(f => f.isInCloud).length;

  return (
    <div className="space-y-2">
      {/* Header with cloud count */}
      {inCloudCount > 0 && (
        <motion.div
          className="flex items-center gap-2 px-2 py-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Cloud size={14} className="text-purple-400" />
          <span className="text-xs text-purple-300">
            {inCloudCount} {inCloudCount === 1 ? 'Freund schwebt' : 'Freunde schweben'} gerade
          </span>
        </motion.div>
      )}

      {/* Friend cards */}
      <AnimatePresence mode="popLayout">
        {sortedFriends.map((friend) => (
          <FriendAuraCard
            key={friend.oderId}
            friend={friend}
            currentUserId={currentUserId}
            currentUserLevel={currentUserLevel}
            onJoinCloud={onJoinCloud}
          />
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {friends.length === 0 && (
        <div className="text-center py-8">
          <Cloud size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Noch keine Freunde</p>
        </div>
      )}
    </div>
  );
});

export default FriendAuraCard;
