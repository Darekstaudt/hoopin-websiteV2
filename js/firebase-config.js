/**
 * Firebase Configuration - Complete & Working
 */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX7gvsZSzq49BNh_udmHCduKvsOT-egsY",
  authDomain: "hoopin-websitev2.firebaseapp.com",
  databaseURL: "https://hoopin-websitev2-default-rtdb.firebaseio.com",
  projectId: "hoopin-websitev2",
  storageBucket:  "hoopin-websitev2.firebasestorage.app",
  messagingSenderId: "89332027026",
  appId: "1:89332027026:web:2debdf61bb533dd1e9a04b"
};

// Initialize Firebase (using compat version)
let firebaseInitialized = false;
let database = null;

try {
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  firebaseInitialized = true;
  
  // Enable offline persistence
  database.goOffline();
  database.goOnline();
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Connection monitoring
if (database) {
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
  
  // Expose isOnline status
  window.isOnline = () => isOnline;
}

// Expose ALL necessary functions and objects globally
window.db = database;
window.firebase = firebase;
window.firebaseConfig = firebaseConfig;

// Function wrappers for compatibility
window.getDatabase = function() {
  return database;
};

window.isFirebaseAvailable = function() {
  return firebaseInitialized && database !== null;
};

window.initializeFirebase = function() {
  return firebaseInitialized;
};

// Database helper functions
window.dbRef = function(path) {
  if (!database) {
    console.error('Firebase database not initialized');
    return null;
  }
  return database.ref(path);
};

window.dbSet = async function(path, data) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  return database.ref(path).set(data);
};

window.dbGet = async function(path) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  const snapshot = await database.ref(path).once('value');
  return snapshot.val();
};

window.dbUpdate = async function(path, data) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  return database.ref(path).update(data);
};

window.dbPush = function(path, data) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  return database. ref(path).push(data);
};

window.dbRemove = async function(path) {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  return database.ref(path).remove();
};

console.log('🔥 Firebase fully configured and ready');
console.log('📊 Database available:', window.isFirebaseAvailable());
