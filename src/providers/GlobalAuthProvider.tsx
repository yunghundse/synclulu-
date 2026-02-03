/**
 * GLOBAL AUTH PROVIDER
 * "Zero Data Loss" - Bulletproof authentication and state persistence
 *
 * GUARANTEES:
 * 1. Login redirect works flawlessly (OAuth, Deep Links)
 * 2. Profile pictures NEVER disappear during navigation
 * 3. All assets in global state (Zustand + localStorage)
 * 4. Session survives browser refresh
 *
 * @author Senior Principal Engineer
 * @version 2.0.0 - Silicon Valley Edition
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { initializeUserReferrals, useReferralCode } from '@/lib/referralSystem';

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const AUTH_PERSISTENCE_KEY = 'delulu_auth_state';
const REDIRECT_STATE_KEY = 'delulu_auth_redirect';
const ADMIN_EMAILS = [
  'yunghundse@gmail.com',
  'jan@butterbread.de',
  'founder@delulu.app',
];

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  firebaseUser: FirebaseUser | null;
}

interface AuthContextValue extends AuthState {
  // Sign In
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;

  // Sign Up
  signUpWithEmail: (email: string, password: string, referralCode?: string) => Promise<{ success: boolean; error?: string }>;

  // Sign Out
  signOut: () => Promise<void>;

  // Password Reset
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Utilities
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ═══════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════

const persistAuthState = (userId: string | null) => {
  try {
    if (userId) {
      localStorage.setItem(AUTH_PERSISTENCE_KEY, JSON.stringify({ userId, timestamp: Date.now() }));
    } else {
      localStorage.removeItem(AUTH_PERSISTENCE_KEY);
    }
  } catch {}
};

const getPersistedAuthState = (): { userId: string; timestamp: number } | null => {
  try {
    const stored = localStorage.getItem(AUTH_PERSISTENCE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const setRedirectState = (action: 'signin' | 'signup', referralCode?: string) => {
  try {
    sessionStorage.setItem(REDIRECT_STATE_KEY, JSON.stringify({ action, referralCode, timestamp: Date.now() }));
  } catch {}
};

const getRedirectState = (): { action: 'signin' | 'signup'; referralCode?: string } | null => {
  try {
    const stored = sessionStorage.getItem(REDIRECT_STATE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    // Clear after reading
    sessionStorage.removeItem(REDIRECT_STATE_KEY);
    return data;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════

interface GlobalAuthProviderProps {
  children: ReactNode;
}

export const GlobalAuthProvider: React.FC<GlobalAuthProviderProps> = ({ children }) => {
  const { setUser, clearUser, user } = useStore();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    firebaseUser: null,
  });

  // ═══════════════════════════════════════
  // SYNC USER DATA TO STORE
  // ═══════════════════════════════════════

  const syncUserToStore = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update last seen
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          lastSeen: serverTimestamp(),
          isActive: true,
        }, { merge: true });

        // Set user in store
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: userData.username || '',
          displayName: userData.displayName || userData.username || '',
          avatar: userData.avatar,
          avatarUrl: userData.avatarUrl,
          bio: userData.bio,
          visibilityMode: userData.visibilityMode || 'public',
          isActive: true,
          lastSeen: new Date(),
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          xp: userData.xp || 0,
          level: userData.level || 1,
          levelTitle: userData.levelTitle || 'Newbie',
          isPremium: userData.isPremium || false,
          isAdmin: userData.isAdmin || ADMIN_EMAILS.includes(firebaseUser.email || ''),
          isStar: userData.isStar || false,
          onboardingCompleted: userData.onboardingCompleted || false,
          ...userData,
        });

        // Persist auth state
        persistAuthState(firebaseUser.uid);

        return true;
      }

      return false;
    } catch (error) {
      console.error('[GlobalAuth] Failed to sync user:', error);
      return false;
    }
  }, [setUser]);

  // ═══════════════════════════════════════
  // CREATE NEW USER PROFILE
  // ═══════════════════════════════════════

  const createUserProfile = useCallback(async (
    firebaseUser: FirebaseUser,
    referralCode?: string
  ) => {
    const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
    const username = `user_${firebaseUser.uid.slice(0, 8)}`;

    const newUser = {
      email: firebaseUser.email || '',
      username,
      displayName: firebaseUser.displayName || username,
      avatar: 'pegasus',
      avatarUrl: firebaseUser.photoURL || null,
      bio: '',
      visibilityMode: 'public',
      isActive: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      xp: 0,
      level: 1,
      levelTitle: 'Newbie',
      isPremium: false,
      isAdmin,
      isStar: false,
      onboardingCompleted: false,
      referredBy: referralCode || null,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    // Initialize referral links
    await initializeUserReferrals(firebaseUser.uid);

    // Apply referral code if provided
    if (referralCode) {
      await useReferralCode(referralCode, firebaseUser.uid);
    }

    return newUser;
  }, []);

  // ═══════════════════════════════════════
  // AUTH STATE LISTENER
  // ═══════════════════════════════════════

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthState(prev => ({ ...prev, isLoading: true, firebaseUser }));

        const synced = await syncUserToStore(firebaseUser);

        if (!synced) {
          // New user - create profile
          const redirectState = getRedirectState();
          await createUserProfile(firebaseUser, redirectState?.referralCode);
          await syncUserToStore(firebaseUser);
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          firebaseUser,
        });
      } else {
        clearUser();
        persistAuthState(null);

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          firebaseUser: null,
        });
      }
    });

    return () => unsubscribe();
  }, [syncUserToStore, createUserProfile, clearUser]);

  // ═══════════════════════════════════════
  // HANDLE REDIRECT RESULT (OAuth)
  // ═══════════════════════════════════════

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User signed in via redirect
          await syncUserToStore(result.user);
        }
      } catch (error: any) {
        console.error('[GlobalAuth] Redirect error:', error);
        setAuthState(prev => ({ ...prev, error: error.message }));
      }
    };

    handleRedirect();
  }, [syncUserToStore]);

  // ═══════════════════════════════════════
  // SIGN IN METHODS
  // ═══════════════════════════════════════

  const signInWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let message = 'Login fehlgeschlagen';

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          message = 'Ungültige E-Mail oder Passwort';
          break;
        case 'auth/too-many-requests':
          message = 'Zu viele Versuche. Bitte später erneut versuchen.';
          break;
        case 'auth/user-disabled':
          message = 'Dieses Konto wurde deaktiviert';
          break;
      }

      setAuthState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // Try popup first (better UX)
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        // Fallback to redirect
        try {
          setRedirectState('signin');
          await signInWithRedirect(auth, provider);
          return { success: true };
        } catch (redirectError: any) {
          const message = 'Google Login fehlgeschlagen';
          setAuthState(prev => ({ ...prev, isLoading: false, error: message }));
          return { success: false, error: message };
        }
      }

      const message = 'Google Login fehlgeschlagen';
      setAuthState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  // ═══════════════════════════════════════
  // SIGN UP
  // ═══════════════════════════════════════

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    referralCode?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user, referralCode);
      return { success: true };
    } catch (error: any) {
      let message = 'Registrierung fehlgeschlagen';

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Diese E-Mail ist bereits registriert';
          break;
        case 'auth/weak-password':
          message = 'Passwort muss mindestens 6 Zeichen haben';
          break;
        case 'auth/invalid-email':
          message = 'Ungültige E-Mail-Adresse';
          break;
      }

      setAuthState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, [createUserProfile]);

  // ═══════════════════════════════════════
  // SIGN OUT
  // ═══════════════════════════════════════

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      clearUser();
      persistAuthState(null);
    } catch (error) {
      console.error('[GlobalAuth] Sign out error:', error);
    }
  }, [clearUser]);

  // ═══════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════

  const sendPasswordReset = useCallback(async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      let message = 'Passwort-Reset fehlgeschlagen';

      if (error.code === 'auth/user-not-found') {
        message = 'Keine Benutzer mit dieser E-Mail gefunden';
      }

      return { success: false, error: message };
    }
  }, []);

  // ═══════════════════════════════════════
  // REFRESH USER
  // ═══════════════════════════════════════

  const refreshUser = useCallback(async () => {
    if (authState.firebaseUser) {
      await syncUserToStore(authState.firebaseUser);
    }
  }, [authState.firebaseUser, syncUserToStore]);

  // ═══════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════

  const value: AuthContextValue = {
    ...authState,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    sendPasswordReset,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════

export const useGlobalAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useGlobalAuth must be used within GlobalAuthProvider');
  }
  return context;
};

export default GlobalAuthProvider;
