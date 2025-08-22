// useHabitsWithSocial - Combines habit tracking with social features
import { useCallback } from 'react';
import { useHabits } from './useHabits';
import { useFriends } from './useFriends';

export const useHabitsWithSocial = () => {
  const habitsHook = useHabits();
  const { shareHabitCompletion, shareStreakMilestone, socialSettings } = useFriends();

  // Enhanced complete habit with social sharing
  const completeHabitWithSharing = useCallback(async (
    habitId: string, 
    value?: number, 
    notes?: string
  ) => {
    try {
      // Complete the habit first
      await habitsHook.completeHabit(habitId, value, notes);
      
      // Get habit details for sharing
      const habit = habitsHook.habits.find(h => h.id === habitId);
      const streak = habitsHook.getHabitStreak(habitId);
      
      if (!habit) return;

      // Share habit completion if enabled
      if (socialSettings?.shareHabitCompletions) {
        await shareHabitCompletion(
          habitId,
          habit.name,
          habit.category,
          streak?.currentStreak
        );
      }

      // Check for streak milestones and share if enabled
      if (streak && socialSettings?.shareStreakMilestones) {
        const streakCount = streak.currentStreak;
        
        // Share milestone for significant streaks
        if (streakCount === 7 || streakCount === 30 || streakCount === 100 || 
            (streakCount > 0 && streakCount % 50 === 0)) {
          await shareStreakMilestone(
            habitId,
            habit.name,
            habit.category,
            streakCount
          );
        }
      }
    } catch (error) {
      console.error('Error completing habit with social sharing:', error);
      throw error;
    }
  }, [
    habitsHook.completeHabit,
    habitsHook.habits,
    habitsHook.getHabitStreak,
    shareHabitCompletion,
    shareStreakMilestone,
    socialSettings
  ]);

  // Enhanced create habit with social sharing
  const createHabitWithSharing = useCallback(async (habitData: any) => {
    try {
      await habitsHook.createHabit(habitData);
      
      // Share new habit creation if enabled
      if (socialSettings?.shareNewHabits) {
        // Note: We'd need to get the created habit ID to share it
        // For now, we'll skip this feature until we can get the created habit
      }
    } catch (error) {
      console.error('Error creating habit with social sharing:', error);
      throw error;
    }
  }, [habitsHook.createHabit, socialSettings]);

  return {
    // All original habits functionality
    ...habitsHook,
    
    // Enhanced functions with social features
    completeHabit: completeHabitWithSharing,
    createHabit: createHabitWithSharing,
    
    // Social-specific data
    socialSettings,
  };
};

export default useHabitsWithSocial;
