import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCcy623MutRjfqkNl4a-XJVJkhDuy-orFs",
  authDomain: "totalgo-3c5d7.firebaseapp.com",
  projectId: "totalgo-3c5d7",
  storageBucket: "totalgo-3c5d7.firebasestorage.app",
  messagingSenderId: "134463276576",
  appId: "1:134463276576:web:8bce0edf6fbdbf040d1e45"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);