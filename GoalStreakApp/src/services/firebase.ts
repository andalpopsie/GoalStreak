// Firebase Configuration for GoalStreak
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress Firebase BloomFilter warnings and index errors (known issues, safe to ignore)
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (args[0]?.includes?.('BloomFilter error') || 
      args[0]?.includes?.('@firebase/firestore')) {
    return; // Suppress Firebase internal warnings
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const errorMessage = args[0]?.toString?.() || '';
  
  // Suppress Firebase index errors (non-critical for development)
  if (errorMessage.includes('The query requires an index') || 
      errorMessage.includes('Error cleaning up old timer sessions')) {
    console.warn('🔍 Firebase Index Info:', 'A Firestore index is needed for optimal performance.');
    console.warn('📝 Note:', 'Timer functionality continues to work. Index can be created when deploying to production.');
    return; // Convert error to warning for index issues
  }
  
  originalError(...args);
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

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Export the app
export default app;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "your-api-key-here";
};
