/**
 * UserProfileContext.tsx
 * Global User State Provider - Zero-Bug Architecture
 *
 * Features:
 * - Globaler User-State auf allen Seiten verfügbar
 * - Profil-Daten werden EINMAL geladen und gecached
 * - Level, XP, Founder-Status überall verfügbar
 * - IP-Location ohne Popup
 * - Unread Messages Counter
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getLevelFromXP, getAscensionTier, AscensionTier } from '../lib/ascensionSystem';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface IPLocation {
  city: string;
  country: string;
  countryCode: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  xp: number;
  level: number;
  progress: number; // 0-100
  tier: AscensionTier;
  isFounder: boolean;
  isAdmin: boolean;
  isActive: boolean;
  createdAt?: Date;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  ipLocation: IPLocation | null;
  isLoadingLocation: boolean;
  unreadMessages: number;
  refreshProfile: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════
const UserProfileContext = createContext<UserProfileContextType | null>(null);

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Location State
  const [ipLocation, setIPLocation] = useState<IPLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Messages State
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ───────────────────────────────────────────────────────────
  // Fetch User Profile (EINMAL laden, dann cachen)
  // ───────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const profileDoc = await getDoc(doc(db, 'users', user.id));

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const xp = data.xp || data.totalXP || 0;
        const levelData = getLevelFromXP(xp);
        const progress = Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
        const tier = getAscensionTier(levelData.level);

        setProfile({
          id: user.id,
          displayName: data.displayName || data.username || 'Anonym',
          username: data.username,
          photoURL: data.photoURL,
          xp,
          level: levelData.level,
          progress,
          tier,
          isFounder: data.role === 'founder' || data.isAdmin === true,
          isAdmin: data.isAdmin === true,
          isActive: data.isActive || false,
          createdAt: data.createdAt?.toDate?.(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial Profile Load
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ───────────────────────────────────────────────────────────
  // Real-time Profile Updates (für XP, Active-Status)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const xp = data.xp || data.totalXP || 0;
          const levelData = getLevelFromXP(xp);
          const progress = Math.min(100, (levelData.currentXP / levelData.neededXP) * 100);
          const tier = getAscensionTier(levelData.level);

          setProfile((prev) => prev ? {
            ...prev,
            xp,
            level: levelData.level,
            progress,
            tier,
            isActive: data.isActive || false,
            displayName: data.displayName || data.username || prev.displayName,
            photoURL: data.photoURL || prev.photoURL,
          } : null);
        }
      },
      (error) => {
        console.log('Profile listener error:', error.code);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // IP-Based Location (KEIN Popup!)
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLocation = async () => {
      // Check Cache
      const cached = localStorage.getItem('synclulu_ip_location');
      const cacheTime = localStorage.getItem('synclulu_ip_location_time');

      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
        setIPLocation(JSON.parse(cached));
        setIsLoadingLocation(false);
        return;
      }

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const loc: IPLocation = {
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
        };

        setIPLocation(loc);
        localStorage.setItem('synclulu_ip_location', JSON.stringify(loc));
        localStorage.setItem('synclulu_ip_location_time', Date.now().toString());
      } catch {
        setIPLocation({ city: 'Vibe Zone', country: 'Universe', countryCode: '🌍' });
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocation();
  }, []);

  // ───────────────────────────────────────────────────────────
  // Unread Messages Counter
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('recipientId', '==', user.id),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          setUnreadMessages(snapshot.docs.length);
        },
        () => {
          // Graceful error handling
          setUnreadMessages(0);
        }
      );

      return () => unsubscribe();
    } catch {
      // Ignore errors
    }
  }, [user?.id]);

  // ───────────────────────────────────────────────────────────
  // Context Value
  // ───────────────────────────────────────────────────────────
  const contextValue = useMemo<UserProfileContextType>(
    () => ({
      profile,
      isLoading,
      ipLocation,
      isLoadingLocation,
      unreadMessages,
      refreshProfile: fetchProfile,
    }),
    [profile, isLoading, ipLocation, isLoadingLocation, unreadMessages, fetchProfile]
  );

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════
export function useUserProfile() {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }

  return context;
}

export default UserProfileProvider;
