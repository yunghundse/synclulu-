/**
 * LightBridge.tsx
 * Visuelle Verbindung zwischen zwei Usern während eines Syncs
 * Dopamin-ausschüttende Animation wenn zwei User synchronisieren
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface LightBridgeProps {
  from: Point;
  to: Point;
  isActive: boolean;
  intensity?: 'low' | 'medium' | 'high';
  color?: string;
}

// Berechne Winkel und Länge zwischen zwei Punkten
function calculateBridge(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return { length, angle };
}

// Partikel die entlang der Brücke fließen
const BridgeParticle = React.memo(function BridgeParticle({
  length,
  delay,
  color,
}: {
  length: number;
  delay: number;
  color: string;
}) {
  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
      style={{
        background: `radial-gradient(circle, white 0%, ${color} 50%, transparent 100%)`,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
      }}
      initial={{ left: -10, opacity: 0, scale: 0 }}
      animate={{
        left: [0, length],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.5],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});

// Haupt-Brücken-Linie
const BridgeLine = React.memo(function BridgeLine({
  length,
  color,
  intensity,
}: {
  length: number;
  color: string;
  intensity: 'low' | 'medium' | 'high';
}) {
  const glowIntensity = {
    low: { blur: 10, spread: 20 },
    medium: { blur: 15, spread: 30 },
    high: { blur: 20, spread: 40 },
  }[intensity];

  return (
    <>
      {/* Haupt-Linie */}
      <motion.div
        className="absolute top-1/2 left-0 h-[2px] origin-left"
        style={{
          width: length,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${color}80 10%,
            ${color} 50%,
            ${color}80 90%,
            transparent 100%
          )`,
          transform: 'translateY(-50%)',
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glow Layer 1 */}
      <motion.div
        className="absolute top-1/2 left-0 h-[6px] origin-left"
        style={{
          width: length,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${color}40 20%,
            ${color}60 50%,
            ${color}40 80%,
            transparent 100%
          )`,
          filter: `blur(${glowIntensity.blur}px)`,
          transform: 'translateY(-50%)',
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glow Layer 2 - Outer */}
      <motion.div
        className="absolute top-1/2 left-0 h-[20px] origin-left pointer-events-none"
        style={{
          width: length,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${color}20 30%,
            ${color}30 50%,
            ${color}20 70%,
            transparent 100%
          )`,
          filter: `blur(${glowIntensity.spread}px)`,
          transform: 'translateY(-50%)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
});

// Sync-Burst Effekt beim Verbinden
const SyncBurst = React.memo(function SyncBurst({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Innerer Burst */}
      <motion.div
        className="absolute w-4 h-4 rounded-full"
        style={{
          background: 'white',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Äußerer Ring */}
      <motion.div
        className="absolute w-8 h-8 rounded-full border-2"
        style={{
          borderColor: color,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 20px ${color}`,
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      />

      {/* Partikel-Burst */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 60;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              left: '50%',
              top: '50%',
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        );
      })}
    </motion.div>
  );
});

export const LightBridge = React.memo(function LightBridge({
  from,
  to,
  isActive,
  intensity = 'medium',
  color = '#a855f7',
}: LightBridgeProps) {
  const { length, angle } = useMemo(
    () => calculateBridge(from, to),
    [from.x, from.y, to.x, to.y]
  );

  const [showBurst, setShowBurst] = React.useState(false);
  const wasActive = useRef(isActive);

  // Zeige Burst wenn Verbindung hergestellt wird
  useEffect(() => {
    if (isActive && !wasActive.current) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 800);
    }
    wasActive.current = isActive;
  }, [isActive]);

  // Anzahl der Partikel basierend auf Intensität
  const particleCount = { low: 2, medium: 4, high: 6 }[intensity];

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Bridge Container */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: from.x,
              top: from.y,
              transformOrigin: '0 50%',
              transform: `rotate(${angle}deg)`,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Brücken-Linie */}
            <BridgeLine length={length} color={color} intensity={intensity} />

            {/* Fließende Partikel */}
            {[...Array(particleCount)].map((_, i) => (
              <BridgeParticle
                key={i}
                length={length}
                delay={i * (2 / particleCount)}
                color={color}
              />
            ))}
          </motion.div>

          {/* Sync-Burst Effekte an beiden Enden */}
          {showBurst && (
            <>
              <SyncBurst x={from.x} y={from.y} color={color} />
              <SyncBurst x={to.x} y={to.y} color={color} />
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
});

export default LightBridge;
