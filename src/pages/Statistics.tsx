import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { getLevelTitle, getStreakMultiplier, UI_COPY } from '@/lib/uiCopy';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, TrendingUp, Star, Users, Mic,
  Award, Flame, Cloud, ChevronRight, Zap, Target,
  Calendar, BarChart3, Loader2
} from 'lucide-react';

// Stat card types
interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

interface UserStats {
  totalTalkTime: number;
  starsReceived: number;
  starsGiven: number;
  loungesVisited: number;
  friendsMade: number;
  voiceChatsJoined: number;
  weeklyActivity: number[];
  xpCurrent: number;
  xpRequired: number;
  trustScore: number;
  followers: number;
  following: number;
}

const Statistics = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'social'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalTalkTime: 0,
    starsReceived: 0,
    starsGiven: 0,
    loungesVisited: 0,
    friendsMade: 0,
    voiceChatsJoined: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    xpCurrent: 0,
    xpRequired: 1000,
    trustScore: 5.0,
    followers: 0,
    following: 0,
  });

  // Fetch real stats from Firebase
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Get user document for XP and level info
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Get stars received
        const starsReceivedQuery = query(
          collection(db, 'stars'),
          where('toUserId', '==', user.id)
        );
        const starsReceivedSnap = await getDocs(starsReceivedQuery);

        // Get stars given
        const starsGivenQuery = query(
          collection(db, 'stars'),
          where('fromUserId', '==', user.id)
        );
        const starsGivenSnap = await getDocs(starsGivenQuery);

        // Get friendships
        const friendsQuery = query(
          collection(db, 'friendships'),
          where('userId', '==', user.id)
        );
        const friendsSnap = await getDocs(friendsQuery);

        // Get voice chat history
        const voiceChatsQuery = query(
          collection(db, 'voiceChatHistory'),
          where('userId', '==', user.id)
        );
        const voiceChatsSnap = await getDocs(voiceChatsQuery);

        // Get followers
        const followersQuery = query(
          collection(db, 'follows'),
          where('followingId', '==', user.id)
        );
        const followersSnap = await getDocs(followersQuery);

        // Get following
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.id)
        );
        const followingSnap = await getDocs(followingQuery);

        // Calculate total talk time from voice chat history
        let totalMinutes = 0;
        voiceChatsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.duration) {
            totalMinutes += Math.floor(data.duration / 60);
          }
        });

        // Calculate XP requirements
        const currentLevel = userData.level || 1;
        const xpRequired = currentLevel * 500 + 500; // Simple formula: Level 1 = 1000 XP, Level 2 = 1500 XP, etc.

        setStats({
          totalTalkTime: totalMinutes,
          starsReceived: starsReceivedSnap.size,
          starsGiven: starsGivenSnap.size,
          loungesVisited: userData.loungesVisited || 0,
          friendsMade: friendsSnap.size,
          voiceChatsJoined: voiceChatsSnap.size,
          weeklyActivity: userData.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
          xpCurrent: userData.xp || 0,
          xpRequired: xpRequired,
          trustScore: userData.trustScore || 5.0,
          followers: followersSnap.size,
          following: followingSnap.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const userLevel = (user as any)?.level || 1;
  const levelInfo = getLevelTitle(userLevel);
  const streakMultiplier = getStreakMultiplier((user as any)?.currentStreak || 0);

  // Calculate XP progress
  const xpProgress = stats.xpRequired > 0 ? (stats.xpCurrent / stats.xpRequired) * 100 : 0;

  // Format time
  const formatTalkTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m`;
    return '0m';
  };

  // Stats for overview
  const overviewStats: StatCard[] = [
    {
      label: 'Gesprochene Zeit',
      value: formatTalkTime(stats.totalTalkTime),
      subtext: stats.totalTalkTime === 0 ? 'Noch keine Gespräche' : undefined,
      icon: <Mic size={20} />,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Sterne erhalten',
      value: stats.starsReceived,
      subtext: `${stats.starsGiven} verschenkt`,
      icon: <Star size={20} />,
      color: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Voice Chats',
      value: stats.voiceChatsJoined,
      subtext: stats.voiceChatsJoined === 0 ? 'Noch keinem beigetreten' : undefined,
      icon: <Cloud size={20} />,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      label: 'Freundschaften',
      value: stats.friendsMade,
      subtext: stats.friendsMade === 0 ? 'Finde neue Freunde!' : undefined,
      icon: <Users size={20} />,
      color: 'from-green-400 to-emerald-500',
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-delulu-violet mx-auto mb-4" />
          <p className="text-delulu-muted text-sm">Lade Statistiken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white safe-top safe-bottom pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-delulu-muted hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-delulu-text">
              Meine Statistiken
            </h1>
            <p className="text-xs text-delulu-muted">Deine Aktivität im Überblick</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-3 flex gap-2">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'activity', label: 'Aktivität', icon: Calendar },
            { id: 'social', label: 'Sozial', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-delulu-violet text-white shadow-lg'
                  : 'bg-gray-100 text-delulu-muted hover:bg-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level Card */}
      <div className="px-6 py-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-delulu-violet to-purple-600 rounded-3xl p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                  {levelInfo.emoji}
                </div>
                <div>
                  <p className="text-white/70 text-sm">Dein Level</p>
                  <h2 className="font-display text-3xl font-bold">Level {userLevel}</h2>
                  <p className="text-white/80 text-sm">{levelInfo.name}</p>
                </div>
              </div>

              {streakMultiplier > 1 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 text-amber-900 rounded-full">
                  <Flame size={14} />
                  <span className="text-sm font-bold">{streakMultiplier}x XP</span>
                </div>
              )}
            </div>

            {/* XP Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Fortschritt zu Level {userLevel + 1}</span>
                <span className="font-semibold">
                  {stats.xpCurrent} / {stats.xpRequired} XP
                </span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/60">
                {stats.xpRequired - stats.xpCurrent > 0
                  ? `Noch ${stats.xpRequired - stats.xpCurrent} XP bis zum nächsten Level`
                  : 'Level Up bereit!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats Grid */}
      {activeTab === 'overview' && (
        <div className="px-6 space-y-4">
          {/* Empty state check */}
          {stats.totalTalkTime === 0 && stats.starsReceived === 0 && stats.voiceChatsJoined === 0 && stats.friendsMade === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-delulu-soft to-white flex items-center justify-center mb-6 shadow-inner">
                <BarChart3 size={40} className="text-delulu-muted" />
              </div>
              <h3 className="font-display font-bold text-xl text-delulu-text mb-3">
                {UI_COPY.empty.stats}
              </h3>
              <p className="text-sm text-delulu-muted mb-8 max-w-xs mx-auto leading-relaxed">
                Hier werden deine Statistiken angezeigt, sobald du anfängst die App zu nutzen.
                Tritt einem Voice Chat bei oder finde neue Freunde!
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-delulu-violet to-purple-600 text-white rounded-2xl font-display font-bold shadow-lg"
              >
                <Cloud size={20} />
                Wölkchen entdecken
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {overviewStats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-display font-bold text-delulu-text">
                      {stat.value}
                    </p>
                    <p className="text-xs text-delulu-muted mt-1">{stat.label}</p>
                    {stat.subtext && (
                      <p className="text-[10px] text-delulu-muted mt-1">{stat.subtext}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-r from-delulu-violet/10 to-purple-100 rounded-2xl p-4">
                <p className="text-sm text-delulu-text">
                  <span className="font-semibold">Tipp:</span> Je mehr du mit anderen interagierst,
                  desto mehr XP und Sterne verdienst du!
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="px-6 space-y-4">
          {/* Weekly Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-display font-bold text-delulu-text mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-delulu-violet" />
              Wochenübersicht
            </h3>

            {stats.weeklyActivity.every(v => v === 0) ? (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-delulu-muted">
                  Noch keine Aktivitätsdaten vorhanden.
                </p>
                <p className="text-xs text-delulu-muted mt-1">
                  Nutze die App regelmäßig, um deine Aktivität zu tracken.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-32 gap-2">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => {
                    const maxActivity = Math.max(...stats.weeklyActivity, 1);
                    const height = (stats.weeklyActivity[index] / maxActivity) * 100;
                    const isToday = index === (new Date().getDay() + 6) % 7;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-lg overflow-hidden h-full flex flex-col justify-end">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              isToday ? 'bg-delulu-violet' : 'bg-delulu-violet/40'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className={`text-xs ${isToday ? 'font-bold text-delulu-violet' : 'text-delulu-muted'}`}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-delulu-muted">Gesamt diese Woche</p>
                    <p className="font-bold text-delulu-text">
                      {stats.weeklyActivity.reduce((a, b) => a + b, 0)} Minuten
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-delulu-muted">Durchschnitt</p>
                    <p className="font-bold text-delulu-violet">
                      {(stats.weeklyActivity.reduce((a, b) => a + b, 0) / 7).toFixed(0)}min/Tag
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Goals */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-display font-bold text-delulu-text mb-4 flex items-center gap-2">
              <Target size={18} className="text-green-500" />
              Wochenziele
            </h3>

            <div className="space-y-4">
              {[
                { label: '5 Voice Chats', current: Math.min(stats.voiceChatsJoined, 5), target: 5, color: 'bg-violet-500' },
                { label: '10 Sterne verschenken', current: Math.min(stats.starsGiven, 10), target: 10, color: 'bg-amber-500' },
                { label: '3 neue Freunde', current: Math.min(stats.friendsMade, 3), target: 3, color: 'bg-green-500' },
              ].map((goal, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-delulu-text">{goal.label}</span>
                    <span className={`text-sm font-bold ${
                      goal.current >= goal.target ? 'text-green-600' : 'text-delulu-muted'
                    }`}>
                      {goal.current}/{goal.target}
                      {goal.current >= goal.target && ' ✓'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${goal.color} rounded-full transition-all`}
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="px-6 space-y-4">
          {/* Social Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4">
              <Star size={24} className="text-amber-500 mb-2" />
              <p className="text-2xl font-display font-bold text-amber-600">
                {stats.starsReceived}
              </p>
              <p className="text-xs text-amber-700/70">Sterne erhalten</p>
              <p className="text-[10px] text-amber-600 mt-1">
                = {stats.starsReceived * 15} XP verdient
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4">
              <Award size={24} className="text-violet-500 mb-2" />
              <p className="text-2xl font-display font-bold text-violet-600">
                {stats.starsGiven}
              </p>
              <p className="text-xs text-violet-700/70">Sterne verschenkt</p>
              <p className="text-[10px] text-violet-600 mt-1">
                = {stats.starsGiven * 5} XP ausgegeben
              </p>
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-display font-bold text-delulu-text mb-4 flex items-center gap-2">
              <Zap size={18} className="text-green-500" />
              Trust Score
            </h3>

            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.trustScore / 5) * 251.2} 251.2`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">{stats.trustScore.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm text-delulu-muted mb-2">
                  Dein Trust Score basiert auf:
                </p>
                <ul className="space-y-1 text-xs text-delulu-text">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Positive Bewertungen
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Regelmäßige Aktivität
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Keine Verstöße
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Friend Network */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-delulu-text flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Freundesnetzwerk
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-delulu-text">{stats.friendsMade}</p>
                <p className="text-[10px] text-delulu-muted">Freunde</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.followers}</p>
                <p className="text-[10px] text-delulu-muted">Follower</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{stats.following}</p>
                <p className="text-[10px] text-delulu-muted">Folgst du</p>
              </div>
            </div>

            {stats.friendsMade === 0 && stats.followers === 0 && stats.following === 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-delulu-muted">
                  Noch keine Verbindungen. Tritt Voice Chats bei, um Leute kennenzulernen!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
