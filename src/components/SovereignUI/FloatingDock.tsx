/**
 * FloatingDock.tsx
 * Haptisches Floating Dock mit Magnet-Effekt
 * Inspiriert von macOS Dock + iOS Tab Bar
 */

import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  MessageCircle,
  User,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface DockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

const dockItems: DockItem[] = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'discover', icon: Compass, label: 'Entdecken', path: '/discover' },
  { id: 'sync', icon: Sparkles, label: 'Sync', path: '/sync' },
  { id: 'messages', icon: MessageCircle, label: 'Chats', path: '/messages' },
  { id: 'profile', icon: User, label: 'Profil', path: '/profile' },
];

interface DockIconProps {
  item: DockItem;
  isActive: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  index: number;
  totalItems: number;
  onClick: () => void;
}

const DockIcon = React.memo(function DockIcon({
  item,
  isActive,
  mouseX,
  index,
  totalItems,
  onClick,
}: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Berechne Distanz zur Maus für Magnet-Effekt
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Magnet-Effekt: Icons wachsen wenn Maus nah ist
  const widthSync = useTransform(distance, [-150, 0, 150], [52, 72, 52]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  // Y-Offset für den "Pop"-Effekt
  const ySync = useTransform(distance, [-150, 0, 150], [0, -12, 0]);
  const y = useSpring(ySync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const Icon = item.icon;
  const isSyncButton = item.id === 'sync';

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      className="relative flex items-center justify-center rounded-2xl transition-colors"
      style={{
        width,
        height: width,
        y,
        background: isActive
          ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
          : isSyncButton
          ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
          : 'transparent',
        boxShadow: isActive
          ? '0 8px 24px rgba(139, 92, 246, 0.4)'
          : isSyncButton
          ? '0 4px 20px rgba(168, 85, 247, 0.5)'
          : 'none',
      }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Glowing border for sync button */}
      {isSyncButton && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(139, 92, 246, 0.5))',
            filter: 'blur(8px)',
            zIndex: -1,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <Icon
        size={22}
        className={`transition-colors ${
          isActive || isSyncButton ? 'text-white' : 'text-white/60'
        }`}
      />

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1"
        >
          <span className="text-[10px] font-bold text-white">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        </motion.div>
      )}

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          layoutId="dock-indicator"
          className="absolute -bottom-2 w-1 h-1 rounded-full bg-violet-400"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
});

interface FloatingDockProps {
  messageBadge?: number;
}

export const FloatingDock = React.memo(function FloatingDock({
  messageBadge = 0,
}: FloatingDockProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const mouseX = useMotionValue(Infinity);

  // Badge zu Messages hinzufügen
  const itemsWithBadges = dockItems.map((item) =>
    item.id === 'messages' ? { ...item, badge: messageBadge } : item
  );

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      {/* Background blur container */}
      <div
        className="flex items-end gap-2 px-4 py-3 rounded-[28px]"
        style={{
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {itemsWithBadges.map((item, index) => (
          <DockIcon
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            mouseX={mouseX}
            index={index}
            totalItems={itemsWithBadges.length}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </motion.div>
  );
});

export default FloatingDock;
