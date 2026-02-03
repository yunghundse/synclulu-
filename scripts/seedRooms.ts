// Script to seed test rooms in Firebase
// Run with: npx ts-node scripts/seedRooms.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtTdz-7_K1pEJpnbKWJGxTPBB02QOvYGI",
  authDomain: "delulu-3cf64.firebaseapp.com",
  projectId: "delulu-3cf64",
  storageBucket: "delulu-3cf64.firebasestorage.app",
  messagingSenderId: "867634655270",
  appId: "1:867634655270:web:a9c5aebdc7cce6a79e0a4b",
  measurementId: "G-LCYD0FC9BQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testRooms = [
  {
    name: 'Café-Ecke',
    type: 'public',
    isAnonymous: false,
    participants: [],
    maxParticipants: 8,
    xpMultiplier: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    createdBy: 'system',
  },
  {
    name: 'Nachteulen-Treff',
    type: 'public',
    isAnonymous: false,
    participants: [],
    maxParticipants: 8,
    xpMultiplier: 1.5,
    isActive: true,
    createdAt: Timestamp.now(),
    createdBy: 'system',
  },
  {
    name: 'Anonyme Wanderer',
    type: 'public',
    isAnonymous: true,
    participants: [],
    maxParticipants: 8,
    xpMultiplier: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    createdBy: 'system',
  },
  {
    name: 'Gaming-Lounge',
    type: 'public',
    isAnonymous: false,
    participants: [],
    maxParticipants: 12,
    xpMultiplier: 2,
    isActive: true,
    createdAt: Timestamp.now(),
    createdBy: 'system',
  },
];

async function seedRooms() {
  console.log('Seeding test rooms...');

  for (const room of testRooms) {
    try {
      const docRef = await addDoc(collection(db, 'rooms'), room);
      console.log(`Created room "${room.name}" with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error creating room "${room.name}":`, error);
    }
  }

  console.log('Done seeding rooms!');
  process.exit(0);
}

seedRooms();
