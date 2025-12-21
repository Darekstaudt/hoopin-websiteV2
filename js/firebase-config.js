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

const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  databaseURL: "PASTE_YOUR_DATABASE_URL_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

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
