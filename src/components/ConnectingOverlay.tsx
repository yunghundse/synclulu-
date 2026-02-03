/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONNECTING OVERLAY - Calm Visuals for Room Connection
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - Smooth pulsing animation
 * - No flicker, no multiple redirects
 * - Status messages for each connection state
 * - Beautiful glassmorphism design
 *
 * @version 1.0.0 - Solid Infrastructure Edition
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import type { ConnectionState } from '../hooks/useSafeJoin';

interface ConnectingOverlayProps {
  connectionState: ConnectionState;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

// Status messages for each state
const STATUS_MESSAGES: Record<ConnectionState, string> = {
  idle: '',
  searching: 'Suche nach Clouds in deiner Nähe...',
  creating: 'Erstelle neue Cloud...',
  joining: 'Verbinde...',
  connected: 'Verbunden!',
  error: 'Verbindung fehlgeschlagen',
};

export const ConnectingOverlay = ({
  connectionState,
  error,
  onCancel,
  onRetry,
}: ConnectingOverlayProps) => {
  const isVisible = connectionState !== 'idle' && connectionState !== 'connected';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background blur overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            onClick={onCancel}
          />

          {/* Content card */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-3xl max-w-sm mx-4"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Animated icon based on state */}
            <ConnectionIcon state={connectionState} />

            {/* Status message */}
            <div className="text-center">
              <motion.p
                className="text-white text-lg font-medium"
                key={connectionState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {STATUS_MESSAGES[connectionState]}
              </motion.p>

              {/* Error message */}
              {error && connectionState === 'error' && (
                <motion.p
                  className="text-red-400 text-sm mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Progress indicator */}
            {connectionState !== 'error' && (
              <motion.div
                className="w-48 h-1 bg-white/10 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #8B5CF6, #A78BFA, #8B5CF6)',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                    width: connectionState === 'joining' ? '80%' : connectionState === 'creating' ? '50%' : '30%',
                  }}
                  transition={{
                    backgroundPosition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    width: { duration: 0.5 },
                  }}
                />
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              {connectionState === 'error' && onRetry && (
                <motion.button
                  className="px-6 py-2 rounded-xl text-white font-medium"
                  style={{
                    background: 'rgba(139, 92, 246, 0.3)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRetry}
                >
                  Erneut versuchen
                </motion.button>
              )}

              {onCancel && (
                <motion.button
                  className="px-6 py-2 rounded-xl text-white/70 font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                >
                  Abbrechen
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION ICON - Animated based on state
// ═══════════════════════════════════════════════════════════════════════════════

const ConnectionIcon = ({ state }: { state: ConnectionState }) => {
  const iconSize = 64;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: state === 'error'
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring */}
      {state !== 'error' && state !== 'connected' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          {/* Spinning dots */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-purple-400"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 120}deg) translateY(-42px) translateX(-4px)`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Main icon */}
      {state === 'searching' && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cloud size={iconSize} className="text-purple-400" strokeWidth={1.5} />
        </motion.div>
      )}

      {state === 'creating' && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Sparkles size={iconSize} className="text-purple-400" strokeWidth={1.5} />
        </motion.div>
      )}

      {state === 'joining' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={iconSize} className="text-purple-400" strokeWidth={1.5} />
        </motion.div>
      )}

      {state === 'connected' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <CheckCircle size={iconSize} className="text-green-400" strokeWidth={1.5} />
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <XCircle size={iconSize} className="text-red-400" strokeWidth={1.5} />
        </motion.div>
      )}
    </div>
  );
};

export default ConnectingOverlay;
