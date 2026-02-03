// Script to clear all room participants
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyExample123",
  authDomain: "delulu-app.firebaseapp.com",
  projectId: "delulu-app",
  storageBucket: "delulu-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearRooms() {
  const roomsRef = collection(db, 'rooms');
  const snapshot = await getDocs(roomsRef);
  
  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(db, 'rooms', docSnap.id), {
      participants: []
    });
    console.log('Cleared room:', docSnap.id);
  }
  
  console.log('All rooms cleared!');
  process.exit(0);
}

clearRooms().catch(console.error);
