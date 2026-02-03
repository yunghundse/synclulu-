/**
 * SanctuaryStarTransfer.tsx
 * Celestial Star-Transfer Animation System v1.0.0
 *
 * "Wenn ein User einen Stern vergibt, löst sich dieser nicht einfach auf.
 * Er transformiert sich in einen leuchtenden Lichtstrahl, der von der
 * Position des Gebers zum Avatar des Empfängers wandert."
 *
 * Features:
 * - Star beam animation from giver to receiver
 * - Impact pulse on arrival
 * - Particle trail effects
 * - Haptic feedback
 * - Sound cue support
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StarTransferProps {
  /** Unique transfer ID */
  id: string;
  /** Position of the giver (screen coordinates) */
  giverPosition: { x: number; y: number };
  /** Position of the receiver (screen coordinates) */
  receiverPosition: { x: number; y: number };
  /** Giver's user info */
  giver: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** Receiver's user info */
  receiver: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** Number of stars being transferred */
  starCount?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Enable haptic feedback */
  enableHaptics?: boolean;
  /** Custom duration in ms */
  duration?: number;
}

export interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STAR_TRAVEL_DURATION = 1200; // ms for star to travel
const IMPACT_PULSE_DURATION = 800; // ms for impact pulse
const PARTICLE_COUNT = 12;
const TRAIL_PARTICLE_COUNT = 8;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const starBeamVariants = {
  initial: {
    scale: 1,
    opacity: 1,
    filter: 'brightness(1) blur(0px)',
  },
  traveling: {
    scale: [1, 1.5, 1.2, 1],
    opacity: 1,
    filter: [
      'brightness(1) blur(0px)',
      'brightness(2) blur(2px)',
      'brightness(1.5) blur(1px)',
      'brightness(1) blur(0px)',
    ],
    transition: {
      duration: STAR_TRAVEL_DURATION / 1000,
      ease: [0.22, 1, 0.36, 1], // Custom easing for celestial feel
    },
  },
  impact: {
    scale: [1, 2, 0],
    opacity: [1, 1, 0],
    filter: 'brightness(3) blur(4px)',
    transition: {
      duration: IMPACT_PULSE_DURATION / 1000,
      ease: 'easeOut',
    },
  },
};

const impactPulseVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 2, 3],
    opacity: [0.8, 0.4, 0],
    transition: {
      duration: IMPACT_PULSE_DURATION / 1000,
      ease: 'easeOut',
    },
  },
};

const impactRingVariants = {
  initial: {
    scale: 0,
    opacity: 0,
    borderWidth: 4,
  },
  animate: {
    scale: [0, 1.5, 2.5],
    opacity: [1, 0.6, 0],
    borderWidth: [4, 2, 0],
    transition: {
      duration: IMPACT_PULSE_DURATION / 1000,
      ease: 'easeOut',
    },
  },
};

const particleVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: (custom: { delay: number; duration: number }) => ({
    scale: [0, 1.5, 0],
    opacity: [0, 1, 0],
    transition: {
      delay: custom.delay,
      duration: custom.duration,
      ease: 'easeOut',
    },
  }),
};

