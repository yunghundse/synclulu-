/**
 * ParallaxContainer - Deep Parallax Effect
 *
 * Creates real spatial depth by responding to device motion
 * Elements shift based on device tilt for that premium 3D feel
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ParallaxContainerProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

interface ParallaxLayerProps {
  children: React.ReactNode;
  depth?: number; // 0 = no movement, 1 = max movement
  className?: string;
}

// Context for sharing motion values
const ParallaxContext = React.createContext<{
  tiltX: ReturnType<typeof useMotionValue<number>>;
  tiltY: ReturnType<typeof useMotionValue<number>>;
} | null>(null);

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  intensity = 15,
  className = '',
}) => {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30 };
  const smoothTiltX = useSpring(tiltX, springConfig);
  const smoothTiltY = useSpring(tiltY, springConfig);

  // Device motion handler
  useEffect(() => {
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma is left-right tilt (-90 to 90)
        // beta is front-back tilt (-180 to 180)
        const normalizedX = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
        const normalizedY = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 45));

        tiltX.set(normalizedX * intensity);
        tiltY.set(normalizedY * intensity);
      }
    };

    // Mouse fallback for desktop
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const normalizedX = (e.clientX - centerX) / centerX;
      const normalizedY = (e.clientY - centerY) / centerY;

      tiltX.set(normalizedX * intensity * 0.5);
      tiltY.set(normalizedY * intensity * 0.5);
    };

    // Try device orientation first
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // @ts-ignore - requestPermission is iOS specific
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires permission
        // We'll use mouse fallback, user can trigger permission separately
        window.addEventListener('mousemove', handleMouseMove);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        window.addEventListener('mousemove', handleMouseMove);
      }
    } else {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [intensity, tiltX, tiltY]);

  return (
    <ParallaxContext.Provider value={{ tiltX: smoothTiltX, tiltY: smoothTiltY }}>
      <div className={`relative ${className}`}>
        {children}
      </div>
    </ParallaxContext.Provider>
  );
};

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  depth = 0.5,
  className = '',
}) => {
  const context = React.useContext(ParallaxContext);

  if (!context) {
    return <div className={className}>{children}</div>;
  }

  const { tiltX, tiltY } = context;

  const x = useTransform(tiltX, (value) => value * depth);
  const y = useTransform(tiltY, (value) => value * depth);

  return (
    <motion.div
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxContainer;
