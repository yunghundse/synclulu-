import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCffarAiFnuo6YJrkjJRslU1mhKigHcBdQ",
  authDomain: "synclulu-4e6c0.firebaseapp.com",
  projectId: "synclulu-4e6c0",
  storageBucket: "synclulu-4e6c0.firebasestorage.app",
  messagingSenderId: "569653412196",
  appId: "1:569653412196:web:8b8cfb2fb650f703717a71",
  measurementId: "G-PFT3BVCTZ6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
