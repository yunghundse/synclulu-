/**
 * SovereignController.tsx
 * 👑 SOVEREIGN DISCOVERY - Das zentrale Gehirn der App
 *
 * Dieses Modul verbindet alle Features zu einem einzigen,
 * unzerstörbaren System. Keine Dateikonflikte, keine Lücken.
 *
 * @design Apple HIG × Snapchat Flow-States
 * @version 23.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useRobustLocation } from '@/hooks/useRobustLocation';
import { Cloud, MessageCircle, Settings, User, Search, Plus, X, Flame, Shield, Users } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ActiveLayer = 'map' | 'lobby' | 'profile' | 'messages' | 'settings';

interface SovereignControllerProps {
  children?: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Sovereign Map - Living Background Layer */
const SovereignMap: React.FC<{ location: { lat: number; lon: number } | null; isActive: boolean }> = memo(({
  location,
  isActive
}) => (
  <motion.div
    animate={{
      scale: isActive ? 1 : 0.95,
      filter: isActive ? 'blur(0px)' : 'blur(20px)',
    }}
    transition={SPRING_CONFIG}
    className="absolute inset-0 z-0"
  >
    {/* Discovery Glow Background */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#0a0a0a]">
      {/* Radial pulse effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] animate-pulse" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Location indicator */}
      {location && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-32 h-32 rounded-full bg-purple-500/20"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.8)]" />
        </div>
      )}
    </div>
  </motion.div>
));

SovereignMap.displayName = 'SovereignMap';

/** Discovery Orb - Central Action Button */
const DiscoveryOrb: React.FC<{
  isSearching: boolean;
  onTrigger: () => void;
}> = memo(({ isSearching, onTrigger }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="absolute bottom-24 left-0 right-0 flex flex-col items-center z-50"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={onTrigger}
      disabled={isSearching}
      className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_60px_rgba(124,58,237,0.4)] flex items-center justify-center border-4 border-white/10"
    >
      {/* Pulse rings */}
      <motion.div
        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-purple-500/30"
      />
      <motion.div
        animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className="absolute inset-0 rounded-full bg-purple-500/20"
      />

      {/* Icon */}
      <motion.div
        animate={isSearching ? { rotate: 360 } : {}}
        transition={isSearching ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        className="text-4xl"
      >
        ☁️
      </motion.div>
    </motion.button>

    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
      {isSearching ? 'Scanning...' : 'Discovery Mode'}
    </p>
  </motion.div>
));

DiscoveryOrb.displayName = 'DiscoveryOrb';

/** Cloud Sheet - Lobby Overlay */
const CloudSheet: React.FC<{
  location: { lat: number; lon: number } | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}> = memo(({ location, onClose, onNavigate }) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    exit={{ y: '100%' }}
    transition={SPRING_CONFIG}
    className="absolute inset-x-0 bottom-0 z-50"
  >
    <div className="bg-[#0a0a0a]/95 backdrop-blur-xl rounded-t-[40px] border-t border-white/5 p-6 pb-12">
      {/* Handle */}
      <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Discovery</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={20} className="text-white/60" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('/discover')}
          className="p-6 rounded-3xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20"
        >
          <Search size={32} className="text-purple-400 mb-3" />
          <p className="text-white font-semibold">Entdecken</p>
          <p className="text-white/50 text-xs mt-1">Finde Räume in der Nähe</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('/discover?create=true')}
          className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20"
        >
          <Plus size={32} className="text-emerald-400 mb-3" />
          <p className="text-white font-semibold">Erstellen</p>
          <p className="text-white/50 text-xs mt-1">Starte ein neues Wölkchen</p>
        </motion.button>
      </div>

      {/* Quick Stats */}
      {location && (
        <div className="mt-6 p-4 rounded-2xl bg-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Users size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Standort aktiv</p>
            <p className="text-white/40 text-xs">500m Radius wird gescannt</p>
          </div>
        </div>
      )}
    </div>
  </motion.div>
));

CloudSheet.displayName = 'CloudSheet';

