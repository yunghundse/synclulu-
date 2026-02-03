/**
 * MAGIC INVITE CARD v1.5
 * "The Golden Ticket Experience"
 *
 * DESIGN PRINCIPLES:
 * - Holographic gradient effects
 * - Mouse-follow shimmer
 * - Micro-interactions on every touch
 * - Animated ticket reveal
 * - Haptic feedback patterns
 *
 * @design Clubhouse meets Apple Card
 * @version 1.5.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles, Gift, Copy, Check, Share2, QrCode,
  Star, Crown, Zap, Heart, Users, ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface MagicInviteCardProps {
  code: string;
  remainingInvites: number;
  totalInvites: number;
  rewardDays: number;
  onShare?: () => void;
  onCopy?: () => void;
  onShowQR?: () => void;
  variant?: 'golden' | 'platinum' | 'diamond';
  isAnimated?: boolean;
}

// ═══════════════════════════════════════
// VARIANTS CONFIG
// ═══════════════════════════════════════

const VARIANTS = {
  golden: {
    gradient: 'from-amber-300 via-yellow-400 to-orange-400',
    shimmer: 'from-transparent via-white/40 to-transparent',
    glow: 'shadow-amber-500/50',
    accent: 'text-amber-900',
    badge: '🌟 Golden Ticket',
    border: 'border-amber-400/50',
  },
  platinum: {
    gradient: 'from-slate-200 via-gray-100 to-slate-300',
    shimmer: 'from-transparent via-white/60 to-transparent',
    glow: 'shadow-slate-400/50',
    accent: 'text-slate-700',
    badge: '💎 Platinum Pass',
    border: 'border-slate-300/50',
  },
  diamond: {
    gradient: 'from-violet-400 via-purple-300 to-fuchsia-400',
    shimmer: 'from-transparent via-white/50 to-transparent',
    glow: 'shadow-purple-500/50',
    accent: 'text-purple-900',
    badge: '👑 Diamond Elite',
    border: 'border-purple-400/50',
  },
};

// ═══════════════════════════════════════
// HOLOGRAPHIC OVERLAY COMPONENT
// ═══════════════════════════════════════

interface HolographicOverlayProps {
  mousePosition: { x: number; y: number };
  isHovered: boolean;
}

const HolographicOverlay: React.FC<HolographicOverlayProps> = ({ mousePosition, isHovered }) => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
    style={{
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}
  >
    {/* Rainbow shimmer that follows mouse */}
    <div
      className="absolute w-[200%] h-[200%] opacity-30"
      style={{
        background: `
          radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(255, 0, 128, 0.3) 0%,
            rgba(128, 0, 255, 0.2) 25%,
            rgba(0, 128, 255, 0.2) 50%,
            rgba(0, 255, 128, 0.1) 75%,
            transparent 100%
          )
        `,
        transform: 'translate(-25%, -25%)',
        transition: 'all 0.1s ease-out',
      }}
    />

    {/* Scan line effect */}
    <div
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent 0px, rgba(255,255,255,0.03) 1px, transparent 2px)',
      }}
    />
  </div>
);

// ═══════════════════════════════════════
// ANIMATED PARTICLES
// ═══════════════════════════════════════

const FloatingParticles: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-float"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN MAGIC INVITE CARD
// ═══════════════════════════════════════

