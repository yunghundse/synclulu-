/**
 * DELULU GLOW-UP AVATAR COMPONENT
 * Avatar with level-based visual effects
 */

import { useState, useEffect, useRef } from 'react';
import {
  getGlowUpTier,
  getAvatarFrameStyles,
  getAvatarFrameClass,
  getNameEffectClass,
  getBadgeStyle,
  getParticleConfig,
  GlowUpTier,
  ParticleConfig,
} from '@/lib/glowUpEffects';
import { CREATOR_TIERS, CreatorTier } from '@/lib/creatorSystem';

interface GlowUpAvatarProps {
  avatarUrl?: string;
  avatarId?: string;
  level: number;
  creatorTier?: CreatorTier;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showName?: boolean;
  name?: string;
  showLevel?: boolean;
  showParticles?: boolean;
  className?: string;
  onClick?: () => void;
}

// ═══════════════════════════════════════
// PARTICLE COMPONENT
// ═══════════════════════════════════════

const ParticleEffect = ({ config, size }: { config: ParticleConfig; size: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
    }[] = [];

    // Initialize particles
    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * size,
        y: Math.random() * size,
        size: Math.random() * config.size + 2,
        speedX: (Math.random() - 0.5) * config.speed,
        speedY: (Math.random() - 0.5) * config.speed - 0.5,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      particles.forEach((p) => {
        ctx.beginPath();

        // Draw different particle types
        if (config.type === 'sparkles' || config.type === 'stars') {
          // Star shape
          const spikes = config.type === 'stars' ? 5 : 4;
          const outerRadius = p.size;
          const innerRadius = p.size / 2;

          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = p.x + Math.cos(angle) * radius;
            const y = p.y + Math.sin(angle) * radius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        } else if (config.type === 'hearts') {
          // Heart shape (simplified)
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        } else {
          // Circle for cosmic/fire
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }

        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Fade out effect
        p.opacity -= 0.005;

        // Reset if out of bounds or faded
        if (p.x < 0 || p.x > size || p.y < 0 || p.y > size || p.opacity <= 0) {
          p.x = size / 2 + (Math.random() - 0.5) * size / 2;
          p.y = size / 2 + (Math.random() - 0.5) * size / 2;
          p.opacity = Math.random() * 0.8 + 0.2;
        }
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [config, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};

// ═══════════════════════════════════════
// GLOW-UP AVATAR COMPONENT
// ═══════════════════════════════════════

const GlowUpAvatar = ({
  avatarUrl,
  avatarId = 'pegasus',
  level,
  creatorTier,
  isVerified = false,
  size = 'md',
  showName = false,
  name,
  showLevel = false,
  showParticles = true,
  className = '',
  onClick,
}: GlowUpAvatarProps) => {
  const tier = getGlowUpTier(level);
  const particleConfig = getParticleConfig(level);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-36 h-36',
  };

  const sizePx = {
    sm: 40,
    md: 56,
    lg: 80,
    xl: 112,
    '2xl': 144,
  };

  // Get avatar source
  const getAvatarSrc = () => {
    if (avatarUrl) return avatarUrl;

    // Use avatar ID to get default avatar
    const avatarMap: Record<string, string> = {
      pegasus: '🦄',
      phoenix: '🔥',
      dragon: '🐉',
      unicorn: '✨',
      wolf: '🐺',
      cat: '🐱',
      bunny: '🐰',
      bear: '🐻',
      fox: '🦊',
      owl: '🦉',
    };

    return null; // Will use emoji fallback
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      onClick={onClick}
    >
      {/* Glow effect behind avatar */}
      {tier.glowIntensity > 0 && (
        <div
          className={`absolute rounded-full ${sizeClasses[size]}`}
          style={{
            background: tier.glowColor,
            filter: `blur(${tier.glowIntensity}px)`,
            opacity: 0.5,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Particles */}
      {showParticles && particleConfig && size !== 'sm' && (
        <ParticleEffect
          config={particleConfig}
          size={sizePx[size] * 1.5}
        />
      )}

      {/* Avatar container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-visible cursor-pointer transition-transform hover:scale-105`}
        style={getAvatarFrameStyles(level)}
      >
        {/* Frame */}
        <div className={`absolute inset-0 rounded-full ${getAvatarFrameClass(level)}`} />

        {/* Avatar image or emoji */}
        <div className="absolute inset-[4px] rounded-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {avatarId === 'pegasus' ? '🦄' : avatarId === 'phoenix' ? '🔥' : '☁️'}
            </div>
          )}
        </div>

        {/* Verified badge */}
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
            <span className="text-xs">☁️</span>
          </div>
        )}

        {/* Creator tier badge */}
        {creatorTier && creatorTier !== 'user' && (
          <div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg text-sm"
            style={{ backgroundColor: CREATOR_TIERS[creatorTier].color }}
          >
            {CREATOR_TIERS[creatorTier].emoji}
          </div>
        )}
      </div>

      {/* Level badge */}
      {showLevel && (
        <div
          className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(level)}`}
        >
          {tier.emoji} Lv. {level}
        </div>
      )}

      {/* Name with effect */}
      {showName && name && (
        <p
          className={`mt-2 font-bold text-center ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          } ${getNameEffectClass(level)}`}
        >
          {name}
        </p>
      )}
    </div>
  );
};

export default GlowUpAvatar;
