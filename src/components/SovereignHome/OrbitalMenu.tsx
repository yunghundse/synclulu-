/**
 * OrbitalMenu.tsx
 * Floating orbital navigation menu at the bottom of the screen
 * Provides seamless switching between Map, Messenger, and Discovery Feed
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MessageCircle, Compass, Plus, X, Sparkles, Radio } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface OrbitalMenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path: string;
  gradient: string;
  badge?: number;
}

interface OrbitalMenuProps {
  unreadMessages?: number;
  newDiscoveries?: number;
  onCreateClick?: () => void;
}

const menuItems: OrbitalMenuItem[] = [
  {
    id: 'discover',
    icon: Compass,
    label: 'Entdecken',
    path: '/discover',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'map',
    icon: Map,
    label: 'Karte',
    path: '/radar',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'messages',
    icon: MessageCircle,
    label: 'Chat',
    path: '/messages',
    gradient: 'from-pink-500 to-rose-600',
  },
];

const OrbitalItem = memo(function OrbitalItem({
  item,
  isActive,
  isExpanded,
  index,
  totalItems,
  badge,
  onClick,
}: {
  item: OrbitalMenuItem;
  isActive: boolean;
  isExpanded: boolean;
  index: number;
  totalItems: number;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;

  // Calculate orbital position when expanded
  const angle = isExpanded ? -60 + (index * 60) : 0;
  const radius = isExpanded ? 80 : 0;
  const x = Math.sin((angle * Math.PI) / 180) * radius;
  const y = -Math.cos((angle * Math.PI) / 180) * radius;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: isExpanded ? 1 : 0,
        scale: isExpanded ? 1 : 0,
        x: x,
        y: y,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: isExpanded ? index * 0.05 : 0,
      }}
      className="absolute"
      style={{
        pointerEvents: isExpanded ? 'auto' : 'none',
      }}
    >
      {/* Glow Effect */}
      {isActive && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.gradient} blur-xl opacity-40`}
          style={{ transform: 'scale(1.5)' }}
        />
      )}

      {/* Button */}
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
          isActive
            ? `bg-gradient-to-r ${item.gradient}`
            : 'bg-white/10 hover:bg-white/15'
        }`}
        style={{
          boxShadow: isActive
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1"
          >
            <span className="text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          </motion.div>
        )}
      </div>

      {/* Label */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/60 whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export const OrbitalMenu = memo(function OrbitalMenu({
  unreadMessages = 0,
  newDiscoveries = 0,
  onCreateClick,
}: OrbitalMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { tap, pop, swoosh } = useHapticFeedback();

  const getBadge = (itemId: string): number | undefined => {
    if (itemId === 'messages') return unreadMessages || undefined;
    if (itemId === 'discover') return newDiscoveries || undefined;
    return undefined;
  };

  const handleItemClick = (path: string) => {
    tap();
    navigate(path);
    setIsExpanded(false);
  };

  const handleCenterClick = () => {
    pop();
    if (isExpanded) {
      // If expanded, close the menu
      setIsExpanded(false);
    } else {
      // If collapsed, open the menu
      setIsExpanded(true);
    }
  };

  const handleCreateClick = () => {
    swoosh();
    setIsExpanded(false);
    onCreateClick?.();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: -1 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Orbital Container */}
      <div className="relative flex items-center justify-center">
        {/* Orbital Items */}
        {menuItems.map((item, index) => (
          <OrbitalItem
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            isExpanded={isExpanded}
            index={index}
            totalItems={menuItems.length}
            badge={getBadge(item.id)}
            onClick={() => handleItemClick(item.path)}
          />
        ))}

        {/* Quick Action Buttons when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Create Cloud Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -100 }}
                exit={{ opacity: 0, scale: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
                onClick={handleCreateClick}
                className="absolute"
              >
                <div
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center"
                  style={{
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  <Sparkles size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/60 whitespace-nowrap">
                  Erstellen
                </span>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Center Button */}
        <motion.button
          onClick={handleCenterClick}
          whileTap={{ scale: 0.95 }}
          animate={{
            rotate: isExpanded ? 45 : 0,
          }}
          className="relative z-10"
        >
          {/* Pulse Ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-violet-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Main Button */}
          <div
            className="relative w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center"
            style={{
              boxShadow: '0 4px 30px rgba(139, 92, 246, 0.5)',
            }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 0 }}
            >
              {isExpanded ? (
                <X size={24} className="text-white" />
              ) : (
                <Radio size={24} className="text-white" />
              )}
            </motion.div>
          </div>

          {/* Total Badge */}
          {!isExpanded && (unreadMessages + newDiscoveries) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-red-500 flex items-center justify-center px-1"
            >
              <span className="text-[10px] font-bold text-white">
                {(unreadMessages + newDiscoveries) > 99 ? '99+' : unreadMessages + newDiscoveries}
              </span>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Quick Label */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2"
          >
            <span className="text-[10px] text-white/40 whitespace-nowrap">
              Tippe zum Navigieren
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default OrbitalMenu;
