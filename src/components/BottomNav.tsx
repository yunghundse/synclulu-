/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOTTOM NAVIGATION - Native Theme Adaptive v4.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Apple/Snapchat-Standard navigation with CENTRAL CLOUD BUTTON
 * - Index 0: Profil
 * - Index 1: Home/Radar
 * - CENTRAL: Zufälliges Wölkchen (Schnellstart)
 * - Index 2: Discover/Wölkchen
 * - Index 3: Messages
 *
 * @version 4.0.0
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Cloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

const BottomNav = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showRoomCreated, setShowRoomCreated] = useState(false);

  // Random room names
  const roomNames = [
    'Chill Wölkchen ☁️',
    'Night Vibes 🌙',
    'Random Talk 💬',
    'Neue Freunde 💜',
    'Spontan Chat ✨',
    'Vibe Check 🔮',
    'Late Night ☁️',
    'Coffee Talk ☕',
    'Good Vibes 🌈',
    'Deep Talk 💫',
  ];

  // Create random room and join
  const handleCreateRandomRoom = async () => {
    if (!user?.id || isCreatingRoom) return;

    setIsCreatingRoom(true);

    try {
      const randomName = roomNames[Math.floor(Math.random() * roomNames.length)];

      const roomData = {
        name: randomName,
        type: 'public',
        isAnonymous: false,
        participants: [],
        maxParticipants: 8,
        xpMultiplier: 1,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user.id,
      };

      await addDoc(collection(db, 'rooms'), roomData);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20, 10, 30]);
      }

      // Show success animation
      setShowRoomCreated(true);
      setTimeout(() => setShowRoomCreated(false), 1500);

      // Navigate to discover and auto-join
      navigate('/discover', {
        state: { joinRoom: true, mode: 'public' },
      });
    } catch (error) {
      console.error('Error creating room:', error);
    }

    setIsCreatingRoom(false);
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Entdecken' },
    // Central cloud button will be inserted here
    { to: '/messages', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <>
      {/* Room Created Toast */}
      <AnimatePresence>
        {showRoomCreated && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl"
          >
            <p className="text-white font-semibold text-sm flex items-center gap-2">
              <Cloud size={18} />
              Wölkchen erstellt! ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50 theme-transition">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
          {/* First two nav items */}
          {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[var(--delulu-accent)]'
                    : 'text-[var(--delulu-muted)] hover:text-[var(--delulu-text)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px var(--delulu-accent)) drop-shadow(0 0 3px var(--delulu-accent))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} stroke="currentColor" />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--delulu-accent)] rounded-full shadow-[0_0_6px_var(--delulu-accent)]" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* CENTRAL CLOUD BUTTON */}
          <div className="relative -mt-6">
            <motion.button
              onClick={handleCreateRandomRoom}
              disabled={isCreatingRoom || !user?.id}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* Animated glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Second glow ring (offset) */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />

              {/* Icon */}
              {isCreatingRoom ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 size={28} className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Cloud size={28} className="text-white relative z-10" />
                </motion.div>
              )}

              {/* Border ring */}
              <div
                className="absolute inset-0 rounded-full border-4"
                style={{ borderColor: 'var(--delulu-bg)' }}
              />
            </motion.button>

            {/* Label under button */}
            <p className="text-[9px] text-[var(--delulu-muted)] text-center mt-1 font-semibold whitespace-nowrap">
              Wölkchen
            </p>
          </div>

          {/* Last two nav items */}
          {navItems.slice(2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[var(--delulu-accent)]'
                    : 'text-[var(--delulu-muted)] hover:text-[var(--delulu-text)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                    style={{
                      filter: isActive
                        ? 'drop-shadow(0 0 8px var(--delulu-accent)) drop-shadow(0 0 3px var(--delulu-accent))'
                        : 'none',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} stroke="currentColor" />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--delulu-accent)] rounded-full shadow-[0_0_6px_var(--delulu-accent)]" />
                    )}
                  </div>
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
