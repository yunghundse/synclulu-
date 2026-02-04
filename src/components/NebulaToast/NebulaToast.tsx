/**
 * NebulaToast.tsx
 * 🔔 NEBULA NOTIFICATION SYSTEM
 *
 * Elegante, schmale Banner die von oben gleiten
 * und sich nach 3 Sekunden atomisieren (Blur-Fade)
 *
 * Features:
 * - Smooth slide-in Animation
 * - Atomisierender Exit-Effekt
 * - Verschiedene Toast-Typen (info, success, warning, sync, levelup)
 * - GPU-beschleunigt
 * - Blockiert NICHT die Navigation
 *
 * @version 1.0.0
 */

import React, { memo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Bell, Users, AlertCircle, CheckCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ToastType = 'info' | 'success' | 'warning' | 'sync' | 'levelup' | 'match';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  subMessage?: string;
  duration?: number; // ms, default 3000
  icon?: React.ReactNode;
}

interface NebulaToastProps {
  toast: ToastData;
  onComplete: (id: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST STYLES
// ═══════════════════════════════════════════════════════════════════════════

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#93C5FD',
    icon: <Bell size={14} />,
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.3)',
    text: '#86EFAC',
    icon: <CheckCircle size={14} />,
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#FCD34D',
    icon: <AlertCircle size={14} />,
  },
  sync: {
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
    text: '#D8B4FE',
    icon: <Zap size={14} />,
  },
  levelup: {
    bg: 'rgba(234, 179, 8, 0.2)',
    border: 'rgba(234, 179, 8, 0.4)',
    text: '#FDE047',
    icon: <Sparkles size={14} />,
  },
  match: {
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.3)',
    text: '#F9A8D4',
    icon: <Users size={14} />,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const NebulaToast = memo(function NebulaToast({
  toast,
  onComplete,
}: NebulaToastProps) {
  const style = toastStyles[toast.type];
  const duration = toast.duration || 3000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onComplete]);

  return (
    <motion.div
      layout
      initial={{ y: -60, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{
        y: -20,
        opacity: 0,
        scale: 0.95,
        filter: 'blur(8px)',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className="w-full max-w-sm mx-auto will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    >
      <div
        className="py-3 px-5 rounded-full flex items-center gap-3"
        style={{
          background: style.bg,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${style.border}`,
          boxShadow: `0 0 20px ${style.bg}`,
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0"
          style={{ color: style.text }}
        >
          {toast.icon || style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] truncate"
            style={{ color: style.text }}
          >
            {toast.message}
          </p>
          {toast.subMessage && (
            <p className="text-[9px] text-white/40 truncate mt-0.5">
              {toast.subMessage}
            </p>
          )}
        </div>

        {/* Pulse Indicator */}
        <div
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ background: style.text }}
        />
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export const NebulaToastContainer = memo(function NebulaToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  return (
    <div
      className="fixed top-[120px] left-4 right-4 z-[200] pointer-events-none flex flex-col gap-2"
      style={{ transform: 'translateZ(0)' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <NebulaToast
            key={toast.id}
            toast={toast}
            onComplete={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// TOAST HOOK
// ═══════════════════════════════════════════════════════════════════════════

let toastIdCounter = 0;

export const useNebulaToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // Max 5 toasts
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showInfo = useCallback((message: string, subMessage?: string) => {
    return addToast({ type: 'info', message, subMessage });
  }, [addToast]);

  const showSuccess = useCallback((message: string, subMessage?: string) => {
    return addToast({ type: 'success', message, subMessage });
  }, [addToast]);

  const showWarning = useCallback((message: string, subMessage?: string) => {
    return addToast({ type: 'warning', message, subMessage });
  }, [addToast]);

  const showSync = useCallback((message: string, subMessage?: string) => {
    return addToast({ type: 'sync', message, subMessage, duration: 4000 });
  }, [addToast]);

  const showLevelUp = useCallback((level: number, rankName: string) => {
    return addToast({
      type: 'levelup',
      message: `Level ${level} erreicht!`,
      subMessage: `Neuer Rang: ${rankName}`,
      duration: 5000,
    });
  }, [addToast]);

  const showMatch = useCallback((userName: string, matchPercent: number) => {
    return addToast({
      type: 'match',
      message: `${matchPercent}% Sync mit ${userName}`,
      subMessage: matchPercent >= 90 ? 'Perfekte Aura-Resonanz!' : undefined,
      duration: 4000,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showInfo,
    showSuccess,
    showWarning,
    showSync,
    showLevelUp,
    showMatch,
    ToastContainer: () => (
      <NebulaToastContainer toasts={toasts} onRemove={removeToast} />
    ),
  };
};

export default NebulaToast;
