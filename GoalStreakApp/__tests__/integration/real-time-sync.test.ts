/**
 * Real-time Data Synchronization Integration Tests
 * Tests Firebase real-time updates, offline persistence, and conflict resolution
 */

import { 
  initializeFirebaseEmulators, 
  cleanupFirebaseEmulators, 
  createTestUser,
  areEmulatorsRunning 
} from '../utils/firebaseEmulator';
import { createTestDataSeeder } from '../utils/testDataSeeder';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  enableNetwork,
  disableNetwork,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

describe('Real-time Data Synchronization Integration Tests', () => {
  let testServices1: any; // First client
  let testServices2: any; // Second client (simulating different device)
  let testUser1: any;
  let testUser2: any;

  beforeAll(async () => {
    // Check if emulators are running
    const emulatorsRunning = await areEmulatorsRunning();
    if (!emulatorsRunning) {
      throw new Error(
        'Firebase emulators are not running. Please start them with: node scripts/start-emulators.js'
      );
    }

    // Initialize two separate Firebase instances to simulate different devices
    testServices1 = await initializeFirebaseEmulators();
    testServices2 = await initializeFirebaseEmulators();

    // Create test users
    testUser1 = await createTestUser('sync-user1@example.com', 'password123', 'Sync User 1');
    testUser2 = await createTestUser('sync-user2@example.com', 'password123', 'Sync User 2');

    // Sign in both users on their respective clients
    await signInWithEmailAndPassword(testServices1.auth, testUser1.email, 'password123');
    await signInWithEmailAndPassword(testServices2.auth, testUser2.email, 'password123');
  });

  afterAll(async () => {
    await cleanupFirebaseEmulators();
  });

  describe('Habit Completion Real-time Sync', () => {
    let habitId: string;

    beforeEach(async () => {
      // Create a test habit for user1
      const habitRef = await addDoc(collection(testServices1.db, 'habits'), {
        userId: testUser1.uid,
        name: 'Real-time Test Habit',
        category: 'fitness',
        frequency: 'daily',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      habitId = habitRef.id;
    });

    it('should sync habit completions across devices in real-time', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Real-time sync test timed out'));
        }, 10000);

        let completionReceived = false;

        // Set up listener on second client for completions
        const completionsQuery = query(
          collection(testServices2.db, 'completions'),
          where('habitId', '==', habitId),
          orderBy('completedAt', 'desc')
        );

        const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
          if (!snapshot.empty && !completionReceived) {
            completionReceived = true;
            const completion = snapshot.docs[0].data();
            
            try {
              expect(completion.habitId).toBe(habitId);
              expect(completion.userId).toBe(testUser1.uid);
              expect(completion.completedAt).toBeDefined();
              
              clearTimeout(timeout);
              unsubscribe();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        });

        // Create completion on first client after a short delay
        setTimeout(async () => {
          try {
            await addDoc(collection(testServices1.db, 'completions'), {
              habitId,
              userId: testUser1.uid,
              completedAt: new Date()
            });
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });

    it('should sync streak updates in real-time', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Streak sync test timed out'));
        }, 10000);

        let streakUpdated = false;

        // Set up listener on second client for streak updates
        const streakRef = doc(testServices2.db, 'streaks', habitId);
        
        const unsubscribe = onSnapshot(streakRef, (snapshot) => {
          if (snapshot.exists() && !streakUpdated) {
            streakUpdated = true;
            const streak = snapshot.data();
            
            try {
              expect(streak.habitId).toBe(habitId);
              expect(streak.currentStreak).toBe(1);
              expect(streak.longestStreak).toBeGreaterThanOrEqual(1);
              expect(streak.lastCompletedDate).toBeDefined();
              
              clearTimeout(timeout);
              unsubscribe();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        });

        // Update streak on first client
        setTimeout(async () => {
          try {
            await setDoc(doc(testServices1.db, 'streaks', habitId), {
              habitId,
              currentStreak: 1,
              longestStreak: 1,
              lastCompletedDate: new Date()
            });
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });

    it('should handle multiple rapid completions correctly', async () => {
      const completions: any[] = [];
      const expectedCompletions = 5;

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Multiple completions test timed out'));
        }, 15000);

        // Set up listener for all completions
        const completionsQuery = query(
          collection(testServices2.db, 'completions'),
          where('habitId', '==', habitId),
          orderBy('completedAt', 'desc')
        );

        const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
          completions.length = 0;
          snapshot.forEach(doc => {
            completions.push({ id: doc.id, ...doc.data() });
          });

          if (completions.length === expectedCompletions) {
            try {
              expect(completions).toHaveLength(expectedCompletions);
              
              // Verify all completions are for the correct habit and user
              completions.forEach(completion => {
                expect(completion.habitId).toBe(habitId);
                expect(completion.userId).toBe(testUser1.uid);
                expect(completion.completedAt).toBeDefined();
              });

              // Verify completions are in chronological order
              for (let i = 0; i < completions.length - 1; i++) {
                const current = completions[i].completedAt.toDate();
                const next = completions[i + 1].completedAt.toDate();
                expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
              }

              clearTimeout(timeout);
              unsubscribe();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        });

        // Create multiple completions rapidly
        setTimeout(async () => {
          try {
            const batch = writeBatch(testServices1.db);
            
            for (let i = 0; i < expectedCompletions; i++) {
              const completionRef = doc(collection(testServices1.db, 'completions'));
              batch.set(completionRef, {
                habitId,
                userId: testUser1.uid,
                completedAt: new Date(Date.now() + i * 1000) // Stagger by 1 second
              });
            }
            
            await batch.commit();
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });
  });

  describe('Friend Activity Real-time Updates', () => {
    let friendshipId: string;

    beforeEach(async () => {
      // Create friendship between users
      const friendshipRef = await addDoc(collection(testServices1.db, 'friends'), {
        userId: testUser1.uid,
        friendId: testUser2.uid,
        friendEmail: testUser2.email,
        friendName: testUser2.displayName,
        status: 'accepted',
        createdAt: new Date()
      });
      friendshipId = friendshipRef.id;

      // Reciprocal friendship
      await addDoc(collection(testServices2.db, 'friends'), {
        userId: testUser2.uid,
        friendId: testUser1.uid,
        friendEmail: testUser1.email,
        friendName: testUser1.displayName,
        status: 'accepted',
        createdAt: new Date()
      });
    });

    it('should sync friend activities in real-time', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Friend activity sync test timed out'));
        }, 10000);

        let activityReceived = false;

        // User2 listens for activities from User1
        const activitiesQuery = query(
          collection(testServices2.db, 'activities'),
          where('userId', '==', testUser1.uid),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
          if (!snapshot.empty && !activityReceived) {
            activityReceived = true;
            const activity = snapshot.docs[0].data();
            
            try {
              expect(activity.userId).toBe(testUser1.uid);
              expect(activity.userName).toBe(testUser1.displayName);
              expect(activity.type).toBe('habit_completed');
              expect(activity.habitName).toBe('Friend Activity Test Habit');
              expect(activity.visibility).toBe('friends');
              
              clearTimeout(timeout);
              unsubscribe();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        });

        // User1 creates an activity
        setTimeout(async () => {
          try {
            await addDoc(collection(testServices1.db, 'activities'), {
              userId: testUser1.uid,
              userName: testUser1.displayName,
              type: 'habit_completed',
              habitId: 'test-habit-id',
              habitName: 'Friend Activity Test Habit',
              habitCategory: 'fitness',
              visibility: 'friends',
              timestamp: new Date(),
              reactions: {
                heart: 0,
                fire: 0,
                medal: 0
              }
            });
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });

    it('should sync activity reactions in real-time', async () => {
      // First create an activity
      const activityRef = await addDoc(collection(testServices1.db, 'activities'), {
        userId: testUser1.uid,
        userName: testUser1.displayName,
        type: 'habit_completed',
        habitId: 'test-habit-id',
        habitName: 'Reaction Test Habit',
        habitCategory: 'wellness',
        visibility: 'friends',
        timestamp: new Date(),
        reactions: {
          heart: 0,
          fire: 0,
          medal: 0
        }
      });

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Reaction sync test timed out'));
        }, 10000);

        let reactionUpdated = false;

        // User1 listens for reaction updates on their activity
        const unsubscribe = onSnapshot(activityRef, (snapshot) => {
          if (snapshot.exists() && !reactionUpdated) {
            const activity = snapshot.data();
            
            if (activity.reactions.heart > 0) {
              reactionUpdated = true;
              
              try {
                expect(activity.reactions.heart).toBe(1);
                expect(activity.reactions.fire).toBe(0);
                expect(activity.reactions.medal).toBe(0);
                
                clearTimeout(timeout);
                unsubscribe();
                resolve();
              } catch (error) {
                clearTimeout(timeout);
                unsubscribe();
                reject(error);
              }
            }
          }
        });

        // User2 adds a reaction
        setTimeout(async () => {
          try {
            await updateDoc(activityRef, {
              'reactions.heart': 1
            });
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });
  });

  describe('Offline Data Persistence and Sync', () => {
    let habitId: string;

    beforeEach(async () => {
      // Create a test habit
      const habitRef = await addDoc(collection(testServices1.db, 'habits'), {
        userId: testUser1.uid,
        name: 'Offline Test Habit',
        category: 'productivity',
        frequency: 'daily',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      habitId = habitRef.id;
    });

    it('should persist data when offline and sync when back online', async () => {
      // Go offline
      await disableNetwork(testServices1.db);

      // Create completion while offline
      const offlineCompletionRef = await addDoc(collection(testServices1.db, 'completions'), {
        habitId,
        userId: testUser1.uid,
        completedAt: new Date()
      });

      // Verify data exists locally (from cache)
      const offlineDoc = await getDoc(offlineCompletionRef);
      expect(offlineDoc.exists()).toBe(true);
      expect(offlineDoc.metadata.fromCache).toBe(true);

      // Go back online
      await enableNetwork(testServices1.db);

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify data is now synced to server
      const onlineDoc = await getDoc(offlineCompletionRef);
      expect(onlineDoc.exists()).toBe(true);
      expect(onlineDoc.metadata.fromCache).toBe(false);

      // Verify data is visible from another client
      const remoteDoc = await getDoc(doc(testServices2.db, 'completions', offlineCompletionRef.id));
      expect(remoteDoc.exists()).toBe(true);
      
      const remoteData = remoteDoc.data();
      expect(remoteData?.habitId).toBe(habitId);
      expect(remoteData?.userId).toBe(testUser1.uid);
    });

    it('should handle offline updates and sync changes when reconnected', async () => {
      // Create initial completion
      const completionRef = await addDoc(collection(testServices1.db, 'completions'), {
        habitId,
        userId: testUser1.uid,
        completedAt: new Date(),
        notes: 'Initial completion'
      });

      // Go offline
      await disableNetwork(testServices1.db);

      // Update completion while offline
      await updateDoc(completionRef, {
        notes: 'Updated while offline',
        updatedAt: new Date()
      });

      // Verify local update
      const offlineDoc = await getDoc(completionRef);
      expect(offlineDoc.data()?.notes).toBe('Updated while offline');
      expect(offlineDoc.metadata.fromCache).toBe(true);

      // Go back online
      await enableNetwork(testServices1.db);

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify update is synced
      const syncedDoc = await getDoc(doc(testServices2.db, 'completions', completionRef.id));
      expect(syncedDoc.exists()).toBe(true);
      expect(syncedDoc.data()?.notes).toBe('Updated while offline');
    });
  });

  describe('Conflict Resolution', () => {
    let habitId: string;

    beforeEach(async () => {
      // Create a test habit
      const habitRef = await addDoc(collection(testServices1.db, 'habits'), {
        userId: testUser1.uid,
        name: 'Conflict Test Habit',
        category: 'wellness',
        frequency: 'daily',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      habitId = habitRef.id;
    });

    it('should handle concurrent updates with server timestamps', async () => {
      // Create initial document
      const docRef = await addDoc(collection(testServices1.db, 'activities'), {
        userId: testUser1.uid,
        userName: testUser1.displayName,
        type: 'habit_completed',
        habitId,
        habitName: 'Conflict Test Habit',
        habitCategory: 'wellness',
        visibility: 'public',
        timestamp: serverTimestamp(),
        reactions: {
          heart: 0,
          fire: 0,
          medal: 0
        },
        version: 1
      });

      // Wait for initial document to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate concurrent updates from two clients
      const update1Promise = updateDoc(doc(testServices1.db, 'activities', docRef.id), {
        'reactions.heart': 1,
        lastUpdatedBy: 'client1',
        timestamp: serverTimestamp(),
        version: 2
      });

      const update2Promise = updateDoc(doc(testServices2.db, 'activities', docRef.id), {
        'reactions.fire': 1,
        lastUpdatedBy: 'client2',
        timestamp: serverTimestamp(),
        version: 2
      });

      // Wait for both updates to complete
      await Promise.all([update1Promise, update2Promise]);

      // Wait for conflict resolution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check final state - last write should win
      const finalDoc = await getDoc(doc(testServices1.db, 'activities', docRef.id));
      const finalData = finalDoc.data();

      expect(finalData).toBeDefined();
      expect(finalData?.version).toBe(2);
      
      // One of the updates should have won (last write wins)
      const hasHeartReaction = finalData?.reactions.heart === 1;
      const hasFireReaction = finalData?.reactions.fire === 1;
      
      // At least one reaction should be present
      expect(hasHeartReaction || hasFireReaction).toBe(true);
    });

    it('should handle document creation conflicts', async () => {
      const documentId = 'conflict-test-doc';

      // Attempt to create the same document from two clients simultaneously
      const create1Promise = setDoc(doc(testServices1.db, 'completions', documentId), {
        habitId,
        userId: testUser1.uid,
        completedAt: new Date(),
        createdBy: 'client1',
        timestamp: serverTimestamp()
      });

      const create2Promise = setDoc(doc(testServices2.db, 'completions', documentId), {
        habitId,
        userId: testUser1.uid,
        completedAt: new Date(),
        createdBy: 'client2',
        timestamp: serverTimestamp()
      });

      // Both operations should succeed (setDoc overwrites)
      await Promise.all([create1Promise, create2Promise]);

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check final state
      const finalDoc = await getDoc(doc(testServices1.db, 'completions', documentId));
      expect(finalDoc.exists()).toBe(true);
      
      const finalData = finalDoc.data();
      expect(finalData?.habitId).toBe(habitId);
      expect(finalData?.userId).toBe(testUser1.uid);
      
      // One of the clients should have won
      expect(['client1', 'client2']).toContain(finalData?.createdBy);
    });
  });

  describe('Real-time Query Updates', () => {
    it('should update query results in real-time when documents are added', async () => {
      const receivedHabits: any[] = [];

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Query update test timed out'));
        }, 10000);

        // Set up real-time query listener
        const habitsQuery = query(
          collection(testServices2.db, 'habits'),
          where('userId', '==', testUser1.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(habitsQuery, (snapshot) => {
          receivedHabits.length = 0;
          snapshot.forEach(doc => {
            receivedHabits.push({ id: doc.id, ...doc.data() });
          });

          // We expect to see 3 habits after all are created
          if (receivedHabits.length === 3) {
            try {
              expect(receivedHabits).toHaveLength(3);
              
              // Verify all habits belong to the correct user
              receivedHabits.forEach(habit => {
                expect(habit.userId).toBe(testUser1.uid);
                expect(habit.name).toMatch(/Real-time Query Test Habit \d/);
              });

              // Verify habits are ordered by creation date (newest first)
              for (let i = 0; i < receivedHabits.length - 1; i++) {
                const current = receivedHabits[i].createdAt.toDate();
                const next = receivedHabits[i + 1].createdAt.toDate();
                expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
              }

              clearTimeout(timeout);
              unsubscribe();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        });

        // Create habits one by one with delays
        setTimeout(async () => {
          try {
            for (let i = 1; i <= 3; i++) {
              await addDoc(collection(testServices1.db, 'habits'), {
                userId: testUser1.uid,
                name: `Real-time Query Test Habit ${i}`,
                category: 'fitness',
                frequency: 'daily',
                isPublic: false,
                createdAt: new Date(Date.now() + i * 1000), // Stagger creation times
                updatedAt: new Date()
              });
              
              // Small delay between creations
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });

    it('should update query results when documents are modified', async () => {
      // Create initial habit
      const habitRef = await addDoc(collection(testServices1.db, 'habits'), {
        userId: testUser1.uid,
        name: 'Modifiable Habit',
        category: 'wellness',
        frequency: 'daily',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Query modification test timed out'));
        }, 10000);

        let updateReceived = false;

        // Set up listener for the specific habit
        const unsubscribe = onSnapshot(habitRef, (snapshot) => {
          if (snapshot.exists() && !updateReceived) {
            const habit = snapshot.data();
            
            if (habit.name === 'Modified Habit Name') {
              updateReceived = true;
              
              try {
                expect(habit.name).toBe('Modified Habit Name');
                expect(habit.category).toBe('productivity'); // Also changed
                expect(habit.updatedAt).toBeDefined();
                
                clearTimeout(timeout);
                unsubscribe();
                resolve();
              } catch (error) {
                clearTimeout(timeout);
                unsubscribe();
                reject(error);
              }
            }
          }
        });

        // Modify the habit after a delay
        setTimeout(async () => {
          try {
            await updateDoc(habitRef, {
              name: 'Modified Habit Name',
              category: 'productivity',
              updatedAt: new Date()
            });
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }, 100);
      });
    });
  });
});