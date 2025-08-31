// Comprehensive Test Setup Utilities
import { 
  resetHabitFactoryIds, 
  createMockHabit, 
  createMockHabits, 
  createMockHabitWithData 
} from '../factories/habitFactory';
import { 
  resetUserFactoryIds, 
  createMockUser, 
  createMockAuthUser, 
  createMockUserWithAuth 
} from '../factories/userFactory';
import { 
  resetSocialFactoryIds, 
  createMockSocialNetwork 
} from '../factories/socialFactory';
import { mockFirestore, mockAuth, mockStorage } from '../mocks/firebase';

/**
 * Reset all factory IDs for consistent test data
 */
export const resetAllFactoryIds = (): void => {
  resetHabitFactoryIds();
  resetUserFactoryIds();
  resetSocialFactoryIds();
};

/**
 * Clear all mock data and reset mocks
 */
export const clearAllMockData = (): void => {
  // Clear Firebase mock data
  mockFirestore.clearAll();
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset factory IDs
  resetAllFactoryIds();
  
  // Reset auth state
  mockAuth.currentUser = null;
};

/**
 * Setup test environment with clean state
 */
export const setupTestEnvironment = (): void => {
  // Clear all previous data
  clearAllMockData();
  
  // Setup console mocks to reduce noise in tests
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  };
  
  // Mock Date.now for consistent timestamps
  const mockDate = new Date('2025-01-01T00:00:00Z');
  jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
};

/**
 * Restore test environment
 */
export const restoreTestEnvironment = (): void => {
  // Restore console
  jest.restoreAllMocks();
  
  // Clear all mock data
  clearAllMockData();
};

/**
 * Create a complete test scenario with user, habits, and social data
 */
