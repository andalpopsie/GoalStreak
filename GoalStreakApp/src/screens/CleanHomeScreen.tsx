import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import SkeletonHabitCard from '../components/SkeletonHabitCard';
import AnimatedCircularHabitCard from '../components/AnimatedCircularHabitCard';

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
  } = useHabits();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  const navigateToCreateHabit = () => {
    try {
      navigation.navigate('CreateHabit');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshHabits} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>

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
                />
              </Animated.View>
            ))}
            
            {/* Add Habit Button */}
            <Animated.View 
              entering={FadeInUp.delay(uniqueHabits.length * 100).duration(500)}
              style={styles.habitCardContainer}
            >
              <TouchableOpacity style={styles.addHabitCard} onPress={navigateToCreateHabit}>
                <View style={styles.addHabitCircle}>
                  <Ionicons name="add" size={80} color={Colors.primaryText} />
                </View>
                <Text style={styles.addHabitText}>ADD A HABIT</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* Empty State */}
        {uniqueHabits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptySubtitle}>
              Create your first habit to begin building streaks
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={navigateToCreateHabit}>
              <Text style={styles.createFirstButtonText}>Create Your First Habit</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray.dark,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,  // Montserrat_600SemiBold - cleaner look
    color: Colors.primaryText,
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
    justifyContent: 'center',
  },
  addHabitCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    borderWidth: 12,  // Increased from 8 to 12 for much thicker border
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
    fontFamily: Typography.fontFamily.semibold,  // Montserrat_600SemiBold - matches your preference
    color: Colors.primaryText,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  createFirstButton: {
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  createFirstButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
