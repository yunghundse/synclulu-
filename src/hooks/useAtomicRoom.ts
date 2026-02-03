/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE ATOMIC ROOM HOOK v16.0 - "Sovereign Stability" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * React hook wrapper for the atomic room controller.
 * Provides clean state management and UI helpers.
 *
 * @version 16.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  handleQuickEntry,
  handleSafeExit,
  isCurrentlyJoining,
  getJoinCooldownRemaining,
  resetJoinLock,
} from '../lib/atomicRoomController';
import { roomService } from '../lib/roomService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type RoomState =
  | 'idle'
  | 'joining'
  | 'connected'
  | 'leaving'
  | 'error'
  | 'cooldown';

interface UseAtomicRoomOptions {
  onJoinSuccess?: (roomId: string, roomName: string) => void;
  onJoinError?: (error: string) => void;
  onLeaveComplete?: () => void;
}

interface JoinRoomResult {
  success: boolean;
  roomId?: string;
  roomName?: string;
  error?: string;
}

interface UseAtomicRoomReturn {
  // State
  state: RoomState;
  currentRoomId: string | null;
  currentRoomName: string | null;
  error: string | null;
  cooldownRemaining: number;

  // Actions - joinRoom now returns room data directly
  joinRoom: (params: JoinParams) => Promise<JoinRoomResult>;
  leaveRoom: () => Promise<void>;
  resetError: () => void;

  // Status
  isInRoom: boolean;
  canJoin: boolean;
}

interface JoinParams {
  userId: string;
  username: string;
  displayName: string;
  level: number;
  isAnonymous?: boolean;
  latitude: number;
  longitude: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export function useAtomicRoom(options: UseAtomicRoomOptions = {}): UseAtomicRoomReturn {
  const { onJoinSuccess, onJoinError, onLeaveComplete } = options;

  // State
  const [state, setState] = useState<RoomState>('idle');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Refs
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Cooldown tracking
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    cooldownIntervalRef.current = setInterval(() => {
      const remaining = getJoinCooldownRemaining();
      setCooldownRemaining(remaining);

      if (remaining > 0 && state === 'idle') {
        setState('cooldown');
      } else if (remaining === 0 && state === 'cooldown') {
        setState('idle');
      }
    }, 200);

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Sync with roomService
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const checkRoomService = () => {
      const activeRoomId = roomService.getActiveRoomId();
      if (activeRoomId && !currentRoomId) {
        setCurrentRoomId(activeRoomId);
        setState('connected');
      } else if (!activeRoomId && currentRoomId) {
        setCurrentRoomId(null);
        setCurrentRoomName(null);
        setState('idle');
      }
    };

    // Check immediately
    checkRoomService();

    // Check periodically
    const interval = setInterval(checkRoomService, 1000);
    return () => clearInterval(interval);
  }, [currentRoomId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Join Room
  // ═══════════════════════════════════════════════════════════════════════════

  const joinRoom = useCallback(async (params: JoinParams): Promise<JoinRoomResult> => {
    if (state === 'joining' || isCurrentlyJoining()) {
      console.log('[useAtomicRoom] Already joining, ignoring request');
      return { success: false, error: 'Bereits am Beitreten' };
    }

    setState('joining');
    setError(null);

    const result = await handleQuickEntry({
      userId: params.userId,
      username: params.username,
      displayName: params.displayName,
      level: params.level,
      isAnonymous: params.isAnonymous ?? false,
      latitude: params.latitude,
      longitude: params.longitude,
    });

    if (result.success && result.roomId) {
      setCurrentRoomId(result.roomId);
      setCurrentRoomName(result.roomName || null);
      setState('connected');
      onJoinSuccess?.(result.roomId, result.roomName || 'Wölkchen');
      // Return the full result so caller can use roomId immediately
      return {
        success: true,
        roomId: result.roomId,
        roomName: result.roomName || 'Wölkchen'
      };
    } else {
      setError(result.error || 'Unbekannter Fehler');
      setState('error');
      onJoinError?.(result.error || 'Unbekannter Fehler');
      return { success: false, error: result.error || 'Unbekannter Fehler' };
    }
  }, [state, onJoinSuccess, onJoinError]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Leave Room
  // ═══════════════════════════════════════════════════════════════════════════

  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!currentRoomId) {
      console.log('[useAtomicRoom] No room to leave');
      return;
    }

    setState('leaving');

    // Get userId from roomService internal state
    const userId = (roomService as any).userId;
    if (userId) {
      await handleSafeExit(userId);
    } else {
      roomService.forceLeave();
    }

    setCurrentRoomId(null);
    setCurrentRoomName(null);
    setState('idle');
    onLeaveComplete?.();
  }, [currentRoomId, onLeaveComplete]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Reset Error
  // ═══════════════════════════════════════════════════════════════════════════

  const resetError = useCallback(() => {
    setError(null);
    if (state === 'error') {
      setState('idle');
    }
  }, [state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Computed values
  // ═══════════════════════════════════════════════════════════════════════════

  const isInRoom = state === 'connected' && currentRoomId !== null;
  const canJoin = state === 'idle' && cooldownRemaining === 0;

  return {
    state,
    currentRoomId,
    currentRoomName,
    error,
    cooldownRemaining,
    joinRoom,
    leaveRoom,
    resetError,
    isInRoom,
    canJoin,
  };
}

export default useAtomicRoom;
