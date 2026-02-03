import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocation } from '@/hooks/useLocation';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getLevelTitle, getStreakMultiplier } from '@/lib/uiCopy';
import {
  Wifi, WifiOff, Crown, Bell, Settings,
  Sparkles, TrendingUp, Users, Loader2,
  Radio, ChevronRight, MapPin, Eye, Clock,
  Lock, Zap
} from 'lucide-react';

// Components
import HeaderAnonymToggle from '@/components/HeaderAnonymToggle';
import StreakBanner from '@/components/StreakBanner';
import ChatGatekeeper from '@/components/ChatGatekeeper';
import { NebulaBadge } from '@/components/NebulaBadge';
import { PegasusMascot, FloatingMascot } from '@/components/Mascots';
import { ChatIdentityMode, NewsTickerItem, NebulaTier } from '@/types';

// Wanderer translations for anonymous mode
const WANDERER_NAMES: Record<string, string> = {
  de: 'Wanderer',
  en: 'Wanderer',
  es: 'Caminante',
  fr: 'Voyageur',
  pt: 'Andarilho',
};

interface NearbyUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  lastSeen: Date;
}

interface ProfileVisitor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  visitedAt: Date;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, isVerifiedStar } = useStore();
  const { location } = useLocation();
  const { language, t } = useTranslation();

  // Local state
  const [isAnonymous, setIsAnonymous] = useState(user?.isGlobalAnonymous || false);
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);

  // Real data from Firebase
  const [activeUsersNearby, setActiveUsersNearby] = useState(0);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [profileVisitors, setProfileVisitors] = useState<ProfileVisitor[]>([]);
  const [liveEvents, setLiveEvents] = useState<NewsTickerItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isPremium = (user as any)?.isPremium || false;

  // Fetch nearby users
  useEffect(() => {
    if (!location) {
      setActiveUsersNearby(0);
      setNearbyUsers([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('isActive', '==', true),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nearby: NearbyUser[] = [];

      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        if (doc.id === user?.id) return;
        if (!userData.location) return;

        // Calculate distance
        const lat1 = location.latitude;
        const lon1 = location.longitude;
        const lat2 = userData.location.latitude;
        const lon2 = userData.location.longitude;

        if (!lat2 || !lon2) return;

        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance <= 500) {
          nearby.push({
            id: doc.id,
            username: userData.username,
            displayName: userData.displayName || userData.username,
            avatar: userData.photoURL,
            level: userData.level || 1,
            lastSeen: userData.lastSeen?.toDate() || new Date(),
          });
        }
      });

      setActiveUsersNearby(nearby.length);
      setNearbyUsers(nearby.slice(0, 6));
    }, () => {
      setActiveUsersNearby(0);
      setNearbyUsers([]);
    });

    return () => unsubscribe();
  }, [location, user?.id]);

  // Fetch profile visitors (premium only)
  useEffect(() => {
    if (!user?.id || !isPremium) {
      setProfileVisitors([]);
      return;
    }

    const visitorsRef = collection(db, 'profileVisits');
    const q = query(
      visitorsRef,
      where('visitedUserId', '==', user.id),
      orderBy('visitedAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const visitors: ProfileVisitor[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        // Get visitor user data
        const visitorDoc = await getDocs(query(
          collection(db, 'users'),
          where('__name__', '==', data.visitorId),
          limit(1)
        ));

        if (!visitorDoc.empty) {
          const visitorData = visitorDoc.docs[0].data();
          visitors.push({
            id: data.visitorId,
            username: visitorData.username,
            displayName: visitorData.displayName || visitorData.username,
            avatar: visitorData.photoURL,
            visitedAt: data.visitedAt?.toDate() || new Date(),
          });
        }
      }

      setProfileVisitors(visitors);
    }, () => {
      setProfileVisitors([]);
    });

    return () => unsubscribe();
  }, [user?.id, isPremium]);

  // Fetch live events
  useEffect(() => {
    const eventsRef = collection(db, 'starEvents');
    const q = query(
      eventsRef,
      where('isLive', '==', true),
      orderBy('startedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: NewsTickerItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'star_live' as const,
          title: `${data.hostDisplayName} ist LIVE`,
          subtitle: data.title,
          starId: data.hostId,
          starUsername: data.hostUsername,
          starTier: data.hostTier || 'nebula',
          eventId: doc.id,
          priority: 10,
          createdAt: data.startedAt?.toDate() || new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        };
      });
      setLiveEvents(events);
    }, () => setLiveEvents([]));

    return () => unsubscribe();
  }, []);

  // Fetch unread notifications
  useEffect(() => {
    if (!user?.id) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    }, () => setUnreadNotifications(0));

    return () => unsubscribe();
  }, [user?.id]);

  // Auto-rotate ticker
  useEffect(() => {
    if (liveEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTickerIndex(i => (i + 1) % liveEvents.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [liveEvents.length]);

  // User stats
  const userLevel = (user as any)?.level || 1;
  const userStreak = (user as any)?.currentStreak || 0;
  const levelInfo = getLevelTitle(userLevel);
  const streakMultiplier = getStreakMultiplier(userStreak);

  const getGreetingName = () => {
    if (isAnonymous) return WANDERER_NAMES[language] || WANDERER_NAMES.de;
    return user?.username || user?.displayName || 'du';
  };

  // Quick Start - join random room
  const handleQuickStart = async () => {
    setIsSearching(true);

    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 30]);
    }

    await new Promise(r => setTimeout(r, 1200));

    setIsSearching(false);

    if (activeUsersNearby === 0) {
      // No one nearby - go to discover to create room
      navigate('/discover', { state: { createRoom: true } });
    } else {
      setShowGatekeeper(true);
    }
  };

  const handleGatekeeperChoice = (mode: ChatIdentityMode) => {
    setShowGatekeeper(false);
    navigate('/discover', { state: { joinRoom: true, mode } });

    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]);
    }
  };

  return (
    <div className="min-h-screen page-gradient safe-top pb-24 theme-transition">
      {/* Decorative Background - Theme Adaptive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 decorative-blob-1 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-80 h-80 decorative-blob-2 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 decorative-blob-3 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <HeaderAnonymToggle onToggle={setIsAnonymous} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-xl bg-[var(--glass-bg)] backdrop-blur-sm shadow-sm flex items-center justify-center text-[var(--delulu-muted)] hover:text-[var(--delulu-accent)] transition-colors theme-transition"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] backdrop-blur-sm shadow-sm flex items-center justify-center text-[var(--delulu-muted)] hover:text-[var(--delulu-accent)] transition-colors theme-transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div className="mt-4">
          <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">
            {isAnonymous ? (
              <>Hallo, {getGreetingName()} 🔒</>
            ) : (
              <>Hey @{getGreetingName()}! 👋</>
            )}
          </h1>
          <p className="text-sm text-[var(--delulu-text-secondary)] flex items-center gap-2">
            <span>{levelInfo.emoji} Level {userLevel}</span>
            {streakMultiplier > 1 && (
              <span className="text-amber-500 font-semibold">• {streakMultiplier}x XP</span>
            )}
          </p>
        </div>
      </div>

      {/* Streak Banner */}
      {userStreak >= 2 && (
        <div className="relative z-10 px-6 mb-4">
          <StreakBanner
            currentStreak={userStreak}
            longestStreak={(user as any)?.longestStreak || userStreak}
            canClaim={false}
          />
        </div>
      )}

      {/* Live Events Ticker */}
      {liveEvents.length > 0 && (
        <div className="relative z-10 px-6 mb-4">
          <button
            onClick={() => navigate('/discover', { state: { filter: 'stars' } })}
            className="w-full"
          >
            <div className="relative bg-gradient-to-r from-purple-900/90 to-pink-900/90 rounded-2xl p-3 border border-purple-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent animate-pulse" />

              <div className="relative flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
                  <div className="relative">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-red-500 rounded-full relative" />
                  </div>
                  <span className="text-[10px] font-bold text-red-400">LIVE</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <NebulaBadge
                      tier={(liveEvents[currentTickerIndex]?.starTier as NebulaTier) || 'nebula'}
                      size="sm"
                      animated={false}
                    />
                    <p className="text-sm font-semibold text-white truncate">
                      {liveEvents[currentTickerIndex]?.title}
                    </p>
                  </div>
                </div>

                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Quick Start Button - Logo */}
      <div className="relative z-10 px-6 mb-6">
        <button
          onClick={handleQuickStart}
          disabled={isSearching || !location}
          className="relative w-full"
        >
          <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl p-6 shadow-2xl shadow-violet-500/30 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />

            <div className="relative flex items-center gap-4">
              {/* Logo */}
              <div className={`w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ${
                isSearching ? 'animate-pulse' : ''
              }`}>
                {isSearching ? (
                  <Loader2 size={36} className="text-white animate-spin" />
                ) : (
                  <span className="text-5xl">☁️</span>
                )}
              </div>

              <div className="flex-1 text-left">
                <h2 className="font-display text-2xl font-bold text-white">
                  {isSearching ? 'Suche...' : 'Quick Start'}
                </h2>
                <p className="text-white/80 text-sm">
                  {isSearching
                    ? 'Verbinde dich mit einem Wölkchen'
                    : activeUsersNearby > 0
                      ? `${activeUsersNearby} aktiv in deiner Nähe`
                      : 'Starte ein neues Wölkchen'
                  }
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {location ? (
                  activeUsersNearby > 0 ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80">Cloud aktiv</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <span className="text-xs text-white/80">Niemand in der Nähe</span>
                    </>
                  )
                ) : (
                  <>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Standort wird ermittelt...</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-white/60">
                <MapPin size={12} />
                <span className="text-xs">500m Radius</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Nearby People Section */}
      <div className="relative z-10 px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 dark:bg-cyan-500/10 flex items-center justify-center">
              <MapPin size={16} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-display font-bold text-[var(--delulu-text)]">In deiner Nähe</h3>
          </div>
          <span className="text-xs text-[var(--delulu-muted)]">{activeUsersNearby} online</span>
        </div>

        {nearbyUsers.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {nearbyUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/user/${u.id}`)}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg mb-2">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    u.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="text-xs font-medium text-gray-900 truncate">@{u.username}</p>
                <p className="text-[10px] text-gray-400">Level {u.level}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <FloatingMascot delay={0}>
              <PegasusMascot size={80} className="mx-auto mb-2" />
            </FloatingMascot>
            <p className="text-sm text-gray-500">Noch niemand in deiner Nähe entdeckt</p>
          </div>
        )}
      </div>

      {/* Profile Visitors Section */}
      <div className="relative z-10 px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Eye size={16} className="text-violet-600" />
            </div>
            <h3 className="font-display font-bold text-gray-900">Profilbesucher</h3>
            {!isPremium && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-full">
                <Crown size={10} className="text-amber-600" />
                <span className="text-[10px] text-amber-700 font-semibold">Premium</span>
              </div>
            )}
          </div>
        </div>

        {isPremium ? (
          profileVisitors.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {profileVisitors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/user/${v.id}`)}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg mb-2">
                    {v.avatar ? (
                      <img src={v.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      v.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 truncate">@{v.username}</p>
                  <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                    <Clock size={8} />
                    {formatTimeAgo(v.visitedAt)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Eye size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Noch keine Besucher</p>
            </div>
          )
        ) : (
          /* Premium upsell */
          <button
            onClick={() => navigate('/premium')}
            className="w-full bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl p-4 border-2 border-dashed border-violet-200 hover:border-violet-400 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-200 flex items-center justify-center">
                <Lock size={20} className="text-violet-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">Wer hat dein Profil besucht?</p>
                <p className="text-xs text-gray-500">Mit Premium siehst du alle Besucher</p>
              </div>
              <Crown size={20} className="text-amber-500" />
            </div>
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="relative z-10 px-6 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{userLevel}</p>
            <p className="text-[10px] text-gray-500">Level</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-bold text-amber-500">{(user as any)?.xp || 0}</p>
            <p className="text-[10px] text-gray-500">XP</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-bold text-green-600">{(user as any)?.totalStarsReceived || 0}</p>
            <p className="text-[10px] text-gray-500">Sterne</p>
          </div>
        </div>
      </div>

      {/* Premium Upsell - only show if not premium */}
      {!isPremium && (
        <div className="relative z-10 px-6 mb-4">
          <button
            onClick={() => navigate('/premium')}
            className="relative w-full overflow-hidden bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Crown size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-white text-lg">Catalyst Premium</h3>
                <p className="text-white/80 text-sm">1.5x XP • Profilbesucher • mehr</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Star Dashboard Link */}
      {isVerifiedStar && (
        <div className="relative z-10 px-6 mb-4">
          <button
            onClick={() => navigate('/stars/dashboard')}
            className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Radio size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Dein Star Dashboard</h3>
                <p className="text-xs text-gray-500">Analytics, Events & mehr</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {/* Stats Button */}
      <div className="relative z-10 px-6 mb-4">
        <button
          onClick={() => navigate('/statistics')}
          className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <TrendingUp size={20} className="text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900">Deine Statistiken</p>
            <p className="text-xs text-gray-500">XP, Level, Aktivität & mehr</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Chat Gatekeeper Modal */}
      <ChatGatekeeper
        isOpen={showGatekeeper}
        onClose={() => setShowGatekeeper(false)}
        onChoose={handleGatekeeperChoice}
        chatType="voice"
        targetName="zufälligen Raum"
      />
    </div>
  );
};

// Helper function
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default Home;
