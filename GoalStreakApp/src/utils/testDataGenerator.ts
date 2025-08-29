// Test Data Generator - Social Features Testing
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  Timestamp,
  getDocs,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Habit, HabitCompletion, Streak } from '../types/habit';
import { Friend, FriendRequest, SocialActivity } from '../types/social';

export class TestDataGenerator {
  
  // Test user data
  static testUsers = [
    {
      id: 'test-user-1',
      email: 'alice@test.com',
      displayName: 'Alice Johnson',
      profilePicture: null,
      createdAt: new Date(),
    },
    {
      id: 'test-user-2', 
      email: 'bob@test.com',
      displayName: 'Bob Smith',
      profilePicture: null,
      createdAt: new Date(),
    },
    {
      id: 'test-user-3',
      email: 'charlie@test.com', 
      displayName: 'Charlie Brown',
      profilePicture: null,
      createdAt: new Date(),
    }
  ];

  // Sample habits for testing
  static sampleHabits = [
    { name: 'Morning Workout', category: 'fitness', icon: 'fitness' },
    { name: 'Read 30 Minutes', category: 'learning', icon: 'book' },
    { name: 'Drink 8 Glasses Water', category: 'health', icon: 'water' },
    { name: 'Meditate', category: 'mindfulness', icon: 'leaf' },
    { name: 'Walk 10k Steps', category: 'fitness', icon: 'walk' },
    { name: 'Practice Guitar', category: 'hobbies', icon: 'musical-notes' },
    { name: 'Write Journal', category: 'personal', icon: 'journal' },
    { name: 'Eat Healthy Breakfast', category: 'nutrition', icon: 'nutrition' },
  ];

