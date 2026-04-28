// AnalyticsScreen - Comprehensive habit analytics dashboard
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography } from '../constants/theme';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatsOverview, ProgressChart, InsightsCard, MilestoneCelebration, MotivationalSummary, StreakHero, WeeklyActivityDots } from '../components/analytics';
import { useMilestones } from '../hooks/useMilestones';
import { trackScreen, trackEvent, trackFeature } from '../services/enhancedAnalyticsService';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import FeedbackModal from '../components/feedback/FeedbackModal';

// Helper function to get performance color
const getPerformanceColor = (rate: number) => {
  if (rate >= 80) return '#B771E5';      // Purple - Excellent
  if (rate >= 60) return '#8B5BA8';      // Dark gray to purple - Good
  if (rate >= 40) return '#666666';      // Gray to dark gray - Fair
  return '#CCCCCC';                      // Light gray - Needs Focus
};

// Helper function to get performance label
const getPerformanceLabel = (rate: number) => {
  if (rate >= 80) return 'Excellent';
  if (rate >= 60) return 'Good';
  if (rate >= 40) return 'Fair';
  return 'Needs Focus';
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { habits, streaks } = useHabits();
  const {
    habitAnalytics,
    trendData,
    insights,
    isLoadingAnalytics,
    refreshAnalytics,
    refreshTrends,
    refreshInsights,
    selectedPeriod,
    setSelectedPeriod,
    getCurrentPeriodAnalytics,
    error
  } = useAnalytics();

  const {
    checkCompletionMilestone,
    checkStreakMilestone,
    currentMilestone,
    showCelebration,
    closeCelebration,
  } = useMilestones();

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const currentPeriodAnalytics = getCurrentPeriodAnalytics();

  // Handle milestone close — show feedback prompt for 7-day streak (one-time)
  const handleMilestoneClose = async () => {
    closeCelebration();

    if (currentMilestone?.type === 'streak' && currentMilestone?.value === 7) {
      const hasShownFeedback = await AsyncStorage.getItem('@goalfer_feedback_shown');
      if (!hasShownFeedback) {
        await AsyncStorage.setItem('@goalfer_feedback_shown', 'true');
        // Small delay so celebration dismisses first
        setTimeout(() => setShowFeedbackModal(true), 500);
      }
    }
  };

  // Compute streak data for hero card
  const currentStreak = habitAnalytics.length > 0
    ? Math.max(...habitAnalytics.map(h => h.currentStreak), 0)
    : 0;
  const longestStreak = habitAnalytics.length > 0
    ? Math.max(...habitAnalytics.map(h => h.longestStreak), 0)
    : 0;

  // Check for milestones when analytics load
  useEffect(() => {
    if (currentPeriodAnalytics && !isLoadingAnalytics) {
      // Check completion milestones
      checkCompletionMilestone(currentPeriodAnalytics.totalCompletions);
      
      // Check streak milestones (use longest streak from habit analytics)
      const longestStreak = habitAnalytics.length > 0 
        ? Math.max(...habitAnalytics.map(h => h.currentStreak))
        : 0;
      if (longestStreak > 0) {
        checkStreakMilestone(longestStreak);
      }
    }
  }, [currentPeriodAnalytics?.totalCompletions, habitAnalytics, isLoadingAnalytics]);

  // Track screen view and analytics usage
  useEffect(() => {
    trackScreen('Analytics', { source: 'AnalyticsScreen' });
    trackFeature('analytics', 'analytics_screen_viewed', 1);
    
    trackEvent('analytics_screen_viewed', {
      selected_period: selectedPeriod,
      total_habits: habitAnalytics.length,
      has_insights: insights.length > 0,
      user_id: user?.id
    });
  }, [selectedPeriod, habitAnalytics.length, insights.length, user?.id]);

  const handleRefresh = async () => {
    trackEvent('analytics_refresh', {
      selected_period: selectedPeriod,
      user_id: user?.id
    });
    
    await Promise.all([
      refreshAnalytics(),
      refreshTrends(),
      refreshInsights()
    ]);
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    trackEvent('analytics_period_changed', {
      previous_period: selectedPeriod,
      new_period: period,
      user_id: user?.id
    });
    
    setSelectedPeriod(period);
  };

  const renderHabitAnalytics = () => {
    if (habitAnalytics.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.gray.medium} />
          <Text style={styles.emptyTitle}>No Analytics Yet</Text>
          <Text style={styles.emptyText}>
            {isLoadingAnalytics 
              ? 'Loading your habit analytics...' 
              : 'Create and complete some habits to see your detailed analytics and insights!'
            }
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoadingAnalytics}
          >
            <Ionicons 
              name="refresh" 
              size={16} 
              color={Colors.white} 
              style={{ marginRight: 8 }}
            />
            <Text style={styles.refreshButtonText}>
              {isLoadingAnalytics ? 'Loading...' : 'Refresh Analytics'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Performance</Text>
        {habitAnalytics.slice(0, 5).map((habit) => (
          <View key={habit.habitId} style={[
            styles.habitAnalyticsCard,
            habit.completionRate >= 80 && styles.habitAnalyticsCardHighlight
          ]}>
            <View style={styles.habitHeader}>
              <Text style={styles.habitName}>{habit.habitName}</Text>
              <View style={styles.habitCategory}>
                <Text style={styles.habitCategoryText}>
                  {habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}
                </Text>
              </View>
              {habit.completionRate >= 80 && (
                <View style={{ marginLeft: 8 }}>
                  <Ionicons name="star" size={16} color="#FFDE59" />
                </View>
              )}
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${habit.completionRate}%`,
                      backgroundColor: getPerformanceColor(habit.completionRate)
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.performanceLabel, { color: getPerformanceColor(habit.completionRate) }]}>
                {getPerformanceLabel(habit.completionRate)}
              </Text>
            </View>

            <View style={styles.habitStats}>
              <View style={styles.habitStat}>
                <Text style={styles.habitStatValue}>{habit.totalCompletions}</Text>
                <Text style={styles.habitStatLabel}>Completions</Text>
              </View>
              
              <View style={styles.habitStat}>
                <Text style={[styles.habitStatValue, { color: getPerformanceColor(habit.completionRate) }]}>
                  {habit.completionRate.toFixed(0)}%
                </Text>
                <Text style={styles.habitStatLabel}>Success Rate</Text>
              </View>
              
              <View style={styles.habitStat}>
                <Text style={[styles.habitStatValue, { color: Colors.accent1 }]}>
                  {habit.currentStreak}
                </Text>
                <Text style={styles.habitStatLabel}>Current Streak</Text>
              </View>
            </View>
            
            {habit.longestStreak > habit.currentStreak && (
              <View style={styles.habitFooter}>
                <Ionicons name="trophy" size={14} color="#FFDE59" />
                <Text style={styles.habitFooterText}>
                  Best streak: {habit.longestStreak} days
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {habitAnalytics.length > 5 && (
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>View All Habits</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.accent1} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView
      style={styles.container}
      refreshControl={
          <RefreshControl
            refreshing={isLoadingAnalytics}
            onRefresh={handleRefresh}
            colors={[Colors.accent1]}
            tintColor={Colors.accent1}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Motivational Summary */}
        <MotivationalSummary
          completionRate={currentPeriodAnalytics?.completionRate || 0}
          totalCompletions={currentPeriodAnalytics?.totalCompletions || 0}
          currentStreak={currentStreak}
          userName={user?.displayName}
        />

        {/* Streak Hero */}
        <StreakHero
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          completionRate={currentPeriodAnalytics?.completionRate || 0}
        />

        {/* Weekly Activity Dots */}
        <WeeklyActivityDots
          data={trendData}
          totalHabits={habits.length}
        />

        {/* Stats Overview */}
        {currentPeriodAnalytics && (
          <StatsOverview
            analytics={currentPeriodAnalytics}
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        )}

        {/* Progress Chart */}
        <ProgressChart
          data={trendData}
          title="7-Day Completion Trend"
        />

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Insights</Text>
            {insights.map((insight, index) => (
              <InsightsCard
                key={index}
                insight={insight}
                onPress={() => {
                  // Could navigate to specific habit details
                }}
              />
            ))}
          </View>
        )}

        {/* Habit Analytics */}
        {renderHabitAnalytics()}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        visible={showCelebration}
        milestone={currentMilestone}
        onClose={handleMilestoneClose}
      />

      {/* Feedback Modal — triggered after 7-day streak or from profile */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userId={user?.id}
        userName={user?.displayName}
        source="milestone"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: -50,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,          // 8 * 3 (comfortable)
    paddingTop: 8,                  // 8 * 1 (tight)
    paddingBottom: 16,              // 8 * 2 (base)
  },
  title: {
    fontSize: 24,                   // heading
    fontWeight: '700',              // bold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  section: {
    marginVertical: 8,              // 8 * 1 (tight)
  },
  sectionTitle: {
    fontSize: 20,                   // subheading
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginHorizontal: 24,           // 8 * 3 (comfortable)
    marginBottom: 16,               // 8 * 2 (base)
  },
  habitAnalyticsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,               // 8 * 2
    padding: 16,                    // 8 * 2 (base)
    marginHorizontal: 16,           // 8 * 2 (base)
    marginVertical: 8,              // 8 * 1 (tight)
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  habitAnalyticsCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFDE59',     // Yellow accent for high performers
    backgroundColor: '#FFDE59' + '08', // Very subtle yellow tint
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,               // 8 * 2 (base)
  },
  habitName: {
    fontSize: 16,                   // body
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    flex: 1,
  },
  habitCategory: {
    backgroundColor: Colors.gray.light,
    paddingHorizontal: 12,          // 8 * 1.5
    paddingVertical: 4,             // 8 * 0.5
    borderRadius: 12,               // 8 * 1.5
  },
  habitCategoryText: {
    fontSize: 12,                   // small (OK for category badge)
    color: Colors.primaryText,      // Darker for better contrast
    fontWeight: '500',              // medium
    fontFamily: Typography.fontFamily.medium,
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitStat: {
    alignItems: 'center',
    flex: 1,
  },
  habitStatValue: {
    fontSize: 20,                   // subheading
    fontWeight: '700',              // bold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  habitStatLabel: {
    fontSize: 14,                   // caption (proper for labels)
    color: Colors.gray.dark,        // Darker for better readability
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,                   // 8 * 0.5
  },
  habitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,                  // 8 * 1.5
    paddingTop: 12,                 // 8 * 1.5
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  habitFooterText: {
    fontSize: 14,                   // caption (proper for labels)
    color: Colors.gray.dark,        // Darker for better readability
    fontFamily: Typography.fontFamily.regular,
    marginLeft: 4,                  // 8 * 0.5
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,            // 8 * 2 (base)
    marginHorizontal: 16,           // 8 * 2 (base)
    minHeight: 48,                  // 8 * 6 (touch target)
  },
  viewMoreText: {
    fontSize: 16,                   // body
    fontWeight: '500',              // medium
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.medium,
    marginRight: 8,                 // 8 * 1 (tight)
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,            // 8 * 6 (spacious)
    paddingHorizontal: 24,          // 8 * 3 (comfortable)
  },
  emptyTitle: {
    fontSize: 20,                   // subheading
    fontWeight: '600',              // semibold
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginTop: 16,                  // 8 * 2 (base)
    marginBottom: 8,                // 8 * 1 (tight)
  },
  emptyText: {
    fontSize: 16,                   // body
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,                 // 1.5 line height
    marginBottom: 24,               // 8 * 3 (comfortable)
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent1,
    paddingHorizontal: 24,          // 8 * 3 (comfortable)
    paddingVertical: 16,            // 8 * 2 (base)
    borderRadius: 32,               // Pill-shaped (modern)
    minHeight: 56,                  // 8 * 7 (touch target)
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,                   // body
    fontWeight: '500',              // medium
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,                    // 8 * 3 (comfortable)
    margin: 16,                     // 8 * 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,               // 8 * 2
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: 16,                   // body
    color: Colors.error,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginVertical: 12,             // 8 * 1.5
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 24,          // 8 * 3 (comfortable)
    paddingVertical: 12,            // 8 * 1.5
    borderRadius: 32,               // Pill-shaped
    minHeight: 48,                  // 8 * 6 (touch target)
  },
  retryButtonText: {
    fontSize: 14,                   // caption
    fontWeight: '600',              // semibold
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  bottomSpacing: {
    height: 32,                     // 8 * 4 (loose)
  },

  // Progress Bar Styles
  progressBarContainer: {
    marginBottom: 16,               // 8 * 2 (base)
  },
  progressBarBackground: {
    height: 8,                      // 8 * 1
    backgroundColor: Colors.gray.light,
    borderRadius: 4,                // 8 * 0.5
    overflow: 'hidden',
    marginBottom: 8,                // 8 * 1 (tight)
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,                // 8 * 0.5
  },
  performanceLabel: {
    fontSize: 14,                   // caption
    fontWeight: '600',              // semibold
    textAlign: 'right',
  },
});
