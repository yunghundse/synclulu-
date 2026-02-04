/**
 * SocialVortex - 3D Activity Visualization
 *
 * A swirling vortex that visualizes nearby activity:
 * - Particles get "sucked in" from the environment
 * - Rotating orbital rings show friend presence
 * - Visual signal: "Something important is happening here!"
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface NearbyUser {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  distance?: number; // meters
}

interface SocialVortexProps {
  nearbyUsers: NearbyUser[];
  intensity?: 'dormant' | 'active' | 'hot' | 'explosive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SocialVortex: React.FC<SocialVortexProps> = ({
  nearbyUsers,
  intensity = 'active',
  size = 'lg',
  className = '',
}) => {
  const intensityConfig = {
    dormant: {
      rotationSpeed: 80,
      particleCount: 8,
      glowOpacity: 0.2,
      coreColor: 'rgba(139, 92, 246, 0.3)',
    },
    active: {
      rotationSpeed: 50,
      particleCount: 16,
      glowOpacity: 0.4,
      coreColor: 'rgba(168, 85, 247, 0.5)',
    },
    hot: {
      rotationSpeed: 30,
      particleCount: 24,
      glowOpacity: 0.6,
      coreColor: 'rgba(192, 132, 252, 0.7)',
    },
    explosive: {
      rotationSpeed: 15,
      particleCount: 32,
      glowOpacity: 0.8,
      coreColor: 'rgba(236, 72, 153, 0.8)',
    },
  };

  const sizeConfig = {
    sm: { container: 200, core: 60, orbit1: 80, orbit2: 120, orbit3: 160 },
    md: { container: 350, core: 90, orbit1: 130, orbit2: 200, orbit3: 280 },
    lg: { container: 500, core: 120, orbit1: 180, orbit2: 280, orbit3: 400 },
  };

  const config = intensityConfig[intensity];
  const sizes = sizeConfig[size];

  // Generate spiral particles being "sucked in"
  const spiralParticles = useMemo(() => {
    return [...Array(config.particleCount)].map((_, i) => ({
      id: i,
      angle: (i / config.particleCount) * 360,
      delay: (i / config.particleCount) * 2,
      size: Math.random() * 4 + 2,
    }));
  }, [config.particleCount]);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: sizes.container, height: sizes.container }}
    >
      {/* Outer Glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: sizes.container,
          height: sizes.container,
          background: `radial-gradient(circle, ${config.coreColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: config.glowOpacity,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [config.glowOpacity, config.glowOpacity * 1.3, config.glowOpacity],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbit Ring 3 (Outermost) */}
      <motion.div
        className="absolute rounded-full border border-purple-500/10"
        style={{ width: sizes.orbit3, height: sizes.orbit3 }}
        animate={{ rotate: -360 }}
        transition={{ duration: config.rotationSpeed * 1.5, repeat: Infinity, ease: 'linear' }}
      >
        {/* Orbiting particles */}
        {spiralParticles.slice(0, 8).map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-purple-400/40"
            style={{
              width: particle.size,
              height: particle.size,
              left: '50%',
              top: 0,
              marginLeft: -particle.size / 2,
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)',
            }}
          />
        ))}
      </motion.div>

      {/* Orbit Ring 2 */}
      <motion.div
        className="absolute rounded-full border border-purple-500/20"
        style={{ width: sizes.orbit2, height: sizes.orbit2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: config.rotationSpeed, repeat: Infinity, ease: 'linear' }}
      >
        {/* Nearby user avatars */}
        {nearbyUsers.slice(0, 6).map((user, i) => (
          <motion.div
            key={user.id}
            className="absolute"
            style={{
              width: 24,
              height: 24,
              left: '50%',
              top: 0,
              marginLeft: -12,
              transform: `rotate(${i * 60}deg) translateY(${sizes.orbit2 / 2}px)`,
            }}
          >
            <motion.div
              className="w-6 h-6 rounded-full overflow-hidden border-2 border-purple-400/50"
              style={{
                transform: `rotate(-${i * 60}deg)`,
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.6)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 15px rgba(168, 85, 247, 0.6)',
                  '0 0 25px rgba(168, 85, 247, 0.8)',
                  '0 0 15px rgba(168, 85, 247, 0.6)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.displayName?.charAt(0) || '?'}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Orbit Ring 1 (Innermost) */}
      <motion.div
        className="absolute rounded-full border border-purple-500/30"
        style={{ width: sizes.orbit1, height: sizes.orbit1 }}
        animate={{ rotate: -360 }}
        transition={{ duration: config.rotationSpeed * 0.7, repeat: Infinity, ease: 'linear' }}
      >
        {/* Energy particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              left: '50%',
              top: '50%',
              transform: `rotate(${i * 45}deg) translateX(${sizes.orbit1 / 2}px)`,
              boxShadow: '0 0 10px rgba(236, 72, 153, 0.8)',
            }}
          />
        ))}
      </motion.div>

      {/* Particles being sucked in */}
      {spiralParticles.map((particle) => (
        <motion.div
          key={`spiral-${particle.id}`}
          className="absolute rounded-full bg-white"
          style={{
            width: particle.size,
            height: particle.size,
            opacity: 0.6,
          }}
          initial={{
            x: Math.cos((particle.angle * Math.PI) / 180) * (sizes.container / 2),
            y: Math.sin((particle.angle * Math.PI) / 180) * (sizes.container / 2),
            scale: 1,
            opacity: 0,
          }}
          animate={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: [0, 0.8, 0],
            rotate: 720,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeIn',
          }}
        />
      ))}

      {/* Core */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: sizes.core,
          height: sizes.core,
          background: `radial-gradient(circle, ${config.coreColor} 0%, rgba(139, 92, 246, 0.2) 100%)`,
          boxShadow: `0 0 60px ${config.coreColor}`,
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            `0 0 60px ${config.coreColor}`,
            `0 0 80px ${config.coreColor}`,
            `0 0 60px ${config.coreColor}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.span
          className="text-4xl"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ☁️
        </motion.span>
      </motion.div>

      {/* Activity count badge */}
      {nearbyUsers.length > 0 && (
        <motion.div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            color: '#c084fc',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {nearbyUsers.length} in der Nähe
        </motion.div>
      )}
    </div>
  );
};

export default SocialVortex;
