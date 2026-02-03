import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

// Agora App ID - Du musst diesen in deinem Agora Dashboard erstellen
// https://console.agora.io/
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

// AFK Detection Configuration
export const AFK_CONFIG = {
  warningTimeMs: 120000,      // 2 minutes without speaking → warning
  kickTimeMs: 180000,         // 3 minutes total without speaking → kick
  speakingThreshold: 0.15,    // Audio level considered "speaking"
  checkIntervalMs: 5000,      // Check AFK every 5 seconds
};

// Convert string ID to numeric UID for Agora (Agora requires numeric UIDs)
const stringToNumericUid = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive number and limit to safe range
  return Math.abs(hash) % 1000000000;
};

interface VoiceChatUser {
  oderId: string;
  isSpeaking: boolean;
  isMuted: boolean;
  audioLevel: number;
}

interface UseVoiceChatProps {
  roomId: string;
  oderId: string;
  username: string;
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  onError?: (error: Error) => void;
  onAFKWarning?: () => void;
  onAFKKick?: () => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

interface UseVoiceChatReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  localAudioLevel: number;
  remoteUsers: Map<string, VoiceChatUser>;
  error: string | null;
  microphonePermission: 'granted' | 'denied' | 'prompt' | 'error';
  afkWarning: boolean;
  afkTimeRemaining: number;
  joinChannel: () => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  resetAFKTimer: () => void;
  dismissAFKWarning: () => void;
}

