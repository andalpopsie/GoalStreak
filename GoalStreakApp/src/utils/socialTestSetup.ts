// Simple Social Features Test Setup
import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export class SocialTestSetup {
  
  // Step 1: Create a test friend user
  static async createTestFriend(): Promise<string> {
    
    const testFriendId = 'test-friend-' + Date.now();
    const testFriend = {
      email: 'testfriend@example.com',
      displayName: 'Test Friend',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(doc(db, 'users', testFriendId), testFriend);
    
    return testFriendId;
  }

  // Step 2: Create sample habits for test friend
  static async createTestHabits(userId: string): Promise<string[]> {
    
    const habits = [
      { name: 'Morning Run', category: 'fitness', icon: 'fitness' },
      { name: 'Read Book', category: 'learning', icon: 'book' },
      { name: 'Drink Water', category: 'health', icon: 'water' }
    ];

    const habitIds: string[] = [];
    
    for (const habit of habits) {
      const docRef = await addDoc(collection(db, 'habits'), {
        userId,
        name: habit.name,
        category: habit.category,
        icon: habit.icon,
        color: '#4ECDC4',
        frequency: 'daily',
        targetCount: 1,
        isActive: true,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      habitIds.push(docRef.id);
    }
    
    return habitIds;
  }

  // Step 3: Create sample activities
  static async createTestActivities(userId: string): Promise<void> {
    
    const activities = [
      {
        userId,
        userName: 'Test Friend',
        type: 'habit_completion',
        habitName: 'Morning Run',
        habitCategory: 'fitness',
        message: 'Completed Morning Run',
        visibility: 'friends',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
      },
      {
        userId,
        userName: 'Test Friend', 
        type: 'streak_milestone',
        habitName: 'Read Book',
        habitCategory: 'learning',
        streakCount: 5,
        message: 'Reached 5-day streak!',
        visibility: 'friends',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000))
      }
    ];

    for (const activity of activities) {
      await addDoc(collection(db, 'activities'), activity);
    }
  }

  // Main setup function
  static async setupBasicTestData(): Promise<void> {
    
    try {
      const testFriendId = await this.createTestFriend();
      await this.createTestHabits(testFriendId);
      await this.createTestActivities(testFriendId);
      
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}
