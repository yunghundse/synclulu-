/**
 * synclulu STORE
 * "Permanent Identity" - State management with persistence
 *
 * KEY FEATURES:
 * - User state persists across sessions (localStorage)
 * - Avatar URL is sticky - never flickers on reload
 * - Partial hydration for sensitive data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Location, NearbyUser, Chat, VerifiedStar, StarApplication, StarEvent, NewsTickerItem } from '@/types';
import { Language } from './i18n/translations';

// Detect browser language
const getBrowserLanguage = (): Language => {
  const stored = localStorage.getItem('synclulu-language') as Language;
  if (stored && ['de', 'en', 'es', 'fr', 'pt'].includes(stored)) {
    return stored;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['de', 'en', 'es', 'fr', 'pt'].includes(browserLang)) {
    return browserLang as Language;
  }

  return 'en'; // Default to English
};

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Location
  location: Location | null;
  locationError: string | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;

  // Discovery
  nearbyUsers: NearbyUser[];
  searchRadius: number;
  isDiscovering: boolean;

  // Chats
  chats: Chat[];
  activeChat: Chat | null;

  // Language
  language: Language;

  // UI State
  showXPToast: boolean;
  xpToastAmount: number;
  xpToastReason: string;

  // Stars Program (VIP)
  starProfile: VerifiedStar | null;
  starApplication: StarApplication | null;
  liveStarEvents: StarEvent[];
  newsTicker: NewsTickerItem[];
  isVerifiedStar: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLocation: (location: Location | null) => void;
  setLocationError: (error: string | null) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'prompt' | null) => void;
  setNearbyUsers: (users: NearbyUser[]) => void;
  setSearchRadius: (radius: number) => void;
  setIsDiscovering: (discovering: boolean) => void;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLanguage: (language: Language) => void;
  showXPGain: (amount: number, reason: string) => void;
  hideXPToast: () => void;
  logout: () => void;

  // Stars Actions
  setStarProfile: (profile: VerifiedStar | null) => void;
  setStarApplication: (application: StarApplication | null) => void;
  setLiveStarEvents: (events: StarEvent[]) => void;
  setNewsTicker: (items: NewsTickerItem[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      location: null,
      locationError: null,
      locationPermission: null,
      nearbyUsers: [],
      searchRadius: 500, // 500m default
      isDiscovering: false,
      chats: [],
      activeChat: null,
      language: getBrowserLanguage(),
      showXPToast: false,
      xpToastAmount: 0,
      xpToastReason: '',

      // Stars Program initial state
      starProfile: null,
      starApplication: null,
      liveStarEvents: [],
      newsTicker: [],
      isVerifiedStar: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLocation: (location) => set({ location }),
      setLocationError: (locationError) => set({ locationError }),
      setLocationPermission: (locationPermission) => set({ locationPermission }),
      setNearbyUsers: (nearbyUsers) => set({ nearbyUsers }),
      setSearchRadius: (searchRadius) => set({ searchRadius }),
      setIsDiscovering: (isDiscovering) => set({ isDiscovering }),
      setChats: (chats) => set({ chats }),
      setActiveChat: (activeChat) => set({ activeChat }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setLanguage: (language) => {
        localStorage.setItem('synclulu-language', language);
        set({ language });
      },
      showXPGain: (amount, reason) =>
        set({ showXPToast: true, xpToastAmount: amount, xpToastReason: reason }),
      hideXPToast: () => set({ showXPToast: false }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          location: null,
          nearbyUsers: [],
          chats: [],
          activeChat: null,
          starProfile: null,
          starApplication: null,
          isVerifiedStar: false,
        }),

      // Stars Actions
      setStarProfile: (starProfile) => set({ starProfile, isVerifiedStar: !!starProfile }),
      setStarApplication: (starApplication) => set({ starApplication }),
      setLiveStarEvents: (liveStarEvents) => set({ liveStarEvents }),
      setNewsTicker: (newsTicker) => set({ newsTicker }),
    }),
    {
      name: 'synclulu-store', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      // PERMANENT IDENTITY: Only persist user identity data (including avatar)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        searchRadius: state.searchRadius,
        // DON'T persist: location, chats, nearbyUsers, etc. (ephemeral data)
      }),
      // Rehydration callback - ensure avatar is available immediately
      onRehydrateStorage: () => (state) => {
        if (state?.user?.avatarUrl) {
          // Avatar is already in persisted state - instant display
          console.log('[Store] User rehydrated with avatar:', state.user.avatarUrl.slice(0, 50) + '...');
        }
      },
    }
  )
);
