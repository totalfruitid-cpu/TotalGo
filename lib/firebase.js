// lib/firebase.js - VERSI AUTH SULTAN
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

let app;
let db;
let auth;

// Cuma jalan di browser biar gak error 'app'
if (typeof window!== "undefined") {
  app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };