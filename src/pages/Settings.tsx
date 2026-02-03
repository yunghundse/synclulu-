import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { useTranslation, LANGUAGES, Language } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import {
  ArrowLeft, User, Lock, Shield, Bell, Eye, EyeOff,
  Crown, HelpCircle, LogOut, Trash2, Pause, ChevronRight,
  Globe, Volume2, MessageCircle, AlertTriangle,
  UserX, Ban, Flag, Loader2, Check, X, Star, Radio, TrendingUp,
  FileText, Clock, Users, Sparkles, CheckCircle2, Info
} from 'lucide-react';
import { CREATOR_REQUIREMENTS } from '@/types';
import PrivacySettings from '@/components/PrivacySettings';
import WhatsNewModal from '@/components/WhatsNewModal';
import { CatalystTeaser } from '@/components/CatalystTeaser';

type SettingsSection = 'account' | 'privacy' | 'notifications' | 'blocked' | 'danger' | 'language' | 'creator' | 'legal';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  blockedAt: Date;
  reason: BlockReason;
  customReason?: string;
}

type BlockReason = 'harassment' | 'spam' | 'inappropriate' | 'personal' | 'other';

const BLOCK_REASONS: { id: BlockReason; label: string; icon: React.ReactNode }[] = [
  { id: 'harassment', label: 'Belästigung', icon: <AlertTriangle size={16} /> },
  { id: 'spam', label: 'Spam / Werbung', icon: <MessageCircle size={16} /> },
  { id: 'inappropriate', label: 'Unangemessenes Verhalten', icon: <Flag size={16} /> },
  { id: 'personal', label: 'Persönliche Gründe', icon: <User size={16} /> },
  { id: 'other', label: 'Sonstiges', icon: <Ban size={16} /> },
];

