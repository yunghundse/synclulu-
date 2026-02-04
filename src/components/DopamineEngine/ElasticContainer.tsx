/**
 * ElasticContainer - Physics-Based Elastic Inertia
 *
 * Implements real-world physics for navigation:
 * - Elastic overshoot on scroll
 * - Bouncy deceleration
 * - Rubber-band edge behavior
 * - MIT-level satisfaction
 */

import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';

interface ElasticContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical' | 'both';
  elasticity?: number; // 0-1, how bouncy
  friction?: number; // Higher = faster stop
  onOverscroll?: (direction: 'left' | 'right' | 'top' | 'bottom') => void;
}

export const ElasticContainer: React.FC<ElasticContainerProps> = ({
  children,
  className = '',
  direction = 'vertical',
  elasticity = 0.3,
  friction = 0.92,
  onOverscroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Motion values for position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring configuration for elastic feel
  const springConfig = {
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  };

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Rotation based on velocity for 3D feel
  const rotateX = useTransform(springY, [-100, 100], [3, -3]);
  const rotateY = useTransform(springX, [-100, 100], [-3, 3]);

  // Scale based on drag intensity
  const scale = useTransform(
    [springX, springY],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX ** 2 + latestY ** 2);
      return 1 - Math.min(distance * 0.0005, 0.03);
    }
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const maxOffset = 150;
    const dampedX = Math.sign(info.offset.x) * Math.min(Math.abs(info.offset.x) * elasticity, maxOffset);
    const dampedY = Math.sign(info.offset.y) * Math.min(Math.abs(info.offset.y) * elasticity, maxOffset);

    if (direction === 'horizontal' || direction === 'both') {
      x.set(dampedX);
    }
    if (direction === 'vertical' || direction === 'both') {
      y.set(dampedY);
    }
  }, [direction, elasticity, x, y]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Detect overscroll direction
    const threshold = 50;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.offset.y) > threshold) {
      if (info.offset.x > threshold) onOverscroll?.('right');
      if (info.offset.x < -threshold) onOverscroll?.('left');
      if (info.offset.y > threshold) onOverscroll?.('bottom');
      if (info.offset.y < -threshold) onOverscroll?.('top');
    }

    // Elastic snap back with overshoot
    x.set(0);
    y.set(0);
  }, [onOverscroll, x, y]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        x: springX,
        y: springY,
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      drag={direction === 'both' ? true : direction === 'horizontal' ? 'x' : 'y'}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={elasticity}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.99 }}
    >
      {children}

      {/* Edge glow on drag */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-inherit"
        style={{
          background: `
            radial-gradient(ellipse at ${springX.get() > 0 ? '0%' : '100%'} 50%,
              rgba(168, 85, 247, ${isDragging ? 0.3 : 0}) 0%,
              transparent 50%)
          `,
        }}
        animate={{
          opacity: isDragging ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

// Elastic scroll view with momentum
export const ElasticScrollView: React.FC<{
  children: React.ReactNode;
  className?: string;
  showScrollIndicator?: boolean;
}> = ({ children, className = '', showScrollIndicator = true }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const progress = scrollTop / (scrollHeight - clientHeight);
    setScrollProgress(progress);
    setIsScrolling(true);

    // Reset scrolling state after delay
    const timeout = setTimeout(() => setIsScrolling(false), 150);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide"
        onScroll={handleScroll}
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </motion.div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <motion.div
          className="absolute right-1 top-4 bottom-4 w-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          animate={{ opacity: isScrolling ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full rounded-full"
            style={{
              height: '30%',
              background: 'linear-gradient(180deg, #a855f7 0%, #6366f1 100%)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
              y: `${scrollProgress * 230}%`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ElasticContainer;
