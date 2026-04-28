// useHabitsWithSocial - Combines habit tracking with social features
import { useCallback, useMemo } from 'react';
import { useHabits } from './useHabits';
import { useFriends } from './useFriends';
import { useAuth } from './useAuth';
import groupService from '../services/groupService';

export const useHabitsWithSocial = () => {
  const habitsHook = useHabits();
  const { shareHabitCompletion, shareStreakMilestone, socialSettings } = useFriends();
  const { user } = useAuth();

  // Deduplicated daily habits — keeps the most recent when names collide
  const uniqueDailyHabits = useMemo(() => {
    const dailyHabits = habitsHook.habits.filter(h => h.frequency === 'daily');
    return dailyHabits.reduce((acc, current) => {
      const existingIndex = acc.findIndex(
        habit => habit.name.toLowerCase() === current.name.toLowerCase()
      );
      if (existingIndex >= 0) {
        if (current.createdAt > acc[existingIndex].createdAt) {
          acc[existingIndex] = current;
        }
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as typeof dailyHabits);
  }, [habitsHook.habits]);

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

      // ✅ Check if habit is public before sharing
      if (!habit.isPublic) {
        console.log('Habit is private, skipping social sharing');
        return;
      }

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
      console.log('Social sharing failed (non-critical):', socialError instanceof Error ? socialError.message : String(socialError));
    }

    // Post group activities for tracked habits (non-critical)
    try {
      if (!user?.id) return;

      const habit = habitsHook.habits?.find(h => h?.id === habitId);
      if (!habit?.name || !habit?.category) return;

      const trackedHabits = await groupService.getTrackedHabitsByHabitId(habitId, user.id);
      if (trackedHabits.length === 0) return;

      const streak = habitsHook.getHabitStreak(habitId);
      const streakCount = streak?.currentStreak || 0;

      for (const tracked of trackedHabits) {
        // Post habit_completed activity
        await groupService.createGroupActivity(tracked.groupId, user.id, 'habit_completed', {
          habitId,
          habitName: habit.name.trim(),
          habitCategory: habit.category,
          streakCount,
        });

        // Post streak_milestone activity if applicable
        if (streakCount === 7 || streakCount === 30 || streakCount === 100 || (streakCount > 0 && streakCount % 50 === 0)) {
          await groupService.createGroupActivity(tracked.groupId, user.id, 'streak_milestone', {
            habitId,
            habitName: habit.name.trim(),
            habitCategory: habit.category,
            streakCount,
          });
        }
      }
    } catch (groupError) {
      // Group activity posting failures are non-critical
      console.log('Group activity posting failed (non-critical):', groupError instanceof Error ? groupError.message : String(groupError));
    }
  }, [habitsHook.completeHabit, habitsHook.habits, habitsHook.getHabitStreak, shareHabitCompletion, shareStreakMilestone, socialSettings, user?.id]);

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
    uniqueDailyHabits,
    completeHabit: completeHabitWithSharing,
    createHabit: createHabitWithSharing,
    socialSettings,
  };
};

export default useHabitsWithSocial;