  /**
   * 1. Create Test Users in Firestore
   */
  static async createTestUsers(): Promise<void> {
    console.log('🔧 Creating test users...');
    
    try {
      for (const user of this.testUsers) {
        await setDoc(doc(db, 'users', user.id), {
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          createdAt: Timestamp.fromDate(user.createdAt),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        console.log(`✅ Created user: ${user.displayName} (${user.email})`);
      }
    } catch (error) {
      console.error('❌ Error creating test users:', error);
    }
  }

  /**
   * 2. Create Sample Habits for Test Users
   */
  static async createSampleHabits(userId: string, userIndex: number = 0): Promise<string[]> {
    console.log(`🎯 Creating sample habits for user ${userId}...`);
    
    const habitIds: string[] = [];
    const habitsToCreate = this.sampleHabits.slice(0, 4 + userIndex); // Different habits per user
    
    try {
      for (const habitData of habitsToCreate) {
        const habit: Omit<Habit, 'id'> = {
          userId,
          name: habitData.name,
          description: `Test habit: ${habitData.name}`,
          category: habitData.category,
          icon: habitData.icon,
          color: this.getRandomColor(),
          frequency: 'daily',
          targetCount: 1,
          isActive: true,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
          updatedAt: new Date(),
        };

        const docRef = await addDoc(collection(db, 'habits'), {
          ...habit,
          createdAt: Timestamp.fromDate(habit.createdAt),
          updatedAt: Timestamp.fromDate(habit.updatedAt),
        });
        
        habitIds.push(docRef.id);
        console.log(`✅ Created habit: ${habit.name}`);
      }
    } catch (error) {
      console.error('❌ Error creating sample habits:', error);
    }
    
    return habitIds;
  }

  /**
   * 3. Create Sample Habit Completions & Streaks
   */
  static async createSampleCompletions(userId: string, habitIds: string[]): Promise<void> {
    console.log(`📈 Creating sample completions for user ${userId}...`);
    
    try {
      for (const habitId of habitIds) {
        // Create completions for the last 7 days with some randomness
        const completionDays = Math.floor(Math.random() * 7) + 3; // 3-9 completions
        
        for (let i = 0; i < completionDays; i++) {
          const completionDate = new Date();
          completionDate.setDate(completionDate.getDate() - i);
          
          // Skip some days randomly to make it realistic
          if (Math.random() > 0.7) continue;
          
          const completion: Omit<HabitCompletion, 'id'> = {
            userId,
            habitId,
            completedAt: completionDate,
            notes: i === 0 ? 'Great progress today!' : undefined,
          };

          await addDoc(collection(db, 'completions'), {
            ...completion,
            completedAt: Timestamp.fromDate(completion.completedAt),
          });
        }

        // Create streak record
        const currentStreak = Math.floor(Math.random() * 10) + 1;
        const longestStreak = currentStreak + Math.floor(Math.random() * 5);
        
        const streak: Omit<Streak, 'id'> = {
          userId,
          habitId,
          currentStreak,
          longestStreak,
          lastCompletedAt: new Date(),
          updatedAt: new Date(),
        };

        await addDoc(collection(db, 'streaks'), {
          ...streak,
          lastCompletedAt: Timestamp.fromDate(streak.lastCompletedAt),
          updatedAt: Timestamp.fromDate(streak.updatedAt),
        });
        
        console.log(`✅ Created completions and streak for habit ${habitId}`);
      }
    } catch (error) {
      console.error('❌ Error creating sample completions:', error);
    }
  }

  /**
   * 4. Create Friend Relationships
   */
  static async createFriendRelationships(): Promise<void> {
    console.log('👥 Creating friend relationships...');
    
    try {
      // User 1 and User 2 are friends
      await this.createFriendship(this.testUsers[0].id, this.testUsers[1].id);
      
      // User 1 and User 3 are friends  
      await this.createFriendship(this.testUsers[0].id, this.testUsers[2].id);
      
      // Create a pending friend request from User 2 to User 3
      await this.createFriendRequest(this.testUsers[1].id, this.testUsers[2].id);
      
      console.log('✅ Friend relationships created');
    } catch (error) {
      console.error('❌ Error creating friend relationships:', error);
    }
  }

  /**
   * 5. Create Sample Social Activities
   */
  static async createSampleActivities(): Promise<void> {
    console.log('📱 Creating sample social activities...');
    
    try {
      const activities = [
        {
          userId: this.testUsers[1].id,
          userName: this.testUsers[1].displayName,
          type: 'habit_completion' as const,
          habitName: 'Morning Workout',
          habitCategory: 'fitness',
          message: 'Completed Morning Workout',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          userId: this.testUsers[2].id,
          userName: this.testUsers[2].displayName,
          type: 'streak_milestone' as const,
          habitName: 'Read 30 Minutes',
          habitCategory: 'learning',
          streakCount: 7,
          message: 'Reached a 7-day streak with Read 30 Minutes!',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
        {
          userId: this.testUsers[1].id,
          userName: this.testUsers[1].displayName,
          type: 'habit_creation' as const,
          habitName: 'Practice Guitar',
          habitCategory: 'hobbies',
          message: 'Started a new habit: Practice Guitar',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
          userId: this.testUsers[2].id,
          userName: this.testUsers[2].displayName,
          type: 'habit_completion' as const,
          habitName: 'Meditate',
          habitCategory: 'mindfulness',
          message: 'Completed Meditate',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        },
      ];

      for (const activity of activities) {
        await addDoc(collection(db, 'activities'), {
          ...activity,
          visibility: 'friends',
          createdAt: Timestamp.fromDate(activity.createdAt),
        });
        console.log(`✅ Created activity: ${activity.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating sample activities:', error);
    }
  }

  /**
   * Helper: Create friendship between two users
   */
  private static async createFriendship(userId1: string, userId2: string): Promise<void> {
    const friendship1: Omit<Friend, 'id'> = {
      userId: userId1,
      friendId: userId2,
      friendEmail: this.testUsers.find(u => u.id === userId2)?.email || '',
      friendName: this.testUsers.find(u => u.id === userId2)?.displayName || '',
      status: 'accepted',
      createdAt: new Date(),
    };

    const friendship2: Omit<Friend, 'id'> = {
      userId: userId2,
      friendId: userId1,
      friendEmail: this.testUsers.find(u => u.id === userId1)?.email || '',
      friendName: this.testUsers.find(u => u.id === userId1)?.displayName || '',
      status: 'accepted',
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'friends'), {
      ...friendship1,
      createdAt: Timestamp.fromDate(friendship1.createdAt),
    });

    await addDoc(collection(db, 'friends'), {
      ...friendship2,
      createdAt: Timestamp.fromDate(friendship2.createdAt),
    });
  }

  /**
   * Helper: Create friend request
   */
  private static async createFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    const request: Omit<FriendRequest, 'id'> = {
      fromUserId,
      toUserId,
      fromUserEmail: this.testUsers.find(u => u.id === fromUserId)?.email || '',
      fromUserName: this.testUsers.find(u => u.id === fromUserId)?.displayName || '',
      toUserEmail: this.testUsers.find(u => u.id === toUserId)?.email || '',
      message: 'Hi! Let\'s be habit buddies!',
      status: 'pending',
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'friendRequests'), {
      ...request,
      createdAt: Timestamp.fromDate(request.createdAt),
    });
  }

  /**
   * Helper: Get random color
   */
  private static getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 🚀 MAIN SETUP FUNCTION - Run this to create all test data
   */
  static async setupCompleteTestData(): Promise<void> {
    console.log('🚀 Setting up complete test data for social features...\n');
    
    try {
      // 1. Create test users
      await this.createTestUsers();
      console.log('');
      
      // 2. Create habits for each user
      const user1Habits = await this.createSampleHabits(this.testUsers[0].id, 0);
      const user2Habits = await this.createSampleHabits(this.testUsers[1].id, 1);
      const user3Habits = await this.createSampleHabits(this.testUsers[2].id, 2);
      console.log('');
      
      // 3. Create completions and streaks
      await this.createSampleCompletions(this.testUsers[0].id, user1Habits);
      await this.createSampleCompletions(this.testUsers[1].id, user2Habits);
      await this.createSampleCompletions(this.testUsers[2].id, user3Habits);
      console.log('');
      
      // 4. Create friend relationships
      await this.createFriendRelationships();
      console.log('');
      
      // 5. Create social activities
      await this.createSampleActivities();
      console.log('');
      
      console.log('🎉 Test data setup complete!');
      console.log('\n📋 Test Users Created:');
      this.testUsers.forEach(user => {
        console.log(`   • ${user.displayName} (${user.email})`);
      });
      
      console.log('\n🧪 Ready for Social Testing!');
      console.log('   • Friend relationships established');
      console.log('   • Sample habits and completions created');
      console.log('   • Activity feed populated');
      console.log('   • Pending friend requests available');
      
    } catch (error) {
      console.error('❌ Error setting up test data:', error);
    }
  }

  /**
   * 🧹 Clean up test data (optional)
   */
  static async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test users and their associated data
      for (const user of this.testUsers) {
        // Delete user habits
        const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.id));
        const habitsSnapshot = await getDocs(habitsQuery);
        for (const doc of habitsSnapshot.docs) {
          await doc.ref.delete();
        }
        
        // Delete user completions
        const completionsQuery = query(collection(db, 'completions'), where('userId', '==', user.id));
        const completionsSnapshot = await getDocs(completionsQuery);
        for (const doc of completionsSnapshot.docs) {
          await doc.ref.delete();
        }
        
        // Delete user streaks
        const streaksQuery = query(collection(db, 'streaks'), where('userId', '==', user.id));
        const streaksSnapshot = await getDocs(streaksQuery);
        for (const doc of streaksSnapshot.docs) {
          await doc.ref.delete();
        }
        
        // Delete user from users collection
        await doc(db, 'users', user.id).delete();
      }
      
      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    }
  }
}

// Export for easy access
export default TestDataGenerator;
