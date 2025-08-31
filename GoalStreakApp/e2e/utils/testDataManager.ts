/**
 * E2E Test Data Management
 * Handles test data setup, seeding, and cleanup for end-to-end tests
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser,
  User
} from 'firebase/auth';

// Test Firebase configuration (should use test environment)
const testFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for testing
const testApp = initializeApp(testFirebaseConfig, 'e2e-test');
const testDb = getFirestore(testApp);
const testAuth = getAuth(testApp);

// Test user data
export interface TestUser {
  uid: string;
  email: string;
  password: string;
  displayName: string;
}

export interface TestHabit {
  id: string;
  userId: string;
  name: string;
  category: string;
  frequency: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface TestFriendship {
  id: string;
  userId: string;
  friendId: string;
  friendEmail: string;
  friendName: string;
  status: string;
  createdAt: Date;
}

// Test data storage
let testUsers: TestUser[] = [];
let testHabits: TestHabit[] = [];
let testFriendships: TestFriendship[] = [];

/**
 * Create a test user account
 */
export const createTestUser = async (
  email?: string,
  password: string = 'TestPassword123!',
  displayName?: string
): Promise<TestUser> => {
  const timestamp = Date.now();
  const testEmail = email || `e2etest${timestamp}@example.com`;
  const testDisplayName = displayName || `Test User ${timestamp}`;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      testAuth,
      testEmail,
      password
    );
    
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(testDb, 'users', user.uid), {
      email: testEmail,
      displayName: testDisplayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create user profile document
    await setDoc(doc(testDb, 'userProfiles', user.uid), {
      displayName: testDisplayName,
      email: testEmail,
      profilePicture: null,
      createdAt: new Date(),
    });
    
    const testUser: TestUser = {
      uid: user.uid,
      email: testEmail,
      password,
      displayName: testDisplayName,
    };
    
    testUsers.push(testUser);
    return testUser;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

/**
 * Sign in a test user
 */
export const signInTestUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(testAuth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in test user:', error);
    throw error;
  }
};

/**
 * Create test habits for a user
 */
export const createTestHabits = async (
  userId: string,
  count: number = 3
): Promise<TestHabit[]> => {
  const habits: TestHabit[] = [];
  const categories = ['fitness', 'wellness', 'productivity', 'mindfulness', 'learning'];
  const frequencies = ['daily', 'weekly'];
  
  for (let i = 0; i < count; i++) {
    const habitId = `test_habit_${userId}_${i}_${Date.now()}`;
    const habit: TestHabit = {
      id: habitId,
      userId,
      name: `Test Habit ${i + 1}`,
      category: categories[i % categories.length],
      frequency: frequencies[i % frequencies.length],
      isPublic: i % 2 === 0, // Alternate between public and private
      createdAt: new Date(),
    };
    
    await setDoc(doc(testDb, 'habits', habitId), {
      ...habit,
      updatedAt: new Date(),
    });
    
    habits.push(habit);
    testHabits.push(habit);
  }
  
  return habits;
};

/**
 * Create test friendship between two users
 */
export const createTestFriendship = async (
  user1: TestUser,
  user2: TestUser
): Promise<TestFriendship> => {
  const friendshipId = `${user1.uid}_${user2.uid}`;
  const reverseFriendshipId = `${user2.uid}_${user1.uid}`;
  
  const friendship: TestFriendship = {
    id: friendshipId,
    userId: user1.uid,
    friendId: user2.uid,
    friendEmail: user2.email,
    friendName: user2.displayName,
    status: 'accepted',
    createdAt: new Date(),
  };
  
  const reverseFriendship: TestFriendship = {
    id: reverseFriendshipId,
    userId: user2.uid,
    friendId: user1.uid,
    friendEmail: user1.email,
    friendName: user1.displayName,
    status: 'accepted',
    createdAt: new Date(),
  };
  
  // Create bidirectional friendship
  await setDoc(doc(testDb, 'friends', friendshipId), friendship);
  await setDoc(doc(testDb, 'friends', reverseFriendshipId), reverseFriendship);
  
  testFriendships.push(friendship, reverseFriendship);
  return friendship;
};

/**
 * Create test activity for social feed
 */
