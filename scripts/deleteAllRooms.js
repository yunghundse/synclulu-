// Script to delete all rooms from Firebase
// Run with: node scripts/deleteAllRooms.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function deleteAllRooms() {
  console.log('Fetching all rooms...');

  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);

  console.log(`Found ${snapshot.size} rooms to delete`);

  let deleted = 0;
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    deleted++;
    console.log(`Deleted room: ${doc.id}`);
  }

  console.log(`\n✅ Successfully deleted ${deleted} rooms!`);
  process.exit(0);
}

deleteAllRooms().catch((error) => {
  console.error('Error deleting rooms:', error);
  process.exit(1);
});
