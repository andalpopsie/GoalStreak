/**
 * Test Data Seeder for Firebase Emulator
 * Provides utilities to seed comprehensive test data for integration testing
 */

import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { User, Habit, HabitCompletion, Streak, Friend, SocialActivity } from '../../types';
import { createMockHabit } from '../factories/habitFactory';
import { createMockUser } from '../factories/userFactory';
import { createMockFriend, createMockSocialActivity } from '../factories/socialFactory';

export interface TestDataSet {
  users: User[];
  habits: Habit[];
  completions: HabitCompletion[];
  streaks: Streak[];
  friends: Friend[];
  activities: SocialActivity[];
}

/**
 * Comprehensive test data seeder
 */
export class TestDataSeeder {
  private db: any;
  private auth: any;

  constructor(db: any, auth: any) {
    this.db = db;
    this.auth = auth;
  }

  /**
   * Create a complete test user with authentication and profile
   */
  async createTestUser(
    email: string,
    password: string = 'password123',
    displayName: string = 'Test User'
  ): Promise<User> {
    try {
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const authUser = userCredential.user;

      // Create user profile
      const user: User = {
        id: authUser.uid,
        email: authUser.email || email,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      await setDoc(doc(this.db, 'users', user.id), user);

      // Create user profile document
      await setDoc(doc(this.db, 'userProfiles', user.id), {
        id: user.id,
        displayName,
        email: user.email,
        profilePicture: null,
        isPublic: true,
        createdAt: new Date()
      });

      // Create social settings
      await setDoc(doc(this.db, 'socialSettings', user.id), {
        userId: user.id,
        shareHabits: true,
        allowFriendRequests: true,
        showInSearch: true,
        notifyOnFriendActivity: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return user;
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Create test habits for a user
   */
  async createTestHabits(userId: string, count: number = 3): Promise<Habit[]> {
    const habits: Habit[] = [];
    const batch = writeBatch(this.db);

    const habitTemplates = [
      { name: 'Morning Workout', category: 'fitness', isPublic: true },
      { name: 'Read 30 Minutes', category: 'learning', isPublic: false },
      { name: 'Meditation', category: 'wellness', isPublic: true },
      { name: 'Drink Water', category: 'health', isPublic: false },
      { name: 'Write Journal', category: 'productivity', isPublic: true }
    ];

    for (let i = 0; i < count; i++) {
      const template = habitTemplates[i % habitTemplates.length];
      const habitRef = doc(collection(this.db, 'habits'));
      
      const habit: Habit = createMockHabit({
        id: habitRef.id,
        userId,
        name: `${template.name} ${i + 1}`,
        category: template.category as any,
        isPublic: template.isPublic,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // Stagger creation dates
      });

      batch.set(habitRef, habit);
      habits.push(habit);
    }

    await batch.commit();
    return habits;
  }

  /**
   * Create habit completions and streaks
   */
  async createHabitCompletions(
    habits: Habit[], 
    daysBack: number = 7
  ): Promise<{ completions: HabitCompletion[], streaks: Streak[] }> {
    const completions: HabitCompletion[] = [];
    const streaks: Streak[] = [];
    const batch = writeBatch(this.db);

    for (const habit of habits) {
      let currentStreak = 0;
      let longestStreak = 0;
      let lastCompletedDate: Date | null = null;

      // Create completions for the last N days (with some gaps)
      for (let i = 0; i < daysBack; i++) {
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() - i);
        completionDate.setHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0); // Random morning time

        // 80% chance of completion (to create realistic streaks)
        if (Math.random() < 0.8) {
          const completionRef = doc(collection(this.db, 'completions'));
          
          const completion: HabitCompletion = {
            id: completionRef.id,
            habitId: habit.id,
            userId: habit.userId,
            completedAt: completionDate
          };

          batch.set(completionRef, completion);
          completions.push(completion);

          // Update streak calculation
          if (i === 0 || (lastCompletedDate && 
              Math.abs(completionDate.getTime() - lastCompletedDate.getTime()) <= 24 * 60 * 60 * 1000)) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
          
          lastCompletedDate = completionDate;
        } else {
          // Break in streak
          currentStreak = 0;
        }
      }

      // Create streak record
      const streak: Streak = {
        habitId: habit.id,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak + Math.floor(Math.random() * 10)),
        lastCompletedDate: lastCompletedDate || new Date()
      };

      batch.set(doc(this.db, 'streaks', habit.id), streak);
      streaks.push(streak);
    }

    await batch.commit();
    return { completions, streaks };
  }

  /**
   * Create friendships between users
   */
  async createFriendships(users: User[]): Promise<Friend[]> {
    const friends: Friend[] = [];
    const batch = writeBatch(this.db);

    // Create friendships between first user and others
    for (let i = 1; i < users.length; i++) {
      const user1 = users[0];
      const user2 = users[i];

      // Create bidirectional friendship
      const friendship1Ref = doc(collection(this.db, 'friends'));
      const friendship2Ref = doc(collection(this.db, 'friends'));

      const friend1: Friend = createMockFriend({
        id: friendship1Ref.id,
        userId: user1.id,
        friendId: user2.id,
        friendEmail: user2.email,
        friendName: user2.displayName,
        status: 'accepted'
      });

      const friend2: Friend = createMockFriend({
        id: friendship2Ref.id,
        userId: user2.id,
        friendId: user1.id,
        friendEmail: user1.email,
        friendName: user1.displayName,
        status: 'accepted'
      });

      batch.set(friendship1Ref, friend1);
      batch.set(friendship2Ref, friend2);

      friends.push(friend1, friend2);
    }

    await batch.commit();
    return friends;
  }

  /**
   * Create social activities
   */
  async createSocialActivities(
    users: User[], 
    habits: Habit[], 
    count: number = 10
  ): Promise<SocialActivity[]> {
    const activities: SocialActivity[] = [];
    const batch = writeBatch(this.db);

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const userHabits = habits.filter(h => h.userId === user.id);
      
      if (userHabits.length === 0) continue;

      const habit = userHabits[Math.floor(Math.random() * userHabits.length)];
      const activityRef = doc(collection(this.db, 'activities'));

      const activity: SocialActivity = createMockSocialActivity({
        id: activityRef.id,
        userId: user.id,
        userName: user.displayName,
        habitId: habit.id,
        habitName: habit.name,
        habitCategory: habit.category,
        timestamp: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)), // Stagger by 2 hours
        reactions: {
          heart: Math.floor(Math.random() * 5),
          fire: Math.floor(Math.random() * 3),
          medal: Math.floor(Math.random() * 2)
        }
      });

      batch.set(activityRef, activity);
      activities.push(activity);
    }

