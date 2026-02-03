/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SWIPE NAVIGATOR - Horizontal Tab Pager with Framer Motion
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Apple-Style swipe navigation between main screens:
 * - Index 0: Profil
 * - Index 1: Live-Radar (Home)
 * - Index 2: Wölkchen-Directory (Discover)
 *
 * Features:
 * - Fluid swipe gestures with spring physics
 * - Haptic feedback on page change
 * - Central floating action button
 * - Page indicators with glow effect
 *
 * @author Lead Architect @ Apple + CPO @ Snapchat
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, lazy, Suspense, ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Compass, Users, Cloud, Plus, Sparkles } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SwipeNavigatorProps {
  children?: ReactNode;
  initialPage?: number;
}

interface PageConfig {
  id: string;
  icon: typeof User;
  label: string;
  component: React.LazyExoticComponent<() => JSX.Element>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADED PAGES
// ═══════════════════════════════════════════════════════════════════════════════

const ProfilePage = lazy(() => import('@/pages/Profile'));
const HomePage = lazy(() => import('@/pages/Home'));
const DiscoverPage = lazy(() => import('@/pages/Discover'));

const pages: PageConfig[] = [
  { id: 'profile', icon: User, label: 'Profil', component: ProfilePage },
  { id: 'home', icon: Compass, label: 'Radar', component: HomePage },
  { id: 'discover', icon: Users, label: 'Wölkchen', component: DiscoverPage },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SWIPE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const SWIPE_POWER = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

const PageLoader = () => (
  <div className="flex items-center justify-center h-full bg-dark-base">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white/50 text-sm">Lade...</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SwipeNavigator = ({ initialPage = 1 }: SwipeNavigatorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();

  const [[page, direction], setPage] = useState([initialPage, 0]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const controls = useAnimation();

  // Sync with URL
  useEffect(() => {
    const pathToPage: Record<string, number> = {
      '/profile': 0,
      '/': 1,
      '/home': 1,
      '/discover': 2,
    };

    const currentPage = pathToPage[location.pathname];
    if (currentPage !== undefined && currentPage !== page) {
      setPage([currentPage, currentPage > page ? 1 : -1]);
    }
  }, [location.pathname]);

  // Navigate to page
  const goToPage = useCallback((newPage: number) => {
    if (newPage < 0 || newPage >= pages.length) return;

    const newDirection = newPage > page ? 1 : -1;
    setPage([newPage, newDirection]);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Update URL
    const pageToPath = ['/profile', '/', '/discover'];
    navigate(pageToPath[newPage], { replace: true });
  }, [page, navigate]);

  // Handle swipe gesture
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipe = SWIPE_POWER(info.offset.x, info.velocity.x);

      if (swipe < -SWIPE_CONFIDENCE_THRESHOLD && page < pages.length - 1) {
        goToPage(page + 1);
      } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD && page > 0) {
        goToPage(page - 1);
      }
    },
    [page, goToPage]
  );

  // Create random room and join
  const handleCreateRandomRoom = async () => {
    if (!user?.id || isCreatingRoom) return;

    setIsCreatingRoom(true);

    try {
      // Create a new room with random name
      const roomNames = [
        'Chill Wölkchen ☁️',
        'Night Vibes 🌙',
        'Random Talk 💬',
        'Neue Freunde 💜',
        'Spontan Chat ✨',
      ];
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

      // Navigate to discover and auto-join
      navigate('/discover', {
        state: { joinRoom: true, mode: 'public' },
      });

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }

    setIsCreatingRoom(false);
  };

  const PageComponent = pages[page].component;

  return (
    <div className="h-screen w-screen bg-dark-base overflow-hidden relative">
      {/* Page Content */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 h-full w-full"
        >
          <Suspense fallback={<PageLoader />}>
            <PageComponent />
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-base via-dark-base/90 to-transparent pointer-events-none" />

        <div className="relative px-6 pb-6 pt-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {/* Left Nav Button */}
            <NavButton
              icon={pages[0].icon}
              label={pages[0].label}
              isActive={page === 0}
              onClick={() => goToPage(0)}
            />

            {/* Central Cloud Button */}
            <div className="relative -mt-8">
              <motion.button
                onClick={handleCreateRandomRoom}
                disabled={isCreatingRoom}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
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

                {/* Icon */}
                {isCreatingRoom ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={28} className="text-white" />
                  </motion.div>
                ) : (
                  <Cloud size={28} className="text-white relative z-10" />
                )}

                {/* Border */}
                <div className="absolute inset-0 rounded-full border-4 border-dark-base" />
              </motion.button>

              {/* Label */}
              <p className="text-[10px] text-white/50 text-center mt-2 font-medium">
                Zufälliges Wölkchen
              </p>
            </div>

            {/* Right Nav Button */}
            <NavButton
              icon={pages[2].icon}
              label={pages[2].label}
              isActive={page === 2}
              onClick={() => goToPage(2)}
            />
          </div>

          {/* Page Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {pages.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => goToPage(i)}
                className="relative"
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  animate={{
                    backgroundColor: page === i ? '#A855F7' : 'rgba(255,255,255,0.2)',
                    scale: page === i ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                />
                {page === i && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-purple-500"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NAV BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

const NavButton = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: typeof User;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center gap-1"
  >
    <motion.div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
        isActive
          ? 'bg-purple-500/20 text-purple-400'
          : 'bg-white/5 text-white/40'
      }`}
      animate={{
        scale: isActive ? 1.1 : 1,
      }}
    >
      <Icon size={22} />
    </motion.div>
    <span
      className={`text-[10px] font-medium transition-colors ${
        isActive ? 'text-purple-400' : 'text-white/40'
      }`}
    >
      {label}
    </span>
  </motion.button>
);

export default SwipeNavigator;
