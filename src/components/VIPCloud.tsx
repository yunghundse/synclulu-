import React from 'react';
import { Users, Mic, MicOff, Hand, Volume2 } from 'lucide-react';
import { NebulaBadge, VIPAura } from './NebulaBadge';
import type { StarEvent, NebulaTier, StageParticipant } from '@/types';

interface VIPCloudProps {
  event: StarEvent;
  onJoin?: () => void;
  isPrioritized?: boolean;
  className?: string;
}

export const VIPCloud: React.FC<VIPCloudProps> = ({
  event,
  onJoin,
  isPrioritized = true,
  className = '',
}) => {
  const isLive = !!event.startedAt && !event.endedAt;

  return (
    <div
      className={`relative ${className}`}
      onClick={onJoin}
    >
      {/* VIP Aura Background */}
      <VIPAura tier={event.hostTier} intensity={isPrioritized ? 'intense' : 'normal'}>
        <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl border border-gray-700/50 p-4 backdrop-blur-sm cursor-pointer hover:scale-[1.02] transition-transform">
          {/* Live Indicator */}
          {isLive && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-red-400">LIVE</span>
            </div>
          )}

          {/* Host Info */}
          <div className="flex items-start gap-3 mb-3">
            {/* Host Avatar with Aura */}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full bg-cover bg-center border-2"
                style={{
                  backgroundImage: event.hostAvatar
                    ? `url(${event.hostAvatar})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderColor: getTierColor(event.hostTier),
                  boxShadow: `0 0 20px ${getTierGlow(event.hostTier)}`,
                }}
              />
              <div className="absolute -bottom-1 -right-1">
                <NebulaBadge tier={event.hostTier} size="sm" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white truncate">
                  @{event.hostUsername}
                </h3>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {event.hostDisplayName}
              </p>
            </div>
          </div>

          {/* Event Title */}
          <h4 className="font-semibold text-white mb-2 line-clamp-2">
            {event.title}
          </h4>

          {/* Stage Participants Preview */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {event.stageParticipants.slice(0, 4).map((p) => (
                <ParticipantAvatar key={p.id} participant={p} />
              ))}
              {event.stageParticipants.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-gray-400">
                  +{event.stageParticipants.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">auf der Bühne</span>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {event.currentListeners.toLocaleString()}
              </span>
              {event.handRaiseQueue.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Hand size={14} />
                  {event.handRaiseQueue.length}
                </span>
              )}
            </div>

            {/* XP Multiplier */}
            {event.xpMultiplier > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
                {event.xpMultiplier}x XP
              </span>
            )}
          </div>
        </div>
      </VIPAura>
    </div>
  );
};

// ═══════════════════════════════════════
// PARTICIPANT AVATAR
// ═══════════════════════════════════════

interface ParticipantAvatarProps {
  participant: StageParticipant;
  size?: 'sm' | 'md';
}

const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({
  participant,
  size = 'sm',
}) => {
  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';

  return (
    <div className="relative">
      <div
        className={`${sizeClass} rounded-full bg-cover bg-center border-2 border-gray-800`}
        style={{
          backgroundImage: participant.avatar
            ? `url(${participant.avatar})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: participant.isSpeaking ? '0 0 8px #22c55e' : 'none',
        }}
      />
      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
          <Volume2 size={8} className="text-white" />
        </div>
      )}
      {/* Muted Indicator */}
      {participant.isMuted && !participant.isSpeaking && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <MicOff size={8} className="text-white" />
        </div>
      )}
      {/* Voice Lifted Badge */}
      {participant.role === 'voice_lifted' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-[8px]">✨</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// VOICE LIFT MODAL
// ═══════════════════════════════════════

interface VoiceLiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLift: (duration: number) => void;
  targetUser: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  maxDuration: number;
}

export const VoiceLiftModal: React.FC<VoiceLiftModalProps> = ({
  isOpen,
  onClose,
  onLift,
  targetUser,
  maxDuration,
}) => {
  const [duration, setDuration] = React.useState(60);

  if (!isOpen) return null;

  const durations = [30, 60, 120, 180, 300].filter(d => d <= maxDuration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 p-6 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Hand size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Voice Lift</h3>
          <p className="text-gray-400 text-sm">
            Hole @{targetUser.username} auf die Bühne
          </p>
        </div>

        {/* User Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl mb-4">
          <div
            className="w-12 h-12 rounded-full bg-cover bg-center"
            style={{
              backgroundImage: targetUser.avatar
                ? `url(${targetUser.avatar})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <div>
            <p className="font-semibold text-white">@{targetUser.username}</p>
            <p className="text-sm text-gray-400">{targetUser.displayName}</p>
          </div>
        </div>

        {/* Duration Selection */}
        <p className="text-sm text-gray-400 mb-2">Wie lange?</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                duration === d
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {d < 60 ? `${d}s` : `${d / 60}m`}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onLift(duration)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Auf die Bühne! ✨
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// VOICE LIFT COUNTDOWN BANNER
// ═══════════════════════════════════════

interface VoiceLiftBannerProps {
  username: string;
  remainingSeconds: number;
  onEnd?: () => void;
}

export const VoiceLiftBanner: React.FC<VoiceLiftBannerProps> = ({
  username,
  remainingSeconds,
  onEnd,
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
            <Mic size={16} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Du bist auf der Bühne!
            </p>
            <p className="text-xs text-gray-400">
              Eingeladen von @{username}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-400">
            {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
          </p>
          <button
            onClick={onEnd}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Verlassen
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function getTierColor(tier: NebulaTier): string {
  const colors: Record<NebulaTier, string> = {
    nebula: '#8B5CF6',
    supernova: '#F59E0B',
    galaxy: '#EC4899',
    universe: '#06B6D4',
    founder: '#FFD700',
  };
  return colors[tier];
}

function getTierGlow(tier: NebulaTier): string {
  const glows: Record<NebulaTier, string> = {
    nebula: 'rgba(139, 92, 246, 0.5)',
    supernova: 'rgba(245, 158, 11, 0.5)',
    galaxy: 'rgba(236, 72, 153, 0.5)',
    universe: 'rgba(6, 182, 212, 0.5)',
    founder: 'rgba(255, 215, 0, 0.6)',
  };
  return glows[tier];
}

export default VIPCloud;
