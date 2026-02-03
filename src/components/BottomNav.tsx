/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOTTOM NAVIGATION - Sovereign Discovery v24.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Clean 4-Item Navigation with Central Action Button (+)
 * - Index 0: Home/Radar
 * - Index 1: Discover/Wölkchen
 * - CENTRAL: + Button (CloudActionMenu)
 * - Index 2: Messages
 * - Index 3: Profil
 *
 * @version 24.0.0
 */

import { useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudActionMenu } from './CloudActionMenu';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

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
      <motion.button
        onClick={handleActionClick}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-[52px] left-1/2 -translate-x-1/2 z-[100]"
        style={{
          width: 56,
          height: 56,
        }}
      >
        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Button */}
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)',
          }}
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </div>
      </motion.button>

      {/* Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom z-50 theme-transition"
        style={{
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
          {/* Left Nav Items */}
          {leftNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-white/40 hover:text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    className="relative"
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} stroke="currentColor" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-left"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full"
                        style={{ boxShadow: '0 0 6px rgba(139, 92, 246, 0.6)' }}
                      />
                    )}
                  </motion.div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Central Spacer for the + button */}
          <div className="w-16" />

          {/* Right Nav Items */}
          {rightNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-white/40 hover:text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    className="relative"
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} stroke="currentColor" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator-right"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full"
                        style={{ boxShadow: '0 0 6px rgba(139, 92, 246, 0.6)' }}
                      />
                    )}
                  </motion.div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
