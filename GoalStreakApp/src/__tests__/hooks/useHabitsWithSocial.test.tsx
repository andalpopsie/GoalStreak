import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { mockAuth, mockFirestore } from '../mocks/firebase';
import { createMockUser } from '../factories/userFactory';
import { createMockHabit } from '../factories/habitFactory';

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  isFirebaseConfigured: jest.fn(() => true)
}));

import { useHabitsWithSocial } from '../../hooks/useHabitsWithSocial';
import { AuthProvider } from '../../hooks/useAuth';

// Mock useHabits hook
const mockUseHabits = {
  habits: [] as any[],
  streaks: {},
  todayCompletions: {},
  isLoading: false,
  isCreating: false,
  isCompleting: false,
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  completeHabit: jest.fn(),
  uncompleteHabit: jest.fn(),
  refreshHabits: jest.fn(),
  clearAllHabits: jest.fn(),
  isHabitCompletedToday: jest.fn(),
  getHabitStreak: jest.fn()
};

jest.mock('../../hooks/useHabits', () => ({
  useHabits: () => mockUseHabits
}));

// Mock useFriends hook
const mockUseFriends = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  activityFeed: [],
  socialSettings: {
    userId: 'test-user-id',
    defaultVisibility: 'friends' as const,
    allowFriendRequests: true,
    shareStreakMilestones: true,
    shareHabitCompletions: true,
    shareNewHabits: false,
    notifyOnFriendActivity: true,
    updatedAt: new Date()
  } as any,
  isLoadingFriends: false,
  isLoadingActivity: false,
  isSendingRequest: false,
  isProcessingRequest: false,
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  declineFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  refreshFriends: jest.fn(),
  refreshActivityFeed: jest.fn(),
  loadMoreActivities: jest.fn(),
  updateSocialSettings: jest.fn(),
  shareHabitCompletion: jest.fn(),
  shareStreakMilestone: jest.fn(),
  addReaction: jest.fn(),
  hasMoreActivities: false,
  error: null
};

jest.mock('../../hooks/useFriends', () => ({
  useFriends: () => mockUseFriends
}));

// Mock habit services
jest.mock('../../services/habitService', () => ({
  habitService: {
    getUserHabits: jest.fn(),
    createHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    subscribeToUserHabits: jest.fn()
  },
  completionService: {
    completeHabit: jest.fn(),
    uncompleteHabit: jest.fn(),
    getTodayCompletion: jest.fn()
  },
  streakService: {
    getStreak: jest.fn()
  }
}));

// Mock friend service
jest.mock('../../services/friendService', () => ({
  createUserProfile: jest.fn(() => Promise.resolve())
}));

