// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyRmnco3OXCJhz7oqsyDVvtS9c3eYKWK4",
  authDomain: "vistoria-de-cana.firebaseapp.com",
  projectId: "vistoria-de-cana",
  storageBucket: "vistoria-de-cana.appspot.com",
  messagingSenderId: "749613907959",
  appId: "1:749613907959:web:7ba40acb787fbd9096f8f2",
  measurementId: "G-9K1RH3326B"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

const db = getFirestore(app);

export { app, analytics, db };
