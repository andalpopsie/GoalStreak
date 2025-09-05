import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { habitService, completionService, streakService } from '../services/habitService';
import { useAuth } from './useAuth';
import { useTimer } from '../contexts/TimerContext';
import { Habit, HabitCompletion, Streak, CreateHabitForm } from '../types';
import { TimerState } from '../types/timer';
import { LIMITS } from '../constants/limits';

interface UseHabitsReturn {
  // Data
  habits: Habit[];
  streaks: Record<string, Streak>;
  todayCompletions: Record<string, HabitCompletion>;
  
  // Timer integration
  activeTimers: Record<string, TimerState>;
  timerSessions: any[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isCompleting: boolean;
  isTimerLoading: boolean;
  
  // Actions
  createHabit: (habitData: CreateHabitForm) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string, value?: number, notes?: string) => Promise<void>;
  uncompleteHabit: (habitId: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  clearAllHabits: () => Promise<void>; // TEMPORARY: For testing
  
  // Timer actions
  startHabitTimer: (habitId: string, duration: number) => Promise<void>;
  pauseHabitTimer: (habitId: string) => Promise<void>;
  resumeHabitTimer: (habitId: string) => Promise<void>;
  resetHabitTimer: (habitId: string) => Promise<void>;
  completeHabitTimer: (habitId: string) => Promise<void>;
  
  // Utilities
  isHabitCompletedToday: (habitId: string) => boolean;
  getHabitStreak: (habitId: string) => Streak | null;
  getHabitTimer: (habitId: string) => TimerState | null;
  hasActiveTimer: (habitId: string) => boolean;
}

export function useHabits(): UseHabitsReturn {
  const { user } = useAuth();
  
  // Timer context integration
  const {
    activeTimers,
    timerSessions,
    isLoading: isTimerLoading,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimer,
    updateTimerProgress
  } = useTimer();
  
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

  // Set up timer progress updates
  useEffect(() => {
    if (Object.keys(activeTimers).length === 0) {
      return;
    }

    // Update timer progress every second for active timers
    const progressInterval = setInterval(() => {
      Object.keys(activeTimers).forEach(habitId => {
        const timer = activeTimers[habitId];
        if (timer.isActive && !timer.isPaused) {
          updateTimerProgress(habitId);
        }
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
    };
  }, [activeTimers, updateTimerProgress]);

  // Set up timer completion event listener
  useEffect(() => {
    const handleTimerCompletion = async (event: any) => {
      // DeviceEventEmitter passes data directly, not in event.detail
      const { habitId, completedInBackground, completionMethod, timestamp } = event;
      

      if (!user) {
        console.warn('No user available for timer completion');
        return;
      }

      try {
        // Check if habit is already completed today
        const existingCompletion = await completionService.getTodayCompletion(habitId, user.id);
        if (existingCompletion) {
          return;
        }
        
        // Complete the habit automatically when timer finishes
        await completeHabitViaTimer(habitId);
        
      } catch (error) {
        console.error('Error handling timer completion event:', error);
      }
    };

    // Listen for timer completion events using React Native's DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener('timerHabitCompletion', handleTimerCompletion);
    
    return () => {
      subscription.remove();
    };
  }, [user]);

  // Create new habit
  const createHabit = useCallback(async (habitData: CreateHabitForm) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check habit limit (6 habits for initial launch)
    if (habits.length >= LIMITS.MAX_HABITS) {
      throw new Error(`You can create up to ${LIMITS.MAX_HABITS} habits. This helps you stay focused on what matters most!`);
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
  }, [user, loadHabits, habits.length]);

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
      
      // If there's an active timer for this habit, complete it first
      if (activeTimers[habitId]) {
        await completeTimer(habitId);
      }
      
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
  }, [user, activeTimers, completeTimer]);

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

  // TEMPORARY: Clear all habits (for testing)
  const clearAllHabits = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await habitService.clearAllHabits(user.id);
      await loadHabits(); // Refresh to show empty state
    } catch (error) {
      console.error('Error clearing all habits:', error);
      throw error;
    }
  }, [user, loadHabits]);

  // Timer-related methods
  const startHabitTimer = useCallback(async (habitId: string, duration: number) => {
    try {
      await startTimer(habitId, duration);
    } catch (error) {
      console.error('Error starting habit timer:', error);
      throw error;
    }
  }, [startTimer]);

  const pauseHabitTimer = useCallback(async (habitId: string) => {
    try {
      await pauseTimer(habitId);
    } catch (error) {
      console.error('Error pausing habit timer:', error);
      throw error;
    }
  }, [pauseTimer]);

  const resumeHabitTimer = useCallback(async (habitId: string) => {
    try {
      await resumeTimer(habitId);
    } catch (error) {
      console.error('Error resuming habit timer:', error);
      throw error;
    }
  }, [resumeTimer]);

  const resetHabitTimer = useCallback(async (habitId: string) => {
    try {
      await resetTimer(habitId);
    } catch (error) {
      console.error('Error resetting habit timer:', error);
      throw error;
    }
  }, [resetTimer]);

  const completeHabitTimer = useCallback(async (habitId: string) => {
    try {
      // Complete the timer first
      await completeTimer(habitId);
      
      // Then complete the habit automatically
      await completeHabit(habitId);
    } catch (error) {
      console.error('Error completing habit timer:', error);
      throw error;
    }
  }, [completeTimer, completeHabit]);

  // Complete habit via timer (internal method for timer completion events)
  const completeHabitViaTimer = useCallback(async (habitId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsCompleting(true);
      
      // Get the timer session ID if available
      let timerSessionId: string | undefined;
      
      // Try to get the most recent timer session for this habit
      try {
        const { timerSessionService } = await import('../services/timerService');
        const sessions = await timerSessionService.getHabitTimerSessions(habitId);
        const recentSession = sessions.find(session => 
          session.completed && 
          session.completionMethod === 'timer' &&
          // Session completed within the last 5 minutes
          new Date().getTime() - new Date(session.createdAt).getTime() < 5 * 60 * 1000
        );
        
        if (recentSession) {
          timerSessionId = recentSession.id;
        }
      } catch (error) {
        console.error('Error getting timer session for completion:', error);
        // Continue without timer session ID
      }
      
      // Complete the habit with timer session reference
      await completionService.completeHabit(habitId, user.id, undefined, 'Completed via timer', timerSessionId);
      
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
      console.error('Error completing habit via timer:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  }, [user]);

  // Utility functions
  const isHabitCompletedToday = useCallback((habitId: string) => {
    return habitId in todayCompletions;
  }, [todayCompletions]);

  const getHabitStreak = useCallback((habitId: string) => {
    return streaks[habitId] || null;
  }, [streaks]);

  const getHabitTimer = useCallback((habitId: string) => {
    return activeTimers[habitId] || null;
  }, [activeTimers]);

  const hasActiveTimer = useCallback((habitId: string) => {
    return habitId in activeTimers && activeTimers[habitId].isActive;
  }, [activeTimers]);

  return {
    // Data
    habits,
    streaks,
    todayCompletions,
    
    // Timer integration
    activeTimers,
    timerSessions,
    
    // Loading states
    isLoading,
    isCreating,
    isCompleting,
    isTimerLoading,
    
    // Actions
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    refreshHabits,
    clearAllHabits, // TEMPORARY: For testing
    
    // Timer actions
    startHabitTimer,
    pauseHabitTimer,
    resumeHabitTimer,
    resetHabitTimer,
    completeHabitTimer,
    
    // Utilities
    isHabitCompletedToday,
    getHabitStreak,
    getHabitTimer,
    hasActiveTimer,
  };
}