export const createTestActivity = async (
  userId: string,
  habitId: string,
  habitName: string,
  habitCategory: string
) => {
  const activityId = `test_activity_${userId}_${habitId}_${Date.now()}`;
  
  await setDoc(doc(testDb, 'activities', activityId), {
    id: activityId,
    userId,
    userName: 'Test User',
    type: 'habit_completed',
    habitId,
    habitName,
    habitCategory,
    timestamp: new Date(),
    reactions: {
      heart: 0,
      fire: 0,
      medal: 0,
    },
  });
};

/**
 * Create test completion for a habit
 */
export const createTestCompletion = async (
  userId: string,
  habitId: string,
  completedAt?: Date
) => {
  const completionId = `test_completion_${userId}_${habitId}_${Date.now()}`;
  const completionDate = completedAt || new Date();
  
  await setDoc(doc(testDb, 'completions', completionId), {
    id: completionId,
    userId,
    habitId,
    completedAt: completionDate,
    createdAt: completionDate,
  });
  
  // Update or create streak
  const streakId = habitId;
  await setDoc(doc(testDb, 'streaks', streakId), {
    habitId,
    userId,
    currentStreak: 1,
    longestStreak: 1,
    lastCompletedDate: completionDate,
    updatedAt: completionDate,
  });
};

/**
 * Setup comprehensive test scenario
 */
export const setupTestScenario = async () => {
  console.log('Setting up E2E test scenario...');
  
  // Create test users
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  
  // Create habits for user1
  const user1Habits = await createTestHabits(user1.uid, 3);
  
  // Create habits for user2
  const user2Habits = await createTestHabits(user2.uid, 2);
  
  // Create friendship
  await createTestFriendship(user1, user2);
  
  // Create some completions and activities
  for (const habit of user1Habits.slice(0, 2)) {
    await createTestCompletion(user1.uid, habit.id);
    await createTestActivity(user1.uid, habit.id, habit.name, habit.category);
  }
  
  console.log('Test scenario setup complete');
  
  return {
    users: [user1, user2],
    habits: [...user1Habits, ...user2Habits],
  };
};

/**
 * Clean up all test data
 */
export const cleanupTestData = async () => {
  console.log('Cleaning up E2E test data...');
  
  try {
    const batch = writeBatch(testDb);
    
    // Clean up habits
    for (const habit of testHabits) {
      batch.delete(doc(testDb, 'habits', habit.id));
    }
    
    // Clean up friendships
    for (const friendship of testFriendships) {
      batch.delete(doc(testDb, 'friends', friendship.id));
    }
    
    // Clean up user profiles and data
    for (const user of testUsers) {
      batch.delete(doc(testDb, 'users', user.uid));
      batch.delete(doc(testDb, 'userProfiles', user.uid));
      
      // Clean up user's completions
      const completionsQuery = query(
        collection(testDb, 'completions'),
        where('userId', '==', user.uid)
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      completionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Clean up user's streaks
      const streaksQuery = query(
        collection(testDb, 'streaks'),
        where('userId', '==', user.uid)
      );
      const streaksSnapshot = await getDocs(streaksQuery);
      streaksSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Clean up user's activities
      const activitiesQuery = query(
        collection(testDb, 'activities'),
        where('userId', '==', user.uid)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      activitiesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    // Execute batch delete
    await batch.commit();
    
    // Clean up authentication users (this might require admin SDK in real implementation)
    // For now, we'll just clear our local tracking
    testUsers = [];
    testHabits = [];
    testFriendships = [];
    
    console.log('Test data cleanup complete');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
};

/**
 * Reset test environment
 */
export const resetTestEnvironment = async () => {
  await cleanupTestData();
  // Additional reset logic can be added here
};

/**
 * Get current test users (for debugging)
 */
export const getTestUsers = (): TestUser[] => {
  return [...testUsers];
};

/**
 * Get current test habits (for debugging)
 */
export const getTestHabits = (): TestHabit[] => {
  return [...testHabits];
};

/**
 * Verify test data exists
 */
export const verifyTestDataExists = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDocs(
      query(collection(testDb, 'users'), where('__name__', '==', userId))
    );
    return !userDoc.empty;
  } catch (error) {
    console.error('Error verifying test data:', error);
    return false;
  }
};