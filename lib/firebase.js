import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyD0CwB6D906Aidw9stN0Yk_JW42UvkBtuds",
  authDomain: "totalgo-97540.firebaseapp.com",
  projectId: "totalgo-97540",
  storageBucket: "totalgo-97540.firebasestorage.app",
  messagingSenderId: "442237410136",
  appId: "1:442237410136:web:a550614b10ff6408c0632d",
  measurementId: "G-WE05RRFK95"
}

const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
