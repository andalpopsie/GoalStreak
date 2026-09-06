// MotivationalMessage Component - Dynamic encouraging messages
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface MotivationalMessageProps {
  completionRate: number;
  currentStreak: number;
  totalCompletions: number;
  isImproving: boolean;
}

export default function MotivationalMessage({
  completionRate,
  currentStreak,
  totalCompletions,
  isImproving,
}: MotivationalMessageProps) {
  const message = useMemo(() => {
    // Streak-based messages (highest priority)
    if (currentStreak >= 100) {
      return {
        emoji: '🏆',
        text: "Legendary! 100+ day streak - you're unstoppable!",
        color: Colors.accent1,
        icon: 'trophy' as const,
      };
    }
    if (currentStreak >= 30) {
      return {
        emoji: '🔥',
        text: `Amazing! ${currentStreak}-day streak - keep the fire burning!`,
        color: Colors.accent1,
        icon: 'flame' as const,
      };
    }
    if (currentStreak >= 7) {
      return {
        emoji: '⭐',
        text: `Great job! ${currentStreak}-day streak - you\'re building momentum!`,
        color: Colors.accent1,
        icon: 'star' as const,
      };
    }
    if (currentStreak >= 3) {
      return {
        emoji: '💪',
        text: `Nice! ${currentStreak} days in a row - consistency is key!`,
        color: Colors.accent3,
        icon: 'fitness' as const,
      };
    }

    // Completion rate messages
    if (completionRate >= 90) {
      return {
        emoji: '🎯',
        text: `Outstanding! ${completionRate.toFixed(0)}% completion rate - you\'re crushing it!`,
        color: Colors.accent3,
        icon: 'checkmark-circle' as const,
      };
    }
    if (completionRate >= 75) {
      return {
        emoji: '💚',
        text: `Excellent work! ${completionRate.toFixed(0)}% completion rate - stay strong!`,
        color: Colors.accent3,
        icon: 'heart' as const,
      };
    }
    if (completionRate >= 50) {
      return {
        emoji: '👍',
        text: `Good progress! ${completionRate.toFixed(0)}% completion rate - keep going!`,
        color: Colors.primaryText,
        icon: 'thumbs-up' as const,
      };
    }

    // Improvement messages
    if (isImproving) {
      return {
        emoji: '📈',
        text: "You're improving! Keep up the great work!",
        color: Colors.accent3,
        icon: 'trending-up' as const,
      };
    }

    // Total completions milestones
    if (totalCompletions >= 100) {
      return {
        emoji: '🎉',
        text: `${totalCompletions} completions! You\'re a habit master!`,
        color: Colors.accent1,
        icon: 'trophy' as const,
      };
    }
    if (totalCompletions >= 50) {
      return {
        emoji: '🌟',
        text: `${totalCompletions} completions! Halfway to 100!`,
        color: Colors.accent1,
        icon: 'star' as const,
      };
    }
    if (totalCompletions >= 10) {
      return {
        emoji: '🚀',
        text: `${totalCompletions} completions! You\'re on your way!`,
        color: Colors.primaryText,
        icon: 'rocket' as const,
      };
    }

    // Encouraging message for beginners
    return {
      emoji: '🌱',
      text: "Every journey starts with a single step. You've got this!",
      color: Colors.accent3,
      icon: 'leaf' as const,
    };
  }, [completionRate, currentStreak, totalCompletions, isImproving]);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(600)}
      style={[styles.container, { borderLeftColor: message.color }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: message.color + '20' }]}>
        <Ionicons name={message.icon} size={24} color={message.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>{message.emoji}</Text>
        <Text style={styles.message}>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderLeftWidth: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.regular,
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.fontSize.md * 1.4,
  },
});
