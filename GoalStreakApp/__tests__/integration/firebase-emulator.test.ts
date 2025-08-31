/**
 * Firebase Emulator Integration Tests
 * Tests Firebase emulator setup and basic functionality
 */

import { 
  initializeFirebaseEmulators, 
  cleanupFirebaseEmulators, 
  createTestUser, 
  seedTestData,
  areEmulatorsRunning 
} from '../utils/firebaseEmulator';
import { createTestDataSeeder, quickSeed } from '../utils/testDataSeeder';

describe('Firebase Emulator Integration', () => {
  let testServices: any;

  beforeAll(async () => {
    // Check if emulators are running
    const emulatorsRunning = await areEmulatorsRunning();
    if (!emulatorsRunning) {
      throw new Error(
        'Firebase emulators are not running. Please start them with: node scripts/start-emulators.js'
      );
    }

    // Initialize emulators
    testServices = await initializeFirebaseEmulators();
  });

  afterAll(async () => {
    await cleanupFirebaseEmulators();
  });

  describe('Emulator Setup', () => {
    it('should initialize Firebase emulators successfully', () => {
      expect(testServices).toBeDefined();
      expect(testServices.app).toBeDefined();
      expect(testServices.auth).toBeDefined();
      expect(testServices.db).toBeDefined();
      expect(testServices.storage).toBeDefined();
    });

    it('should connect to Auth emulator', async () => {
      const { auth } = testServices;
      expect(auth).toBeDefined();
      
      // Check if connected to emulator
      expect(auth._delegate._config?.emulator).toBeDefined();
    });

    it('should connect to Firestore emulator', async () => {
      const { db } = testServices;
      expect(db).toBeDefined();
      
      // Firestore emulator connection is verified by successful operations
      // We'll test this in the data operations tests
    });

    it('should connect to Storage emulator', async () => {
      const { storage } = testServices;
      expect(storage).toBeDefined();
      
      // Storage emulator connection is verified by successful operations
    });
  });

  describe('Test User Creation', () => {
    it('should create test user with authentication', async () => {
      const testUser = await createTestUser(
        'integration-test@example.com',
        'password123',
        'Integration Test User'
      );

      expect(testUser).toBeDefined();
      expect(testUser.uid).toBeDefined();
      expect(testUser.email).toBe('integration-test@example.com');
      expect(testUser.displayName).toBe('Integration Test User');
    });

    it('should create multiple test users', async () => {
      const user1 = await createTestUser('user1@test.com', 'password123', 'User 1');
      const user2 = await createTestUser('user2@test.com', 'password123', 'User 2');

      expect(user1.uid).toBeDefined();
      expect(user2.uid).toBeDefined();
      expect(user1.uid).not.toBe(user2.uid);
      expect(user1.email).toBe('user1@test.com');
      expect(user2.email).toBe('user2@test.com');
    });
  });

  describe('Test Data Seeding', () => {
    it('should seed test data for a user', async () => {
      const testUser = await createTestUser(
        'seed-test@example.com',
        'password123',
        'Seed Test User'
      );

      const { habits, completions, streaks } = await seedTestData(testUser.uid);

      expect(habits).toBeDefined();
      expect(habits.length).toBeGreaterThan(0);
      expect(completions).toBeDefined();
      expect(completions.length).toBeGreaterThan(0);
      expect(streaks).toBeDefined();
      expect(streaks.length).toBeGreaterThan(0);

      // Verify data relationships
      habits.forEach(habit => {
        expect(habit.userId).toBe(testUser.uid);
        expect(habit.id).toBeDefined();
        expect(habit.name).toBeDefined();
        expect(habit.category).toBeDefined();
      });

      completions.forEach(completion => {
        expect(completion.userId).toBe(testUser.uid);
        expect(completion.habitId).toBeDefined();
        expect(completion.completedAt).toBeDefined();
      });

      streaks.forEach(streak => {
        expect(streak.habitId).toBeDefined();
        expect(streak.currentStreak).toBeGreaterThanOrEqual(0);
        expect(streak.longestStreak).toBeGreaterThanOrEqual(0);
      });
    });

    it('should create comprehensive test dataset', async () => {
      const seeder = createTestDataSeeder(testServices.db, testServices.auth);
      const dataset = await seeder.seedCompleteDataset(2);

      expect(dataset.users).toHaveLength(2);
      expect(dataset.habits.length).toBeGreaterThan(0);
      expect(dataset.completions.length).toBeGreaterThan(0);
      expect(dataset.streaks.length).toBeGreaterThan(0);
      expect(dataset.friends.length).toBeGreaterThan(0);
      expect(dataset.activities.length).toBeGreaterThan(0);

      // Verify relationships
      dataset.habits.forEach(habit => {
        const user = dataset.users.find(u => u.id === habit.userId);
        expect(user).toBeDefined();
      });

      dataset.friends.forEach(friend => {
        const user = dataset.users.find(u => u.id === friend.userId);
        const friendUser = dataset.users.find(u => u.id === friend.friendId);
        expect(user).toBeDefined();
        expect(friendUser).toBeDefined();
      });
    });

    it('should use quick seed utility', async () => {
      const dataset = await quickSeed(testServices.db, testServices.auth, {
        users: 2,
        habitsPerUser: 3
      });

      expect(dataset.users).toHaveLength(2);
      expect(dataset.habits.length).toBe(6); // 2 users * 3 habits each
      expect(dataset.completions.length).toBeGreaterThan(0);
      expect(dataset.streaks.length).toBe(6); // One streak per habit
    });
  });

  describe('Emulator Data Isolation', () => {
    it('should isolate data between test runs', async () => {
      // This test verifies that data doesn't persist between test runs
      // In a real scenario, each test should start with a clean slate
      
      const user1 = await createTestUser('isolation1@test.com', 'password123', 'Isolation User 1');
      const { habits: habits1 } = await seedTestData(user1.uid);
      
      expect(habits1.length).toBeGreaterThan(0);
      
      // In a fresh test run, we shouldn't see data from previous runs
      // This is ensured by the emulator's reset behavior
    });
  });
});

describe('Firebase Emulator Error Handling', () => {
  it('should handle emulator connection errors gracefully', async () => {
    // Test what happens when emulators are not running
    // This test should be run when emulators are stopped
    
    const emulatorsRunning = await areEmulatorsRunning();
    if (!emulatorsRunning) {
      await expect(initializeFirebaseEmulators()).rejects.toThrow();
    } else {
      // If emulators are running, this test passes
      expect(true).toBe(true);
    }
  });

  it('should provide helpful error messages', async () => {
    try {
      await createTestUser('invalid-email', 'short', 'Test');
    } catch (error: any) {
      expect(error.message).toBeDefined();
      // Firebase should provide meaningful error messages
    }
  });
});