// AnalyticsScreen - Comprehensive habit analytics dashboard
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatsOverview, ProgressChart, InsightsCard } from '../components/analytics';

export default function AnalyticsScreen() {
  const {
    habitAnalytics,
    trendData,
    insights,
    isLoadingAnalytics,
    isLoadingTrends,
    isLoadingInsights,
    refreshAnalytics,
    refreshTrends,
    refreshInsights,
    selectedPeriod,
    setSelectedPeriod,
    getCurrentPeriodAnalytics,
    error
  } = useAnalytics();

  const currentPeriodAnalytics = getCurrentPeriodAnalytics();

  const handleRefresh = async () => {
    await Promise.all([
      refreshAnalytics(),
      refreshTrends(),
      refreshInsights()
    ]);
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
          <View key={habit.habitId} style={styles.habitAnalyticsCard}>
            <View style={styles.habitHeader}>
              <Text style={styles.habitName}>{habit.habitName}</Text>
              <View style={styles.habitCategory}>
                <Text style={styles.habitCategoryText}>
                  {habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.habitStats}>
              <View style={styles.habitStat}>
                <Text style={styles.habitStatValue}>{habit.totalCompletions}</Text>
                <Text style={styles.habitStatLabel}>Completions</Text>
              </View>
              
              <View style={styles.habitStat}>
                <Text style={[styles.habitStatValue, { color: Colors.accent3 }]}>
                  {habit.completionRate.toFixed(1)}%
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
                <Ionicons name="trophy-outline" size={14} color={Colors.gray.medium} />
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
        {/* Stats Overview */}
        {currentPeriodAnalytics && (
          <StatsOverview
            analytics={currentPeriodAnalytics}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  section: {
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  habitAnalyticsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  habitName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    flex: 1,
  },
  habitCategory: {
    backgroundColor: Colors.gray.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  habitCategoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.dark,
    fontWeight: Typography.fontWeight.medium,
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
  },
  habitStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  habitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  habitFooterText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
    marginLeft: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  viewMoreText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.medium,
    marginRight: Spacing.xs,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.4,
    marginBottom: Spacing.lg,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    margin: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
