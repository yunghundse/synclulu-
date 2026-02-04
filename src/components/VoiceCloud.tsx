/**
 * synclulu VOICE CLOUD v2.0
 * "The Magical Cloud Experience"
 *
 * FEATURES:
 * - Quick-Join with "In die nächste Wolke schweben"
 * - Orbit layout for participants
 * - Voice visualizer with waveforms
 * - Star-Glow emotional rewards
 * - Graceful "Wolkenbruch" error handling
 *
 * @design Apple FaceTime meets Social Audio
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, collection, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { VoiceAnalyzer, VoiceActivity, generateCircularWaveform } from '@/lib/voiceVisualizer';
import { starGiftOrchestrator, triggerHaptic } from '@/lib/starGlowSystem';
import { colors } from '@/lib/theme';
import {
  Mic, MicOff, PhoneOff, Users, Star, Crown,
  CloudRain, Sparkles, Volume2, VolumeX, Settings,
  ChevronDown, Gift, Heart, MessageCircle, MoreHorizontal,
  Zap, Radio, X
} from 'lucide-react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface CloudParticipant {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  isPremium: boolean;
  level: number;
  joinedAt: Date;
  voiceActivity?: VoiceActivity;
}

interface VoiceCloudData {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  topic?: string;
  location?: { lat: number; lng: number };
  distance?: number;
}

interface VoiceCloudProps {
  cloudId?: string;
  onClose?: () => void;
}

// ═══════════════════════════════════════
// QUICK JOIN BUTTON (Pulsing Entry)
// ═══════════════════════════════════════

interface QuickJoinButtonProps {
  onJoin: () => void;
  isLoading: boolean;
  nearbyCount: number;
}

const QuickJoinButton: React.FC<QuickJoinButtonProps> = ({ onJoin, isLoading, nearbyCount }) => (
  <button
    onClick={() => {
      triggerHaptic('starSend');
      onJoin();
    }}
    disabled={isLoading || nearbyCount === 0}
    className="relative group"
  >
    {/* Pulsing rings */}
    <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
    <div className="absolute inset-2 rounded-full bg-purple-500/30 animate-pulse" />

    {/* Main button */}
    <div className={`
      relative px-8 py-4 rounded-full
      bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500
      text-white font-bold text-lg
      shadow-2xl shadow-purple-500/50
      flex items-center gap-3
      transition-all duration-300
      ${isLoading ? 'opacity-70' : 'hover:scale-105 hover:shadow-purple-500/70'}
      disabled:opacity-50
    `}>
      {isLoading ? (
        <>
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <span>Schwebe...</span>
        </>
      ) : (
        <>
          <Radio size={24} className="animate-pulse" />
          <span>In die nächste Wolke schweben</span>
          {nearbyCount > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {nearbyCount} aktiv
            </span>
          )}
        </>
      )}
    </div>
  </button>
);

// ═══════════════════════════════════════
// PARTICIPANT AVATAR WITH VOICE VISUALIZER
// ═══════════════════════════════════════

interface ParticipantAvatarProps {
  participant: CloudParticipant;
  position: { x: number; y: number };
  size: number;
  isCurrentUser: boolean;
  onTap: () => void;
  onGiveStar: () => void;
}

