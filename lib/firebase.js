// lib/firebase.js - VERSI SULTAN + EXPORT APP
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCcy623MutRjfqkNl4a-XJVJkhDuy-orFs",
  authDomain: "totalgo-3c5d7.firebaseapp.com",
  projectId: "totalgo-3c5d7",
  storageBucket: "totalgo-3c5d7.appspot.com",
  messagingSenderId: "134463276576",
  appId: "1:134463276576:web:8bce0edf6fbdbf040d1e45"
};

// Biar gak double init pas hot reload
const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; // TAMBAHIN app DISINI
