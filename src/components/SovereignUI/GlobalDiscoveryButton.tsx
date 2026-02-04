/**
 * GlobalDiscoveryButton.tsx
 * Full-Width Action Button - Lead Interaction Designer Edition
 *
 * Features:
 * - OLED-Black Base mit Neon-Glow Rand
 * - Glow-Breathing Animation (Scale 1.0 → 1.02)
 * - "Relocating..." Animation bei ungenauen Standort
 * - Shimmer Effect on Hover
 * - Perfect Z-Index über Nav aber unter Modals
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles } from 'lucide-react';

interface GlobalDiscoveryButtonProps {
  onClick: () => void;
  isLocationApproximate?: boolean;
  className?: string;
}

export const GlobalDiscoveryButton = ({
  onClick,
  isLocationApproximate = false,
  className = '',
}: GlobalDiscoveryButtonProps) => {
  const [isRelocating, setIsRelocating] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLocationApproximate) {
      // Zeige "Relocating..." Animation
      setIsRelocating(true);

      // Kurze Delay für die Animation
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsRelocating(false);
    }

    onClick();
  }, [onClick, isLocationApproximate]);

  return (
    <div className={`fixed bottom-[100px] left-0 right-0 px-5 z-[90] ${className}`}>
      <motion.button
        onClick={handleClick}
        disabled={isRelocating}
        // Glow-Breathing Animation
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{
          scale: [1, 1.015, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileTap={{ scale: 0.97 }}
        className="relative w-full py-4.5 rounded-2xl flex items-center justify-center overflow-hidden group"
        style={{
          background: 'rgba(5, 5, 5, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        {/* Animated Neon Glow Border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 8px rgba(168, 85, 247, 0.15), inset 0 0 8px rgba(168, 85, 247, 0.05)',
              '0 0 20px rgba(168, 85, 247, 0.35), inset 0 0 15px rgba(168, 85, 247, 0.1)',
              '0 0 8px rgba(168, 85, 247, 0.15), inset 0 0 8px rgba(168, 85, 247, 0.05)',
            ],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Shimmer Effect on Hover */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"
        />

        {/* Left Accent Line */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, #a855f7, transparent)',
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Right Accent Line */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, #a855f7, transparent)',
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {isRelocating ? (
            <motion.div
              key="relocating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Compass size={16} className="text-violet-400" />
              </motion.div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">
                Relocating...
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              <Sparkles size={14} className="text-violet-400/70" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80">
                Entdecke die Welt von Synclulu
              </span>
              <Sparkles size={14} className="text-violet-400/70" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Glow Line */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] rounded-full"
          style={{
            background: 'linear-gradient(to right, transparent, #a855f7, transparent)',
          }}
          animate={{
            width: ['40%', '70%', '40%'],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.button>
    </div>
  );
};

export default GlobalDiscoveryButton;