const ParticipantAvatar: React.FC<ParticipantAvatarProps> = ({
  participant,
  position,
  size,
  isCurrentUser,
  onTap,
  onGiveStar,
}) => {
  const [showActions, setShowActions] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Generate waveform points when speaking
  const waveformPoints = useMemo(() => {
    if (!participant.voiceActivity?.isSpeaking || !participant.voiceActivity.waveformData.length) {
      return null;
    }
    return generateCircularWaveform(
      participant.voiceActivity.waveformData,
      size / 2,
      size / 2,
      size / 2 - 5,
      15
    );
  }, [participant.voiceActivity, size]);

  // Convert waveform points to SVG path
  const waveformPath = useMemo(() => {
    if (!waveformPoints) return '';
    return waveformPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  }, [waveformPoints]);

  return (
    <div
      ref={avatarRef}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
      }}
    >
      {/* Voice visualizer ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Base ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          fill="none"
          stroke={participant.isSpeaking ? '#A855F7' : 'rgba(255,255,255,0.2)'}
          strokeWidth={participant.isSpeaking ? 3 : 2}
          className="transition-all duration-300"
        />

        {/* Animated waveform */}
        {waveformPath && (
          <path
            d={waveformPath}
            fill="none"
            stroke="url(#voiceGradient)"
            strokeWidth={2}
            className="animate-pulse"
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Avatar */}
      <button
        onClick={() => {
          triggerHaptic('starSend');
          setShowActions(!showActions);
          onTap();
        }}
        className={`
          absolute inset-2 rounded-full overflow-hidden
          transition-all duration-300
          ${participant.isSpeaking ? 'ring-4 ring-purple-500 shadow-lg shadow-purple-500/50' : ''}
          ${isCurrentUser ? 'ring-2 ring-green-500' : ''}
        `}
      >
        <img
          src={participant.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant.id}`}
          alt={participant.displayName}
          className="w-full h-full object-cover"
        />

        {/* Muted indicator */}
        {participant.isMuted && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
            <MicOff size={12} className="text-white" />
          </div>
        )}

        {/* Host badge */}
        {participant.isHost && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
            <Crown size={12} className="text-white" />
          </div>
        )}
      </button>

      {/* Name label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          participant.isSpeaking
            ? 'bg-purple-500 text-white'
            : 'bg-white/10 text-gray-300'
        }`}>
          {isCurrentUser ? 'Du' : participant.displayName.split(' ')[0]}
        </span>
      </div>

      {/* Quick actions popup */}
      {showActions && !isCurrentUser && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGiveStar();
              setShowActions(false);
            }}
            className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Star size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
            }}
            className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Heart size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// WOLKENBRUCH ERROR STATE
// ═══════════════════════════════════════

interface CloudBurstErrorProps {
  onRetry: () => void;
  message?: string;
}

