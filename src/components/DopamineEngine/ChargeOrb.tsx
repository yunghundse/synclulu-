/**
 * ChargeOrb - Hold-to-Charge Discovery Orb
 *
 * An evolved orb that charges up when held:
 * - Glow intensity increases with hold duration
 * - Haptic-style visual feedback
 * - Releases discovery menu at full charge
 * - Apple-level polish and satisfaction
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ChargeOrbProps {
  onFullCharge: () => void;
  onTap?: () => void;
  chargeTime?: number; // ms to full charge
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const ChargeOrb: React.FC<ChargeOrbProps> = ({
  onFullCharge,
  onTap,
  chargeTime = 800,
  size = 'lg',
  label = 'Entdecken',
}) => {
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [isFullyCharged, setIsFullyCharged] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const chargeInterval = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  // Magnetic hover
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 400, damping: 30 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Glow intensity based on charge
  const glowIntensity = useTransform(
    useMotionValue(chargeLevel),
    [0, 100],
    [0.4, 1]
  );

  const sizeConfig = {
    sm: { orb: 'w-24 h-24', aura: 'w-36 h-36', icon: 'text-3xl' },
    md: { orb: 'w-32 h-32', aura: 'w-48 h-48', icon: 'text-4xl' },
    lg: { orb: 'w-40 h-40', aura: 'w-56 h-56', icon: 'text-5xl' },
  };

  const config = sizeConfig[size];

  // Start charging
  const handlePointerDown = useCallback(() => {
    setIsCharging(true);
    setIsFullyCharged(false);
    startTime.current = Date.now();

    chargeInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min((elapsed / chargeTime) * 100, 100);
      setChargeLevel(progress);

      if (progress >= 100) {
        setIsFullyCharged(true);
        setShowRipple(true);
        if (chargeInterval.current) {
          clearInterval(chargeInterval.current);
        }
        // Trigger haptic-style feedback
        if (navigator.vibrate) {
          navigator.vibrate([10, 30, 20]);
        }
        setTimeout(() => {
          onFullCharge();
        }, 200);
      }
    }, 16);
  }, [chargeTime, onFullCharge]);

  // Stop charging
  const handlePointerUp = useCallback(() => {
    setIsCharging(false);
    if (chargeInterval.current) {
      clearInterval(chargeInterval.current);
    }

    // If not fully charged, it's a tap
    if (chargeLevel < 100 && chargeLevel < 30 && onTap) {
      onTap();
    }

    // Reset charge
    setChargeLevel(0);
    setIsFullyCharged(false);
  }, [chargeLevel, onTap]);

  // Magnetic hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.1);
    y.set((e.clientY - centerY) * 0.1);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chargeInterval.current) {
        clearInterval(chargeInterval.current);
      }
    };
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center py-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer Aura Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${config.aura} rounded-full`}
            style={{
              background: `radial-gradient(circle, rgba(168, 85, 247, ${0.12 - i * 0.02}) 0%, transparent 70%)`,
              filter: 'blur(15px)',
            }}
            animate={{
              scale: isCharging
                ? [1, 1.3 + (chargeLevel / 100) * 0.3, 1]
                : [1, 1.3, 1],
              opacity: isCharging
                ? [0.3 + (chargeLevel / 100) * 0.4, 0.1, 0.3 + (chargeLevel / 100) * 0.4]
                : [0.2, 0.05, 0.2],
            }}
            transition={{
              duration: isCharging ? 1 : 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Charge Progress Ring */}
      <svg
        className="absolute w-52 h-52 -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="2"
        />
        {/* Progress Ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#chargeGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${chargeLevel * 2.83} ${283 - chargeLevel * 2.83}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isCharging ? 1 : 0 }}
          style={{
            filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))',
          }}
        />
        <defs>
          <linearGradient id="chargeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Orb */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="relative z-10"
      >
        <motion.button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          animate={{
            scale: isCharging ? 0.95 + (chargeLevel / 100) * 0.15 : 1,
          }}
          whileHover={{ scale: 1.05 }}
          className={`relative ${config.orb} rounded-full flex items-center justify-center overflow-hidden touch-none select-none`}
          style={{
            background: `linear-gradient(135deg,
              rgba(124, 58, 237, ${0.9 + chargeLevel / 200}) 0%,
              rgba(168, 85, 247, ${0.85 + chargeLevel / 200}) 50%,
              rgba(99, 102, 241, ${0.8 + chargeLevel / 200}) 100%)`,
            boxShadow: `
              0 0 ${40 + chargeLevel * 0.6}px rgba(139, 92, 246, ${0.5 + chargeLevel / 200}),
              0 0 ${80 + chargeLevel}px rgba(168, 85, 247, ${0.3 + chargeLevel / 300}),
              inset 0 0 ${20 + chargeLevel / 3}px rgba(255, 255, 255, ${0.1 + chargeLevel / 500})
            `,
            border: `3px solid rgba(255, 255, 255, ${0.2 + chargeLevel / 400})`,
          }}
        >
          {/* Inner Shine */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
            }}
          />

          {/* Charge Overlay */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%)',
            }}
            animate={{
              opacity: chargeLevel / 100,
              scale: [1, 1.1, 1],
            }}
            transition={{
              scale: { duration: 0.3, repeat: Infinity },
            }}
          />

          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            }}
            animate={{
              x: isCharging ? ['0%', '200%'] : ['-100%', '200%'],
            }}
            transition={{
              duration: isCharging ? 0.5 : 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Icon */}
          <motion.span
            className={`${config.icon} filter drop-shadow-lg relative z-10`}
            animate={{
              scale: isFullyCharged ? [1, 1.3, 1] : 1,
              rotate: isCharging ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: isCharging ? 0.5 : 0.3,
              repeat: isCharging ? Infinity : 0,
            }}
          >
            ☁️
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Full Charge Ripple */}
      <AnimatePresence>
        {showRipple && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-40 h-40 rounded-full border-2 border-purple-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                onAnimationComplete={() => i === 2 && setShowRipple(false)}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.p
        className="mt-6 text-sm font-medium tracking-widest uppercase"
        style={{
          color: 'rgba(192, 132, 252, 0.9)',
          textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
          fontFamily: "'SF Pro Display', 'Inter', sans-serif",
          letterSpacing: '0.2em',
        }}
        animate={{
          opacity: isCharging ? [0.7, 1, 0.7] : [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: isCharging ? 0.5 : 2,
          repeat: Infinity,
        }}
      >
        {isCharging ? (chargeLevel < 100 ? 'Lade...' : 'Los!') : label}
      </motion.p>

      {/* Instruction */}
      <motion.p
        className="mt-2 text-xs"
        style={{
          color: 'rgba(168, 85, 247, 0.5)',
          fontFamily: "'SF Pro Display', 'Inter', sans-serif",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Gedrückt halten zum Aufladen
      </motion.p>
    </div>
  );
};

export default ChargeOrb;
