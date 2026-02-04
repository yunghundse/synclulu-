/**
 * synclulu APP - Main Application Router
 * @version 3.0.0 - Clean Production Build
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/lib/store';
import { useSounds } from '@/hooks/useSounds';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Pages
import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Discover from '@/pages/Discover';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import ProfileMinimal from '@/pages/ProfileMinimal';
import Statistics from '@/pages/Statistics';
import Notifications from '@/pages/Notifications';
import Premium from '@/pages/Premium';
import Settings from '@/pages/Settings';
import SettingsHub from '@/pages/SettingsHub';
import Help from '@/pages/Help';
import StarsApplication from '@/pages/StarsApplication';
import StarsDashboard from '@/pages/StarsDashboard';
import StarsSchedule from '@/pages/StarsSchedule';
import UserProfile from '@/pages/UserProfile';
import Admin from '@/pages/Admin';
import CreatorDashboard from '@/pages/CreatorDashboard';
import NewLockedContent from '@/pages/NewLockedContent';
import BlockedUsers from '@/pages/BlockedUsers';
import Impressum from '@/pages/Impressum';
import Datenschutz from '@/pages/Datenschutz';
import ResetPassword from '@/pages/ResetPassword';
import InvitesPage from '@/pages/InvitesPage';
import RadarPage from '@/pages/RadarPage';
import RegisterInvite from '@/pages/RegisterInvite';
import SyncluluRegister from '@/pages/SyncluluRegister';
import OnboardingFlow from '@/pages/OnboardingFlow';
import DevicesSettings from '@/pages/DevicesSettings';
import TrustStats from '@/pages/TrustStats';
import Friends from '@/pages/Friends';
import VoiceStats from '@/pages/VoiceStats';
import NexusDashboard from '@/pages/NexusDashboard';
import LegalCenter from '@/pages/LegalCenter';
import LegalPopup from '@/pages/LegalPopup';
import DatenschutzPopup from '@/pages/DatenschutzPopup';

// Components
import GhostOrbitDock from '@/components/GhostOrbitDock';
import LoadingScreen from '@/components/LoadingScreen';
import NotificationToast from '@/components/NotificationToast';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';
import { NebulaBackground } from '@/components/NebulaBackground';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { ConsentScreen } from '@/components/ConsentScreen/ConsentScreen';

// Context
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// XP Toast Component
const XPToast = () => {
  const { showXPToast, xpToastAmount, xpToastReason, hideXPToast } = useStore();
  const { playXPSound } = useSounds();

  useEffect(() => {
    if (showXPToast) {
      playXPSound();
      const timer = setTimeout(() => {
        hideXPToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showXPToast, hideXPToast, playXPSound]);

  if (!showXPToast) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-lg">+{xpToastAmount} XP</p>
          <p className="text-xs opacity-90">{xpToastReason}</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { user } = useStore();
  const { isMaintenanceMode, maintenanceMessage, maintenanceEstimatedEnd, isLoading: configLoading } = useSystemConfig();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(() => {
    return localStorage.getItem('synclulu_consent_accepted') === 'true';
  });
  const location = useLocation();

  // Listen for consent changes (reactive update when ConsentScreen accepts)
  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('synclulu_consent_accepted') === 'true';
      setHasAcceptedConsent(consent);
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', checkConsent);

    // Poll for same-tab changes
    const interval = setInterval(checkConsent, 500);

    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  // Timeout für Loading - nach 5 Sekunden überspringen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is admin/founder (to bypass maintenance mode)
  // Also check if user has already accepted consent in Firestore (from registration)
  useEffect(() => {
    const checkAdminAndConsent = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          const data = userDoc.data();
          const hasAdminAccess = data?.isAdmin === true ||
                                  data?.role === 'founder' ||
                                  data?.role === 'admin';
          setIsAdmin(hasAdminAccess);

          // Check if user already gave consent during registration
          // If hasAcceptedTerms is true in Firestore, set localStorage and skip ConsentScreen
          if (data?.hasAcceptedTerms === true) {
            localStorage.setItem('synclulu_consent_accepted', 'true');
            setHasAcceptedConsent(true);
          }
        } catch (error) {
          setIsAdmin(false);
        }
      }
      setAdminCheckDone(true);
    };
    checkAdminAndConsent();
  }, [user?.id]);

  // Loading state
  if ((isLoading || configLoading || !adminCheckDone) && !loadingTimeout) {
    return <LoadingScreen />;
  }

  // Maintenance Mode
  const isAdminPath = location.pathname.startsWith('/admin');
  const isLoginPath = location.pathname === '/login';
  const isLegalPath = ['/impressum', '/datenschutz'].includes(location.pathname);

  // TEMPORARILY DISABLED FOR TESTING
  // if (isMaintenanceMode && !isAdmin && !isAdminPath && !isLoginPath && !isLegalPath) {
  //   return (
  //     <MaintenanceOverlay
  //       message={maintenanceMessage}
  //       estimatedEnd={maintenanceEstimatedEnd}
  //     />
  //   );
  // }

  // Not logged in - Public routes
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<OnboardingFlow />} />
          <Route path="/signup" element={<OnboardingFlow />} />
          <Route path="/register-legacy" element={<SyncluluRegister />} />
          <Route path="/join/:code" element={<RegisterInvite />} />
          <Route path="/join" element={<RegisterInvite />} />
          <Route path="/invite/:code" element={<SyncluluRegister />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/legal-popup" element={<LegalPopup />} />
          <Route path="/datenschutz-popup" element={<DatenschutzPopup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  // Logged in but onboarding not completed
  const onboardingCompleted = (user as any)?.onboardingCompleted === true;

  if (!onboardingCompleted) {
    return (
      <ThemeProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/legal-popup" element={<LegalPopup />} />
          <Route path="/datenschutz-popup" element={<DatenschutzPopup />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  // Fully authenticated and onboarded
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          {/* 🛡️ First-Start Consent Screen */}
          {!hasAcceptedConsent && (
            <ConsentScreen onAccept={() => setHasAcceptedConsent(true)} />
          )}

          <div className="min-h-screen min-h-[100dvh] bg-[var(--synclulu-bg)] pb-24 theme-transition relative">
            {/* 🌌 Nebula Animated Background */}
            <NebulaBackground intensity={0.6} />

            <NotificationToast />
            <XPToast />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<ProfileMinimal />} />
            <Route path="/profile/full" element={<Profile />} />
            <Route path="/profile/trust-stats" element={<TrustStats />} />
            <Route path="/voice-stats" element={<VoiceStats />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/settings" element={<SettingsHub />} />
            <Route path="/settings/legacy" element={<Settings />} />
            <Route path="/settings/security" element={<Settings />} />
            <Route path="/settings/blocked" element={<BlockedUsers />} />
            <Route path="/settings/devices" element={<DevicesSettings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/invites" element={<InvitesPage />} />
            <Route path="/referral-status" element={<InvitesPage />} />
            <Route path="/radar" element={<RadarPage />} />
            <Route path="/stars/apply" element={<StarsApplication />} />
            <Route path="/stars/dashboard" element={<StarsDashboard />} />
            <Route path="/stars/schedule" element={<StarsSchedule />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/blocked-users" element={<BlockedUsers />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/creator" element={<CreatorDashboard />} />
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/new-content" element={<NewLockedContent />} />
            <Route path="/creator-application" element={<StarsApplication />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/legal" element={<LegalCenter />} />
            <Route path="/legal-center" element={<LegalCenter />} />
            <Route path="/legal-popup" element={<LegalPopup />} />
            <Route path="/datenschutz-popup" element={<DatenschutzPopup />} />
            <Route path="/nexus-admin" element={<NexusDashboard />} />
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            <GhostOrbitDock />
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
