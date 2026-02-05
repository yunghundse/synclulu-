/**
 * synclulu APP - Main Application Router
 * @version 41.0.0 - ULTRA PURGE - MINIMAL CORE
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

// Pages - MINIMAL CORE ONLY
import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';
import Onboarding from '@/pages/Onboarding';
import HomeMinimal from '@/pages/HomeMinimal';
import RoomsV2 from '@/pages/RoomsV2';
import VoiceRoom from '@/pages/VoiceRoom';
import ProfileSovereign from '@/pages/ProfileSovereign';
import Friends from '@/pages/Friends';
import Notifications from '@/pages/Notifications';
import ProfileVisitors from '@/pages/ProfileVisitors';
import UserProfile from '@/pages/UserProfile';
import SettingsHub from '@/pages/SettingsHub';
import DevicesSettings from '@/pages/DevicesSettings';
import HelpCenter from '@/pages/HelpCenter';
import InvitesPage from '@/pages/InvitesPage';
import Admin from '@/pages/Admin';
import NexusDashboard from '@/pages/NexusDashboard';
import Impressum from '@/pages/Impressum';
import Datenschutz from '@/pages/Datenschutz';
import Legal from '@/pages/Legal';
import ResetPassword from '@/pages/ResetPassword';
import RegisterInvite from '@/pages/RegisterInvite';
import SyncluluRegister from '@/pages/SyncluluRegister';
import OnboardingFlow from '@/pages/OnboardingFlow';
import VoiceStats from '@/pages/VoiceStats';
import Streaks from '@/pages/Streaks';

// Components
import LoadingScreen from '@/components/LoadingScreen';
import NotificationToast from '@/components/NotificationToast';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { ConsentScreen } from '@/components/ConsentScreen/ConsentScreen';
import { DeepSpaceGrid } from '@/components/SovereignUI/DeepSpaceGrid';
import { SovereignNav } from '@/components/SovereignNav';

// Context
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

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

  // Listen for consent changes
  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem('synclulu_consent_accepted') === 'true';
      setHasAcceptedConsent(consent);
    };
    window.addEventListener('storage', checkConsent);
    const interval = setInterval(checkConsent, 500);
    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  // Loading timeout - skip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Check admin status and consent
  useEffect(() => {
    const checkAdminAndConsent = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          const data = userDoc.data();
          const hasAdminAccess = data?.isAdmin === true || data?.role === 'founder' || data?.role === 'admin';
          setIsAdmin(hasAdminAccess);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES (Not Authenticated)
  // ═══════════════════════════════════════════════════════════════════════════
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
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING (Not Completed)
  // ═══════════════════════════════════════════════════════════════════════════
  const onboardingCompleted = (user as any)?.onboardingCompleted === true;

  if (!onboardingCompleted) {
    return (
      <ThemeProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATED ROUTES - MINIMAL CORE
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <UserProfileProvider>
            {/* 🛡️ First-Start Consent Screen */}
            {!hasAcceptedConsent && (
              <ConsentScreen onAccept={() => setHasAcceptedConsent(true)} />
            )}

            <div className="min-h-screen min-h-[100dvh] bg-black pb-28 theme-transition relative sovereign-app">
              {/* 🌌 Deep Space Grid Background */}
              <DeepSpaceGrid intensity="normal" showNebula={true} />

              <NotificationToast />
              <XPToast />

              <Routes>
                {/* ═══ HOME ═══ */}
                <Route path="/" element={<HomeMinimal />} />
                <Route path="/home" element={<HomeMinimal />} />

                {/* ═══ ROOMS (Central Feature) ═══ */}
                <Route path="/rooms" element={<RoomsV2 />} />
                <Route path="/discover" element={<RoomsV2 />} />
                <Route path="/map" element={<RoomsV2 />} />
                <Route path="/room/:roomId" element={<VoiceRoom />} />
                <Route path="/voice-room/:roomId" element={<VoiceRoom />} />

                {/* ═══ PROFILE & SOCIAL ═══ */}
                <Route path="/profile" element={<ProfileSovereign />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/profile-visitors" element={<ProfileVisitors />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/voice-stats" element={<VoiceStats />} />
                <Route path="/streaks" element={<Streaks />} />

                {/* ═══ SETTINGS ═══ */}
                <Route path="/settings" element={<SettingsHub />} />
                <Route path="/settings/devices" element={<DevicesSettings />} />
                <Route path="/help" element={<HelpCenter />} />

                {/* ═══ INVITES ═══ */}
                <Route path="/invites" element={<InvitesPage />} />
                <Route path="/referral-status" element={<InvitesPage />} />

                {/* ═══ ADMIN ═══ */}
                <Route path="/admin" element={<Admin />} />
                <Route path="/nexus-admin" element={<NexusDashboard />} />

                {/* ═══ LEGAL ═══ */}
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/legal-center" element={<Legal />} />

                {/* ═══ 404 FALLBACK → HOME ═══ */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* 🎯 Sovereign Navigation - GODMODE z-[999] */}
              <SovereignNav />
            </div>
          </UserProfileProvider>
        </NotificationProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
