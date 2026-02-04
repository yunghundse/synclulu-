/**
 * ObsidianNav.tsx
 * Universal Obsidian Glass Navigation - Fixed Bottom
 *
 * Features:
 * - 95% transparentes Obsidian-Glas
 * - Drei Icons: [Karte] – [Kaugummi-Button] – [Nachrichten]
 * - Identisch auf allen Seiten
 * - GPU-beschleunigt für flüssige Performance
 * - Safe Area Padding für moderne iPhones
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, MessageCircle } from 'lucide-react';
import { LiquidGumButton } from './LiquidGumButton';

interface ObsidianNavProps {
  onCreateRoom?: () => void;
  onDiscovery?: () => void;
}

export const ObsidianNav = memo(function ObsidianNav({
  onCreateRoom,
  onDiscovery,
}: ObsidianNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleCreateRoom = () => {
    if (onCreateRoom) {
      onCreateRoom();
    } else {
      navigate('/create-room');
    }
  };

  const handleDiscovery = () => {
    if (onDiscovery) {
      onDiscovery();
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] pb-safe">
      {/* Obsidian Glass Background */}
      <div
        className="mx-4 mb-4 px-6 py-3 rounded-[28px] flex items-center justify-between"
        style={{
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 -5px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Left: Map/Discovery Icon */}
        <motion.button
          onClick={() => navigate('/discover')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-3 rounded-xl"
          style={{
            background: isActive('/discover')
              ? 'rgba(168, 85, 247, 0.15)'
              : 'transparent',
          }}
        >
          <Map
            size={24}
            className={isActive('/discover') ? 'text-violet-400' : 'text-white/40'}
          />
          {isActive('/discover') && (
            <motion.div
              layoutId="navIndicator"
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400"
            />
          )}
        </motion.button>

        {/* Center: Liquid Gum Button */}
        <div className="relative -mt-8">
          <LiquidGumButton
            onCreateRoom={handleCreateRoom}
            onDiscovery={handleDiscovery}
          />
        </div>

        {/* Right: Messages Icon */}
        <motion.button
          onClick={() => navigate('/messages')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-3 rounded-xl"
          style={{
            background: isActive('/messages')
              ? 'rgba(168, 85, 247, 0.15)'
              : 'transparent',
          }}
        >
          <MessageCircle
            size={24}
            className={isActive('/messages') ? 'text-violet-400' : 'text-white/40'}
          />
          {isActive('/messages') && (
            <motion.div
              layoutId="navIndicator"
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400"
            />
          )}

          {/* Unread Badge Placeholder */}
          {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">3</span> */}
        </motion.button>
      </div>
    </div>
  );
});

export default ObsidianNav;
