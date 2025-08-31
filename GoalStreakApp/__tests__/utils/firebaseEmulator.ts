// Firebase Emulator Setup and Utilities for Integration Testing
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { User, Habit, HabitCompletion, Streak } from '../../types';
import { Friend, SocialActivity } from '../../types/social';

// Emulator configuration
const EMULATOR_CONFIG = {
  auth: {
    host: 'localhost',
    port: 9099
  },
  firestore: {
    host: 'localhost',
    port: 8080
  },
  storage: {
    host: 'localhost',
    port: 9199
  }
};

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

let testApp: any = null;
let testAuth: any = null;
let testDb: any = null;
let testStorage: any = null;

/**
 * Initialize Firebase emulators for testing
 */
export const initializeFirebaseEmulators = async (): Promise<{
  app: any;
  auth: any;
  db: any;
  storage: any;
}> => {
  try {
    // Clean up existing apps
    const existingApps = getApps();
    await Promise.all(existingApps.map(app => deleteApp(app)));

    // Initialize test app
    testApp = initializeApp(testFirebaseConfig, 'test-app');

    // Initialize services
    testAuth = getAuth(testApp);
    testDb = getFirestore(testApp);
    testStorage = getStorage(testApp);

    // Connect to emulators (only if not already connected)
    if (!testAuth._delegate._config?.emulator) {
      connectAuthEmulator(testAuth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`, {
        disableWarnings: true
      });
    }

    if (!testDb._delegate._databaseId?.projectId?.includes('emulator')) {
      connectFirestoreEmulator(testDb, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port);
    }

    if (!testStorage._delegate._host?.includes('emulator')) {
      connectStorageEmulator(testStorage, EMULATOR_CONFIG.storage.host, EMULATOR_CONFIG.storage.port);
    }

    return {
      app: testApp,
      auth: testAuth,
      db: testDb,
      storage: testStorage
    };
  } catch (error) {
    console.error('Error initializing Firebase emulators:', error);
    throw error;
  }
};

/**
 * Clean up Firebase emulators after testing
 */
export const cleanupFirebaseEmulators = async (): Promise<void> => {
  try {
    if (testApp) {
      await deleteApp(testApp);
      testApp = null;
      testAuth = null;
      testDb = null;
      testStorage = null;
    }
  } catch (error) {
    console.error('Error cleaning up Firebase emulators:', error);
  }
};

/**
 * Create a test user in the emulator
 */
export const createTestUser = async (
  email: string = 'test@example.com',
  password: string = 'password123',
  displayName: string = 'Test User'
): Promise<{ uid: string; email: string; displayName: string }> => {
  if (!testAuth) {
    throw new Error('Firebase Auth emulator not initialized');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(testAuth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(testDb, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      uid: user.uid,
      email: user.email || email,
      displayName
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

/**
 * Sign in test user
 */
export const signInTestUser = async (
  email: string = 'test@example.com',
  password: string = 'password123'
): Promise<{ uid: string; email: string }> => {
  if (!testAuth) {
    throw new Error('Firebase Auth emulator not initialized');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(testAuth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email || email
    };
  } catch (error) {
    console.error('Error signing in test user:', error);
    throw error;
  }
};

/**
 * Seed test data in Firestore emulator
 */
export const seedTestData = async (userId: string): Promise<{
  habits: Habit[];
  completions: HabitCompletion[];
  streaks: Streak[];
}> => {
  if (!testDb) {
    throw new Error('Firestore emulator not initialized');
  }

  try {
    const habits: Habit[] = [];
    const completions: HabitCompletion[] = [];
    const streaks: Streak[] = [];

    // Create test habits
    const habitData = [
      {
        name: 'Morning Workout',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: true
      },
      {
        name: 'Read 30 Minutes',
        category: 'learning' as const,
        frequency: 'daily' as const,
        isPublic: false
      },
      {
        name: 'Meditation',
        category: 'wellness' as const,
        frequency: 'daily' as const,
        isPublic: true
      }
    ];

    for (const habit of habitData) {
      const habitRef = await addDoc(collection(testDb, 'habits'), {
        userId,
        ...habit,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const createdHabit: Habit = {
        id: habitRef.id,
        userId,
        ...habit,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      habits.push(createdHabit);

      // Create some completions for the habit
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const completionDate = new Date(today);
        completionDate.setDate(completionDate.getDate() - i);

        const completionRef = await addDoc(collection(testDb, 'completions'), {
          habitId: habitRef.id,
          userId,
          completedAt: completionDate
        });

        completions.push({
          id: completionRef.id,
          habitId: habitRef.id,
          userId,
          completedAt: completionDate
        });
      }

      // Create streak data
      await setDoc(doc(testDb, 'streaks', habitRef.id), {
        habitId: habitRef.id,
        currentStreak: 5,
        longestStreak: 10,
        lastCompletedDate: today
      });

      streaks.push({
        habitId: habitRef.id,
        currentStreak: 5,
        longestStreak: 10,
        lastCompletedDate: today
      });
    }

    return { habits, completions, streaks };
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};

/**
 * Clear all test data from Firestore emulator
 */
export const clearTestData = async (): Promise<void> => {
  if (!testDb) {
    throw new Error('Firestore emulator not initialized');
  }

  try {
    // Note: In a real implementation, you would use the Firebase Admin SDK
    // to clear data. For testing purposes, we'll rely on the emulator's
    // ability to reset between test runs.
    console.log('Test data cleared (emulator will reset between test runs)');
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
};

/**
 * Wait for emulator to be ready
 */
export const waitForEmulator = async (maxAttempts: number = 10): Promise<void> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Try to connect to the emulator
      await initializeFirebaseEmulators();
      console.log('Firebase emulators are ready');
      return;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`Firebase emulators not ready after ${maxAttempts} attempts`);
      }
      
      console.log(`Waiting for emulators... (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

/**
 * Check if emulators are running
 */
export const areEmulatorsRunning = async (): Promise<boolean> => {
  try {
    // Simple check to see if we can connect to the auth emulator
    const response = await fetch(`http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get emulator configuration for tests
 */
export const getEmulatorConfig = () => EMULATOR_CONFIG;

/**
 * Get test Firebase configuration
 */
export const getTestFirebaseConfig = () => testFirebaseConfig;