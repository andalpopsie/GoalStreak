import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import SkeletonHabitCard from '../components/SkeletonHabitCard';
import AnimatedCircularHabitCard from '../components/AnimatedCircularHabitCard';
import OfflineBanner from '../components/OfflineBanner';
import EmptyHabitsState from '../components/EmptyHabitsState';

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
      if (isHabitCompletedToday(habitId)) {
        await uncompleteHabit(habitId);
      } else {
        await completeHabit(habitId);
      }
    } catch (error: any) {
      console.error('Error toggling habit:', error);
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
    // Check habit limit before navigation
    if (uniqueHabits.length >= LIMITS.MAX_HABITS) {
      Alert.alert(
        'Habit Limit Reached',
        `You can create up to ${LIMITS.MAX_HABITS} habits to help you stay focused on what matters most! Consider completing your current habits consistently before adding new ones.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      navigation.navigate('CreateHabit');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

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
      >
        {/* Today's Progress */}
        {uniqueHabits.length > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              {completedToday.length} of {uniqueHabits.length} habits completed today
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
          <EmptyHabitsState onCreateHabit={navigateToCreateHabit} />
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
    marginBottom: Spacing.lg,
  },
  addHabitCard: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
  addHabitCircle: {
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
  addHabitText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
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
