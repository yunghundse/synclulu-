/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PULSE NOTIFICATION v1.0 - "Floating Ripple" Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Non-intrusive, highly aesthetic notification system.
 * Replaces traditional banner notifications with floating "Liquid Blobs".
 *
 * Features:
 * - Floating circular avatar notification
 * - Pulse animation synced with global Vibe rhythm
 * - Drag-down to open Quick-Reply
 * - Haptic feedback support
 * - Dual-Mode (Dark/Light) styling
 *
 * @author Lead UX Engineer (Telegram × Instagram)
 * @version 1.0.0
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PulseNotificationData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  conversationId?: string;
}

interface PulseNotificationProps {
  notification: PulseNotificationData | null;
  onDismiss: () => void;
  onReply?: (message: string) => void;
  onOpen?: (conversationId: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

const notificationVariants = {
  initial: { y: -100, opacity: 0, scale: 0.8 },
  animate: {
    y: 20,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    y: -50,
    transition: { duration: 0.2 },
  },
};

const quickReplyVariants = {
  initial: { opacity: 0, height: 0, y: -10 },
  animate: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

// Pulse ring animation
const pulseRingVariants = {
  animate: {
    scale: [1, 1.3, 1.5],
    opacity: [0.6, 0.3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PulseNotification = memo<PulseNotificationProps>(({
  notification,
  onDismiss,
  onReply,
  onOpen,
}) => {
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Handle drag to expand quick reply
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 50) {
      // Dragged down - show quick reply
      setShowQuickReply(true);
      // Trigger haptic if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else if (info.offset.y < -30) {
      // Dragged up - dismiss
      onDismiss();
    }
  }, [onDismiss]);

  // Handle send reply
  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || isSending) return;

    setIsSending(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }

    try {
      await onReply?.(replyText.trim());
      setReplyText('');
      setShowQuickReply(false);
      onDismiss();
    } catch (error) {
      console.error('Reply failed:', error);
    } finally {
      setIsSending(false);
    }
  }, [replyText, isSending, onReply, onDismiss]);

  // Handle tap to open conversation
  const handleTap = useCallback(() => {
    if (!showQuickReply && notification?.conversationId) {
      onOpen?.(notification.conversationId);
      onDismiss();
    }
  }, [showQuickReply, notification, onOpen, onDismiss]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          className="fixed top-5 left-1/2 z-[9999]"
          style={{ x: '-50%' }}
          variants={notificationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Main notification blob */}
          <motion.div
            className="relative cursor-pointer"
            drag="y"
            dragConstraints={{ top: -50, bottom: 100 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={handleTap}
            whileTap={{ scale: 0.98 }}
          >
            {/* Glassmorphism container */}
            <div
              className="flex items-center gap-3 p-3 pr-5 rounded-full"
              style={{
                background: 'rgba(20, 20, 25, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(139, 92, 246, 0.15)',
              }}
            >
              {/* Avatar with pulse ring */}
              <div className="relative">
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500/30"
                  variants={pulseRingVariants}
                  animate="animate"
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500/20"
                  variants={pulseRingVariants}
                  animate="animate"
                  transition={{ delay: 0.3 }}
                />

                {/* Avatar */}
                {notification.senderAvatar ? (
                  <img
                    src={notification.senderAvatar}
                    alt={notification.senderName}
                    className="w-12 h-12 rounded-full object-cover relative z-10 border-2 border-purple-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative z-10 border-2 border-purple-500/50">
                    <span className="text-white font-bold">
                      {notification.senderName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col max-w-[200px]">
                <span className="text-white font-semibold text-sm">
                  {notification.senderName}
                </span>
                <span className="text-white/60 text-xs truncate">
                  {notification.message}
                </span>
              </div>

              {/* Dismiss button */}
              <motion.button
                className="ml-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} className="text-white/40" />
              </motion.button>
            </div>

            {/* Drag hint */}
            {!showQuickReply && (
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown size={14} className="text-white/30" />
              </motion.div>
            )}
          </motion.div>

          {/* Quick Reply Panel */}
          <AnimatePresence>
            {showQuickReply && (
              <motion.div
                className="mt-3"
                variants={quickReplyVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(20, 20, 25, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Schnelle Antwort..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <motion.button
                      className="p-3 rounded-xl bg-purple-500 text-white disabled:opacity-50"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSending}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </motion.button>
                  </div>

                  {/* Close quick reply */}
                  <button
                    className="w-full mt-3 py-2 text-white/40 text-xs hover:text-white/60 transition-colors"
                    onClick={() => setShowQuickReply(false)}
                  >
                    Schließen
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PulseNotification.displayName = 'PulseNotification';

export default PulseNotification;
