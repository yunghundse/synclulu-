/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VOICE CHAT CONTROLLER v3.5
 * "Distance-Based Voice Mode UI"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Automatischer UI-Wechsel zwischen Live-Voice und Cloud-Memo.
 * Zeigt den aktuellen Modus an und schaltet die entsprechende Komponente ein.
 *
 * @version 3.5.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Cloud, MapPin, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import {
  useVoiceCommunicationMode,
  VoiceCommunicationMode,
  getVoiceModeInfo,
} from '@/hooks/useVoiceCommunicationMode';
import { GeoCoordinates } from '@/lib/elasticProximityEngine';
import VoiceMemoRecorder, { VoiceMemo } from './VoiceMemoRecorder';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface VoiceChatControllerProps {
  /** Current user's location */
  currentUserLocation: GeoCoordinates | null;
  /** ID of the user to communicate with */
  otherUserId: string;
  /** Display name of the other user */
  otherUserName?: string;
  /** Callback when voice memo is sent */
  onVoiceMemoSent?: (memo: VoiceMemo) => void;
  /** Callback for live voice start */
  onLiveVoiceStart?: () => void;
  /** Callback for live voice end */
  onLiveVoiceEnd?: () => void;
  /** Custom threshold in km (default: 5) */
  thresholdKm?: number;
  /** Compact mode for inline display */
  compact?: boolean;
}

// ═══════════════════════════════════════
// MODE INDICATOR COMPONENT
// ═══════════════════════════════════════

interface ModeIndicatorProps {
  mode: VoiceCommunicationMode;
  distanceLabel: string;
  isOtherUserOnline: boolean;
  compact?: boolean;
}

