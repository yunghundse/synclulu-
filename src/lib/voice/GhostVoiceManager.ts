/**
 * DELULU GHOST VOICE MANAGER
 * ═══════════════════════════════════════════════════════════════
 * Singleton Audio Manager für persistente Voice-Connections
 *
 * FEATURES:
 * - Singleton Pattern: Eine Instanz über dem gesamten UI-Tree
 * - Platform Bridge: Kommuniziert mit Native Code (Android/iOS)
 * - WebRTC/Agora Integration Ready
 * - State Management mit Event Emitter
 * - Automatic Reconnection
 *
 * USAGE:
 * const voice = GhostVoiceManager.getInstance();
 * voice.startSession(roomId, userId);
 * voice.on('participantJoined', (user) => { ... });
 *
 * @author Delulu Engineering
 * @version 1.0.0
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface VoiceParticipant {
  id: string;
  username: string;
  avatarUrl?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  volume: number;
}

export interface VoiceState {
  isActive: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  roomId: string | null;
  participants: VoiceParticipant[];
  currentSpeaker: string | null;
  volume: number;
  error: string | null;
}

export type VoiceEvent =
  | 'stateChanged'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'participantJoined'
  | 'participantLeft'
  | 'participantMuted'
  | 'participantSpeaking'
  | 'volumeChanged'
  | 'interrupted'
  | 'resumed';

// ═══════════════════════════════════════
// PLATFORM DETECTION
// ═══════════════════════════════════════

const isNative = typeof (window as any).Capacitor !== 'undefined';
const isAndroid = isNative && (window as any).Capacitor?.getPlatform() === 'android';
const isIOS = isNative && (window as any).Capacitor?.getPlatform() === 'ios';
const isWeb = !isNative;

// ═══════════════════════════════════════
// GHOST VOICE MANAGER (SINGLETON)
// ═══════════════════════════════════════

class GhostVoiceManager extends EventEmitter {
  private static instance: GhostVoiceManager | null = null;

  private state: VoiceState = {
    isActive: false,
    isConnecting: false,
    isMuted: false,
    roomId: null,
    participants: [],
    currentSpeaker: null,
    volume: 1.0,
    error: null,
  };

  // WebRTC / Agora client (to be integrated)
  private audioClient: any = null;
  private localAudioTrack: any = null;

  // Reconnection
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // ═══════════════════════════════════════
  // SINGLETON
  // ═══════════════════════════════════════

  private constructor() {
    super();
    this.setMaxListeners(50);
    this.setupNativeListeners();
    console.log('[GhostVoice] Manager initialized');
  }

  public static getInstance(): GhostVoiceManager {
    if (!GhostVoiceManager.instance) {
      GhostVoiceManager.instance = new GhostVoiceManager();
    }
    return GhostVoiceManager.instance;
  }

  // ═══════════════════════════════════════
  // STATE GETTERS
  // ═══════════════════════════════════════

  public getState(): VoiceState {
    return { ...this.state };
  }

  public isActive(): boolean {
    return this.state.isActive;
  }

  public isMuted(): boolean {
    return this.state.isMuted;
  }

  public getParticipants(): VoiceParticipant[] {
    return [...this.state.participants];
  }

  // ═══════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════

  /**
   * Startet eine Voice-Session
   * Überlebt Navigation innerhalb der App
   */
  public async startSession(roomId: string, userId: string): Promise<boolean> {
    if (this.state.isActive && this.state.roomId === roomId) {
      console.log('[GhostVoice] Already in room:', roomId);
      return true;
    }

    console.log('[GhostVoice] Starting session in room:', roomId);

    this.updateState({
      isConnecting: true,
      error: null,
    });

    try {
      // 1. Start native foreground service
      await this.startNativeService();

      // 2. Connect to voice server (WebRTC/Agora)
      await this.connectToRoom(roomId, userId);

      // 3. Update state
      this.updateState({
        isActive: true,
        isConnecting: false,
        roomId,
      });

      this.emit('connected', { roomId });
      this.reconnectAttempts = 0;

      return true;

    } catch (error: any) {
      console.error('[GhostVoice] Failed to start session:', error);

      this.updateState({
        isConnecting: false,
        error: error.message || 'Connection failed',
      });

      this.emit('error', error);
      return false;
    }
  }

  /**
   * Beendet die Voice-Session
   */
  public async stopSession(): Promise<void> {
    console.log('[GhostVoice] Stopping session');

    try {
      // 1. Disconnect from voice server
      await this.disconnectFromRoom();

      // 2. Stop native foreground service
      await this.stopNativeService();

      // 3. Update state
      this.updateState({
        isActive: false,
        isConnecting: false,
        roomId: null,
        participants: [],
        currentSpeaker: null,
      });

      this.emit('disconnected');

    } catch (error) {
      console.error('[GhostVoice] Error stopping session:', error);
    }
  }

  // ═══════════════════════════════════════
  // MUTE CONTROL
  // ═══════════════════════════════════════

  public async setMuted(muted: boolean): Promise<void> {
    console.log('[GhostVoice] Setting muted:', muted);

    this.updateState({ isMuted: muted });

    // Update local audio track
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!muted);
    }

    // Update native service
    await this.updateNativeMuteState(muted);

    this.emit('stateChanged', this.state);
  }

  public async toggleMute(): Promise<void> {
    await this.setMuted(!this.state.isMuted);
  }

  // ═══════════════════════════════════════
  // VOLUME CONTROL
  // ═══════════════════════════════════════

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updateState({ volume: clampedVolume });

    // Update remote audio volumes
    // Implementation depends on WebRTC/Agora

    this.emit('volumeChanged', clampedVolume);
  }

  // ═══════════════════════════════════════
  // NATIVE BRIDGE
  // ═══════════════════════════════════════

  private async startNativeService(): Promise<void> {
    if (isAndroid) {
      // Android: Start Foreground Service
      await (window as any).Capacitor?.Plugins?.GhostVoice?.startService();
      console.log('[GhostVoice] Android foreground service started');

    } else if (isIOS) {
      // iOS: Configure Audio Session
      await (window as any).Capacitor?.Plugins?.GhostVoice?.configureAudioSession();
      console.log('[GhostVoice] iOS audio session configured');

    } else if (isWeb) {
      // Web: Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[GhostVoice] Web microphone access granted');
      } catch (error) {
        throw new Error('Microphone access denied');
      }
    }
  }

  private async stopNativeService(): Promise<void> {
    if (isAndroid) {
      await (window as any).Capacitor?.Plugins?.GhostVoice?.stopService();
    } else if (isIOS) {
      await (window as any).Capacitor?.Plugins?.GhostVoice?.stopAudioSession();
    }
  }

  private async updateNativeMuteState(muted: boolean): Promise<void> {
    if (isNative) {
      await (window as any).Capacitor?.Plugins?.GhostVoice?.setMuted({ muted });
    }
  }

  private setupNativeListeners(): void {
    if (!isNative) return;

    const plugins = (window as any).Capacitor?.Plugins;

    // Listen for native events
    plugins?.GhostVoice?.addListener('interrupted', () => {
      console.log('[GhostVoice] Session interrupted (phone call)');
      this.emit('interrupted');
    });

    plugins?.GhostVoice?.addListener('resumed', () => {
      console.log('[GhostVoice] Session resumed');
      this.emit('resumed');
    });

    plugins?.GhostVoice?.addListener('volumeChanged', (data: { volume: number }) => {
      this.updateState({ volume: data.volume });
      this.emit('volumeChanged', data.volume);
    });
  }

  // ═══════════════════════════════════════
  // VOICE SERVER CONNECTION
  // (WebRTC/Agora Integration Point)
  // ═══════════════════════════════════════

  private async connectToRoom(roomId: string, userId: string): Promise<void> {
    // TODO: Implement WebRTC or Agora connection
    // This is the integration point for your voice backend

    console.log('[GhostVoice] Connecting to room:', roomId, 'as user:', userId);

    // Placeholder: Simulate connection
    await new Promise(resolve => setTimeout(resolve, 500));

    // Example Agora integration:
    /*
    const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');

    this.audioClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    await this.audioClient.join(AGORA_APP_ID, roomId, null, userId);

    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await this.audioClient.publish([this.localAudioTrack]);

    this.audioClient.on('user-published', async (user, mediaType) => {
      await this.audioClient.subscribe(user, mediaType);
      this.handleParticipantJoined(user);
    });

    this.audioClient.on('user-unpublished', (user) => {
      this.handleParticipantLeft(user.uid);
    });
    */
  }

  private async disconnectFromRoom(): Promise<void> {
    // TODO: Implement disconnect logic

    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }

    if (this.audioClient) {
      await this.audioClient?.leave();
      this.audioClient = null;
    }
  }

  // ═══════════════════════════════════════
  // PARTICIPANT MANAGEMENT
  // ═══════════════════════════════════════

  private handleParticipantJoined(user: any): void {
    const participant: VoiceParticipant = {
      id: user.uid || user.id,
      username: user.username || `User ${user.uid}`,
      avatarUrl: user.avatarUrl,
      isMuted: false,
      isSpeaking: false,
      volume: 1.0,
    };

    const participants = [...this.state.participants, participant];
    this.updateState({ participants });

    this.emit('participantJoined', participant);
    this.updateNativeParticipantCount(participants.length);
  }

  private handleParticipantLeft(userId: string): void {
    const participants = this.state.participants.filter(p => p.id !== userId);
    this.updateState({ participants });

    this.emit('participantLeft', userId);
    this.updateNativeParticipantCount(participants.length);
  }

  private handleParticipantSpeaking(userId: string, speaking: boolean): void {
    const participants = this.state.participants.map(p =>
      p.id === userId ? { ...p, isSpeaking: speaking } : p
    );

    const currentSpeaker = speaking ? userId : null;
    this.updateState({ participants, currentSpeaker });

    this.emit('participantSpeaking', { userId, speaking });
    this.updateNativeSpeakingState(speaking, userId);
  }

  private async updateNativeParticipantCount(count: number): Promise<void> {
    if (isNative) {
      await (window as any).Capacitor?.Plugins?.GhostVoice?.updateParticipants({ count });
    }
  }

  private async updateNativeSpeakingState(speaking: boolean, speakerName?: string): Promise<void> {
    if (isNative) {
      await (window as any).Capacitor?.Plugins?.GhostVoice?.updateSpeaking({ speaking, speakerName });
    }
  }

  // ═══════════════════════════════════════
  // RECONNECTION LOGIC
  // ═══════════════════════════════════════

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[GhostVoice] Max reconnect attempts reached');
      this.emit('error', new Error('Connection lost'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[GhostVoice] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      if (this.state.roomId) {
        // TODO: Get userId from somewhere
        await this.startSession(this.state.roomId, 'current-user-id');
      }
    }, delay);
  }

  // ═══════════════════════════════════════
  // STATE UPDATE
  // ═══════════════════════════════════════

  private updateState(partial: Partial<VoiceState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('stateChanged', this.state);
  }

  // ═══════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════

  public destroy(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.stopSession();
    this.removeAllListeners();

    GhostVoiceManager.instance = null;
  }
}

// ═══════════════════════════════════════
// EXPORT SINGLETON GETTER
// ═══════════════════════════════════════

export const getGhostVoice = () => GhostVoiceManager.getInstance();

export default GhostVoiceManager;
