/**
 * EchoWaves - Activity Visualization
 *
 * Visual echoes that appear on the map when users are nearby
 * Creates the feeling: "Here, life is happening"
 * Apple-level smooth animations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EchoWavePoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  intensity: 'low' | 'medium' | 'high' | 'pulse';
  label?: string;
}

interface EchoWavesProps {
  points: EchoWavePoint[];
  className?: string;
}

export const EchoWaves: React.FC<EchoWavesProps> = ({
  points,
  className = '',
}) => {
  const intensityConfig = {
    low: {
      rings: 2,
      color: 'rgba(139, 92, 246, 0.3)',
      maxScale: 2,
      duration: 4,
    },
    medium: {
      rings: 3,
      color: 'rgba(168, 85, 247, 0.4)',
      maxScale: 2.5,
      duration: 3,
    },
    high: {
      rings: 4,
      color: 'rgba(192, 132, 252, 0.5)',
      maxScale: 3,
      duration: 2.5,
    },
    pulse: {
      rings: 5,
      color: 'rgba(236, 72, 153, 0.5)',
      maxScale: 3.5,
      duration: 2,
    },
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <AnimatePresence>
        {points.map((point) => {
          const config = intensityConfig[point.intensity];

          return (
            <div
              key={point.id}
              className="absolute"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Echo Rings */}
              {[...Array(config.rings)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    left: -10,
                    top: -10,
                    border: `1.5px solid ${config.color}`,
                    boxShadow: `0 0 10px ${config.color}`,
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: [0.5, config.maxScale],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: config.duration,
                    repeat: Infinity,
                    delay: i * (config.duration / config.rings),
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Center Dot */}
              <motion.div
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: -6,
                  top: -6,
                  background: config.color.replace('0.', '0.9'),
                  boxShadow: `0 0 15px ${config.color}`,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Label */}
              {point.label && (
                <motion.div
                  className="absolute whitespace-nowrap"
                  style={{
                    top: 15,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      color: config.color.replace('0.', '1'),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${config.color}`,
                    }}
                  >
                    {point.label}
                  </span>
                </motion.div>
              )}
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Single Wave Component for standalone use
export const SingleEchoWave: React.FC<{
  color?: string;
  size?: number;
  className?: string;
}> = ({
  color = 'rgba(168, 85, 247, 0.5)',
  size = 60,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${color}`,
          }}
          animate={{
            scale: [1, 2.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
      <div
        className="absolute rounded-full"
        style={{
          width: 8,
          height: 8,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: color.replace('0.5', '0.9'),
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
};

export default EchoWaves;
