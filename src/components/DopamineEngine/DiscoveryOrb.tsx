/**
 * DiscoveryOrb - The Dopamine Engine Core
 *
 * A hypnotic, breathing orb that draws users in with:
 * - Multi-layer breathing aura effect
 * - Magnetic hover response
 * - Satisfying ripple feedback on tap
 * - Subtle particle effects
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DiscoveryOrbProps {
  onTrigger: () => void;
  pulseIntensity?: 'calm' | 'active' | 'intense';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const DiscoveryOrb: React.FC<DiscoveryOrbProps> = ({
  onTrigger,
  pulseIntensity = 'active',
  size = 'lg',
  label = 'Entdecken'
}) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isPressed, setIsPressed] = useState(false);

  // Magnetic hover effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Size configurations
  const sizeConfig = {
    sm: { orb: 'w-20 h-20', aura: 'w-28 h-28', icon: 'text-2xl' },
    md: { orb: 'w-28 h-28', aura: 'w-40 h-40', icon: 'text-3xl' },
    lg: { orb: 'w-36 h-36', aura: 'w-52 h-52', icon: 'text-4xl' },
  };

  // Pulse speed based on intensity
  const pulseConfig = {
    calm: { duration: 5, scale: 1.3 },
    active: { duration: 3.5, scale: 1.5 },
    intense: { duration: 2, scale: 1.8 },
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    x.set(deltaX);
    y.set(deltaY);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const rippleX = e.clientX - rect.left;
    const rippleY = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x: rippleX, y: rippleY };
    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);

    onTrigger();
  }, [onTrigger]);

  const config = sizeConfig[size];
  const pulse = pulseConfig[pulseIntensity];

  return (
    <div
      className="relative flex flex-col items-center justify-center py-8"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Multi-Layer Breathing Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${config.aura} rounded-full`}
            style={{
              background: `radial-gradient(circle, rgba(139, 92, 246, ${0.15 - i * 0.03}) 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
            animate={{
              scale: [1, pulse.scale + i * 0.2, 1],
              opacity: [0.3 - i * 0.05, 0.05, 0.3 - i * 0.05],
            }}
            transition={{
              duration: pulse.duration + i * 0.8,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Rotating Ring */}
      <motion.div
        className="absolute w-44 h-44 rounded-full"
        style={{
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderTop: '2px solid rgba(168, 85, 247, 0.6)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Secondary Rotating Ring (opposite direction) */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          border: '1px solid rgba(139, 92, 246, 0.1)',
          borderBottom: '2px solid rgba(192, 132, 252, 0.4)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* The Main Orb */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="relative z-10"
      >
        <motion.button
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onClick={handleTap}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`relative ${config.orb} rounded-full flex items-center justify-center overflow-hidden`}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%)',
            boxShadow: isPressed
              ? '0 0 40px rgba(139, 92, 246, 0.8), inset 0 0 30px rgba(0,0,0,0.3)'
              : '0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)',
            border: '3px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Inner Glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />

          {/* Noise Texture */}
          <div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              backgroundImage: 'url(/patterns/noise.png)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />

          {/* Ripple Effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-10 h-10 rounded-full bg-white/30"
                style={{
                  left: ripple.x - 20,
                  top: ripple.y - 20,
                }}
              />
            ))}
          </AnimatePresence>

          {/* Icon */}
          <motion.span
            className={`${config.icon} filter drop-shadow-lg relative z-10`}
            animate={{
              y: [0, -3, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            ☁️
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Label with Glow */}
      <motion.p
        className="mt-6 text-sm font-medium tracking-wide"
        style={{
          color: 'rgba(168, 85, 247, 0.9)',
          textShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {label}
      </motion.p>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/60"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DiscoveryOrb;
