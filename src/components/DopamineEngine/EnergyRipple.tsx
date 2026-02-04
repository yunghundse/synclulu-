/**
 * EnergyRipple - Global Tap Feedback
 *
 * Creates a satisfying energy wave that spreads across the screen
 * Triggers on Discovery Orb activation for maximum dopamine hit
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnergyRippleProps {
  isActive: boolean;
  color?: string;
  onComplete?: () => void;
}

export const EnergyRipple: React.FC<EnergyRippleProps> = ({
  isActive,
  color = 'rgba(139, 92, 246, 0.3)',
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Central Explosion */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 50, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            onAnimationComplete={onComplete}
          />

          {/* Ring Wave 1 */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              borderRadius: '50%',
              border: `2px solid ${color}`,
            }}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 20, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
          />

          {/* Ring Wave 2 */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              borderRadius: '50%',
              border: `1px solid ${color}`,
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 25, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          />

          {/* Particle Burst */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  marginLeft: -4,
                  marginTop: -4,
                  background: color,
                  boxShadow: `0 0 10px ${color}`,
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                  delay: 0.05 * i,
                }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnergyRipple;
