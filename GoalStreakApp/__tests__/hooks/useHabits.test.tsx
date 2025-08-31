import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { mockAuth, mockFirestore } from '../mocks/firebase';
import { createMockUser } from '../factories/userFactory';
import { createMockHabit } from '../factories/habitFactory';
import { LIMITS } from '../../constants/limits';

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  isFirebaseConfigured: jest.fn(() => true)
}));

import { useHabits } from '../../hooks/useHabits';
import { AuthProvider } from '../../hooks/useAuth';
import { habitService, completionService, streakService } from '../../services/habitService';

// Get references to mocked services
const mockHabitService = habitService as jest.Mocked<typeof habitService>;
const mockCompletionService = completionService as jest.Mocked<typeof completionService>;
const mockStreakService = streakService as jest.Mocked<typeof streakService>;

// Mock habit services
jest.mock('../../services/habitService', () => ({
  habitService: {
    getUserHabits: jest.fn(),
    createHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    subscribeToUserHabits: jest.fn(),
    clearAllHabits: jest.fn()
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

describe('useHabits Hook', () => {
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
    mockHabitService.getUserHabits.mockResolvedValue([]);
    mockHabitService.subscribeToUserHabits.mockReturnValue(jest.fn());
    mockCompletionService.getTodayCompletion.mockResolvedValue(null);
    mockStreakService.getStreak.mockResolvedValue(null);
  });

  describe('Habit Loading and Management', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useHabits(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.habits).toEqual([]);
      expect(result.current.streaks).toEqual({});
      expect(result.current.todayCompletions).toEqual({});
    });

    it('should load user habits on mount', async () => {
      const mockHabits = [createMockHabit(), createMockHabit()];
      const mockStreaks = {
        [mockHabits[0].id]: { habitId: mockHabits[0].id, currentStreak: 5, longestStreak: 10 },
        [mockHabits[1].id]: { habitId: mockHabits[1].id, currentStreak: 3, longestStreak: 7 }
      };

      mockHabitService.getUserHabits.mockResolvedValue(mockHabits);
      mockStreakService.getStreak
        .mockResolvedValueOnce(mockStreaks[mockHabits[0].id])
        .mockResolvedValueOnce(mockStreaks[mockHabits[1].id]);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.habits).toEqual(mockHabits);
      expect(result.current.streaks).toEqual(mockStreaks);
      expect(mockHabitService.getUserHabits).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle empty habits list', async () => {
      mockHabitService.getUserHabits.mockResolvedValue([]);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.habits).toEqual([]);
      expect(result.current.streaks).toEqual({});
      expect(result.current.todayCompletions).toEqual({});
    });

    it('should handle loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockHabitService.getUserHabits.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.habits).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading habits:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should clear data when user logs out', async () => {
      // Start with authenticated user and habits
      const mockHabits = [createMockHabit()];
      mockHabitService.getUserHabits.mockResolvedValue(mockHabits);

      const { result, rerender } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.habits.length).toBeGreaterThan(0);
      });

      // Simulate user logout
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      rerender({});

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.habits).toEqual([]);
      expect(result.current.streaks).toEqual({});
      expect(result.current.todayCompletions).toEqual({});
    });
  });

  describe('Real-time Updates and Data Synchronization', () => {
    it('should set up real-time subscription for habits', async () => {
      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHabitService.subscribeToUserHabits).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Function)
      );
    });

    it('should update habits when real-time data changes', async () => {
      let subscriptionCallback: ((habits: any[]) => void) | null = null;
      
      mockHabitService.subscribeToUserHabits.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate real-time update
      const updatedHabits = [createMockHabit(), createMockHabit()];
      
      act(() => {
        if (subscriptionCallback) {
          subscriptionCallback(updatedHabits);
        }
      });

      expect(result.current.habits).toEqual(updatedHabits);
    });

    it('should clean up subscription on unmount', async () => {
      const unsubscribeMock = jest.fn();
      mockHabitService.subscribeToUserHabits.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(mockHabitService.subscribeToUserHabits).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Habit Creation', () => {
    it('should create new habit successfully', async () => {
      const habitData = {
        name: 'Morning Exercise',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      const newHabitId = 'new-habit-id';
      mockHabitService.createHabit.mockResolvedValue(newHabitId);
      mockHabitService.getUserHabits.mockResolvedValue([
        { ...habitData, id: newHabitId, userId: mockUser.id, createdAt: new Date(), updatedAt: new Date() }
      ]);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createHabit(habitData);
      });

      expect(mockHabitService.createHabit).toHaveBeenCalledWith(mockUser.id, habitData);
      expect(result.current.isCreating).toBe(false);
    });

    it('should handle habit creation errors', async () => {
      const habitData = {
        name: 'Test Habit',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      mockHabitService.createHabit.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createHabit(habitData);
        })
      ).rejects.toThrow('Creation failed');

      expect(result.current.isCreating).toBe(false);
    });

    it('should enforce habit limit', async () => {
      // Set up user with maximum habits
      const maxHabits = Array.from({ length: LIMITS.MAX_HABITS }, () => createMockHabit());
      mockHabitService.getUserHabits.mockResolvedValue(maxHabits);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.habits.length).toBe(LIMITS.MAX_HABITS);
      });

      const habitData = {
        name: 'New Habit',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      await expect(
        act(async () => {
          await result.current.createHabit(habitData);
        })
      ).rejects.toThrow(`You can create up to ${LIMITS.MAX_HABITS} habits`);
    });

    it('should handle unauthenticated user during creation', async () => {
      // Set up unauthenticated state
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const habitData = {
        name: 'Test Habit',
        category: 'fitness' as const,
        frequency: 'daily' as const,
        isPublic: false
      };

      await expect(
        act(async () => {
          await result.current.createHabit(habitData);
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Habit Updates and Deletion', () => {
    it('should update habit successfully', async () => {
      const habit = createMockHabit();
      const updates = { name: 'Updated Habit Name' };

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateHabit(habit.id, updates);
      });

      expect(mockHabitService.updateHabit).toHaveBeenCalledWith(habit.id, updates);
    });

    it('should handle update errors', async () => {
      const habit = createMockHabit();
      const updates = { name: 'Updated Name' };

      mockHabitService.updateHabit.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateHabit(habit.id, updates);
        })
      ).rejects.toThrow('Update failed');
    });

    it('should delete habit successfully', async () => {
      const habit = createMockHabit();
      
      // Set up initial state with habit
      mockHabitService.getUserHabits.mockResolvedValue([habit]);
      mockStreakService.getStreak.mockResolvedValue({
        habitId: habit.id,
        currentStreak: 5,
        longestStreak: 10
      });

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.habits.length).toBe(1);
      });

      await act(async () => {
        await result.current.deleteHabit(habit.id);
      });

      expect(mockHabitService.deleteHabit).toHaveBeenCalledWith(habit.id);
      expect(result.current.habits).toEqual([]);
      expect(result.current.streaks[habit.id]).toBeUndefined();
      expect(result.current.todayCompletions[habit.id]).toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      const habit = createMockHabit();
      mockHabitService.deleteHabit.mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteHabit(habit.id);
        })
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('Habit Completion and Streaks', () => {
    it('should complete habit successfully', async () => {
      const habit = createMockHabit();
      const completion = {
        id: 'completion-id',
        habitId: habit.id,
        userId: mockUser.id,
        completedAt: new Date()
      };
      const streak = {
        habitId: habit.id,
        currentStreak: 6,
        longestStreak: 10
      };

      mockCompletionService.getTodayCompletion.mockResolvedValue(completion);
      mockStreakService.getStreak.mockResolvedValue(streak);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.completeHabit(habit.id, 1, 'Great workout!');
      });

      expect(mockCompletionService.completeHabit).toHaveBeenCalledWith(
        habit.id,
        mockUser.id,
        1,
        'Great workout!'
      );
      expect(result.current.todayCompletions[habit.id]).toEqual(completion);
      expect(result.current.streaks[habit.id]).toEqual(streak);
      expect(result.current.isCompleting).toBe(false);
    });

    it('should handle completion errors', async () => {
      const habit = createMockHabit();
      mockCompletionService.completeHabit.mockRejectedValue(new Error('Already completed'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.completeHabit(habit.id);
        })
      ).rejects.toThrow('Already completed');

      expect(result.current.isCompleting).toBe(false);
    });

    it('should uncomplete habit successfully', async () => {
      const habit = createMockHabit();
      const updatedStreak = {
        habitId: habit.id,
        currentStreak: 4,
        longestStreak: 10
      };

      mockStreakService.getStreak.mockResolvedValue(updatedStreak);

      // Set up initial completion
      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add completion to state
      act(() => {
        result.current.todayCompletions[habit.id] = {
          id: 'completion-id',
          habitId: habit.id,
          userId: mockUser.id,
          completedAt: new Date()
        };
      });

      await act(async () => {
        await result.current.uncompleteHabit(habit.id);
      });

      expect(mockCompletionService.uncompleteHabit).toHaveBeenCalledWith(habit.id, mockUser.id);
      expect(result.current.todayCompletions[habit.id]).toBeUndefined();
      expect(result.current.streaks[habit.id]).toEqual(updatedStreak);
      expect(result.current.isCompleting).toBe(false);
    });

    it('should handle unauthenticated user during completion', async () => {
      // Set up unauthenticated state
      mockAuth.currentUser = null;
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.completeHabit('habit-id');
        })
      ).rejects.toThrow('User not authenticated');

      await expect(
        act(async () => {
          await result.current.uncompleteHabit('habit-id');
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Offline Behavior and Data Persistence', () => {
    it('should handle offline state gracefully', async () => {
      // Simulate network error
      mockHabitService.getUserHabits.mockRejectedValue(new Error('Network request failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.habits).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading habits:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should retry operations after network recovery', async () => {
      const habit = createMockHabit();
      
      // First call fails, second succeeds
      mockHabitService.getUserHabits
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([habit]);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Retry loading
      await act(async () => {
        await result.current.refreshHabits();
      });

      expect(result.current.habits).toEqual([habit]);
    });
  });

  describe('Utility Functions', () => {
    it('should check if habit is completed today', async () => {
      const habit = createMockHabit();
      const completion = {
        id: 'completion-id',
        habitId: habit.id,
        userId: mockUser.id,
        completedAt: new Date()
      };

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially not completed
      expect(result.current.isHabitCompletedToday(habit.id)).toBe(false);

      // Add completion
      act(() => {
        result.current.todayCompletions[habit.id] = completion;
      });

      expect(result.current.isHabitCompletedToday(habit.id)).toBe(true);
    });

    it('should get habit streak data', async () => {
      const habit = createMockHabit();
      const streak = {
        habitId: habit.id,
        currentStreak: 5,
        longestStreak: 10
      };

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially no streak
      expect(result.current.getHabitStreak(habit.id)).toBe(null);

      // Add streak
      act(() => {
        result.current.streaks[habit.id] = streak;
      });

      expect(result.current.getHabitStreak(habit.id)).toEqual(streak);
    });

    it('should refresh habits data', async () => {
      const habits = [createMockHabit(), createMockHabit()];
      mockHabitService.getUserHabits.mockResolvedValue(habits);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshHabits();
      });

      expect(mockHabitService.getUserHabits).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    });

    it('should clear all habits', async () => {
      const habits = [createMockHabit()];
      mockHabitService.getUserHabits
        .mockResolvedValueOnce(habits)
        .mockResolvedValueOnce([]); // After clearing

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.habits.length).toBe(1);
      });

      await act(async () => {
        await result.current.clearAllHabits();
      });

      expect(mockHabitService.clearAllHabits).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Error Handling and Retry Mechanisms', () => {
    it('should handle service errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockCompletionService.completeHabit.mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.completeHabit('habit-id');
        })
      ).rejects.toThrow('Service error');

      expect(consoleSpy).toHaveBeenCalledWith('Error completing habit:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should maintain loading states during operations', async () => {
      let resolveCreate: (value: string) => void;
      const createPromise = new Promise<string>((resolve) => {
        resolveCreate = resolve;
      });

      mockHabitService.createHabit.mockReturnValue(createPromise);

      const { result } = renderHook(() => useHabits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start creation
      act(() => {
        result.current.createHabit({
          name: 'Test Habit',
          category: 'fitness',
          frequency: 'daily',
          isPublic: false
        });
      });

      expect(result.current.isCreating).toBe(true);

      // Complete creation
      act(() => {
        resolveCreate!('new-habit-id');
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });
  });
});