describe('useHabitsWithSocial Hook', () => {
  const mockUser = createMockUser();

  // Test wrapper component with authenticated user
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.clearAll();
    
    // Set up authenticated user
    mockAuth.currentUser = {
      uid: mockUser.id,
      email: mockUser.email,
      displayName: mockUser.displayName
    };

    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      setTimeout(() => callback(mockAuth.currentUser), 0);
      return jest.fn();
    });

    mockFirestore.setMockData('users', {
      [mockUser.id]: mockUser
    });

    // Reset mock implementations
    mockUseHabits.completeHabit.mockResolvedValue(undefined);
    mockUseHabits.createHabit.mockResolvedValue('new-habit-id');
    mockUseHabits.getHabitStreak.mockReturnValue(null);
    mockUseFriends.shareHabitCompletion.mockResolvedValue(undefined);
    mockUseFriends.shareStreakMilestone.mockResolvedValue(undefined);
  });

  describe('Enhanced Habit Completion with Social Sharing', () => {
    it('should complete habit and share when social sharing is enabled', async () => {
      const habit = createMockHabit();
      const streak = { habitId: habit.id, currentStreak: 5, longestStreak: 10 };

      mockUseHabits.habits = [habit];
      mockUseHabits.getHabitStreak.mockReturnValue(streak);
      mockUseFriends.socialSettings.shareHabitCompletions = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id, 1, 'Great workout!');
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalledWith(habit.id, 1, 'Great workout!');
      expect(mockUseFriends.shareHabitCompletion).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        5
      );
    });

    it('should complete habit without sharing when social sharing is disabled', async () => {
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];
      mockUseFriends.socialSettings.shareHabitCompletions = false;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalledWith(habit.id, undefined, undefined);
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });

    it('should share streak milestones for significant streaks', async () => {
      const habit = createMockHabit();
      const streak = { habitId: habit.id, currentStreak: 30, longestStreak: 30 };

      mockUseHabits.habits = [habit];
      mockUseHabits.getHabitStreak.mockReturnValue(streak);
      mockUseFriends.socialSettings.shareHabitCompletions = true;
      mockUseFriends.socialSettings.shareStreakMilestones = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareHabitCompletion).toHaveBeenCalled();
      expect(mockUseFriends.shareStreakMilestone).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        30
      );
    });

    it('should share milestones for 7, 30, 100 day streaks and multiples of 50', async () => {
      const habit = createMockHabit();
      
      mockUseHabits.habits = [habit];
      mockUseFriends.socialSettings.shareHabitCompletions = true;
      mockUseFriends.socialSettings.shareStreakMilestones = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Test 7-day streak
      mockUseHabits.getHabitStreak.mockReturnValue({ 
        habitId: habit.id, 
        currentStreak: 7, 
        longestStreak: 7 
      });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareStreakMilestone).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        7
      );

      // Test 100-day streak
      mockUseFriends.shareStreakMilestone.mockClear();
      mockUseHabits.getHabitStreak.mockReturnValue({ 
        habitId: habit.id, 
        currentStreak: 100, 
        longestStreak: 100 
      });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareStreakMilestone).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        100
      );

      // Test 150-day streak (multiple of 50)
      mockUseFriends.shareStreakMilestone.mockClear();
      mockUseHabits.getHabitStreak.mockReturnValue({ 
        habitId: habit.id, 
        currentStreak: 150, 
        longestStreak: 150 
      });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareStreakMilestone).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        150
      );
    });

    it('should not share milestones when disabled', async () => {
      const habit = createMockHabit();
      const streak = { habitId: habit.id, currentStreak: 30, longestStreak: 30 };

      mockUseHabits.habits = [habit];
      mockUseHabits.getHabitStreak.mockReturnValue(streak);
      mockUseFriends.socialSettings.shareHabitCompletions = true;
      mockUseFriends.socialSettings.shareStreakMilestones = false;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareHabitCompletion).toHaveBeenCalled();
      expect(mockUseFriends.shareStreakMilestone).not.toHaveBeenCalled();
    });

    it('should handle missing habit gracefully', async () => {
      const habitId = 'non-existent-habit';

      mockUseHabits.habits = [];

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habitId);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalledWith(habitId, undefined, undefined);
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });

    it('should handle habits with invalid data gracefully', async () => {
      const invalidHabit = { ...createMockHabit(), name: '', category: '' };

      mockUseHabits.habits = [invalidHabit];

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(invalidHabit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });

    it('should handle social sharing failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];
      mockUseFriends.socialSettings.shareHabitCompletions = true;
      mockUseFriends.shareHabitCompletion.mockRejectedValue(new Error('Sharing failed'));

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Should not throw error even if sharing fails
      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Social sharing failed (non-critical):',
        'Sharing failed'
      );
      
      consoleSpy.mockRestore();
    });

    it('should prioritize habit completion over social sharing', async () => {
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];
      mockUseHabits.completeHabit.mockRejectedValue(new Error('Completion failed'));
      mockUseFriends.socialSettings.shareHabitCompletions = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await expect(
        act(async () => {
          await result.current.completeHabit(habit.id);
        })
      ).rejects.toThrow('Completion failed');

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });
  });

  describe('Enhanced Habit Creation with Social Sharing', () => {
    it('should create habit successfully', async () => {
      const habitData = {
        name: 'Morning Exercise',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        const habitId = await result.current.createHabit(habitData);
        expect(habitId).toBe('new-habit-id');
      });

      expect(mockUseHabits.createHabit).toHaveBeenCalledWith(habitData);
    });

    it('should handle new habit sharing placeholder', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const habitData = {
        name: 'Morning Exercise',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      mockUseFriends.socialSettings.shareNewHabits = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.createHabit(habitData);
      });

      expect(consoleSpy).toHaveBeenCalledWith('New habit sharing feature coming soon');
      
      consoleSpy.mockRestore();
    });

    it('should handle habit creation errors', async () => {
      const habitData = {
        name: 'Test Habit',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      mockUseHabits.createHabit.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await expect(
        act(async () => {
          await result.current.createHabit(habitData);
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('Social Settings Integration', () => {
    it('should expose social settings from useFriends', () => {
      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      expect(result.current.socialSettings).toEqual(mockUseFriends.socialSettings);
    });

    it('should respect social settings changes', async () => {
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];

      const { result, rerender } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Initially sharing is enabled
      expect(result.current.socialSettings?.shareHabitCompletions).toBe(true);

      // Disable sharing
      mockUseFriends.socialSettings.shareHabitCompletions = false;

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });
  });

  describe('Hook Integration and Data Flow', () => {
    it('should pass through all useHabits properties and methods', () => {
      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Check that all useHabits properties are available
      expect(result.current.habits).toBe(mockUseHabits.habits);
      expect(result.current.streaks).toBe(mockUseHabits.streaks);
      expect(result.current.todayCompletions).toBe(mockUseHabits.todayCompletions);
      expect(result.current.isLoading).toBe(mockUseHabits.isLoading);
      expect(result.current.isCreating).toBe(mockUseHabits.isCreating);
      expect(result.current.isCompleting).toBe(mockUseHabits.isCompleting);

      // Check that non-overridden methods are passed through
      expect(result.current.updateHabit).toBe(mockUseHabits.updateHabit);
      expect(result.current.deleteHabit).toBe(mockUseHabits.deleteHabit);
      expect(result.current.uncompleteHabit).toBe(mockUseHabits.uncompleteHabit);
      expect(result.current.refreshHabits).toBe(mockUseHabits.refreshHabits);
      expect(result.current.clearAllHabits).toBe(mockUseHabits.clearAllHabits);
      expect(result.current.isHabitCompletedToday).toBe(mockUseHabits.isHabitCompletedToday);
      expect(result.current.getHabitStreak).toBe(mockUseHabits.getHabitStreak);
    });

    it('should override completeHabit and createHabit methods', () => {
      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // These should be the enhanced versions, not the original ones
      expect(result.current.completeHabit).not.toBe(mockUseHabits.completeHabit);
      expect(result.current.createHabit).not.toBe(mockUseHabits.createHabit);
    });

    it('should handle missing social settings gracefully', async () => {
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];
      mockUseFriends.socialSettings = null;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      expect(mockUseFriends.shareHabitCompletion).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle streak calculation errors gracefully', async () => {
      const habit = createMockHabit();

      mockUseHabits.habits = [habit];
      mockUseHabits.getHabitStreak.mockImplementation(() => {
        throw new Error('Streak calculation failed');
      });
      mockUseFriends.socialSettings.shareHabitCompletions = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Should not throw error
      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalled();
      // Should still attempt sharing with 0 streak
      expect(mockUseFriends.shareHabitCompletion).toHaveBeenCalledWith(
        habit.id,
        habit.name,
        habit.category,
        0
      );
    });

    it('should handle habit name trimming', async () => {
      const habit = { ...createMockHabit(), name: '  Morning Run  ' };

      mockUseHabits.habits = [habit];
      mockUseFriends.socialSettings.shareHabitCompletions = true;

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      await act(async () => {
        await result.current.completeHabit(habit.id);
      });

      expect(mockUseFriends.shareHabitCompletion).toHaveBeenCalledWith(
        habit.id,
        'Morning Run', // Should be trimmed
        habit.category,
        0
      );
    });

    it('should handle concurrent completion and sharing operations', async () => {
      const habit = createMockHabit();
      const streak = { habitId: habit.id, currentStreak: 7, longestStreak: 10 };

      mockUseHabits.habits = [habit];
      mockUseHabits.getHabitStreak.mockReturnValue(streak);
      mockUseFriends.socialSettings.shareHabitCompletions = true;
      mockUseFriends.socialSettings.shareStreakMilestones = true;

      // Simulate slow completion
      mockUseHabits.completeHabit.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useHabitsWithSocial(), { wrapper });

      // Start multiple completions
      const promises = [
        result.current.completeHabit(habit.id),
        result.current.completeHabit(habit.id),
        result.current.completeHabit(habit.id)
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      expect(mockUseHabits.completeHabit).toHaveBeenCalledTimes(3);
    });
  });
});