import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDDcswG76A4i6sW3DtNBYK_bM",
  authDomain: "totalgo-97540.firebaseapp.com",
  projectId: "totalgo-97540",
  storageBucket: "totalgo-97540.firebasestorage.app",
  messagingSenderId: "442237410136",
  appId: "1:442237410136:web:a550614b10ffe408c0632d"
  // measurementId sengaja gak dipake biar gak error
}

const app =!getApps().length? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)