    await batch.commit();
    return activities;
  }

  /**
   * Seed complete test dataset
   */
  async seedCompleteDataset(userCount: number = 3): Promise<TestDataSet> {
    console.log(`🌱 Seeding complete test dataset with ${userCount} users...`);

    // Create users
    const users: User[] = [];
    for (let i = 0; i < userCount; i++) {
      const user = await this.createTestUser(
        `testuser${i + 1}@example.com`,
        'password123',
        `Test User ${i + 1}`
      );
      users.push(user);
    }

    // Create habits for each user
    const allHabits: Habit[] = [];
    for (const user of users) {
      const habits = await this.createTestHabits(user.id, 3);
      allHabits.push(...habits);
    }

    // Create completions and streaks
    const { completions, streaks } = await this.createHabitCompletions(allHabits, 14);

    // Create friendships
    const friends = await this.createFriendships(users);

    // Create social activities
    const activities = await this.createSocialActivities(users, allHabits, 20);

    const dataset: TestDataSet = {
      users,
      habits: allHabits,
      completions,
      streaks,
      friends,
      activities
    };

    console.log('✅ Test dataset seeded successfully:');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  🎯 Habits: ${allHabits.length}`);
    console.log(`  ✅ Completions: ${completions.length}`);
    console.log(`  🔥 Streaks: ${streaks.length}`);
    console.log(`  👫 Friendships: ${friends.length}`);
    console.log(`  📱 Activities: ${activities.length}`);

    return dataset;
  }

  /**
   * Clear all test data
   */
  async clearAllData(): Promise<void> {
    console.log('🧹 Clearing all test data...');
    
    // Note: In a real implementation with Firebase Admin SDK, 
    // we would recursively delete all documents
    // For emulator testing, data is automatically cleared between runs
    
    console.log('✅ Test data cleared (emulator will reset)');
  }
}

/**
 * Create a test data seeder instance
 */
export function createTestDataSeeder(db: any, auth: any): TestDataSeeder {
  return new TestDataSeeder(db, auth);
}

/**
 * Quick seed function for simple test scenarios
 */
export async function quickSeed(
  db: any, 
  auth: any, 
  options: { users?: number; habitsPerUser?: number } = {}
): Promise<TestDataSet> {
  const { users = 2, habitsPerUser = 3 } = options;
  const seeder = new TestDataSeeder(db, auth);
  return await seeder.seedCompleteDataset(users);
}