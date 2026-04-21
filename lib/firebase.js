// lib/firebase.js - VERSI ANTI BLUNDER
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCcy623MutRjfqkNl4a-XJVJkhDuy-orFs",
  authDomain: "totalgo-3c5d7.firebaseapp.com",
  projectId: "totalgo-3c5d7",
  storageBucket: "totalgo-3c5d7.appspot.com", // TADI SALAH.firebasestorage.app
  messagingSenderId: "134463276576",
  appId: "1:134463276576:web:8bce0edf6fbdbf040d1e45"
};

// Cegah init 2x. Ini yg bikin error 'app' undefined di Next.js
const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);