import { useState, useEffect, useCallback } from 'react';
import { habitService, completionService, streakService } from '../services/habitService';
import { useAuth } from './useAuth';
import { Habit, HabitCompletion, Streak, CreateHabitForm } from '../types';

interface UseHabitsReturn {
  // Data
  habits: Habit[];
  streaks: Record<string, Streak>;
  todayCompletions: Record<string, HabitCompletion>;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isCompleting: boolean;
  
  // Actions
  createHabit: (habitData: CreateHabitForm) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string, value?: number, notes?: string) => Promise<void>;
  uncompleteHabit: (habitId: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  
  // Utilities
  isHabitCompletedToday: (habitId: string) => boolean;
  getHabitStreak: (habitId: string) => Streak | null;
}

export function useHabits(): UseHabitsReturn {
  const { user } = useAuth();
  
  // State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [todayCompletions, setTodayCompletions] = useState<Record<string, HabitCompletion>>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load habits and related data
  const loadHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setStreaks({});
      setTodayCompletions({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load habits
      const userHabits = await habitService.getUserHabits(user.id);
      setHabits(userHabits);
      
      // Load streaks and today's completions for each habit
      const streaksData: Record<string, Streak> = {};
      const completionsData: Record<string, HabitCompletion> = {};
      
      await Promise.all(
        userHabits.map(async (habit) => {
          // Load streak
          const streak = await streakService.getStreak(habit.id);
          if (streak) {
            streaksData[habit.id] = streak;
          }
          
          // Load today's completion
          const completion = await completionService.getTodayCompletion(habit.id, user.id);
          if (completion) {
            completionsData[habit.id] = completion;
          }
        })
      );
      
      setStreaks(streaksData);
      setTodayCompletions(completionsData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load habits on mount and when user changes
  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Set up real-time subscription for habits
  useEffect(() => {
    if (!user) return;

    const unsubscribe = habitService.subscribeToUserHabits(user.id, (updatedHabits) => {
      setHabits(updatedHabits);
    });

    return unsubscribe;
  }, [user]);

  // Create new habit
  const createHabit = useCallback(async (habitData: CreateHabitForm) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setIsCreating(true);
      const habitId = await habitService.createHabit(user.id, habitData);
      await loadHabits(); // Refresh to get streak data
    } catch (error) {
      console.error('Error in createHabit:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [user, loadHabits]);

  // Update habit
  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    try {
      await habitService.updateHabit(habitId, updates);
      // Habits will be updated via real-time subscription
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  }, []);

  // Delete habit
  const deleteHabit = useCallback(async (habitId: string) => {
    try {
      await habitService.deleteHabit(habitId);
      // Remove from local state immediately
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setStreaks(prev => {
        const newStreaks = { ...prev };
        delete newStreaks[habitId];
        return newStreaks;
      });
      setTodayCompletions(prev => {
        const newCompletions = { ...prev };
        delete newCompletions[habitId];
        return newCompletions;
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }, []);

  // Complete habit
  const completeHabit = useCallback(async (habitId: string, value?: number, notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsCompleting(true);
      await completionService.completeHabit(habitId, user.id, value, notes);
      
      // Refresh data to get updated streak and completion
      const [completion, streak] = await Promise.all([
        completionService.getTodayCompletion(habitId, user.id),
        streakService.getStreak(habitId)
      ]);
      
      if (completion) {
        setTodayCompletions(prev => ({ ...prev, [habitId]: completion }));
      }
      
      if (streak) {
        setStreaks(prev => ({ ...prev, [habitId]: streak }));
      }
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  }, [user]);

  // Uncomplete habit
  const uncompleteHabit = useCallback(async (habitId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsCompleting(true);
      await completionService.uncompleteHabit(habitId, user.id);
      
      // Remove from local state and refresh streak
      setTodayCompletions(prev => {
        const newCompletions = { ...prev };
        delete newCompletions[habitId];
        return newCompletions;
      });
      
      const streak = await streakService.getStreak(habitId);
      if (streak) {
        setStreaks(prev => ({ ...prev, [habitId]: streak }));
      }
    } catch (error) {
      console.error('Error uncompleting habit:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  }, [user]);

  // Refresh habits
  const refreshHabits = useCallback(async () => {
    await loadHabits();
  }, [loadHabits]);

  // Utility functions
  const isHabitCompletedToday = useCallback((habitId: string) => {
    return habitId in todayCompletions;
  }, [todayCompletions]);

  const getHabitStreak = useCallback((habitId: string) => {
    return streaks[habitId] || null;
  }, [streaks]);

  return {
    // Data
    habits,
    streaks,
    todayCompletions,
    
    // Loading states
    isLoading,
    isCreating,
    isCompleting,
    
    // Actions
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    refreshHabits,
    
    // Utilities
    isHabitCompletedToday,
    getHabitStreak,
  };
}