/** Profile Overlay - Morph Effect */
const ProfileOverlay: React.FC<{
  user: any;
  onClose: () => void;
  onNavigate: (path: string) => void;
}> = memo(({ user, onClose, onNavigate }) => {
  const isFounder = user?.id === FOUNDER_UID;
  const trustScore = (user as any)?.trustScore || 750;
  const trustPercentage = (trustScore / 1000) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl"
    >
      <div className="h-full flex flex-col p-6 safe-top safe-bottom">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="self-end w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6"
        >
          <X size={20} className="text-white/60" />
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={SPRING_CONFIG}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Avatar with Trust Ring */}
          <div className="relative mb-6">
            {/* Trust Ring */}
            <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke={trustScore >= 800 ? '#10b981' : trustScore >= 500 ? '#7c3aed' : '#f59e0b'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${trustPercentage * 3.52} 352`}
                initial={{ strokeDashoffset: 352 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            </svg>

            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden border-4 border-[#0a0a0a]">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-white font-bold">
                  {user?.displayName?.charAt(0) || '?'}
                </span>
              )}
            </div>

            {/* Founder Crown */}
            {isFounder && (
              <div className="absolute -top-2 -right-2 text-2xl">👑</div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-white mb-1">
            {user?.displayName || user?.username || 'Anonymous'}
          </h2>
          <p className="text-white/50 text-sm mb-6">@{user?.username || 'user'}</p>

          {/* Trust Score */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-8">
            <Shield size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm font-medium">{trustScore} Trust</span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/profile')}
              className="p-4 rounded-2xl bg-white/10 text-center"
            >
              <User size={24} className="text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Profil</p>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/friends')}
              className="p-4 rounded-2xl bg-white/10 text-center"
            >
              <Users size={24} className="text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Freunde</p>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/profile/trust-stats')}
              className="p-4 rounded-2xl bg-white/10 text-center"
            >
              <Shield size={24} className="text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Trust</p>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('/settings')}
              className="p-4 rounded-2xl bg-white/10 text-center"
            >
              <Settings size={24} className="text-white/80 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Settings</p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

ProfileOverlay.displayName = 'ProfileOverlay';

/** Messages Blade - Glass Slide */
const MessagesBlade: React.FC<{
  onClose: () => void;
  onNavigate: (path: string) => void;
}> = memo(({ onClose, onNavigate }) => (
  <motion.div
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={SPRING_CONFIG}
    className="absolute inset-y-0 right-0 w-[85%] max-w-md z-50"
  >
    <div className="h-full bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/5 p-6 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Nachrichten</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={20} className="text-white/60" />
        </button>
      </div>

      {/* Messages List Placeholder */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('/messages')}
            className="w-full p-4 rounded-2xl bg-white/5 flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">User {i}</p>
              <p className="text-white/40 text-sm truncate">Letzte Nachricht...</p>
            </div>
            <Flame size={16} className="text-orange-400" />
          </motion.button>
        ))}
      </div>

      {/* View All Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('/messages')}
        className="w-full mt-6 p-4 rounded-2xl bg-purple-600/20 border border-purple-500/20 text-center"
      >
        <p className="text-purple-400 font-medium">Alle Nachrichten</p>
      </motion.button>
    </div>
  </motion.div>
));

MessagesBlade.displayName = 'MessagesBlade';

// ============================================================================
// MAIN CONTROLLER
// ============================================================================

export const SovereignController: React.FC<SovereignControllerProps> = memo(({ children }) => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { location, isStale } = useRobustLocation();

  // --- CENTRAL STATE MANAGEMENT ---
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('map');
  const [isSearching, setIsSearching] = useState(false);

  // Convert location to simple format
  const simpleLocation = location ? {
    lat: location.latitude,
    lon: location.longitude,
  } : null;

  // --- FEATURE FUSION LOGIC ---
  const handleDiscoveryTrigger = useCallback(() => {
    if (isSearching) return;

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 30]);
    }

    setIsSearching(true);

    // Simulate discovery scan
    setTimeout(() => {
      setActiveLayer('lobby');
      setIsSearching(false);
    }, 1200);
  }, [isSearching]);

  const handleNavigate = useCallback((path: string) => {
    setActiveLayer('map');
    navigate(path);
  }, [navigate]);

  const handleLayerClose = useCallback(() => {
    setActiveLayer('map');
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] text-white select-none overflow-hidden">
      {/* 1. DIE IMMERSIVE KARTE (Hintergrund-Ebene) */}
      <SovereignMap
        location={simpleLocation}
        isActive={activeLayer === 'map'}
      />

      {/* 2. DER DYNAMISCHE DISCOVERY-ORB */}
      <AnimatePresence>
        {activeLayer === 'map' && (
          <DiscoveryOrb
            isSearching={isSearching}
            onTrigger={handleDiscoveryTrigger}
          />
        )}
      </AnimatePresence>

      {/* 3. DIE OVERLAY-EBENEN */}
      <AnimatePresence mode="wait">
        {activeLayer === 'lobby' && (
          <CloudSheet
            location={simpleLocation}
            onClose={handleLayerClose}
            onNavigate={handleNavigate}
          />
        )}
        {activeLayer === 'profile' && (
          <ProfileOverlay
            user={user}
            onClose={handleLayerClose}
            onNavigate={handleNavigate}
          />
        )}
        {activeLayer === 'messages' && (
          <MessagesBlade
            onClose={handleLayerClose}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>

      {/* 4. DER QUICK-ACCESS HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-40 safe-top">
        {/* Profile Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveLayer('profile')}
          className="relative"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-xl">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-white" />
            )}
          </div>

          {/* Stale Location Indicator */}
          {isStale && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#050505]" />
          )}
        </motion.button>

        {/* Right Actions */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveLayer('messages')}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5"
          >
            <MessageCircle size={20} className="text-white/80" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5"
          >
            <Settings size={20} className="text-white/80" />
          </motion.button>
        </div>
      </div>

      {/* Children (if any) */}
      {children}
    </div>
  );
});

SovereignController.displayName = 'SovereignController';

export default SovereignController;
