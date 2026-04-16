// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDcsW7g06Ai6sW3tNBYK_JMHZUvkBtuds",
  authDomain: "totalgo-97540.firebaseapp.com",
  projectId: "totalgo-97540",
  storageBucket: "totalgo-97540.firebasestorage.app",
  messagingSenderId: "442237410136",
  appId: "1:442237410136:web:a550614b10ff6408c0632d",
  measurementId: "G-WE05RRFK95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);