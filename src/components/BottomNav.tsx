/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOTTOM NAVIGATION - Sovereign Discovery v23.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Clean 4-Item Navigation with Floating Cloud Banner
 * - Index 0: Home/Radar
 * - Index 1: Discover/Wölkchen
 * - Index 2: Messages
 * - Index 3: Profil
 *
 * + Floating "Surfe auf neuen Wolken" Banner above navigation
 *
 * @version 23.0.0
 */

import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Cloud, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Don't show banner on discover page
  const isOnDiscoverPage = location.pathname === '/discover';
  const showBanner = !bannerDismissed && !isOnDiscoverPage;

  const handleBannerClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 5, 10]);
    }
    navigate('/discover');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Entdecken' },
    { to: '/messages', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <>
      {/* Floating Cloud Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-4 right-4 z-[55]"
          >
            <motion.button
              onClick={handleBannerClick}
              whileTap={{ scale: 0.98 }}
              className="relative w-full overflow-hidden rounded-2xl shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95) 0%, rgba(236, 72, 153, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Animated background sparkles */}
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px), radial-gradient(circle at 50% 20%, white 1px, transparent 1px)',
                  backgroundSize: '100px 100px',
                }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ y: [0, -2, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
                  >
                    <Cloud size={22} className="text-white" />
                  </motion.div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm tracking-wide">
                      Surfe jetzt auf neuen Wolken
                    </p>
                    <p className="text-white/70 text-xs">
                      Entdecke Voice Räume in deiner Nähe
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles size={18} className="text-white/80" />
                  </motion.div>
                </div>
              </div>

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </motion.button>

            {/* Dismiss button */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={(e) => {
                e.stopPropagation();
                setBannerDismissed(true);
              }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--delulu-card)] border border-[var(--delulu-border)] flex items-center justify-center shadow-lg"
            >
              <X size={14} className="text-[var(--delulu-muted)]" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50 theme-transition">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[var(--delulu-accent)]'
                    : 'text-[var(--delulu-muted)] hover:text-[var(--delulu-text)]'
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
                        ? 'drop-shadow(0 0 8px var(--delulu-accent)) drop-shadow(0 0 3px var(--delulu-accent))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} stroke="currentColor" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--delulu-accent)] rounded-full shadow-[0_0_6px_var(--delulu-accent)]"
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
