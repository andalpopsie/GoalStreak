// CompactStatsChart — Period tabs + big number + inline chart in one card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Typography } from '../../constants/theme';
import { TrendData } from '../../services/analyticsService';
import { PeriodAnalytics } from '../../services/analyticsService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CompactStatsChartProps {
  analytics: PeriodAnalytics | null;
  trendData: TrendData[];
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export default function CompactStatsChart({
  analytics,
  trendData,
  selectedPeriod,
  onPeriodChange,
}: CompactStatsChartProps) {
  const last7 = trendData.slice(-7);

  const chartData = {
    labels: last7.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
    }),
    datasets: [{
      data: last7.length > 0 ? last7.map(item => item.completions) : [0],
      color: () => Colors.accent1,
      strokeWidth: 2,
    }],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: () => Colors.gray.light,
    labelColor: () => Colors.secondaryText,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.accent1,
      fill: Colors.white,
    },
    propsForBackgroundLines: {
      stroke: Colors.gray.light,
      strokeWidth: 0.5,
    },
  };

  return (
    <View style={styles.container}>
      {/* Period Tabs */}
      <View style={styles.periodRow}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodTab, selectedPeriod === period && styles.periodTabActive]}
            onPress={() => onPeriodChange(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Numbers */}
      <View style={styles.numbersRow}>
        <View style={styles.numberBlock}>
          <Text style={styles.bigNumber}>{analytics?.totalCompletions || 0}</Text>
          <Text style={styles.numberLabel}>Completions</Text>
        </View>
        <View style={styles.numberBlock}>
          <Text style={[styles.bigNumber, { color: Colors.accent3 }]}>
            {analytics?.uniqueHabitsCompleted || 0}
          </Text>
          <Text style={styles.numberLabel}>Active Habits</Text>
        </View>
      </View>

      {/* Inline Chart */}
      {last7.length > 0 && (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 64}
            height={120}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            withDots={true}
            withShadow={false}
            fromZero
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,             // 8 × 2 (base)
    marginVertical: 8,                // 8 × 1 (tight)
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,                      // 8 × 2 (base)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  // Period tabs
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray.light,
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,                 // 8 × 2 (base)
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,              // 8 × 1 (tight)
    borderRadius: 6,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: Colors.primaryText,
  },
  periodText: {
    fontSize: 14,                    // caption
    fontWeight: '600',               // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.secondaryText,
  },
  periodTextActive: {
    color: Colors.white,
  },
  // Numbers
  numbersRow: {
    flexDirection: 'row',
    marginBottom: 12,                // 8 × 1.5
  },
  numberBlock: {
    flex: 1,
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: 28,                    // large
    fontWeight: '700',               // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  numberLabel: {
    fontSize: 12,                    // small
    color: Colors.secondaryText,
    fontWeight: '500',               // medium
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  // Chart
  chartWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -16,                 // offset chart padding
  },
});
