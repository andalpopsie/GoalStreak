import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/theme';
import { LIMITS } from '../constants/limits';
import { useAuth } from '../hooks/useAuth';
import { useHabitsWithSocial } from '../hooks/useHabitsWithSocial'; // Re-enabled social features with error handling
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { OfflineBanner } from '../components/common';
import { SkeletonHabitCard, AnimatedCircularHabitCard, EmptyHabitsState } from '../components/habit';
import CompletionShareModal from '../components/habit/CompletionShareModal';
import friendService from '../services/friendService';
import { photoService } from '../services/photoService';
import { trackScreen, trackEvent, trackFeature } from '../services/enhancedAnalyticsService';

// Analytics helper — keeps toggle handler focused on business logic
function trackHabitToggle(
  habitId: string,
  habit: { name?: string; category?: string } | undefined,
  wasCompleted: boolean,
  streakCount: number,
  userId?: string,
) {
  if (wasCompleted) {
    trackEvent('habit_uncompleted', {
      habit_id: habitId,
      habit_name: habit?.name,
      habit_category: habit?.category,
      user_id: userId,
    });
  } else {
    trackFeature('habit_tracking', 'habit_completed', 1);
    trackEvent('habit_completed', {
      habit_id: habitId,
      habit_name: habit?.name,
      habit_category: habit?.category,
      streak_count: streakCount,
      user_id: userId,
      completion_time: new Date().toISOString(),
    });
    if (streakCount > 0 && [7, 30, 100, 365].includes(streakCount)) {
      trackEvent('streak_milestone_achieved', {
        habit_id: habitId,
        habit_name: habit?.name,
        milestone: streakCount,
        user_id: userId,
      });
    }
  }
}

