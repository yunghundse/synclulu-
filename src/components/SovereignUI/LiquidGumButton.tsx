/**
 * LiquidGumButton.tsx
 * The Liquid Gum Center Button - Apple & Meta Design Philosophy
 *
 * Features:
 * - Organisches "Atmen" mit morphenden Border-Radius
 * - Squish-Effekt bei Hover/Touch
 * - Weiches Popup-Menü bei Klick
 * - Framer Motion Spring Physics
 * - GPU-beschleunigte Animationen
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Compass, Sparkles, X } from 'lucide-react';

interface LiquidGumButtonProps {
  onCreateRoom: () => void;
  onDiscovery: () => void;
}

export const LiquidGumButton = ({
  onCreateRoom,
  onDiscovery,
}: LiquidGumButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleButtonClick = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleCreateRoom = useCallback(() => {
    setIsMenuOpen(false);
    onCreateRoom();
  }, [onCreateRoom]);

  const handleDiscovery = useCallback(() => {
    setIsMenuOpen(false);
    onDiscovery();
  }, [onDiscovery]);

  return (
    <>
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Popup Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[190] flex flex-col gap-3 p-4 rounded-3xl"
            style={{
              background: 'rgba(20, 10, 30, 0.95)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)',
            }}
          >
            {/* Create Room Option */}
            <motion.button
              onClick={handleCreateRoom}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-colors"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                }}
              >
                <Plus size={24} className="text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-white">Raum Erstellen</span>
                <span className="text-[10px] text-white/50">Starte ein neues Gespräch</span>
              </div>
            </motion.button>

            {/* Discovery Option */}
            <motion.button
              onClick={handleDiscovery}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <Compass size={24} className="text-amber-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-white">Discovery Übersicht</span>
                <span className="text-[10px] text-white/50">Entdecke aktive Gespräche</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Liquid Gum Button */}
      <motion.button
        onClick={handleButtonClick}
        // Organic Breathing Animation
        animate={isMenuOpen ? {
          borderRadius: '50%',
          rotate: 45,
        } : {
          borderRadius: [
            '30% 70% 70% 30% / 30% 30% 70% 70%',
            '60% 40% 60% 40% / 40% 60% 40% 60%',
            '40% 60% 40% 60% / 60% 40% 60% 40%',
            '70% 30% 30% 70% / 70% 70% 30% 30%',
            '30% 70% 70% 30% / 30% 30% 70% 70%',
          ],
          rotate: 0,
        }}
        transition={isMenuOpen ? {
          type: 'spring',
          stiffness: 500,
          damping: 30,
        } : {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        // Squish Effect
        whileHover={{
          scale: 1.15,
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.7)',
        }}
        whileTap={{
          scale: 0.85,
          borderRadius: '50%',
          rotate: -10,
        }}
        className="relative w-16 h-16 flex items-center justify-center z-[200]"
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #7c3aed 100%)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Inner Glow */}
        <motion.div
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Pulsing Ring */}
        {!isMenuOpen && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: '2px solid rgba(168, 85, 247, 0.4)',
            }}
            animate={{
              scale: [1, 1.4, 1.6],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Icon */}
        <motion.div
          animate={{ rotate: isMenuOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isMenuOpen ? (
            <X size={28} className="text-white drop-shadow-lg" />
          ) : (
            <Plus size={28} className="text-white drop-shadow-lg" />
          )}
        </motion.div>
      </motion.button>
    </>
  );
};

export default LiquidGumButton;
