/**
 * CatalystTeaser.tsx
 * ✨ CATALYST-MODUS TEASER - Coming Soon Feature
 *
 * Golden shimmering menu item with elegant popup
 * For verified souls only
 *
 * @version 1.0.0
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Zap, Crown, Star } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const CatalystTeaser: React.FC = memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 10, 15]);
    }
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Menu Button */}
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="w-full relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />

        <div className="relative flex items-center gap-4 p-4">
          {/* Icon with Glow */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)',
            }}
          >
            <Zap size={24} className="text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3
                className="font-bold text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                }}
              >
                Catalyst-Modus
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                }}
              >
                Beta
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Aktiviere deine volle Aura-Kraft
            </p>
          </div>

          {/* Arrow */}
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles size={18} className="text-amber-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
              style={{ WebkitBackdropFilter: 'blur(8px)' }}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[210] max-w-sm mx-auto"
            >
              <div
                className="rounded-[32px] p-8 text-center overflow-hidden"
                style={{
                  background: 'rgba(10, 10, 10, 0.95)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  boxShadow: '0 0 60px rgba(251, 191, 36, 0.15), inset 0 0 60px rgba(251, 191, 36, 0.05)',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X size={16} className="text-white/40" />
                </button>

                {/* Icon */}
                <motion.div
                  className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 0 40px rgba(251, 191, 36, 0.5)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(251, 191, 36, 0.5)',
                      '0 0 60px rgba(251, 191, 36, 0.7)',
                      '0 0 40px rgba(251, 191, 36, 0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap size={40} className="text-white" />
                </motion.div>

                {/* Title */}
                <h2
                  className="text-2xl font-black mb-3 text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                  }}
                >
                  Catalyst-Modus
                </h2>

                {/* Subtitle */}
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  Der Catalyst-Effekt wird gerade in der Tiefe der Nebula geschmiedet.
                </p>

                {/* Feature Preview */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Crown size={18} className="text-amber-400" />
                    <span className="text-sm text-white/70">2x Aura-Multiplikator</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Star size={18} className="text-amber-400" />
                    <span className="text-sm text-white/70">Exklusive Catalyst-Badge</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Sparkles size={18} className="text-amber-400" />
                    <span className="text-sm text-white/70">Priority Room Matching</span>
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={16} className="text-amber-400" />
                  </motion.div>
                  <span className="text-sm font-semibold text-amber-400">
                    Bald verfügbar für verifizierte Seelen
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

CatalystTeaser.displayName = 'CatalystTeaser';

export default CatalystTeaser;
