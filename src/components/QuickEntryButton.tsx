/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUICK ENTRY BUTTON - Calm Visual Loading Animation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Eleganter pulsierender Ring während der Suche
 * - Kein Flackern, keine mehrfachen Redirects
 * - Liquid-Design Integration
 * - Connection State Feedback
 *
 * @version 1.0.0 - Solid Infrastructure Edition
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sparkles, Loader2 } from 'lucide-react';
import type { ConnectionState } from '../hooks/useSafeJoin';

interface QuickEntryButtonProps {
  onClick: () => void;
  connectionState: ConnectionState;
  disabled?: boolean;
  className?: string;
}

// Status messages
const STATUS_MESSAGES: Record<ConnectionState, string> = {
  idle: 'Quick Entry ☁️',
  searching: 'Suche Cloud...',
  creating: 'Erstelle Cloud...',
  joining: 'Verbinde...',
  connected: 'Verbunden!',
  error: 'Fehler',
};

export const QuickEntryButton = ({
  onClick,
  connectionState,
  disabled = false,
  className = '',
}: QuickEntryButtonProps) => {
  const isProcessing = connectionState !== 'idle' && connectionState !== 'connected' && connectionState !== 'error';

  return (
    <motion.button
      disabled={disabled || isProcessing}
      onClick={onClick}
      className={`relative p-6 rounded-full transition-all ${className}`}
      style={{
        background: isProcessing
          ? 'rgba(139, 92, 246, 0.15)'
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isProcessing
          ? '0 0 30px rgba(139, 92, 246, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
      whileHover={!isProcessing ? { scale: 1.05 } : {}}
      whileTap={!isProcessing ? { scale: 0.95 } : {}}
      animate={isProcessing ? { scale: [1, 0.98, 1] } : {}}
      transition={isProcessing ? { duration: 1.5, repeat: Infinity } : {}}
    >
      {/* Pulsing ring when processing */}
      <AnimatePresence>
        {isProcessing && (
          <>
            {/* Outer pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(139, 92, 246, 0.5)',
              }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: [1, 1.3, 1.5],
                opacity: [0.8, 0.4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Inner pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid rgba(168, 85, 247, 0.4)',
              }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: [1, 1.2, 1.4],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.3,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />

            {/* Rotating dots */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-purple-400"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 120}deg) translateY(-150%) translateX(-50%)`,
                  }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.3,
                    repeat: Infinity,
                  }}
                />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Button content */}
      <div className="relative flex items-center gap-3">
        {isProcessing ? (
          <>
            {/* Spinning loader */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={20} className="text-purple-400" />
            </motion.div>

            {/* Status text */}
            <motion.span
              key={connectionState}
              className="text-purple-400 font-medium tracking-widest uppercase text-xs"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {STATUS_MESSAGES[connectionState]}
            </motion.span>
          </>
        ) : connectionState === 'error' ? (
          <>
            <span className="text-red-400">⚠️</span>
            <span className="text-red-400 font-medium text-sm">Erneut versuchen</span>
          </>
        ) : connectionState === 'connected' ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <Sparkles size={20} className="text-green-400" />
            </motion.div>
            <span className="text-green-400 font-bold text-sm">Verbunden!</span>
          </>
        ) : (
          <>
            <Cloud size={24} className="text-white" />
            <span className="text-white font-bold text-lg">Quick Entry ☁️</span>
          </>
        )}
      </div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: isProcessing ? [0.3, 0.6, 0.3] : 0.3,
          scale: isProcessing ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isProcessing ? Infinity : 0,
        }}
      />
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT VERSION - Für Inline-Nutzung
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickEntryCompactProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export const QuickEntryCompact = ({
  onClick,
  isProcessing,
  disabled = false,
}: QuickEntryCompactProps) => {
  return (
    <motion.button
      disabled={disabled || isProcessing}
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 rounded-xl"
      style={{
        background: isProcessing
          ? 'rgba(139, 92, 246, 0.1)'
          : 'rgba(139, 92, 246, 0.2)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}
      whileHover={!isProcessing ? { scale: 1.02 } : {}}
      whileTap={!isProcessing ? { scale: 0.98 } : {}}
    >
      {isProcessing ? (
        <>
          <motion.div
            className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-purple-400 text-sm">Verbinde...</span>
        </>
      ) : (
        <>
          <Cloud size={16} className="text-purple-400" />
          <span className="text-white text-sm font-medium">Beitreten</span>
        </>
      )}
    </motion.button>
  );
};

export default QuickEntryButton;
