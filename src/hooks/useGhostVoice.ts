/**
 * synclulu GHOST VOICE HOOK
 * ═══════════════════════════════════════════════════════════════
 * React Hook für einfache Voice-Integration in Komponenten
 *
 * USAGE:
 * const {
 *   isActive,
 *   isMuted,
 *   participants,
 *   startSession,
 *   stopSession,
 *   toggleMute
 * } = useGhostVoice();
 *
 * @author synclulu Engineering
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import GhostVoiceManager, {
  VoiceState,
  VoiceParticipant,
  getGhostVoice,
} from '@/lib/voice/GhostVoiceManager';

// ═══════════════════════════════════════
// HOOK RETURN TYPE
// ═══════════════════════════════════════

interface UseGhostVoiceReturn {
  // State
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  roomId: string | null;
  participants: VoiceParticipant[];
  currentSpeaker: VoiceParticipant | null;
  volume: number;
  error: string | null;

  // Actions
  startSession: (roomId: string, userId: string) => Promise<boolean>;
  stopSession: () => Promise<void>;
  toggleMute: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  setVolume: (volume: number) => void;

  // Helpers
  isParticipantSpeaking: (userId: string) => boolean;
  getParticipant: (userId: string) => VoiceParticipant | undefined;
}

// ═══════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════

export const useGhostVoice = (): UseGhostVoiceReturn => {
  const voiceManager = useMemo(() => getGhostVoice(), []);

  const [state, setState] = useState<VoiceState>(voiceManager.getState());

  // ═══════════════════════════════════════
  // SUBSCRIBE TO STATE CHANGES
  // ═══════════════════════════════════════

  useEffect(() => {
    const handleStateChange = (newState: VoiceState) => {
      setState(newState);
    };

    voiceManager.on('stateChanged', handleStateChange);

    // Initial state sync
    setState(voiceManager.getState());

    return () => {
      voiceManager.off('stateChanged', handleStateChange);
    };
  }, [voiceManager]);

  // ═══════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════

  const startSession = useCallback(
    async (roomId: string, userId: string) => {
      return voiceManager.startSession(roomId, userId);
    },
    [voiceManager]
  );

  const stopSession = useCallback(async () => {
    return voiceManager.stopSession();
  }, [voiceManager]);

  const toggleMute = useCallback(async () => {
    return voiceManager.toggleMute();
  }, [voiceManager]);

  const setMuted = useCallback(
    async (muted: boolean) => {
      return voiceManager.setMuted(muted);
    },
    [voiceManager]
  );

  const setVolume = useCallback(
    (volume: number) => {
      voiceManager.setVolume(volume);
    },
    [voiceManager]
  );

  // ═══════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════

  const isParticipantSpeaking = useCallback(
    (userId: string) => {
      return state.participants.find(p => p.id === userId)?.isSpeaking || false;
    },
    [state.participants]
  );

  const getParticipant = useCallback(
    (userId: string) => {
      return state.participants.find(p => p.id === userId);
    },
    [state.participants]
  );

  const currentSpeaker = useMemo(() => {
    if (!state.currentSpeaker) return null;
    return state.participants.find(p => p.id === state.currentSpeaker) || null;
  }, [state.currentSpeaker, state.participants]);

  // ═══════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════

  return {
    // State
    isActive: state.isActive,
    isConnecting: state.isConnecting,
    isMuted: state.isMuted,
    roomId: state.roomId,
    participants: state.participants,
    currentSpeaker,
    volume: state.volume,
    error: state.error,

    // Actions
    startSession,
    stopSession,
    toggleMute,
    setMuted,
    setVolume,

    // Helpers
    isParticipantSpeaking,
    getParticipant,
  };
};

// ═══════════════════════════════════════
// EVENT HOOKS (für spezifische Events)
// ═══════════════════════════════════════

export const useVoiceEvent = (
  event: string,
  callback: (...args: any[]) => void
) => {
  const voiceManager = useMemo(() => getGhostVoice(), []);

  useEffect(() => {
    voiceManager.on(event, callback);

    return () => {
      voiceManager.off(event, callback);
    };
  }, [voiceManager, event, callback]);
};

// ═══════════════════════════════════════
// PARTICIPANT SPEAKING HOOK
// ═══════════════════════════════════════

export const useParticipantSpeaking = (userId: string) => {
  const { isParticipantSpeaking } = useGhostVoice();
  return isParticipantSpeaking(userId);
};

export default useGhostVoice;
