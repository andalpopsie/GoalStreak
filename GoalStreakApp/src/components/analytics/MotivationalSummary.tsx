// MotivationalSummary — Dynamic greeting card based on user performance
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface MotivationalSummaryProps {
  completionRate: number;
  totalCompletions: number;
  currentStreak: number;
  userName?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMessage(
  rate: number,
  streak: number,
  completions: number
): { text: string; emoji: string; color: string } {
  if (completions === 0) {
    return {
      text: 'Start your first habit today and watch your progress grow!',
      emoji: '🌱',
      color: Colors.accent3,
    };
  }
  if (rate >= 90) {
    return {
      text: `Incredible consistency! You're crushing it with a ${rate.toFixed(0)}% completion rate.`,
      emoji: '🔥',
      color: Colors.accent1,
    };
  }
  if (rate >= 70) {
    return {
      text: `Strong progress! ${rate.toFixed(0)}% completion rate — keep the momentum going.`,
      emoji: '💪',
      color: Colors.accent3,
    };
  }
  if (rate >= 50) {
    return {
      text: `You're building momentum at ${rate.toFixed(0)}%. Every completed habit counts!`,
      emoji: '📈',
      color: Colors.accent1,
    };
  }
  if (streak > 0) {
    return {
      text: `You have a ${streak}-day streak going. Don't break the chain!`,
      emoji: '⚡',
      color: Colors.accent1,
    };
  }
  return {
    text: 'Every journey starts with a single step. Complete a habit today!',
    emoji: '🎯',
    color: Colors.primaryText,
  };
}

export default function MotivationalSummary({
  completionRate,
  totalCompletions,
  currentStreak,
  userName,
}: MotivationalSummaryProps) {
  const greeting = getGreeting();
  const firstName = userName?.split(' ')[0] || 'there';
  const message = getMessage(completionRate, currentStreak, totalCompletions);

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500)}
      style={[styles.container, { borderLeftColor: message.color }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${greeting}, ${firstName}. ${message.text}`}
    >
      <Text style={styles.greeting}>
        {greeting}, {firstName} {message.emoji}
      </Text>
      <Text style={styles.message}>{message.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.base, // 16 (8 × 2)
    marginTop: Spacing.base, // 16 (8 × 2)
    marginBottom: Spacing.tight, // 8  (8 × 1)
    backgroundColor: Colors.white,
    borderRadius: 16, // 8 × 2
    padding: Spacing.base, // 16 (8 × 2)
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.subheading, // 20
    fontWeight: Typography.fontWeight.bold, // '700'
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.tight, // 8 (8 × 1)
  },
  message: {
    fontSize: Typography.fontSize.body, // 16
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal, // 24
  },
});
