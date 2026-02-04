/**
 * HapticGradient - Finger-Proximity Glow Effect
 *
 * UI elements change brightness based on finger proximity:
 * - Radial glow follows cursor/touch
 * - Intensity increases near interactive elements
 * - Creates tactile feedback without haptics
 */

import React, { useCallback, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HapticGradientProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number; // 0-1
  radius?: number; // glow radius in px
}

export const HapticGradient: React.FC<HapticGradientProps> = ({
  children,
  className = '',
  glowColor = 'rgba(168, 85, 247, 0.4)',
  intensity = 0.8,
  radius = 150,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Cursor position
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Spring smoothing
  const springConfig = { stiffness: 300, damping: 30 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  // Glow opacity
  const glowOpacity = useSpring(isHovered ? intensity : 0, { stiffness: 200, damping: 25 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
  }, [cursorX, cursorY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    cursorX.set(e.touches[0].clientX - rect.left);
    cursorY.set(e.touches[0].clientY - rect.top);
    setIsHovered(true);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Haptic Glow Layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: useTransform(
            [smoothX, smoothY, glowOpacity],
            ([x, y, opacity]: number[]) =>
              `radial-gradient(circle ${radius}px at ${x}px ${y}px, ${glowColor.replace(')', `, ${opacity})`)} 0%, transparent 100%)`
          ),
        }}
      />

      {/* Secondary ring */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: useTransform(
            [smoothX, smoothY, glowOpacity],
            ([x, y, opacity]: number[]) =>
              `radial-gradient(circle ${radius * 0.3}px at ${x}px ${y}px, rgba(255,255,255,${opacity * 0.15}) 0%, transparent 100%)`
          ),
        }}
      />

      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </motion.div>
  );
};

// Haptic Button with proximity glow
export const HapticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  glowColor?: string;
}> = ({
  children,
  onClick,
  className = '',
  glowColor = '#A855F7',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [proximity, setProximity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
    );
    const maxDistance = 200;
    const prox = Math.max(0, 1 - distance / maxDistance);
    setProximity(prox);
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setProximity(0)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden ${className}`}
      style={{
        boxShadow: `0 0 ${20 + proximity * 30}px ${glowColor}${Math.floor(proximity * 99).toString(16).padStart(2, '0')}`,
        borderColor: `${glowColor}${Math.floor(proximity * 255).toString(16).padStart(2, '0')}`,
      }}
    >
      {/* Proximity glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}${Math.floor(proximity * 50).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// Full-screen haptic overlay for immersive feel
export const HapticOverlay: React.FC<{
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}> = ({
  className = '',
  primaryColor = 'rgba(168, 85, 247, 0.15)',
  secondaryColor = 'rgba(139, 92, 246, 0.1)',
}) => {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    setCursor({ x: clientX, y: clientY });
  }, []);

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      style={{
        background: `
          radial-gradient(circle 300px at ${cursor.x}px ${cursor.y}px, ${primaryColor} 0%, transparent 100%),
          radial-gradient(circle 150px at ${cursor.x}px ${cursor.y}px, ${secondaryColor} 0%, transparent 100%)
        `,
      }}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    />
  );
};

export default HapticGradient;
