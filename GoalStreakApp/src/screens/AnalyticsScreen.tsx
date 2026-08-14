// AnalyticsScreen - Comprehensive habit analytics dashboard
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, getCategoryColor, getCategoryBackgroundColor } from '../constants/theme';
import { useAnalytics } from '../hooks/useAnalytics';
import { InsightsCard, MilestoneCelebration } from '../components/analytics';

// Category icons for the breakdown grid (falls back to a generic icon).
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  fitness: 'barbell',
  wellness: 'heart',
  nutrition: 'nutrition',
  social: 'people',
  productivity: 'briefcase',
  other: 'ellipsis-horizontal',
};

// Range options for the overview toggle. 'today'/'week'/'month' are computed
// from the existing 30-day daily trend (no new data-layer work).
type Range = 'today' | 'week' | 'month';
import { useMilestones } from '../hooks/useMilestones';
import { trackScreen, trackEvent, trackFeature } from '../services/enhancedAnalyticsService';
import { useAuth } from '../hooks/useAuth';
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
  // Overview range (Today / Week / Month) for the redesigned hero.
  const [range, setRange] = useState<Range>('today');

  // Keep the service period in sync so the category breakdown reflects the
  // selected range (Today has no per-day category data, so it uses week).
  useEffect(() => {
    setSelectedPeriod(range === 'month' ? 'month' : 'week');
  }, [range]);

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

  // ── Overview computations (from the existing 30-day daily trend) ──
  // Completion rate over a window = completed / scheduled habit-instances.
  const windowRate = (slice: typeof trendData): number => {
    const scheduled = slice.reduce((s, d) => s + (d.habits || 0), 0);
    const completed = slice.reduce((s, d) => s + (d.completions || 0), 0);
    return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
  };
  // Window ending `offsetDays` from the most recent day, `n` days long.
  const window = (n: number, offsetDays = 0): typeof trendData => {
    const end = trendData.length - offsetDays;
    return trendData.slice(Math.max(0, end - n), Math.max(0, end));
  };

  const todayRate = windowRate(window(1, 0));
  const yesterdayRate = windowRate(window(1, 1));
  const weekRate = windowRate(window(7, 0));
  const prevWeekRate = windowRate(window(7, 7));
  const monthRate = windowRate(window(30, 0));

  const rangeMeta = {
    today: { label: 'Completion today', rate: todayRate, delta: todayRate - yesterdayRate, compare: 'vs yesterday' },
    week: { label: 'This week', rate: weekRate, delta: weekRate - prevWeekRate, compare: 'vs last week' },
    month: { label: 'This month', rate: monthRate, delta: null as number | null, compare: '' },
  }[range];

  // The chart always shows the last 7 days of completions (matches the mockup's
  // weekly curve regardless of the selected range).
  const last7 = trendData.slice(-7);
  const chartLabels = last7.map((d) => {
    try {
      return new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' });
    } catch {
      return '';
    }
  });
  const chartValues = last7.map((d) => d.completions || 0);
  const hasChart = last7.length >= 2;
  const screenWidth = Dimensions.get('window').width;

  // Category breakdown (top 4) — period-accurate for Week/Month; hidden on Today
  // since per-day category data isn't available without extra aggregation.
  const categories =
    range !== 'today' ? (currentPeriodAnalytics?.topCategories || []).slice(0, 4) : [];

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
        {/* 1. Range toggle: Today / Week / Month */}
        <View style={styles.segment}>
          {(['today', 'week', 'month'] as Range[]).map((r) => {
            const active = range === r;
            const label = r === 'today' ? 'Today' : r === 'week' ? 'Week' : 'Month';
            return (
              <TouchableOpacity
                key={r}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setRange(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                testID={`analytics-range-${r}`}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Overview card: gradient hero with headline % + delta + 7-day trend */}
        <LinearGradient
          colors={[Colors.accent2, Colors.accent1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overviewCard}
        >
          <Text style={styles.overviewLabel}>{rangeMeta.label}</Text>
          <View style={styles.headlineRow}>
            <Text style={styles.headlineValue}>{rangeMeta.rate}%</Text>
            {rangeMeta.delta !== null && (
              <>
                <View style={styles.deltaPill}>
                  <Ionicons
                    name={rangeMeta.delta >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={rangeMeta.delta >= 0 ? Colors.accent3 : Colors.error}
                  />
                  <Text
                    style={[
                      styles.deltaText,
                      { color: rangeMeta.delta >= 0 ? Colors.accent3 : Colors.error },
                    ]}
                  >
                    {Math.abs(rangeMeta.delta)}%
                  </Text>
                </View>
                <Text style={styles.compareText}>{rangeMeta.compare}</Text>
              </>
            )}
          </View>

          {hasChart && (
            <LineChart
              data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
              width={screenWidth - 64}
              height={180}
              bezier
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLabels
              fromZero
              transparent
              chartConfig={{
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                fillShadowGradient: Colors.white,
                fillShadowGradientOpacity: 0.25,
                propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.white, fill: Colors.accent1 },
                propsForBackgroundLines: { stroke: 'transparent' },
              }}
              style={styles.chart}
            />
          )}
        </LinearGradient>

        {/* 3. Category breakdown grid (Week / Month) */}
        {categories.length > 0 && (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const color = getCategoryColor(cat.category);
              const bg = getCategoryBackgroundColor(cat.category);
              const icon = CATEGORY_ICONS[cat.category?.toLowerCase?.()] || 'ellipsis-horizontal';
              return (
                <View key={cat.category} style={[styles.categoryCard, { backgroundColor: bg }]}>
                  <View style={[styles.categoryIconChip, { backgroundColor: color }]}>
                    <Ionicons name={icon} size={18} color={Colors.white} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.category}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {cat.completions} {cat.completions === 1 ? 'completion' : 'completions'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
  // ── Range segmented control ──
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.gray.light,
    borderRadius: 16,               // 8 × 2
    padding: 4,
    marginHorizontal: 16,           // 8 × 2 (base)
    marginTop: 16,                  // 8 × 2 (base)
    marginBottom: 16,               // 8 × 2 (base)
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,            // comfortable tap within 44px
    borderRadius: 12,               // 8 × 1.5
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,                  // 8 × 5 (touch target)
  },
  segmentItemActive: {
    backgroundColor: Colors.accent1,
  },
  segmentLabel: {
    fontSize: 14,                   // caption
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.medium,
  },
  segmentLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  // ── Overview card ──
  overviewCard: {
    marginHorizontal: 16,           // 8 × 2 (base)
    marginBottom: 16,               // 8 × 2 (base)
    padding: 16,                    // 8 × 2 (base)
    backgroundColor: Colors.white,
    borderRadius: 16,               // 8 × 2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewLabel: {
    fontSize: 16,                   // body
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 4,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                         // 8 × 1 (tight)
    marginBottom: 8,                // 8 × 1 (tight)
  },
  headlineValue: {
    fontSize: 24,                   // heading (display metric)
    fontWeight: '800',              // extra bold
    color: Colors.white,
    fontFamily: Typography.fontFamily.heavy,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,           // 8 × 1 (tight)
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.white,  // white chip pops on the gradient
  },
  deltaText: {
    fontSize: 12,                   // small
    fontFamily: Typography.fontFamily.semibold,
  },
  compareText: {
    fontSize: 12,                   // small
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Typography.fontFamily.regular,
  },
  chart: {
    marginTop: 8,                   // 8 × 1 (tight)
    marginLeft: -8,                 // pull chart-kit's internal left pad
    borderRadius: 12,
  },
  // ── Category grid (2×2) ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,          // 8 × 2 (base)
    gap: 8,                         // 8 × 1 (tight)
    marginBottom: 16,               // 8 × 2 (base)
  },
  categoryCard: {
    width: '48.5%',                 // two per row with the 8px gap
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,               // 8 × 2
    padding: 12,                    // 8 × 1.5
    // backgroundColor set inline per-category (lightened category tint)
  },
  categoryIconChip: {
    width: 36,                      // 8 × 4.5
    height: 36,                     // 8 × 4.5
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,                 // 8 × 1 (tight)
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,                   // caption
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  categoryCount: {
    fontSize: 12,                   // small
    color: Colors.secondaryText,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  section: {
    marginVertical: 8,              // 8 * 1 (tight)
  },
  sectionTitle: {
    fontSize: 20,                   // subheading
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
    fontSize: 16,                   // body
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
    fontSize: 16,                   // body
    fontWeight: '700',              // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  habitRowStatLabel: {
    fontSize: 12,                   // small
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  habitRowPerformance: {
    fontSize: 14,                   // caption
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
