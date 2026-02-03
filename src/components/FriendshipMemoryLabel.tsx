/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FRIENDSHIP MEMORY LABEL - Visual Duration & Trust Display
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Shows:
 * - Friendship duration (e.g., "3 Monate, 12 Tage befreundet")
 * - Trust Level Score
 * - Common Interests
 * - Shared Room Statistics
 *
 * @author Lead Full-Stack Engineer @ Apple
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Heart, Sparkles, Users, Mic, MapPin,
  Calendar, Shield, Star, Flame
} from 'lucide-react';
import {
  useFriendshipMetadata,
  type FriendshipMetadata,
  type FriendshipDuration,
  type FriendshipMemory,
} from '@/lib/friendshipMetadata';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface FriendshipMemoryLabelProps {
  friendshipId: string;
  compact?: boolean;
  showTrust?: boolean;
  showMemories?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION LABEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const DurationLabel = ({ duration }: { duration: FriendshipDuration }) => {
  const getEmoji = () => {
    if (duration.years >= 1) return '💜';
    if (duration.months >= 6) return '💕';
    if (duration.months >= 1) return '💙';
    if (duration.totalDays >= 7) return '💫';
    return '🌱';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{getEmoji()}</span>
      <div>
        <p className="text-sm font-semibold text-white">
          {duration.label} befreundet
        </p>
        <p className="text-xs text-white/50">
          seit {duration.totalDays} Tagen
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

const TrustIndicator = ({ score }: { score: number }) => {
  const getConfig = () => {
    if (score >= 90) return { label: 'Sehr hoch', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 70) return { label: 'Hoch', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 50) return { label: 'Mittel', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Niedrig', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const config = getConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.bg}`}>
      <Shield size={14} className={config.color} />
      <span className={`text-xs font-semibold ${config.color}`}>
        Trust: {score}%
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY BADGES
// ═══════════════════════════════════════════════════════════════════════════════

const MemoryBadge = ({ memory }: { memory: FriendshipMemory }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 rounded-xl"
  >
    <span className="text-lg">{memory.icon}</span>
    <div>
      <p className="text-xs font-semibold text-white">{memory.title}</p>
      <p className="text-[10px] text-white/50">{memory.description}</p>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STATS ROW
// ═══════════════════════════════════════════════════════════════════════════════

const StatItem = ({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Clock;
  value: string | number;
  label: string;
  color: string;
}) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
      <Icon size={14} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/50">{label}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FriendshipMemoryLabel = ({
  friendshipId,
  compact = false,
  showTrust = true,
  showMemories = true,
}: FriendshipMemoryLabelProps) => {
  const { metadata, duration, memories, isLoading } = useFriendshipMetadata(friendshipId);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-white/10 rounded-xl" />
      </div>
    );
  }

  if (!metadata || !duration) {
    return null;
  }

  // Compact version (inline)
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl">
        <Clock size={14} className="text-purple-400" />
        <span className="text-xs text-white/70">
          {duration.labelShort} befreundet
        </span>
        {showTrust && (
          <>
            <span className="text-white/30">•</span>
            <Shield size={14} className="text-green-400" />
            <span className="text-xs text-white/70">
              {metadata.trustLevelScore}%
            </span>
          </>
        )}
      </div>
    );
  }

  // Full version (card)
  return (
    <div className="bg-dark-card rounded-2xl overflow-hidden">
      {/* Header with Duration */}
      <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
        <div className="flex items-center justify-between">
          <DurationLabel duration={duration} />
          {showTrust && <TrustIndicator score={metadata.trustLevelScore} />}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-4">
        <StatItem
          icon={Users}
          value={metadata.sharedRoomsCount}
          label="Wölkchen"
          color="bg-purple-500/30"
        />
        <StatItem
          icon={Mic}
          value={`${Math.floor(metadata.totalVoiceMinutes)}m`}
          label="Voice Zeit"
          color="bg-blue-500/30"
        />
        <StatItem
          icon={Heart}
          value={metadata.commonInterests.length}
          label="Gemeinsam"
          color="bg-pink-500/30"
        />
      </div>

      {/* Common Interests */}
      {metadata.commonInterests.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/50 mb-2">Gemeinsame Interessen</p>
          <div className="flex flex-wrap gap-2">
            {metadata.commonInterests.slice(0, 5).map((interest) => (
              <span
                key={interest}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
              >
                {interest}
              </span>
            ))}
            {metadata.commonInterests.length > 5 && (
              <span className="px-2 py-1 bg-white/10 text-white/50 text-xs rounded-lg">
                +{metadata.commonInterests.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Met Location */}
      {metadata.metAtVenueName && (
        <div className="px-4 pb-4 flex items-center gap-2 text-white/50">
          <MapPin size={12} />
          <span className="text-xs">{metadata.metAtVenueName}</span>
        </div>
      )}

      {/* Memories */}
      {showMemories && memories.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/50 mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            Erinnerungen
          </p>
          <div className="space-y-2">
            {memories.slice(0, 3).map((memory, i) => (
              <MemoryBadge key={i} memory={memory} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE BADGE VERSION
// ═══════════════════════════════════════════════════════════════════════════════

export const FriendshipDurationBadge = ({ friendshipId }: { friendshipId: string }) => {
  const { duration, isLoading } = useFriendshipMetadata(friendshipId);

  if (isLoading || !duration) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-full"
    >
      <Calendar size={10} className="text-purple-400" />
      <span className="text-[10px] text-purple-300 font-medium">
        {duration.labelShort}
      </span>
    </motion.div>
  );
};

export default FriendshipMemoryLabel;
