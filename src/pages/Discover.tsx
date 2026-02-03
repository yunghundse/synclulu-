import { useState, useEffect, useCallback } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  Mic, MicOff, Users, MapPin, Zap, EyeOff,
  UserPlus, ThumbsDown, AlertTriangle, Volume2, VolumeX,
  Clock, RefreshCw, Globe, Lock, Sparkles, Crown, Hand,
  Loader2, Plus, Compass, Wifi, WifiOff, Cloud, MicOff as MicOffIcon
} from 'lucide-react';
import { NebulaBadge, VIPAura } from '@/components/NebulaBadge';
import { SailorMascot, PegasusMascot, FloatingMascot } from '@/components/Mascots';
// v16.0 Stable Grid Room - replaces LiquidRoomExperience
import { StableGridRoom, type GridParticipant } from '@/components/StableGridRoom';
import { collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion, Timestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UI_COPY } from '@/lib/uiCopy';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useSounds } from '@/hooks/useSounds';
import type { StarEvent } from '@/types';
// Robust Room Service for connection management
import { useRoomService, roomService, isFounder } from '@/lib/roomService';
// v16.0 Atomic Room Controller - prevents loops with single atomic operation
import { useAtomicRoom } from '@/hooks/useAtomicRoom';
// Debounced location for stable tracking
import { useDebouncedLocation } from '@/hooks/useDebouncedLocation';
// Quick Entry Button with loading animation
import { QuickEntryButton, QuickEntryCompact } from '@/components/QuickEntryButton';

// Types
interface VoiceRoom {
  id: string;
  name: string;
  type: 'private' | 'public' | 'regional';
  isAnonymous: boolean;
  participants: RoomParticipant[];
  maxParticipants: number;
  xpMultiplier: number;
  regionName?: string;
  createdAt: Date;
  createdBy: string;
}

interface RoomParticipant {
  id: string;
  oderId: string;
  username: string;
  displayName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isAnonymous: boolean;
  level: number;
  joinedAt: Date;
}

