/**
 * SovereignNav.tsx
 * 🎯 SOVEREIGN NAVIGATION DOCK v39.0
 *
 * Bottom Navigation with:
 * - Home, Rooms, Central Plus, Friends, Profile
 * - Pulsing central action button
 * - Sovereign Glass Design
 * - z-[999] for visibility
 *
 * @version 39.0.0 - GODMODE Architecture
 */

import React, { useState, useCallback, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Radio, Plus, Users, User } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';

// ═══════════════════════════════════════════════════════════════════════════
// CREATE ROOM QUICK MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const QuickCreateModal = memo(function QuickCreateModal({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
}: QuickCreateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998]"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-sm"
          >
            <div
              className="rounded-3xl overflow-hidden p-1"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
              }}
            >
              <div
                className="rounded-[22px] p-5"
                style={{
                  background: 'rgba(10, 8, 20, 0.95)',
                  backdropFilter: 'blur(40px)',
                }}
              >
                {/* Title */}
                <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-5">
                  Room Optionen
                </h3>

                <div className="space-y-3">
                  {/* Create Room */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      onCreateRoom();
                      onClose();
                    }}
                    className="w-full py-5 rounded-2xl flex flex-col items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                    }}
                  >
                    <span className="text-3xl">🎙️</span>
                    <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                      Room erstellen
                    </span>
                    <span className="text-[10px] text-white/40">
                      Starte deinen eigenen Voice Room
                    </span>
                  </motion.button>

                  {/* Browse Rooms */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('light');
                      onJoinRoom();
                      onClose();
                    }}
                    className="w-full py-4 rounded-2xl flex flex-col items-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span className="text-2xl">🔍</span>
                    <span className="text-xs font-bold tracking-wider uppercase text-white/60">
                      Rooms entdecken
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// NAV ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = memo(function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
          isActive ? 'text-violet-400' : 'text-white/40'
        }`
      }
    >
      {({ isActive }) => (
        <motion.div
          className="flex flex-col items-center gap-1"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className="relative"
            style={{
              filter: isActive ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))' : 'none',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            {isActive && (
              <motion.div
                layoutId="nav-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full"
                style={{ boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)' }}
              />
            )}
          </div>
          <span className="text-[10px] font-medium">{label}</span>
        </motion.div>
      )}
    </NavLink>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// CENTRAL ACTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface CentralButtonProps {
  onClick: () => void;
}

const CentralButton = memo(function CentralButton({ onClick }: CentralButtonProps) {
  return (
    <motion.button
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      whileTap={{ scale: 0.9 }}
      className="relative w-16 h-16 -mt-6"
    >
      {/* Outer Pulse Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
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

      {/* Inner Pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Button Core */}
      <div
        className="relative w-full h-full rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          boxShadow:
            '0 8px 32px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
          border: '3px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Plus size={32} className="text-white" strokeWidth={2.5} />
      </div>
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN NAVIGATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SovereignNav() {
  const navigate = useNavigate();
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const handleCreateRoom = useCallback(() => {
    navigate('/rooms?create=true');
  }, [navigate]);

  const handleJoinRoom = useCallback(() => {
    navigate('/rooms');
  }, [navigate]);

  return (
    <>
      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      {/* Navigation Bar - z-[999] */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[999]"
        style={{
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-end justify-around h-20 max-w-lg mx-auto px-2 pb-safe">
          {/* Left Side */}
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/rooms" icon={Radio} label="Rooms" />

          {/* Central Button */}
          <CentralButton onClick={() => setShowQuickCreate(true)} />

          {/* Right Side */}
          <NavItem to="/friends" icon={Users} label="Friends" />
          <NavItem to="/profile" icon={User} label="Profil" />
        </div>
      </nav>
    </>
  );
}

export { QuickCreateModal, NavItem, CentralButton };
