/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Enable Realtime Database
 * 4. Copy your config values here
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
let firebaseApp;
let database;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('📱 App will work in offline mode only');
}

// Export for use in other modules
window.firebaseDB = database;
window.firebaseApp = firebaseApp;
