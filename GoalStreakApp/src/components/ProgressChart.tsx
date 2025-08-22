// ProgressChart Component - Beautiful habit completion trend visualization
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing } from '../constants/theme';
import { TrendData } from '../services/analyticsService';

interface ProgressChartProps {
  data: TrendData[];
  title?: string;
  height?: number;
}

export default function ProgressChart({ 
  data, 
  title = 'Completion Trends',
  height = 220 
}: ProgressChartProps) {
  const screenWidth = Dimensions.get('window').width;
  
  // Prepare chart data
  const chartData = {
    labels: data.slice(-7).map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        data: data.slice(-7).map(item => item.completions),
        color: (opacity = 1) => Colors.accent1 + Math.round(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 3,
      }
    ]
  };

  const chartConfig = {
    backgroundColor: Colors.white,
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => Colors.primaryText + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => Colors.gray.dark + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.accent1,
      fill: Colors.white,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: Colors.gray.light,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
      fontFamily: Typography.fontFamily.medium,
    },
  };

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Complete some habits to see your progress!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - Spacing.lg * 2}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          fromZero={true}
        />
      </View>

      {/* Chart Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.round(data.slice(-7).reduce((sum, item) => sum + item.completions, 0) / 7 * 10) / 10}
          </Text>
          <Text style={styles.summaryLabel}>Daily Avg</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.max(...data.slice(-7).map(item => item.completions))}
          </Text>
          <Text style={styles.summaryLabel}>Best Day</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.slice(-7).reduce((sum, item) => sum + item.completions, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray.light,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.medium,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.bold,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
});
