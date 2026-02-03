/**
 * Script to disable maintenance mode in Firestore
 * Run with: npx ts-node scripts/disable-maintenance.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function disableMaintenance() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    await updateDoc(doc(db, 'system', 'config'), {
      maintenanceMode: false,
    });
    console.log('✅ Maintenance mode disabled!');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

disableMaintenance();
