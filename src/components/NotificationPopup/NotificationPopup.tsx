/**
 * NotificationPopup.tsx
 * Glass-style notification popup for real-time alerts
 * Darkmode-safe with violet border glow
 */

import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, MessageCircle, Bell, Zap } from 'lucide-react';
import { audioFeedback } from '../../lib/audioFeedback';

export type NotificationVariant =
  | 'star'
  | 'friend_request'
  | 'friend_accepted'
  | 'message'
  | 'room_invite'
  | 'achievement'
  | 'default';

export interface NotificationPopupProps {
  isVisible: boolean;
  variant?: NotificationVariant;
  title: string;
  message: string;
  avatarUrl?: string;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  duration?: number; // Auto-hide duration in ms
}

const variantConfig: Record<
  NotificationVariant,
  {
    icon: React.ElementType;
    gradient: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  star: {
    icon: Star,
    gradient: 'from-amber-500 to-yellow-500',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    glowColor: 'rgba(251, 191, 36, 0.2)',
  },
  friend_request: {
    icon: Users,
    gradient: 'from-blue-500 to-indigo-600',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    glowColor: 'rgba(59, 130, 246, 0.2)',
  },
  friend_accepted: {
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    glowColor: 'rgba(16, 185, 129, 0.2)',
  },
  message: {
    icon: MessageCircle,
    gradient: 'from-pink-500 to-rose-600',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    glowColor: 'rgba(236, 72, 153, 0.2)',
  },
  room_invite: {
    icon: Zap,
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    glowColor: 'rgba(139, 92, 246, 0.2)',
  },
  achievement: {
    icon: Star,
    gradient: 'from-orange-500 to-red-600',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    glowColor: 'rgba(249, 115, 22, 0.2)',
  },
  default: {
    icon: Bell,
    gradient: 'from-violet-500 to-purple-600',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    glowColor: 'rgba(139, 92, 246, 0.2)',
  },
};

export const NotificationPopup = memo(function NotificationPopup({
  isVisible,
  variant = 'default',
  title,
  message,
  avatarUrl,
  onClose,
  onAction,
  actionLabel,
  duration = 5000,
}: NotificationPopupProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Auto-hide after duration
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // Play sound when appearing
  useEffect(() => {
    if (isVisible) {
      audioFeedback.notification();
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[200] mx-auto max-w-md"
        >
          {/* Glow Effect */}
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-50"
            style={{ background: config.glowColor }}
          />

          {/* Main Container - DARKMODE SAFE */}
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(5, 5, 5, 0.85)', // Midnight Obsidian
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${config.borderColor}`,
              boxShadow: `0 0 30px ${config.glowColor}, 0 4px 20px rgba(0, 0, 0, 0.3)`,
            }}
          >
            {/* Gradient Border Accent */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`}
            />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon or Avatar */}
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.gradient} p-0.5`}
                    >
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center`}
                    >
                      <Icon size={22} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {title}
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                    {message}
                  </p>

                  {/* Action Button */}
                  {onAction && actionLabel && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onAction();
                        onClose();
                      }}
                      className={`mt-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.gradient} text-white text-xs font-semibold`}
                    >
                      {actionLabel}
                    </motion.button>
                  )}
                </div>

                {/* Close Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X size={14} className="text-white/40" />
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
              <motion.div
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${config.gradient}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default NotificationPopup;
