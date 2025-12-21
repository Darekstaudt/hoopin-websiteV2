/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" and click "Web" (</>) to add a web app
 * 5. Copy your configuration values and paste them below
 * 6. Enable Realtime Database in Firebase Console
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX7gvsZSzq49BNh_udmHCduKvsOT-egsY",
  authDomain: "hoopin-websitev2.firebaseapp.com",
  databaseURL: "https://hoopin-websitev2-default-rtdb.firebaseio.com",
  projectId: "hoopin-websitev2",
  storageBucket: "hoopin-websitev2.firebasestorage.app",
  messagingSenderId: "89332027026",
  appId: "1:89332027026:web:2debdf61bb533dd1e9a04b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase
let firebaseInitialized = false;
let database = null;

function initializeFirebase() {
  try {
    if (!firebaseInitialized && typeof firebase !== 'undefined') {
      // Check if config is still using placeholders
      if (firebaseConfig.apiKey.includes('PASTE_YOUR')) {
        console.warn('⚠️ Firebase not configured. Using local storage only.');
        console.warn('📝 Please update firebase-config.js with your Firebase credentials.');
        return false;
      }

      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      firebaseInitialized = true;
      console.log('✅ Firebase initialized successfully');
      return true;
    }
    return firebaseInitialized;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

// Get Firebase database reference
function getDatabase() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return database;
}

// Check if Firebase is available and configured
function isFirebaseAvailable() {
  return firebaseInitialized && database !== null;
}
