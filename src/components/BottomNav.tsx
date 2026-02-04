/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOTTOM NAVIGATION - Sovereign Discovery v26.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Performance-optimized Navigation with GPU acceleration
 * + Sync Progress Bar (Aura-Flow)
 * + Elastic Dock Effect
 *
 * @version 26.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Plus } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { CloudActionMenu } from './CloudActionMenu';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // GPU-accelerated spring for smooth progress
  const progressSpring = useSpring(syncProgress, {
    stiffness: 50,
    damping: 20,
    mass: 0.5
  });

  // Subscribe to user's aura/sync progress
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const auraScore = data.auraScore || 0;
        const newProgress = auraScore % 100; // Progress within current level

        // Check for level up
        if (newProgress < syncProgress && syncProgress > 90) {
          setShowLevelUp(true);
          // Haptic feedback for level up
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

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
  }, []);

  // Central Action Button handlers
  const handleActionClick = useCallback(() => {
    triggerHaptic();
    setIsActionMenuOpen(true);
  }, [triggerHaptic]);

  const handleSearchClick = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    navigate('/create-room');
  }, [navigate]);

  // Navigation items (split for central button)
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
        onSearch={handleSearchClick}
        onCreate={handleCreateClick}
      />

      {/* Central Action Button (+) - Floating above nav */}
      <div
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{
          bottom: 56,
          zIndex: 100,
        }}
      >
        <motion.button
          onClick={handleActionClick}
          whileTap={{ scale: 0.9 }}
          className="relative w-16 h-16 cursor-pointer touch-manipulation"
          type="button"
          aria-label="Open action menu"
        >
          {/* Outer Glow Ring */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Inner Pulse Effect */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Button Core - Main clickable area */}
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
              border: '3px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Plus size={32} className="text-white" strokeWidth={2.5} />
          </div>
        </motion.button>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SYNC PROGRESS BAR - Aura Flow */}
      {/* ═══════════════════════════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[2px] z-[60] pointer-events-none"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        <motion.div
          className="h-full will-change-transform"
          style={{
            width: `${syncProgress}%`,
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 50%, #D946EF 100%)',
            boxShadow: showLevelUp
              ? '0 0 20px rgba(168, 85, 247, 1), 0 0 40px rgba(217, 70, 239, 0.8)'
              : '0 0 8px rgba(168, 85, 247, 0.6)',
            transform: 'translateZ(0)', // GPU acceleration
          }}
          animate={{
            opacity: showLevelUp ? [1, 0.5, 1] : 1,
          }}
          transition={{
            duration: showLevelUp ? 0.3 : 0,
            repeat: showLevelUp ? 3 : 0,
          }}
        />
      </div>

      {/* Level Up Glow Effect */}
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2 }}
          className="fixed bottom-0 left-0 right-0 h-20 z-[55] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(168, 85, 247, 0.3), transparent)',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom z-50 will-change-transform"
        style={{
          background: 'rgba(5, 5, 5, 0.9)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
          {/* Left Nav Items - Elastic Dock Effect */}
          {leftNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-white/40'
                }`
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-1 will-change-transform"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div
                    className="relative"
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} stroke="currentColor" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-left"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full"
                        style={{ boxShadow: '0 0 6px rgba(139, 92, 246, 0.6)' }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}

          {/* Central Spacer for the + button */}
          <div className="w-16" />

          {/* Right Nav Items - Elastic Dock Effect */}
          {rightNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-white/40'
                }`
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex flex-col items-center gap-1 will-change-transform"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div
                    className="relative"
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} stroke="currentColor" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-right"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full"
                        style={{ boxShadow: '0 0 6px rgba(139, 92, 246, 0.6)' }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
