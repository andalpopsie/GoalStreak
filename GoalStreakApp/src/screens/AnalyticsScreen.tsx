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
import { StatsOverview, ProgressChart, InsightsCard, MilestoneCelebration, MotivationalSummary, StreakHero, WeeklyActivityDots, AnalyticsHero, CompactStatsChart } from '../components/analytics';
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
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

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
              : 'Complete some habits to see your analytics!'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Performance</Text>
        {habitAnalytics.slice(0, 5).map((habit) => {
          const isExpanded = expandedHabitId === habit.habitId;
          return (
            <TouchableOpacity
              key={habit.habitId}
              style={styles.habitRow}
              onPress={() => setExpandedHabitId(isExpanded ? null : habit.habitId)}
              activeOpacity={0.7}
            >
              {/* Compact Row — always visible */}
              <View style={styles.habitRowHeader}>
                <View style={styles.habitRowLeft}>
                  <Text style={styles.habitRowName} numberOfLines={1}>{habit.habitName}</Text>
                  <View style={styles.habitRowBar}>
                    <View style={[
                      styles.habitRowBarFill,
                      { width: `${habit.completionRate}%`, backgroundColor: getPerformanceColor(habit.completionRate) }
                    ]} />
                  </View>
                </View>
                <View style={styles.habitRowRight}>
                  <Text style={[styles.habitRowRate, { color: getPerformanceColor(habit.completionRate) }]}>
                    {habit.completionRate.toFixed(0)}%
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.gray.medium}
                  />
                </View>
              </View>

              {/* Expanded Details */}
              {isExpanded && (
                <View style={styles.habitRowExpanded}>
                  <View style={styles.habitRowStats}>
                    <View style={styles.habitRowStat}>
                      <Text style={styles.habitRowStatValue}>{habit.totalCompletions}</Text>
                      <Text style={styles.habitRowStatLabel}>Completions</Text>
                    </View>
                    <View style={styles.habitRowStat}>
                      <Text style={[styles.habitRowStatValue, { color: Colors.accent1 }]}>{habit.currentStreak}</Text>
                      <Text style={styles.habitRowStatLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.habitRowStat}>
                      <Text style={styles.habitRowStatValue}>{habit.longestStreak}</Text>
                      <Text style={styles.habitRowStatLabel}>Best Streak</Text>
                    </View>
                  </View>
                  <Text style={[styles.habitRowPerformance, { color: getPerformanceColor(habit.completionRate) }]}>
                    {getPerformanceLabel(habit.completionRate)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
        {/* 1. Hero Card — greeting + streak + rate */}
        <AnalyticsHero
          userName={user?.displayName}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          completionRate={currentPeriodAnalytics?.completionRate || 0}
          totalCompletions={currentPeriodAnalytics?.totalCompletions || 0}
        />

        {/* 2. Weekly Activity Dots */}
        <WeeklyActivityDots
          data={trendData}
          totalHabits={habits.length}
        />

        {/* 3. Combined Stats + Chart */}
        <CompactStatsChart
          analytics={currentPeriodAnalytics}
          trendData={trendData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />

        {/* 4. Top 2 Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.slice(0, 2).map((insight, index) => (
              <InsightsCard key={index} insight={insight} />
            ))}
          </View>
        )}

        {/* 5. Habit Performance — Expandable */}
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
    fontSize: 18,                   // large body
    fontWeight: '600',              // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    marginHorizontal: 16,           // 8 * 2 (base)
    marginBottom: 12,               // 8 * 1.5
  },
  // ── Expandable Habit Rows ──
  habitRow: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,           // 8 * 2 (base)
    marginBottom: 8,                // 8 * 1 (tight)
    padding: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  habitRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitRowLeft: {
    flex: 1,
    marginRight: 12,               // 8 * 1.5
  },
  habitRowName: {
    fontSize: 15,                   // body-ish
    fontWeight: '600',              // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    marginBottom: 6,
  },
  habitRowBar: {
    height: 6,
    backgroundColor: Colors.gray.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  habitRowBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  habitRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  habitRowRate: {
    fontSize: 16,                   // body
    fontWeight: '700',              // bold
    fontFamily: Typography.fontFamily.bold,
  },
  habitRowExpanded: {
    marginTop: 12,                  // 8 * 1.5
    paddingTop: 12,                 // 8 * 1.5
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  habitRowStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,                // 8 * 1 (tight)
  },
  habitRowStat: {
    alignItems: 'center',
  },
  habitRowStatValue: {
    fontSize: 18,                   // large body
    fontWeight: '700',              // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  habitRowStatLabel: {
    fontSize: 11,                   // small
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  habitRowPerformance: {
    fontSize: 13,                   // small
    fontWeight: '600',              // semibold
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
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
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: 24,                 // 1.5 line height
    marginBottom: 24,               // 8 * 3 (comfortable)
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
});
