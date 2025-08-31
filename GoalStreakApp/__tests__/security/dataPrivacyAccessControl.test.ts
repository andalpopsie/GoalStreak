/**
 * Security Tests: Data Privacy and Access Controls
 * 
 * Tests user data isolation, Firebase security rules, friend-based data sharing,
 * habit privacy controls, and social activity access according to requirements 8.3 and 8.8.
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Test data
const testUsers = {
  alice: { uid: 'alice', email: 'alice@example.com' },
  bob: { uid: 'bob', email: 'bob@example.com' },
  charlie: { uid: 'charlie', email: 'charlie@example.com' }
};

const testHabits = {
  alicePrivateHabit: {
    id: 'habit-alice-private',
    userId: 'alice',
    name: 'Alice Private Habit',
    isPublic: false,
    category: 'fitness'
  },
  alicePublicHabit: {
    id: 'habit-alice-public',
    userId: 'alice',
    name: 'Alice Public Habit',
    isPublic: true,
    category: 'health'
  },
  bobPrivateHabit: {
    id: 'habit-bob-private',
    userId: 'bob',
    name: 'Bob Private Habit',
    isPublic: false,
    category: 'productivity'
  }
};

describe('Security Tests: Data Privacy and Access Controls', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'goalstreak-security-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Users can only access their own data
              match /users/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
              
              // Habits - users can only access their own habits
              match /habits/{habitId} {
                allow read, write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
              }
              
              // Completions - users can only access their own completions
              match /completions/{completionId} {
                allow read, write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
              }
              
              // Streaks - users can only access their own streaks
              match /streaks/{streakId} {
                allow read, write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
              }
              
              // Friends - bidirectional access for friendship management
              match /friends/{friendId} {
                allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   resource.data.friendId == request.auth.uid);
                allow write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
              }
              
              // Friend requests - users can read requests sent to them or by them
              match /friendRequests/{requestId} {
                allow read: if request.auth != null && 
                  (resource.data.fromUserId == request.auth.uid || 
                   resource.data.toUserId == request.auth.uid);
                allow write: if request.auth != null && 
                  resource.data.fromUserId == request.auth.uid;
              }
              
              // Activities - friends can read shared activities
              match /activities/{activityId} {
                allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   resource.data.visibility == 'public' ||
                   (resource.data.visibility == 'friends' && 
                    exists(/databases/$(database)/documents/friends/$(request.auth.uid + '_' + resource.data.userId))));
                allow write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
              }
              
              // User profiles - public read, own write
              match /userProfiles/{userId} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && request.auth.uid == userId;
              }
              
              // Social settings - users can only access their own settings
              match /socialSettings/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }
        `
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('User Data Isolation', () => {
    test('should prevent users from accessing other users data', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates her user profile
      await setDoc(doc(aliceDb, 'users', testUsers.alice.uid), {
        email: testUsers.alice.email,
        displayName: 'Alice',
        createdAt: new Date()
      });

      // Bob should not be able to read Alice's user data
      await expect(
        getDoc(doc(bobDb, 'users', testUsers.alice.uid))
      ).rejects.toThrow();

      // Bob should not be able to write to Alice's user data
      await expect(
        setDoc(doc(bobDb, 'users', testUsers.alice.uid), {
          email: 'hacked@example.com'
        })
      ).rejects.toThrow();
    });

    test('should allow users to access only their own data', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();

      // Alice should be able to create and read her own data
      await setDoc(doc(aliceDb, 'users', testUsers.alice.uid), {
        email: testUsers.alice.email,
        displayName: 'Alice',
        createdAt: new Date()
      });

      const userDoc = await getDoc(doc(aliceDb, 'users', testUsers.alice.uid));
      expect(userDoc.exists()).toBe(true);
      expect(userDoc.data()?.email).toBe(testUsers.alice.email);
    });

    test('should prevent unauthorized access to user collections', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      // Unauthenticated users should not access any user data
      await expect(
        getDoc(doc(unauthenticatedDb, 'users', testUsers.alice.uid))
      ).rejects.toThrow();

      await expect(
        setDoc(doc(unauthenticatedDb, 'users', 'any-user'), {
          email: 'unauthorized@example.com'
        })
      ).rejects.toThrow();
    });
  });

  describe('Habit Privacy Controls', () => {
    test('should enforce habit ownership for read access', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates a private habit
      await setDoc(doc(aliceDb, 'habits', testHabits.alicePrivateHabit.id), testHabits.alicePrivateHabit);

      // Alice should be able to read her own habit
      const aliceHabitDoc = await getDoc(doc(aliceDb, 'habits', testHabits.alicePrivateHabit.id));
      expect(aliceHabitDoc.exists()).toBe(true);

      // Bob should not be able to read Alice's habit
      await expect(
        getDoc(doc(bobDb, 'habits', testHabits.alicePrivateHabit.id))
      ).rejects.toThrow();
    });

    test('should enforce habit ownership for write access', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates a habit
      await setDoc(doc(aliceDb, 'habits', testHabits.alicePrivateHabit.id), testHabits.alicePrivateHabit);

      // Bob should not be able to modify Alice's habit
      await expect(
        setDoc(doc(bobDb, 'habits', testHabits.alicePrivateHabit.id), {
          ...testHabits.alicePrivateHabit,
          name: 'Hacked Habit Name'
        })
      ).rejects.toThrow();

      // Bob should not be able to create habits for Alice
      await expect(
        setDoc(doc(bobDb, 'habits', 'fake-habit'), {
          userId: testUsers.alice.uid,
          name: 'Fake Habit',
          category: 'fitness'
        })
      ).rejects.toThrow();
    });

    test('should validate habit privacy settings', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();

      // Test creating habits with different privacy settings
      const privateHabit = { ...testHabits.alicePrivateHabit, isPublic: false };
      const publicHabit = { ...testHabits.alicePublicHabit, isPublic: true };

      await setDoc(doc(aliceDb, 'habits', 'private-habit'), privateHabit);
      await setDoc(doc(aliceDb, 'habits', 'public-habit'), publicHabit);

      // Verify habits were created with correct privacy settings
      const privateDoc = await getDoc(doc(aliceDb, 'habits', 'private-habit'));
      const publicDoc = await getDoc(doc(aliceDb, 'habits', 'public-habit'));

      expect(privateDoc.data()?.isPublic).toBe(false);
      expect(publicDoc.data()?.isPublic).toBe(true);
    });

    test('should prevent habit visibility manipulation by other users', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates a private habit
      await setDoc(doc(aliceDb, 'habits', testHabits.alicePrivateHabit.id), testHabits.alicePrivateHabit);

      // Bob should not be able to change Alice's habit visibility
      await expect(
        setDoc(doc(bobDb, 'habits', testHabits.alicePrivateHabit.id), {
          ...testHabits.alicePrivateHabit,
          isPublic: true
        })
      ).rejects.toThrow();
    });
  });

  describe('Friend-Based Data Sharing', () => {
    test('should allow friends to access shared data', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Create friendship between Alice and Bob
      const friendshipId = `${testUsers.alice.uid}_${testUsers.bob.uid}`;
      await setDoc(doc(aliceDb, 'friends', friendshipId), {
        userId: testUsers.alice.uid,
        friendId: testUsers.bob.uid,
        status: 'accepted',
        createdAt: new Date()
      });

      // Create reciprocal friendship
      const reciprocalFriendshipId = `${testUsers.bob.uid}_${testUsers.alice.uid}`;
      await setDoc(doc(bobDb, 'friends', reciprocalFriendshipId), {
        userId: testUsers.bob.uid,
        friendId: testUsers.alice.uid,
        status: 'accepted',
        createdAt: new Date()
      });

      // Both users should be able to read the friendship data
      const aliceFriendDoc = await getDoc(doc(aliceDb, 'friends', friendshipId));
      const bobFriendDoc = await getDoc(doc(bobDb, 'friends', friendshipId));

      expect(aliceFriendDoc.exists()).toBe(true);
      expect(bobFriendDoc.exists()).toBe(true);
    });

    test('should prevent non-friends from accessing friendship data', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();
      const charlieDb = testEnv.authenticatedContext(testUsers.charlie.uid).firestore();

      // Create friendship between Alice and Bob
      const friendshipId = `${testUsers.alice.uid}_${testUsers.bob.uid}`;
      await setDoc(doc(aliceDb, 'friends', friendshipId), {
        userId: testUsers.alice.uid,
        friendId: testUsers.bob.uid,
        status: 'accepted',
        createdAt: new Date()
      });

      // Charlie should not be able to read Alice-Bob friendship
      await expect(
        getDoc(doc(charlieDb, 'friends', friendshipId))
      ).rejects.toThrow();
    });

    test('should validate friend request permissions', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();
      const charlieDb = testEnv.authenticatedContext(testUsers.charlie.uid).firestore();

      // Alice sends friend request to Bob
      const requestId = 'request-alice-to-bob';
      await setDoc(doc(aliceDb, 'friendRequests', requestId), {
        fromUserId: testUsers.alice.uid,
        toUserId: testUsers.bob.uid,
        status: 'pending',
        createdAt: new Date()
      });

      // Alice should be able to read her own request
      const aliceRequestDoc = await getDoc(doc(aliceDb, 'friendRequests', requestId));
      expect(aliceRequestDoc.exists()).toBe(true);

      // Bob should be able to read request sent to him
      const bobRequestDoc = await getDoc(doc(bobDb, 'friendRequests', requestId));
      expect(bobRequestDoc.exists()).toBe(true);

      // Charlie should not be able to read the request
      await expect(
        getDoc(doc(charlieDb, 'friendRequests', requestId))
      ).rejects.toThrow();
    });

    test('should prevent users from creating friend requests on behalf of others', async () => {
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Bob should not be able to create a friend request from Alice to Charlie
      await expect(
        setDoc(doc(bobDb, 'friendRequests', 'fake-request'), {
          fromUserId: testUsers.alice.uid,
          toUserId: testUsers.charlie.uid,
          status: 'pending',
          createdAt: new Date()
        })
      ).rejects.toThrow();
    });
  });

  describe('Social Activity Access and Filtering', () => {
    test('should allow users to access their own activities', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();

      // Alice creates an activity
      const activityId = 'activity-alice-1';
      await setDoc(doc(aliceDb, 'activities', activityId), {
        userId: testUsers.alice.uid,
        type: 'habit_completed',
        habitId: testHabits.alicePrivateHabit.id,
        habitName: testHabits.alicePrivateHabit.name,
        visibility: 'private',
        timestamp: new Date()
      });

      // Alice should be able to read her own activity
      const activityDoc = await getDoc(doc(aliceDb, 'activities', activityId));
      expect(activityDoc.exists()).toBe(true);
    });

    test('should allow friends to access friend-visible activities', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Create friendship
      const friendshipId = `${testUsers.bob.uid}_${testUsers.alice.uid}`;
      await setDoc(doc(aliceDb, 'friends', friendshipId), {
        userId: testUsers.bob.uid,
        friendId: testUsers.alice.uid,
        status: 'accepted',
        createdAt: new Date()
      });

      // Alice creates a friends-visible activity
      const activityId = 'activity-alice-friends';
      await setDoc(doc(aliceDb, 'activities', activityId), {
        userId: testUsers.alice.uid,
        type: 'habit_completed',
        habitId: testHabits.alicePublicHabit.id,
        habitName: testHabits.alicePublicHabit.name,
        visibility: 'friends',
        timestamp: new Date()
      });

      // Bob should be able to read Alice's friends-visible activity
      const activityDoc = await getDoc(doc(bobDb, 'activities', activityId));
      expect(activityDoc.exists()).toBe(true);
    });

    test('should allow anyone to access public activities', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const charlieDb = testEnv.authenticatedContext(testUsers.charlie.uid).firestore();

      // Alice creates a public activity
      const activityId = 'activity-alice-public';
      await setDoc(doc(aliceDb, 'activities', activityId), {
        userId: testUsers.alice.uid,
        type: 'habit_completed',
        habitId: testHabits.alicePublicHabit.id,
        habitName: testHabits.alicePublicHabit.name,
        visibility: 'public',
        timestamp: new Date()
      });

      // Charlie (not a friend) should be able to read Alice's public activity
      const activityDoc = await getDoc(doc(charlieDb, 'activities', activityId));
      expect(activityDoc.exists()).toBe(true);
    });

    test('should prevent non-friends from accessing private activities', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const charlieDb = testEnv.authenticatedContext(testUsers.charlie.uid).firestore();

      // Alice creates a private activity
      const activityId = 'activity-alice-private';
      await setDoc(doc(aliceDb, 'activities', activityId), {
        userId: testUsers.alice.uid,
        type: 'habit_completed',
        habitId: testHabits.alicePrivateHabit.id,
        habitName: testHabits.alicePrivateHabit.name,
        visibility: 'private',
        timestamp: new Date()
      });

      // Charlie should not be able to read Alice's private activity
      await expect(
        getDoc(doc(charlieDb, 'activities', activityId))
      ).rejects.toThrow();
    });

    test('should prevent users from creating activities for other users', async () => {
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Bob should not be able to create an activity for Alice
      await expect(
        setDoc(doc(bobDb, 'activities', 'fake-activity'), {
          userId: testUsers.alice.uid,
          type: 'habit_completed',
          habitId: 'some-habit',
          habitName: 'Fake Habit',
          visibility: 'public',
          timestamp: new Date()
        })
      ).rejects.toThrow();
    });
  });

  describe('Social Settings Privacy', () => {
    test('should allow users to access only their own social settings', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates her social settings
      await setDoc(doc(aliceDb, 'socialSettings', testUsers.alice.uid), {
        shareHabits: true,
        shareProgress: false,
        allowFriendRequests: true,
        profileVisibility: 'friends'
      });

      // Alice should be able to read her own settings
      const aliceSettingsDoc = await getDoc(doc(aliceDb, 'socialSettings', testUsers.alice.uid));
      expect(aliceSettingsDoc.exists()).toBe(true);

      // Bob should not be able to read Alice's settings
      await expect(
        getDoc(doc(bobDb, 'socialSettings', testUsers.alice.uid))
      ).rejects.toThrow();

      // Bob should not be able to modify Alice's settings
      await expect(
        setDoc(doc(bobDb, 'socialSettings', testUsers.alice.uid), {
          shareHabits: false,
          shareProgress: false,
          allowFriendRequests: false,
          profileVisibility: 'private'
        })
      ).rejects.toThrow();
    });
  });

  describe('User Profile Access Controls', () => {
    test('should allow authenticated users to read public profiles', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates her public profile
      await setDoc(doc(aliceDb, 'userProfiles', testUsers.alice.uid), {
        displayName: 'Alice',
        bio: 'Fitness enthusiast',
        profilePicture: 'https://example.com/alice.jpg',
        isPublic: true
      });

      // Bob should be able to read Alice's public profile
      const profileDoc = await getDoc(doc(bobDb, 'userProfiles', testUsers.alice.uid));
      expect(profileDoc.exists()).toBe(true);
      expect(profileDoc.data()?.displayName).toBe('Alice');
    });

    test('should prevent users from modifying other users profiles', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates her profile
      await setDoc(doc(aliceDb, 'userProfiles', testUsers.alice.uid), {
        displayName: 'Alice',
        bio: 'Fitness enthusiast'
      });

      // Bob should not be able to modify Alice's profile
      await expect(
        setDoc(doc(bobDb, 'userProfiles', testUsers.alice.uid), {
          displayName: 'Hacked Alice',
          bio: 'Hacked bio'
        })
      ).rejects.toThrow();
    });

    test('should prevent unauthenticated access to profiles', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();

      // Alice creates her profile
      await setDoc(doc(aliceDb, 'userProfiles', testUsers.alice.uid), {
        displayName: 'Alice',
        bio: 'Fitness enthusiast'
      });

      // Unauthenticated users should not be able to read profiles
      await expect(
        getDoc(doc(unauthenticatedDb, 'userProfiles', testUsers.alice.uid))
      ).rejects.toThrow();
    });
  });

  describe('Data Completion and Streak Privacy', () => {
    test('should enforce completion ownership', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates a completion
      const completionId = 'completion-alice-1';
      await setDoc(doc(aliceDb, 'completions', completionId), {
        userId: testUsers.alice.uid,
        habitId: testHabits.alicePrivateHabit.id,
        completedAt: new Date(),
        value: 1
      });

      // Alice should be able to read her own completion
      const aliceCompletionDoc = await getDoc(doc(aliceDb, 'completions', completionId));
      expect(aliceCompletionDoc.exists()).toBe(true);

      // Bob should not be able to read Alice's completion
      await expect(
        getDoc(doc(bobDb, 'completions', completionId))
      ).rejects.toThrow();

      // Bob should not be able to create completions for Alice
      await expect(
        setDoc(doc(bobDb, 'completions', 'fake-completion'), {
          userId: testUsers.alice.uid,
          habitId: testHabits.alicePrivateHabit.id,
          completedAt: new Date(),
          value: 1
        })
      ).rejects.toThrow();
    });

    test('should enforce streak data ownership', async () => {
      const aliceDb = testEnv.authenticatedContext(testUsers.alice.uid).firestore();
      const bobDb = testEnv.authenticatedContext(testUsers.bob.uid).firestore();

      // Alice creates streak data
      const streakId = testHabits.alicePrivateHabit.id;
      await setDoc(doc(aliceDb, 'streaks', streakId), {
        habitId: streakId,
        currentStreak: 5,
        longestStreak: 10,
        lastCompletedDate: new Date()
      });

      // Alice should be able to read her own streak data
      const aliceStreakDoc = await getDoc(doc(aliceDb, 'streaks', streakId));
      expect(aliceStreakDoc.exists()).toBe(true);

      // Bob should not be able to read Alice's streak data
      await expect(
        getDoc(doc(bobDb, 'streaks', streakId))
      ).rejects.toThrow();

      // Bob should not be able to modify Alice's streak data
      await expect(
        setDoc(doc(bobDb, 'streaks', streakId), {
          habitId: streakId,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null
        })
      ).rejects.toThrow();
    });
  });
});