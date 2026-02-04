/**
 * FrostedObsidianCard - Ultra-Premium Glass UI
 *
 * The Apple-level glassmorphism card:
 * - 80% transparency
 * - 50px blur
 * - Glowing edge that activates on interaction
 * - Smooth hover state transitions
 */

import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface FrostedObsidianCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  enableHoverLift?: boolean;
  enableMagnetic?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const FrostedObsidianCard: React.FC<FrostedObsidianCardProps> = ({
  children,
  className = '',
  onClick,
  glowColor = '#A855F7',
  enableHoverLift = true,
  enableMagnetic = true,
  padding = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 400, damping: 30 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Glow intensity
  const glowOpacity = useSpring(isHovered ? 1 : 0, { stiffness: 300, damping: 30 });

  const paddingConfig = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMagnetic) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.05);
    y.set((e.clientY - centerY) * 0.05);
  }, [enableMagnetic, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        x: enableMagnetic ? springX : 0,
        y: enableMagnetic ? springY : 0,
      }}
      animate={{
        scale: isPressed ? 0.98 : isHovered && enableHoverLift ? 1.02 : 1,
        y: isHovered && enableHoverLift ? -2 : 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        relative overflow-hidden rounded-2xl
        ${paddingConfig[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Base Glass Layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(50px)',
          WebkitBackdropFilter: 'blur(50px)',
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.02) 50%,
            rgba(0, 0, 0, 0.1) 100%)`,
        }}
      />

      {/* Glowing Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: `1px solid ${glowColor}`,
          opacity: glowOpacity,
          boxShadow: `
            0 0 20px ${glowColor}40,
            inset 0 0 20px ${glowColor}10
          `,
        }}
      />

      {/* Default Border (subtle) */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Shimmer on Hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 40%,
              rgba(255, 255, 255, 0.05) 50%,
              transparent 60%
            )`,
          }}
          animate={{
            x: isHovered ? ['0%', '200%'] : '0%',
          }}
          transition={{
            duration: 1,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Compact Card Variant
export const FrostedObsidianPill: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}> = ({
  children,
  className = '',
  onClick,
  glowColor = '#A855F7',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden rounded-full px-4 py-2
        ${className}
      `}
    >
      {/* Glass Background */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      />

      {/* Glow Border */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${isHovered ? glowColor : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isHovered ? `0 0 15px ${glowColor}40` : 'none',
        }}
        animate={{ opacity: isHovered ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default FrostedObsidianCard;
