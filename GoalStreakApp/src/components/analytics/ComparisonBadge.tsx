// ComparisonBadge Component - Shows comparison to previous period
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';

interface ComparisonBadgeProps {
  currentValue: number;
  previousValue: number;
  format?: 'number' | 'percentage';
  size?: 'small' | 'medium';
}

export default function ComparisonBadge({
  currentValue,
  previousValue,
  format = 'number',
  size = 'small',
}: ComparisonBadgeProps) {
  // Calculate difference
  const difference = currentValue - previousValue;
  const percentChange =
    previousValue > 0 ? (difference / previousValue) * 100 : currentValue > 0 ? 100 : 0;

  // Determine trend
  const isUp = difference > 0;
  const isDown = difference < 0;
  const isSame = difference === 0;

  // Get display values
  const getIcon = () => {
    if (isUp) return 'trending-up';
    if (isDown) return 'trending-down';
    return 'remove';
  };

  const getColor = () => {
    if (isUp) return Colors.accent3;
    if (isDown) return Colors.error;
    return Colors.gray.medium;
  };

  const getText = () => {
    if (isSame) return 'Same as last period';

    const absChange = Math.abs(percentChange);
    const formattedChange =
      absChange >= 100 ? `${Math.round(absChange)}%` : `${absChange.toFixed(1)}%`;

    if (isUp) return `${formattedChange} better`;
    return `${formattedChange} lower`;
  };

  // Don't show if no previous data
  if (previousValue === 0 && currentValue === 0) {
    return null;
  }

  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? Typography.fontSize.xs : Typography.fontSize.sm;

  return (
    <View style={[styles.container, { backgroundColor: getColor() + '15' }]}>
      <Ionicons name={getIcon() as any} size={iconSize} color={getColor()} style={styles.icon} />
      <Text style={[styles.text, { color: getColor(), fontSize }]}>{getText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.semibold,
  },
});
