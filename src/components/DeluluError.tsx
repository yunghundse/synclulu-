/**
 * Delulu Error Component - Elegant Error Messages
 *
 * Beautiful error displays in Delulu style
 * Neon-Red/Purple Glow - No standard HTML look
 */

import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ErrorSeverity = 'error' | 'warning' | 'info';

interface DeluluErrorProps {
  message: string;
  severity?: ErrorSeverity;
  icon?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const severityConfig = {
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: 'rgba(239, 68, 68, 0.3)',
    text: '#F87171',
    icon: '⚠️'
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.4)',
    glow: 'rgba(245, 158, 11, 0.3)',
    text: '#FBBF24',
    icon: '⚡'
  },
  info: {
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.4)',
    glow: 'rgba(139, 92, 246, 0.3)',
    text: '#A78BFA',
    icon: '💫'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DeluluError({
  message,
  severity = 'error',
  icon,
  onDismiss,
  dismissible = true,
  className = ''
}: DeluluErrorProps) {
  const config = severityConfig[severity];

  return (
    <motion.div
      className={`relative px-4 py-3 rounded-xl ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: `0 0 20px ${config.glow}, inset 0 0 20px ${config.glow}`
      }}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <motion.span
          className="text-lg flex-shrink-0"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {icon || config.icon}
        </motion.span>

        {/* Message */}
        <p
          className="text-sm flex-1"
          style={{ color: config.text }}
        >
          {message}
        </p>

        {/* Dismiss Button */}
        {dismissible && onDismiss && (
          <motion.button
            onClick={onDismiss}
            className="text-lg opacity-50 hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        )}
      </div>

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: `1px solid ${config.border}`,
          opacity: 0.5
        }}
        animate={{
          boxShadow: [
            `0 0 10px ${config.glow}`,
            `0 0 20px ${config.glow}`,
            `0 0 10px ${config.glow}`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TOAST (Floating)
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  severity?: ErrorSeverity;
}

export function DeluluErrorToast({
  message,
  isVisible,
  onClose,
  duration = 5000,
  severity = 'error'
}: ErrorToastProps) {
  // Auto-dismiss
  if (isVisible && duration > 0) {
    setTimeout(onClose, duration);
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          <DeluluError
            message={message}
            severity={severity}
            onDismiss={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE ERROR (For forms)
// ═══════════════════════════════════════════════════════════════════════════

interface InlineErrorProps {
  message: string | null | undefined;
  className?: string;
}

export function DeluluInlineError({ message, className = '' }: InlineErrorProps) {
  if (!message) return null;

  return (
    <motion.p
      className={`text-xs mt-1 ${className}`}
      style={{ color: '#F87171' }}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="mr-1">⚠️</span>
      {message}
    </motion.p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL SCREEN ERROR
// ═══════════════════════════════════════════════════════════════════════════

interface FullScreenErrorProps {
  title?: string;
  message: string;
  icon?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function DeluluFullScreenError({
  title = 'Oops!',
  message,
  icon = '😵',
  onRetry,
  onBack
}: FullScreenErrorProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0b0b0b' }}
    >
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Icon */}
        <motion.div
          className="text-7xl mb-6"
          animate={{
            rotate: [0, 10, -10, 0],
            y: [0, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {icon}
        </motion.div>

        {/* Title */}
        <h1
          className="text-3xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {title}
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-8">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          {onBack && (
            <motion.button
              onClick={onBack}
              className="px-6 py-3 rounded-xl font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Zurück
            </motion.button>
          )}

          {onRetry && (
            <motion.button
              onClick={onRetry}
              className="px-6 py-3 rounded-xl font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 Erneut versuchen
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING CLOUD
// ═══════════════════════════════════════════════════════════════════════════

export function LoadingCloud({ message = 'Lädt...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        className="text-5xl mb-4"
        animate={{
          scale: [1, 1.1, 1],
          y: [0, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))'
        }}
      >
        ☁️
      </motion.div>
      <motion.p
        className="text-gray-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default DeluluError;