const MagicInviteCard: React.FC<MagicInviteCardProps> = ({
  code,
  remainingInvites,
  totalInvites,
  rewardDays,
  onShare,
  onCopy,
  onShowQR,
  variant = 'golden',
  isAnimated = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const config = VARIANTS[variant];

  // Reveal animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Mouse tracking for holographic effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  }, []);

  // Copy handler
  const handleCopy = async () => {
    try {
      const shareText = `✨ Du wurdest zu Delulu eingeladen!\n\n🎫 Dein VIP-Code: ${code}\n\n👉 https://delulu.app/join/${code}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      if ('vibrate' in navigator) navigator.vibrate([15, 50, 15]);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Share handler
  const handleShare = async () => {
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10, 30, 10]);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Delulu Einladung 💫',
          text: `Hey! Ich lade dich zu Delulu ein. Nutze meinen Code: ${code}`,
          url: `https://delulu.app/join/${code}`,
        });
        onShare?.();
      } catch (error) {
        // User cancelled or error
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const progressPercentage = (remainingInvites / totalInvites) * 100;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`
        relative overflow-hidden rounded-3xl
        transform transition-all duration-500 ease-out
        ${isRevealed ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
      `}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* ═══════════════════════════════════════ */}
      {/* CARD BACKGROUND */}
      {/* ═══════════════════════════════════════ */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${config.gradient}
          shadow-2xl ${config.glow}
        `}
      />

      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Holographic overlay */}
      <HolographicOverlay mousePosition={mousePosition} isHovered={isHovered} />

      {/* Floating particles */}
      <FloatingParticles isActive={isAnimated && isHovered} />

      {/* Shimmer animation */}
      {isAnimated && (
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.shimmer} -translate-x-full animate-shimmer`}
        />
      )}

      {/* ═══════════════════════════════════════ */}
      {/* CARD CONTENT */}
      {/* ═══════════════════════════════════════ */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={config.accent} />
            <span className={`text-sm font-bold ${config.accent}`}>
              {config.badge}
            </span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-black/10 ${config.accent}`}>
            <Gift size={14} />
            <span className="text-xs font-semibold">+{rewardDays} Tage Premium</span>
          </div>
        </div>

        {/* Code Display */}
        <div className="mb-6">
          <div className="text-xs text-black/50 mb-2 uppercase tracking-wider">
            Dein Einladungscode
          </div>
          <div
            className={`
              relative bg-white/30 backdrop-blur-sm rounded-2xl p-4
              border ${config.border}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-black tracking-widest text-black/80">
                {code}
              </span>
              <button
                onClick={handleCopy}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  transition-all duration-300
                  ${copied
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-black/10 text-black/60 hover:bg-black/20 hover:scale-105'
                  }
                `}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-2 right-2 opacity-20">
              <Star size={12} />
            </div>
            <div className="absolute bottom-2 left-2 opacity-20">
              <Star size={12} />
            </div>
          </div>
        </div>

        {/* Remaining Invites */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${config.accent} opacity-70`}>
              Verbleibende Einladungen
            </span>
            <span className={`text-sm font-bold ${config.accent}`}>
              {remainingInvites} / {totalInvites}
            </span>
          </div>
          <div className="h-2 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-black/30 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className={`
              flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm
              bg-black/80 text-white
              flex items-center justify-center gap-2
              hover:bg-black hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              shadow-lg shadow-black/20
            `}
          >
            <Share2 size={18} />
            Teilen
          </button>
          <button
            onClick={onShowQR}
            className={`
              w-14 h-14 rounded-2xl
              bg-white/30 backdrop-blur-sm border ${config.border}
              flex items-center justify-center
              hover:bg-white/50 hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
            `}
          >
            <QrCode size={22} className={config.accent} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DECORATIVE CORNER STAMPS */}
      {/* ═══════════════════════════════════════ */}
      <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center opacity-30">
        <Crown size={20} className={config.accent} />
      </div>
      <div className="absolute bottom-0 right-0 w-12 h-12 flex items-center justify-center opacity-30">
        <Heart size={20} className={config.accent} />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CSS ANIMATIONS */}
      {/* ═══════════════════════════════════════ */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// MINI INVITE CARD (Compact Version)
// ═══════════════════════════════════════

interface MiniInviteCardProps {
  code: string;
  remainingInvites: number;
  onClick?: () => void;
}

export const MiniInviteCard: React.FC<MiniInviteCardProps> = ({
  code,
  remainingInvites,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all active:scale-[0.98]"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Gift size={20} className="text-amber-700" />
        </div>
        <div className="text-left">
          <p className="font-bold text-amber-900">{remainingInvites} Einladungen</p>
          <p className="text-xs text-amber-700/70 font-mono">{code}</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-amber-600" />
    </div>
  </button>
);

export default MagicInviteCard;
