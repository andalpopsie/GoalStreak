/**
 * Firebase Security Rules Integration Tests
 * Tests Firestore and Storage security rules with Firebase emulators
 */

import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Firebase Security Rules Integration Tests', () => {
  let testEnv: RulesTestEnvironment;
  
  // Test user IDs
  const ALICE_UID = 'alice-uid';
  const BOB_UID = 'bob-uid';
  const CHARLIE_UID = 'charlie-uid';

  beforeAll(async () => {
    // Read Firestore rules
    const rulesPath = join(__dirname, '../../../firestore.rules');
    const rules = readFileSync(rulesPath, 'utf8');

    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'security-rules-test',
      firestore: {
        rules,
        host: 'localhost',
        port: 8080
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('User Data Access Control', () => {
    it('should allow users to read their own profile', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      // Alice can read her own user document
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'users', ALICE_UID))
      );
    });

    it('should deny users from reading other users profiles', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      // Alice cannot read Bob's user document
      await assertFails(
        getDoc(doc(alice.firestore(), 'users', BOB_UID))
      );
    });

    it('should allow users to write their own profile', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        setDoc(doc(alice.firestore(), 'users', ALICE_UID), {
          id: ALICE_UID,
          email: 'alice@example.com',
          displayName: 'Alice',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    it('should deny users from writing other users profiles', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        setDoc(doc(alice.firestore(), 'users', BOB_UID), {
          id: BOB_UID,
          email: 'bob@example.com',
          displayName: 'Bob',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    it('should deny unauthenticated access to user data', async () => {
      const unauth = testEnv.unauthenticatedContext();
      
      await assertFails(
        getDoc(doc(unauth.firestore(), 'users', ALICE_UID))
      );
    });
  });

  describe('Habit Data Access Control', () => {
    beforeEach(async () => {
      // Set up test data
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);

      // Create Alice's habit
      await setDoc(doc(alice.firestore(), 'habits', 'alice-habit-1'), {
        id: 'alice-habit-1',
        userId: ALICE_UID,
        name: 'Alice Morning Workout',
        category: 'fitness',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create Bob's habit
      await setDoc(doc(bob.firestore(), 'habits', 'bob-habit-1'), {
        id: 'bob-habit-1',
        userId: BOB_UID,
        name: 'Bob Reading',
        category: 'learning',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should allow users to read their own habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'habits', 'alice-habit-1'))
      );
    });

    it('should deny users from reading other users habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        getDoc(doc(alice.firestore(), 'habits', 'bob-habit-1'))
      );
    });

    it('should allow users to create their own habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        addDoc(collection(alice.firestore(), 'habits'), {
          userId: ALICE_UID,
          name: 'New Habit',
          category: 'wellness',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    it('should deny users from creating habits for other users', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        addDoc(collection(alice.firestore(), 'habits'), {
          userId: BOB_UID, // Alice trying to create habit for Bob
          name: 'Malicious Habit',
          category: 'fitness',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    it('should allow users to update their own habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        updateDoc(doc(alice.firestore(), 'habits', 'alice-habit-1'), {
          name: 'Updated Morning Workout',
          updatedAt: new Date()
        })
      );
    });

    it('should deny users from updating other users habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        updateDoc(doc(alice.firestore(), 'habits', 'bob-habit-1'), {
          name: 'Hacked Habit',
          updatedAt: new Date()
        })
      );
    });

    it('should allow users to delete their own habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        deleteDoc(doc(alice.firestore(), 'habits', 'alice-habit-1'))
      );
    });

    it('should deny users from deleting other users habits', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        deleteDoc(doc(alice.firestore(), 'habits', 'bob-habit-1'))
      );
    });
  });

  describe('Habit Completions Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);

      // Create completion records
      await setDoc(doc(alice.firestore(), 'completions', 'alice-completion-1'), {
        id: 'alice-completion-1',
        habitId: 'alice-habit-1',
        userId: ALICE_UID,
        completedAt: new Date()
      });

      await setDoc(doc(bob.firestore(), 'completions', 'bob-completion-1'), {
        id: 'bob-completion-1',
        habitId: 'bob-habit-1',
        userId: BOB_UID,
        completedAt: new Date()
      });
    });

    it('should allow users to read their own completions', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'completions', 'alice-completion-1'))
      );
    });

    it('should deny users from reading other users completions', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        getDoc(doc(alice.firestore(), 'completions', 'bob-completion-1'))
      );
    });

    it('should allow users to create their own completions', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        addDoc(collection(alice.firestore(), 'completions'), {
          habitId: 'alice-habit-1',
          userId: ALICE_UID,
          completedAt: new Date()
        })
      );
    });

    it('should deny users from creating completions for other users', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        addDoc(collection(alice.firestore(), 'completions'), {
          habitId: 'bob-habit-1',
          userId: BOB_UID, // Alice trying to create completion for Bob
          completedAt: new Date()
        })
      );
    });
  });

  describe('Friend Relationships Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);

      // Create friendship between Alice and Bob
      await setDoc(doc(alice.firestore(), 'friends', 'alice-bob-friendship'), {
        id: 'alice-bob-friendship',
        userId: ALICE_UID,
        friendId: BOB_UID,
        friendEmail: 'bob@example.com',
        friendName: 'Bob',
        status: 'accepted',
        createdAt: new Date()
      });

      // Reciprocal friendship
      await setDoc(doc(bob.firestore(), 'friends', 'bob-alice-friendship'), {
        id: 'bob-alice-friendship',
        userId: BOB_UID,
        friendId: ALICE_UID,
        friendEmail: 'alice@example.com',
        friendName: 'Alice',
        status: 'accepted',
        createdAt: new Date()
      });

      // Charlie's friendship with Alice (Alice doesn't know Charlie)
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);
      await setDoc(doc(charlie.firestore(), 'friends', 'charlie-alice-friendship'), {
        id: 'charlie-alice-friendship',
        userId: CHARLIE_UID,
        friendId: ALICE_UID,
        friendEmail: 'alice@example.com',
        friendName: 'Alice',
        status: 'accepted',
        createdAt: new Date()
      });
    });

    it('should allow users to read friendships they are part of', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      // Alice can read her friendship with Bob
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'friends', 'alice-bob-friendship'))
      );

      // Alice can also read Bob's friendship with her (bidirectional)
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'friends', 'bob-alice-friendship'))
      );
    });

    it('should deny users from reading friendships they are not part of', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      // Bob cannot read Charlie's friendship with Alice
      await assertFails(
        getDoc(doc(bob.firestore(), 'friends', 'charlie-alice-friendship'))
      );
    });

    it('should allow users to create their own friendships', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        addDoc(collection(alice.firestore(), 'friends'), {
          userId: ALICE_UID,
          friendId: CHARLIE_UID,
          friendEmail: 'charlie@example.com',
          friendName: 'Charlie',
          status: 'accepted',
          createdAt: new Date()
        })
      );
    });

    it('should deny users from creating friendships for other users', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        addDoc(collection(alice.firestore(), 'friends'), {
          userId: BOB_UID, // Alice trying to create friendship for Bob
          friendId: CHARLIE_UID,
          friendEmail: 'charlie@example.com',
          friendName: 'Charlie',
          status: 'accepted',
          createdAt: new Date()
        })
      );
    });
  });

  describe('Friend Requests Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      // Alice sends friend request to Bob
      await setDoc(doc(alice.firestore(), 'friendRequests', 'alice-to-bob-request'), {
        id: 'alice-to-bob-request',
        fromUserId: ALICE_UID,
        toUserId: BOB_UID,
        fromUserEmail: 'alice@example.com',
        toUserEmail: 'bob@example.com',
        status: 'pending',
        createdAt: new Date()
      });

      // Charlie sends friend request to Alice
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);
      await setDoc(doc(charlie.firestore(), 'friendRequests', 'charlie-to-alice-request'), {
        id: 'charlie-to-alice-request',
        fromUserId: CHARLIE_UID,
        toUserId: ALICE_UID,
        fromUserEmail: 'charlie@example.com',
        toUserEmail: 'alice@example.com',
        status: 'pending',
        createdAt: new Date()
      });
    });

    it('should allow users to read friend requests they sent', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'friendRequests', 'alice-to-bob-request'))
      );
    });

    it('should allow users to read friend requests sent to them', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'friendRequests', 'charlie-to-alice-request'))
      );
    });

    it('should deny users from reading unrelated friend requests', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      await assertFails(
        getDoc(doc(bob.firestore(), 'friendRequests', 'charlie-to-alice-request'))
      );
    });

    it('should allow users to create friend requests from themselves', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        addDoc(collection(alice.firestore(), 'friendRequests'), {
          fromUserId: ALICE_UID,
          toUserId: CHARLIE_UID,
          fromUserEmail: 'alice@example.com',
          toUserEmail: 'charlie@example.com',
          status: 'pending',
          createdAt: new Date()
        })
      );
    });

    it('should deny users from creating friend requests from other users', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        addDoc(collection(alice.firestore(), 'friendRequests'), {
          fromUserId: BOB_UID, // Alice trying to create request from Bob
          toUserId: CHARLIE_UID,
          fromUserEmail: 'bob@example.com',
          toUserEmail: 'charlie@example.com',
          status: 'pending',
          createdAt: new Date()
        })
      );
    });
  });

  describe('Social Activities Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);

      // Create friendship between Alice and Bob
      await setDoc(doc(alice.firestore(), 'friends', `${ALICE_UID}_${BOB_UID}`), {
        userId: ALICE_UID,
        friendId: BOB_UID,
        status: 'accepted'
      });

      // Alice's public activity
      await setDoc(doc(alice.firestore(), 'activities', 'alice-public-activity'), {
        id: 'alice-public-activity',
        userId: ALICE_UID,
        userName: 'Alice',
        type: 'habit_completed',
        habitId: 'alice-habit-1',
        habitName: 'Morning Workout',
        habitCategory: 'fitness',
        visibility: 'public',
        timestamp: new Date()
      });

      // Alice's friends-only activity
      await setDoc(doc(alice.firestore(), 'activities', 'alice-friends-activity'), {
        id: 'alice-friends-activity',
        userId: ALICE_UID,
        userName: 'Alice',
        type: 'habit_completed',
        habitId: 'alice-habit-2',
        habitName: 'Reading',
        habitCategory: 'learning',
        visibility: 'friends',
        timestamp: new Date()
      });

      // Alice's private activity
      await setDoc(doc(alice.firestore(), 'activities', 'alice-private-activity'), {
        id: 'alice-private-activity',
        userId: ALICE_UID,
        userName: 'Alice',
        type: 'habit_completed',
        habitId: 'alice-habit-3',
        habitName: 'Personal Journal',
        habitCategory: 'wellness',
        visibility: 'private',
        timestamp: new Date()
      });
    });

    it('should allow users to read their own activities', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'activities', 'alice-public-activity'))
      );

      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'activities', 'alice-friends-activity'))
      );

      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'activities', 'alice-private-activity'))
      );
    });

    it('should allow anyone to read public activities', async () => {
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);
      
      await assertSucceeds(
        getDoc(doc(charlie.firestore(), 'activities', 'alice-public-activity'))
      );
    });

    it('should allow friends to read friends-only activities', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      await assertSucceeds(
        getDoc(doc(bob.firestore(), 'activities', 'alice-friends-activity'))
      );
    });

    it('should deny non-friends from reading friends-only activities', async () => {
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);
      
      await assertFails(
        getDoc(doc(charlie.firestore(), 'activities', 'alice-friends-activity'))
      );
    });

    it('should deny everyone from reading private activities except owner', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      const charlie = testEnv.authenticatedContext(CHARLIE_UID);
      
      await assertFails(
        getDoc(doc(bob.firestore(), 'activities', 'alice-private-activity'))
      );

      await assertFails(
        getDoc(doc(charlie.firestore(), 'activities', 'alice-private-activity'))
      );
    });

    it('should allow users to create their own activities', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        addDoc(collection(alice.firestore(), 'activities'), {
          userId: ALICE_UID,
          userName: 'Alice',
          type: 'habit_completed',
          habitId: 'alice-habit-4',
          habitName: 'New Habit',
          habitCategory: 'productivity',
          visibility: 'public',
          timestamp: new Date()
        })
      );
    });

    it('should deny users from creating activities for other users', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        addDoc(collection(alice.firestore(), 'activities'), {
          userId: BOB_UID, // Alice trying to create activity for Bob
          userName: 'Bob',
          type: 'habit_completed',
          habitId: 'bob-habit-1',
          habitName: 'Fake Activity',
          habitCategory: 'fitness',
          visibility: 'public',
          timestamp: new Date()
        })
      );
    });
  });

  describe('User Profiles Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);

      await setDoc(doc(alice.firestore(), 'userProfiles', ALICE_UID), {
        id: ALICE_UID,
        displayName: 'Alice',
        email: 'alice@example.com',
        profilePicture: null,
        isPublic: true,
        createdAt: new Date()
      });

      await setDoc(doc(bob.firestore(), 'userProfiles', BOB_UID), {
        id: BOB_UID,
        displayName: 'Bob',
        email: 'bob@example.com',
        profilePicture: null,
        isPublic: false,
        createdAt: new Date()
      });
    });

    it('should allow authenticated users to read public profiles', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      // Alice can read Bob's profile (even though it's private, rules allow any authenticated user)
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'userProfiles', BOB_UID))
      );

      // Bob can read Alice's profile
      await assertSucceeds(
        getDoc(doc(bob.firestore(), 'userProfiles', ALICE_UID))
      );
    });

    it('should allow users to update their own profiles', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        updateDoc(doc(alice.firestore(), 'userProfiles', ALICE_UID), {
          displayName: 'Alice Updated',
          updatedAt: new Date()
        })
      );
    });

    it('should deny users from updating other users profiles', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertFails(
        updateDoc(doc(alice.firestore(), 'userProfiles', BOB_UID), {
          displayName: 'Hacked Bob',
          updatedAt: new Date()
        })
      );
    });

    it('should deny unauthenticated access to profiles', async () => {
      const unauth = testEnv.unauthenticatedContext();
      
      await assertFails(
        getDoc(doc(unauth.firestore(), 'userProfiles', ALICE_UID))
      );
    });
  });

  describe('Social Settings Access Control', () => {
    beforeEach(async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await setDoc(doc(alice.firestore(), 'socialSettings', ALICE_UID), {
        userId: ALICE_UID,
        shareHabits: true,
        allowFriendRequests: true,
        showInSearch: true,
        notifyOnFriendActivity: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should allow users to read their own social settings', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        getDoc(doc(alice.firestore(), 'socialSettings', ALICE_UID))
      );
    });

    it('should deny users from reading other users social settings', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      await assertFails(
        getDoc(doc(bob.firestore(), 'socialSettings', ALICE_UID))
      );
    });

    it('should allow users to update their own social settings', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      
      await assertSucceeds(
        updateDoc(doc(alice.firestore(), 'socialSettings', ALICE_UID), {
          shareHabits: false,
          updatedAt: new Date()
        })
      );
    });

    it('should deny users from updating other users social settings', async () => {
      const bob = testEnv.authenticatedContext(BOB_UID);
      
      await assertFails(
        setDoc(doc(bob.firestore(), 'socialSettings', ALICE_UID), {
          shareHabits: false,
          allowFriendRequests: false,
          updatedAt: new Date()
        })
      );
    });
  });
});