const Discover = () => {
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { user } = useStore();

  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [starEvents, setStarEvents] = useState<StarEvent[]>([]);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [muteCountdown, setMuteCountdown] = useState(0);
  const [showVoteModal, setShowVoteModal] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'stars' | 'public' | 'anonymous' | 'regional'>('all');

  // New room form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomAnonymous, setNewRoomAnonymous] = useState(false);

  // AFK Warning Modal state
  const [showAFKModal, setShowAFKModal] = useState(false);
  const [shouldLeaveRoom, setShouldLeaveRoom] = useState(false);

  // Track previous participant count for sound effects
  const [prevParticipantCount, setPrevParticipantCount] = useState(0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // ROBUST ROOM SERVICE HOOK - Handles all connection & cleanup logic
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    joinRoom: roomServiceJoin,
    leaveRoom: roomServiceLeave,
    updateState: roomServiceUpdateState,
    isJoining: isRoomServiceJoining,
    isLeaving: isRoomServiceLeaving,
    error: roomServiceError,
  } = useRoomService(user?.id || null);

  // ═══════════════════════════════════════════════════════════════════════════════
  // v16.0 ATOMIC ROOM HOOK - Single atomic operation prevents all loops
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    state: atomicRoomState,
    currentRoomId: atomicRoomId,
    currentRoomName: atomicRoomName,
    error: atomicRoomError,
    cooldownRemaining,
    joinRoom: atomicJoinRoom,
    leaveRoom: atomicLeaveRoom,
    resetError: resetAtomicError,
    isInRoom: isAtomicInRoom,
    canJoin: canAtomicJoin,
  } = useAtomicRoom({
    onJoinSuccess: (roomId, roomName) => {
      console.log('[Discover] ✅ Atomic join success:', roomId, roomName);
      playJoinSound();
    },
    onJoinError: (error) => {
      console.error('[Discover] ❌ Atomic join error:', error);
    },
    onLeaveComplete: () => {
      console.log('[Discover] 🚪 Left room');
      playLeaveSound();
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // v16.0 DEBOUNCED LOCATION - Prevents location-triggered loops
  // ═══════════════════════════════════════════════════════════════════════════════
  const {
    location: debouncedLocation,
    isAcquiring: isLocationAcquiring,
    error: locationError,
    distanceSinceLastUpdate,
    cooldownRemaining: locationCooldown,
  } = useDebouncedLocation({
    enabled: !isAtomicInRoom, // Only track when not in a room
    movementThreshold: 50, // 50m minimum movement
    debounceMs: 5000, // 5 second debounce
  });

  // Sounds Hook
  const { playJoinSound, playLeaveSound, playWarningSound, playMuteSound } = useSounds();

  // XP System Hook
  const isPremium = (user as any)?.isPremium || false;
  const {
    startVoiceXPTick,
    stopVoiceXPTick,
    updateSpeakingStatus,
  } = useXPSystem({
    userId: user?.id,
    isPremium,
    onLevelUp: (newLevel) => {
      // Could show a level up animation
    },
  });

  // Voice Chat Hook - Real audio with Agora
  const {
    isConnected: isVoiceConnected,
    isConnecting: isVoiceConnecting,
    isMuted: isVoiceMuted,
    localAudioLevel,
    remoteUsers: voiceRemoteUsers,
    error: voiceError,
    microphonePermission,
    afkWarning,
    afkTimeRemaining,
    joinChannel: joinVoiceChannel,
    leaveChannel: leaveVoiceChannel,
    toggleMute: toggleVoiceMute,
    resetAFKTimer,
    dismissAFKWarning,
  } = useVoiceChat({
    roomId: activeRoom?.id || '',
    oderId: user?.id || '',
    username: user?.username || '',
    onError: (error) => {
      // Silent - errors are shown in UI
    },
    onAFKWarning: () => {
      setShowAFKModal(true);
      playWarningSound();
    },
    onAFKKick: () => {
      // Trigger leave via state (handleLeaveRoom defined later)
      setShouldLeaveRoom(true);
    },
    onSpeakingChange: (isSpeaking) => {
      updateSpeakingStatus(isSpeaking);
    },
  });

  // Start XP tick when joining voice chat, stop when leaving
  useEffect(() => {
    if (isVoiceConnected && activeRoom) {
      startVoiceXPTick();
    } else {
      stopVoiceXPTick();
    }
  }, [isVoiceConnected, activeRoom, startVoiceXPTick, stopVoiceXPTick]);

  // Fetch real rooms from Firebase (simplified query - no index required)
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    // Simple query without compound index requirement
    const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
      const loadedRooms: VoiceRoom[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter active rooms client-side
        if (data.isActive !== false) {
          loadedRooms.push({
            id: docSnap.id,
            name: data.name,
            type: data.type || 'public',
            isAnonymous: data.isAnonymous || false,
            participants: (data.participants || []).map((p: any) => ({
              id: p.oderId || p.id,
              oderId: p.oderId || p.id,
              username: p.username || 'unknown',
              displayName: p.displayName || 'Unbekannt',
              isSpeaking: p.isSpeaking || false,
              isMuted: p.isMuted || false,
              isAnonymous: p.isAnonymous || false,
              level: p.level || 1,
              joinedAt: p.joinedAt?.toDate() || new Date(),
            })),
            maxParticipants: data.maxParticipants || 8,
            xpMultiplier: data.xpMultiplier || 1,
            regionName: data.regionName,
            createdAt: data.createdAt?.toDate() || new Date(),
            createdBy: data.createdBy,
          });
        }
      });

      // Sort client-side by createdAt desc
      loadedRooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setRooms(loadedRooms);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching rooms:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch real star events from Firebase (simplified query)
  useEffect(() => {
    const eventsRef = collection(db, 'starEvents');
    // Simple query without compound index requirement
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const loadedEvents: StarEvent[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter active events client-side
        if (data.isActive !== false) {
          loadedEvents.push({
            id: docSnap.id,
            hostId: data.hostId,
            hostUsername: data.hostUsername,
            hostDisplayName: data.hostDisplayName,
            hostTier: data.hostTier || 'nova',
            title: data.title,
            description: data.description,
            category: data.category || 'general',
            startedAt: data.startedAt?.toDate(),
            scheduledAt: data.scheduledAt?.toDate(),
            endedAt: data.endedAt?.toDate(),
            maxCapacity: data.maxCapacity || 100,
            currentListeners: data.currentListeners || 0,
            peakListeners: data.peakListeners || 0,
            stageParticipants: data.stageParticipants || [],
            handRaiseQueue: data.handRaiseQueue || [],
            starsReceived: data.starsReceived || 0,
            chatMessages: data.chatMessages || 0,
            isPublic: data.isPublic !== false,
            isRecording: data.isRecording || false,
            isPinned: data.isPinned || false,
            xpMultiplier: data.xpMultiplier || 2,
          });
        }
      });

      // Sort client-side by startedAt desc
      loadedEvents.sort((a, b) => {
        const aTime = a.startedAt?.getTime() || 0;
        const bTime = b.startedAt?.getTime() || 0;
        return bTime - aTime;
      });

      setStarEvents(loadedEvents);
    }, (error) => {
      console.error('Error fetching star events:', error);
    });

    return () => unsubscribe();
  }, []);

  // Listen to active room updates in real-time
  useEffect(() => {
    if (!activeRoom) return;

    const roomRef = doc(db, 'rooms', activeRoom.id);
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Check if room is still active
        if (!data.isActive) {
          setActiveRoom(null);
          setIsMuted(true);
          setMuteCountdown(0);
          return;
        }

        const participants = (data.participants || []).map((p: any) => ({
          id: p.oderId || p.id,
          oderId: p.oderId || p.id,
          username: p.username || 'unknown',
          displayName: p.displayName || 'Unbekannt',
          isSpeaking: p.isSpeaking || false,
          isMuted: p.isMuted || false,
          isAnonymous: p.isAnonymous || false,
          level: p.level || 1,
          joinedAt: p.joinedAt?.toDate() || new Date(),
        }));

        // Check for duplicates - roomService handles this via transactions
        // but we add extra safety here
        if (user?.id) {
          const myEntries = participants.filter((p: any) => p.oderId === user.id);
          if (myEntries.length > 1) {
            // Duplicate detected! RoomService should have prevented this
            // but if it happens, trigger cleanup
            console.warn('[Discover] Duplicate participant detected - triggering cleanup');
            roomService.cleanupStaleParticipants(activeRoom.id);
          }
        }

        // Play sounds for participant changes (not for our own joins)
        const newCount = participants.length;
        const oldCount = prevParticipantCount;

        if (oldCount > 0 && newCount !== oldCount) {
          // Check if it's not us joining/leaving
          const myId = user?.id;
          const wasIInOldRoom = activeRoom.participants.some(p => p.oderId === myId);
          const amIInNewRoom = participants.some((p: any) => p.oderId === myId);

          if (wasIInOldRoom && amIInNewRoom) {
            // Someone else joined or left
            if (newCount > oldCount) {
              playJoinSound();
            } else if (newCount < oldCount) {
              playLeaveSound();
            }
          }
        }

        setPrevParticipantCount(newCount);

        // Update active room with latest data
        setActiveRoom({
          id: docSnap.id,
          name: data.name,
          type: data.type || 'public',
          isAnonymous: data.isAnonymous || false,
          participants,
          maxParticipants: data.maxParticipants || 8,
          xpMultiplier: data.xpMultiplier || 1,
          regionName: data.regionName,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
        });
      } else {
        // Room was deleted
        setActiveRoom(null);
        setIsMuted(true);
        setMuteCountdown(0);
      }
    });

    return () => unsubscribe();
  }, [activeRoom?.id]);

  // Check if we should default to stars filter
  useEffect(() => {
    const state = routerLocation.state as { filter?: string } | null;
    if (state?.filter === 'stars') {
      setFilter('stars');
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);

  // Check if we came from Home with joinRoom intent
  useEffect(() => {
    const state = routerLocation.state as { joinRoom?: boolean; mode?: string } | null;
    if (state?.joinRoom) {
      // Auto-join a random room
      const availableRooms = rooms.filter(r => r.participants.length < r.maxParticipants);
      if (availableRooms.length > 0) {
        const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        handleJoinRoom(randomRoom, state.mode === 'anonymous');
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state, rooms]);

  // Mute countdown timer
  useEffect(() => {
    if (muteCountdown > 0) {
      const timer = setTimeout(() => {
        setMuteCountdown(muteCountdown - 1);
        if (muteCountdown === 1) {
          setIsMuted(false);
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [muteCountdown]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * JOIN ROOM - Using Robust RoomService with Transaction Support
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * This now uses the roomService which provides:
   * - Transaction-based joining (prevents race conditions)
   * - Automatic duplicate cleanup
   * - Proper anonymous mode support
   * - Heartbeat mechanism for connection tracking
   * - Automatic cleanup when all participants leave
   */
  const handleJoinRoom = async (room: VoiceRoom, asAnonymous: boolean = false) => {
    if (!user?.id || isRoomServiceJoining) return;

    // If already in a room, leave it first using roomService
    if (activeRoom) {
      await handleLeaveRoom();
    }

    try {
      // Use robust roomService for joining
      const result = await roomServiceJoin({
        roomId: room.id,
        username: user.username || 'unknown',
        displayName: user.displayName || 'Unbekannt',
        level: (user as any).level || 1,
        isAnonymous: asAnonymous || room.isAnonymous,
      });

      if (!result.success) {
        console.error('[Discover] Failed to join room:', result.error);
        return;
      }

      // v16.1 FIX: Fetch fresh room data AFTER joining to ensure we have the updated participants list
      // The `room` object we received has OLD participant data (before we joined)
      const roomRef = doc(db, 'rooms', room.id);
      const freshRoomSnap = await getDoc(roomRef);

      if (freshRoomSnap.exists()) {
        const freshData = freshRoomSnap.data();
        const freshParticipants = (freshData.participants || []).map((p: any) => ({
          id: p.oderId || p.id,
          oderId: p.oderId || p.id,
          username: p.username || 'unknown',
          displayName: p.displayName || 'Unbekannt',
          isSpeaking: p.isSpeaking || false,
          isMuted: p.isMuted || true,
          isAnonymous: p.isAnonymous || false,
          level: p.level || 1,
          joinedAt: p.joinedAt?.toDate() || new Date(),
        }));

        // Set initial participant count for sound detection
        setPrevParticipantCount(freshParticipants.length);

        // Set active room with FRESH data (including us as participant)
        setActiveRoom({
          id: room.id,
          name: freshData.name || room.name,
          type: freshData.type || room.type,
          isAnonymous: freshData.isAnonymous || room.isAnonymous,
          participants: freshParticipants,
          maxParticipants: freshData.maxParticipants || room.maxParticipants,
          xpMultiplier: freshData.xpMultiplier || room.xpMultiplier,
          regionName: freshData.regionName || room.regionName,
          createdAt: freshData.createdAt?.toDate() || room.createdAt,
          createdBy: freshData.createdBy || room.createdBy,
        });
      } else {
        // Fallback: Room was deleted? Use old data
        console.warn('[Discover] Room not found after join, using stale data');
        setPrevParticipantCount(room.participants.length + 1);
        setActiveRoom(room);
      }

      setIsMuted(true);
      setMuteCountdown(4); // 4 second mute delay

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]);
      }

      console.log('[Discover] ✅ Successfully joined room:', room.id, asAnonymous ? '(anonymous)' : '');
    } catch (error) {
      console.error('[Discover] Error joining room:', error);
    }
  };

  // Auto-join voice channel when room is set
  useEffect(() => {
    if (activeRoom && user?.id && !isVoiceConnected && !isVoiceConnecting) {
      joinVoiceChannel();
    }
  }, [activeRoom?.id, user?.id]);

  // Note: Auto-leave handling is done via beforeunload event in roomService
  // We removed the problematic sync effect that was causing issues

  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * LEAVE ROOM - Using Robust RoomService with Transaction Support
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * This now uses the roomService which provides:
   * - Transaction-based leaving (prevents race conditions)
   * - Automatic room deletion when last participant leaves
   * - Proper cleanup for both regular and anonymous users
   * - Handles edge cases like network issues
   */
  const handleLeaveRoom = async () => {
    // Leave voice channel first
    await leaveVoiceChannel();

    if (!activeRoom || !user?.id) {
      setActiveRoom(null);
      setIsMuted(true);
      setMuteCountdown(0);
      return;
    }

    try {
      // Use robust roomService for leaving
      // This handles all cleanup including room deletion if empty
      await roomServiceLeave(activeRoom.id);
      console.log('[Discover] ✅ Successfully left room:', activeRoom.id);
    } catch (error) {
      console.error('[Discover] Error leaving room:', error);
    }

    setActiveRoom(null);
    setIsMuted(true);
    setMuteCountdown(0);
    setShouldLeaveRoom(false);
  };

  // Effect to handle AFK kick (triggered via state since handleLeaveRoom is defined after hook)
  useEffect(() => {
    if (shouldLeaveRoom) {
      handleLeaveRoom();
    }
  }, [shouldLeaveRoom]);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * CREATE ROOM - Fixed to include creator as first participant
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user?.id) {
      setCreateError('Bitte gib einen Namen ein');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // ✅ FIX: Include creator as first participant
      const creatorParticipant = {
        oderId: user.id,
        username: user.username || 'unknown',
        displayName: newRoomAnonymous ? 'Wanderer' : (user.displayName || 'Unbekannt'),
        isSpeaking: false,
        isMuted: true,
        isAnonymous: newRoomAnonymous,
        level: (user as any).level || 1,
        joinedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        connectionState: 'connected',
      };

      const roomData = {
        name: newRoomName.trim(),
        type: newRoomType,
        isAnonymous: newRoomAnonymous,
        participants: [creatorParticipant], // ✅ Creator is now included!
        maxParticipants: 8,
        xpMultiplier: 1,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user.id,
      };

      console.log('[Discover] Creating room with creator as participant:', roomData);
      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      console.log('[Discover] ✅ Room created with ID:', docRef.id);

      // ✅ FIX: Auto-join the created room
      const createdRoom: VoiceRoom = {
        id: docRef.id,
        name: roomData.name,
        type: roomData.type as 'public' | 'private' | 'regional',
        isAnonymous: roomData.isAnonymous,
        participants: [{
          id: user.id,
          oderId: user.id,
          username: creatorParticipant.username,
          displayName: creatorParticipant.displayName,
          isSpeaking: false,
          isMuted: true,
          isAnonymous: newRoomAnonymous,
          level: creatorParticipant.level,
          joinedAt: new Date(),
        }],
        maxParticipants: 8,
        xpMultiplier: 1,
        createdAt: new Date(),
        createdBy: user.id,
      };

      // Set room as active immediately
      setActiveRoom(createdRoom);
      setIsMuted(true);
      setMuteCountdown(4);
      setPrevParticipantCount(1);

      // Update roomService state manually
      roomService.setActiveRoom(docRef.id, user.id);

      // Close modal and reset form
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomType('public');
      setNewRoomAnonymous(false);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20, 10, 20]);
      }

      console.log('[Discover] ✅ Now active in created room:', docRef.id);
    } catch (error: any) {
      console.error('[Discover] ❌ Error creating room:', error);
      setCreateError(error.message || 'Fehler beim Erstellen des Wölkchens');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * TOGGLE MUTE - Using RoomService for State Updates
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  const handleToggleMute = async () => {
    if (muteCountdown > 0 || !activeRoom || !user?.id) return;

    // Toggle voice chat mute
    await toggleVoiceMute();

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Play mute/unmute sound
    playMuteSound(newMutedState);

    // Update mute status using roomService (transaction-safe)
    try {
      await roomServiceUpdateState(activeRoom.id, {
        isMuted: newMutedState,
        isSpeaking: !newMutedState, // If unmuted, they're speaking
      });
    } catch (error) {
      console.error('[Discover] Error updating mute status:', error);
    }
  };

  const handleVoteKick = (participantId: string) => {
    console.log('Vote to remove:', participantId);
    setShowVoteModal(null);
    // TODO: Implement voting logic
  };

  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   * v16.0 QUICK ENTRY - Atomic Handshake mit AtomicRoom Hook
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * SOVEREIGN STABILITY:
   * - Single atomic get_or_create operation
   * - Global isJoining lock prevents all loops
   * - 2-second cooldown between attempts
   * - No separate "search" and "create" calls
   */
  const handleQuickEntry = async (asAnonymous: boolean = false) => {
    if (!user?.id) return;

    // Check if we can join (not already joining, not in cooldown)
    if (!canAtomicJoin) {
      console.log('[Discover] ⛔ Cannot join - state:', atomicRoomState, 'cooldown:', cooldownRemaining);
      return;
    }

    // If already in a room, leave first
    if (activeRoom) {
      await handleLeaveRoom();
    }

    // Get location (use debounced location or fallback)
    const lat = debouncedLocation?.latitude || 52.52; // Berlin fallback
    const lon = debouncedLocation?.longitude || 13.405;

    console.log('[Discover] 🚀 Starting atomic quick entry at:', lat.toFixed(4), lon.toFixed(4));

    try {
      // v16.1 FIX: Use result directly instead of hook state (which may not be updated yet)
      const result = await atomicJoinRoom({
        userId: user.id,
        username: user.username || 'unknown',
        displayName: user.displayName || 'Unbekannt',
        level: (user as any).level || 1,
        isAnonymous: asAnonymous,
        latitude: lat,
        longitude: lon,
      });

      // Use roomId from result directly - NOT from atomicRoomId hook state!
      if (result.success && result.roomId) {
        // Fetch the room data and set it as active
        const roomRef = doc(db, 'rooms', result.roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const data = roomSnap.data();
          const participants = (data.participants || []).map((p: any) => ({
            id: p.oderId || p.id,
            oderId: p.oderId || p.id,
            username: p.username || 'unknown',
            displayName: p.displayName || 'Unbekannt',
            isSpeaking: p.isSpeaking || false,
            isMuted: p.isMuted || true,
            isAnonymous: p.isAnonymous || false,
            level: p.level || 1,
            joinedAt: p.joinedAt?.toDate() || new Date(),
          }));

          setPrevParticipantCount(participants.length);
          setActiveRoom({
            id: result.roomId,
            name: data.name || result.roomName || 'Wölkchen',
            type: data.type || 'public',
            isAnonymous: data.isAnonymous || asAnonymous,
            participants,
            maxParticipants: data.maxParticipants || 8,
            xpMultiplier: data.xpMultiplier || 1,
            regionName: data.regionName,
            createdAt: data.createdAt?.toDate() || new Date(),
            createdBy: data.createdBy,
          });
          setIsMuted(true);
          setMuteCountdown(4);

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([20, 10, 20]);
          }

          console.log('[Discover] ✅ Atomic Quick Entry complete:', result.roomId);
        }
      } else {
        console.error('[Discover] ❌ Atomic join failed:', result.error);
      }
    } catch (error) {
      console.error('[Discover] Atomic Quick Entry error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === 'all' || filter === 'stars') return true;
    if (filter === 'public') return room.type === 'public' && !room.isAnonymous;
    if (filter === 'anonymous') return room.isAnonymous;
    if (filter === 'regional') return room.type === 'regional';
    return true;
  });

  const formatDuration = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const liveStarEvents = starEvents.filter(e => e.startedAt && !e.endedAt);
  const totalUsersInRooms = rooms.reduce((acc, r) => acc + r.participants.length, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-delulu-violet mx-auto mb-4" />
          <p className="text-delulu-muted text-sm">Lade Wölkchen...</p>
        </div>
      </div>
    );
  }

  // v16.0 Convert local participants to StableGridRoom format
  const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';
  const gridParticipants: GridParticipant[] = activeRoom?.participants.map((p) => ({
    id: p.oderId || p.id,
    displayName: p.isAnonymous ? 'Wanderer' : p.displayName,
    username: p.username,
    avatarUrl: null, // TODO: Add avatar URL from user profile
    isSpeaking: p.isSpeaking,
    isMuted: p.isMuted,
    isHost: activeRoom?.createdBy === p.oderId,
    isPremium: false, // TODO: Get from user profile
    isFounder: (p.oderId || p.id) === FOUNDER_UID,
    isGhost: false, // TODO: Get from participant data
    level: p.level,
    audioLevel: p.isSpeaking ? 0.5 + Math.random() * 0.5 : 0, // Simulate audio level
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white safe-top pb-24">
      {/* Active Room View - v16.0 Stable Grid Room (WhatsApp/Discord style) */}
      {activeRoom ? (
        <StableGridRoom
          roomId={activeRoom.id}
          roomName={activeRoom.name}
          participants={gridParticipants}
          currentUserId={user?.id || ''}
          onLeave={handleLeaveRoom}
          onMuteToggle={handleToggleMute}
          onKickUser={user?.id === FOUNDER_UID ? async (userId) => {
            // Founder can kick users
            console.log('[Discover] 👑 Founder kicking user:', userId);
            // TODO: Implement kick logic
          } : undefined}
          onMuteUser={user?.id === FOUNDER_UID ? async (userId) => {
            // Founder can mute users
            console.log('[Discover] 👑 Founder muting user:', userId);
            // TODO: Implement remote mute logic
          } : undefined}
          onSendFriendRequest={(userId) => {
            // Navigate to user profile or send friend request
            navigate(`/user/${userId}`);
          }}
          isMuted={isMuted}
        />
      ) : (
        /* Room List View */
        <>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-delulu-text">
                  Entdecken
                </h1>
                <p className="text-sm text-delulu-muted">
                  {totalUsersInRooms > 0
                    ? `${totalUsersInRooms} User in ${rooms.length} Wölkchen`
                    : 'Noch keine aktiven Wölkchen'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-10 h-10 rounded-xl bg-delulu-violet text-white shadow-sm flex items-center justify-center hover:bg-delulu-violet/90 transition-colors"
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-delulu-muted hover:text-delulu-violet transition-colors"
                >
                  <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {[
                { id: 'all', label: 'Alle', icon: Users },
                { id: 'stars', label: 'Stars', icon: Sparkles, special: true },
                { id: 'public', label: 'Öffentlich', icon: Globe },
                { id: 'anonymous', label: 'Anonym', icon: EyeOff },
                { id: 'regional', label: 'Regional', icon: MapPin },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as typeof filter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === f.id
                      ? f.special
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-delulu-violet text-white shadow-lg'
                      : f.special
                        ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        : 'bg-white text-delulu-muted hover:bg-gray-50'
                  }`}
                >
                  <f.icon size={16} />
                  {f.label}
                  {f.special && liveStarEvents.length > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Star Events Section - Only show if there are any */}
          {(filter === 'all' || filter === 'stars') && starEvents.length > 0 && (
            <div className="px-6 mb-6">
              {filter === 'all' && (
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-delulu-text flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-500" />
                    Star Events
                  </h2>
                  <button
                    onClick={() => setFilter('stars')}
                    className="text-sm text-purple-500 font-medium"
                  >
                    Alle anzeigen
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {starEvents.map((event) => {
                  const isLive = !!event.startedAt && !event.endedAt;
                  const isScheduled = !!event.scheduledAt && !event.startedAt;

                  return (
                    <div key={event.id} className="relative">
                      <VIPAura tier={event.hostTier} intensity="normal">
                        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl p-4 border border-purple-500/30">
                          {/* Live/Scheduled Badge */}
                          <div className="flex items-center justify-between mb-3">
                            {isLive ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
                                <div className="relative">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute" />
                                  <div className="w-2 h-2 bg-red-500 rounded-full relative" />
                                </div>
                                <span className="text-[10px] font-bold text-red-400">LIVE</span>
                              </div>
                            ) : isScheduled ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 rounded-full">
                                <Clock size={12} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-400">
                                  {new Date(event.scheduledAt!).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : null}

                            {event.xpMultiplier > 1 && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
                                <Zap size={12} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400">{event.xpMultiplier}x XP</span>
                              </div>
                            )}
                          </div>

                          {/* Host Info */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="relative">
                              <div
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2"
                                style={{
                                  borderColor: event.hostTier === 'galaxy' ? '#EC4899' : '#F59E0B',
                                  boxShadow: `0 0 20px ${event.hostTier === 'galaxy' ? 'rgba(236, 72, 153, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1">
                                <NebulaBadge tier={event.hostTier} size="md" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">@{event.hostUsername}</h3>
                              </div>
                              <p className="text-sm text-gray-400">{event.hostDisplayName}</p>
                            </div>
                          </div>

                          {/* Event Title */}
                          <h4 className="font-semibold text-white mb-2">{event.title}</h4>
                          <p className="text-sm text-gray-400 mb-3">{event.description}</p>

                          {/* Stats */}
                          {isLive && (
                            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {event.currentListeners.toLocaleString()} zuhören
                              </span>
                              <span className="flex items-center gap-1 text-amber-400">
                                <Crown size={14} />
                                {event.starsReceived} Sterne
                              </span>
                              {event.handRaiseQueue.length > 0 && (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <Hand size={14} />
                                  {event.handRaiseQueue.length} warten
                                </span>
                              )}
                            </div>
                          )}

                          {/* Join Button */}
                          <button
                            onClick={() => console.log('Join star event:', event.id)}
                            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                              isLive
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {isLive ? (
                              <>
                                <Mic size={18} />
                                Jetzt reinhören
                              </>
                            ) : (
                              <>
                                <Clock size={18} />
                                Erinnerung setzen
                              </>
                            )}
                          </button>
                        </div>
                      </VIPAura>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State for Stars */}
          {filter === 'stars' && starEvents.length === 0 && (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Sparkles size={32} className="text-purple-400" />
                </div>
                <h3 className="font-semibold text-delulu-text mb-2">
                  Keine Star Events
                </h3>
                <p className="text-sm text-delulu-muted max-w-xs mx-auto">
                  Aktuell sind keine Star Events live oder geplant. Schau später nochmal vorbei!
                </p>
              </div>
            </div>
          )}

          {/* Regional XP Banner - only show if there are rooms */}
          {filter !== 'stars' && rooms.length > 0 && (
            <div className="px-6 mb-4">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Regional-Bonus aktiv!</p>
                    <p className="text-sm text-white/80">
                      Bis zu 3x XP in bestimmten Zonen - geh raus und entdecke!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Room List */}
          {filter !== 'stars' && (
          <div className="px-6 space-y-4">
            {/* Complete empty state - no rooms at all */}
            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <FloatingMascot delay={0}>
                  <SailorMascot size={140} className="mx-auto mb-4" />
                </FloatingMascot>
                <h3 className="font-display font-bold text-xl text-delulu-text mb-3">
                  {UI_COPY.empty.lounges}
                </h3>
                <p className="text-sm text-delulu-muted mb-8 max-w-xs mx-auto leading-relaxed">
                  Sei der Erste und erstelle ein Wölkchen, in dem sich deine Nachbarschaft treffen kann!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-delulu-violet to-purple-600 text-white rounded-2xl font-display font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={20} />
                  Wölkchen erstellen
                </button>
              </div>
            ) : filteredRooms.length === 0 ? (
              /* Filter has no results */
              <div className="text-center py-12">
                <FloatingMascot delay={0.2}>
                  <PegasusMascot size={120} className="mx-auto mb-2" />
                </FloatingMascot>
                <p className="font-semibold text-delulu-text mb-2">Keine Wölkchen gefunden</p>
                <p className="text-sm text-delulu-muted mb-4">
                  Ändere den Filter oder erstelle ein neues Wölkchen
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-3 bg-delulu-violet text-white rounded-xl font-semibold"
                >
                  Alle Wölkchen anzeigen
                </button>
              </div>
            ) : (
              /* Room list */
              filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-delulu-text">{room.name}</h3>
                        {room.isAnonymous && (
                          <Lock size={14} className="text-purple-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-delulu-muted">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {room.participants.length}/{room.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(room.createdAt)}
                        </span>
                      </div>
                    </div>

                    {room.xpMultiplier > 1 && (
                      <div className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Zap size={12} />
                        {room.xpMultiplier}x XP
                      </div>
                    )}
                  </div>

                  {/* Participants Preview */}
                  <div className="flex items-center gap-2 mb-4">
                    {room.participants.length > 0 ? (
                      <>
                        <div className="flex -space-x-2">
                          {room.participants.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs ${
                                p.isAnonymous ? 'bg-purple-100 text-purple-600' : 'bg-delulu-violet/10 text-delulu-violet'
                              } ${p.isSpeaking ? 'ring-2 ring-green-400' : ''}`}
                            >
                              {p.isAnonymous ? '?' : p.displayName[0]}
                            </div>
                          ))}
                          {room.participants.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{room.participants.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Currently speaking indicator */}
                        {room.participants.some(p => p.isSpeaking) && (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Aktiv</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-delulu-muted italic">Noch keine Teilnehmer</p>
                    )}
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinRoom(room, room.isAnonymous)}
                    disabled={room.participants.length >= room.maxParticipants}
                    className="w-full py-3 rounded-xl bg-delulu-violet text-white font-semibold hover:bg-delulu-violet/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    {room.isAnonymous ? 'Anonym beitreten' : 'Beitreten'}
                  </button>
                </div>
              ))
            )}
          </div>
          )}
        </>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-delulu-text mb-6 text-center">
              Wölkchen erstellen
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-delulu-text mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="z.B. Chill Wölkchen"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-delulu-violet/30"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-delulu-text mb-2">
                  Typ
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewRoomType('public')}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                      newRoomType === 'public'
                        ? 'bg-delulu-violet text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Globe size={18} />
                    Öffentlich
                  </button>
                  <button
                    onClick={() => setNewRoomType('private')}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                      newRoomType === 'private'
                        ? 'bg-delulu-violet text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Lock size={18} />
                    Privat
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRoomAnonymous}
                  onChange={(e) => setNewRoomAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-500"
                />
                <div>
                  <p className="font-medium text-delulu-text flex items-center gap-2">
                    <EyeOff size={16} className="text-purple-500" />
                    Anonymes Wölkchen
                  </p>
                  <p className="text-xs text-delulu-muted">
                    Alle Teilnehmer werden als "Wanderer" angezeigt
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{createError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                disabled={isCreating}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || isCreating}
                className="flex-1 py-3 px-4 bg-delulu-violet text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  'Erstellen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-delulu-text mb-2">
                User melden?
              </h2>
              <p className="text-sm text-delulu-muted">
                Bei mehreren Meldungen wird der User aus dem Wölkchen entfernt.
                Missbrauch dieser Funktion wird geahndet.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVoteModal(null)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleVoteKick(showVoteModal)}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ThumbsDown size={18} />
                Melden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AFK Warning Modal */}
      {(showAFKModal || afkWarning) && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-pulse">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <AlertTriangle size={40} className="text-amber-600" />
              </div>
              <h2 className="font-display text-xl font-bold text-delulu-text mb-2">
                Bist du noch da? 👋
              </h2>
              <p className="text-sm text-delulu-muted mb-4">
                Du hast schon länger nicht mehr gesprochen.
                Bitte bestätige, dass du noch teilnimmst.
              </p>
              {afkTimeRemaining > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full font-semibold">
                  <Clock size={16} />
                  Auto-Kick in {afkTimeRemaining}s
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleLeaveRoom();
                  setShowAFKModal(false);
                }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold"
              >
                Verlassen
              </button>
              <button
                onClick={() => {
                  dismissAFKWarning();
                  setShowAFKModal(false);
                }}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Hand size={18} />
                Ich bin da!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Permission Banner */}
      {activeRoom && microphonePermission === 'denied' && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-white px-4 py-3 safe-top">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <MicOffIcon size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Mikrofon deaktiviert</p>
              <p className="text-xs opacity-90">
                Du kannst zuhören, aber nicht sprechen. Aktiviere das Mikrofon in deinen Browser-Einstellungen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discover;