const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  mode,
  distanceLabel,
  isOtherUserOnline,
  compact = false,
}) => {
  const modeInfo = getVoiceModeInfo(mode);

  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    gray: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClasses[modeInfo.color]}`}>
        <span>{modeInfo.icon}</span>
        <span>{modeInfo.title}</span>
        <span className="opacity-60">({distanceLabel})</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border ${colorClasses[modeInfo.color]} theme-transition`}
    >
      <div className="flex items-start gap-3">
        {/* Mode Icon */}
        <div className="text-2xl">{modeInfo.icon}</div>

        {/* Mode Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{modeInfo.title}</h4>
            {/* Online Status */}
            <div className={`flex items-center gap-1 text-xs ${isOtherUserOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
              {isOtherUserOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOtherUserOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <p className="text-sm opacity-80 mt-1">{modeInfo.description}</p>

          {/* Distance Badge */}
          <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
            <MapPin size={12} />
            <span>Entfernung: {distanceLabel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// LIVE VOICE PLACEHOLDER
// (Wird später mit WebRTC implementiert)
// ═══════════════════════════════════════

interface LiveVoiceControlProps {
  onStart?: () => void;
  onEnd?: () => void;
  otherUserName?: string;
}

const LiveVoiceControl: React.FC<LiveVoiceControlProps> = ({
  onStart,
  onEnd,
  otherUserName = 'User',
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const handleToggle = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setIsPulsing(false);
      onEnd?.();
    } else {
      setIsActive(true);
      setIsPulsing(true);
      onStart?.();
    }
  }, [isActive, onStart, onEnd]);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Live Voice Button */}
      <motion.button
        onClick={handleToggle}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        {/* Pulse Animation when active */}
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-500"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            />
          </>
        )}

        {/* Main Button */}
        <div
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isActive
              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
              : 'bg-[var(--delulu-surface)] hover:bg-[var(--delulu-card)]'
            }
          `}
        >
          <Mic
            size={32}
            className={isActive ? 'text-white' : 'text-[var(--delulu-text)]'}
          />
        </div>
      </motion.button>

      {/* Status Text */}
      <div className="text-center">
        <p className={`text-sm font-medium ${isActive ? 'text-emerald-500' : 'text-[var(--delulu-text)]'}`}>
          {isActive ? 'Live mit ' + otherUserName : 'Tippe für Live-Voice'}
        </p>
        {isActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[var(--delulu-muted)] mt-1"
          >
            Tippe erneut zum Beenden
          </motion.p>
        )}
      </div>

      {/* WebRTC Hinweis */}
      {!isActive && (
        <p className="text-xs text-[var(--delulu-muted)] text-center max-w-xs">
          Live-Voice ermöglicht Echtzeit-Kommunikation wenn ihr nah beieinander seid
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN CONTROLLER COMPONENT
// ═══════════════════════════════════════

const VoiceChatController: React.FC<VoiceChatControllerProps> = ({
  currentUserLocation,
  otherUserId,
  otherUserName = 'User',
  onVoiceMemoSent,
  onLiveVoiceStart,
  onLiveVoiceEnd,
  thresholdKm = 5,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get voice communication mode based on distance
  const {
    mode,
    distanceKm,
    distanceLabel,
    isOtherUserOnline,
    isCalculating,
    error,
  } = useVoiceCommunicationMode(currentUserLocation, otherUserId, {
    thresholdKm,
  });

  // Handle voice memo sent
  const handleVoiceMemoSent = useCallback((memo: VoiceMemo) => {
    onVoiceMemoSent?.(memo);
  }, [onVoiceMemoSent]);

  // Loading state
  if (isCalculating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-[var(--delulu-muted)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <MapPin size={20} />
          </motion.div>
          <span className="text-sm">Standort wird ermittelt...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
        {error}
      </div>
    );
  }

  // Compact mode - just show indicator and minimal controls
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <ModeIndicator
          mode={mode}
          distanceLabel={distanceLabel}
          isOtherUserOnline={isOtherUserOnline}
          compact
        />
        {mode === 'cloud-memo' && (
          <VoiceMemoRecorder
            receiverId={otherUserId}
            onSend={handleVoiceMemoSent}
            distanceKm={distanceKm || undefined}
          />
        )}
      </div>
    );
  }

  // Full mode with expandable sections
  return (
    <div className="space-y-4 theme-transition">
      {/* Mode Indicator with Toggle */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <ModeIndicator
            mode={mode}
            distanceLabel={distanceLabel}
            isOtherUserOnline={isOtherUserOnline}
          />
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="p-2 text-[var(--delulu-muted)]"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      {/* Voice Control Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[var(--delulu-border)] bg-[var(--delulu-card)] overflow-hidden theme-transition">
              {/* Mode-specific content */}
              {mode === 'live' && (
                <LiveVoiceControl
                  onStart={onLiveVoiceStart}
                  onEnd={onLiveVoiceEnd}
                  otherUserName={otherUserName}
                />
              )}

              {mode === 'cloud-memo' && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Cloud size={18} className="text-violet-500" />
                    <span className="text-sm font-medium text-[var(--delulu-text)]">
                      Cloud-Memo an {otherUserName}
                    </span>
                  </div>
                  <VoiceMemoRecorder
                    receiverId={otherUserId}
                    onSend={handleVoiceMemoSent}
                    maxDuration={60}
                    distanceKm={distanceKm || undefined}
                  />
                </div>
              )}

              {mode === 'unavailable' && (
                <div className="p-8 text-center">
                  <MapPin size={32} className="mx-auto mb-3 text-[var(--delulu-muted)]" />
                  <p className="text-sm text-[var(--delulu-muted)]">
                    Standort nicht verfügbar. Aktiviere die Standortfreigabe.
                  </p>
                </div>
              )}
            </div>

            {/* Distance Threshold Info */}
            <p className="text-xs text-center text-[var(--delulu-muted)] mt-3">
              {mode === 'live' ? (
                <>✨ Ihr seid innerhalb von {thresholdKm}km - Live-Voice aktiviert!</>
              ) : mode === 'cloud-memo' ? (
                <>☁️ Mehr als {thresholdKm}km entfernt - Sprachnachrichten verfügbar</>
              ) : (
                <>Standort wird benötigt für Voice-Features</>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceChatController;
