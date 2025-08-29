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
    // Complete the habit first - this is the critical operation
    await habitsHook.completeHabit(habitId, value, notes);
    
    // Try social sharing but don't let it break the main flow
    try {
      if (!socialSettings?.shareHabitCompletions) return;

      const habit = habitsHook.habits?.find(h => h?.id === habitId);
      if (!habit?.name || !habit?.category) return;

      const streak = habitsHook.getHabitStreak(habitId);

      // Share habit completion
      await shareHabitCompletion(habitId, habit.name.trim(), habit.category, streak?.currentStreak || 0);

      // Check for streak milestones
      if (socialSettings?.shareStreakMilestones && streak?.currentStreak) {
        const streakCount = streak.currentStreak;
        if (streakCount === 7 || streakCount === 30 || streakCount === 100 || (streakCount % 50 === 0)) {
          await shareStreakMilestone(habitId, habit.name.trim(), habit.category, streakCount);
        }
      }
    } catch (socialError) {
      // Social sharing failures are non-critical
      console.log('Social sharing failed (non-critical):', socialError.message);
    }
  }, [habitsHook.completeHabit, habitsHook.habits, habitsHook.getHabitStreak, shareHabitCompletion, shareStreakMilestone, socialSettings]);

  // Enhanced create habit with social sharing
  const createHabitWithSharing = useCallback(async (habitData: any) => {
    const newHabitId = await habitsHook.createHabit(habitData);
    
    // Social sharing for new habits (placeholder for future implementation)
    if (socialSettings?.shareNewHabits && habitData?.name) {
      console.log('New habit sharing feature coming soon');
    }
    
    return newHabitId;
  }, [habitsHook.createHabit, socialSettings]);

  return {
    ...habitsHook,
    completeHabit: completeHabitWithSharing,
    createHabit: createHabitWithSharing,
    socialSettings,
  };
};

export default useHabitsWithSocial;
