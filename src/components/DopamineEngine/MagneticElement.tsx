/**
 * MagneticElement - Hover-Glow with Magnet Physics
 *
 * Wraps any element with magnetic cursor attraction
 * Creates the "liquid interface" feel
 */

import React, { useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagneticElementProps {
  children: React.ReactNode;
  intensity?: number;
  glowColor?: string;
  className?: string;
  onClick?: () => void;
}

export const MagneticElement: React.FC<MagneticElementProps> = ({
  children,
  intensity = 0.3,
  glowColor = 'rgba(139, 92, 246, 0.4)',
  className = '',
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const springConfig = { stiffness: 350, damping: 25 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springScale = useSpring(scale, springConfig);

  // Glow effect based on hover position
  const glowOpacity = useTransform(scale, [1, 1.05], [0, 0.8]);
  const glowSize = useTransform(scale, [1, 1.05], [0, 30]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * intensity;
    const deltaY = (e.clientY - centerY) * intensity;

    x.set(deltaX);
    y.set(deltaY);
    scale.set(1.03);
  }, [intensity, x, y, scale]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
  }, [x, y, scale]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        x: springX,
        y: springY,
        scale: springScale,
      }}
      className={`relative cursor-pointer ${className}`}
    >
      {/* Hover Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: useTransform(
            glowSize,
            (size) => `0 0 ${size}px ${glowColor}`
          ),
          opacity: glowOpacity,
        }}
      />

      {children}
    </motion.div>
  );
};

export default MagneticElement;
