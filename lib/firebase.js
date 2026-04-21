// firebase.js
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore" // <-- INI YG KURANG

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcy623MutRjfqkNl4a-XJVJkhDuy-orFs",
  authDomain: "totalgo-3c5d7.firebaseapp.com",
  projectId: "totalgo-3c5d7",
  storageBucket: "totalgo-3c5d7.firebasestorage.app",
  messagingSenderId: "134463276576",
  appId: "1:134463276576:web:8bce0edf6fbdbf040d1e45"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app) // <-- INI JUGA KURANG