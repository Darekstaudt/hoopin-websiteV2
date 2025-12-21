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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX7gvsZSzq49BNh_udmHCduKvsOT-egsY",
  authDomain:  "hoopin-websitev2.firebaseapp.com",
  databaseURL: "https://hoopin-websitev2-default-rtdb.firebaseio.com",
  projectId: "hoopin-websitev2",
  storageBucket: "hoopin-websitev2.firebasestorage.app",
  messagingSenderId: "89332027026",
  appId: "1:89332027026:web:2debdf61bb533dd1e9a04b"
};

// Initialize Firebase (using compat version loaded in HTML)
try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Get database reference
const database = firebase.database();

// Enable offline persistence
database.goOffline();
database.goOnline();

// Connection monitoring
const connectedRef = database.ref('.info/connected');
let isOnline = true;

connectedRef.on('value', (snap) => {
  isOnline = snap.val() === true;
  if (isOnline) {
    console.log('✅ Firebase connected');
  } else {
    console.log('⚠️ Offline mode');
  }
});

// Expose globally so HTML pages can access
window.db = database;
window.firebase = firebase;
window.isFirebaseAvailable = () => true;
window.isOnline = () => isOnline;

console.log('🔥 Firebase config loaded');
