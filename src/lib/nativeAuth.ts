/**
 * NATIVE AUTH HELPER
 * Uses Capacitor Firebase plugin for iOS native authentication
 *
 * WICHTIG: Graceful degradation für Web-Plattform
 */

import { Capacitor } from '@capacitor/core';
import { auth } from './firebase';
import {
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Check if running on native platform
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Check if running on iOS
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

// Lazy load FirebaseAuthentication only on native platforms
let FirebaseAuthentication: any = null;

const getFirebaseAuth = async () => {
  if (!isNativePlatform()) {
    return null;
  }

  if (!FirebaseAuthentication) {
    try {
      const module = await import('@capacitor-firebase/authentication');
      FirebaseAuthentication = module.FirebaseAuthentication;
    } catch (error) {
      console.warn('FirebaseAuthentication plugin not available:', error);
      return null;
    }
  }

  return FirebaseAuthentication;
};

/**
 * Native Google Sign-In for iOS
 */
export const nativeGoogleSignIn = async () => {
  try {
    const FirebaseAuth = await getFirebaseAuth();
    if (!FirebaseAuth) {
      return { success: false, error: 'Native auth not available' };
    }

    // Use Capacitor Firebase plugin for native sign-in
    const result = await FirebaseAuth.signInWithGoogle();

    if (result.credential) {
      // Create Firebase credential from native result
      const credential = GoogleAuthProvider.credential(
        result.credential.idToken,
        result.credential.accessToken
      );

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      return { success: true, user: userCredential.user };
    }

    return { success: false, error: 'No credential returned' };
  } catch (error: any) {
    console.error('Native Google sign-in error:', error);
    return { success: false, error: error.message || 'Google sign-in failed' };
  }
};

/**
 * Native Apple Sign-In for iOS
 */
export const nativeAppleSignIn = async () => {
  try {
    const FirebaseAuth = await getFirebaseAuth();
    if (!FirebaseAuth) {
      return { success: false, error: 'Native auth not available' };
    }

    const result = await FirebaseAuth.signInWithApple();

    if (result.credential) {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: result.credential.idToken!,
        rawNonce: result.credential.nonce
      });

      const userCredential = await signInWithCredential(auth, credential);
      return { success: true, user: userCredential.user };
    }

    return { success: false, error: 'No credential returned' };
  } catch (error: any) {
    console.error('Native Apple sign-in error:', error);
    return { success: false, error: error.message || 'Apple sign-in failed' };
  }
};

/**
 * Native Email/Password Sign-In
 * This works the same on web and native, but we wrap it for consistency
 */
export const nativeEmailSignIn = async (email: string, password: string) => {
  try {
    if (isNativePlatform()) {
      const FirebaseAuth = await getFirebaseAuth();
      if (FirebaseAuth) {
        // Use Capacitor plugin
        const result = await FirebaseAuth.signInWithEmailAndPassword({
          email,
          password
        });
        return { success: true, user: result.user };
      }
    }

    // Fallback to web SDK
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    return { success: false, error: error.message || 'Sign-in failed' };
  }
};

/**
 * Native Email/Password Registration
 */
export const nativeEmailRegister = async (email: string, password: string) => {
  try {
    if (isNativePlatform()) {
      const FirebaseAuth = await getFirebaseAuth();
      if (FirebaseAuth) {
        // Use Capacitor plugin
        const result = await FirebaseAuth.createUserWithEmailAndPassword({
          email,
          password
        });
        return { success: true, user: result.user };
      }
    }

    // Fallback to web SDK
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('Email registration error:', error);
    return { success: false, error: error.message || 'Registration failed' };
  }
};

/**
 * Native Sign-Out
 */
export const nativeSignOut = async () => {
  try {
    if (isNativePlatform()) {
      const FirebaseAuth = await getFirebaseAuth();
      if (FirebaseAuth) {
        await FirebaseAuth.signOut();
      }
    }
    // Always sign out from web SDK too
    await auth.signOut();
    return { success: true };
  } catch (error: any) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current native user
 */
export const getCurrentNativeUser = async () => {
  try {
    const FirebaseAuth = await getFirebaseAuth();
    if (!FirebaseAuth) return null;

    const result = await FirebaseAuth.getCurrentUser();
    return result.user;
  } catch (error) {
    return null;
  }
};
