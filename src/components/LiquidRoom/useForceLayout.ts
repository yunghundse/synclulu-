/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FORCE-DIRECTED LAYOUT HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Physics-based layout where avatars:
 * - Gravitate toward center
 * - Repel each other (min 20px spacing)
 * - Speaking users get slightly more space
 * - Smooth spring animations
 *
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RoomParticipant } from './LiquidRoomExperience';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Position {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LayoutConfig {
  centerGravity: number;      // Attraction to center
  repulsionStrength: number;  // Push away from others
  minDistance: number;        // Minimum distance between nodes
  damping: number;            // Velocity damping
  speakingBonus: number;      // Extra space for speaking users
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: LayoutConfig = {
  centerGravity: 0.02,
  repulsionStrength: 2000,
  minDistance: 120,
  damping: 0.85,
  speakingBonus: 30,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORCE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate repulsion force between two points
 */
function calculateRepulsion(
  p1: Position,
  p2: Position,
  minDist: number,
  strength: number
): { fx: number; fy: number } {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;

  if (distance > minDist * 2) {
    return { fx: 0, fy: 0 };
  }

  // Inverse square law with minimum distance
  const force = strength / (distance * distance);
  const fx = (dx / distance) * force;
  const fy = (dy / distance) * force;

  return { fx, fy };
}

/**
 * Calculate gravity toward center
 */
function calculateGravity(
  p: Position,
  center: { x: number; y: number },
  strength: number
): { fx: number; fy: number } {
  const dx = center.x - p.x;
  const dy = center.y - p.y;

  return {
    fx: dx * strength,
    fy: dy * strength,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIAL POSITION GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate initial positions in a circle around center
 */
function generateInitialPositions(
  count: number,
  containerSize: { width: number; height: number }
): Position[] {
  const center = { x: containerSize.width / 2, y: containerSize.height / 2 };
  const radius = Math.min(containerSize.width, containerSize.height) * 0.25;

  return [...Array(count)].map((_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const jitter = (Math.random() - 0.5) * 20;

    return {
      x: center.x + Math.cos(angle) * (radius + jitter),
      y: center.y + Math.sin(angle) * (radius + jitter),
      vx: 0,
      vy: 0,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useForceLayout(
  participants: RoomParticipant[],
  containerSize: { width: number; height: number },
  config: Partial<LayoutConfig> = {}
): { x: number; y: number }[] {
  const [positions, setPositions] = useState<Position[]>([]);
  const animationRef = useRef<number | null>(null);
  const configRef = useRef<LayoutConfig>({ ...DEFAULT_CONFIG, ...config });

  // Update config when props change
  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...config };
  }, [config]);

  // Initialize or update positions when participants change
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;

    setPositions(prev => {
      // If we have existing positions for some participants, keep them
      if (prev.length > 0 && prev.length <= participants.length) {
        const newPositions = [...prev];

        // Add positions for new participants
        while (newPositions.length < participants.length) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.min(containerSize.width, containerSize.height) * 0.2;
          newPositions.push({
            x: containerSize.width / 2 + Math.cos(angle) * radius,
            y: containerSize.height / 2 + Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
          });
        }

        return newPositions.slice(0, participants.length);
      }

      // Generate fresh positions
      return generateInitialPositions(participants.length, containerSize);
    });
  }, [participants.length, containerSize.width, containerSize.height]);

  // Physics simulation loop
  useEffect(() => {
    if (positions.length === 0 || containerSize.width === 0) return;

    const center = {
      x: containerSize.width / 2,
      y: containerSize.height / 2,
    };

    const simulate = () => {
      setPositions(prev => {
        const newPositions = prev.map((p, i) => {
          let fx = 0;
          let fy = 0;

          // Gravity toward center
          const gravity = calculateGravity(p, center, configRef.current.centerGravity);
          fx += gravity.fx;
          fy += gravity.fy;

          // Repulsion from other nodes
          prev.forEach((other, j) => {
            if (i === j) return;

            const isSpeaking = participants[i]?.isSpeaking;
            const otherSpeaking = participants[j]?.isSpeaking;
            const bonus = (isSpeaking ? configRef.current.speakingBonus : 0) +
                         (otherSpeaking ? configRef.current.speakingBonus : 0);

            const repulsion = calculateRepulsion(
              p,
              other,
              configRef.current.minDistance + bonus,
              configRef.current.repulsionStrength
            );
            fx += repulsion.fx;
            fy += repulsion.fy;
          });

          // Boundary repulsion
          const margin = 80;
          if (p.x < margin) fx += (margin - p.x) * 0.1;
          if (p.x > containerSize.width - margin) fx -= (p.x - (containerSize.width - margin)) * 0.1;
          if (p.y < margin + 60) fy += (margin + 60 - p.y) * 0.1; // Extra top margin for header
          if (p.y > containerSize.height - margin - 80) fy -= (p.y - (containerSize.height - margin - 80)) * 0.1; // Extra bottom for controls

          // Update velocity with damping
          const vx = (p.vx + fx) * configRef.current.damping;
          const vy = (p.vy + fy) * configRef.current.damping;

          // Clamp velocity
          const maxVelocity = 10;
          const clampedVx = Math.max(-maxVelocity, Math.min(maxVelocity, vx));
          const clampedVy = Math.max(-maxVelocity, Math.min(maxVelocity, vy));

          // Update position
          let newX = p.x + clampedVx;
          let newY = p.y + clampedVy;

          // Keep within bounds
          newX = Math.max(margin, Math.min(containerSize.width - margin, newX));
          newY = Math.max(margin + 60, Math.min(containerSize.height - margin - 80, newY));

          return {
            x: newX,
            y: newY,
            vx: clampedVx,
            vy: clampedVy,
          };
        });

        return newPositions;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [positions.length, containerSize, participants]);

  // Return simplified position objects
  return positions.map(p => ({ x: p.x, y: p.y }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET LAYOUTS
// ═══════════════════════════════════════════════════════════════════════════════

export const LAYOUT_PRESETS = {
  // Relaxed layout for few participants
  cozy: {
    centerGravity: 0.01,
    repulsionStrength: 3000,
    minDistance: 150,
    damping: 0.9,
    speakingBonus: 40,
  },

  // Tight layout for many participants
  compact: {
    centerGravity: 0.03,
    repulsionStrength: 1500,
    minDistance: 90,
    damping: 0.8,
    speakingBonus: 20,
  },

  // Energetic layout with more movement
  dynamic: {
    centerGravity: 0.015,
    repulsionStrength: 2500,
    minDistance: 120,
    damping: 0.75,
    speakingBonus: 35,
  },
};

export default useForceLayout;