const trailParticleVariants = {
  initial: {
    scale: 1,
    opacity: 0.8,
  },
  animate: {
    scale: [1, 0.5, 0],
    opacity: [0.8, 0.4, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const starCountBadgeVariants = {
  initial: {
    scale: 0,
    opacity: 0,
    y: 10,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateParticles(count: number, baseDelay: number = 0): StarParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 80,
    y: (Math.random() - 0.5) * 80,
    size: Math.random() * 8 + 4,
    delay: baseDelay + Math.random() * 0.3,
    duration: Math.random() * 0.4 + 0.4,
  }));
}

function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' | 'impact') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      impact: [10, 50, 30],
    };
    navigator.vibrate(patterns[pattern]);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SanctuaryStarTransfer: React.FC<StarTransferProps> = ({
  id,
  giverPosition,
  receiverPosition,
  giver,
  receiver,
  starCount = 1,
  onComplete,
  enableHaptics = true,
  duration = STAR_TRAVEL_DURATION,
}) => {
  const [phase, setPhase] = useState<'traveling' | 'impact' | 'complete'>('traveling');
  const [trailPositions, setTrailPositions] = useState<{ x: number; y: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Motion values for smooth animation
  const x = useMotionValue(giverPosition.x);
  const y = useMotionValue(giverPosition.y);

  // Spring-smoothed position
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });

  // Calculate distance and angle
  const distance = useMemo(() => {
    const dx = receiverPosition.x - giverPosition.x;
    const dy = receiverPosition.y - giverPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [giverPosition, receiverPosition]);

  const angle = useMemo(() => {
    const dx = receiverPosition.x - giverPosition.x;
    const dy = receiverPosition.y - giverPosition.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, [giverPosition, receiverPosition]);

  // Generate impact particles
  const impactParticles = useMemo(() => generateParticles(PARTICLE_COUNT), []);

  // Animate star movement
  useEffect(() => {
    if (phase !== 'traveling') return;

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Eased progress for smooth movement
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      // Calculate current position
      const currentX = giverPosition.x + (receiverPosition.x - giverPosition.x) * easedProgress;
      const currentY = giverPosition.y + (receiverPosition.y - giverPosition.y) * easedProgress;

      x.set(currentX);
      y.set(currentY);

      // Add trail position every few frames
      if (Math.floor(elapsed / 50) !== Math.floor((elapsed - 16) / 50)) {
        setTrailPositions(prev => [...prev.slice(-TRAIL_PARTICLE_COUNT), { x: currentX, y: currentY }]);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Transition to impact phase
        setPhase('impact');
        if (enableHaptics) {
          triggerHaptic('impact');
        }
      }
    };

    // Initial haptic
    if (enableHaptics) {
      triggerHaptic('light');
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, giverPosition, receiverPosition, duration, enableHaptics, x, y]);

  // Handle impact phase completion
  useEffect(() => {
    if (phase !== 'impact') return;

    const impactTimer = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, IMPACT_PULSE_DURATION);

    return () => clearTimeout(impactTimer);
  }, [phase, onComplete]);

  if (phase === 'complete') return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ isolation: 'isolate' }}
    >
      {/* Trail particles */}
      <AnimatePresence>
        {trailPositions.map((pos, index) => (
          <motion.div
            key={`trail-${id}-${index}`}
            className="absolute"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
            variants={trailParticleVariants}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
          >
            <div
              className="rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500"
              style={{
                width: 6 - index * 0.5,
                height: 6 - index * 0.5,
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main traveling star */}
      {phase === 'traveling' && (
        <motion.div
          className="absolute"
          style={{
            left: springX,
            top: springY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Glow aura */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-400/60 via-amber-500/30 to-transparent"
            style={{
              width: 60,
              height: 60,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Star icon */}
          <motion.div
            variants={starBeamVariants}
            initial="initial"
            animate="traveling"
            className="relative"
          >
            <Star
              className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,1)]"
              size={32}
            />

            {/* Star count badge */}
            {starCount > 1 && (
              <motion.div
                className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-500 to-pink-500
                           rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold
                           shadow-lg"
                variants={starCountBadgeVariants}
                initial="initial"
                animate="animate"
              >
                {starCount}
              </motion.div>
            )}
          </motion.div>

          {/* Sparkle effects around star */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-20px)`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="text-yellow-300 w-3 h-3" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Impact effects at receiver position */}
      {phase === 'impact' && (
        <div
          className="absolute"
          style={{
            left: receiverPosition.x,
            top: receiverPosition.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Central impact flash */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-radial from-white via-yellow-300 to-transparent"
            style={{
              width: 40,
              height: 40,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
            }}
            variants={impactPulseVariants}
            initial="initial"
            animate="animate"
          />

          {/* Expanding ring 1 */}
          <motion.div
            className="absolute rounded-full border-yellow-400"
            style={{
              width: 60,
              height: 60,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              borderStyle: 'solid',
            }}
            variants={impactRingVariants}
            initial="initial"
            animate="animate"
          />

          {/* Expanding ring 2 (delayed) */}
          <motion.div
            className="absolute rounded-full border-amber-400"
            style={{
              width: 60,
              height: 60,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              borderStyle: 'solid',
            }}
            variants={impactRingVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          />

          {/* Particle explosion */}
          {impactParticles.map((particle) => (
            <motion.div
              key={`impact-particle-${particle.id}`}
              className="absolute rounded-full bg-gradient-to-br from-yellow-300 to-amber-500"
              style={{
                width: particle.size,
                height: particle.size,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)',
              }}
              variants={particleVariants}
              initial="initial"
              animate="animate"
              custom={{ delay: particle.delay, duration: particle.duration }}
              transition={{
                x: {
                  type: 'spring',
                  stiffness: 100,
                  damping: 10,
                },
                y: {
                  type: 'spring',
                  stiffness: 100,
                  damping: 10,
                },
              }}
              // Move particle outward
              onAnimationStart={() => {}}
            >
              <motion.div
                animate={{
                  x: particle.x,
                  y: particle.y,
                }}
                transition={{
                  duration: particle.duration,
                  ease: 'easeOut',
                  delay: particle.delay,
                }}
                className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-amber-500"
              />
            </motion.div>
          ))}

          {/* Impact star (final flash) */}
          <motion.div
            variants={starBeamVariants}
            initial="initial"
            animate="impact"
          >
            <Star
              className="text-yellow-400 fill-yellow-400"
              size={32}
              style={{
                filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 1))',
              }}
            />
          </motion.div>

          {/* Success checkmark or +stars indicator */}
          <motion.div
            className="absolute text-yellow-400 font-bold text-lg"
            style={{
              left: '50%',
              top: -30,
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            +{starCount} ⭐
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STAR TRANSFER MANAGER
// ============================================================================

export interface StarTransferQueueItem extends StarTransferProps {
  startTime: number;
}

interface StarTransferManagerProps {
  children?: React.ReactNode;
}

interface StarTransferContextValue {
  triggerTransfer: (props: Omit<StarTransferProps, 'id'>) => string;
  cancelTransfer: (id: string) => void;
}

const StarTransferContext = React.createContext<StarTransferContextValue | null>(null);

export const useStarTransfer = () => {
  const context = React.useContext(StarTransferContext);
  if (!context) {
    throw new Error('useStarTransfer must be used within StarTransferManager');
  }
  return context;
};

export const StarTransferManager: React.FC<StarTransferManagerProps> = ({ children }) => {
  const [transfers, setTransfers] = useState<StarTransferQueueItem[]>([]);

  const triggerTransfer = useCallback((props: Omit<StarTransferProps, 'id'>) => {
    const id = `star-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTransfer: StarTransferQueueItem = {
      ...props,
      id,
      startTime: Date.now(),
    };
    setTransfers(prev => [...prev, newTransfer]);
    return id;
  }, []);

  const cancelTransfer = useCallback((id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleTransferComplete = useCallback((id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({
    triggerTransfer,
    cancelTransfer,
  }), [triggerTransfer, cancelTransfer]);

  return (
    <StarTransferContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {transfers.map((transfer) => (
          <SanctuaryStarTransfer
            key={transfer.id}
            {...transfer}
            onComplete={() => {
              transfer.onComplete?.();
              handleTransferComplete(transfer.id);
            }}
          />
        ))}
      </AnimatePresence>
    </StarTransferContext.Provider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SanctuaryStarTransfer;
