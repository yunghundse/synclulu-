/**
 * GhostOrbitDock.tsx
 * 👻 SOVEREIGN NAVIGATION v27.0 - Ghost-Orbit-Dock
 *
 * Apple Dock × Snapchat Magnetic Interaction
 * - Physics-based spring animations
 * - Magnetic hover effect (items expand toward cursor)
 * - Crystalline glass-morphism
 * - OLED-optimized (#050505)
 *
 * @version 27.0.0
 * @design Chief Visionary Officer - synclulu
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Plus, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { CloudActionMenu } from './CloudActionMenu';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// ═══════════════════════════════════════════════════════════════════════════
// MAGNETIC DOCK ITEM - Apple Dock Physics
// ═══════════════════════════════════════════════════════════════════════════

interface DockItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  index: number;
  totalItems: number;
}

const DOCK_ITEM_SIZE = 48;
const DOCK_MAGNIFICATION = 1.5;
const MAGNETIC_DISTANCE = 150;

const DockItem = ({ to, icon: Icon, label, mouseX, index, totalItems }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // Calculate distance from mouse to this item
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Magnetic scale based on distance
  const scale = useTransform(distance, [-MAGNETIC_DISTANCE, 0, MAGNETIC_DISTANCE], [1, DOCK_MAGNIFICATION, 1]);

  // Spring physics for smooth animation
  const scaleSpring = useSpring(scale, {
    stiffness: 300,
    damping: 20,
    mass: 0.5,
  });

  // Y offset for "lift" effect
  const y = useTransform(scaleSpring, [1, DOCK_MAGNIFICATION], [0, -8]);

  return (
    <NavLink to={to} className="relative">
      {({ isActive }) => (
        <motion.div
          ref={ref}
          style={{
            scale: scaleSpring,
            y,
          }}
          whileTap={{ scale: 0.9 }}
          className="relative flex flex-col items-center gap-1 cursor-pointer will-change-transform"
        >
          {/* Glow Ring (Active) */}
          {isActive && (
            <motion.div
              layoutId="dock-glow"
              className="absolute -inset-2 rounded-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Icon Container - Crystalline Glass */}
          <div
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: isActive
                ? '1px solid rgba(139, 92, 246, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: isActive
                ? '0 4px 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.5}
              className={isActive ? 'text-violet-400' : 'text-white/40'}
              style={{
                filter: isActive ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : 'none',
              }}
            />

            {/* Crystalline Shimmer */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)',
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Label */}
          <span
            className={`text-[9px] font-medium transition-colors duration-200 ${
              isActive ? 'text-violet-400' : 'text-white/30'
            }`}
          >
            {label}
          </span>

          {/* Active Dot Indicator */}
          {isActive && (
            <motion.div
              layoutId="dock-indicator"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400"
              style={{
                boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)',
              }}
            />
          )}
        </motion.div>
      )}
    </NavLink>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CENTRAL CRYSTAL BUTTON
// ═══════════════════════════════════════════════════════════════════════════

const CrystalButton = ({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className="relative w-16 h-16 cursor-pointer touch-manipulation"
      type="button"
      aria-label="Open action menu"
    >
      {/* Outer Pulse Ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.2) 100%)',
        }}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Secondary Pulse */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'rgba(168, 85, 247, 0.3)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />

      {/* Crystal Core */}
      <motion.div
        className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #D946EF 100%)',
          boxShadow: `
            0 8px 32px rgba(139, 92, 246, 0.5),
            0 0 60px rgba(139, 92, 246, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.25),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2)
          `,
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        animate={{
          rotate: isOpen ? 45 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      >
        {/* Crystalline Refraction Lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 45%, transparent 55%),
              linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.1) 45%, transparent 55%)
            `,
          }}
        />

        {/* Rainbow Iridescence */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #8b5cf6, #ff0080)',
            backgroundSize: '300% 300%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Icon */}
        <Plus size={28} className="text-white relative z-10" strokeWidth={2.5} />
      </motion.div>

      {/* Sparkle Particles */}
      <AnimatePresence>
        {!isOpen && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: [0, (i - 1) * 30],
                  y: [0, -20 - i * 10],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              >
                <Sparkles size={10} className="text-violet-300" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AURA PROGRESS BAR - Crystalline Version
// ═══════════════════════════════════════════════════════════════════════════

const AuraProgressBar = ({ progress, showLevelUp }: { progress: number; showLevelUp: boolean }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-[3px] z-[60] pointer-events-none"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Progress Fill */}
      <motion.div
        className="h-full relative overflow-hidden"
        style={{
          width: `${progress}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 50,
          damping: 20,
        }}
      >
        {/* Gradient Base */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 30%, #D946EF 60%, #F472B6 100%)',
          }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['-100% 0%', '200% 0%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Glow */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: showLevelUp
              ? '0 0 20px rgba(217, 70, 239, 1), 0 0 40px rgba(139, 92, 246, 0.8)'
              : '0 0 10px rgba(168, 85, 247, 0.6)',
          }}
        />
      </motion.div>

      {/* Level Up Flash */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.5), transparent)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GHOST ORBIT DOCK - Main Component
// ═══════════════════════════════════════════════════════════════════════════

const GhostOrbitDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Mouse position for magnetic effect
  const mouseX = useMotionValue(Infinity);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
  }, [mouseX]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

  // Subscribe to user's aura progress
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const auraScore = data.auraScore || 0;
        const newProgress = auraScore % 100;

        // Level up detection
        if (newProgress < syncProgress && syncProgress > 90) {
          setShowLevelUp(true);
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50, 30, 100]);
          }
          setTimeout(() => setShowLevelUp(false), 2000);
        }

        setSyncProgress(newProgress);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, syncProgress]);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  }, []);

  const handleActionClick = useCallback(() => {
    triggerHaptic();
    setIsActionMenuOpen(true);
  }, [triggerHaptic]);

  // Navigation items
  const leftNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Entdecken' },
  ];

  const rightNavItems = [
    { to: '/messages', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <>
      {/* Cloud Action Menu */}
      <CloudActionMenu
        isOpen={isActionMenuOpen}
        onClose={() => setIsActionMenuOpen(false)}
        onSearch={() => navigate('/discover')}
        onCreate={() => navigate('/create-room')}
      />

      {/* Central Crystal Button */}
      <div
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto z-[100]"
        style={{ bottom: 52 }}
      >
        <CrystalButton onClick={handleActionClick} isOpen={isActionMenuOpen} />
      </div>

      {/* Aura Progress Bar */}
      <AuraProgressBar progress={syncProgress} showLevelUp={showLevelUp} />

      {/* Ghost Orbit Navigation - GPU Accelerated */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom z-50 will-change-transform"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          transform: 'translateZ(0)', // GPU Layer
        }}
      >
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-6">
          {/* Left Items */}
          {leftNavItems.map((item, index) => (
            <DockItem
              key={item.to}
              {...item}
              mouseX={mouseX}
              index={index}
              totalItems={leftNavItems.length + rightNavItems.length}
            />
          ))}

          {/* Central Spacer */}
          <div className="w-20" />

          {/* Right Items */}
          {rightNavItems.map((item, index) => (
            <DockItem
              key={item.to}
              {...item}
              mouseX={mouseX}
              index={index + leftNavItems.length}
              totalItems={leftNavItems.length + rightNavItems.length}
            />
          ))}
        </div>
      </nav>
    </>
  );
};

export default GhostOrbitDock;
