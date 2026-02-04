/**
 * GlobalDock.tsx
 * Universal Bottom Navigation - Chief Software Architect Edition
 *
 * Features:
 * - 4 Icons: [Home] – [Kaugummi] – [Messages] – [Settings]
 * - Liquid Gum Button in der Mitte
 * - Persistent auf allen Seiten
 * - Active State Tracking
 * - Safe Area Support
 * - GPU-beschleunigt
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Settings, Map } from 'lucide-react';
import { LiquidGumButton } from './LiquidGumButton';

// ═══════════════════════════════════════════════════════════════
// NAV ICON COMPONENT
// ═══════════════════════════════════════════════════════════════
interface NavIconProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NavIcon = memo(function NavIcon({
  active,
  onClick,
  label,
  icon,
  badge,
}: NavIconProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-1 transition-all relative"
    >
      <motion.div
        animate={{
          scale: active ? 1.15 : 1,
          opacity: active ? 1 : 0.4,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative"
      >
        {icon}

        {/* Badge */}
        {badge && badge > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </motion.div>

      <span
        className={`text-[8px] font-black uppercase tracking-[0.15em] transition-colors ${
          active ? 'text-violet-400' : 'text-white/25'
        }`}
      >
        {label}
      </span>

      {/* Active Indicator Dot */}
      {active && (
        <motion.div
          layoutId="dockActiveIndicator"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-violet-400"
          style={{ boxShadow: '0 0 6px #a855f7' }}
        />
      )}
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN GLOBAL DOCK COMPONENT
// ═══════════════════════════════════════════════════════════════
interface GlobalDockProps {
  unreadMessages?: number;
}

export const GlobalDock = memo(function GlobalDock({
  unreadMessages = 0,
}: GlobalDockProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active page
  const getActivePage = useCallback(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/discover' || path === '/map') return 'discover';
    if (path === '/messages' || path === '/chat') return 'messages';
    if (path.startsWith('/settings') || path === '/legal' || path === '/legal-center') return 'settings';
    return 'home';
  }, [location.pathname]);

  const activePage = getActivePage();

  // Navigation handlers
  const handleHome = useCallback(() => navigate('/'), [navigate]);
  const handleMessages = useCallback(() => navigate('/messages'), [navigate]);
  const handleSettings = useCallback(() => navigate('/settings'), [navigate]);
  const handleCreateRoom = useCallback(() => navigate('/create-room'), [navigate]);
  const handleDiscovery = useCallback(() => navigate('/discover'), [navigate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] pb-safe">
      <div className="px-4 pb-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="max-w-md mx-auto h-[72px] flex items-center justify-around px-4 rounded-[28px]"
          style={{
            background: 'rgba(5, 5, 10, 0.88)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* HOME */}
          <NavIcon
            active={activePage === 'home'}
            onClick={handleHome}
            label="Home"
            icon={<Home size={22} className={activePage === 'home' ? 'text-violet-400' : 'text-white'} />}
          />

          {/* DISCOVER / MAP */}
          <NavIcon
            active={activePage === 'discover'}
            onClick={handleDiscovery}
            label="Map"
            icon={<Map size={22} className={activePage === 'discover' ? 'text-violet-400' : 'text-white'} />}
          />

          {/* LIQUID GUM BUTTON (Center) */}
          <div className="relative -mt-10">
            <LiquidGumButton
              onCreateRoom={handleCreateRoom}
              onDiscovery={handleDiscovery}
            />
          </div>

          {/* MESSAGES */}
          <NavIcon
            active={activePage === 'messages'}
            onClick={handleMessages}
            label="Chat"
            icon={<MessageCircle size={22} className={activePage === 'messages' ? 'text-violet-400' : 'text-white'} />}
            badge={unreadMessages}
          />

          {/* SETTINGS */}
          <NavIcon
            active={activePage === 'settings'}
            onClick={handleSettings}
            label="Settings"
            icon={<Settings size={22} className={activePage === 'settings' ? 'text-violet-400' : 'text-white'} />}
          />
        </motion.div>
      </div>
    </div>
  );
});

export default GlobalDock;
