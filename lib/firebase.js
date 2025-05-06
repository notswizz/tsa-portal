import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC1I_hYoiuc-IEMNwaSss41CD7jnaEpy7Q",
  authDomain: "the-smith-agency.firebaseapp.com",
  projectId: "the-smith-agency",
  storageBucket: "the-smith-agency.firebasestorage.app",
  messagingSenderId: "1048512215721",
  appId: "1:1048512215721:web:c092a7c008d61c4c7d47b8",
  measurementId: "G-QTTX3YDDMP"
};

// Initialize Firebase if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 