export const useVoiceChat = ({
  roomId,
  oderId,
  username,
  onUserJoined,
  onUserLeft,
  onError,
  onAFKWarning,
  onAFKKick,
  onSpeakingChange,
}: UseVoiceChatProps): UseVoiceChatReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMutedState] = useState(true);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState<Map<string, VoiceChatUser>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'error'>('prompt');
  const [afkWarning, setAfkWarning] = useState(false);
  const [afkTimeRemaining, setAfkTimeRemaining] = useState(0);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AFK Detection refs
  const lastSpeakingTimeRef = useRef<number>(Date.now());
  const afkCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Initialize Agora client
  useEffect(() => {
    if (!AGORA_APP_ID) {
      return;
    }

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Event listeners
    client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await client.subscribe(user, mediaType);
        user.audioTrack?.play();

        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(user.uid.toString(), {
            oderId: user.uid.toString(),
            isSpeaking: false,
            isMuted: false,
            audioLevel: 0,
          });
          return newMap;
        });

        onUserJoined?.(user);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(user.uid.toString());
          if (existing) {
            newMap.set(user.uid.toString(), { ...existing, isMuted: true, isSpeaking: false });
          }
          return newMap;
        });
      }
    });

    client.on('user-left', (user) => {
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(user.uid.toString());
        return newMap;
      });
      onUserLeft?.(user);
    });

    client.on('exception', (event) => {
      // Silent - don't spam console
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        clientRef.current.leave();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (afkCheckIntervalRef.current) {
        clearInterval(afkCheckIntervalRef.current);
      }
    };
  }, [onUserJoined, onUserLeft]);

  // Monitor audio levels and speaking detection
  const startAudioLevelMonitoring = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    audioLevelIntervalRef.current = setInterval(() => {
      // Local audio level
      if (localAudioTrackRef.current && !isMuted) {
        const level = localAudioTrackRef.current.getVolumeLevel();
        setLocalAudioLevel(level);

        // Detect speaking
        const wasSpeaking = isSpeakingRef.current;
        const isNowSpeaking = level > AFK_CONFIG.speakingThreshold;

        if (isNowSpeaking) {
          // User is speaking - reset AFK timer
          lastSpeakingTimeRef.current = Date.now();
          setAfkWarning(false);
          setAfkTimeRemaining(0);
        }

        if (isNowSpeaking !== wasSpeaking) {
          isSpeakingRef.current = isNowSpeaking;
          onSpeakingChange?.(isNowSpeaking);
        }
      } else {
        setLocalAudioLevel(0);
      }

      // Remote audio levels
      if (clientRef.current) {
        const remoteUsersList = clientRef.current.remoteUsers;
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          remoteUsersList.forEach(user => {
            const level = user.audioTrack?.getVolumeLevel() || 0;
            const existing = newMap.get(user.uid.toString());
            if (existing) {
              newMap.set(user.uid.toString(), {
                ...existing,
                audioLevel: level,
                isSpeaking: level > AFK_CONFIG.speakingThreshold,
              });
            }
          });
          return newMap;
        });
      }
    }, 100);
  }, [isMuted, onSpeakingChange]);

  // AFK Detection
  const startAFKDetection = useCallback(() => {
    if (afkCheckIntervalRef.current) {
      clearInterval(afkCheckIntervalRef.current);
    }

    lastSpeakingTimeRef.current = Date.now();

    afkCheckIntervalRef.current = setInterval(() => {
      // Only check AFK if user is unmuted (actively participating)
      if (isMuted) {
        setAfkWarning(false);
        setAfkTimeRemaining(0);
        return;
      }

      const timeSinceLastSpeak = Date.now() - lastSpeakingTimeRef.current;

      // Calculate time remaining until kick
      const timeUntilKick = Math.max(0, AFK_CONFIG.kickTimeMs - timeSinceLastSpeak);
      setAfkTimeRemaining(Math.ceil(timeUntilKick / 1000));

      // Warning phase (2 minutes without speaking)
      if (timeSinceLastSpeak >= AFK_CONFIG.warningTimeMs && timeSinceLastSpeak < AFK_CONFIG.kickTimeMs) {
        if (!afkWarning) {
          setAfkWarning(true);
          onAFKWarning?.();

          // Vibrate to get attention
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      }

      // Kick phase (3 minutes without speaking)
      if (timeSinceLastSpeak >= AFK_CONFIG.kickTimeMs) {
        onAFKKick?.();
        setAfkWarning(false);
      }
    }, AFK_CONFIG.checkIntervalMs);
  }, [isMuted, afkWarning, onAFKWarning, onAFKKick]);

  // Reset AFK timer (user confirmed they're still there)
  const resetAFKTimer = useCallback(() => {
    lastSpeakingTimeRef.current = Date.now();
    setAfkWarning(false);
    setAfkTimeRemaining(0);
  }, []);

  // Dismiss AFK warning (same as reset)
  const dismissAFKWarning = useCallback(() => {
    resetAFKTimer();
  }, [resetAFKTimer]);

  const joinChannel = useCallback(async () => {
    if (!AGORA_APP_ID) {
      setError('Voice Chat ist nicht konfiguriert. Bitte Agora App ID hinzufügen.');
      onError?.(new Error('Agora App ID not configured'));
      return;
    }

    if (!clientRef.current || isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Convert string ID to numeric UID for Agora
      const numericUid = stringToNumericUid(oderId);

      // Join the channel with null token (for testing - use token server in production)
      await clientRef.current.join(AGORA_APP_ID, roomId, null, numericUid);

      // Create and publish local audio track
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        setMicrophonePermission('granted');

        // Start muted
        audioTrack.setEnabled(false);
        await clientRef.current.publish([audioTrack]);

        setIsConnected(true);
        setIsMutedState(true);
        startAudioLevelMonitoring();
        startAFKDetection();

      } catch (micError: any) {
        // Handle microphone permission error specifically
        if (micError.code === 'PERMISSION_DENIED' ||
            micError.message?.includes('Permission denied') ||
            micError.message?.includes('NotAllowedError') ||
            micError.name === 'NotAllowedError') {
          setMicrophonePermission('denied');
          setError('Mikrofon deaktiviert - Bitte erlaube den Zugriff in deinen Browser-Einstellungen, um sprechen zu können.');
        } else if (micError.code === 'DEVICE_NOT_FOUND' ||
                   micError.message?.includes('NotFoundError') ||
                   micError.name === 'NotFoundError') {
          setMicrophonePermission('error');
          setError('Kein Mikrofon gefunden. Bitte schließe ein Mikrofon an.');
        } else {
          setMicrophonePermission('error');
          setError('Fehler beim Aktivieren des Mikrofons. Du kannst zuhören, aber nicht sprechen.');
        }

        // Still connect - user can listen but not speak
        setIsConnected(true);
        setIsMutedState(true);
        startAudioLevelMonitoring();
        // Don't start AFK detection if user can't speak
      }

    } catch (err: any) {
      setError(err.message || 'Fehler beim Beitreten zum Voice Chat');
      onError?.(err);
    } finally {
      setIsConnecting(false);
    }
  }, [roomId, oderId, isConnected, isConnecting, startAudioLevelMonitoring, startAFKDetection, onError]);

  const leaveChannel = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      // Stop monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      if (afkCheckIntervalRef.current) {
        clearInterval(afkCheckIntervalRef.current);
        afkCheckIntervalRef.current = null;
      }

      // Close local audio track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      // Leave channel
      await clientRef.current.leave();

      setIsConnected(false);
      setIsMutedState(true);
      setLocalAudioLevel(0);
      setRemoteUsers(new Map());
      setAfkWarning(false);
      setAfkTimeRemaining(0);
      setError(null);

    } catch (err: any) {
      // Silent fail on leave
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!localAudioTrackRef.current) {
      // User doesn't have microphone access
      if (microphonePermission === 'denied') {
        setError('Mikrofon ist deaktiviert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.');
      }
      return;
    }

    const newMutedState = !isMuted;
    localAudioTrackRef.current.setEnabled(!newMutedState);
    setIsMutedState(newMutedState);

    // Reset AFK timer when unmuting
    if (!newMutedState) {
      resetAFKTimer();
    }

  }, [isMuted, microphonePermission, resetAFKTimer]);

  const setMuted = useCallback(async (muted: boolean) => {
    if (!localAudioTrackRef.current) return;

    localAudioTrackRef.current.setEnabled(!muted);
    setIsMutedState(muted);

    // Reset AFK timer when unmuting
    if (!muted) {
      resetAFKTimer();
    }
  }, [resetAFKTimer]);

  // Update AFK detection when mute state changes
  useEffect(() => {
    if (isConnected) {
      startAFKDetection();
    }
  }, [isMuted, isConnected, startAFKDetection]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    localAudioLevel,
    remoteUsers,
    error,
    microphonePermission,
    afkWarning,
    afkTimeRemaining,
    joinChannel,
    leaveChannel,
    toggleMute,
    setMuted,
    resetAFKTimer,
    dismissAFKWarning,
  };
};

export default useVoiceChat;
