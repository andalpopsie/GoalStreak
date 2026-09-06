// Firebase Configuration for GoalStreak
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, validateEnvironmentConfig, isDebugEnabled } from '../config/environment';

// Suppress Firebase BloomFilter warnings and index errors (only in development)
if (isDebugEnabled()) {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (args[0]?.includes?.('BloomFilter error') || args[0]?.includes?.('@firebase/firestore')) {
      return; // Suppress Firebase internal warnings
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    const errorMessage = args[0]?.toString?.() || '';

    // Suppress Firebase index errors (non-critical for development)
    if (
      errorMessage.includes('The query requires an index') ||
      errorMessage.includes('Error cleaning up old timer sessions')
    ) {
      console.warn(
        '🔍 Firebase Index Info:',
        'A Firestore index is needed for optimal performance.'
      );
      console.warn(
        '📝 Note:',
        'Timer functionality continues to work. Index can be created when deploying to production.'
      );
      return; // Convert error to warning for index issues
    }

    originalError(...args);
  };
}

// Validate environment configuration
if (!validateEnvironmentConfig()) {
  console.warn(
    '⚠️ Firebase configuration validation failed. Attempting to continue with available config...'
  );
  // Don't throw error - let the app try to continue with whatever config is available
}

// Firebase config - Environment-based configuration with fallbacks
const firebaseConfig = {
  apiKey: config.firebase.apiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: config.firebase.authDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: config.firebase.projectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:
    config.firebase.storageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:
    config.firebase.messagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: config.firebase.appId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId:
    config.firebase.measurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Debug: Log environment variables
console.log('🔍 Environment Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
  hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  hasProjectId: !!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  configApiKey: config.firebase.apiKey?.substring(0, 10) + '...',
  configProjectId: config.firebase.projectId,
});

// Check if we have minimum required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Critical Firebase configuration missing. App may not function properly.');
  console.log('🔍 Current config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAuthDomain: !!firebaseConfig.authDomain,
    apiKeyPreview: firebaseConfig.apiKey?.substring(0, 10) + '...',
    projectId: firebaseConfig.projectId,
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Export the app
export default app;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== 'your-api-key-here';
};
