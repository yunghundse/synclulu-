import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import ProfilePicture from '@/components/ProfilePicture';
import LanguageSelector from '@/components/LanguageSelector';
import UsernameEditor from '@/components/UsernameEditor';
import { NebulaBadge, StarCategoryBadge } from '@/components/NebulaBadge';
import {
  LogOut,
  Edit3,
  ChevronRight,
  MapPin,
  Shield,
  BarChart3,
  Bell,
  HelpCircle,
  Globe,
  Sparkles,
  X,
  Star,
  Calendar,
  Play,
  Gift,
  AtSign,
  Cake,
  Clock,
} from 'lucide-react';
import ReferralSection from '@/components/ReferralSection';
import DreamPassButton from '@/components/DreamPassButton';
import { useDreamPass } from '@/hooks/useDreamPass';
import {
  getLevelTitle,
  getStreakMultiplier,
  calculateXPForLevel,
} from '@/lib/uiCopy';
import { VisibilityMode, STAR_CONFIG } from '@/types';
import { getUsernameChangeStatus, formatDaysRemaining, USERNAME_CHANGE_COOLDOWN_DAYS } from '@/lib/usernameSystem';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, searchRadius, setSearchRadius, isVerifiedStar, starProfile } = useStore();
  const { logout } = useAuth();
  const { blockedUsers } = useBlockedUsers();
  const { progress: dreamPassProgress, unclaimedRewards } = useDreamPass();

  // UI State
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ canChange: boolean; daysRemaining: number } | null>(null);

  // Fetch username change status
  useEffect(() => {
    if (user?.id) {
      getUsernameChangeStatus(user.id).then(setUsernameStatus);
    }
  }, [user?.id]);

  // User data with defaults
  const xp = (user as any)?.xp || 0;
  const level = (user as any)?.level || 1;
  const currentStreak = (user as any)?.currentStreak || 0;
  const trustScore = (user as any)?.trustScore || 3.0;
  const totalVoiceMinutes = (user as any)?.totalVoiceMinutes || 0;
  const friendCount = (user as any)?.friendCount || 0;
  const friendRadarEnabled = (user as any)?.friendRadarEnabled ?? true;
  const isPremium = (user as any)?.isPremium || false;
  const visibilityMode: VisibilityMode = user?.visibilityMode as VisibilityMode || 'public';
  const starsGivenToday = (user as any)?.starsGivenToday || 0;

  // Star limits based on premium status
  const maxStarsPerDay = isPremium ? STAR_CONFIG.premiumStarsPerDay : STAR_CONFIG.freeStarsPerDay;
  const starsRemaining = Math.max(0, maxStarsPerDay - starsGivenToday);

  // Calculated values
  const levelInfo = getLevelTitle(level);
  const streakMultiplier = getStreakMultiplier(currentStreak);
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  // Handlers
  const handleVisibilityChange = async (newMode: VisibilityMode) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { visibilityMode: newMode });
      setUser({ ...user, visibilityMode: newMode });
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const handleFriendRadarToggle = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        friendRadarEnabled: !friendRadarEnabled,
      });
      setUser({ ...user, friendRadarEnabled: !friendRadarEnabled } as any);
    } catch (error) {
      console.error('Failed to update friend radar:', error);
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    setSearchRadius(newRadius);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { searchRadius: newRadius });
    } catch (error) {
      console.error('Failed to update radius:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { displayName, bio });
      setUser({ ...user, displayName, bio });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  // Radius slider stops
  const radiusStops = [100, 200, 300, 500, 750, 1000, 2000, 3000, 5000];
  const nearestRadius = radiusStops.reduce((prev, curr) =>
    Math.abs(curr - searchRadius) < Math.abs(prev - searchRadius) ? curr : prev
  );

  const formatRadius = (r: number) => (r >= 1000 ? `${r / 1000}km` : `${r}m`);

  return (
    <div className="px-4 py-6 pb-24 safe-top min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-delulu-text">
          {t('profile.title')}
        </h1>
        <LanguageSelector compact />
      </div>

      {/* Hero Card - Avatar, Level, XP */}
      <div className="glass-card rounded-3xl p-6 mb-4">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-4">
          <div className="mb-4">
            <ProfilePicture
              size={96}
              editable={true}
              avatarUrl={user?.avatarUrl}
              displayName={user?.displayName}
              className="shadow-lg"
            />
          </div>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-white text-sm font-semibold mb-3 shadow-lg">
            <span>{levelInfo.emoji}</span>
            <span>{t('level.level')} {level}</span>
            <span className="opacity-60">•</span>
            <span>{levelInfo.name}</span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full max-w-[200px] mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
              />
            </div>
            <p className="text-xs text-delulu-muted mt-1 text-center">
              {xp} / {xpForNextLevel} XP
            </p>
          </div>

          {/* Name & Bio */}
          {isEditing ? (
            <div className="w-full space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-center font-display text-xl font-bold bg-delulu-soft rounded-xl px-4 py-2"
                placeholder={t('profile.editProfile')}
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bioPlaceholder')}
                maxLength={150}
                rows={2}
                className="w-full bg-delulu-soft rounded-xl px-4 py-3 text-sm resize-none text-center"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl border-2 border-delulu-soft font-semibold text-delulu-muted text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2 rounded-xl btn-primary text-white font-semibold text-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-delulu-text">
                {user?.displayName || 'Anonymous'}
              </h2>

              {/* Username with edit button */}
              <button
                onClick={() => setShowUsernameEditor(true)}
                className="flex items-center gap-2 text-sm text-delulu-muted mb-2 hover:text-delulu-violet transition-colors"
              >
                <AtSign size={14} />
                <span>{user?.username}</span>
                {usernameStatus?.canChange ? (
                  <Edit3 size={12} className="text-delulu-violet" />
                ) : (
                  <span className="text-[10px] text-amber-500 flex items-center gap-1">
                    <Clock size={10} />
                    {usernameStatus?.daysRemaining || 0}d
                  </span>
                )}
              </button>

              {/* Birthday - if set */}
              {user?.birthDay && user?.birthMonth && (
                <div className="flex items-center gap-2 text-sm text-delulu-muted mb-2">
                  <Cake size={14} />
                  <span>{user.birthDay}. {getMonthName(user.birthMonth)}</span>
                  {user?.city && (
                    <>
                      <span className="text-gray-300">•</span>
                      <MapPin size={12} />
                      <span>{user.city}</span>
                    </>
                  )}
                </div>
              )}

              <p className="text-sm text-delulu-text/70 italic text-center px-4">
                {user?.bio || t('profile.noBio')}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 flex items-center gap-2 text-sm text-delulu-violet font-medium"
              >
                <Edit3 size={14} />
                {t('profile.editProfile')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-xl font-bold gradient-text">{friendCount}</p>
          <p className="text-[10px] text-delulu-muted uppercase tracking-wide">
            {t('profile.stats.friends')}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-yellow-500 text-sm">⭐</span>
            <p className="text-xl font-bold gradient-text">{trustScore.toFixed(1)}</p>
          </div>
          <p className="text-[10px] text-delulu-muted uppercase tracking-wide">
            {t('profile.stats.trust')}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center">
          <p className="text-xl font-bold gradient-text">{totalVoiceMinutes}</p>
          <p className="text-[10px] text-delulu-muted uppercase tracking-wide">
            {t('profile.stats.voiceMin')}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DREAM PASS - Beta Battle Pass */}
      {/* ═══════════════════════════════════════ */}
      <div className="mb-4">
        <DreamPassButton
          currentLevel={dreamPassProgress?.currentLevel || 1}
          hasUnclaimedRewards={unclaimedRewards > 0}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CREATOR HUB - Only for Verified Stars */}
      {/* ═══════════════════════════════════════ */}
      {isVerifiedStar && starProfile && (
        <div className="glass-card rounded-2xl p-4 mb-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          {/* Header with Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <NebulaBadge tier={starProfile.nebulaTier} size="lg" animated />
              <div>
                <h3 className="font-bold text-delulu-text">Creator Hub</h3>
                <StarCategoryBadge category={starProfile.category} size="sm" />
              </div>
            </div>
            <button
              onClick={() => navigate('/stars/dashboard')}
              className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-semibold"
            >
              Dashboard →
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-purple-600">{starProfile.totalListeners.toLocaleString()}</p>
              <p className="text-[9px] text-gray-500">Zuhörer</p>
            </div>
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-amber-500">{starProfile.totalStarsReceived.toLocaleString()}</p>
              <p className="text-[9px] text-gray-500">Sterne</p>
            </div>
            <div className="bg-white/60 rounded-xl p-2 text-center">
              <p className="text-lg font-bold text-green-600">{starProfile.totalEventsHosted}</p>
              <p className="text-[9px] text-gray-500">Events</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/stars/event/new')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold"
            >
              <Play size={16} />
              Live gehen
            </button>
            <button
              onClick={() => navigate('/stars/schedule')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-purple-200 text-purple-600 rounded-xl text-sm font-semibold"
            >
              <Calendar size={16} />
              Event planen
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* STAR LIMITS - For Everyone */}
      {/* ═══════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            <span className="font-semibold text-delulu-text text-sm">Deine Sterne heute</span>
          </div>
          <span className="text-xs text-delulu-muted">
            {starsRemaining} / {maxStarsPerDay} übrig
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
            style={{ width: `${(starsRemaining / maxStarsPerDay) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-delulu-muted">
            {starsGivenToday} Sterne heute vergeben
          </span>
          {!isPremium && (
            <button
              onClick={() => navigate('/premium')}
              className="text-purple-500 font-medium flex items-center gap-1"
            >
              <Sparkles size={12} />
              Mehr mit Premium
            </button>
          )}
        </div>
      </div>

      {/* Streak Banner */}
      {currentStreak >= 2 && (
        <div className="glass-card rounded-2xl p-4 mb-4 bg-gradient-to-r from-orange-400/10 to-red-400/10 border border-orange-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🔥</span>
            <div className="flex-1">
              <p className="font-semibold text-delulu-text">
                {currentStreak} {t('streak.days')} {t('streak.title')}!
              </p>
              <p className="text-xs text-delulu-muted">
                {streakMultiplier}x {t('streak.xpBoost')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Selector */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-delulu-muted uppercase tracking-wide mb-3">
          {t('visibility.title')}
        </p>
        <div className="space-y-2">
          {(['public', 'friends', 'ghost'] as VisibilityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleVisibilityChange(mode)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                visibilityMode === mode
                  ? 'bg-delulu-violet/10 border-2 border-delulu-violet'
                  : 'bg-delulu-soft/50 border-2 border-transparent'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  visibilityMode === mode
                    ? 'bg-delulu-violet'
                    : 'border-2 border-gray-300'
                }`}
              >
                {visibilityMode === mode && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-delulu-text text-sm">
                  {t(`visibility.${mode}.title`)}
                </p>
                <p className="text-xs text-delulu-muted">
                  {t(`visibility.${mode}.description`)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Friend Radar Toggle */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <button
          onClick={handleFriendRadarToggle}
          className="w-full flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-delulu-violet/10 flex items-center justify-center">
            <MapPin size={20} className="text-delulu-violet" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-delulu-text">{t('friendRadar.title')}</p>
            <p className="text-xs text-delulu-muted">{t('friendRadar.description')}</p>
          </div>
          <div
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              friendRadarEnabled ? 'bg-delulu-violet' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                friendRadarEnabled ? 'translate-x-6' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Search Radius Slider */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-delulu-violet/10 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <p className="font-semibold text-delulu-text">{t('radius.title')}</p>
              <p className="text-xs text-delulu-muted">{t('radius.description')}</p>
            </div>
          </div>
          <span className="text-xl font-bold gradient-text">
            {formatRadius(nearestRadius)}
          </span>
        </div>
        <div className="px-2">
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={searchRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-delulu-violet"
          />
          <div className="flex justify-between text-xs text-delulu-muted mt-1">
            <span>100m</span>
            <span>5km</span>
          </div>
        </div>
      </div>

      {/* Creator werden - For non-verified users */}
      {!isVerifiedStar && (
        <div className="glass-card rounded-2xl p-5 mb-4 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-delulu-text">Creator werden</h3>
              <p className="text-xs text-delulu-muted">Teile deine Stimme mit der Community</p>
            </div>
          </div>
          <p className="text-sm text-delulu-text/80 mb-4">
            Werde ein verifizierter Star und hoste eigene Live-Events, verdiene Sterne und baue deine Community auf.
          </p>
          <button
            onClick={() => navigate('/stars/apply')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Jetzt bewerben
          </button>
        </div>
      )}

      {/* Premium Upsell - Coming Soon */}
      {!isPremium && (
        <div className="glass-card rounded-2xl p-5 mb-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 relative overflow-hidden">
          {/* Coming Soon Badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            Bald verfügbar
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-violet-500" />
            <h3 className="font-bold text-lg gradient-text">{t('premium.title')}</h3>
          </div>
          <p className="text-sm text-delulu-text/80 mb-4">{t('premium.upsell')}</p>
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-300 text-gray-500 font-semibold cursor-not-allowed"
          >
            Demnächst verfügbar
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* REFERRAL SYSTEM - 5 Exclusive Links */}
      {/* ═══════════════════════════════════════ */}
      <div className="mb-4">
        <ReferralSection />
      </div>

      {/* Settings List */}
      <div className="glass-card rounded-2xl overflow-hidden mb-4">
        <button
          onClick={() => setShowLanguageModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-delulu-muted" />
            <span className="font-medium text-delulu-text">{t('settings.language')}</span>
          </div>
          <ChevronRight size={18} className="text-delulu-muted" />
        </button>
        <button
          onClick={() => navigate('/blocked-users')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-delulu-muted" />
            <span className="font-medium text-delulu-text">{t('settings.blockedUsers')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-delulu-muted">{blockedUsers.length}</span>
            <ChevronRight size={18} className="text-delulu-muted" />
          </div>
        </button>
        <button
          onClick={() => navigate('/statistics')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-delulu-muted" />
            <span className="font-medium text-delulu-text">{t('settings.myStats')}</span>
          </div>
          <ChevronRight size={18} className="text-delulu-muted" />
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-delulu-muted" />
            <span className="font-medium text-delulu-text">{t('settings.notifications')}</span>
          </div>
          <ChevronRight size={18} className="text-delulu-muted" />
        </button>
        <button
          onClick={() => navigate('/help')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={18} className="text-delulu-muted" />
            <span className="font-medium text-delulu-text">{t('settings.help')}</span>
          </div>
          <ChevronRight size={18} className="text-delulu-muted" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full p-4 flex items-center justify-center gap-3 text-red-500 font-medium rounded-2xl border-2 border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <LogOut size={18} />
        {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
      </button>

      {/* Version */}
      <p className="text-center text-xs text-delulu-muted mt-6">
        delulu v2.0 • butterbread ☁️
      </p>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-delulu-text">
                {t('settings.language')}
              </h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-10 h-10 rounded-xl bg-delulu-soft flex items-center justify-center"
              >
                <X size={20} className="text-delulu-muted" />
              </button>
            </div>
            <LanguageSelector />
          </div>
        </div>
      )}

      {/* Username Editor Modal */}
      <UsernameEditor
        isOpen={showUsernameEditor}
        onClose={() => setShowUsernameEditor(false)}
        onSuccess={(newUsername) => {
          // Update status after username change
          getUsernameChangeStatus(user?.id || '').then(setUsernameStatus);
        }}
      />
    </div>
  );
};

// Helper function for month names
const getMonthName = (month: number): string => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month - 1] || '';
};

export default Profile;
