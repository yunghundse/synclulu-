/**
 * AuraTrails - Breathing City Activity Visualization
 *
 * Dezent leuchtende Pfade, die zeigen, wo in den letzten
 * 5 Minuten Aktivität war. Die Stadt atmet.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ActivityPoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  timestamp: number; // ms ago
  intensity: number; // 0-1
}

interface AuraTrailsProps {
  activities: ActivityPoint[];
  maxAge?: number; // max age in ms (default 5 min)
  className?: string;
}

export const AuraTrails: React.FC<AuraTrailsProps> = ({
  activities,
  maxAge = 5 * 60 * 1000, // 5 minutes
  className = '',
}) => {
  // Calculate opacity based on age
  const processedActivities = useMemo(() => {
    return activities.map(activity => {
      const age = activity.timestamp;
      const ageRatio = Math.min(age / maxAge, 1);
      const opacity = (1 - ageRatio) * activity.intensity * 0.6;
      const size = 40 + (1 - ageRatio) * 60; // Newer = larger

      return {
        ...activity,
        opacity,
        size,
        ageRatio,
      };
    });
  }, [activities, maxAge]);

  // Generate connection paths between nearby activities
  const connections = useMemo(() => {
    const paths: { from: ActivityPoint; to: ActivityPoint; strength: number }[] = [];
    const maxDistance = 25; // percentage units

    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const dx = activities[i].x - activities[j].x;
        const dy = activities[i].y - activities[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const strength = 1 - distance / maxDistance;
          paths.push({
            from: activities[i],
            to: activities[j],
            strength: strength * 0.3,
          });
        }
      }
    }

    return paths;
  }, [activities]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Connection Lines - Neural Network Feel */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
        </defs>

        {connections.map((connection, index) => (
          <motion.line
            key={`connection-${index}`}
            x1={`${connection.from.x}%`}
            y1={`${connection.from.y}%`}
            x2={`${connection.to.x}%`}
            y2={`${connection.to.y}%`}
            stroke="url(#trailGradient)"
            strokeWidth={connection.strength * 3}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: connection.strength }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        ))}
      </svg>

      {/* Activity Auras */}
      {processedActivities.map((activity) => (
        <motion.div
          key={activity.id}
          className="absolute"
          style={{
            left: `${activity.x}%`,
            top: `${activity.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: activity.opacity }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Outer breathing glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: activity.size * 1.5,
              height: activity.size * 1.5,
              left: -(activity.size * 1.5) / 2,
              top: -(activity.size * 1.5) / 2,
              background: `radial-gradient(circle,
                rgba(168, 85, 247, ${activity.opacity * 0.3}) 0%,
                rgba(139, 92, 246, ${activity.opacity * 0.1}) 50%,
                transparent 70%)`,
              filter: 'blur(10px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [activity.opacity * 0.5, activity.opacity * 0.8, activity.opacity * 0.5],
            }}
            transition={{
              duration: 3 + activity.ageRatio * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: activity.size,
              height: activity.size,
              left: -activity.size / 2,
              top: -activity.size / 2,
              background: `radial-gradient(circle,
                rgba(192, 132, 252, ${activity.opacity * 0.6}) 0%,
                rgba(168, 85, 247, ${activity.opacity * 0.3}) 40%,
                transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random(),
            }}
          />

          {/* Sparkle particles */}
          {activity.opacity > 0.3 && [...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: Math.random() * activity.size - activity.size / 2,
                top: Math.random() * activity.size - activity.size / 2,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
                y: [0, -10, -20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5 + Math.random(),
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Ambient breathing overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Simplified trail for performance
export const AuraTrailSimple: React.FC<{
  x: number;
  y: number;
  intensity?: number;
  className?: string;
}> = ({ x, y, intensity = 0.5, className = '' }) => {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: intensity }}
      exit={{ scale: 0.5, opacity: 0 }}
    >
      <motion.div
        className="w-16 h-16 rounded-full"
        style={{
          background: `radial-gradient(circle,
            rgba(168, 85, 247, ${intensity * 0.4}) 0%,
            transparent 70%)`,
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [intensity * 0.5, intensity, intensity * 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

export default AuraTrails;
