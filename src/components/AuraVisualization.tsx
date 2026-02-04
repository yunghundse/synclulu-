/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURA VISUALIZATION - Patent-Grade UI Component
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Visualizes the Elastic Proximity Engine aura as an organic, breathing entity.
 * Features:
 * - Shader-like gradient animations
 * - Organic blob morphing (not a perfect circle)
 * - Activity pulse (faster = more activity)
 * - Expansion animations with messaging
 * - User markers within the aura
 *
 * @author synclulu Engineering
 * @version 2.0.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles, Users, Compass, Zap, Heart, MapPin } from 'lucide-react';
import { AuraState, GeoCoordinates, useElasticProximity } from '@/lib/elasticProximityEngine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuraVisualizationProps {
  userLocation: GeoCoordinates | null;
  userInterests?: string[];
  showMiniMap?: boolean;
  className?: string;
  onUserTap?: (userId: string) => void;
}

interface NearbyUserMarker {
  id: string;
  angle: number;
  distance: number;
  avatarUrl?: string;
  displayName: string;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// AURA VISUALIZATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AuraVisualization: React.FC<AuraVisualizationProps> = ({
  userLocation,
  userInterests = [],
  showMiniMap = true,
  className = '',
  onUserTap
}) => {
  const { aura, isLoading } = useElasticProximity(userLocation, userInterests);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUserMarker[]>([]);

  // Animation state
  const [breathPhase, setBreathPhase] = useState(0);
  const [morphOffset, setMorphOffset] = useState(0);

  // Breathing animation
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setBreathPhase(prev => (prev + 0.05) % (Math.PI * 2));
      setMorphOffset(prev => (prev + 0.02) % (Math.PI * 2));
    }, 50);

    return () => clearInterval(breathInterval);
  }, []);

  // Canvas animation for organic aura
  useEffect(() => {
    if (!canvasRef.current || !aura) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate aura visual radius (scaled for display)
      const maxVisualRadius = Math.min(width, height) * 0.45;
      const radiusRatio = aura.currentRadius / 100; // Assuming max 100km
      const baseRadius = maxVisualRadius * Math.min(radiusRatio, 1);

      // Breathing scale
      const breathScale = 1 + Math.sin(breathPhase) * 0.03;
      const radius = baseRadius * breathScale;

      // Draw multiple aura layers
      drawAuraLayer(ctx, centerX, centerY, radius, 0, aura.isExpanding);
      drawAuraLayer(ctx, centerX, centerY, radius * 0.8, 0.3, aura.isExpanding);
      drawAuraLayer(ctx, centerX, centerY, radius * 0.6, 0.6, aura.isExpanding);

      // Draw center glow
      drawCenterGlow(ctx, centerX, centerY, radius * 0.15);

      // Draw pulse rings if expanding
      if (aura.isExpanding) {
        drawExpansionPulse(ctx, centerX, centerY, radius, breathPhase);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [aura, breathPhase, morphOffset]);

  // Generate organic blob path
  const generateBlobPath = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    offset: number
  ) => {
    const points = 64;
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;

      // Multiple noise frequencies for organic feel
      const noise1 = Math.sin(angle * 3 + morphOffset + offset) * 0.08;
      const noise2 = Math.sin(angle * 5 + morphOffset * 1.5 + offset) * 0.04;
      const noise3 = Math.sin(angle * 7 + morphOffset * 0.7 + offset) * 0.02;

      const r = radius * (1 + noise1 + noise2 + noise3);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
  };

  // Draw aura layer with gradient
  const drawAuraLayer = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    layerOffset: number,
    isExpanding: boolean
  ) => {
    generateBlobPath(ctx, centerX, centerY, radius, layerOffset);

    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    // Color scheme based on state
    if (isExpanding) {
      // Expanding: warm seeking colors
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)'); // Purple center
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)'); // Pink mid
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0.05)'); // Golden edge
    } else {
      // Stable: cool confident colors
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.35)'); // Violet center
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)'); // Purple mid
      gradient.addColorStop(1, 'rgba(192, 132, 252, 0.02)'); // Light purple edge
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Draw center glow
  const drawCenterGlow = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, 'rgba(216, 180, 254, 0.6)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Draw expansion pulse
  const drawExpansionPulse = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    phase: number
  ) => {
    const pulseRadius = maxRadius * ((phase % Math.PI) / Math.PI);
    const alpha = 0.3 * (1 - pulseRadius / maxRadius);

    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Stats display
  const stats = useMemo(() => {
    if (!aura) return null;

    return {
      radius: aura.currentRadius.toFixed(1),
      users: aura.activeUsersInRange,
      density: aura.magicDensity.toFixed(2)
    };
  }, [aura]);

  return (
    <div className={`relative ${className}`}>
      {/* Canvas for aura visualization */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Center user indicator */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
          <MapPin className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Nearby user markers */}
      <AnimatePresence>
        {nearbyUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute"
            style={{
              top: `${50 + Math.sin(user.angle) * user.distance * 35}%`,
              left: `${50 + Math.cos(user.angle) * user.distance * 35}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onUserTap?.(user.id)}
          >
            <div className={`w-8 h-8 rounded-full border-2 ${
              user.isActive
                ? 'border-green-400 shadow-green-400/50'
                : 'border-gray-400'
            } shadow-lg overflow-hidden bg-gray-200`}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {user.displayName[0]}
                </div>
              )}
            </div>
            {user.isActive && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Expansion message */}
      <AnimatePresence>
        {aura?.expansionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full"
          >
            <p className="text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              {aura.expansionMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats overlay */}
      {stats && showMiniMap && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-white text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-3 h-3 text-violet-400" />
            <span>{stats.radius}km Radius</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-pink-400" />
            <span>{stats.users} aktiv</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{stats.density}/km² Magie</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-8 h-8 text-violet-400" />
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MINI AURA BADGE (For profile/nav)
// ═══════════════════════════════════════════════════════════════════════════

interface AuraBadgeProps {
  aura: AuraState | null;
  size?: 'sm' | 'md' | 'lg';
}

export const AuraBadge: React.FC<AuraBadgeProps> = ({ aura, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (!aura) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse`} />
    );
  }

  const intensity = Math.min(aura.magicDensity / 5, 1); // 0-1 scale

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full relative overflow-hidden`}
      animate={{ scale: aura.isExpanding ? [1, 1.05, 1] : 1 }}
      transition={{ duration: 1.5, repeat: aura.isExpanding ? Infinity : 0 }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle,
            rgba(168, 85, 247, ${0.3 + intensity * 0.4}) 0%,
            rgba(147, 51, 234, ${0.1 + intensity * 0.2}) 70%,
            transparent 100%
          )`
        }}
      />

      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-violet-400"
        animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Heart className="w-1/2 h-1/2 text-violet-500" fill="currentColor" />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AURA EXPANSION INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

export const AuraExpansionIndicator: React.FC<{ aura: AuraState | null }> = ({ aura }) => {
  if (!aura || !aura.isExpanding) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed top-20 left-4 right-4 z-50"
    >
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-4 shadow-lg shadow-violet-500/20">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-amber-300" />
          </motion.div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              Aura weitet sich aus...
            </p>
            <p className="text-violet-200 text-xs">
              {aura.nearestHotspot
                ? `Hotspot ${aura.nearestHotspot.distanceKm.toFixed(1)}km entfernt gefunden`
                : 'Suche nach Magie in der Nähe'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{aura.currentRadius.toFixed(0)}km</p>
            <p className="text-violet-200 text-xs">Reichweite</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-violet-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(aura.currentRadius / aura.targetRadius) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AuraVisualization;
