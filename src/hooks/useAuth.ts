/**
 * synclulu AUTH HOOK
 * "Photo Core Edition" - Authentication with direct avatarUrl storage
 *
 * KEY FEATURES:
 * - Direct Firebase Storage for profile images
 * - No avatar caching layers - simple avatarUrl field
 * - WebP compression for optimized storage
 */

import { useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { User } from '@/types';
import { useReferralCode, initializeUserReferrals } from '@/lib/referralSystem';
// Native Auth for iOS
import {
  isNativePlatform,
  nativeGoogleSignIn,
  nativeEmailSignIn,
  nativeEmailRegister,
  nativeSignOut
} from '@/lib/nativeAuth';

// Admin emails - these users get admin rights (NOT automatic star status)
const ADMIN_EMAILS = [
  'yunghundse@gmail.com',
  'jan@butterbread.de',
  'founder@synclulu.app',
];

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, logout } = useStore();

  useEffect(() => {
    // Handle redirect result from Google OAuth
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log('Google redirect login successful');
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        // Get or create user profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Set isAdmin flag for admin emails (but NOT star status - that requires verification)
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || '');

          setUser({ ...userData, id: firebaseUser.uid, isAdmin });
        } else {
          // Create new user profile
          const newUser: Omit<User, 'id'> = {
            email: firebaseUser.email || '',
            username: `user_${firebaseUser.uid.slice(0, 8)}`,
            displayName: firebaseUser.displayName || 'Anonymous',
            avatarUrl: firebaseUser.photoURL || null,
            visibilityMode: 'anonymous',
            isActive: true,
            lastSeen: new Date(),
            createdAt: new Date(),
          };

          // Filter out undefined/null values for Firestore
          const userDataForFirestore: Record<string, any> = {
            email: newUser.email,
            username: newUser.username,
            displayName: newUser.displayName,
            visibilityMode: newUser.visibilityMode,
            isActive: newUser.isActive,
            lastSeen: serverTimestamp(),
            createdAt: serverTimestamp(),
          };

          // Only add avatarUrl if it exists
          if (firebaseUser.photoURL) {
            userDataForFirestore.avatarUrl = firebaseUser.photoURL;
          }

          await setDoc(doc(db, 'users', firebaseUser.uid), userDataForFirestore);

          // Set isAdmin flag for admin emails (but NOT star status - that requires verification)
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || '');
          setUser({ ...newUser, id: firebaseUser.uid, isAdmin });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsLoading]);

  const signIn = async (email: string, password: string) => {
    try {
      // Use native auth for iOS
      if (isNativePlatform()) {
        const result = await nativeEmailSignIn(email, password);
        if (!result.success) {
          return { success: false, error: result.error || 'Login fehlgeschlagen' };
        }
        return { success: true };
      }

      // Web fallback
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Login fehlgeschlagen';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'E-Mail oder Passwort ist falsch';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Kein Account mit dieser E-Mail gefunden';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ungültige E-Mail-Adresse';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Zu viele Versuche. Bitte warte einen Moment.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Dieser Account wurde deaktiviert';
      }
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    try {
      let result;

      // Use native auth for iOS
      if (isNativePlatform()) {
        const nativeResult = await nativeEmailRegister(email, password);
        if (!nativeResult.success) {
          return { success: false, error: nativeResult.error || 'Registrierung fehlgeschlagen' };
        }
        result = { user: auth.currentUser! };
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }

      // Create user profile with username
      const newUser = {
        email,
        username,
        displayName: username,
        visibilityMode: 'anonymous',
        isActive: true,
        xp: 0,
        level: 1,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', result.user.uid), newUser);

      // Initialize referral links for new user (5 exclusive links)
      await initializeUserReferrals(result.user.uid);

      // Process referral code if provided
      if (referralCode) {
        try {
          await useReferralCode(referralCode, result.user.uid, username);
        } catch (refError) {
          // Referral processing failed, but registration succeeded
          console.log('Referral processing failed:', refError);
        }
      }

      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Registrierung fehlgeschlagen';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Diese E-Mail ist bereits registriert';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ungültige E-Mail-Adresse';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Passwort muss mindestens 6 Zeichen haben';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Registrierung ist momentan nicht möglich';
      }
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use native Google sign-in for iOS
      if (isNativePlatform()) {
        const result = await nativeGoogleSignIn();
        if (!result.success) {
          return { success: false, error: result.error || 'Google Login fehlgeschlagen' };
        }
        return { success: true };
      }

      // Web: Use popup/redirect
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Try popup first (works on most browsers)
      try {
        await signInWithPopup(auth, provider);
        return { success: true };
      } catch (popupError: any) {
        // If popup blocked or failed, use redirect
        if (popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          console.log('Popup blocked, using redirect...');
          await signInWithRedirect(auth, provider);
          return { success: true };
        }
        throw popupError;
      }
    } catch (error: any) {
      let errorMessage = 'Google Login fehlgeschlagen';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login abgebrochen';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Ein Account mit dieser E-Mail existiert bereits';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Netzwerkfehler - bitte prüfe deine Verbindung';
      }
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Fehler beim Zurücksetzen des Passworts';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Kein Account mit dieser E-Mail gefunden';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Ungültige E-Mail-Adresse';
      }
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    logout: handleLogout,
  };
};
