// StatsOverview Component - Key metrics overview
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { PeriodAnalytics } from '../../services/analyticsService';
import ComparisonBadge from './ComparisonBadge';

interface StatsOverviewProps {
  analytics: PeriodAnalytics;
  previousAnalytics?: PeriodAnalytics;
  selectedPeriod: 'week' | 'month' | 'year';
  onPeriodChange: (period: 'week' | 'month' | 'year') => void;
}

export default function StatsOverview({ 
  analytics,
  previousAnalytics,
  selectedPeriod, 
  onPeriodChange 
}: StatsOverviewProps) {
  const getPeriodLabel = (period: 'week' | 'month' | 'year') => {
    switch (period) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  const renderPeriodButton = (period: 'week' | 'month' | 'year') => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.activePeriodButton
      ]}
      onPress={() => onPeriodChange(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.activePeriodButtonText
      ]}>
        {period.charAt(0).toUpperCase() + period.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderStatCard = (
    icon: string,
    value: string | number,
    label: string,
    color: string = Colors.accent1,
    currentNumeric?: number,
    previousNumeric?: number
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {previousAnalytics && currentNumeric !== undefined && previousNumeric !== undefined && (
        <ComparisonBadge
          currentValue={currentNumeric}
          previousValue={previousNumeric}
          size="small"
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>{getPeriodLabel(selectedPeriod)}</Text>
        <View style={styles.periodSelector}>
          {renderPeriodButton('week')}
          {renderPeriodButton('month')}
          {renderPeriodButton('year')}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'checkmark-circle',
          analytics.totalCompletions,
          'Completions',
          Colors.accent3,
          analytics.totalCompletions,
          previousAnalytics?.totalCompletions
        )}
        
        {renderStatCard(
          'trending-up',
          `${analytics.completionRate.toFixed(1)}%`,
          'Success Rate',
          Colors.accent1,
          analytics.completionRate,
          previousAnalytics?.completionRate
        )}
        
        {renderStatCard(
          'apps',
          analytics.uniqueHabitsCompleted,
          'Habits Active',
          Colors.primaryText,
          analytics.uniqueHabitsCompleted,
          previousAnalytics?.uniqueHabitsCompleted
        )}
        
        {renderStatCard(
          'calendar',
          analytics.mostActiveDay,
          'Best Day',
          Colors.accent3
        )}
      </View>

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.categoriesList}>
            {analytics.topCategories.slice(0, 3).map((category, index) => (
              <View key={category.category} style={styles.categoryItem}>
                <View style={styles.categoryRank}>
                  <Text style={styles.categoryRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.categoryName}>
                  {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                </Text>
                <Text style={styles.categoryCount}>{category.completions}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.gray.light,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: Colors.primaryText,
  },
  periodButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
  },
  activePeriodButtonText: {
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  categoriesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.sm,
  },
  categoriesList: {
    gap: Spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  categoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  categoryRankText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  categoryName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.medium,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent1,
    fontFamily: Typography.fontFamily.semibold,
  },
});