const CloudBurstError: React.FC<CloudBurstErrorProps> = ({ onRetry, message }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Auto-retry logic
    if (retryCount < 3) {
      const timer = setTimeout(() => {
        setIsRetrying(true);
        setRetryCount(c => c + 1);
        onRetry();
        setTimeout(() => setIsRetrying(false), 2000);
      }, 2000 + retryCount * 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount, onRetry]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900/90 to-black/90 z-50">
      {/* Animated rain drops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-gradient-to-b from-transparent to-blue-400/50 animate-rain"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${20 + Math.random() * 30}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-8">
        {/* Cloud burst icon */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <CloudRain size={96} className="text-blue-400 animate-bounce" />
          <div className="absolute inset-0 flex items-center justify-center">
            {isRetrying && (
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Wolkenbruch!</h2>
        <p className="text-gray-300 mb-6">
          {message || 'Die Verbindung wurde kurz unterbrochen...'}
        </p>

        {retryCount < 3 ? (
          <p className="text-purple-400 animate-pulse">
            Verbinde erneut... ({retryCount + 1}/3)
          </p>
        ) : (
          <button
            onClick={() => {
              setRetryCount(0);
              onRetry();
            }}
            className="px-6 py-3 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
          >
            Nochmal versuchen
          </button>
        )}
      </div>

      {/* CSS for rain animation */}
      <style>{`
        @keyframes rain {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .animate-rain {
          animation: rain linear infinite;
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN VOICE CLOUD COMPONENT
// ═══════════════════════════════════════

const VoiceCloud: React.FC<VoiceCloudProps> = ({ cloudId, onClose }) => {
  const navigate = useNavigate();
  const { user } = useStore();
  const myAvatarUrl = user?.avatarUrl || null;

  // State
  const [cloud, setCloud] = useState<VoiceCloudData | null>(null);
  const [participants, setParticipants] = useState<CloudParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<CloudParticipant | null>(null);

  // Quick join state
  const [nearbyClouds, setNearbyClouds] = useState<VoiceCloudData[]>([]);
  const [isQuickJoining, setIsQuickJoining] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const voiceAnalyzerRef = useRef<VoiceAnalyzer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Calculate orbit positions
  const orbitPositions = useMemo(() => {
    const containerWidth = containerRef.current?.clientWidth || 300;
    const containerHeight = containerRef.current?.clientHeight || 400;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const radius = Math.min(containerWidth, containerHeight) * 0.35;

    return participants.map((_, index) => {
      const angle = (index / participants.length) * Math.PI * 2 - Math.PI / 2;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
  }, [participants]);

  // Load nearby clouds for quick join
  useEffect(() => {
    if (cloudId) return;

    const loadNearbyClouds = async () => {
      try {
        const cloudsQuery = query(
          collection(db, 'voice_rooms'),
          where('isActive', '==', true),
          orderBy('participantCount', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(cloudsQuery, (snapshot) => {
          const clouds = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as VoiceCloudData[];

          setNearbyClouds(clouds);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('[VoiceCloud] Load nearby failed:', error);
      }
    };

    loadNearbyClouds();
  }, [cloudId]);

  // Quick join handler
  const handleQuickJoin = useCallback(async () => {
    if (nearbyClouds.length === 0) return;

    setIsQuickJoining(true);
    triggerHaptic('starSend');

    const targetCloud = nearbyClouds[0];

    if (containerRef.current) {
      containerRef.current.style.filter = 'blur(20px)';
      containerRef.current.style.transform = 'scale(1.1)';
    }

    setTimeout(() => {
      navigate(`/cloud/${targetCloud.id}`);
    }, 500);
  }, [nearbyClouds, navigate]);

  // Join cloud
  useEffect(() => {
    if (!cloudId || !user?.id) return;

    const joinCloud = async () => {
      setIsConnecting(true);
      setHasError(false);

      try {
        const cloudDoc = await getDoc(doc(db, 'voice_rooms', cloudId));
        if (!cloudDoc.exists()) {
          throw new Error('Wolke nicht gefunden');
        }

        setCloud({ id: cloudDoc.id, ...cloudDoc.data() } as VoiceCloudData);

        const participantsQuery = query(
          collection(db, 'voice_rooms', cloudId, 'participants'),
          orderBy('joinedAt', 'asc')
        );

        const unsubscribe = onSnapshot(participantsQuery, (snapshot) => {
          const newParticipants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate() || new Date(),
          })) as CloudParticipant[];

          setParticipants(newParticipants);
        });

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          voiceAnalyzerRef.current = new VoiceAnalyzer();
          await voiceAnalyzerRef.current.initialize(stream);

          voiceAnalyzerRef.current.onActivity((activity) => {
            if (user?.id && cloudId) {
              updateDoc(doc(db, 'voice_rooms', cloudId, 'participants', user.id), {
                isSpeaking: activity.isSpeaking && !isMuted,
              }).catch(() => {});
            }
          });
        } catch (micError) {
          console.warn('[VoiceCloud] Mic access denied:', micError);
        }

        setIsConnecting(false);

        return () => {
          unsubscribe();
          if (voiceAnalyzerRef.current) {
            voiceAnalyzerRef.current.destroy();
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error: any) {
        console.error('[VoiceCloud] Join failed:', error);
        setHasError(true);
        setErrorMessage(error.message || 'Verbindung fehlgeschlagen');
        setIsConnecting(false);
      }
    };

    joinCloud();
  }, [cloudId, user?.id, isMuted]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    triggerHaptic('starSend');

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  }, [isMuted]);

  // Give star
  const handleGiveStar = useCallback(async (toParticipant: CloudParticipant) => {
    if (!user?.id) return;

    const myIndex = participants.findIndex(p => p.id === user.id);
    const theirIndex = participants.findIndex(p => p.id === toParticipant.id);

    const myPosition = orbitPositions[myIndex] || { x: 150, y: 200 };
    const theirPosition = orbitPositions[theirIndex] || { x: 150, y: 200 };

    await starGiftOrchestrator.sendStar({
      fromUserId: user.id,
      toUserId: toParticipant.id,
      fromPosition: myPosition,
      toPosition: theirPosition,
      starCount: 1,
      timestamp: Date.now(),
    });
  }, [user?.id, participants, orbitPositions]);

  // Leave cloud
  const handleLeave = useCallback(() => {
    triggerHaptic('starSend');

    if (voiceAnalyzerRef.current) {
      voiceAnalyzerRef.current.destroy();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    onClose?.();
    navigate('/discover');
  }, [navigate, onClose]);

  // ═══════════════════════════════════════
  // RENDER: NO CLOUD - SHOW QUICK JOIN
  // ═══════════════════════════════════════
  if (!cloudId) {
    return (
      <div
        ref={containerRef}
        className="min-h-screen flex flex-col items-center justify-center p-8 transition-all duration-500"
        style={{ background: colors.dark.bg.primary }}
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Wölkchen entdecken
          </h1>
          <p className="text-gray-400 max-w-md">
            Tritt einer aktiven Wolke bei und verbinde dich mit anderen synclulu-Usern.
          </p>
        </div>

        <QuickJoinButton
          onJoin={handleQuickJoin}
          isLoading={isQuickJoining}
          nearbyCount={nearbyClouds.length}
        />

        {nearbyClouds.length > 0 && (
          <div className="mt-12 w-full max-w-md">
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">
              Aktive Wolken
            </h3>
            <div className="space-y-3">
              {nearbyClouds.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/cloud/${c.id}`)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Radio size={20} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-white">{c.name || 'Wolke'}</h4>
                    <p className="text-sm text-gray-400">
                      {c.participantCount} Teilnehmer • von {c.hostName}
                    </p>
                  </div>
                  <Users size={18} className="text-gray-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: ERROR STATE
  // ═══════════════════════════════════════
  if (hasError) {
    return (
      <CloudBurstError
        message={errorMessage}
        onRetry={() => {
          setHasError(false);
          setIsConnecting(true);
        }}
      />
    );
  }

  // ═══════════════════════════════════════
  // RENDER: CONNECTING STATE
  // ═══════════════════════════════════════
  if (isConnecting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.dark.bg.primary }}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio size={32} className="text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-white font-medium">Betrete die Wolke...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // RENDER: MAIN CLOUD VIEW
  // ═══════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col"
      style={{ background: `linear-gradient(180deg, ${colors.dark.bg.primary} 0%, #1a0a2e 100%)` }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{cloud?.name || 'Wolke'}</h1>
          <p className="text-sm text-gray-400">{participants.length} Teilnehmer</p>
        </div>
        <button
          onClick={() => setSelectedParticipant(null)}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
        >
          <MoreHorizontal size={20} className="text-white" />
        </button>
      </div>

      {/* Participants Orbit */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full border border-white/10"
            style={{
              width: `${Math.min(300, 400) * 0.7}px`,
              height: `${Math.min(300, 400) * 0.7}px`,
            }}
          />
        </div>

        {participants.map((participant, index) => (
          <ParticipantAvatar
            key={participant.id}
            participant={participant}
            position={orbitPositions[index] || { x: 150, y: 200 }}
            size={participant.id === user?.id ? 80 : 70}
            isCurrentUser={participant.id === user?.id}
            onTap={() => setSelectedParticipant(participant)}
            onGiveStar={() => handleGiveStar(participant)}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="px-6 pb-8 pt-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500 shadow-lg shadow-red-500/30'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>

          <button
            onClick={handleLeave}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/40 hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={32} className="text-white" />
          </button>

          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isSpeakerOn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-700'
            }`}
          >
            {isSpeakerOn ? <Volume2 size={28} className="text-white" /> : <VolumeX size={28} className="text-gray-400" />}
          </button>
        </div>

        <div className="mt-4 text-center">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
            {isMuted ? 'Stummgeschaltet' : 'Aktiv'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloud;
