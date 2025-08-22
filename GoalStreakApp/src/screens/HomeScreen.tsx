import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import HabitCard from '../components/HabitCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    habits,
    streaks,
    isLoading,
    isCompleting,
    completeHabit,
    uncompleteHabit,
    isHabitCompletedToday,
    getHabitStreak,
    refreshHabits,
  } = useHabits();

  const todayHabits = habits.filter(habit => habit.frequency === 'daily');
  const completedToday = todayHabits.filter(habit => isHabitCompletedToday(habit.id));
  const pendingHabits = todayHabits.filter(habit => !isHabitCompletedToday(habit.id));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTotalStreak = () => {
    return Object.values(streaks).reduce((total, streak) => total + streak.currentStreak, 0);
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);
    } catch (error: any) {
      console.error('Error completing habit:', error);
    }
  };

  const handleUncompleteHabit = async (habitId: string) => {
    try {
      await uncompleteHabit(habitId);
    } catch (error: any) {
      console.error('Error uncompleting habit:', error);
    }
  };

  const navigateToCreateHabit = () => {
    try {
      navigation.navigate('CreateHabit');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const navigateToHabits = () => {
    console.log('🔍 navigateToHabits called');
    try {
      navigation.navigate('Habits');
      console.log('✅ Navigation to Habits initiated');
    } catch (error) {
      console.error('❌ Navigation error:', error);
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Test Button for Debugging */}
            <TouchableOpacity 
              onPress={() => {
                console.log('🔍 Test button pressed!');
                alert('Test button works!');
              }} 
              style={[styles.addButton, { backgroundColor: Colors.accent2, marginRight: 8 }]}
            >
              <Ionicons name="bug" size={20} color={Colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={navigateToCreateHabit} style={styles.addButton}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedToday.length}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{habits.length}</Text>
            <Text style={styles.statLabel}>Active Habits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTotalStreak()}</Text>
            <Text style={styles.statLabel}>Total Streaks</Text>
          </View>
        </View>

        {/* Today's Habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Habits</Text>
            {habits.length > 0 && (
              <TouchableOpacity onPress={navigateToHabits}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading && habits.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your habits...</Text>
            </View>
          ) : todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.accent2} />
              <Text style={styles.emptyStateTitle}>No habits yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first habit to start building streaks!
              </Text>
              <TouchableOpacity onPress={navigateToCreateHabit} style={styles.createFirstButton}>
                <Text style={styles.createFirstButtonText}>Create Your First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pending Habits */}
              {pendingHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  streak={getHabitStreak(habit.id)}
                  isCompleted={false}
                  isLoading={isCompleting}
                  onComplete={() => handleCompleteHabit(habit.id)}
                  onUncomplete={() => handleUncompleteHabit(habit.id)}
                />
              ))}

              {/* Completed Habits */}
              {completedToday.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  streak={getHabitStreak(habit.id)}
                  isCompleted={true}
                  isLoading={isCompleting}
                  onComplete={() => handleCompleteHabit(habit.id)}
                  onUncomplete={() => handleUncompleteHabit(habit.id)}
                />
              ))}
            </>
          )}
        </View>

        {/* Motivational Section */}
        {completedToday.length > 0 && (
          <View style={styles.section}>
            <View style={styles.motivationCard}>
              <Ionicons name="trophy" size={32} color={Colors.accent1} />
              <Text style={styles.motivationTitle}>Great job today! 🎉</Text>
              <Text style={styles.motivationText}>
                You've completed {completedToday.length} habit{completedToday.length !== 1 ? 's' : ''}. 
                Keep up the momentum!
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {habits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity onPress={navigateToCreateHabit} style={styles.quickAction}>
                <Ionicons name="add-circle" size={24} color={Colors.accent1} />
                <Text style={styles.quickActionText}>Add Habit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={navigateToHabits} style={styles.quickAction}>
                <Ionicons name="list" size={24} color={Colors.accent2} />
                <Text style={styles.quickActionText}>View All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="analytics" size={24} color={Colors.accent3} />
                <Text style={styles.quickActionText}>Progress</Text>
              </TouchableOpacity>
            </View>
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
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    color: Colors.accent2,
    fontWeight: Typography.fontWeight.medium,
  },
  addButton: {
    backgroundColor: Colors.accent1,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    backgroundColor: Colors.white,
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent1,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  seeAllText: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent1,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.lg,
  },
  createFirstButton: {
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  motivationCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent1,
  },
  motivationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  motivationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