// Mock blocked users
const mockBlockedUsers: BlockedUser[] = [
  {
    id: 'b1',
    username: 'toxic_user',
    displayName: 'Toxic Person',
    blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reason: 'harassment',
  },
  {
    id: 'b2',
    username: 'spammer99',
    displayName: 'Spam Bot',
    blockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reason: 'spam',
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, isVerifiedStar } = useStore();
  const { language, setLanguage } = useTranslation();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);

  // Privacy states
  const [isAnonymous, setIsAnonymous] = useState(user?.isGlobalAnonymous || false);
  const [showOnline, setShowOnline] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  // Notification states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [starNotifications, setStarNotifications] = useState(true);
  const [friendNotifications, setFriendNotifications] = useState(true);
  const [starEventNotifications, setStarEventNotifications] = useState(true);

  // Blocking
  const [blockedUsers, setBlockedUsers] = useState(mockBlockedUsers);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState<string | null>(null);

  // Danger zone
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [pauseError, setPauseError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // What's New Modal
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Creator Progress calculation
  const totalStarsReceived = (user as any)?.totalStarsReceived || 0;
  const level = (user as any)?.level || 1;
  const totalVoiceMinutes = (user as any)?.totalVoiceMinutes || 0;
  const positiveRatings = (user as any)?.positiveRatings || 0;
  const totalRatings = (user as any)?.totalRatings || 1;
  const positiveRatingsPercentage = Math.round((positiveRatings / totalRatings) * 100);

  const creatorProgress = {
    stars: Math.min(100, (totalStarsReceived / CREATOR_REQUIREMENTS.starsRequired) * 100),
    level: Math.min(100, (level / CREATOR_REQUIREMENTS.levelRequired) * 100),
    voice: Math.min(100, (totalVoiceMinutes / CREATOR_REQUIREMENTS.voiceMinutesRequired) * 100),
    ratings: Math.min(100, (positiveRatingsPercentage / CREATOR_REQUIREMENTS.minPositiveRatings) * 100),
  };
  const isCreatorEligible =
    totalStarsReceived >= CREATOR_REQUIREMENTS.starsRequired &&
    level >= CREATOR_REQUIREMENTS.levelRequired &&
    totalVoiceMinutes >= CREATOR_REQUIREMENTS.voiceMinutesRequired &&
    positiveRatingsPercentage >= CREATOR_REQUIREMENTS.minPositiveRatings;

  // Language names
  const getLanguageName = (lang: Language) => {
    return LANGUAGES[lang].native;
  };

  const handleUnblock = (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    setShowUnblockConfirm(null);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handlePauseAccount = async () => {
    if (!user?.id) return;

    setIsPausing(true);
    setPauseError('');

    try {
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isPaused: true,
        pausedAt: serverTimestamp(),
        isActive: false,
      });

      // Logout the user
      await logout();
      setShowPauseModal(false);
      navigate('/welcome');
    } catch (error: any) {
      console.error('Error pausing account:', error);
      setPauseError('Fehler beim Pausieren. Bitte versuche es erneut.');
    } finally {
      setIsPausing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'löschen') return;
    if (!user?.id || !auth.currentUser) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const currentUser = auth.currentUser;

      // Delete user document from Firestore first
      const userRef = doc(db, 'users', user.id);
      await deleteDoc(userRef);

      // Try to delete the Firebase Auth user
      try {
        await deleteUser(currentUser);
      } catch (authError: any) {
        // If requires-recent-login error, try to re-authenticate
        if (authError.code === 'auth/requires-recent-login') {
          // For Google users, try popup re-auth
          const providerData = currentUser.providerData;
          const isGoogleUser = providerData.some(p => p.providerId === 'google.com');

          if (isGoogleUser) {
            try {
              const provider = new GoogleAuthProvider();
              await reauthenticateWithPopup(currentUser, provider);
              await deleteUser(currentUser);
            } catch (reAuthError) {
              throw new Error('Bitte melde dich erneut an und versuche es dann nochmal.');
            }
          } else {
            throw new Error('Bitte melde dich erneut an und versuche es dann nochmal.');
          }
        } else {
          throw authError;
        }
      }

      // Logout and navigate to welcome
      await logout();
      setShowDeleteModal(false);
      navigate('/welcome');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'Fehler beim Löschen. Bitte versuche es erneut.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-delulu-soft/50 to-white safe-top safe-bottom pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => activeSection ? setActiveSection(null) : navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-delulu-muted hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-delulu-text">
              {activeSection === 'account' && 'Account'}
              {activeSection === 'privacy' && 'Privatsphäre'}
              {activeSection === 'notifications' && 'Benachrichtigungen'}
              {activeSection === 'blocked' && 'Blockierte User'}
              {activeSection === 'danger' && 'Account-Einstellungen'}
              {activeSection === 'language' && 'Sprache'}
              {activeSection === 'creator' && 'Creator werden'}
              {activeSection === 'legal' && 'Rechtliches'}
              {!activeSection && 'Einstellungen'}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      {!activeSection && (
        <div className="px-6 py-4 space-y-4">
          {/* Profile Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-delulu-violet/10 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User size={24} className="text-delulu-violet" />
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-delulu-text">
                  {user?.displayName || 'Dein Profil'}
                </h3>
                <p className="text-sm text-delulu-muted">@{user?.username || 'username'}</p>
              </div>
              <ChevronRight size={20} className="text-delulu-muted" />
            </button>
          </div>

          {/* Settings Sections */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <SettingsRow
              icon={<Lock size={20} />}
              label="Account & Sicherheit"
              sublabel="Passwort, E-Mail"
              onClick={() => setActiveSection('account')}
            />
            <SettingsRow
              icon={<Shield size={20} />}
              label="Privatsphäre"
              sublabel="Anonymität, Sichtbarkeit"
              onClick={() => setActiveSection('privacy')}
            />
            <SettingsRow
              icon={<Bell size={20} />}
              label="Benachrichtigungen"
              sublabel="Push, Sound, Filter"
              onClick={() => setActiveSection('notifications')}
            />
            <SettingsRow
              icon={<UserX size={20} />}
              label="Blockierte User"
              sublabel={`${blockedUsers.length} blockiert`}
              onClick={() => setActiveSection('blocked')}
            />
          </div>

          {/* Premium Upsell */}
          {!user?.isPremium && (
            <button
              onClick={() => navigate('/premium')}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white text-left"
            >
              <div className="flex items-center gap-3">
                <Crown size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold">Catalyst Premium</h3>
                  <p className="text-sm text-white/80">1.5x XP, ∞ Sterne & mehr</p>
                </div>
                <ChevronRight size={20} />
              </div>
            </button>
          )}

          {/* Creator werden - Coming Soon */}
          {!isVerifiedStar && (
            <button
              onClick={() => setActiveSection('creator')}
              className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4 text-left relative overflow-hidden"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                Coming Soon
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-delulu-text">Creator werden</h3>
                  <p className="text-xs text-delulu-muted">Bald verfügbar</p>
                </div>
                <ChevronRight size={20} className="text-delulu-muted" />
              </div>
            </button>
          )}

          {/* Verified Star Dashboard Link */}
          {isVerifiedStar && (
            <button
              onClick={() => navigate('/stars/dashboard')}
              className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Radio size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-delulu-text">Star Dashboard</h3>
                  <p className="text-xs text-delulu-muted">Analytics, Events & mehr</p>
                </div>
                <ChevronRight size={20} className="text-delulu-muted" />
              </div>
            </button>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* CATALYST-MODUS - Golden Teaser */}
          {/* ═══════════════════════════════════════ */}
          <CatalystTeaser />

          {/* Support */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <SettingsRow
              icon={<HelpCircle size={20} />}
              label="Hilfe & FAQ"
              onClick={() => navigate('/help')}
            />
            <SettingsRow
              icon={<Sparkles size={20} />}
              label="Was gibt's Neues?"
              sublabel="v1.4 - Delulu OS Update"
              onClick={() => setShowWhatsNew(true)}
            />
            <SettingsRow
              icon={<Globe size={20} />}
              label="Sprache"
              sublabel={getLanguageName(language)}
              onClick={() => setActiveSection('language')}
            />
            <SettingsRow
              icon={<FileText size={20} />}
              label="Rechtliches"
              sublabel="Impressum & Datenschutz"
              onClick={() => setActiveSection('legal')}
            />
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <SettingsRow
              icon={<Pause size={20} className="text-amber-500" />}
              label="Account pausieren"
              sublabel="Temporär deaktivieren"
              onClick={() => setShowPauseModal(true)}
              dangerous
            />
            <SettingsRow
              icon={<Trash2 size={20} className="text-red-500" />}
              label="Account löschen"
              sublabel="Unwiderruflich"
              onClick={() => setShowDeleteModal(true)}
              dangerous
            />
          </div>

          {/* Logout */}
          <button
            onClick={async () => {
              await logout();
              navigate('/welcome');
            }}
            className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-semibold"
          >
            <LogOut size={20} />
            Abmelden
          </button>
        </div>
      )}

      {/* Account Section */}
      {activeSection === 'account' && (
        <div className="px-6 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <SettingsRow
              icon={<Lock size={20} />}
              label="Passwort ändern"
              onClick={() => navigate('/login', { state: { showForgotPassword: true } })}
            />
            <div className="p-4">
              <label className="text-sm text-delulu-muted">E-Mail Adresse</label>
              <p className="font-medium text-delulu-text mt-1">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-700">
              <strong>Tipp:</strong> Verwende ein starkes Passwort mit mindestens 12 Zeichen,
              Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.
            </p>
          </div>
        </div>
      )}

      {/* Privacy Section */}
      {activeSection === 'privacy' && (
        <div className="px-6 py-4">
          <PrivacySettings />
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="px-6 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <ToggleRow
              icon={<Bell size={20} />}
              label="Push-Benachrichtigungen"
              sublabel="Erhalte Benachrichtigungen auf dein Gerät"
              value={pushEnabled}
              onChange={setPushEnabled}
            />
            <ToggleRow
              icon={<Volume2 size={20} />}
              label="Sounds"
              sublabel="Töne bei Benachrichtigungen"
              value={soundEnabled}
              onChange={setSoundEnabled}
            />
          </div>

          <h3 className="font-semibold text-delulu-text px-1">Benachrichtige mich bei:</h3>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <ToggleRow
              icon={<Star size={20} className="text-amber-500" />}
              label="Sterne erhalten"
              value={starNotifications}
              onChange={setStarNotifications}
            />
            <ToggleRow
              icon={<User size={20} className="text-blue-500" />}
              label="Neue Follower & Anfragen"
              value={friendNotifications}
              onChange={setFriendNotifications}
            />
            <ToggleRow
              icon={<Radio size={20} className="text-purple-500" />}
              label="Star geht live"
              sublabel="Benachrichtigung wenn Stars Events starten"
              value={starEventNotifications}
              onChange={setStarEventNotifications}
            />
          </div>
        </div>
      )}

      {/* Blocked Users Section */}
      {activeSection === 'blocked' && (
        <div className="px-6 py-4">
          {blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserX size={24} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-delulu-text mb-2">Keine blockierten User</h3>
              <p className="text-sm text-delulu-muted">
                User, die du blockierst, erscheinen hier
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map(blockedUser => (
                <div
                  key={blockedUser.id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-delulu-text">
                        {blockedUser.displayName}
                      </h3>
                      <p className="text-sm text-delulu-muted">
                        @{blockedUser.username}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                          {BLOCK_REASONS.find(r => r.id === blockedUser.reason)?.icon}
                          {BLOCK_REASONS.find(r => r.id === blockedUser.reason)?.label}
                        </span>
                        <span className="text-xs text-delulu-muted">
                          {formatDate(blockedUser.blockedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {showUnblockConfirm === blockedUser.id ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleUnblock(blockedUser.id)}
                        className="flex-1 py-2 px-4 bg-green-500 text-white rounded-xl font-semibold text-sm"
                      >
                        Ja, entblocken
                      </button>
                      <button
                        onClick={() => setShowUnblockConfirm(null)}
                        className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowUnblockConfirm(blockedUser.id)}
                      className="mt-4 w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Entblocken
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Block Reasons Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <h4 className="font-semibold text-delulu-text mb-3 flex items-center gap-2">
              <Ban size={16} />
              Block-Gründe
            </h4>
            <div className="space-y-2">
              {BLOCK_REASONS.map(reason => (
                <div key={reason.id} className="flex items-center gap-2 text-sm text-delulu-muted">
                  {reason.icon}
                  <span>{reason.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Section */}
      {activeSection === 'language' && (
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-delulu-muted">
            Wähle deine bevorzugte Sprache. Die App wird sofort in der gewählten Sprache angezeigt.
          </p>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-delulu-violet/10 flex items-center justify-center text-lg">
                  {LANGUAGES[lang].flag}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-delulu-text">{LANGUAGES[lang].native}</h3>
                  <p className="text-xs text-delulu-muted">{LANGUAGES[lang].name}</p>
                </div>
                {language === lang && (
                  <Check size={20} className="text-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Creator Section - Coming Soon */}
      {activeSection === 'creator' && (
        <div className="px-6 py-4 space-y-4">
          {/* Coming Soon Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 p-6">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-amber-300/30 to-orange-300/30 rounded-full blur-3xl" />

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full mb-4">
              <Clock size={12} />
              Bald verfügbar
            </div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Creator Programm</h2>
                  <p className="text-sm text-gray-500">Coming Soon</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Wir arbeiten gerade an einem aufregenden Creator-Programm für dich!
                Bald kannst du verifizierter Star werden, Live-Events hosten und deine eigene Community aufbauen.
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <Radio size={16} className="text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Live Events</p>
                  <p className="text-[10px] text-gray-500">Hoste eigene Sessions</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                    <Star size={16} className="text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Verifizierung</p>
                  <p className="text-[10px] text-gray-500">Offizieller Star-Status</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                    <Users size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Community</p>
                  <p className="text-[10px] text-gray-500">Baue deine Fanbase</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Analytics</p>
                  <p className="text-[10px] text-gray-500">Verfolge dein Wachstum</p>
                </div>
              </div>

              {/* Disabled Button */}
              <button
                disabled
                className="w-full py-4 rounded-xl bg-gray-200 text-gray-400 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                Demnächst verfügbar
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-2xl flex items-start gap-3">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Bleib dran!</p>
              <p className="text-xs text-blue-600 mt-1">
                Wir benachrichtigen dich, sobald das Creator-Programm verfügbar ist.
                In der Zwischenzeit: Sammle XP und baue deinen Trust-Score auf!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Section */}
      {activeSection === 'legal' && (
        <div className="px-6 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <button
              onClick={() => navigate('/impressum')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-delulu-violet/10 flex items-center justify-center">
                <FileText size={20} className="text-delulu-violet" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-delulu-text">Impressum</h3>
                <p className="text-sm text-delulu-muted">Anbieterinformationen</p>
              </div>
              <ChevronRight size={20} className="text-delulu-muted" />
            </button>
            <button
              onClick={() => navigate('/datenschutz')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-delulu-violet/10 flex items-center justify-center">
                <Shield size={20} className="text-delulu-violet" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-delulu-text">Datenschutz</h3>
                <p className="text-sm text-delulu-muted">Datenschutzerklärung</p>
              </div>
              <ChevronRight size={20} className="text-delulu-muted" />
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl text-center">
            <p className="text-sm text-delulu-muted">
              delulu App v1.0.0<br />
              © 2025 Butterbread UG
            </p>
          </div>
        </div>
      )}

      {/* Pause Account Modal */}
      {showPauseModal && (
        <Modal onClose={() => !isPausing && setShowPauseModal(false)}>
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Pause size={32} className="text-amber-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-delulu-text mb-2">
              Account pausieren?
            </h2>
            <p className="text-sm text-delulu-muted mb-6">
              Dein Profil wird für andere unsichtbar. Du kannst jederzeit zurückkehren und
              all deine Daten bleiben erhalten.
            </p>

            {pauseError && (
              <p className="text-red-500 text-sm mb-4">{pauseError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                disabled={isPausing}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handlePauseAccount}
                disabled={isPausing}
                className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPausing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Pause size={18} />
                    Pausieren
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-delulu-text mb-2">
              Account unwiderruflich löschen?
            </h2>
            <p className="text-sm text-delulu-muted mb-6">
              Alle deine Daten, Freundschaften, Sterne und XP werden permanent gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="mb-6">
              <label className="text-sm text-delulu-muted block mb-2">
                Tippe "LÖSCHEN" zur Bestätigung:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none text-center font-mono"
                placeholder="LÖSCHEN"
              />
            </div>

            {deleteError && (
              <p className="text-red-500 text-sm mb-4">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'löschen' || isDeleting}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Löschen
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* What's New Modal */}
      <WhatsNewModal
        isOpen={showWhatsNew}
        onClose={() => setShowWhatsNew(false)}
      />
    </div>
  );
};

// Helper Components
interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  dangerous?: boolean;
}

const SettingsRow = ({ icon, label, sublabel, onClick, dangerous }: SettingsRowProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
      dangerous ? 'bg-red-50 text-red-500' : 'bg-delulu-violet/10 text-delulu-violet'
    }`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className={`font-semibold ${dangerous ? 'text-red-600' : 'text-delulu-text'}`}>
        {label}
      </h3>
      {sublabel && (
        <p className="text-sm text-delulu-muted">{sublabel}</p>
      )}
    </div>
    <ChevronRight size={20} className="text-delulu-muted" />
  </button>
);

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ icon, label, sublabel, value, onChange }: ToggleRowProps) => (
  <div className="flex items-center gap-4 p-4">
    <div className="w-10 h-10 rounded-xl bg-delulu-violet/10 flex items-center justify-center text-delulu-violet">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-delulu-text">{label}</h3>
      {sublabel && (
        <p className="text-sm text-delulu-muted">{sublabel}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        value ? 'bg-delulu-violet' : 'bg-gray-200'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          value ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  </div>
);

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal = ({ children, onClose }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
    <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
      >
        <X size={18} />
      </button>
      {children}
    </div>
  </div>
);

export default Settings;
