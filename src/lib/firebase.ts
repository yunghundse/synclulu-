import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCMdQlzbrfXAVT6mB0tXuAUbj7-3QBOyLQ",
  authDomain: "butterbread-web.firebaseapp.com",
  projectId: "butterbread-web",
  storageBucket: "butterbread-web.firebasestorage.app",
  messagingSenderId: "1037775236421",
  appId: "1:1037775236421:web:d9525d697800c7ffc5e22c",
  measurementId: "G-TF57S4VYP9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
