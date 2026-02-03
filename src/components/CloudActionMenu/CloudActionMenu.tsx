/**
 * CloudActionMenu.tsx
 * ☁️ SOLID NEBULA v22.0 - Elegant Bottom Sheet Action Menu
 *
 * Features:
 * - Smooth spring animation from bottom
 * - Backdrop blur overlay
 * - Search + Create options
 * - Haptic feedback
 *
 * @design Solid Nebula v22.0
 * @version 22.0.0
 */

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CloudActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
  onCreate: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CloudActionMenu: React.FC<CloudActionMenuProps> = memo(({
  isOpen,
  onClose,
  onSearch,
  onCreate,
}) => {
  const handleSearch = useCallback(() => {
    triggerHaptic('medium');
    onSearch();
    onClose();
  }, [onSearch, onClose]);

  const handleCreate = useCallback(() => {
    triggerHaptic('medium');
    onCreate();
    onClose();
  }, [onCreate, onClose]);

  const handleOverlayClick = useCallback(() => {
    triggerHaptic('light');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            style={{ WebkitBackdropFilter: 'blur(8px)' }}
          />

          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className="fixed bottom-0 left-0 right-0 z-[160]"
          >
            <div
              className="mx-4 mb-4 rounded-[32px] overflow-hidden"
              style={{
                background: 'rgba(15, 15, 15, 0.95)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/10" />
              </div>

              {/* Content */}
              <div className="p-6 pt-2 space-y-4">
                {/* Title */}
                <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-6">
                  Wölkchen Optionen
                </h3>

                {/* Search Button - Main Action */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="w-full py-6 rounded-2xl flex flex-col items-center gap-3 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.4)',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.2)',
                  }}
                >
                  <span className="text-4xl">🔍</span>
                  <span className="text-[12px] font-black tracking-[0.15em] uppercase text-purple-400">
                    Wölkchen entdecken
                  </span>
                  <span className="text-[10px] text-white/40">
                    Finde Räume und Leute in deiner Nähe
                  </span>
                </motion.button>

                {/* Cancel Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOverlayClick}
                  className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
                >
                  Abbrechen
                </motion.button>
              </div>

              {/* Safe Area Padding for iPhone */}
              <div className="h-6" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

CloudActionMenu.displayName = 'CloudActionMenu';

export default CloudActionMenu;
