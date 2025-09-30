
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyRmnco3OXCJhz7oqsyDVvtS9c3eYKWK4",
  authDomain: "vistoria-de-cana.firebaseapp.com",
  projectId: "vistoria-de-cana",
  storageBucket: "vistoria-de-cana.firebasestorage.app",
  messagingSenderId: "749613907959",
  appId: "1:749613907959:web:7ba40acb787fbd9096f8f2",
  measurementId: "G-9K1RH3326B"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
