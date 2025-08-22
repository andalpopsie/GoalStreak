// Firebase Configuration for GoalStreak
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress Firebase BloomFilter warnings (known issue, safe to ignore)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('BloomFilter error') || 
      args[0]?.includes?.('@firebase/firestore')) {
    return; // Suppress Firebase internal warnings
  }
  originalWarn(...args);
};

// Firebase config - Production configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvIcGr7R1NB8hT7jZ3M5771w5anY1KMtU",
  authDomain: "goalstreak-app2.firebaseapp.com",
  projectId: "goalstreak-app2",
  storageBucket: "goalstreak-app2.firebasestorage.app",
  messagingSenderId: "233571046472",
  appId: "1:233571046472:web:020727b78eec425fd0347d",
  measurementId: "G-Y482L51QEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Export auth
export { auth };

// Export the app
export default app;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "your-api-key-here";
};
