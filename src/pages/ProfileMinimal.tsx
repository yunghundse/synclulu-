/**
 * DELULU PROFILE v21.0 - NEBULA SOVEREIGN
 * "Trust & Connection" - Friends + Trust Integration
 *
 * FEATURES:
 * 1. Profile Picture (editable)
 * 2. Name & Username
 * 3. Trust Score Display (clickable → TrustStats)
 * 4. Friends Button (clickable → Friends Page)
 * 5. Beta Pass Banner (DreamPass)
 * 6. Quick Actions
 *
 * @design Nebula Sovereign v21.0
 * @version 21.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { useDreamPass } from '@/hooks/useDreamPass';
import ProfilePicture from '@/components/ProfilePicture';
import UsernameEditor from '@/components/UsernameEditor';
import DreamPassButton from '@/components/DreamPassButton';
import {
  Settings, Edit3, AtSign, Cake, MapPin, Clock,
  ChevronRight, Zap, Star, Users, Mic2, Shield, UserPlus
} from 'lucide-react';
import { getLevelTitle, calculateXPForLevel } from '@/lib/uiCopy';
import { getUsernameChangeStatus } from '@/lib/usernameSystem';

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// Trust Level Colors
const getTrustColor = (score: number) => {
  if (score >= 800) return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' };
  if (score >= 600) return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' };
  if (score >= 400) return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' };
  if (score >= 200) return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' };
  return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' };
};

const getTrustLabel = (score: number) => {
  if (score >= 800) return 'Legendary';
  if (score >= 600) return 'Respected';
  if (score >= 400) return 'Trusted';
  if (score >= 200) return 'Rising';
  return 'Newcomer';
};

// ═══════════════════════════════════════
// HELPER
// ═══════════════════════════════════════

const getMonthName = (month: number): string => {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month - 1] || '';
};

function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[type]);
  }
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════

const ProfileMinimal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const { progress: dreamPassProgress, unclaimedRewards } = useDreamPass();

  // UI State
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [usernameStatus, setUsernameStatus] = useState<{ canChange: boolean; daysRemaining: number } | null>(null);

  // User data
  const xp = (user as any)?.xp || 0;
  const level = (user as any)?.level || 1;
  const friendCount = (user as any)?.friendCount || 0;
  const trustScore = (user as any)?.trustScore || 500;
  const totalVoiceMinutes = (user as any)?.totalVoiceMinutes || 0;
  const isFounder = user?.id === FOUNDER_UID;
  const isVerified = (user as any)?.isVerified || false;

  // Trust styling
  const trustColors = getTrustColor(trustScore);
  const trustLabel = getTrustLabel(trustScore);

  // Calculations
  const levelInfo = getLevelTitle(level);
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  // Load username status
  useEffect(() => {
    if (user?.id) {
      getUsernameChangeStatus(user.id).then(setUsernameStatus);
    }
  }, [user?.id]);

  // Handlers
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

  const handleNavigateToFriends = () => {
    triggerHaptic('light');
    navigate('/friends');
  };

  const handleNavigateToTrust = () => {
    triggerHaptic('light');
    navigate('/profile/trust-stats');
  };

  return (
    <div className="min-h-screen page-gradient theme-transition">
      {/* ═══════════════════════════════════════ */}
      {/* HEADER - Settings Button */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--delulu-text)]">
          Profil
        </h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] backdrop-blur-sm shadow-sm border border-[var(--delulu-border)] flex items-center justify-center hover:bg-[var(--delulu-soft)] transition-colors theme-transition"
        >
          <Settings size={20} className="text-[var(--delulu-muted)]" />
        </button>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* HERO SECTION - Avatar & Identity */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 py-8">
        <div className="flex flex-col items-center">
          {/* Profile Picture with Founder Crown */}
          <div className="mb-6 relative">
            <ProfilePicture
              size={112}
              editable={true}
              avatarUrl={user?.avatarUrl}
              displayName={user?.displayName}
              className="ring-4 ring-[var(--delulu-bg)] shadow-2xl shadow-purple-500/20"
            />
            {isFounder && (
              <div className="absolute -top-2 -right-2 text-2xl">👑</div>
            )}
            {isVerified && !isFounder && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[var(--delulu-bg)]">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-white text-sm font-semibold shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-base">{levelInfo.emoji}</span>
            <span>Level {level}</span>
            <span className="opacity-50">•</span>
            <span>{levelInfo.name}</span>
          </div>

          {/* XP Progress */}
          <div className="w-full max-w-[220px] mb-5">
            <div className="h-2 bg-[var(--delulu-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-xs text-[var(--delulu-muted)]">{xp} XP</span>
              <span className="text-xs text-[var(--delulu-muted)]">{xpForNextLevel} XP</span>
            </div>
          </div>

          {/* Name & Username */}
          {isEditing ? (
            <div className="w-full max-w-sm space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-center font-display text-xl font-bold bg-[var(--delulu-surface)] text-[var(--delulu-text)] rounded-xl px-4 py-3 border border-[var(--delulu-border)] focus:border-[var(--delulu-accent)] focus:ring-2 focus:ring-[var(--delulu-accent)]/20 outline-none transition-all theme-transition"
                placeholder="Dein Name"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Über dich..."
                maxLength={150}
                rows={2}
                className="w-full bg-[var(--delulu-surface)] text-[var(--delulu-text)] rounded-xl px-4 py-3 text-sm resize-none text-center border border-[var(--delulu-border)] focus:border-[var(--delulu-accent)] focus:ring-2 focus:ring-[var(--delulu-accent)]/20 outline-none transition-all theme-transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[var(--delulu-border)] font-semibold text-[var(--delulu-muted)] text-sm hover:bg-[var(--delulu-soft)] transition-colors theme-transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow"
                >
                  Speichern
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-[var(--delulu-text)] mb-1">
                {user?.displayName || 'Anonymous'}
              </h2>

              {/* Username */}
              <button
                onClick={() => setShowUsernameEditor(true)}
                className="flex items-center gap-2 text-sm text-[var(--delulu-text-secondary)] mb-3 hover:text-[var(--delulu-accent)] transition-colors group"
              >
                <AtSign size={14} />
                <span>{user?.username}</span>
                {usernameStatus?.canChange ? (
                  <Edit3 size={12} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <span className="text-[10px] text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                    <Clock size={10} />
                    {usernameStatus?.daysRemaining || 0}d
                  </span>
                )}
              </button>

              {/* Birthday & Location */}
              {(user?.birthDay || user?.city) && (
                <div className="flex items-center gap-3 text-sm text-[var(--delulu-muted)] mb-4">
                  {user?.birthDay && user?.birthMonth && (
                    <span className="flex items-center gap-1.5">
                      <Cake size={14} />
                      {user.birthDay}. {getMonthName(user.birthMonth)}
                    </span>
                  )}
                  {user?.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {user.city}
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              <p className="text-sm text-[var(--delulu-text-secondary)] text-center max-w-xs mb-4">
                {user?.bio || 'Noch keine Bio hinzugefügt'}
              </p>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm text-[var(--delulu-accent)] font-medium hover:opacity-80 transition-opacity"
              >
                <Edit3 size={14} />
                Profil bearbeiten
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TRUST & FRIENDS - Big Action Cards */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Friends Card */}
          <button
            onClick={handleNavigateToFriends}
            className="bg-[var(--delulu-card)] rounded-2xl p-5 text-left shadow-sm border border-[var(--delulu-border)] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all theme-transition group"
          >
            <div className="w-12 h-12 mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-[var(--delulu-text)]">{friendCount}</p>
            <p className="text-xs text-[var(--delulu-muted)] uppercase tracking-wider">Freunde</p>
            <div className="mt-2 flex items-center gap-1 text-purple-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Verwalten</span>
              <ChevronRight size={12} />
            </div>
          </button>

          {/* Trust Score Card */}
          <button
            onClick={handleNavigateToTrust}
            className={`bg-[var(--delulu-card)] rounded-2xl p-5 text-left shadow-sm border ${trustColors.border} hover:shadow-lg transition-all theme-transition group`}
          >
            <div className={`w-12 h-12 mb-3 rounded-xl ${trustColors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Shield size={24} className={trustColors.text} />
            </div>
            <p className="text-2xl font-bold text-[var(--delulu-text)]">{trustScore}</p>
            <p className="text-xs text-[var(--delulu-muted)] uppercase tracking-wider">{trustLabel}</p>
            <div className={`mt-2 flex items-center gap-1 ${trustColors.text} text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
              <span>Details</span>
              <ChevronRight size={12} />
            </div>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SMALL STATS - Voice Minutes */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <div className="bg-[var(--delulu-card)] rounded-2xl p-4 shadow-sm border border-[var(--delulu-border)] theme-transition flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Mic2 size={20} className="text-pink-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--delulu-text)]">{totalVoiceMinutes} Minuten</p>
              <p className="text-xs text-[var(--delulu-muted)]">Voice-Zeit gesamt</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Star size={20} className="text-amber-500" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DREAM PASS - Beta Battle Pass Banner */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 mb-6">
        <DreamPassButton
          currentLevel={dreamPassProgress?.currentLevel || 1}
          hasUnclaimedRewards={unclaimedRewards > 0}
        />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* QUICK ACTIONS */}
      {/* ═══════════════════════════════════════ */}
      <div className="px-4 pb-32">
        <div className="bg-[var(--delulu-card)] rounded-2xl shadow-sm border border-[var(--delulu-border)] overflow-hidden theme-transition">
          <button
            onClick={() => navigate('/statistics')}
            className="w-full p-4 flex items-center justify-between hover:bg-[var(--delulu-soft)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Zap size={20} className="text-violet-500" />
              </div>
              <span className="font-medium text-[var(--delulu-text)]">Meine Statistiken</span>
            </div>
            <ChevronRight size={20} className="text-[var(--delulu-muted)]" />
          </button>

          <div className="h-px bg-[var(--delulu-border)]" />

          <button
            onClick={() => navigate('/invites')}
            className="w-full p-4 flex items-center justify-between hover:bg-[var(--delulu-soft)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <UserPlus size={20} className="text-emerald-500" />
              </div>
              <span className="font-medium text-[var(--delulu-text)]">Freunde einladen</span>
            </div>
            <ChevronRight size={20} className="text-[var(--delulu-muted)]" />
          </button>

          <div className="h-px bg-[var(--delulu-border)]" />

          <button
            onClick={() => navigate('/settings')}
            className="w-full p-4 flex items-center justify-between hover:bg-[var(--delulu-soft)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--delulu-surface)] flex items-center justify-center">
                <Settings size={20} className="text-[var(--delulu-muted)]" />
              </div>
              <span className="font-medium text-[var(--delulu-text)]">Alle Einstellungen</span>
            </div>
            <ChevronRight size={20} className="text-[var(--delulu-muted)]" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════ */}

      {/* Username Editor */}
      <UsernameEditor
        isOpen={showUsernameEditor}
        onClose={() => setShowUsernameEditor(false)}
        onSuccess={() => {
          getUsernameChangeStatus(user?.id || '').then(setUsernameStatus);
        }}
      />
    </div>
  );
};

export default ProfileMinimal;
