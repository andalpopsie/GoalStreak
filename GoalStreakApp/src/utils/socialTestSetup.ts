// Simple Social Features Test Setup
import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export class SocialTestSetup {
  
  // Step 1: Create a test friend user
  static async createTestFriend(): Promise<string> {
    console.log('Creating test friend user...');
    
    const testFriendId = 'test-friend-' + Date.now();
    const testFriend = {
      email: 'testfriend@example.com',
      displayName: 'Test Friend',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    await setDoc(doc(db, 'users', testFriendId), testFriend);
    console.log('✅ Test friend created:', testFriend.displayName);
    
    return testFriendId;
  }

  // Step 2: Create sample habits for test friend
  static async createTestHabits(userId: string): Promise<string[]> {
    console.log('Creating test habits...');
    
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
      console.log('✅ Created habit:', habit.name);
    }
    
    return habitIds;
  }

  // Step 3: Create sample activities
  static async createTestActivities(userId: string): Promise<void> {
    console.log('Creating test activities...');
    
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
      console.log('✅ Created activity:', activity.message);
    }
  }

  // Main setup function
  static async setupBasicTestData(): Promise<void> {
    console.log('🚀 Setting up basic social test data...\n');
    
    try {
      const testFriendId = await this.createTestFriend();
      await this.createTestHabits(testFriendId);
      await this.createTestActivities(testFriendId);
      
      console.log('\n🎉 Basic test data ready!');
      console.log('📧 Test friend email: testfriend@example.com');
      console.log('👤 Test friend name: Test Friend');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}
