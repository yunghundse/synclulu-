/**
 * Setup Eternal Founder Script
 *
 * Run this once to set your account as Eternal Founder
 * Usage: npx ts-node scripts/setupEternalFounder.ts
 *
 * Or use the function in your app's admin panel
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER UID - REPLACE WITH YOUR FIREBASE AUTH UID
// ═══════════════════════════════════════════════════════════════════════════

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL DATE (2099-12-31)
// ═══════════════════════════════════════════════════════════════════════════

const ETERNAL_DATE = new Date('2099-12-31T23:59:59.000Z');

// ═══════════════════════════════════════════════════════════════════════════
// SETUP FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function setupEternalFounder() {
  console.log('🚀 Starting Eternal Founder Setup...');
  console.log(`📍 Founder UID: ${FOUNDER_UID}`);

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Update user document
    const userRef = doc(db, 'users', FOUNDER_UID);

    await updateDoc(userRef, {
      // Role
      role: 'founder',
      isFounder: true,

      // Premium Status
      isPremium: true,
      premiumUntil: ETERNAL_DATE,

      // Subscription
      subscription: 'nebula_active',
      subscriptionEnd: ETERNAL_DATE,
      subscriptionStatus: 'eternal',

      // Tier Features
      tier: 'SOVEREIGN',
      starRadius: 100000,        // 100 km
      voiceCloudLimit: 999,      // Unlimited
      dailyStarsLimit: 999999,   // Infinite
      audioBitrate: 256,         // Crystal Audio

      // Premium Features
      canGhostMode: true,
      canInvisibleMode: true,

      // Metadata
      founderSince: serverTimestamp(),
      eternalPremiumSetAt: serverTimestamp()
    });

    console.log('✅ Eternal Founder Setup Complete!');
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  👑 SOVEREIGN STATUS ACTIVATED                    ║');
    console.log('║                                                   ║');
    console.log('║  • Role: founder                                  ║');
    console.log('║  • Premium Until: 2099-12-31                      ║');
    console.log('║  • Star Radius: 100 km                            ║');
    console.log('║  • Daily Stars: ∞ (Infinite)                      ║');
    console.log('║  • Audio Quality: 256 kbps (Crystal)              ║');
    console.log('║  • Ghost Mode: Enabled                            ║');
    console.log('║                                                   ║');
    console.log('║  Du stehst über dem System.                       ║');
    console.log('╚═══════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('❌ Error setting up Eternal Founder:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  setupEternalFounder();
}

export { setupEternalFounder, FOUNDER_UID, ETERNAL_DATE };