export default function CleanHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const {
    habits,
    isLoading,
    isCompleting,
    completeHabit,
    uncompleteHabit,
    isHabitCompletedToday,
    getHabitStreak,
    refreshHabits,
    deleteHabit,
  } = useHabitsWithSocial(); // Re-enabled social features with improved error handling
  const networkStatus = useNetworkStatus();

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [completedHabitName, setCompletedHabitName] = useState('');
  const [completedHabitId, setCompletedHabitId] = useState('');
  const [completedHabitCategory, setCompletedHabitCategory] = useState('');
  const [completedHabitIsPublic, setCompletedHabitIsPublic] = useState(true);

  // Track screen view
  useEffect(() => {
    trackScreen('CleanHomeScreen', { source: 'app_navigation' });
    
    // Track user engagement with habits
    if (habits.length > 0) {
      trackEvent('home_screen_viewed', {
        total_habits: habits.length,
        daily_habits: habits.filter(h => h.frequency === 'daily').length,
        user_id: user?.id
      });
    }
  }, [habits.length, user?.id]);

  const todayHabits = habits.filter(habit => habit.frequency === 'daily');
  
  // Memoize deduplication for performance
  const uniqueHabits = useMemo(() => {
    return todayHabits.reduce((acc, current) => {
      const existingIndex = acc.findIndex(habit => habit.name.toLowerCase() === current.name.toLowerCase());
      if (existingIndex >= 0) {
        // Keep the more recent habit
        if (current.createdAt > acc[existingIndex].createdAt) {
          acc[existingIndex] = current;
        }
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as typeof todayHabits);
  }, [todayHabits]);
  
  const completedToday = uniqueHabits.filter(habit => isHabitCompletedToday(habit.id));

  const handleToggleHabit = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      const wasCompleted = isHabitCompletedToday(habitId);
      
      if (wasCompleted) {
        await uncompleteHabit(habitId);
      } else {
        await completeHabit(habitId);

        // Show share modal after completing
        if (habit) {
          setCompletedHabitId(habit.id);
          setCompletedHabitName(habit.name);
          setCompletedHabitCategory(habit.category);
          setCompletedHabitIsPublic(habit.isPublic);
          setShowShareModal(true);
        }
      }

      // Track after state change
      const currentStreak = getHabitStreak(habitId);
      const streakCount = currentStreak
        ? (typeof currentStreak === 'object' ? currentStreak.currentStreak : currentStreak)
        : 0;
      trackHabitToggle(habitId, habit, wasCompleted, streakCount, user?.id);
    } catch (error: any) {
      console.error('Error toggling habit:', error);
      trackEvent('habit_toggle_error', {
        habit_id: habitId,
        error_message: error.message,
        user_id: user?.id
      });
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      await refreshHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit. Please try again.');
    }
  };

  const navigateToCreateHabit = () => {
    // Track navigation attempt
    trackEvent('create_habit_button_clicked', {
      current_habit_count: uniqueHabits.length,
      user_id: user?.id
    });
    
    // Check habit limit before navigation
    if (uniqueHabits.length >= LIMITS.MAX_HABITS) {
      // Track limit reached
      trackEvent('habit_limit_reached', {
        current_habit_count: uniqueHabits.length,
        limit: LIMITS.MAX_HABITS,
        user_id: user?.id
      });
      
      Alert.alert(
        'Habit Limit Reached',
        `You can create up to ${LIMITS.MAX_HABITS} habits to help you stay focused on what matters most! Consider completing your current habits consistently before adding new ones.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      // Track successful navigation
      trackEvent('navigate_to_create_habit', {
        current_habit_count: uniqueHabits.length,
        user_id: user?.id
      });
      navigation.navigate('CreateHabit');
    } catch (error) {
      console.error('Navigation error:', error);
      trackEvent('navigation_error', {
        target_screen: 'CreateHabit',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: user?.id
      });
    }
  };

  const handleShareCompletion = useCallback(async (photoUri?: string, caption?: string) => {
    if (!user?.id) return;
    try {
      let savedPhotoUri: string | undefined;
      if (photoUri) {
        savedPhotoUri = await photoService.saveProfilePhoto(
          `${user.id}_post_${Date.now()}`,
          photoUri
        );
      }

      await friendService.createActivity(
        user.id,
        'habit_completed',
        completedHabitId,
        completedHabitName,
        completedHabitCategory,
        completedHabitIsPublic ? 'friends' : 'private',
        {
          photoUrl: savedPhotoUri,
          caption,
        }
      );
    } catch (error) {
      console.error('Error sharing completion:', error);
    }
    setShowShareModal(false);
  }, [user?.id, completedHabitId, completedHabitName, completedHabitCategory, completedHabitIsPublic]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Offline Banner - integrated into layout */}
      {!networkStatus.isConnected && <OfflineBanner isVisible={true} />}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshHabits} />
        }
        showsVerticalScrollIndicator={false}
        testID="scroll-view"
      >
        {/* Today's Progress */}
        {uniqueHabits.length > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              {completedToday.length} of {uniqueHabits.length} daily habits completed today
            </Text>
          </View>
        )}

        {/* Habits Grid */}
        {isLoading ? (
          <View style={styles.habitsGrid}>
            {/* Show skeleton placeholders while loading */}
            {[1, 2, 3, 4].map((index) => (
              <SkeletonHabitCard key={index} />
            ))}
          </View>
        ) : uniqueHabits.length === 0 ? (
          /* Show empty state when no habits */
          <View testID="empty-habits-state">
            <EmptyHabitsState onCreateHabit={navigateToCreateHabit} />
          </View>
        ) : (
          <Animated.View style={styles.habitsGrid} entering={FadeIn.duration(600)}>
            {/* Show all habits once, regardless of completion status */}
            {uniqueHabits.map((habit, index) => (
              <Animated.View 
                key={habit.id}
                entering={FadeInUp.delay(index * 100).duration(500)}
                style={styles.habitCardContainer}
              >
                <AnimatedCircularHabitCard
                  habit={habit}
                  streak={getHabitStreak(habit.id)}
                  isCompleted={isHabitCompletedToday(habit.id)}
                  isLoading={isCompleting}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              </Animated.View>
            ))}
            
            {/* Add Habit Button - only show if under limit */}
            {uniqueHabits.length < LIMITS.MAX_HABITS && (
              <Animated.View 
                entering={FadeInUp.delay(uniqueHabits.length * 100).duration(500)}
                style={styles.habitCardContainer}
              >
                <TouchableOpacity style={styles.addHabitCard} onPress={navigateToCreateHabit}>
                  <View style={styles.addHabitCircle}>
                    <Ionicons name="add" size={80} color={Colors.primaryText} />
                  </View>
                  <Text style={styles.addHabitText}>Add Habit</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Habit Limit Reached Message */}
            {uniqueHabits.length >= LIMITS.MAX_HABITS && (
              <Animated.View 
                entering={FadeInUp.delay(uniqueHabits.length * 100).duration(500)}
                style={styles.habitCardContainer}
              >
                <View style={styles.limitReachedCard}>
                  <View style={styles.limitReachedCircle}>
                    <Ionicons name="checkmark-done" size={60} color={Colors.accent1} />
                  </View>
                  <Text style={styles.limitReachedText}>All Set! 🎯</Text>
                  <Text style={styles.limitReachedSubtext}>Focus on your {LIMITS.MAX_HABITS} habits</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Completion Share Modal */}
      <CompletionShareModal
        visible={showShareModal}
        habitName={completedHabitName}
        isPublic={completedHabitIsPublic}
        onShare={handleShareCompletion}
        onSkip={() => setShowShareModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  habitCounterSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2 + '20',
  },
  habitCounterText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  habitCounterSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent2,
    marginTop: 2,
  },
  habitCounterLimitText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent1,
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progressText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  habitCardContainer: {
    width: '48%',
    marginBottom: Spacing.xl * 2, // Extra space for timer controls
  },
  addHabitCard: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
  addHabitCircle: {
    width: 140,                      // Match progressRing size
    height: 140,                     // Match progressRing size
    borderRadius: 70,
    backgroundColor: Colors.white,
    borderWidth: 12,                 // Match progressRing borderWidth
    borderColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addHabitText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * 1.2,  // Match habitText lineHeight
  },
  limitReachedCard: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
  limitReachedCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    borderWidth: 12,
    borderColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  limitReachedText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  limitReachedSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent2,
    textAlign: 'center',
    marginTop: 2,
  },
});
