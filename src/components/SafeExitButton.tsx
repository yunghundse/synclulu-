/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SAFE EXIT BUTTON v1.0 - "Absolute Fluidity" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Hold-to-Exit (1.5 seconds) prevents accidental leaves
 * - Visual progress ring during hold
 * - Soft haptic feedback simulation
 * - Gentle "farewell" animation
 * - Glassmorphism design matching control bar
 *
 * @author Lead Developer (Discord) × Senior UX Designer (Apple)
 * @version 1.0.0
 */

import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { LogOut, Cloud, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const HOLD_DURATION_MS = 1500; // 1.5 seconds to confirm exit
const PROGRESS_UPDATE_INTERVAL = 16; // ~60fps

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SafeExitButtonProps {
  onLeave: () => void;
  disabled?: boolean;
  showFarewellAnimation?: boolean;
  roomName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAREWELL ANIMATION OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface FarewellOverlayProps {
  roomName: string;
  onComplete: () => void;
}

const FarewellOverlay = memo(({ roomName, onComplete }: FarewellOverlayProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(15, 10, 30, 0.98) 0%, rgba(5, 5, 10, 0.99) 100%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={() => {
        // Wait for the cloud animation then trigger exit
        setTimeout(onComplete, 1200);
      }}
    >
      {/* Dissolving Cloud */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.5)',
          }}
        >
          <Cloud size={48} className="text-purple-400" />
        </div>

        {/* Sparkle particles flying away */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-purple-400"
            style={{
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 8) * 100,
              y: Math.sin((i * Math.PI * 2) / 8) * 100,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.05,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Farewell Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.p
          className="text-white/80 text-lg font-medium mb-2"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Bis bald ✨
        </motion.p>
        <p className="text-white/40 text-sm">
          Du hast das {roomName || 'Wölkchen'} verlassen
        </p>
      </motion.div>
    </motion.div>
  );
});

FarewellOverlay.displayName = 'FarewellOverlay';

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS RING COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressRingProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
}

const ProgressRing = memo(({ progress, size, strokeWidth }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg
      className="absolute inset-0 -rotate-90 pointer-events-none"
      width={size}
      height={size}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(239, 68, 68, 0.2)"
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(239, 68, 68, 0.8)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
        }}
      />
    </svg>
  );
});

ProgressRing.displayName = 'ProgressRing';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SAFE EXIT BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

export const SafeExitButton = memo(({
  onLeave,
  disabled = false,
  showFarewellAnimation = true,
  roomName = 'Wölkchen',
}: SafeExitButtonProps) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFarewell, setShowFarewell] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);

  // Clean up function
  const cleanupHold = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    holdStartRef.current = null;
    setIsHolding(false);
    setProgress(0);
  }, []);

  // Start hold
  const handleHoldStart = useCallback(() => {
    if (disabled || hasTriggeredRef.current) return;

    holdStartRef.current = Date.now();
    setIsHolding(true);
    setProgress(0);

    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      if (!holdStartRef.current) return;

      const elapsed = Date.now() - holdStartRef.current;
      const newProgress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setProgress(newProgress);

      // Check if complete
      if (newProgress >= 1 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        cleanupHold();

        // Haptic feedback simulation (vibrate if available)
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 100]);
        }

        // Show farewell or exit immediately
        if (showFarewellAnimation) {
          setShowFarewell(true);
        } else {
          onLeave();
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [disabled, cleanupHold, showFarewellAnimation, onLeave]);

  // End hold
  const handleHoldEnd = useCallback(() => {
    if (!hasTriggeredRef.current) {
      cleanupHold();
    }
  }, [cleanupHold]);

  // Handle farewell completion
  const handleFarewellComplete = useCallback(() => {
    setShowFarewell(false);
    hasTriggeredRef.current = false;
    onLeave();
  }, [onLeave]);

  // Button size for progress ring
  const buttonSize = 56;

  return (
    <>
      {/* Farewell Animation Overlay */}
      <AnimatePresence>
        {showFarewell && (
          <FarewellOverlay
            roomName={roomName}
            onComplete={handleFarewellComplete}
          />
        )}
      </AnimatePresence>

      {/* Exit Button */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <motion.button
          className="relative flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: buttonSize,
            height: buttonSize,
            background: isHolding
              ? 'rgba(239, 68, 68, 0.25)'
              : 'rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isHolding ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.25)'}`,
            boxShadow: isHolding
              ? '0 0 30px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
          whileHover={!disabled ? { scale: 1.05 } : undefined}
          whileTap={!disabled ? { scale: 0.95 } : undefined}
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          disabled={disabled}
        >
          {/* Progress Ring */}
          {isHolding && (
            <ProgressRing
              progress={progress}
              size={buttonSize}
              strokeWidth={3}
            />
          )}

          {/* Icon */}
          <motion.div
            animate={isHolding ? { scale: [1, 0.9, 1] } : { scale: 1 }}
            transition={isHolding ? { duration: 0.3, repeat: Infinity } : undefined}
          >
            <LogOut
              size={22}
              className="text-red-400"
              style={{
                filter: isHolding ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' : undefined,
              }}
            />
          </motion.div>
        </motion.button>

        {/* Hold hint tooltip */}
        <AnimatePresence>
          {isHolding && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              <span className="text-xs text-white/80">
                {progress < 1 ? 'Gedrückt halten...' : 'Verlassen...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial tooltip on hover */}
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: !isHolding ? 1 : 0 }}
        >
          <span className="text-xs text-white/80">Gedrückt halten zum Verlassen</span>
        </motion.div>
      </motion.div>
    </>
  );
});

SafeExitButton.displayName = 'SafeExitButton';

export default SafeExitButton;