export const createTestScenario = (options: {
  userId?: string;
  habitCount?: number;
  friendCount?: number;
  withAuth?: boolean;
} = {}) => {
  const {
    userId = 'test-user-123',
    habitCount = 5,
    friendCount = 3,
    withAuth = true
  } = options;
  
  // Create user data
  const user = createMockUser({ id: userId });
  const authUser = withAuth ? createMockAuthUser({ uid: userId, email: user.email }) : null;
  
  // Create habits with completions and streaks
  const habitsWithData = Array.from({ length: habitCount }, () => 
    createMockHabitWithData({ userId }, 7)
  );
  
  const habits = habitsWithData.map(h => h.habit);
  const completions = habitsWithData.flatMap(h => h.completions);
  const streaks = habitsWithData.map(h => h.streak);
  
  // Create social network
  const socialNetwork = createMockSocialNetwork(userId);
  
  // Setup mock data in Firebase
  if (withAuth) {
    mockAuth.currentUser = authUser;
    mockFirestore.setMockData('users', { [userId]: user });
  }
  
  mockFirestore.setMockData('habits', 
    habits.reduce((acc, habit) => ({ ...acc, [habit.id]: habit }), {})
  );
  
  mockFirestore.setMockData('completions',
    completions.reduce((acc, completion) => ({ ...acc, [completion.id]: completion }), {})
  );
  
  mockFirestore.setMockData('streaks',
    streaks.reduce((acc, streak) => ({ ...acc, [streak.habitId]: streak }), {})
  );
  
  mockFirestore.setMockData('friends',
    socialNetwork.friends.reduce((acc, friend) => ({ ...acc, [friend.id]: friend }), {})
  );
  
  mockFirestore.setMockData('activities',
    socialNetwork.activities.reduce((acc, activity) => ({ ...acc, [activity.id]: activity }), {})
  );
  
  return {
    user,
    authUser,
    habits,
    completions,
    streaks,
    socialNetwork,
    // Helper functions
    addHabit: (habitData: any = {}) => {
      const newHabit = createMockHabit({ userId, ...habitData });
      const currentHabits = mockFirestore.getMockData('habits') || {};
      mockFirestore.setMockData('habits', { ...currentHabits, [newHabit.id]: newHabit });
      return newHabit;
    },
    removeHabit: (habitId: string) => {
      const currentHabits = mockFirestore.getMockData('habits') || {};
      delete currentHabits[habitId];
      mockFirestore.setMockData('habits', currentHabits);
    },
    addFriend: (friendData: any = {}) => {
      const newFriend = createMockUser(friendData);
      const currentFriends = mockFirestore.getMockData('friends') || {};
      const friendshipId = `${userId}_${newFriend.id}`;
      currentFriends[friendshipId] = {
        id: friendshipId,
        userId,
        friendId: newFriend.id,
        friendEmail: newFriend.email,
        friendName: newFriend.displayName,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockFirestore.setMockData('friends', currentFriends);
      return newFriend;
    }
  };
};

/**
 * Create a minimal test scenario for unit tests
 */
export const createMinimalTestScenario = (userId: string = 'test-user-123') => {
  const user = createMockUser({ id: userId });
  const authUser = createMockAuthUser({ uid: userId, email: user.email });
  
  mockAuth.currentUser = authUser;
  mockFirestore.setMockData('users', { [userId]: user });
  
  return { user, authUser };
};

/**
 * Setup Firebase emulator environment for integration tests
 */
export const setupEmulatorEnvironment = async () => {
  // This would be used with actual Firebase emulators
  // For now, we'll use our mock implementation
  console.log('Setting up emulator environment (using mocks)');
  
  // Initialize mock data
  clearAllMockData();
  
  return {
    cleanup: () => {
      clearAllMockData();
    }
  };
};

/**
 * Test data generators for specific scenarios
 */
export const testDataGenerators = {
  // Generate data for habit completion flow testing
  habitCompletionFlow: (userId: string = 'test-user-123') => {
    const scenario = createTestScenario({ userId, habitCount: 3, withAuth: true });
    return {
      ...scenario,
      incompleteHabit: scenario.habits[0],
      completedHabit: scenario.habits[1],
      streakHabit: scenario.habits[2]
    };
  },
  
  // Generate data for social features testing
  socialFlow: (userId: string = 'test-user-123') => {
    const scenario = createTestScenario({ userId, habitCount: 2, friendCount: 5, withAuth: true });
    return {
      ...scenario,
      mainUser: scenario.user,
      friends: scenario.socialNetwork.friends,
      activities: scenario.socialNetwork.activities
    };
  },
  
  // Generate data for authentication testing
  authFlow: () => {
    const { user, authUser, credentials } = createMockUserWithAuth();
    return {
      user,
      authUser,
      credentials,
      invalidCredentials: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    };
  },
  
  // Generate data for error scenarios
  errorScenarios: (userId: string = 'test-user-123') => {
    const scenario = createMinimalTestScenario(userId);
    
    // Clear some data to simulate missing resources
    mockFirestore.setMockData('habits', {});
    
    return {
      ...scenario,
      missingHabitId: 'non-existent-habit-123',
      invalidUserId: 'invalid-user-456'
    };
  }
};

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  // Create large dataset for performance testing
  createLargeDataset: (userId: string = 'test-user-123', size: number = 100) => {
    const habits = createMockHabits(size, userId);
    const completions = habits.flatMap(habit => 
      Array.from({ length: 30 }, (_, i) => ({
        id: `completion-${habit.id}-${i}`,
        habitId: habit.id,
        userId,
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        value: 1
      }))
    );
    
    return { habits, completions };
  },
  
  // Measure operation performance
  measurePerformance: async <T>(
    operation: () => Promise<T>,
    label: string = 'Operation'
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${label} took ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }
};

/**
 * Test assertion helpers
 */
export const testAssertions = {
  // Assert Firebase mock was called correctly
  expectFirestoreCall: (collection: string, operation: string, times: number = 1) => {
    const mockCollection = mockFirestore.collection as jest.Mock;
    expect(mockCollection).toHaveBeenCalledWith(collection);
    
    // Additional assertions could be added here for specific operations
  },
  
  // Assert auth state
  expectAuthState: (isAuthenticated: boolean, userId?: string) => {
    if (isAuthenticated) {
      expect(mockAuth.currentUser).toBeTruthy();
      if (userId) {
        expect(mockAuth.currentUser.uid).toBe(userId);
      }
    } else {
      expect(mockAuth.currentUser).toBeNull();
    }
  },
  
  // Assert habit data structure
  expectValidHabit: (habit: any) => {
    expect(habit).toHaveProperty('id');
    expect(habit).toHaveProperty('userId');
    expect(habit).toHaveProperty('name');
    expect(habit).toHaveProperty('category');
    expect(habit).toHaveProperty('frequency');
    expect(habit).toHaveProperty('isPublic');
    expect(habit).toHaveProperty('createdAt');
    expect(habit).toHaveProperty('updatedAt');
  }
};