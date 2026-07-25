import React, { useEffect, useState, useCallback } from 'react';
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
import { getHabitLimit } from '../constants/limits';
import { useAuth } from '../hooks/useAuth';
import { useHabitsWithSocial } from '../hooks/useHabitsWithSocial'; // Re-enabled social features with error handling
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSubscription } from '../hooks/useSubscription';
import { OfflineBanner } from '../components/common';
import ProPaywallModal from '../components/common/ProPaywallModal';
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
    uniqueDailyHabits,
    isLoading,
    isCompleting,
    completeHabit,
    uncompleteHabit,
    isHabitCompletedToday,
    getHabitStreak,
    refreshHabits,
    deleteHabit,
  } = useHabitsWithSocial();
  const networkStatus = useNetworkStatus();

  // Pro-tier-aware habit limit. The applicable cap is read from RevenueCat
  // via `useSubscription`; free users see 6, Pro users see 15. The pre-nav
  // alert was removed in favour of letting CreateHabitScreen open the
  // paywall when a free user submits a 7th habit (Req 3.6, 4.1).
  const { isPro, refresh: refreshProStatus } = useSubscription();
  const limit = getHabitLimit(isPro);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [completedHabitName, setCompletedHabitName] = useState('');
  const [completedHabitId, setCompletedHabitId] = useState('');
  const [completedHabitCategory, setCompletedHabitCategory] = useState('');
  const [completedHabitIsPublic, setCompletedHabitIsPublic] = useState(true);

  // Pro paywall — opened from the dashboard upgrade affordance shown to
  // free users who have hit the habit limit. After a successful purchase
  // RevenueCat flips `isPro`, the limit re-resolves to 15, and the
  // upgrade card is replaced by the standard "Add Habit" button.
  const [showPaywall, setShowPaywall] = useState(false);

  // Track screen view once on mount
  useEffect(() => {
    trackScreen('CleanHomeScreen', { source: 'app_navigation' });
  }, []);

  // Track user engagement when habit count changes
  useEffect(() => {
    if (habits.length > 0) {
      trackEvent('home_screen_viewed', {
        total_habits: habits.length,
        daily_habits: habits.filter(h => h.frequency === 'daily').length,
        user_id: user?.id,
      });
    }
  }, [habits.length, user?.id]);

  const completedToday = uniqueDailyHabits.filter(habit => isHabitCompletedToday(habit.id));

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
      current_habit_count: uniqueDailyHabits.length,
      user_id: user?.id
    });

    // The legacy pre-navigation alert was removed. Free users always reach
    // CreateHabitScreen, where the service-side check throws
    // `HabitLimitError` and the screen shows the Pro paywall instead
    // (Req 3.6, 4.1). Pro users get a terminal alert at 15 habits from
    // CreateHabitScreen, so no client-side gate is needed here.

    try {
      // Track successful navigation
      trackEvent('navigate_to_create_habit', {
        current_habit_count: uniqueDailyHabits.length,
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
        {uniqueDailyHabits.length > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              {completedToday.length} of {uniqueDailyHabits.length} daily habits completed today
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
        ) : uniqueDailyHabits.length === 0 ? (
          /* Show empty state when no habits */
          <View testID="empty-habits-state">
            <EmptyHabitsState onCreateHabit={navigateToCreateHabit} />
          </View>
        ) : (
          <Animated.View style={styles.habitsGrid} entering={FadeIn.duration(600)}>
            {/* Show all habits once, regardless of completion status */}
            {uniqueDailyHabits.map((habit, index) => (
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
            
            {/* Add Habit Button — only show if under the user's tier limit */}
            {uniqueDailyHabits.length < limit && (
              <Animated.View 
                entering={FadeInUp.delay(uniqueDailyHabits.length * 100).duration(500)}
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
            
            {/* Habit Limit Reached — copy + affordance reflect the user's tier.
                Free users see an upgrade card that opens the Pro paywall.
                Pro users see the original "All Set!" card (they're already
                at the top tier). */}
            {uniqueDailyHabits.length >= limit && !isPro && (
              <Animated.View
                entering={FadeInUp.delay(uniqueDailyHabits.length * 100).duration(500)}
                style={styles.habitCardContainer}
              >
                <TouchableOpacity
                  style={styles.upgradeCard}
                  onPress={() => {
                    trackEvent('pro_upgrade_card_tapped', {
                      source: 'home_dashboard',
                      habit_count: uniqueDailyHabits.length,
                      user_id: user?.id,
                    });
                    setShowPaywall(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Upgrade to Pro for more habits"
                  activeOpacity={0.85}
                >
                  <View style={styles.upgradeCircle}>
                    <Ionicons name="sparkles" size={48} color={Colors.accent1} />
                  </View>
                  <Text style={styles.upgradeText}>Want more?</Text>
                  <Text style={styles.upgradeSubtext}>From $1.99/mo</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {uniqueDailyHabits.length >= limit && isPro && (
              <Animated.View
                entering={FadeInUp.delay(uniqueDailyHabits.length * 100).duration(500)}
                style={styles.habitCardContainer}
              >
                <View style={styles.limitReachedCard}>
                  <View style={styles.limitReachedCircle}>
                    <Ionicons name="checkmark-done" size={60} color={Colors.accent1} />
                  </View>
                  <Text style={styles.limitReachedText}>All Set! 🎯</Text>
                  <Text style={styles.limitReachedSubtext}>Focus on your {limit} habits</Text>
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

      {/* Pro Paywall — opened from the dashboard upgrade card. */}
      <ProPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          // Re-read Pro status on this screen's own useSubscription instance
          // so the habit limit re-resolves to 15 and the upgrade card is
          // replaced immediately — without requiring an app restart.
          refreshProStatus();
          trackEvent('pro_upgraded', {
            source: 'home_dashboard',
            user_id: user?.id,
          });
        }}
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
  // ── Pro upgrade card ──
  // Mirrors the limitReachedCard layout (same aspectRatio + circle size +
  // typography rhythm) so the dashboard grid stays uniform whether the
  // user is free or Pro. Purple accent signals the upgrade pathway.
  upgradeCard: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.sm,
  },
  upgradeCircle: {
    width: 140,                          // matches limitReachedCircle
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    borderWidth: 12,
    borderColor: Colors.accent1,         // #B771E5 — Pro accent
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  upgradeSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent1,               // purple to reinforce the Pro framing
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
    marginTop: 2,
  },
});
