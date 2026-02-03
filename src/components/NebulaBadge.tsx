import React from 'react';
import { Sparkles, Star, Zap, Crown, Shield } from 'lucide-react';
import type { NebulaTier } from '@/types';

interface NebulaBadgeProps {
  tier: NebulaTier;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

// Tier configurations with colors and icons
const TIER_CONFIG: Record<NebulaTier, {
  label: string;
  labelDe: string;
  icon: React.ElementType;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  gradient: string;
}> = {
  nebula: {
    label: 'Verified',
    labelDe: 'Verifiziert',
    icon: Sparkles,
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
  },
  supernova: {
    label: 'Supernova',
    labelDe: 'Supernova',
    icon: Star,
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
  },
  galaxy: {
    label: 'Galaxy',
    labelDe: 'Galaxie',
    icon: Zap,
    primaryColor: '#EC4899',
    secondaryColor: '#F472B6',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-500',
  },
  universe: {
    label: 'Universe',
    labelDe: 'Universum',
    icon: Crown,
    primaryColor: '#06B6D4',
    secondaryColor: '#22D3EE',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    gradient: 'from-cyan-400 via-teal-500 to-emerald-500',
  },
  founder: {
    label: 'Founder',
    labelDe: 'Gründer',
    icon: Shield,
    primaryColor: '#FFD700',
    secondaryColor: '#FFF8DC',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-500',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'w-4 h-4', icon: 10, text: 'text-[10px]' },
  md: { badge: 'w-5 h-5', icon: 12, text: 'text-xs' },
  lg: { badge: 'w-6 h-6', icon: 14, text: 'text-sm' },
  xl: { badge: 'w-8 h-8', icon: 18, text: 'text-base' },
};

export const NebulaBadge: React.FC<NebulaBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  animated = true,
  className = '',
}) => {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Badge Container */}
      <div className="relative">
        {/* Animated Glow Ring */}
        {animated && (
          <>
            <div
              className={`absolute inset-0 ${sizeConfig.badge} rounded-full opacity-60`}
              style={{
                background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                animation: 'nebulaPulse 2s ease-in-out infinite',
              }}
            />
            <div
              className={`absolute inset-[-2px] rounded-full`}
              style={{
                background: `conic-gradient(from 0deg, ${config.primaryColor}, ${config.secondaryColor}, ${config.primaryColor})`,
                animation: 'nebulaRotate 3s linear infinite',
                opacity: 0.4,
              }}
            />
          </>
        )}

        {/* Main Badge */}
        <div
          className={`relative ${sizeConfig.badge} rounded-full flex items-center justify-center bg-gradient-to-br ${config.gradient} shadow-lg`}
          style={{
            boxShadow: animated ? `0 0 12px ${config.glowColor}` : 'none',
          }}
        >
          <Icon size={sizeConfig.icon} className="text-white drop-shadow-md" strokeWidth={2.5} />
        </div>

        {/* Sparkle Particles (for animated) */}
        {animated && tier !== 'nebula' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                style={{
                  top: `${20 + i * 25}%`,
                  left: `${10 + i * 30}%`,
                  animation: `sparkle ${1.5 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={`font-semibold ${sizeConfig.text} bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}
        >
          {config.label}
        </span>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes nebulaPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0.3; }
        }

        @keyframes nebulaRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// VIP AURA WRAPPER (for profile/cloud)
// ═══════════════════════════════════════

interface VIPAuraProps {
  tier: NebulaTier;
  children: React.ReactNode;
  intensity?: 'subtle' | 'normal' | 'intense';
  className?: string;
}

export const VIPAura: React.FC<VIPAuraProps> = ({
  tier,
  children,
  intensity = 'normal',
  className = '',
}) => {
  const config = TIER_CONFIG[tier];

  const intensityConfig = {
    subtle: { blur: '20px', opacity: 0.3 },
    normal: { blur: '30px', opacity: 0.5 },
    intense: { blur: '40px', opacity: 0.7 },
  };

  const { blur, opacity } = intensityConfig[intensity];

  return (
    <div className={`relative ${className}`}>
      {/* Animated Aura Background */}
      <div
        className="absolute inset-[-10px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          filter: `blur(${blur})`,
          opacity,
          animation: 'auraBreath 3s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes auraBreath {
          0%, 100% { transform: scale(1); opacity: ${opacity}; }
          50% { transform: scale(1.1); opacity: ${opacity * 0.6}; }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════
// STAR CATEGORY BADGE
// ═══════════════════════════════════════

import type { StarCategory } from '@/types';

interface StarCategoryBadgeProps {
  category: StarCategory;
  size?: 'sm' | 'md';
}

const CATEGORY_LABELS: Record<StarCategory, { en: string; de: string; emoji: string }> = {
  influencer: { en: 'Influencer', de: 'Influencer', emoji: '📱' },
  entrepreneur: { en: 'Entrepreneur', de: 'Unternehmer', emoji: '💼' },
  artist: { en: 'Artist', de: 'Künstler', emoji: '🎨' },
  athlete: { en: 'Athlete', de: 'Sportler', emoji: '⚽' },
  musician: { en: 'Musician', de: 'Musiker', emoji: '🎵' },
  actor: { en: 'Actor', de: 'Schauspieler', emoji: '🎭' },
  journalist: { en: 'Journalist', de: 'Journalist', emoji: '📰' },
  politician: { en: 'Politician', de: 'Politiker', emoji: '🏛️' },
  scientist: { en: 'Scientist', de: 'Wissenschaftler', emoji: '🔬' },
  creator: { en: 'Creator', de: 'Creator', emoji: '✨' },
  other: { en: 'Public Figure', de: 'Persönlichkeit', emoji: '⭐' },
};

export const StarCategoryBadge: React.FC<StarCategoryBadgeProps> = ({
  category,
  size = 'md',
}) => {
  const label = CATEGORY_LABELS[category];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800/60 border border-gray-700/50 ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <span>{label.emoji}</span>
      <span className="text-gray-300">{label.de}</span>
    </span>
  );
};

export default NebulaBadge;
