// InsightsCard Component - Personalized habit insights display
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { InsightData } from '../../services/analyticsService';

interface InsightsCardProps {
  insight: InsightData;
  onPress?: () => void;
}

export default function InsightsCard({ insight, onPress }: InsightsCardProps) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'achievement':
        return 'trophy';
      case 'streak':
        return 'flame';
      case 'consistency':
        return 'checkmark-circle';
      case 'improvement':
        return 'trending-up';
      default:
        return 'bulb';
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'achievement':
        return Colors.accent1;
      case 'streak':
        return Colors.accent1;
      case 'consistency':
        return Colors.accent3;
      case 'improvement':
        return Colors.accent3;
      default:
        return Colors.primaryText;
    }
  };

  const getTrendIcon = () => {
    if (!insight.trend) return null;
    
    switch (insight.trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (insight.trend) {
      case 'up':
        return Colors.accent3;
      case 'down':
        return Colors.error;
      case 'stable':
        return Colors.gray.medium;
      default:
        return Colors.gray.medium;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getInsightColor() + '20' }]}>
          <Ionicons 
            name={getInsightIcon() as any} 
            size={24} 
            color={getInsightColor()} 
          />
        </View>
        
        <View style={styles.headerText}>
          <Text style={styles.title}>{insight.title}</Text>
          {insight.value !== undefined && (
            <View style={styles.valueContainer}>
              <Text style={[styles.value, { color: getInsightColor() }]}>
                {insight.value}
              </Text>
              {insight.trend && (
                <Ionicons 
                  name={getTrendIcon() as any} 
                  size={16} 
                  color={getTrendColor()} 
                  style={styles.trendIcon}
                />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{insight.description}</Text>

      {/* Action Indicator */}
      {onPress && (
        <View style={styles.actionIndicator}>
          <Ionicons name="chevron-forward" size={16} color={Colors.gray.medium} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
  },
  trendIcon: {
    marginLeft: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * 1.4,
  },
  actionIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
});
